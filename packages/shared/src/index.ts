import { z } from "zod";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Clue {
  category: string;
  detail: string;
}

export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  location?: GeoLocation;
  confidence?: number;
  clues?: Clue[];
  explanation?: string;
  modelUsed?: string;
  error?: string;
}

export interface AnalyzeResponse {
  id: string;
  status: AnalysisStatus;
}

export interface AnalyzeDetailResponse {
  status: AnalysisStatus;
  location?: GeoLocation;
  confidence?: number;
  clues?: Clue[];
  explanation?: string;
  error?: string;
}

export const AISchema = z.object({
  country: z.string(),
  region: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  confidence: z.number().min(0).max(1),
  clues: z.array(
    z.object({
      category: z.string(),
      detail: z.string(),
    })
  ),
  explanation: z.string(),
});

export type AIOutput = z.infer<typeof AISchema>;
