import type { Lesson } from './types/lesson';

const STORAGE_KEY = 'exhaustivelearn_lessons';
const FOLDERS_KEY = 'exhaustivelearn_folders';

export interface SavedLesson {
    id: string;
    lesson: Lesson;
    displayName: string;
    folder: string | null;
    cost: number | null;
    sourceText: string | null;
    currentStepIndex: number;
    isComplete: boolean;
    createdAt: number;
    updatedAt: number;
}

function loadAll(): SavedLesson[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as any[];
        return parsed.map(l => ({
            ...l,
            displayName: l.displayName || l.lesson?.title || 'Untitled',
            cost: l.cost ?? null,
            folder: l.folder ?? null,
            sourceText: l.sourceText ?? null,
        }));
    } catch {
        return [];
    }
}

function saveAll(lessons: SavedLesson[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

// --- Folders ---

export function getFolders(): string[] {
    try {
        const raw = localStorage.getItem(FOLDERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function createFolder(name: string) {
    const folders = getFolders();
    if (!folders.includes(name)) {
        folders.push(name);
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }
}

export function renameFolder(oldName: string, newName: string) {
    const folders = getFolders().map(f => f === oldName ? newName : f);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    // Update all lessons in that folder
    const all = loadAll();
    all.forEach(l => { if (l.folder === oldName) l.folder = newName; });
    saveAll(all);
}

export function deleteFolder(name: string) {
    const folders = getFolders().filter(f => f !== name);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    // Move lessons back to unfiled
    const all = loadAll();
    all.forEach(l => { if (l.folder === name) l.folder = null; });
    saveAll(all);
}

export function moveLessonToFolder(lessonId: string, folder: string | null) {
    const all = loadAll();
    const entry = all.find(l => l.id === lessonId);
    if (entry) {
        entry.folder = folder;
        entry.updatedAt = Date.now();
        saveAll(all);
    }
}

// --- Lessons ---

export function getSavedLessons(): SavedLesson[] {
    return loadAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveLesson(lesson: Lesson, filename: string, cost: number | null, sourceText: string | null = null): string {
    const all = loadAll();
    const id = `lesson_${Date.now()}`;
    const displayName = filename.replace(/\.[^/.]+$/, '');
    all.push({
        id,
        lesson,
        displayName,
        folder: null,
        cost,
        sourceText,
        currentStepIndex: 0,
        isComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
    saveAll(all);
    return id;
}

export function getLectureText(id: string): string | null {
    const all = loadAll();
    const entry = all.find(l => l.id === id);
    return entry?.sourceText ?? null;
}

export function renameLesson(id: string, newName: string) {
    const all = loadAll();
    const entry = all.find(l => l.id === id);
    if (entry) {
        entry.displayName = newName;
        entry.updatedAt = Date.now();
        saveAll(all);
    }
}

export function updateProgress(id: string, stepIndex: number) {
    const all = loadAll();
    const entry = all.find(l => l.id === id);
    if (entry) {
        entry.currentStepIndex = stepIndex;
        entry.updatedAt = Date.now();
        saveAll(all);
    }
}

export function markComplete(id: string) {
    const all = loadAll();
    const entry = all.find(l => l.id === id);
    if (entry) {
        entry.isComplete = true;
        entry.updatedAt = Date.now();
        saveAll(all);
    }
}

export function deleteLesson(id: string) {
    const all = loadAll().filter(l => l.id !== id);
    saveAll(all);
}
