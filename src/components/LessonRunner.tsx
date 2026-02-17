import React, { useState } from 'react';
import type { Lesson, LessonStep } from '../types/lesson';
import { Explanation } from './lesson/Explanation';
import { Flashcards } from './lesson/Flashcards';
import { Quiz } from './lesson/Quiz';
import { Matching } from './lesson/Matching';
import { FillInTheBlank } from './lesson/FillInTheBlank';
import { ShortAnswer } from './lesson/ShortAnswer';

interface LessonRunnerProps {
    lesson: Lesson;
    onExit: () => void;
    initialStepIndex?: number;
    onStepChange?: (stepIndex: number) => void;
    onComplete?: () => void;
}

export const LessonRunner: React.FC<LessonRunnerProps> = ({
    lesson, onExit, initialStepIndex = 0, onStepChange, onComplete,
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
    const [isComplete, setIsComplete] = useState(false);

    const handleNext = () => {
        if (currentStepIndex < lesson.steps.length - 1) {
            const next = currentStepIndex + 1;
            setCurrentStepIndex(next);
            onStepChange?.(next);
        } else {
            setIsComplete(true);
            onComplete?.();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            const prev = currentStepIndex - 1;
            setCurrentStepIndex(prev);
            onStepChange?.(prev);
        }
    };

    if (isComplete) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', padding: '2rem 1rem',
                minHeight: '60vh',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h2 style={{
                    fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 'bold', marginBottom: '0.75rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Lesson Complete!
                </h2>
                <p style={{ fontSize: '1rem', opacity: 0.7, marginBottom: '1.5rem' }}>
                    You completed <strong style={{ color: '#93c5fd' }}>{lesson.title}</strong>
                </p>
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', maxWidth: '320px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                        <span>Steps</span>
                        <span style={{ fontWeight: 'bold' }}>{lesson.steps.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Status</span>
                        <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Mastered</span>
                    </div>
                </div>
                <button className="btn" style={{ fontSize: '1rem', padding: '0.7rem 2rem' }} onClick={onExit}>
                    Return to Menu
                </button>
            </div>
        );
    }

    const currentStep = lesson.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / lesson.steps.length) * 100;

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '70dvh' }}>
            {/* Progress bar + back */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={handleBack} disabled={currentStepIndex === 0} style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    color: currentStepIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    padding: '0.3rem 0.6rem', borderRadius: '6px',
                    cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                    ←
                </button>
                <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.1)', height: '4px',
                    borderRadius: '2px', overflow: 'hidden',
                }}>
                    <div style={{
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        height: '100%', width: `${progress}%`,
                        transition: 'width 0.5s ease', borderRadius: '2px',
                    }} />
                </div>
                <span style={{ fontSize: '0.7rem', opacity: 0.4, flexShrink: 0, fontFamily: 'monospace' }}>
                    {currentStepIndex + 1}/{lesson.steps.length}
                </span>
            </div>

            <div key={currentStep.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {renderStep(currentStep, handleNext)}
            </div>
        </div>
    );
};

const renderStep = (step: LessonStep, onComplete: () => void) => {
    // Normalize: GPT sometimes uses underscores or spaces instead of hyphens
    const raw = step.type.replace(/[_ ]/g, '-').toLowerCase();
    // Map GPT-invented types to closest real type
    const typeAliases: Record<string, string> = {
        'final-review': 'explanation', 'review': 'explanation', 'summary': 'explanation',
        'multiple-choice': 'quiz', 'mcq': 'quiz',
        'match': 'matching', 'drag-and-drop': 'matching',
        'fill-in-the-blanks': 'fill-in-the-blank', 'fill-blank': 'fill-in-the-blank', 'cloze': 'fill-in-the-blank',
        'free-response': 'short-answer', 'long-answer': 'short-answer', 'open-ended': 'short-answer',
    };
    const type = typeAliases[raw] || raw;

    switch (type) {
        case 'explanation': return <Explanation step={step as any} onComplete={onComplete} />;
        case 'flashcards': return <Flashcards step={step as any} onComplete={onComplete} />;
        case 'quiz': return <Quiz step={step as any} onComplete={onComplete} />;
        case 'matching': return <Matching step={step as any} onComplete={onComplete} />;
        case 'fill-in-the-blank': return <FillInTheBlank step={step as any} onComplete={onComplete} />;
        case 'short-answer': return <ShortAnswer step={step as any} onComplete={onComplete} />;
        default:
            console.warn('Unknown step type:', step.type);
            // Skip unknown steps automatically
            return (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '42rem', width: '100%', margin: '0 auto' }}>
                    <p style={{ opacity: 0.5, marginBottom: '1rem' }}>Step type "{step.type}" not supported</p>
                    <button className="btn" onClick={onComplete}>Skip →</button>
                </div>
            );
    }
};
