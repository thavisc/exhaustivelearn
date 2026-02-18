import React, { useState, useEffect, useCallback } from 'react';
import type { ShortAnswerStep } from '../../types/lesson';

interface ShortAnswerProps {
    step: ShortAnswerStep;
    onComplete: () => void;
}

export const ShortAnswer: React.FC<ShortAnswerProps> = ({ step, onComplete }) => {
    const [answer, setAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [matchedPoints, setMatchedPoints] = useState<boolean[]>([]);
    const [score, setScore] = useState(0);

    const handleSubmit = useCallback(() => {
        if (!answer.trim()) return;

        // Simple keyword matching — check if user's answer mentions each key point
        const lowerAnswer = answer.toLowerCase();
        const results = step.keyPoints.map((kp) => {
            // Extract meaningful keywords from the key point
            const keywords = kp.point.toLowerCase()
                .split(/[\s,;]+/)
                .filter(w => w.length > 3) // skip small words
                .filter(w => !['that', 'this', 'with', 'from', 'they', 'their', 'have', 'been', 'will', 'would', 'could', 'should', 'which', 'where', 'when', 'than', 'then', 'also', 'into', 'each', 'both', 'some', 'such', 'these', 'those', 'about', 'more', 'most', 'between'].includes(w));

            // A point is "matched" if enough key terms appear in the answer
            const matchCount = keywords.filter(kw => lowerAnswer.includes(kw)).length;
            const threshold = Math.max(1, Math.ceil(keywords.length * 0.4));
            return matchCount >= threshold;
        });

        setMatchedPoints(results);
        const totalScore = results.reduce((sum, matched, i) => sum + (matched ? step.keyPoints[i].marks : 0), 0);
        setScore(totalScore);
        setIsSubmitted(true);
    }, [answer, step.keyPoints]);

    const handleSkip = () => {
        onComplete();
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Don't trigger shortcuts while typing in textarea
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (isSubmitted) {
                    onComplete();
                } else if (answer.trim()) {
                    handleSubmit();
                } else {
                    // Skip if no answer typed
                    onComplete();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isSubmitted, answer, handleSubmit, onComplete]);

    const scorePercent = step.totalMarks > 0 ? Math.round((score / step.totalMarks) * 100) : 0;
    const scoreColor = scorePercent >= 70 ? '#22c55e' : scorePercent >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="glass-panel" style={{
            padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '42rem', width: '100%', margin: '0 auto',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                <h2 style={{
                    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', fontWeight: 'bold', margin: 0,
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    {step.title}
                </h2>
                <span style={{
                    fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)', opacity: 0.5, flexShrink: 0,
                }}>
                    {step.totalMarks} mark{step.totalMarks !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Question */}
            <p style={{
                fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', lineHeight: 1.7, marginBottom: '1rem',
            }}>
                {step.question}
            </p>

            {!isSubmitted ? (
                <>
                    {/* Text area */}
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={5}
                        style={{
                            width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px', padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', color: 'inherit',
                            fontSize: '16px', fontFamily: 'inherit', lineHeight: 1.6,
                            outline: 'none', resize: 'vertical', marginBottom: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={handleSkip} style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}>
                            Skip →
                        </button>
                        <button className="btn" onClick={handleSubmit} disabled={!answer.trim()} style={{ padding: '0.6rem 1.25rem' }}>
                            Submit Answer
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Score */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem',
                        padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', borderRadius: '8px',
                        background: `rgba(${scorePercent >= 70 ? '34,197,94' : scorePercent >= 40 ? '245,158,11' : '239,68,68'}, 0.1)`,
                    }}>
                        <div style={{
                            fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 'bold', color: scoreColor,
                        }}>
                            {score}/{step.totalMarks}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            {scorePercent >= 70 ? 'Great work! 🎉' : scorePercent >= 40 ? 'Good effort! Review the key points below.' : 'Keep studying! Check the model answer below.'}
                        </div>
                    </div>

                    {/* Your answer */}
                    <div style={{
                        padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)', marginBottom: '0.75rem',
                    }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</div>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{answer}</p>
                    </div>

                    {/* Key points checklist */}
                    <div style={{
                        padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)', marginBottom: '0.75rem',
                    }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Points</div>
                        {step.keyPoints.map((kp, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                                padding: '0.35rem 0', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                            }}>
                                <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>
                                    {matchedPoints[idx] ? '✅' : '❌'}
                                </span>
                                <span style={{
                                    flex: 1,
                                    color: matchedPoints[idx] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                }}>
                                    {kp.point}
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '0.3rem' }}>
                                        ({kp.marks} mark{kp.marks !== 1 ? 's' : ''})
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Model answer */}
                    <div style={{
                        padding: 'clamp(0.6rem, 2.5vw, 0.85rem)', borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                        marginBottom: '1rem',
                    }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Answer</div>
                        <p style={{ fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', lineHeight: 1.6 }}>{step.modelAnswer}</p>
                    </div>

                    {/* Continue */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={onComplete} style={{ padding: '0.6rem 1.25rem' }}>
                            Continue →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
