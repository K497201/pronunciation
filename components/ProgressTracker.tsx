import React from 'react';
import type { Session } from '../types';

interface ProgressTrackerProps {
    history: Session[];
}

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const ProgressChart: React.FC<{ data: Session[] }> = ({ data }) => {
    const chartData = data.slice(0, 15).reverse(); // Use last 15 sessions, in chronological order
    const width = 500;
    const height = 150;
    const padding = 20;

    if (chartData.length < 2) {
        return (
            <div className="h-[150px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                <p>Not enough data to display a chart. Complete at least two sessions.</p>
            </div>
        );
    }

    const maxScore = 100;
    const minScore = 0;
    const xStep = (width - padding * 2) / (chartData.length - 1);
    const y = (score: number) => height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);

    const points = chartData.map((session, i) => `${padding + i * xStep},${y(session.score)}`).join(' ');
    
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Y-axis labels */}
            <text x="5" y={y(100) + 5} className="text-xs fill-current text-slate-400">100</text>
            <text x="5" y={y(50) + 5} className="text-xs fill-current text-slate-400">50</text>
            <text x="5" y={y(0) + 5} className="text-xs fill-current text-slate-400">0</text>

            {/* Guideline */}
            <line x1={padding} y1={y(50)} x2={width - padding} y2={y(50)} className="stroke-current text-slate-200 dark:text-slate-700" strokeDasharray="2,2" />

            {/* Chart Line */}
            <polyline points={points} className="fill-none stroke-cyan-500" strokeWidth="2" />

            {/* Data Points */}
            {chartData.map((session, i) => (
                <g key={session.id}>
                    <circle cx={padding + i * xStep} cy={y(session.score)} r="3" className="fill-cyan-500" />
                </g>
            ))}
        </svg>
    );
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ history }) => {
    return (
        <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <ChartIcon />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Your Progress</h3>
            </div>
            
            <div className="mb-6 bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">Score Over Time</h4>
                <ProgressChart data={history} />
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Session History</h4>
                {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>You haven't completed any sessions yet.</p>
                        <p>Go to the "Coach" tab to get started!</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <ul className="space-y-3">
                            {history.map(session => (
                                <li key={session.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={session.sentence}>
                                            {session.sentence}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(session.date)}</p>
                                    </div>
                                    <div className="flex gap-4 items-center self-end sm:self-center">
                                         <div className="text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">WPM</p>
                                            <p className="font-bold text-lg text-teal-600 dark:text-teal-400">{session.wpm}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                                            <p className="font-bold text-lg text-cyan-600 dark:text-cyan-400">{session.score}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};