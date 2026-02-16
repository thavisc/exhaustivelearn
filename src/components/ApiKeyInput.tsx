import React, { useState, useEffect } from 'react';

interface ApiKeyInputProps {
    onApiKeySet: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
    const [key, setKey] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('openai_api_key');
        if (stored) {
            onApiKeySet(stored);
        }
    }, [onApiKeySet]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            localStorage.setItem('openai_api_key', key.trim());
            onApiKeySet(key.trim());
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '28rem', width: '100%', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Enter OpenAI API Key</h2>
            <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Your key is stored locally in your browser and never sent to our servers.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                    type="password"
                    placeholder="sk-..."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px', padding: '0.7rem 1rem', color: 'inherit', fontSize: '0.95rem',
                        outline: 'none', fontFamily: 'monospace',
                    }}
                />
                <button className="btn" type="submit" disabled={!key.trim()}>
                    Save & Continue
                </button>
            </form>
        </div>
    );
};
