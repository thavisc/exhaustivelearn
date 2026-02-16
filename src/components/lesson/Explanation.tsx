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
            if (e.code === 'Space') {
                e.preventDefault();
                onComplete();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onComplete]);

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '42rem', width: '100%', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {step.title}
            </h2>
            <div style={{ lineHeight: 1.8, marginBottom: '2rem' }}>
                <ReactMarkdown>{step.content}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onComplete}>
                    Next Step <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>Space</span>
                </button>
            </div>
        </div>
    );
};
