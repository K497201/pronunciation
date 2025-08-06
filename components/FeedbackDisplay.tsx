import React, { useMemo } from 'react';
import type { PronunciationFeedback, PronunciationError, PhonemeError } from '../types';

// --- ICONS ---

const TickIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
const CrossIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const LightbulbIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 dark:text-yellow-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM4 10a1 1 0 01-1-1V7a1 1 0 112 0v2a1 1 0 01-1 1zm1 11a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1zM10 5a4 4 0 102.343 7.343l.707.707a1 1 0 001.414-1.414l-.707-.707A5.001 5.001 0 0110 5z" />
    </svg>
);
const SoundWaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8v8m4-8v8m4-8v8m4-8v8m4-8v8" />
    </svg>
);
const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a1 1 0 000 2h1v10H5a1 1 0 000 2h1a2 2 0 002-2V5a2 2 0 00-2-2H5zM10 3a1 1 0 000 2h1v10h-1a1 1 0 100 2h1a2 2 0 002-2V5a2 2 0 00-2-2h-1z" />
      <path d="M15 6a1 1 0 100-2h-1a2 2 0 00-2 2v10a2 2 0 002 2h1a1 1 0 100-2h-1V6h1z" />
    </svg>
);
const SpeedoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V8m-4 8v-6m4 6h.01M9 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const FillerIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
const PhonemeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 9.774a13.932 13.932 0 003.956.347h.328a13.932 13.932 0 003.956-.347m-8.232-5.522a13.932 13.932 0 018.232 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ConfidenceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const GrammarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    }
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300">{title}</h4>
        </div>
        <div className="mt-2">{children}</div>
    </div>
);

const PhonemeErrorDetail: React.FC<{ error: PhonemeError }> = ({ error }) => (
    <div className="flex items-start gap-3 mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
        <PhonemeIcon />
        <div>
            <p className="font-semibold text-fuchsia-600 dark:text-fuchsia-400 font-mono">{error.phoneme}</p>
            <p className="text-slate-600 dark:text-slate-300 text-sm">{error.issue}</p>
        </div>
    </div>
);

const ErrorCard: React.FC<{ error: PronunciationError }> = ({ error }) => (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
            <CrossIcon />
            <div className="flex-1 flex items-baseline gap-x-3 flex-wrap mr-2">
                <h4 className="text-xl font-semibold text-red-600 dark:text-red-400">{error.word}</h4>
                <span className="text-lg text-slate-500 dark:text-slate-400 font-mono">/{error.phoneticSpelling}/</span>
            </div>
            <button 
                onClick={() => speakWord(error.word)}
                className="flex-shrink-0 flex items-center px-2 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-500 transition-colors"
                aria-label={`Hear correct pronunciation of ${error.word}`}
            >
                <SpeakerIcon />
                <span className="ml-1 hidden sm:inline">Listen</span>
            </button>
        </div>
        <p className="mt-2 text-slate-700 dark:text-slate-300 ml-9"><span className="font-semibold">Issue:</span> {error.issue}</p>
        
        <div className="mt-3 flex items-start gap-3 bg-yellow-400/10 dark:bg-yellow-900/30 p-3 rounded-md border border-yellow-400/30 dark:border-yellow-700/50 ml-9">
            <LightbulbIcon />
            <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">Suggestion</p>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error.suggestion}</p>
            </div>
        </div>
        
        {error.phonemeErrors && error.phonemeErrors.length > 0 && (
            <div className="mt-3 ml-9">
                 <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2">Phoneme Breakdown:</p>
                <div className="flex flex-col gap-2">
                    {error.phonemeErrors.map((pErr, i) => <PhonemeErrorDetail key={i} error={pErr} />)}
                </div>
            </div>
        )}
    </div>
);

const GrammarFeedbackCard: React.FC<{ grammarFeedback: NonNullable<PronunciationFeedback['grammarFeedback']> }> = ({ grammarFeedback }) => (
    <div className="mt-6">
        <h4 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <GrammarIcon />
            Grammar & Style Review
        </h4>
        <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            {grammarFeedback.errors.length === 0 ? (
                <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                     <TickIcon />
                    <span className="text-lg font-semibold">Excellent! No grammar suggestions.</span>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Corrected Transcript</p>
                        <p className="italic text-green-700 dark:text-green-300 bg-green-500/10 dark:bg-green-500/20 p-2 rounded-md">{grammarFeedback.correctedText}</p>
                    </div>
                    <div className="space-y-3">
                        {grammarFeedback.errors.map((err, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400 "><span className="font-semibold">Original:</span> "{err.incorrectPhrase}"</p>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1"><span className="font-semibold">Suggestion:</span> "{err.correction}"</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">{err.explanation}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    </div>
);

interface FeedbackDisplayProps {
    feedback: PronunciationFeedback;
    userTranscript: string;
    audioURL: string | null;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, userTranscript, audioURL }) => {
    const scoreColor = feedback.overallScore > 80 ? 'text-green-500' : feedback.overallScore > 50 ? 'text-yellow-500' : 'text-red-500';

    const highlightedTranscript = useMemo(() => {
        if (!userTranscript) return null;
        const errorWords = new Set(feedback.errors.map(e => e.word.toLowerCase()));
        return userTranscript.split(/(\s+)/).map((word, i) => {
            const cleanWord = word.replace(/[.,?!]/g, '').toLowerCase();
            return errorWords.has(cleanWord) ? 
                <span key={i} className="bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300 rounded px-1">{word}</span> : 
                <span key={i}>{word}</span>;
        });
    }, [userTranscript, feedback.errors]);

    return (
        <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-center text-cyan-600 dark:text-cyan-300 mb-6">Your Professional Feedback</h3>

            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900/40 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">Your Transcript & Recording</p>
                <p className="text-xl italic text-slate-800 dark:text-slate-100 leading-relaxed break-words">{highlightedTranscript}</p>
                {audioURL && (
                    <div className="mt-4">
                        <audio src={audioURL} controls className="w-full h-10" />
                    </div>
                )}
            </div>

            <div className="mb-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
                 <StatCard icon={<div className={`text-4xl font-bold ${scoreColor}`}>{feedback.overallScore}</div>} title="Score" >
                    <p className="text-xs text-slate-500 dark:text-slate-400">{feedback.overallFeedback}</p>
                 </StatCard>
                 <StatCard icon={<SpeedoIcon />} title="Pace">
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-300">{feedback.wordsPerMinute}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">WPM</p>
                 </StatCard>
                 <StatCard icon={<SoundWaveIcon />} title="Rhythm">
                    <p className="text-sm text-slate-600 dark:text-slate-300 text-left">{feedback.rhythmAndIntonation}</p>
                 </StatCard>
                 <StatCard icon={<FillerIcon />} title="Filler Words">
                    {feedback.fillerWords.length > 0 ? (
                        <div className="text-orange-600 dark:text-orange-300 font-semibold">
                            {feedback.fillerWords.map(fw => `${fw.count}x "${fw.word}"`).join(', ')}
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 dark:text-green-400">None detected!</p>
                    )}
                 </StatCard>
                 <StatCard icon={<ConfidenceIcon />} title="Confidence">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                        {Math.round(feedback.transcriptionConfidence * 100)}%
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Transcription</p>
                 </StatCard>
            </div>

            {feedback.grammarFeedback && (
                <GrammarFeedbackCard grammarFeedback={feedback.grammarFeedback as NonNullable<PronunciationFeedback['grammarFeedback']>} />
            )}
            
            <div className="mt-6">
                <h4 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Areas to Improve (Pronunciation)</h4>
                {feedback.errors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-green-500/10 dark:bg-green-900/30 p-6 rounded-lg border border-green-500/20 dark:border-green-700/50 h-full">
                        <TickIcon />
                        <p className="mt-2 text-xl font-semibold text-green-700 dark:text-green-300">Excellent Pronunciation!</p>
                        <p className="text-green-600 dark:text-green-200 text-center">No pronunciation errors were detected.</p>
                    </div>
                ) : (
                     <div className="flex flex-col gap-4 max-h-[30rem] overflow-y-auto pr-2">
                        {feedback.errors.map((err, index) => <ErrorCard key={index} error={err} />)}
                     </div>
                )}
            </div>
        </div>
    );
};