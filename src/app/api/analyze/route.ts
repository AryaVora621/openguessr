import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { LocationResult } from '@/types/location';

const SYSTEM_PROMPT = `You are an elite GeoGuessr competitor with a near-perfect record. Your task is to identify the EXACT street-level location from OpenGuessr screenshots with pinpoint accuracy — not just the country or city, but the specific street or area.

Work through these layers IN ORDER, eliminating wrong answers at each step:

STEP 1 — LANGUAGE & TEXT (highest signal)
- Read every visible character: street signs, shop fronts, billboards, licence plates, road markings
- Identify the script (Latin, Cyrillic, Arabic, Hangul, Thai, Devanagari, etc.) and exact language/dialect
- Note any brand names that are country-specific

STEP 2 — DRIVING SIDE & ROAD MARKINGS
- Left-hand traffic: UK, Ireland, Australia, NZ, Japan, South Africa, India, Kenya, Thailand, Indonesia, Malaysia
- Road centre line colour: YELLOW = Americas + some others; WHITE = Europe, Asia, Africa, Oceania
- Road paint style and condition narrows region further

STEP 3 — INFRASTRUCTURE FINGERPRINTS
- Utility poles: wooden (common Americas/Japan), concrete (Eastern Europe/SE Asia), style of crossarms
- Street lights: style, colour, mounting
- Guardrails: W-beam silver (Americas), painted white/yellow concrete (Asia/Africa)
- Traffic signs: shape, colour, font (e.g. Highway Gothic = USA, Transport = UK, DIN = Germany)

STEP 4 — TERRAIN, SOIL & VEGETATION
- Soil colour: red laterite (tropical Africa/Brazil/SE Asia), pale sandy (Mediterranean/arid), dark (temperate)
- Tree species: palm type, eucalyptus, cedar, tropical broadleaf, pine — each has a tight geographic range
- Landscape: altitude, flatness, mountain profile shapes

STEP 5 — ARCHITECTURE & CULTURAL MARKERS
- Building materials, roof style, window type, wall colours
- Religious buildings, flags, military/police uniform details
- Distinctive regional house styles (e.g. Scandinavian wooden houses, Georgian USSR blocks)

STEP 6 — SUN & SKY
- Sun position gives hemisphere and rough latitude/season
- Sky haze, cloud type, humidity level

STEP 7 — STREET VIEW METADATA
- Camera generation (older = more saturated, newer = sharper)
- Camera height (higher in some countries like Japan/Russia)
- Blur patterns on faces/plates indicate country-level Street View coverage

After identifying country and region, use ALL clues to pinpoint the EXACT location (specific city district, road, or landmark). If you see a street name, business name, or any unique identifier — use it to nail the coordinates precisely.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "latitude": <decimal, 4-6 significant digits>,
  "longitude": <decimal, 4-6 significant digits>,
  "country": "<full country name>",
  "city": "<city/town/village name, or nearest settlement if rural>",
  "confidence": "<high|medium|low>",
  "reasoning": "<4-6 sentences: list the 3-4 strongest clues in order of confidence, explain exactly why they point to this specific location>"
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
    }

    // Convert files to base64 inline parts
    const imageParts = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        return {
          inlineData: {
            data: base64,
            mimeType: file.type || 'image/jpeg',
          },
        };
      })
    );

    let parsed: LocationResult;

    // Try Gemini first, fall back to OpenAI gpt-4o-mini on quota errors
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent([SYSTEM_PROMPT, ...imageParts]);
      const text = result.response.text();

      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Failed to parse Gemini response');
        parsed = JSON.parse(match[0]);
      }
    } catch (geminiErr) {
      const msg = geminiErr instanceof Error ? geminiErr.message : '';
      const is429 = msg.includes('429') || msg.toLowerCase().includes('quota');

      if (!is429) throw geminiErr;

      // Fall back to OpenAI gpt-4o-mini
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return NextResponse.json(
          { error: 'Gemini quota exceeded and OPENAI_API_KEY not configured' },
          { status: 429 }
        );
      }

      const openai = new OpenAI({ apiKey: openaiKey });

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            ...imageParts.map((p) => ({
              type: 'image_url' as const,
              image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` },
            })),
          ],
        },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0].message.content ?? '';
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Failed to parse OpenAI response');
        parsed = JSON.parse(match[0]);
      }
    }

    // Validate required fields
    if (typeof parsed.latitude !== 'number' || typeof parsed.longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates in response' }, { status: 500 });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error('Analyze error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
