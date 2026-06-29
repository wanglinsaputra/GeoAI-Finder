import exifr from "exifr";
import type { GeoLocation } from "@geoai/shared";

interface ExifResult {
  hasGps: boolean;
  location?: GeoLocation;
}

export async function extractExifGps(buffer: Buffer): Promise<ExifResult> {
  try {
    const gps = await exifr.gps(buffer);

    if (gps && gps.latitude != null && gps.longitude != null) {
      return {
        hasGps: true,
        location: {
          country: "Extracted from EXIF",
          region: "Extracted from EXIF",
          city: "Extracted from EXIF",
          latitude: gps.latitude,
          longitude: gps.longitude,
        },
      };
    }

    return { hasGps: false };
  } catch {
    return { hasGps: false };
  }
}
