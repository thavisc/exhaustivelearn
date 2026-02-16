import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).toString();

interface FileUploadProps {
    onUploadSuccess: (text: string, filename: string) => void;
}

async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
        pages.push(pageText);
    }

    return pages.join('\n\n');
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.name.match(/\.pdf$/i)) {
            setError('Please upload a PDF file.');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const text = await extractTextFromPdf(file);
            if (!text.trim()) {
                throw new Error('Could not extract any text from this PDF. It might be image-based (scanned).');
            }
            onUploadSuccess(text, file.name);
        } catch (err: any) {
            console.error('PDF parsing error:', err);
            setError(err.message || 'Failed to parse PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div style={{ maxWidth: '32rem', width: '100%', margin: '0 auto' }}>
            <div
                className="glass-panel"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                style={{
                    padding: '3rem 2rem', textAlign: 'center', cursor: isProcessing ? 'wait' : 'pointer',
                    borderColor: isDragging ? '#3b82f6' : undefined,
                    background: isDragging ? 'rgba(59,130,246,0.1)' : undefined,
                    transition: 'all 0.2s',
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isProcessing ? '⏳' : '📄'}</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {isProcessing ? 'Extracting text from PDF...' : 'Drop your lecture PDF here'}
                </h2>
                <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>
                    {isProcessing ? 'This should only take a few seconds' : 'or click to browse'}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
            </div>
            {error && (
                <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>
            )}
        </div>
    );
};
