import type { AIOutput, GeoLocation, Clue } from "@geoai/shared";

export interface VerifiedResult {
  location: GeoLocation;
  confidence: number;
  clues: Clue[];
  explanation: string;
}

export class GeoEngine {
  verify(output: AIOutput): VerifiedResult {
    const clampedConfidence = Math.max(0, Math.min(1, output.confidence));

    const verifiedClues = (output.clues || []).map((clue) => ({
      category: clue.category,
      detail: clue.detail,
    }));

    return {
      location: {
        country: output.country || "Unknown",
        region: output.region || "Unknown",
        city: output.city || "Unknown",
        latitude: this.clampLatitude(output.latitude),
        longitude: this.clampLongitude(output.longitude),
      },
      confidence: clampedConfidence,
      clues: verifiedClues,
      explanation: output.explanation || "No explanation provided.",
    };
  }

  private clampLatitude(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
  }

  private clampLongitude(lng: number): number {
    return Math.max(-180, Math.min(180, lng));
  }
}
