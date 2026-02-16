import React, { useState, useEffect, useCallback } from 'react';
import type { FlashcardsStep } from '../../types/lesson';

interface FlashcardsProps {
    step: FlashcardsStep;
    onComplete: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ step, onComplete }) => {
    const [remaining, setRemaining] = useState<number[]>(() =>
        step.deck.map((_, i) => i)
    );
    const [currentPos, setCurrentPos] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const currentCardIndex = remaining[currentPos];
    const currentCard = currentCardIndex !== undefined ? step.deck[currentCardIndex] : null;
    const totalRemaining = remaining.length;

    const flip = useCallback(() => {
        if (!currentCard) return;
        setIsFlipped(prev => !prev);
    }, [currentCard]);

    const markAgain = useCallback(() => {
        if (!isFlipped || !currentCard) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentPos(prev => (prev + 1) % remaining.length);
        }, 100);
    }, [isFlipped, currentCard, remaining.length]);

    const markDone = useCallback(() => {
        if (!isFlipped || !currentCard) return;
        setIsFlipped(false);
        setTimeout(() => {
            const newRemaining = remaining.filter((_, i) => i !== currentPos);
            if (newRemaining.length === 0) {
                onComplete();
                return;
            }
            setRemaining(newRemaining);
            setCurrentPos(prev => prev >= newRemaining.length ? 0 : prev);
        }, 100);
    }, [isFlipped, currentCard, remaining, currentPos, onComplete]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isFlipped) flip();
            } else if (e.code === 'Digit1') {
                e.preventDefault();
                markAgain();
            } else if (e.code === 'Digit2') {
                e.preventDefault();
                markDone();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [flip, markAgain, markDone, isFlipped]);

    if (!currentCard) return null;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '1.5rem', width: '100%', maxWidth: '42rem', margin: '0 auto',
        }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
                {step.title}
            </h2>
            <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {totalRemaining} card{totalRemaining !== 1 ? 's' : ''} remaining
            </p>

            <div onClick={flip} style={{ perspective: '1000px', width: '100%', height: '280px', cursor: 'pointer', marginBottom: '2rem' }}>
                <div style={{
                    position: 'relative', width: '100%', height: '100%',
                    transition: 'transform 0.5s', transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>
                    <div className="glass-panel" style={{
                        position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '2rem', textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold',
                        overflow: 'auto', boxSizing: 'border-box',
                    }}>
                        <span>{currentCard.front}</span>
                        <span style={{ position: 'absolute', bottom: '0.75rem', fontSize: '0.7rem', opacity: 0.4 }}>
                            Press Space to flip
                        </span>
                    </div>
                    <div className="glass-panel" style={{
                        position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '2rem', textAlign: 'center', fontSize: '1.1rem',
                        background: 'rgba(59, 130, 246, 0.12)', overflow: 'auto', boxSizing: 'border-box',
                    }}>
                        <span>{currentCard.back}</span>
                    </div>
                </div>
            </div>

            {isFlipped ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 100 }}>
                    <button onClick={(e) => { e.stopPropagation(); markAgain(); }} style={{
                        background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5', padding: '0.75rem 2rem', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
                    }}>
                        Again <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>1</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); markDone(); }} style={{
                        background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: '#86efac', padding: '0.75rem 2rem', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
                    }}>
                        Done <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>2</span>
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 100 }}>
                    <button onClick={(e) => { e.stopPropagation(); flip(); }} style={{
                        background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#93c5fd', padding: '0.75rem 2.5rem', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
                    }}>
                        Show Answer <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.5rem' }}>Space</span>
                    </button>
                </div>
            )}
        </div>
    );
};
