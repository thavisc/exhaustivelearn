export type LessonStepType = 'explanation' | 'flashcards' | 'quiz' | 'matching';

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

export type LessonStep = ExplanationStep | FlashcardsStep | QuizStep | MatchingStep;

export interface Lesson {
    title: string;
    steps: LessonStep[];
}
