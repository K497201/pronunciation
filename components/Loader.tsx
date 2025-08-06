import React from 'react';

interface LoaderProps {
    message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Analyzing your speech..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 my-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
            <p className="text-slate-600 dark:text-slate-300 text-lg">{message}</p>
        </div>
    );
};
