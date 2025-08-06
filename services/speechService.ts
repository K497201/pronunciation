
// Manually defining types for the Web Speech API as they are not yet part of standard TS libs.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

// These are already declared in `types.ts` via `declare global`
// but keeping them here ensures this file can be understood in isolation.
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}

interface SpeechServiceParams {
    onResult: (transcript: string) => void;
    onError: (error: string) => void;
    onEnd: (result: { transcript: string, audioBlob: Blob | null, confidence: number }) => void;
}


export const speechService = ({ onResult, onError, onEnd }: SpeechServiceParams) => {

    // --- NATIVE BRIDGE (MEDIAN.CO) IMPLEMENTATION ---
    // Prioritize native functionality for reliability in wrapped mobile apps.
    if (window.median?.speech?.isAvailable) {
        let sessionTranscript = '';
        let finalConfidenceScores: number[] = [];

        const start = async () => {
            sessionTranscript = '';
            finalConfidenceScores = [];
            window.median!.speech.start({
                onResult: (result) => {
                    let currentTranscript = result.transcript;
                    if (result.isFinal) {
                        sessionTranscript = sessionTranscript ? sessionTranscript + ' ' + currentTranscript : currentTranscript;
                        if (result.confidence) finalConfidenceScores.push(result.confidence);
                        onResult(sessionTranscript);
                    } else {
                        onResult(sessionTranscript ? sessionTranscript + ' ' + currentTranscript : currentTranscript);
                    }
                },
                onError: (error) => onError(error.message || 'An unknown native error occurred.'),
                onEnd: () => {
                    const averageConfidence = finalConfidenceScores.length > 0 ? finalConfidenceScores.reduce((a, b) => a + b, 0) / finalConfidenceScores.length : 0;
                    // Native bridge does not provide an audio blob. This is an acceptable limitation.
                    onEnd({ transcript: sessionTranscript, audioBlob: null, confidence: averageConfidence });
                }
            });
        };

        const stop = () => {
            window.median!.speech.stop();
        };
        
        return { start, stop };
    }

    // --- WEB SPEECH API FALLBACK IMPLEMENTATION (with bug fixes) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        const start = async () => {
            throw new Error("Speech Recognition API is not supported in this browser.");
        }
        return { start, stop: () => {} };
    }

    // Create new instances for each service call to avoid shared state issues.
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let audioStream: MediaStream | null = null;
    let sessionTranscript = '';
    let finalConfidenceScores: number[] = [];
    
    const start = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Media Devices API (for recording) is not supported in this browser.");
        }
        
        sessionTranscript = '';
        finalConfidenceScores = [];

        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream);
            audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });
            
            // FIX: Create blob on recorder stop to prevent race condition.
            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const averageConfidence = finalConfidenceScores.length > 0
                    ? finalConfidenceScores.reduce((a, b) => a + b, 0) / finalConfidenceScores.length
                    : 0;
                
                onEnd({ transcript: sessionTranscript.trim(), audioBlob, confidence: averageConfidence });
            });
            
            mediaRecorder.start();
            recognition.start();

        } catch (err: any) {
            throw new Error(`Microphone access was denied: ${err.message}`);
        }
    };

    const stop = () => {
        if (recognition) {
            recognition.stop();
        }
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let currentFinalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                currentFinalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript = event.results[i][0].transcript;
            }
        }
        sessionTranscript = currentFinalTranscript;
        finalConfidenceScores = Array.from(event.results)
            .filter(r => r.isFinal && r[0].confidence > 0)
            .map(r => r[0].confidence);

        onResult(sessionTranscript.trim() + (interimTranscript ? ' ' + interimTranscript : ''));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        onError(event.error === 'no-speech' ? 'No speech was detected.' : event.error);
    };

    recognition.onend = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
    };
    
    return { start, stop };
};
