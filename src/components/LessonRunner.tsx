import React, { useState } from 'react';
import type { Lesson, LessonStep } from '../types/lesson';
import { Explanation } from './lesson/Explanation';
import { Flashcards } from './lesson/Flashcards';
import { Quiz } from './lesson/Quiz';
import { Matching } from './lesson/Matching';

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
                justifyContent: 'center', height: '100%', textAlign: 'center', padding: '2rem',
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{
                    fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Lesson Complete!
                </h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '2rem' }}>
                    You have successfully completed {lesson.title}.
                </p>
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '400px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Steps Completed</span>
                        <span style={{ fontWeight: 'bold' }}>{lesson.steps.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Status</span>
                        <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Mastered</span>
                    </div>
                </div>
                <button className="btn" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }} onClick={onExit}>
                    Return to Menu
                </button>
            </div>
        );
    }

    const currentStep = lesson.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / lesson.steps.length) * 100;

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
            {/* Progress Bar + Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <button onClick={handleBack} disabled={currentStepIndex === 0} style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    color: currentStepIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    padding: '0.35rem 0.75rem', borderRadius: '6px',
                    cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s',
                }}>
                    ← Back
                </button>
                <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.1)', height: '6px',
                    borderRadius: '3px', overflow: 'hidden',
                }}>
                    <div style={{
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        height: '100%', width: `${progress}%`,
                        transition: 'width 0.5s ease', borderRadius: '3px',
                    }} />
                </div>
            </div>

            <div key={currentStep.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {renderStep(currentStep, handleNext)}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
                Step {currentStepIndex + 1} of {lesson.steps.length} • {lesson.title}
            </div>
        </div>
    );
};

const renderStep = (step: LessonStep, onComplete: () => void) => {
    switch (step.type) {
        case 'explanation': return <Explanation step={step} onComplete={onComplete} />;
        case 'flashcards': return <Flashcards step={step} onComplete={onComplete} />;
        case 'quiz': return <Quiz step={step} onComplete={onComplete} />;
        case 'matching': return <Matching step={step as any} onComplete={onComplete} />;
        default: return <div>Unknown step type</div>;
    }
};
