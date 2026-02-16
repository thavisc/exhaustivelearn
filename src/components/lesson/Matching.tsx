import React, { useState, useEffect } from 'react';
import type { MatchingStep } from '../../types/lesson';

interface MatchingProps {
    step: MatchingStep;
    onComplete: () => void;
}

export const Matching: React.FC<MatchingProps> = ({ step, onComplete }) => {
    const [items, setItems] = useState<{ id: string; text: string; type: 'left' | 'right' }[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const lefts = step.pairs.map((p, i) => ({ id: `L-${i}`, text: p.left, type: 'left' as const }));
        const rights = step.pairs.map((p, i) => ({ id: `R-${i}`, text: p.right, type: 'right' as const }));
        const shuffled = [...lefts, ...rights].sort(() => Math.random() - 0.5);
        setItems(shuffled);
    }, [step]);

    const handleSelect = (id: string) => {
        if (matchedIds.has(id)) return;

        if (!selectedId) {
            setSelectedId(id);
        } else {
            const first = items.find(i => i.id === selectedId);
            const second = items.find(i => i.id === id);

            if (first && second && first.type !== second.type) {
                const firstIdx = first.id.split('-')[1];
                const secondIdx = second.id.split('-')[1];

                if (firstIdx === secondIdx) {
                    const newMatched = new Set([...matchedIds, first.id, second.id]);
                    setMatchedIds(newMatched);
                    if (newMatched.size === items.length) {
                        setTimeout(onComplete, 800);
                    }
                }
            }
            setSelectedId(null);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: 'clamp(0.75rem, 3vw, 1.5rem)', maxWidth: '48rem', width: '100%', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: 'bold', marginBottom: '0.3rem', textAlign: 'center' }}>
                {step.title}
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>
                Tap two items to match them
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 45%), 1fr))',
                gap: '0.5rem',
            }}>
                {items.map((item) => {
                    const isMatched = matchedIds.has(item.id);
                    const isSelected = selectedId === item.id;

                    return (
                        <button key={item.id} onClick={() => handleSelect(item.id)} style={{
                            padding: 'clamp(0.6rem, 2.5vw, 1rem)', borderRadius: '8px',
                            fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', fontWeight: 500,
                            transition: 'all 0.2s', cursor: isMatched ? 'default' : 'pointer',
                            border: '1px solid transparent', color: 'inherit',
                            opacity: isMatched ? 0.3 : 1, pointerEvents: isMatched ? 'none' : 'auto',
                            background: isSelected ? 'rgba(59, 130, 246, 0.4)' : isMatched ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                            borderColor: isSelected ? '#3b82f6' : 'transparent',
                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            textAlign: 'center', wordBreak: 'break-word',
                        }} disabled={isMatched}>
                            {item.text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
