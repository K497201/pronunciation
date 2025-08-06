import React from 'react';

interface RecordButtonProps {
    isRecording: boolean;
    onClick: () => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
        <path fillRule="evenodd" d="M3 8a7 7 0 0111.94-4.95l-1.414 1.414A5 5 0 005 8H3zm14 0a7 7 0 01-2.527 5.484l-1.414-1.414A5 5 0 0015 8h2zM9 14a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm-2-1a1 1 0 100 2h.01a1 1 0 100-2H7zm5 1a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
    </svg>
);


export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onClick }) => {
    const buttonClasses = `
        relative w-24 h-24 rounded-full flex items-center justify-center
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-white dark:focus:ring-offset-slate-800
        ${isRecording
            ? 'bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
            : 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/50'
        }
    `;

    return (
        <button
            onClick={onClick}
            className={buttonClasses}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
            <MicIcon />
        </button>
    );
};