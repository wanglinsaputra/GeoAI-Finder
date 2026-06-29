import { AIClient } from "@geoai/ai-client";
import { GeoEngine, type VerifiedResult } from "@geoai/geo-engine";
import type { AnalyzeDetailResponse } from "@geoai/shared";
import { extractExifGps } from "./exif.js";
import {
  setJobPending,
  setJobProcessing,
  setJobResult,
  getJob,
} from "../store/redis.js";

const aiClient = new AIClient({
  apiKey: process.env.GEMINI_API_KEY!,
  model: process.env.GEMINI_MODEL!,
  timeout: 30_000,
});

const geoEngine = new GeoEngine();

export async function createAnalysis(id: string): Promise<void> {
  await setJobPending(id);
}

export async function analyzeImage(
  id: string,
  buffer: Buffer
): Promise<void> {
  // Copy buffer for async processing, then zero original
  const imageData = Buffer.from(buffer);
  buffer.fill(0);

  try {
    await setJobProcessing(id);

    // Step 1: Check EXIF for GPS
    const exifData = await extractExifGps(imageData);

    if (exifData.hasGps && exifData.location) {
      await setJobResult(id, {
        status: "completed",
        location: {
          country: "Extracted from EXIF",
          region: "Extracted from EXIF",
          city: "Extracted from EXIF",
          latitude: exifData.location.latitude,
          longitude: exifData.location.longitude,
        },
        confidence: 0.99,
        clues: [
          {
            category: "EXIF Metadata",
            detail: "GPS coordinates extracted from image metadata",
          },
        ],
        modelUsed: "exif",
        explanation:
          "Location determined from EXIF GPS metadata embedded in the image.",
      });
      return;
    }

    // Step 2: No GPS → Vision AI
    const aiOutput = await aiClient.analyzeImage(imageData);
    const verified: VerifiedResult = geoEngine.verify(aiOutput);

    await setJobResult(id, {
      status: "completed",
      location: verified.location,
      confidence: verified.confidence,
      clues: verified.clues,
      explanation: verified.explanation,
      modelUsed: process.env.GEMINI_MODEL!,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await setJobResult(id, {
      status: "failed",
      error: message,
    });
  } finally {
    // Wipe copied buffer
    imageData.fill(0);
  }
}

export async function getAnalysis(
  id: string
): Promise<AnalyzeDetailResponse | null> {
  const job = await getJob(id);
  if (!job) return null;

  return {
    status: job.status,
    location: job.location,
    confidence: job.confidence,
    clues: job.clues,
    explanation: job.explanation,
    error: job.error,
  };
}
