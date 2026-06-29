import { z } from "zod";
import { AISchema } from "@geoai/shared";
import type { AIOutput } from "@geoai/shared";

const ResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(
          z.object({
            text: z.string(),
          })
        ),
      }),
    })
  ),
});

interface AIClientConfig {
  apiKey: string;
  model: string;
  timeout?: number;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class AIClient {
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AIOutput> {
    const base64 = imageBuffer.toString("base64");
    const mimeType = this.detectMimeType(imageBuffer);

    const prompt = `You are a professional geolocation analyst.

Analyze this image.

Extract:
- visible text
- language
- road signs
- landmarks
- architecture
- vehicles
- climate
- vegetation
- cultural clues

Do not hallucinate.
Return ONLY valid JSON. No markdown, no code fences, no extra text.

Required JSON fields:
- country: string
- region: string
- city: string
- latitude: number between -90 and 90
- longitude: number between -180 and 180
- confidence: number between 0 and 1
- clues: array of objects with "category" (string) and "detail" (string)
- explanation: string

Example:
{
  "country": "Indonesia",
  "region": "East Java",
  "city": "Malang",
  "latitude": -7.98,
  "longitude": 112.63,
  "confidence": 0.85,
  "clues": [{ "category": "language", "detail": "Indonesian text on sign" }],
  "explanation": "Found Indonesian language text and tropical vegetation."
}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    };

    const url = `${GEMINI_BASE}/models/${this.config.model}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeout ?? 30_000
    );

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${text}`);
      }

      const data = ResponseSchema.parse(await res.json());
      let rawText = data.candidates[0]?.content?.parts[0]?.text;

      if (!rawText) {
        throw new Error("Empty Gemini response");
      }

      // Try direct parse first, then regex fallback
      let parsed: AIOutput;
      const trimmed = rawText.trim();
      try {
        parsed = JSON.parse(trimmed) as AIOutput;
      } catch {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(
            `No JSON in Gemini response. Raw: ${trimmed.slice(0, 300)}`
          );
        }
        parsed = JSON.parse(jsonMatch[0]) as AIOutput;
      }
      return this.validateOutput(parsed);
    } finally {
      clearTimeout(timeout);
    }
  }

  private detectMimeType(buffer: Buffer): string {
    const header = buffer.toString("hex", 0, 4);
    if (header.startsWith("ffd8")) return "image/jpeg";
    if (header.startsWith("89504e47")) return "image/png";
    if (header.startsWith("52494646")) return "image/webp";
    return "image/jpeg";
  }

  private validateOutput(output: unknown): AIOutput {
    return AISchema.parse(output);
  }
}
