export function createAppError(
  statusCode: number,
  message: string
): { statusCode: number; error: string } {
  return { statusCode, error: message };
}

export const Errors = {
  invalidImage: () => createAppError(400, "Invalid image file"),
  unsupportedFormat: () => createAppError(400, "Unsupported image format"),
  fileTooLarge: () => createAppError(400, "File too large. Maximum 10MB."),
  notFound: (id: string) =>
    createAppError(404, `Analysis ${id} not found`),
  aiTimeout: () => createAppError(504, "AI analysis timed out"),
  aiFailed: () => createAppError(502, "AI analysis failed"),
  rateLimited: () => createAppError(429, "Too many requests. Try again later."),
} as const;
