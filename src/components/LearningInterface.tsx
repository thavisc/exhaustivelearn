import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import type { Lesson } from '../types/lesson';
import { LessonRunner } from './LessonRunner';
import { saveLesson, updateProgress, markComplete } from '../storage';

interface LearningInterfaceProps {
    extractedText: string;
    apiKey: string;
    filename: string;
}

const INPUT_COST_PER_1M = 2.50;
const OUTPUT_COST_PER_1M = 10.00;

export const LearningInterface: React.FC<LearningInterfaceProps> = ({ extractedText, apiKey, filename }) => {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [lessonId, setLessonId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const openaiRef = useRef<OpenAI | null>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        openaiRef.current = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });

        const generateLesson = async () => {
            if (hasStarted.current) return;
            hasStarted.current = true;
            setIsLoading(true);
            setError(null);
            try {
                const prompt = `
You are an elite university-level curriculum designer. Your job is to create an EXHAUSTIVE, COMPREHENSIVE interactive lesson that covers EVERY SINGLE TOPIC, SUBTOPIC, CONCEPT, DEFINITION, EXAMPLE, AND DETAIL from the lecture material below.

## CRITICAL RULES:
1. DO NOT SKIP ANYTHING. Every paragraph, every concept, every definition, every example in the source text must be covered.
2. The lesson must have MANY steps (aim for 30-60+ steps). A short lesson is a FAILURE.
3. Follow this pattern for EACH major concept:
   - First, an "explanation" step teaching the concept thoroughly
   - Then, a "flashcards" step with ALL key terms from that section (5-10 cards per deck)
   - Then, a "quiz" step testing understanding (4 options each)
   - Optionally, a "matching" step to reinforce connections (4-6 pairs)
4. After covering all individual topics, add a FINAL REVIEW section with:
   - A comprehensive flashcard deck of ALL major terms
   - Multiple challenging quiz questions that test cross-topic understanding
   - A matching exercise connecting concepts from different sections
5. Explanation content should be DETAILED markdown — use bullet points, bold terms, examples. Do NOT summarize; teach in full depth.
6. Quiz questions should have 4 options, not 2. Make wrong options plausible.
7. Flashcard decks should have at minimum 5 cards each.

## JSON FORMAT:
{
  "title": "Lesson Title",
  "steps": [
    { "id": "1", "type": "explanation", "title": "Section Title", "content": "Detailed markdown explanation..." },
    { "id": "2", "type": "flashcards", "title": "Key Terms", "deck": [{ "front": "Term", "back": "Full definition" }, ...] },
    { "id": "3", "type": "quiz", "title": "Check Understanding", "question": "Question text", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "Why this is correct..." },
    { "id": "4", "type": "matching", "title": "Match Concepts", "pairs": [{ "left": "Term", "right": "Definition" }, ...] }
  ]
}

## FULL LECTURE CONTENT (cover ALL of this):
${extractedText.substring(0, 80000)}
`;

                const completion = await openaiRef.current!.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a JSON generator. Output ONLY valid JSON. Your goal is to create the most thorough, exhaustive lesson possible. Never summarize — always teach in full detail. The lesson MUST have 30+ steps.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'gpt-4o',
                    max_tokens: 16384,
                    response_format: { type: "json_object" }
                });

                const content = completion.choices[0].message.content;
                if (!content) throw new Error("No content generated");

                let cost: number | null = null;
                if (completion.usage) {
                    const inputCost = (completion.usage.prompt_tokens / 1_000_000) * INPUT_COST_PER_1M;
                    const outputCost = (completion.usage.completion_tokens / 1_000_000) * OUTPUT_COST_PER_1M;
                    cost = inputCost + outputCost;
                }

                const generatedLesson: Lesson = JSON.parse(content);
                setLesson(generatedLesson);

                const id = saveLesson(generatedLesson, filename, cost);
                setLessonId(id);

            } catch (err: any) {
                console.error("Error generating lesson:", err);
                setError(err.message || "Failed to generate lesson");
            } finally {
                setIsLoading(false);
            }
        };

        generateLesson();
    }, [extractedText, apiKey, filename]);

    const handleProgressUpdate = (stepIndex: number) => {
        if (lessonId) updateProgress(lessonId, stepIndex);
    };

    const handleComplete = () => {
        if (lessonId) markComplete(lessonId);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', height: '100%' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    border: '3px solid transparent', borderTopColor: '#3b82f6', borderBottomColor: '#8b5cf6',
                    animation: 'spin 1s linear infinite', marginBottom: '1.5rem',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Building Your Comprehensive Lesson...</h2>
                <p style={{ color: '#94a3b8' }}>Analyzing every topic, generating flashcards, quizzes, and matching exercises. This may take 30-60 seconds.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'rgba(239,68,68,0.5)' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#ef4444', marginBottom: '1rem' }}>Generation Failed</h2>
                <p style={{ marginBottom: '1rem' }}>{error}</p>
                <button className="btn" onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <LessonRunner
            lesson={lesson}
            onExit={() => window.location.reload()}
            onStepChange={handleProgressUpdate}
            onComplete={handleComplete}
        />
    );
};
