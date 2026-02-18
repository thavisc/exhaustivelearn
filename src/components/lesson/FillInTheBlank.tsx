import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { FillInTheBlankStep } from '../../types/lesson';

interface FillInTheBlankProps {
    step: FillInTheBlankStep;
    onComplete: () => void;
}

export const FillInTheBlank: React.FC<FillInTheBlankProps> = ({ step, onComplete }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const isCorrect = selectedOption === step.correctAnswer;

    // Shuffle options once on mount
    const shuffledOptions = useMemo(() => {
        return [...step.options].sort(() => Math.random() - 0.5);
    }, [step.options]);

    // Split sentence around ___BLANK___
    const parts = step.sentence.split(/___BLANK___|_____/);

    const handleSelect = (option: string) => {
        if (isSubmitted) return;
        setSelectedOption(option);
    };

    const handleSubmit = useCallback(() => {
        if (selectedOption && !isSubmitted) {
            setIsSubmitted(true);
        }
    }, [selectedOption, isSubmitted]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;
            const num = parseInt(e.key);
            if (num >= 1 && num <= Math.min(4, shuffledOptions.length) && !isSubmitted) {
                e.preventDefault();
                setSelectedOption(shuffledOptions[num - 1]);
                return;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                if (isSubmitted) {
                    onComplete();
                } else if (selectedOption) {
                    handleSubmit();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [shuffledOptions, isSubmitted, selectedOption, handleSubmit, onComplete]);

    const getOptionStyle = (option: string): React.CSSProperties => {
        const base: React.CSSProperties = {
            padding: 'clamp(0.5rem, 2.5vw, 0.75rem) clamp(0.75rem, 3vw, 1.25rem)',
            borderRadius: '20px', cursor: isSubmitted ? 'default' : 'pointer',
            border: '1px solid transparent', color: 'inherit',
            fontSize: 'clamp(0.8rem, 3.5vw, 0.95rem)', fontWeight: 500,
            transition: 'all 0.2s', display: 'inline-block',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        };

        if (isSubmitted) {
            if (option === step.correctAnswer) {
                return { ...base, background: 'rgba(34, 197, 94, 0.25)', borderColor: '#22c55e', color: '#86efac' };
            }
            if (option === selectedOption && !isCorrect) {
                return { ...base, background: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444', color: '#fca5a5', textDecoration: 'line-through' };
            }
            return { ...base, opacity: 0.3, background: 'rgba(255,255,255,0.05)' };
        }

        if (selectedOption === option) {
            return { ...base, background: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' };
        }
        return { ...base, background: 'rgba(255,255,255,0.08)' };
    };

    return (
        <div className="glass-panel" style={{
            padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '42rem', width: '100%', margin: '0 auto',
        }}>
            <h2 style={{
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', fontWeight: 'bold', marginBottom: '1rem',
                background: 'linear-gradient(to right, #f59e0b, #ef4444)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
                {step.title}
            </h2>

            {/* Sentence with blank */}
            <div style={{
                fontSize: 'clamp(1rem, 4vw, 1.2rem)', lineHeight: 1.8, marginBottom: '1.25rem',
                padding: 'clamp(0.75rem, 3vw, 1rem)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
            }}>
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            <span style={{
                                display: 'inline-block', minWidth: 'clamp(80px, 25vw, 140px)',
                                borderBottom: '2px solid',
                                borderColor: isSubmitted
                                    ? (isCorrect ? '#22c55e' : '#ef4444')
                                    : (selectedOption ? '#3b82f6' : 'rgba(255,255,255,0.3)'),
                                textAlign: 'center', fontWeight: 600, padding: '0 0.25rem',
                                color: isSubmitted
                                    ? (isCorrect ? '#86efac' : '#fca5a5')
                                    : '#93c5fd',
                                transition: 'all 0.2s',
                            }}>
                                {selectedOption || '?'}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {shuffledOptions.map((option) => (
                    <button key={option} onClick={() => handleSelect(option)} style={getOptionStyle(option)} disabled={isSubmitted}>
                        {option}
                    </button>
                ))}
            </div>

            {/* Feedback */}
            {isSubmitted && (
                <div style={{
                    padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', borderRadius: '8px', marginBottom: '1rem',
                    background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                    <span style={{ fontWeight: 'bold', color: isCorrect ? '#22c55e' : '#ef4444' }}>
                        {isCorrect ? '✅ Correct!' : `❌ Answer: ${step.correctAnswer}`}
                    </span>
                    {step.explanation && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: '0.5rem' }}>— {step.explanation}</span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!isSubmitted ? (
                    <button className="btn" onClick={handleSubmit} disabled={!selectedOption} style={{ padding: '0.6rem 1.25rem' }}>
                        Submit
                    </button>
                ) : (
                    <button className="btn" onClick={onComplete} style={{ padding: '0.6rem 1.25rem' }}>
                        Continue →
                    </button>
                )}
            </div>
        </div>
    );
};
