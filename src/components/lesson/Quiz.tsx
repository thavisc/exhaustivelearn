import React, { useState, useEffect, useCallback } from 'react';
import type { QuizStep } from '../../types/lesson';
import ReactMarkdown from 'react-markdown';

interface QuizProps {
    step: QuizStep;
    onComplete: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ step, onComplete }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = useCallback(() => {
        if (selectedOption !== null && !isSubmitted) {
            setIsSubmitted(true);
        }
    }, [selectedOption, isSubmitted]);

    const isCorrect = selectedOption === step.correctAnswerIndex;

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= step.options.length && !isSubmitted) {
                e.preventDefault();
                setSelectedOption(num - 1);
                return;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                if (isSubmitted) {
                    onComplete();
                } else if (selectedOption !== null) {
                    handleSubmit();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [step.options.length, isSubmitted, selectedOption, handleSubmit, onComplete]);

    const getOptionStyle = (idx: number): React.CSSProperties => {
        const base: React.CSSProperties = {
            padding: '1rem', paddingLeft: '1.25rem', borderRadius: '8px', textAlign: 'left',
            transition: 'all 0.2s', cursor: isSubmitted ? 'default' : 'pointer',
            border: '1px solid transparent', background: 'rgba(0,0,0,0.2)',
            color: 'inherit', width: '100%', fontSize: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
        };
        if (isSubmitted) {
            if (idx === step.correctAnswerIndex) return { ...base, background: 'rgba(34, 197, 94, 0.2)', borderColor: '#22c55e' };
            if (idx === selectedOption) return { ...base, background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' };
            return { ...base, opacity: 0.4 };
        }
        if (selectedOption === idx) return { ...base, background: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' };
        return base;
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '42rem', width: '100%', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{step.title}</h2>
            <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                <ReactMarkdown>{step.question}</ReactMarkdown>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {step.options.map((option, idx) => (
                    <button key={idx} onClick={() => !isSubmitted && setSelectedOption(idx)} style={getOptionStyle(idx)} disabled={isSubmitted}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '6px', fontSize: '0.75rem',
                            fontWeight: 700, flexShrink: 0,
                            background: selectedOption === idx ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}>
                            {idx + 1}
                        </span>
                        <span>{option}</span>
                    </button>
                ))}
            </div>

            {isSubmitted && (
                <div style={{
                    padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                    background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                    <h4 style={{ fontWeight: 'bold', color: isCorrect ? '#22c55e' : '#ef4444', marginBottom: '0.5rem' }}>
                        {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </h4>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{step.explanation}</p>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!isSubmitted ? (
                    <button className="btn" onClick={handleSubmit} disabled={selectedOption === null}>
                        Submit <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>Space</span>
                    </button>
                ) : (
                    <button className="btn" onClick={onComplete}>
                        Continue <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>Space</span>
                    </button>
                )}
            </div>
        </div>
    );
};
