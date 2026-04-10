'use client';

import { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  onAnalyze: (files: File[]) => Promise<void> | void;
  loading: boolean;
}

const MAX_FILES = 5;
const MAX_IMAGE_DIMENSION = 2200;
const MAX_ORIGINAL_FILE_SIZE = 2_500_000;
const COMPRESSED_IMAGE_QUALITY = 0.86;
const LOADING_POINTS = [
  { top: '14%', left: '12%', delay: '0s', duration: '10s' },
  { top: '28%', left: '76%', delay: '1.2s', duration: '13s' },
  { top: '42%', left: '18%', delay: '2.3s', duration: '11s' },
  { top: '58%', left: '64%', delay: '0.8s', duration: '12s' },
  { top: '70%', left: '24%', delay: '1.8s', duration: '14s' },
  { top: '82%', left: '82%', delay: '2.8s', duration: '10s' },
];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image'));
      }
    };

    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode image'));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function normalizeFileForUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= MAX_ORIGINAL_FILE_SIZE) {
    return file;
  }

  try {
    const source = await readFileAsDataUrl(file);
    const image = await loadImageElement(source);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', COMPRESSED_IMAGE_QUALITY);
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const nextName = file.name.replace(/\.[^.]+$/, '') || 'upload';
    return new File([blob], `${nextName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

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
  const [preparing, setPreparing] = useState(false);
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

  const handleSubmit = async () => {
    if (files.length > 0) {
      setPreparing(true);

      try {
        const preparedFiles = await Promise.all(files.map((file) => normalizeFileForUpload(file)));
        await onAnalyze(preparedFiles);
      } finally {
        setPreparing(false);
      }
    }
  };

  return (
    <>
      <main className="upload-shell">
        <div className="upload-ambient" aria-hidden="true">
          <div className="upload-ambient-mesh" />
          <div className="upload-ambient-orb upload-ambient-orb-1" />
          <div className="upload-ambient-orb upload-ambient-orb-2" />
          <div className="upload-beam upload-beam-1" />
          <div className="upload-beam upload-beam-2" />
          <div className="upload-pulse upload-pulse-1" />
          <div className="upload-pulse upload-pulse-2" />
          <div className="upload-pulse upload-pulse-3" />
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
                  Upload screenshots or snap fresh photos from your phone. This build is made by Arya Vora and tuned to extract the strongest geographic clues fast.
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
                        Drag in desktop captures, browse your gallery, or use the camera button below to take a fresh photo directly from your phone.
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

              <div className="mt-5 rounded-[1.5rem] border border-cyan-200/10 bg-cyan-300/8 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="sm:max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
                      Best Clues
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Give the model something distinctive to read</h3>
                  </div>
                  <div className="rounded-full border border-cyan-200/15 bg-white/5 px-3 py-1 text-xs text-cyan-100">
                    Text + landmarks win
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                    <p className="text-sm font-medium text-slate-100">Readable text</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Street signs, storefront names, road numbers, transit signs, and license plates help the AI narrow location quickly.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                    <p className="text-sm font-medium text-slate-100">Landmarks</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Statues, towers, mountain silhouettes, bridges, plazas, monuments, and unique buildings are strong anchors.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                    <p className="text-sm font-medium text-slate-100">Context shots</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Mix one wide scene with one close crop so the model sees both the environment and the details inside it.
                    </p>
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
                  disabled={files.length === 0 || loading || preparing}
                  className={`inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold transition ${
                    files.length === 0 || loading || preparing
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-white text-slate-950 hover:bg-cyan-100'
                  }`}
                >
                  {preparing ? 'Optimizing Screenshots...' : 'Analyze Location'}
                </button>
                <p className="text-sm leading-6 text-slate-400 sm:max-w-xs">
                  Prioritize screenshots with visible text, a recognizable landmark, or road signage whenever possible.
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
                  Capture Tips
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    1. Start with the clearest frame that shows a sign, place name, or obvious landmark.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    2. Add a second shot with wider context like road layout, terrain, skyline, or nearby buildings.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    3. Avoid blurry crops when possible. Readable text and distinct architecture usually outperform generic scenery.
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
