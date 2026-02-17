import React, { useState, useEffect, useCallback } from 'react';
import type { MatchingStep } from '../../types/lesson';

interface MatchingProps {
    step: MatchingStep;
    onComplete: () => void;
}

const KEYS = '12345678';

export const Matching: React.FC<MatchingProps> = ({ step, onComplete }) => {
    const [items, setItems] = useState<{ id: string; text: string; type: 'left' | 'right'; key: string }[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);

    useEffect(() => {
        // Cap at 4 pairs (8 tiles) so number keys 1-8 always work
        const pairs = step.pairs.slice(0, 4);
        const lefts = pairs.map((p, i) => ({ id: `L-${i}`, text: p.left, type: 'left' as const, key: '' }));
        const rights = pairs.map((p, i) => ({ id: `R-${i}`, text: p.right, type: 'right' as const, key: '' }));
        const shuffled = [...lefts, ...rights].sort(() => Math.random() - 0.5);
        // Assign number keys
        shuffled.forEach((item, i) => { item.key = KEYS[i] || ''; });
        setItems(shuffled);
    }, [step]);

    const handleSelect = useCallback((id: string) => {
        if (matchedIds.has(id)) return;
        setWrongPair(null);

        if (!selectedId) {
            setSelectedId(id);
        } else {
            if (selectedId === id) {
                // Deselect if same item clicked
                setSelectedId(null);
                return;
            }

            const first = items.find(i => i.id === selectedId);
            const second = items.find(i => i.id === id);

            if (first && second && first.type !== second.type) {
                const firstIdx = first.id.split('-')[1];
                const secondIdx = second.id.split('-')[1];

                if (firstIdx === secondIdx) {
                    // Correct match
                    const newMatched = new Set([...matchedIds, first.id, second.id]);
                    setMatchedIds(newMatched);
                    if (newMatched.size === items.length) {
                        setTimeout(onComplete, 800);
                    }
                } else {
                    // Wrong match — flash red briefly
                    setWrongPair([first.id, second.id]);
                    setTimeout(() => setWrongPair(null), 600);
                }
            } else if (first && second && first.type === second.type) {
                // Same type — flash briefly
                setWrongPair([first.id, second.id]);
                setTimeout(() => setWrongPair(null), 600);
            }
            setSelectedId(null);
        }
    }, [selectedId, items, matchedIds, onComplete]);

    // Keyboard shortcuts: press a letter to select/match
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const item = items.find(i => i.key === e.key && !matchedIds.has(i.id));
            if (item) {
                e.preventDefault();
                handleSelect(item.id);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [items, matchedIds, handleSelect]);

    const getItemStyle = (item: { id: string; key: string }): React.CSSProperties => {
        const isMatched = matchedIds.has(item.id);
        const isSelected = selectedId === item.id;
        const isWrong = wrongPair?.includes(item.id);

        const base: React.CSSProperties = {
            padding: 'clamp(0.6rem, 2.5vw, 1rem)', borderRadius: '8px',
            fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', fontWeight: 500,
            transition: 'all 0.2s', cursor: isMatched ? 'default' : 'pointer',
            border: '1px solid transparent', color: 'inherit',
            pointerEvents: isMatched ? 'none' : 'auto',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            textAlign: 'center' as const, wordBreak: 'break-word' as const,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            justifyContent: 'center', position: 'relative' as const,
        };

        if (isMatched) {
            return { ...base, opacity: 0.25, background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34,197,94,0.3)' };
        }
        if (isWrong) {
            return { ...base, background: 'rgba(239, 68, 68, 0.3)', borderColor: '#ef4444', transform: 'scale(0.97)' };
        }
        if (isSelected) {
            return { ...base, background: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', transform: 'scale(1.03)' };
        }
        return { ...base, background: 'rgba(255,255,255,0.08)' };
    };

    return (
        <div className="glass-panel" style={{ padding: 'clamp(0.75rem, 3vw, 1.5rem)', maxWidth: '48rem', width: '100%', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: 'bold', marginBottom: '0.3rem', textAlign: 'center' }}>
                {step.title}
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>
                Tap or press letter keys to match pairs
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 45%), 1fr))',
                gap: '0.5rem',
            }}>
                {items.map((item) => (
                    <button key={item.id} onClick={() => handleSelect(item.id)} style={getItemStyle(item)} disabled={matchedIds.has(item.id)}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '20px', height: '20px', borderRadius: '5px', fontSize: '0.7rem',
                            fontWeight: 700, flexShrink: 0,
                            background: selectedId === item.id ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            opacity: matchedIds.has(item.id) ? 0.3 : 0.7,
                            fontFamily: 'monospace',
                        }}>
                            {item.key}
                        </span>
                        <span>{item.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
