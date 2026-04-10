export interface LocationResult {
  latitude: number;
  longitude: number;
  country: string;
  city: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}
