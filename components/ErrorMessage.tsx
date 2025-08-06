import React from 'react';

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="w-full max-w-2xl mx-auto my-4 p-4 bg-red-500/10 dark:bg-red-900/50 border border-red-500/20 dark:border-red-700 rounded-lg text-center">
            <p className="text-red-700 dark:text-red-300 font-semibold">{message}</p>
        </div>
    );
};