'use client';

import { useRef, useState, useCallback } from 'react';

interface ImageUploadProps {
  onAnalyze: (files: File[]) => void;
  loading: boolean;
}

export default function ImageUpload({ onAnalyze, loading }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    const combined = [...files, ...arr].slice(0, 5);
    setFiles(combined);
    const urls = combined.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }, [files]);

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    const urls = next.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (files.length > 0) onAnalyze(files);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OpenGuessr Solver</h1>
          <p className="text-gray-400">Upload 1–5 screenshots to identify the exact location</p>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-950/30'
              : 'border-gray-700 hover:border-gray-500 bg-gray-900'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="text-gray-400">
            <svg className="mx-auto mb-3 w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-lg font-medium text-gray-300">Drop screenshots here</p>
            <p className="text-sm mt-1">or click to browse · up to 5 images</p>
          </div>
        </div>

        {/* Thumbnails */}
        {previews.length > 0 && (
          <div className="mt-6 grid grid-cols-5 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || loading}
          className={`mt-6 w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            files.length === 0 || loading
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing location…
            </span>
          ) : (
            `Analyze Location${files.length > 0 ? ` (${files.length} image${files.length > 1 ? 's' : ''})` : ''}`
          )}
        </button>
      </div>
    </div>
  );
}
