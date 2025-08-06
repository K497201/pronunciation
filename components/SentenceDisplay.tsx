
import React from 'react';

interface SentenceDisplayProps {
    sentence: string;
    onNewSentence: () => void;
}

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.073 8.016A.5.5 0 015.5 8h1a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-1a.5.5 0 01-.427-.234L3.733 9.207a.5.5 0 010-.414l1.34-2.016z" />
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm3.994 4.135a.5.5 0 01.22.637l-2 5a.5.5 0 01-.877.21l-1.09-2.18a.5.5 0 01.876-.438l.634 1.267 1.6-4A.5.5 0 0113.994 7.135z" clipRule="evenodd" />
    </svg>
);

const speakSentence = (sentence: string) => {
    // Prioritize Median.co native bridge for robust TTS on mobile
    if (window.median?.tts?.speak) {
        window.median.tts.speak({ text: sentence, language: 'en-US' });
        return;
    }
    
    // Fallback to Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US';
        speechSynthesis.cancel(); // Cancel any previous speech
        speechSynthesis.speak(utterance);
    } else {
        alert("Sorry, your browser doesn't support text-to-speech.");
    }
};

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({ sentence, onNewSentence }) => {
    return (
        <div className="text-center w-full">
            <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Read this sentence aloud:</h2>
            
            <div className="my-4 text-2xl md:text-3xl font-serif text-cyan-600 dark:text-cyan-300 tracking-wide flex items-center justify-center gap-3">
                 <button
                    onClick={() => speakSentence(sentence)}
                    className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                    aria-label="Hear sentence"
                >
                    <SpeakerIcon />
                </button>
                 <p>"{sentence}"</p>
            </div>
           
            <button
                onClick={onNewSentence}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-cyan-500"
            >
                <RefreshIcon />
                New Sentence
            </button>
        </div>
    );
};
