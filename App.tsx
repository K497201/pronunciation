
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getPronunciationFeedback, getSentencesForSubject } from './services/geminiService';
import { speechService } from './services/speechService';
import type { PronunciationFeedback, Session, PracticeCategories } from './types';
import { Header } from './components/Header';
import { RecordButton } from './components/RecordButton';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { SentenceDisplay } from './components/SentenceDisplay';
import { ProgressTracker } from './components/ProgressTracker';
import { GrammarChecker } from './components/GrammarChecker';
import { PRACTICE_CATEGORIES, FILLER_WORDS } from './constants';

type View = 'coach' | 'progress' | 'grammarly';
type Theme = 'light' | 'dark';

const getAudioDuration = (audioBlob: Blob): Promise<number> => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    return new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = (e) => reject(`Error loading audio metadata: ${e}`);
    });
};

const calculateWPM = (transcript: string, duration: number): number => {
    if (!transcript || duration === 0) return 0;
    const words = transcript.trim().split(/\s+/).length;
    const minutes = duration / 60;
    return Math.round(words / minutes);
};

const countFillerWords = (transcript: string): { word: string; count: number }[] => {
    if (!transcript) return [];
    const words = transcript.toLowerCase().replace(/[.,?!]/g, '').split(/\s+/);
    const fillerWordCount: Record<string, number> = {};

    words.forEach(word => {
        if (FILLER_WORDS.includes(word)) {
            fillerWordCount[word] = (fillerWordCount[word] || 0) + 1;
        }
    });

    return Object.entries(fillerWordCount).map(([word, count]) => ({ word, count }));
};

const App: React.FC = () => {
    // App state
    const [view, setView] = useState<View>('coach');
    const [theme, setTheme] = useState<Theme>('dark');
    const [history, setHistory] = useState<Session[]>([]);
    
    // Coach state
    const [userTranscript, setUserTranscript] = useState<string>('');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    const errorOccurred = useRef(false);

    // Practice mode state
    const [mode, setMode] = useState<'practice' | 'freestyle'>('practice');
    const [practiceCategories, setPracticeCategories] = useState<PracticeCategories>(PRACTICE_CATEGORIES);
    const [practiceCategory, setPracticeCategory] = useState<string>(Object.keys(PRACTICE_CATEGORIES)[0]);
    const [currentSentence, setCurrentSentence] = useState<string>('');
    const [customSubject, setCustomSubject] = useState('');
    const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);

    // --- Effects for Initialization and Persistence ---

    useEffect(() => {
        // Load theme from local storage or set based on system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        
        // Load history from local storage
        const savedHistory = localStorage.getItem('pronunciationHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const getNewSentence = useCallback(() => {
        const sentences = practiceCategories[practiceCategory] || [];
        if (sentences.length === 0) {
            setCurrentSentence("");
            return;
        }
        let newSentence = currentSentence;
        // Ensure we don't pick the same sentence twice in a row if possible
        if (sentences.length > 1) {
             while (newSentence === currentSentence) {
                newSentence = sentences[Math.floor(Math.random() * sentences.length)];
            }
        } else {
             newSentence = sentences[0];
        }
        setCurrentSentence(newSentence);
    }, [currentSentence, practiceCategory, practiceCategories]);

    useEffect(() => {
        if (mode === 'practice' && (!currentSentence || !practiceCategories[practiceCategory]?.includes(currentSentence))) {
            getNewSentence();
        }
    }, [mode, getNewSentence, currentSentence, practiceCategory, practiceCategories]);

    // --- Handlers ---
    
    const handleAnalysis = useCallback(async (transcript: string, audioBlob: Blob | null, confidence: number) => {
        if (!transcript.trim()) {
            setError("Your speech was not detected. Please try again.");
            setIsLoading(false);
            return;
        }
        setUserTranscript(transcript);
        setIsLoading(true);
        setError(null);
        setFeedback(null);

        try {
            let clientMetrics = { wordsPerMinute: 0, fillerWords: [] as { word: string; count: number }[] };
            if (audioBlob && transcript) {
                try {
                    const duration = await getAudioDuration(audioBlob);
                    clientMetrics = { 
                        wordsPerMinute: calculateWPM(transcript, duration), 
                        fillerWords: countFillerWords(transcript) 
                    };
                } catch (e) { console.error("Could not calculate audio metrics:", e); }
            }
            
            const aiFeedback = await getPronunciationFeedback(transcript, mode === 'practice' ? currentSentence : undefined);
            const fullFeedback: PronunciationFeedback = { ...aiFeedback, ...clientMetrics, transcriptionConfidence: confidence };
            setFeedback(fullFeedback);
            
            // Add to history
            const newSession: Session = {
                id: Date.now(),
                date: new Date().toISOString(),
                score: fullFeedback.overallScore,
                wpm: fullFeedback.wordsPerMinute,
                sentence: mode === 'practice' ? currentSentence : 'Freestyle',
                transcript: transcript,
            };
            setHistory(prev => {
                const updatedHistory = [newSession, ...prev];
                localStorage.setItem('pronunciationHistory', JSON.stringify(updatedHistory));
                return updatedHistory;
            });

        } catch (e) {
            console.error(e);
            setError("Sorry, I couldn't analyze your speech. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [mode, currentSentence]);

    const speechRecognitionService = useMemo(() => {
        return speechService({
            onResult: (transcript) => setUserTranscript(transcript),
            onError: (err) => {
                errorOccurred.current = true;
                setError(`Speech recognition error: ${err}`);
                setIsRecording(false);
                setIsLoading(false);
            },
            onEnd: ({ transcript: finalTranscript, audioBlob, confidence }) => {
                setIsRecording(false);
                if (audioBlob) setAudioURL(URL.createObjectURL(audioBlob));
                if (!errorOccurred.current) {
                    handleAnalysis(finalTranscript, audioBlob, confidence);
                }
            }
        });
    }, [handleAnalysis]);
    
    const handleReset = useCallback(() => {
        if (isRecording) speechRecognitionService.stop();
        setUserTranscript('');
        setAudioURL(null);
        setIsRecording(false);
        setIsLoading(false);
        setFeedback(null);
        setError(null);
        setMode('practice');
        // Reset custom categories to default and get a new sentence
        setPracticeCategories(PRACTICE_CATEGORIES);
        setPracticeCategory(Object.keys(PRACTICE_CATEGORIES)[0]);
        setCurrentSentence('');
        // Also reset the view to coach
        setView('coach');
    }, [isRecording, speechRecognitionService]);
    
    const handleToggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newTheme;
        });
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            speechRecognitionService.stop();
        } else {
            errorOccurred.current = false;
            setFeedback(null);
            setUserTranscript('');
            setError(null);
            setAudioURL(null); 
            try {
                await speechRecognitionService.start();
                setIsRecording(true);
            } catch (e: any) {
                setError(e.message);
            }
        }
    };
    
    const handleGenerateCustomSentences = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customSubject.trim() || isGeneratingSentences) return;

        setIsGeneratingSentences(true);
        setError(null);
        setCurrentSentence('');

        try {
            const sentences = await getSentencesForSubject(customSubject);
            setPracticeCategories(prev => ({ ...prev, "Custom Subject": sentences }));
            // Set the first sentence for the user
            setCurrentSentence(sentences[Math.floor(Math.random() * sentences.length)]);
        } catch (e: any) {
            setError(e.message || "Failed to generate sentences.");
        } finally {
            setIsGeneratingSentences(false);
        }
    };

    return (
        <div className="min-h-screen font-sans flex flex-col items-center p-4 md:p-8">
            <Header onReset={handleReset} theme={theme} onToggleTheme={handleToggleTheme} />
            <main className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 mt-8">

                 <div className="w-full flex justify-center border-b border-slate-300 dark:border-slate-700">
                    <button onClick={() => setView('coach')} className={`px-4 md:px-6 py-3 font-semibold transition-colors duration-200 ${view === 'coach' ? 'text-cyan-500 dark:text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Coach</button>
                    <button onClick={() => setView('progress')} className={`px-4 md:px-6 py-3 font-semibold transition-colors duration-200 ${view === 'progress' ? 'text-cyan-500 dark:text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Progress</button>
                    <button onClick={() => setView('grammarly')} className={`px-4 md:px-6 py-3 font-semibold transition-colors duration-200 ${view === 'grammarly' ? 'text-cyan-500 dark:text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Grammar Check</button>
                </div>

                {view === 'coach' && (
                    <>
                        <div className="w-full p-4 sm:p-6 bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                            <div className="flex justify-center mb-6 bg-slate-200 dark:bg-slate-800 p-1 rounded-full w-fit mx-auto">
                                <button onClick={() => setMode('practice')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'practice' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700/50'}`}>Practice</button>
                                <button onClick={() => setMode('freestyle')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'freestyle' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700/50'}`}>Freestyle</button>
                            </div>
                            
                            {mode === 'practice' && (
                                <div className="mb-4 flex flex-col items-center gap-2">
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                        <label htmlFor="category-select" className="text-sm font-medium text-slate-600 dark:text-slate-400">Category:</label>
                                        <select 
                                            id="category-select"
                                            value={practiceCategory}
                                            onChange={(e) => setPracticeCategory(e.target.value)}
                                            className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                        >
                                            {Object.keys(practiceCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    {practiceCategory === 'Custom Subject' && (
                                        <form onSubmit={handleGenerateCustomSentences} className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 animate-fade-in w-full max-w-md">
                                            <input
                                                type="text"
                                                value={customSubject}
                                                onChange={(e) => setCustomSubject(e.target.value)}
                                                placeholder="Enter a subject (e.g., Space)"
                                                className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-base focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full sm:w-auto flex-grow"
                                                disabled={isGeneratingSentences}
                                                aria-label="Custom subject for practice sentences"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isGeneratingSentences || !customSubject.trim()}
                                                className="px-6 py-2 rounded-md font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors duration-300 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed w-full sm:w-auto"
                                            >
                                                {isGeneratingSentences ? "Generating..." : "Get Sentences"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {isLoading || isGeneratingSentences ? (
                                <Loader message={isGeneratingSentences ? "Generating custom sentences..." : "Analyzing your speech..."} />
                            ) : (
                                <>
                                    <div className="text-center mb-8 min-h-[140px] flex flex-col justify-center items-center">
                                        {isRecording ? (
                                            <>
                                                <p className="text-lg font-semibold text-cyan-500 dark:text-cyan-400 animate-pulse">Listening...</p>
                                                {mode === 'practice' && <p className="mt-2 text-slate-500 dark:text-slate-400 font-serif text-lg">"{currentSentence}"</p>}
                                                <p className="mt-4 text-2xl text-slate-900 dark:text-slate-100 font-serif w-full break-words">
                                                    {userTranscript || <span className="text-slate-400 dark:text-slate-500">...</span>}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                {mode === 'practice' ? (
                                                    (practiceCategory === 'Custom Subject' && practiceCategories['Custom Subject'].length === 0) ? (
                                                        <div className="text-center">
                                                            <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Custom Subject Practice</h2>
                                                            <p className="my-4 text-xl md:text-2xl font-serif text-cyan-600 dark:text-cyan-300 tracking-wide">Enter a topic above to generate sentences.</p>
                                                        </div>
                                                    ) : (
                                                        <SentenceDisplay sentence={currentSentence} onNewSentence={getNewSentence} />
                                                    )
                                                ) : (
                                                    <>
                                                        <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Ready to speak?</h2>
                                                        <p className="my-4 text-2xl md:text-3xl font-serif text-cyan-600 dark:text-cyan-300 tracking-wide">Click the microphone and speak freely.</p>
                                                        <p className="text-slate-500 dark:text-slate-400">Click again when you're done.</p>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <RecordButton isRecording={isRecording} onClick={handleToggleRecording} />
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 h-5">{isRecording ? "Click to stop recording" : ""}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {error && <ErrorMessage message={error} />}
                        {feedback && !isLoading && !error && (
                            <FeedbackDisplay feedback={feedback} userTranscript={userTranscript} audioURL={audioURL} />
                        )}
                    </>
                )}
                
                {view === 'progress' && <ProgressTracker history={history} />}

                {view === 'grammarly' && <GrammarChecker />}
            </main>
            <footer className="w-full max-w-4xl mx-auto text-center mt-12 pb-4">
            </footer>
        </div>
    );
};

export default App;
