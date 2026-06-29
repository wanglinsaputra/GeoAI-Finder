const FILE_SIGNATURES: Record<string, string[]> = {
  "image/jpeg": ["ffd8ff"],
  "image/png": ["89504e47"],
  "image/webp": ["52494646"],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(
  mimeType: string,
  buffer: Buffer
): ValidationResult {
  if (buffer.length === 0) {
    return { valid: false, error: "Empty file" };
  }

  if (buffer.length > MAX_SIZE) {
    return { valid: false, error: "File too large. Maximum 10MB." };
  }

  const allowedMimes = Object.keys(FILE_SIGNATURES);
  if (!allowedMimes.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported format. Allowed: ${allowedMimes.join(", ")}`,
    };
  }

  const header = buffer.toString("hex", 0, 4);
  const validSignatures = FILE_SIGNATURES[mimeType];

  if (!validSignatures?.some((sig) => header.startsWith(sig))) {
    return { valid: false, error: "File signature mismatch. Invalid image." };
  }

  return { valid: true };
}
