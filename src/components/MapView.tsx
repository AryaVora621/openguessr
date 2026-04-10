'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { LocationResult } from '@/types/location';

interface MapViewProps {
  result: LocationResult;
}

export default function MapView({ result }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const position = { lat: result.latitude, lng: result.longitude };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={position}
        defaultZoom={13}
        mapId="openguessr-map"
        className="w-full h-full"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        <AdvancedMarker position={position} title={`${result.city ?? result.country}`}>
          <Pin
            background="#2563eb"
            borderColor="#1d4ed8"
            glyphColor="#ffffff"
          />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}
