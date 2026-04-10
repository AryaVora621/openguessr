'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ImageUpload from '@/components/ImageUpload';
import ResultPanel from '@/components/ResultPanel';
import { LocationResult } from '@/types/location';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [result, setResult] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (files: File[]) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? 'Analysis failed');
      } else {
        setResult(data.result);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="result-layout">
        <div className="result-map">
          <MapView result={result} />
        </div>
        <div className="result-panel">
          <ResultPanel result={result} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageUpload onAnalyze={handleAnalyze} loading={loading} />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-5 py-3 rounded-xl text-sm max-w-md text-center">
          {error}
        </div>
      )}
    </>
  );
}
