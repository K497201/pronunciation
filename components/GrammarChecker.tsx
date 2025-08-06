import React, { useState, useCallback, useMemo, useRef } from 'react';
import { checkGrammar } from '../services/geminiService';
import { speechService } from '../services/speechService';
import type { GrammarAnalysisResult } from '../types';
import { Loader } from './Loader';
import { ErrorMessage } from './ErrorMessage';

// --- ICONS ---
const GrammarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);
const TickIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRecording ? 'text-red-500' : ''}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);
const ReadabilityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8a2 2 0 00.23 2.16l3.955 4.109A2 2 0 0014 15.171V10z" /></svg>
);
const ToneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ClarityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
);

const AnalysisCard: React.FC<{ icon: React.ReactNode; title: string; value: string; analysis: string; }> = ({ icon, title, value, analysis }) => (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex-grow">
        <div className="flex items-center gap-3">
            {icon}
            <h4 className="font-semibold text-slate-600 dark:text-slate-300">{title}</h4>
        </div>
        <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{analysis}</p>
    </div>
);


export const GrammarChecker: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [result, setResult] = useState<GrammarAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const errorOccurred = useRef(false);

    const handleCheckGrammar = useCallback(async () => {
        if (!inputText.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await checkGrammar(inputText);
            setResult(analysisResult);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading]);

    const handleClear = () => {
        setInputText('');
        setResult(null);
        setError(null);
        setIsLoading(false);
    };
    
    // --- Speech Recognition ---
    const speechRecognitionService = useMemo(() => {
        return speechService({
            onResult: (transcript) => {
                setInputText(transcript);
            },
            onError: (err) => {
                errorOccurred.current = true;
                setError(`Speech recognition error: ${err}`);
                setIsRecording(false);
            },
            onEnd: ({ transcript: finalTranscript }) => {
                setIsRecording(false);
                if (!errorOccurred.current) {
                    setInputText(finalTranscript);
                }
            }
        });
    }, []);

    const handleToggleRecording = async () => {
        if (isRecording) {
            speechRecognitionService.stop();
        } else {
            errorOccurred.current = false;
            setResult(null);
            setError(null);
            setInputText(''); 
            try {
                await speechRecognitionService.start();
                setIsRecording(true);
            } catch (e: any) {
                setError(e.message);
            }
        }
    };

    return (
        <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <GrammarIcon />
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Professional Writing Assistant</h3>
                    <p className="text-slate-500 dark:text-slate-400">Improve your writing with AI-powered grammar, style, and tone analysis.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isRecording ? "Listening..." : "Type, paste, or dictate your text here..."}
                        className="w-full h-48 p-3 pr-12 bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-y"
                        aria-label="Text input for grammar check"
                        disabled={isLoading || isRecording}
                    />
                    <button
                        onClick={handleToggleRecording}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500/20' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        disabled={isLoading}
                    >
                        <MicIcon isRecording={isRecording} />
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleCheckGrammar}
                        disabled={isLoading || !inputText.trim() || isRecording}
                        className="flex-1 px-6 py-3 rounded-md font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors duration-300 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Analyzing..." : "Analyze Text"}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={isLoading || isRecording}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-md font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {isLoading && <div className="mt-8"><Loader message="Checking your text..." /></div>}
            {error && <div className="mt-8"><ErrorMessage message={error} /></div>}

            {result && !isLoading && (
                <div className="mt-8 animate-fade-in space-y-8">
                    {/* Analysis Dashboard */}
                    <div>
                        <h4 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Analysis Dashboard</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AnalysisCard icon={<ReadabilityIcon />} title="Readability" value={result.readabilityScore.toString()} analysis={result.readabilityAnalysis} />
                            <AnalysisCard icon={<ToneIcon />} title="Tone" value={result.toneAnalysis} analysis="The emotional tone of the text." />
                            <AnalysisCard icon={<ClarityIcon />} title="Clarity" value="Insight" analysis={result.clarityConcisenessFeedback} />
                        </div>
                    </div>
                    
                    {/* Suggestions Section */}
                    <div>
                         <h4 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">Suggestions</h4>
                        {result.errors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/40 p-6 rounded-lg text-center border border-green-500/20">
                                <TickIcon />
                                <p className="mt-2 text-xl font-semibold text-green-700 dark:text-green-300">Excellent Writing!</p>
                                <p className="text-slate-600 dark:text-slate-300">No grammatical suggestions were found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
                                    <p className="font-semibold text-green-800 dark:text-green-200">Full Corrected Text</p>
                                    <p className="mt-1 italic text-green-800 dark:text-green-200 whitespace-pre-wrap">{result.correctedText}</p>
                                </div>
                                {result.errors.map((err, i) => (
                                    <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <p className="text-md text-red-500 line-through">"{err.incorrectPhrase}"</p>
                                        <p className="text-md text-green-600 mt-1">"{err.correction}"</p>
                                        <div className="mt-3 flex gap-2 p-3 text-sm bg-slate-200 dark:bg-slate-700/50 rounded-md text-slate-700 dark:text-slate-300">
                                            <InfoIcon />
                                            <span>{err.explanation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};