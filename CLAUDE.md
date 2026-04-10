# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npx tsc --noEmit # Type check without emitting
```

## Architecture

**OpenGuessr Solver** — upload 1–5 OpenGuessr screenshots → AI identifies the real-world location → interactive Google Map with pinpoint + reasoning panel.

### Request flow
1. User uploads images in `ImageUpload` component
2. `page.tsx` POSTs them as `multipart/form-data` to `/api/analyze`
3. `route.ts` converts images to base64, calls **Gemini 2.5 Pro** with a GeoGuessr expert prompt
4. Returns `LocationResult` JSON with lat/lng, country/city, confidence, reasoning
5. `page.tsx` switches to split-view: `MapView` (left) + `ResultPanel` (right)

### Key files
- `src/app/api/analyze/route.ts` — the AI pipeline; Gemini prompt lives here
- `src/components/ImageUpload.tsx` — drag-and-drop, max 5 images, thumbnails
- `src/components/MapView.tsx` — Google Maps via `@vis.gl/react-google-maps`, `AdvancedMarker`
- `src/components/ResultPanel.tsx` — location name, coords, confidence badge, reasoning
- `src/types/location.ts` — shared `LocationResult` type

### Environment variables
```
GEMINI_API_KEY                   # From aistudio.google.com (free)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  # From Google Cloud Console (Maps JavaScript API)
OPENAI_API_KEY #Openai
```
