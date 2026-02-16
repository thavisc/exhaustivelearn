export type LessonStepType = 'explanation' | 'flashcards' | 'quiz' | 'matching' | 'fill-in-the-blank' | 'short-answer';

export interface BaseStep {
    id: string;
    type: LessonStepType;
    title: string;
}

export interface ExplanationStep extends BaseStep {
    type: 'explanation';
    content: string; // Markdown supported
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface FlashcardsStep extends BaseStep {
    type: 'flashcards';
    deck: Flashcard[];
}

export interface QuizOption {
    text: string;
    isCorrect: boolean;
}

export interface QuizStep extends BaseStep {
    type: 'quiz';
    question: string;
    options: string[]; // Simple string array for display
    correctAnswerIndex: number;
    explanation: string; // Shown after answering
}

export interface MatchPair {
    left: string;
    right: string;
}

export interface MatchingStep extends BaseStep {
    type: 'matching';
    pairs: MatchPair[];
}

export interface FillInTheBlankStep extends BaseStep {
    type: 'fill-in-the-blank';
    /** The sentence with ___BLANK___ marking where the answer goes */
    sentence: string;
    /** The correct answer to fill in the blank */
    correctAnswer: string;
    /** Distractor options (including the correct answer shuffled in) */
    options: string[];
    /** Brief explanation shown after answering */
    explanation: string;
}

export interface KeyPoint {
    point: string;
    marks: number;
}

export interface ShortAnswerStep extends BaseStep {
    type: 'short-answer';
    question: string;
    /** Model answer for display after submission */
    modelAnswer: string;
    /** Key points the student should mention, each worth marks */
    keyPoints: KeyPoint[];
    /** Total marks available (sum of all keyPoint marks) */
    totalMarks: number;
}

export type LessonStep = ExplanationStep | FlashcardsStep | QuizStep | MatchingStep | FillInTheBlankStep | ShortAnswerStep;

export interface Lesson {
    title: string;
    steps: LessonStep[];
}
