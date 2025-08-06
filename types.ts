
// Adding global declaration for the Median.co native bridge API.
// This allows the app to use native device functionality for features
// like Text-to-Speech and Speech Recognition when wrapped in a mobile app.
declare global {
    interface Window {
        median?: {
            tts: {
                speak: (params: { text: string; language?: string; }) => void;
            };
            speech: {
                 isAvailable: boolean;
                 start: (params: { 
                    onResult: (result: { transcript: string, isFinal: boolean, confidence: number }) => void;
                    onError: (error: { message: string }) => void;
                    onEnd: () => void;
                }) => void;
                stop: () => void;
            }
        }
    }
}


export interface PhonemeError {
    phoneme: string;
    issue: string;
}

export interface PronunciationError {
    word: string;
    phoneticSpelling: string;
    issue: string;
    suggestion: string;
    phonemeErrors: PhonemeError[];
}

export interface GrammarError {
    incorrectPhrase: string;
    correction: string;
    explanation: string;
}

export interface PronunciationFeedback {
    overallScore: number;
    overallFeedback: string;
    rhythmAndIntonation: string;
    errors: PronunciationError[];
    wordsPerMinute: number;
    fillerWords: {
        word: string;
        count: number;
    }[];
    transcriptionConfidence: number;
    grammarFeedback?: {
        correctedText: string;
        errors: GrammarError[];
    } | null;
}

// The part of the feedback that comes from the AI
export type AiFeedback = Omit<PronunciationFeedback, 'wordsPerMinute' | 'fillerWords' | 'transcriptionConfidence'>;


export interface Session {
    id: number;
    date: string;
    score: number;
    wpm: number;
    sentence: string;
    transcript: string;
}

export type PracticeCategories = {
    [key: string]: string[];
};

export interface GrammarAnalysisResult {
    correctedText: string;
    errors: GrammarError[];
    readabilityScore: number;
    readabilityAnalysis: string;
toneAnalysis: string;
    clarityConcisenessFeedback: string;
}

export interface InterviewContentFeedback {
    overallSummary: string;
    clarityAndStructure: string;
    relevanceToQuestion: string;
    impactAndExamples: string;
    starMethodFeedback: string | null; // For behavioral questions
    suggestedAnswer: string | null;
}

export interface InterviewAnalysisResult {
    pronunciationFeedback: AiFeedback;
    contentFeedback: InterviewContentFeedback;
}
