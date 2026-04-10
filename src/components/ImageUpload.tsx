'use client';

import { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  onAnalyze: (files: File[]) => void;
  loading: boolean;
}

const MAX_FILES = 5;
const LOADING_POINTS = [
  { top: '14%', left: '12%', delay: '0s', duration: '10s' },
  { top: '28%', left: '76%', delay: '1.2s', duration: '13s' },
  { top: '42%', left: '18%', delay: '2.3s', duration: '11s' },
  { top: '58%', left: '64%', delay: '0.8s', duration: '12s' },
  { top: '70%', left: '24%', delay: '1.8s', duration: '14s' },
  { top: '82%', left: '82%', delay: '2.8s', duration: '10s' },
];

function LoadingOverlay({ imageCount }: { imageCount: number }) {
  return (
    <div className="loading-overlay fade-in">
      <div className="loading-scene" aria-hidden="true">
        <div className="loading-aurora loading-aurora-1" />
        <div className="loading-aurora loading-aurora-2" />
        <div className="loading-grid" />
        {LOADING_POINTS.map((point, index) => (
          <span
            key={index}
            className="loading-point"
            style={{
              top: point.top,
              left: point.left,
              animationDelay: point.delay,
              animationDuration: point.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/75">
                Arya Vora
              </p>
              <p className="mt-2 text-sm text-slate-300">Made by Arya Vora</p>
            </div>
            <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              {imageCount} {imageCount === 1 ? 'frame' : 'frames'} queued
            </div>
          </div>

          <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <div className="loading-ring loading-ring-1" />
            <div className="loading-ring loading-ring-2" />
            <div className="loading-ring loading-ring-3" />
            <div className="loading-core">
              <div className="loading-beam" />
              <div className="loading-dot-row">
                <span className="loading-dot loading-dot-1" />
                <span className="loading-dot loading-dot-2" />
                <span className="loading-dot loading-dot-3" />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Reading your screenshots
            </h2>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">
              Pulling visual clues, mapping geography, and narrowing the exact spot before the result view loads.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300">
            <p className="font-medium text-slate-100">Processing now</p>
            <p className="mt-1">
              The solver is comparing roads, signs, terrain, and architecture across every frame you uploaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageUpload({ onAnalyze, loading }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const browseInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const addFiles = (newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    setFiles((currentFiles) => [...currentFiles, ...imageFiles].slice(0, MAX_FILES));
  };

  const removeFile = (index: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      onAnalyze(files);
    }
  };

  return (
    <>
      <main className="upload-shell">
        <div className="upload-ambient" aria-hidden="true">
          <div className="upload-ambient-orb upload-ambient-orb-1" />
          <div className="upload-ambient-orb upload-ambient-orb-2" />
          <div className="upload-grid" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:p-8">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/75">
                  Arya Vora
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  OpenGuessr Solver
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Drop in screenshots or shoot fresh ones from your phone. This build is made by Arya Vora and tuned for quick mobile-first location solving.
                </p>
              </div>

              <div
                className={`mt-8 rounded-[1.75rem] border p-5 transition duration-300 sm:p-6 ${
                  dragging
                    ? 'border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(103,232,249,0.2)]'
                    : 'border-white/10 bg-white/5'
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
              >
                <input
                  ref={browseInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      addFiles(event.target.files);
                      event.target.value = '';
                    }
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      addFiles(event.target.files);
                      event.target.value = '';
                    }
                  }}
                />

                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 15.5V17a3 3 0 003 3h10a3 3 0 003-3v-1.5M8.5 8.5L12 5m0 0l3.5 3.5M12 5v10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Add up to five screenshots</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Drag and drop desktop captures, browse your library, or use the camera button below to snap a photo directly from your phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => browseInputRef.current?.click()}
                      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Browse Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-white/10"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8.25A2.25 2.25 0 015.25 6h2.379a2.25 2.25 0 001.591-.659l.99-.99A2.25 2.25 0 0111.8 3.75h.4a2.25 2.25 0 011.59.659l.99.99A2.25 2.25 0 0016.37 6h2.38A2.25 2.25 0 0121 8.25v8.5A2.25 2.25 0 0118.75 19h-13.5A2.25 2.25 0 013 16.75v-8.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.5a3 3 0 106 0 3 3 0 00-6 0z" />
                      </svg>
                      Use Phone Camera
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      {files.length}/{MAX_FILES} selected
                    </span>
                    <span>Rear camera opens automatically on supported mobile browsers.</span>
                  </div>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {previews.map((src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Uploaded screenshot ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-lg text-white transition hover:bg-rose-500"
                        aria-label={`Remove screenshot ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={files.length === 0 || loading}
                  className={`inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold transition ${
                    files.length === 0 || loading
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-white text-slate-950 hover:bg-cyan-100'
                  }`}
                >
                  Analyze Location
                </button>
                <p className="text-sm leading-6 text-slate-400 sm:max-w-xs">
                  Best results usually come from mixing one wide view with a closer sign, road, or building shot.
                </p>
              </div>
            </section>

            <aside className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
                  Mobile Ready
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Fast from your phone</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Large tap targets, stacked actions, and a dedicated camera flow keep the upload path clean on smaller screens.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
                  Workflow
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    1. Shoot or upload 1 to 5 images.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    2. Let the animated scan run while the solver reads the scene.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    3. Jump straight into the guessed point and reasoning.
                  </div>
                </div>
              </div>

              <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-cyan-300/10 p-5 text-sm text-cyan-50">
                <p className="font-semibold">Made by Arya Vora</p>
                <p className="mt-2 leading-6 text-cyan-50/80">
                  Personalized build with mobile capture support and a live scanning state for screenshot analysis.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {loading && <LoadingOverlay imageCount={files.length} />}
    </>
  );
}
