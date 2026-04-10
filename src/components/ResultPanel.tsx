'use client';

import { LocationResult } from '@/types/location';

interface ResultPanelProps {
  result: LocationResult;
  onReset: () => void;
}

const confidenceColors = {
  high: 'bg-green-500/20 text-green-400 border border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function ResultPanel({ result, onReset }: ResultPanelProps) {
  const locationName = [result.city, result.country].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 overflow-y-auto">
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-xl">📍</span>
            <h2 className="text-2xl font-bold text-white">{locationName}</h2>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize mt-1 ${confidenceColors[result.confidence]}`}>
            {result.confidence} confidence
          </span>
        </div>

        {/* Coordinates */}
        <div className="bg-gray-900 rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Coordinates</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Latitude</p>
              <p className="text-white font-mono text-sm">{result.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Longitude</p>
              <p className="text-white font-mono text-sm">{result.longitude.toFixed(6)}</p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Analysis</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.reasoning}</p>
        </div>

        {/* Google Maps link */}
        <a
          href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Google Maps
        </a>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="mt-6 w-full py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors text-sm font-medium"
      >
        ← Try Another Screenshot
      </button>
    </div>
  );
}
