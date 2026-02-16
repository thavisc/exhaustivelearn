import { useState, useEffect } from 'react';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUpload } from './components/FileUpload';
import { LearningInterface } from './components/LearningInterface';
import { LessonRunner } from './components/LessonRunner';
import {
    getSavedLessons, deleteLesson, renameLesson, updateProgress, markComplete,
    getFolders, createFolder, renameFolder, deleteFolder, moveLessonToFolder,
} from './storage';
import type { SavedLesson } from './storage';

type AppView = 'api-key' | 'menu' | 'upload' | 'generating' | 'resuming';

function App() {
    const [apiKey, setApiKey] = useState<string>('');
    const [view, setView] = useState<AppView>('api-key');
    const [extractedText, setExtractedText] = useState<string>('');
    const [filename, setFilename] = useState<string>('');
    const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [activeLesson, setActiveLesson] = useState<SavedLesson | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [movingLessonId, setMovingLessonId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('openai_api_key');
        if (stored) { setApiKey(stored); setView('menu'); }
    }, []);

    const refreshData = () => {
        setSavedLessons(getSavedLessons());
        setFolders(getFolders());
    };

    useEffect(() => {
        if (view === 'menu') {
            refreshData();
            setActiveLesson(null);
            setEditingId(null);
            setMovingLessonId(null);
        }
    }, [view]);

    const handleApiKeySet = (key: string) => { setApiKey(key); setView('menu'); };
    const handleUploadSuccess = (text: string, name: string) => { setExtractedText(text); setFilename(name); setView('generating'); };
    const handleResumeLesson = (saved: SavedLesson) => { setActiveLesson(saved); setView('resuming'); };

    const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteLesson(id);
        refreshData();
    };

    const handleStartRename = (saved: SavedLesson, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(saved.id);
        setEditingName(saved.displayName);
    };

    const handleFinishRename = (id: string) => {
        if (editingName.trim()) { renameLesson(id, editingName.trim()); refreshData(); }
        setEditingId(null);
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(newFolderName.trim());
            setExpandedFolders(prev => new Set([...prev, newFolderName.trim()]));
            refreshData();
        }
        setNewFolderName('');
        setShowNewFolder(false);
    };

    const handleRenameFolder = (oldName: string) => {
        if (editingFolderName.trim() && editingFolderName.trim() !== oldName) {
            renameFolder(oldName, editingFolderName.trim());
            refreshData();
        }
        setEditingFolderId(null);
    };

    const handleDeleteFolder = (name: string) => {
        deleteFolder(name);
        refreshData();
    };

    const handleMoveLesson = (lessonId: string, folder: string | null) => {
        moveLessonToFolder(lessonId, folder);
        setMovingLessonId(null);
        refreshData();
    };

    const toggleFolder = (name: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const goToMenu = () => { setView('menu'); setExtractedText(''); setFilename(''); setActiveLesson(null); };

    const formatCost = (cost: number | null) => {
        if (cost === null) return null;
        return cost < 0.01 ? '<$0.01' : `$${cost.toFixed(2)}`;
    };

    const renderLessonCard = (saved: SavedLesson) => {
        const progress = saved.isComplete ? 100 : Math.round((saved.currentStepIndex / saved.lesson.steps.length) * 100);
        const isEditing = editingId === saved.id;
        const isMoving = movingLessonId === saved.id;

        return (
            <div
                key={saved.id}
                className="glass-panel"
                style={{
                    padding: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => !isEditing && !isMoving && handleResumeLesson(saved)}
            >
                {/* Top row: name + action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                            <input autoFocus value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleFinishRename(saved.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(saved.id); if (e.key === 'Escape') setEditingId(null); }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(59,130,246,0.5)',
                                    borderRadius: '6px', padding: '0.25rem 0.5rem', color: 'inherit',
                                    fontSize: '0.9rem', fontWeight: 600, width: '100%', outline: 'none',
                                }}
                            />
                        ) : (
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {saved.displayName || saved.lesson.title}
                            </div>
                        )}
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                            <span>{saved.lesson.steps.length} steps</span>
                            <span>•</span>
                            <span>{saved.isComplete ? '✅ Done' : `${saved.currentStepIndex + 1}/${saved.lesson.steps.length}`}</span>
                            {saved.cost !== null && (<><span>•</span><span style={{ color: '#fbbf24' }}>{formatCost(saved.cost)}</span></>)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button className="btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.4rem', background: 'rgba(255,255,255,0.06)', minWidth: '32px' }}
                            onClick={(e) => { e.stopPropagation(); setMovingLessonId(isMoving ? null : saved.id); }} title="Move">📁</button>
                        <button className="btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.4rem', background: 'rgba(255,255,255,0.06)', minWidth: '32px' }}
                            onClick={(e) => handleStartRename(saved, e)} title="Rename">✏️</button>
                        <button className="btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.5rem' }}
                            onClick={(e) => { e.stopPropagation(); handleResumeLesson(saved); }}>
                            {saved.isComplete ? 'Review' : 'Resume'}
                        </button>
                        <button className="btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.4rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', minWidth: '28px' }}
                            onClick={(e) => handleDeleteLesson(saved.id, e)}>✕</button>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px', marginTop: '0.4rem', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: saved.isComplete ? '#22c55e' : 'linear-gradient(to right, #3b82f6, #8b5cf6)', borderRadius: '1px' }} />
                </div>

                {/* Move-to-folder picker */}
                {isMoving && (
                    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <button onClick={() => handleMoveLesson(saved.id, null)} style={{
                            fontSize: '0.7rem', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                            background: saved.folder === null ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'inherit',
                        }}>📋 Unfiled</button>
                        {folders.map(f => (
                            <button key={f} onClick={() => handleMoveLesson(saved.id, f)} style={{
                                fontSize: '0.7rem', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                                background: saved.folder === f ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.1)', color: 'inherit',
                            }}>📁 {f}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const unfiledLessons = savedLessons.filter(l => !l.folder);
    const getLessonsInFolder = (folder: string) => savedLessons.filter(l => l.folder === folder);

    return (
        <div className="app">
            {/* Header — compact on mobile */}
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)',
                flexWrap: 'wrap', gap: '0.5rem',
            }}>
                <h1 style={{
                    margin: 0, fontSize: 'clamp(1.2rem, 5vw, 2rem)',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    cursor: apiKey ? 'pointer' : 'default',
                }} onClick={() => apiKey && goToMenu()}>
                    Exhaustive<span style={{ fontWeight: 300 }}>Learn</span>
                </h1>
                {apiKey && view !== 'api-key' && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {view !== 'menu' && (
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', padding: '0.4rem 0.7rem' }} onClick={goToMenu}>← Menu</button>
                        )}
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', padding: '0.4rem 0.7rem' }}
                            onClick={() => { localStorage.removeItem('openai_api_key'); setApiKey(''); setView('api-key'); }}>
                            🔑 Clear
                        </button>
                    </div>
                )}
            </header>

            <main className="container">
                {view === 'api-key' && <ApiKeyInput onApiKeySet={handleApiKeySet} />}

                {view === 'menu' && (
                    <div style={{ width: '100%', maxWidth: '48rem', margin: '0 auto' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button className="btn" style={{
                                flex: 1, padding: '0.85rem', fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
                                border: '1px solid rgba(59,130,246,0.4)',
                            }} onClick={() => setView('upload')}>
                                📄 Upload Lecture
                            </button>
                            <button className="btn" style={{
                                padding: '0.85rem 1rem', fontSize: '0.9rem',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            }} onClick={() => setShowNewFolder(true)}>
                                📁+
                            </button>
                        </div>

                        {showNewFolder && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                                <input autoFocus placeholder="Folder name (e.g. COMP1000)"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); } }}
                                    style={{
                                        flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(59,130,246,0.4)',
                                        borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'inherit', fontSize: '16px', outline: 'none',
                                    }}
                                />
                                <button className="btn" onClick={handleCreateFolder} style={{ padding: '0.6rem 0.8rem' }}>Create</button>
                                <button className="btn" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                                    style={{ padding: '0.6rem 0.6rem', background: 'rgba(255,255,255,0.08)' }}>✕</button>
                            </div>
                        )}

                        {folders.map(folder => {
                            const folderLessons = getLessonsInFolder(folder);
                            const isExpanded = expandedFolders.has(folder);
                            const isEditingFolder = editingFolderId === folder;

                            return (
                                <div key={folder} style={{ marginBottom: '0.75rem' }}>
                                    <div
                                        onClick={() => toggleFolder(folder)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.6rem',
                                            cursor: 'pointer', borderRadius: '8px', background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)', marginBottom: isExpanded ? '0.4rem' : 0,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                        <span style={{ fontSize: '1rem' }}>📁</span>
                                        {isEditingFolder ? (
                                            <input autoFocus value={editingFolderName}
                                                onChange={(e) => setEditingFolderName(e.target.value)}
                                                onBlur={() => handleRenameFolder(folder)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder(folder); if (e.key === 'Escape') setEditingFolderId(null); }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(59,130,246,0.5)',
                                                    borderRadius: '4px', padding: '0.2rem 0.4rem', color: 'inherit',
                                                    fontSize: '16px', fontWeight: 600, outline: 'none', flex: 1,
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{folder}</span>
                                        )}
                                        <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{folderLessons.length}</span>
                                        <button className="btn" style={{ fontSize: '0.6rem', padding: '0.25rem 0.35rem', background: 'rgba(255,255,255,0.06)', minWidth: '28px' }}
                                            onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder); setEditingFolderName(folder); }} title="Rename">✏️</button>
                                        <button className="btn" style={{ fontSize: '0.6rem', padding: '0.25rem 0.35rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', minWidth: '28px' }}
                                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} title="Delete">✕</button>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {folderLessons.length === 0 && (
                                                <p style={{ opacity: 0.3, fontSize: '0.8rem', padding: '0.4rem 0' }}>Empty folder</p>
                                            )}
                                            {folderLessons.map(renderLessonCard)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {unfiledLessons.length > 0 && (
                            <div style={{ marginTop: folders.length > 0 ? '1rem' : 0 }}>
                                {folders.length > 0 && (
                                    <h3 style={{ fontSize: '0.8rem', opacity: 0.4, marginBottom: '0.5rem', fontWeight: 500 }}>Unfiled</h3>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {unfiledLessons.map(renderLessonCard)}
                                </div>
                            </div>
                        )}

                        {savedLessons.length === 0 && folders.length === 0 && (
                            <p style={{ textAlign: 'center', opacity: 0.4, marginTop: '2rem', fontSize: '0.9rem' }}>
                                No saved lessons yet. Upload a lecture to get started!
                            </p>
                        )}
                    </div>
                )}

                {view === 'upload' && <FileUpload onUploadSuccess={handleUploadSuccess} />}

                {view === 'generating' && (
                    <div style={{ width: '100%' }}>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1rem, 4vw, 1.5rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Learning: {filename}
                        </h2>
                        <LearningInterface extractedText={extractedText} apiKey={apiKey} filename={filename} />
                    </div>
                )}

                {view === 'resuming' && activeLesson && (
                    <div style={{ width: '100%' }}>
                        <LessonRunner
                            lesson={activeLesson.lesson}
                            initialStepIndex={activeLesson.currentStepIndex}
                            onExit={goToMenu}
                            onStepChange={(idx) => updateProgress(activeLesson.id, idx)}
                            onComplete={() => markComplete(activeLesson.id)}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
