import React from 'react';

interface HeaderProps {
    onReset: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);

const RestartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0113.89-4.32l-2.73 2.73M20 13a8 8 0 01-13.89 4.32l2.73-2.73" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onReset, theme, onToggleTheme }) => {
    return (
        <header className="relative w-full max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center justify-center gap-3">
                <MicIcon />
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
                        Pronunciation Coach
                    </h1>
                     <p className="mt-1 text-md text-slate-500 dark:text-slate-400">
                        Your AI-powered speech analyst
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 <button
                    onClick={onToggleTheme}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
                </button>
                <button
                    onClick={onReset}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                    aria-label="Start Over"
                >
                    <RestartIcon />
                </button>
            </div>
        </header>
    );
};