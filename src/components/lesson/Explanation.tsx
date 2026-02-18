import React, { useEffect } from 'react';
import type { ExplanationStep } from '../../types/lesson';
import ReactMarkdown from 'react-markdown';

interface ExplanationProps {
    step: ExplanationStep;
    onComplete: () => void;
}

export const Explanation: React.FC<ExplanationProps> = ({ step, onComplete }) => {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;
            if (e.code === 'Space') {
                e.preventDefault();
                onComplete();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onComplete]);

    return (
        <div className="glass-panel" style={{ padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '42rem', width: '100%', margin: '0 auto' }}>
            <h2 style={{
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 'bold', marginBottom: '0.75rem',
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
                {step.title}
            </h2>
            <div style={{ lineHeight: 1.7, marginBottom: '1.5rem', fontSize: 'clamp(0.85rem, 3.5vw, 1rem)' }}>
                <ReactMarkdown>{step.content}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onComplete} style={{ padding: '0.6rem 1.25rem' }}>
                    Next →
                </button>
            </div>
        </div>
    );
};
