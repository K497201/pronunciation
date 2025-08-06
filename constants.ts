
import type { PracticeCategories } from './types';

export const PRACTICE_CATEGORIES: PracticeCategories = {
    "Common Phrases": [
        "How are you doing today?",
        "Can you help me with this?",
        "I'm looking forward to the meeting.",
        "The price of the ticket is twenty dollars.",
        "Where is the nearest train station?",
        "Could you please repeat that?",
        "I would like to order a cup of coffee."
    ],
    "Tongue Twisters": [
        "The quick brown fox jumps over the lazy dog.",
        "She sells seashells by the seashore.",
        "Peter Piper picked a peck of pickled peppers.",
        "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
        "The sixth sick sheikh's sixth sheep's sick.",
        "Red lorry, yellow lorry.",
        "Unique New York, unique New York."
    ],
    "Vowel Practice": [
        "The rain in Spain stays mainly in the plain.",
        "A proper cup of coffee from a proper copper coffee pot.",
        "I saw a kitten eating chicken in the kitchen.",
        "Go slow over the road.",
        "The fat cat sat on the mat."
    ],
    "Consonant Challenge": [
        "He threw three free throws.",
        "World wide web is a complex system of interconnected networks.",
        "Crisp crackers crackle crunchily.",
        "The great Greek grape growers grow great Greek grapes."
    ],
    "Custom Subject": []
};

export const INTERVIEW_CATEGORIES: { [key: string]: string[] } = {
    "Behavioral (STAR Method)": [
        "Tell me about a time you had to handle a conflict with a coworker.",
        "Describe a situation where you had to learn a new skill quickly.",
        "Give an example of a time you failed. What did you learn from it?",
        "Tell me about a time you showed leadership.",
        "Describe a time when you had to work under a tight deadline."
    ],
    "General & Motivational": [
        "What are your biggest strengths and weaknesses?",
        "Where do you see yourself in five years?",
        "Why do you want to work for this company?",
        "What are you looking for in a new position?",
        "Why should we hire you?"
    ],
    "Problem-Solving & Technical": [
        "How would you handle a situation where you are asked to do something you've never done before?",
        "Describe a complex project you worked on. What was your role?",
        "How do you prioritize your work when you have multiple competing deadlines?",
        "Explain a complex technical concept to a non-technical audience.",
        "Walk me through your resume."
    ]
};

export const FILLER_WORDS: string[] = [
    'um', 'uh', 'er', 'ah', 'like', 'actually', 'basically', 'seriously', 
    'you know', 'i mean', 'okay', 'so', 'right', 'well'
];
