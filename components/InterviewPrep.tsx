import React, { useState, useMemo, useCallback, useRef } from 'react';
import { analyzeInterviewAnswer } from '../services/geminiService';
import { speechService } from '../services/speechService';
import { INTERVIEW_CATEGORIES, FILLER_WORDS } from '../constants';
import type { InterviewAnalysisResult, PronunciationFeedback } from '../types';
import { Loader } from './Loader';
import { ErrorMessage } from './ErrorMessage';
import { RecordButton } from './RecordButton';
import { FeedbackDisplay } from './FeedbackDisplay';

// --- UTILITY FUNCTIONS (can be moved to a utils file) ---
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

// --- ICONS ---
const InterviewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477a2 2 0 01-.547-1.806a2 2 0 011.806-.547l2.387.477a6 6 0 013.86-.517l.318-.158a6 6 0 003.86-.517l2.387-.477a2 2 0 011.806.547a2 2 0 01.547 1.806l-.477 2.387a6 6 0 01-.517 3.86l-.158.318a6 6 0 01-.517 3.86l-2.387.477a2 2 0 01-1.806-.547a2 2 0 01-.547-1.806l.477-2.387a6 6 0 01.517-3.86l.158-.318a6 6 0 00.517-3.86z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-9l2.293-2.293a1 1 0 011.414 0l2.293 2.293m-4.586 4.586l2.293 2.293a1 1 0 001.414 0l2.293-2.293m-4.586-4.586l-2.293 2.293a1 1 0 000 1.414l2.293 2.293m0 0l2.293 2.293a1 1 0 001.414 0l2.293-2.293m-4.586-4.586l-2.293 2.293m2.293-2.293l2.293 2.293" /></svg>;


const ContentFeedbackCard: React.FC<{ title: string; children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="flex items-center gap-2 font-semibold text-lg text-slate-700 dark:text-slate-200 mb-2">
            {icon}
            {title}
        </h4>
        <div className="text-slate-600 dark:text-slate-300 space-y-2">{children}</div>
    </div>
);

export const InterviewPrep: React.FC = () => {
    const [category, setCategory] = useState(Object.keys(INTERVIEW_CATEGORIES)[0]);
    const [question, setQuestion] = useState('');
    const [userTranscript, setUserTranscript] = useState('');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<PronunciationFeedback | null>(null);
    const [contentFeedback, setContentFeedback] = useState<InterviewAnalysisResult['contentFeedback'] | null>(null);
    
    const errorOccurred = useRef(false);

    const getNewQuestion = useCallback(() => {
        const questions = INTERVIEW_CATEGORIES[category] || [];
        if (questions.length === 0) {
            setQuestion("No questions in this category.");
            return;
        }
        let newQuestion = question;
        if (questions.length > 1) {
            while (newQuestion === question) {
                newQuestion = questions[Math.floor(Math.random() * questions.length)];
            }
        } else {
            newQuestion = questions[0];
        }
        setQuestion(newQuestion);
        setAnalysis(null);
        setContentFeedback(null);
        setUserTranscript('');
        setAudioURL(null);
        setError(null);

    }, [category, question]);

    // Set initial question
    useState(() => {
        getNewQuestion();
    });

    const handleAnalysis = useCallback(async (transcript: string, audioBlob: Blob | null, confidence: number) => {
        if (!transcript.trim()) {
            setError("Your speech was not detected. Please try again.");
            setIsLoading(false);
            return;
        }
        setUserTranscript(transcript);
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setContentFeedback(null);

        try {
            const isBehavioral = category.toLowerCase().includes('behavioral');
            const aiResult = await analyzeInterviewAnswer(question, transcript, isBehavioral);
            
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
            
            const fullFeedback: PronunciationFeedback = { 
                ...aiResult.pronunciationFeedback, 
                ...clientMetrics, 
                transcriptionConfidence: confidence 
            };
            
            setAnalysis(fullFeedback);
            setContentFeedback(aiResult.contentFeedback);

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Sorry, I couldn't analyze your answer. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [question, category]);

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

    const handleToggleRecording = async () => {
        if (isRecording) {
            speechRecognitionService.stop();
        } else {
            errorOccurred.current = false;
            setAnalysis(null);
            setContentFeedback(null);
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

    return (
        <div className="w-full animate-fade-in space-y-6">
            <div className="w-full p-4 sm:p-6 bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                    <InterviewIcon />
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Interview Prep</h3>
                        <p className="text-slate-500 dark:text-slate-400">Practice your answers and get expert AI feedback.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <label htmlFor="category-select" className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">Category:</label>
                    <select 
                        id="category-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full sm:w-auto"
                    >
                        {Object.keys(INTERVIEW_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <button
                        onClick={getNewQuestion}
                        className="w-full sm:w-auto px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors text-sm font-semibold"
                    >
                        Get New Question
                    </button>
                </div>

                {isLoading ? (
                    <Loader message="Your coach is analyzing the answer..."/>
                ) : (
                    <>
                        <div className="text-center my-8 min-h-[140px] flex flex-col justify-center items-center">
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Question:</p>
                            <p className="my-2 text-2xl md:text-3xl font-serif text-indigo-600 dark:text-indigo-300 tracking-wide">"{question}"</p>
                            
                            {isRecording && (
                                <p className="mt-4 text-xl text-slate-900 dark:text-slate-100 font-serif w-full break-words animate-fade-in">
                                    {userTranscript || <span className="text-slate-400 dark:text-slate-500 animate-pulse">Listening...</span>}
                                </p>
                            )}
                        </div>
                         <div className="flex flex-col items-center">
                            <RecordButton isRecording={isRecording} onClick={handleToggleRecording} />
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 h-5">
                                {isRecording ? "Click to stop recording" : "Click the mic to start your answer"}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {error && <ErrorMessage message={error} />}

            {analysis && contentFeedback && !isLoading && (
                 <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-cyan-600 dark:text-cyan-300 mb-6">Your Feedback Report</h3>
                    
                     <div className="mb-6 space-y-4">
                        <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><BrainIcon/> Content & Delivery Analysis</h4>
                         <ContentFeedbackCard title="Overall Summary" icon={<CheckCircleIcon />}>
                             <p>{contentFeedback.overallSummary}</p>
                         </ContentFeedbackCard>
                         <div className="grid md:grid-cols-2 gap-4">
                            <ContentFeedbackCard title="Clarity & Structure" icon={<CheckCircleIcon />}>
                                 <p>{contentFeedback.clarityAndStructure}</p>
                            </ContentFeedbackCard>
                            <ContentFeedbackCard title="Relevance & Impact" icon={<CheckCircleIcon />}>
                                <p>{contentFeedback.relevanceToQuestion}</p>
                                <p className="mt-2">{contentFeedback.impactAndExamples}</p>
                            </ContentFeedbackCard>
                         </div>
                          {contentFeedback.starMethodFeedback && (
                             <ContentFeedbackCard title="STAR Method Feedback" icon={<StarIcon />}>
                                 <p>{contentFeedback.starMethodFeedback}</p>
                            </ContentFeedbackCard>
                         )}
                         {contentFeedback.suggestedAnswer && (
                            <ContentFeedbackCard title="Suggested Answer" icon={<SparklesIcon />}>
                                 <p className="whitespace-pre-wrap font-serif italic text-slate-700 dark:text-slate-200">{contentFeedback.suggestedAnswer}</p>
                            </ContentFeedbackCard>
                         )}
                     </div>

                    <FeedbackDisplay feedback={analysis} userTranscript={userTranscript} audioURL={audioURL} />
                 </div>
            )}
        </div>
    );
};