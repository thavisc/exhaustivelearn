import React, { useState, useRef, useEffect, useCallback } from 'react';
import OpenAI from 'openai';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatbotProps {
    apiKey: string;
    lectureText: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ apiKey, lectureText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const openaiRef = useRef<OpenAI | null>(null);

    useEffect(() => {
        openaiRef.current = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    }, [apiKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !openaiRef.current) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation with lecture context
            const contextText = lectureText.substring(0, 60000);
            const systemPrompt = `You are a helpful study assistant. You ONLY answer questions using the lecture material provided below. If a question is not covered by the lecture material, say "This topic isn't covered in the lecture material." Be concise but thorough. Use markdown formatting when helpful.

## LECTURE MATERIAL:
${contextText}`;

            const apiMessages = [
                { role: 'system' as const, content: systemPrompt },
                ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'user' as const, content: text },
            ];

            const completion = await openaiRef.current.chat.completions.create({
                messages: apiMessages,
                model: 'gpt-4o-mini',
                max_tokens: 1024,
            });

            const reply = completion.choices[0].message.content || 'Sorry, I couldn\'t generate a response.';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, lectureText]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Voice recording with Whisper
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(t => t.stop());

                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (blob.size === 0) return;

                setIsTranscribing(true);
                try {
                    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
                    const transcription = await openaiRef.current!.audio.transcriptions.create({
                        file,
                        model: 'whisper-1',
                    });

                    if (transcription.text.trim()) {
                        // Auto-send the transcribed text
                        sendMessage(transcription.text.trim());
                    }
                } catch (err: any) {
                    console.error('Whisper error:', err);
                    setMessages(prev => [...prev, { role: 'assistant', content: `Voice error: ${err.message}` }]);
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error('Mic error:', err);
            alert('Could not access microphone. Please allow microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: 'clamp(16px, 4vw, 24px)', right: 'clamp(16px, 4vw, 24px)',
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: isOpen ? 'rgba(239,68,68,0.8)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none', cursor: 'pointer', fontSize: '1.4rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 1000,
                    transition: 'all 0.3s', color: 'white',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: 'clamp(76px, 4vw, 88px)',
                    right: 'clamp(16px, 4vw, 24px)',
                    width: 'min(380px, calc(100vw - 32px))',
                    height: 'min(520px, calc(100dvh - 120px))',
                    borderRadius: '16px',
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                    zIndex: 999,
                    overflow: 'hidden',
                    animation: 'chatSlideUp 0.25s ease-out',
                }}>
                    <style>{`@keyframes chatSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                    {/* Header */}
                    <div style={{
                        padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>🤖</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0' }}>Lecture Assistant</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>Answers from your lecture only</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflow: 'auto', padding: '0.75rem',
                        display: 'flex', flexDirection: 'column', gap: '0.6rem',
                    }}>
                        {messages.length === 0 && (
                            <div style={{
                                textAlign: 'center', opacity: 0.3, fontSize: '0.8rem',
                                marginTop: '2rem', padding: '0 1rem',
                            }}>
                                Ask anything about your lecture! I'll only answer from the uploaded material.
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '0.5rem 0.75rem',
                                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                background: msg.role === 'user'
                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.35))'
                                    : 'rgba(255,255,255,0.06)',
                                border: '1px solid',
                                borderColor: msg.role === 'user' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                                fontSize: '0.82rem', lineHeight: 1.5, color: '#e2e8f0',
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{
                                alignSelf: 'flex-start', padding: '0.5rem 0.75rem',
                                borderRadius: '12px 12px 12px 2px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.82rem', color: '#94a3b8',
                            }}>
                                <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
                                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <form onSubmit={handleSubmit} style={{
                        padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', gap: '0.4rem', alignItems: 'center',
                    }}>
                        {/* Voice button */}
                        <button
                            type="button"
                            onClick={toggleRecording}
                            disabled={isTranscribing || isLoading}
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.2s',
                                background: isRecording ? 'rgba(239,68,68,0.4)' : isTranscribing ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)',
                                color: isRecording ? '#fca5a5' : isTranscribing ? '#fbbf24' : '#94a3b8',
                                animation: isRecording ? 'pulse 1s infinite' : 'none',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                opacity: (isTranscribing || isLoading) ? 0.4 : 1,
                            }}
                            title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice input'}
                        >
                            {isTranscribing ? '⏳' : '🎤'}
                        </button>

                        {/* Text input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isRecording ? 'Listening...' : isTranscribing ? 'Transcribing...' : 'Ask about the lecture...'}
                            disabled={isLoading || isRecording || isTranscribing}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px', padding: '0.5rem 0.75rem',
                                color: '#e2e8f0', fontSize: '0.82rem', outline: 'none',
                                fontFamily: 'inherit',
                            }}
                        />

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                background: input.trim() ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                                color: 'white', transition: 'all 0.2s',
                                opacity: (!input.trim() || isLoading) ? 0.3 : 1,
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            ↑
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};
