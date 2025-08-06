
import { GoogleGenAI, Type } from "@google/genai";
import type { AiFeedback, PronunciationFeedback, GrammarAnalysisResult, InterviewAnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const pronunciationErrorSchema = {
    type: Type.OBJECT,
    properties: {
        word: {
            type: Type.STRING,
            description: "The mispronounced word from the transcript. If a word was omitted, this should be the word that was missed. If a word was substituted, this should be the substituted word."
        },
        phoneticSpelling: {
            type: Type.STRING,
            description: "The correct International Phonetic Alphabet (IPA) spelling for the intended word."
        },
        issue: {
            type: Type.STRING,
            description: "A concise description of the main pronunciation error (e.g., 'Incorrect vowel sound', 'Omitted word', 'Substituted for 'that'')."
        },
        suggestion: {
            type: Type.STRING,
            description: "Actionable advice on correcting the pronunciation (mouth/tongue placement)."
        },
        phonemeErrors: {
            type: Type.ARRAY,
            description: "A detailed list of the specific incorrect phonemes within the word. This can be empty for omissions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    phoneme: {
                        type: Type.STRING,
                        description: "The specific IPA phoneme that was mispronounced (e.g., /æ/)."
                    },
                    issue: {
                        type: Type.STRING,
                        description: "A description of how the phoneme was pronounced incorrectly (e.g., 'Pronounced as /ɛ/, as in 'bet'')."
                    }
                },
                required: ["phoneme", "issue"]
            }
        }
    },
    required: ["word", "phoneticSpelling", "issue", "suggestion", "phonemeErrors"]
};

const grammarFeedbackSchema = {
     type: Type.OBJECT,
    description: "Grammar and style analysis. This field should be null if no errors are found.",
    properties: {
        correctedText: {
            type: Type.STRING,
            description: "The user's full transcript, corrected for all grammatical and style errors."
        },
        errors: {
            type: Type.ARRAY,
            description: "An array of specific grammatical errors found in the text. If no errors, this must be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    incorrectPhrase: {
                        type: Type.STRING,
                        description: "The specific phrase from the transcript that has a grammatical error."
                    },
                    correction: {
                        type: Type.STRING,
                        description: "The grammatically correct version of the phrase."
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A concise explanation of the grammar rule that was broken (e.g., 'Subject-verb agreement')."
                    }
                },
                required: ["incorrectPhrase", "correction", "explanation"]
            }
        }
    },
    required: ["correctedText", "errors"]
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.NUMBER,
            description: "A score from 0 to 100 on pronunciation accuracy. 100 is perfect."
        },
        overallFeedback: {
            type: Type.STRING,
            description: "A brief, encouraging, one-sentence summary of the performance."
        },
        rhythmAndIntonation: {
            type: Type.STRING,
            description: "Feedback on rhythm, pacing, and intonation. Comment on natural flow."
        },
        errors: {
            type: Type.ARRAY,
            description: "An array of specific pronunciation errors.",
            items: pronunciationErrorSchema
        },
        grammarFeedback: grammarFeedbackSchema
    },
    required: ["overallScore", "overallFeedback", "rhythmAndIntonation", "errors"]
};

// Schema for generating practice sentences
const sentencesSchema = {
    type: Type.OBJECT,
    properties: {
        sentences: {
            type: Type.ARRAY,
            description: "An array of 5 to 7 simple English sentences suitable for pronunciation practice.",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["sentences"]
};

// Schema for professional grammar checking
const grammarSchema = {
    type: Type.OBJECT,
    properties: {
        correctedText: {
            type: Type.STRING,
            description: "The user's full text, corrected for all grammatical and style errors. If no errors, this should be the original text."
        },
        errors: {
            type: Type.ARRAY,
            description: "An array of specific grammatical errors found in the text. If no errors are found, this MUST be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    incorrectPhrase: {
                        type: Type.STRING,
                        description: "The specific phrase from the original text that has a grammatical error."
                    },
                    correction: {
                        type: Type.STRING,
                        description: "The grammatically correct version of the phrase."
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A concise explanation of the grammar rule that was broken (e.g., 'Subject-verb agreement', 'Incorrect tense')."
                    }
                },
                required: ["incorrectPhrase", "correction", "explanation"]
            }
        },
        readabilityScore: {
            type: Type.NUMBER,
            description: "A numerical score from 0-100 indicating readability, where a higher score means it is easier to read. For reference, a score of 60-70 is considered plain English."
        },
        readabilityAnalysis: {
            type: Type.STRING,
            description: "A brief, one-sentence explanation of the readability score and what it implies (e.g., 'This text is easily understood by a general audience.')."
        },
        toneAnalysis: {
            type: Type.STRING,
            description: "A one or two-word description of the primary tone of the text (e.g., 'Formal and Confident', 'Informal and Friendly', 'Neutral')."
        },
        clarityConcisenessFeedback: {
            type: Type.STRING,
            description: "A one or two-sentence actionable feedback on how to make the text clearer and more concise. If the text is already clear, state that."
        }
    },
    required: ["correctedText", "errors", "readabilityScore", "readabilityAnalysis", "toneAnalysis", "clarityConcisenessFeedback"]
};

export const getSentencesForSubject = async (subject: string): Promise<string[]> => {
    const prompt = `
        You are an assistant that creates educational content.
        Generate a list of 5 to 7 simple, distinct, and common English sentences about the topic: "${subject}".
        These sentences will be used for pronunciation practice. They should be clear, concise, and use everyday vocabulary where possible.
        Ensure the sentences are different from each other.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: sentencesSchema,
                temperature: 0.7
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData: { sentences: string[] } = JSON.parse(jsonText);
        
        if (!parsedData.sentences || parsedData.sentences.length === 0) {
            throw new Error("AI failed to generate sentences.");
        }

        return parsedData.sentences;

    } catch (error) {
        console.error("Error calling Gemini API for sentence generation:", error);
        throw new Error(`Failed to generate sentences for the subject "${subject}". Please try a different subject.`);
    }
};

export const checkGrammar = async (text: string): Promise<GrammarAnalysisResult> => {
    const prompt = `
        You are a professional writing assistant and expert English editor.
        Analyze the following text with a focus on grammar, punctuation, style, readability, and tone.
        Provide a corrected version of the entire text.
        List all specific errors with corrections and concise explanations.
        Also provide a professional analysis including readability score, tone, and clarity feedback.
        If there are no errors, return the original text, an empty errors array, and a positive analysis.

        User's Text: "${text}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: grammarSchema,
                temperature: 0.3
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData: GrammarAnalysisResult = JSON.parse(jsonText);
        
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API for grammar check:", error);
        throw new Error("Failed to check grammar. The AI model may be temporarily unavailable.");
    }
};

// Schemas for interview analysis
const interviewContentFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: { type: Type.STRING, description: "A concise, one-paragraph summary of the answer's strengths and weaknesses." },
        clarityAndStructure: { type: Type.STRING, description: "Feedback on how clear and well-structured the answer was. Was it easy to follow?" },
        relevanceToQuestion: { type: Type.STRING, description: "Feedback on how well the answer addressed the specific interview question." },
        impactAndExamples: { type: Type.STRING, description: "Analysis of the use of specific examples and their impact. Were they compelling?" },
        starMethodFeedback: { type: Type.STRING, description: "ONLY for behavioral questions. Specific feedback on the STAR (Situation, Task, Action, Result) method. If not a behavioral question, this MUST be null." },
        suggestedAnswer: { type: Type.STRING, description: "A concise, improved example answer that the user could use as inspiration." },
    },
    required: ["overallSummary", "clarityAndStructure", "relevanceToQuestion", "impactAndExamples", "starMethodFeedback", "suggestedAnswer"]
};

const interviewPronunciationFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.NUMBER,
            description: "A score from 0 to 100 on pronunciation accuracy. 100 is perfect."
        },
        overallFeedback: {
            type: Type.STRING,
            description: "A brief, encouraging, one-sentence summary of the performance."
        },
        rhythmAndIntonation: {
            type: Type.STRING,
            description: "Feedback on rhythm, pacing, and intonation. Comment on natural flow."
        },
        errors: {
            type: Type.ARRAY,
            description: "An array of specific pronunciation errors. Can be empty.",
            items: pronunciationErrorSchema
        }
    },
    required: ["overallScore", "overallFeedback", "rhythmAndIntonation", "errors"]
};

const interviewAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        pronunciationFeedback: interviewPronunciationFeedbackSchema,
        contentFeedback: interviewContentFeedbackSchema
    },
    required: ["pronunciationFeedback", "contentFeedback"]
};

export const analyzeInterviewAnswer = async (
    question: string,
    answer: string,
    isBehavioral: boolean
): Promise<InterviewAnalysisResult> => {
    const prompt = `
        You are an expert interview coach, combining the skills of a communication expert and a hiring manager.
        The user is practicing for an interview.
        
        Interview Question: "${question}"
        User's Answer: "${answer}"

        Please provide a dual analysis in JSON format according to the provided schema.

        1.  **Content Analysis**: Evaluate the substance of the answer.
            -   Is it clear, structured, and relevant?
            -   Does it use strong examples?
            -   Provide an overall summary.
            -   Give a concise, improved example answer for inspiration.
            ${isBehavioral ? "-   **Crucially, for this behavioral question, evaluate the answer using the STAR (Situation, Task, Action, Result) method.** Provide specific feedback on how well they used it in the 'starMethodFeedback' field." : "- This is not a behavioral question, so the 'starMethodFeedback' field MUST be null."}

        2.  **Pronunciation Analysis**: Analyze the delivery of the answer based on a general American English accent.
            -   Provide an overall pronunciation score (0-100).
            -   Give feedback on rhythm and intonation.
            -   Identify specific pronunciation errors. If there are no errors, the 'errors' array must be empty.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: interviewAnalysisSchema,
                temperature: 0.2
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData: InterviewAnalysisResult = JSON.parse(jsonText);

        // Gemini may sometimes ignore the prompt instruction for null.
        if (!isBehavioral && parsedData.contentFeedback.starMethodFeedback) {
            parsedData.contentFeedback.starMethodFeedback = null;
        }
        
        // The AiFeedback type allows for optional grammarFeedback, which will just be undefined here as desired.
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API for interview analysis:", error);
        throw new Error("Failed to get interview analysis from AI. The model may be temporarily unavailable.");
    }
};

export const getPronunciationFeedback = async (
    userTranscript: string,
    practiceSentence?: string
): Promise<AiFeedback> => {
    const isFreestyle = !practiceSentence;

    const prompt = `
        You are an expert American English pronunciation coach. Analyze the user's speech transcript with extreme detail.
        ${isFreestyle
            ? "The user is speaking freely. Analyze their general pronunciation, and ALSO perform a grammar and style check."
            : `The user was attempting to say the following sentence: "${practiceSentence}". Your analysis MUST focus on how accurately they pronounced this specific sentence. Do not provide grammar feedback.`
        }

        User's Transcript: "${userTranscript}"

        Perform the following analysis for a general American English accent:
        
        1.  **Pronunciation Analysis (Always provide)**:
            -   **Overall Score**: Rate pronunciation from 0-100. ${isFreestyle ? "Base this on general clarity." : "Base this on accuracy against the target sentence. Deduct for omissions, substitutions, and mispronunciations."}
            -   **Overall Feedback**: A brief, encouraging summary of pronunciation.
            -   **Rhythm & Intonation**: Comment on flow, pacing, and stress.
            -   **Error Analysis**: Identify mispronounced words. ${!isFreestyle ? "Note any substitutions, omissions, or insertions against the target sentence." : ""}
                - For each error, provide 'word', 'phoneticSpelling', 'issue', 'suggestion', and 'phonemeErrors'.
            - If pronunciation is perfect, return an empty 'errors' array and a high score.

        2.  **Grammar & Style Analysis (ONLY for Freestyle Mode)**:
            - If this is freestyle mode, analyze the transcript for grammatical errors, awkward phrasing, and style. Populate the 'grammarFeedback' field. If no errors, make it null.
            - Provide a 'correctedText' with the improved version of the full transcript.
            - List each 'incorrectPhrase', its 'correction', and a simple 'explanation' for the error.
            - **IMPORTANT**: For practice mode, the 'grammarFeedback' field in the JSON output MUST be null or omitted.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData: AiFeedback = JSON.parse(jsonText);
        
        if (parsedData.grammarFeedback && parsedData.grammarFeedback.errors.length === 0) {
            parsedData.grammarFeedback = null;
        }

        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get pronunciation feedback from AI.");
    }
};
