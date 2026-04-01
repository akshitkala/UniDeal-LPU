/**
 * Server-side Magic Byte validation for images.
 * Detects real file types by reading the buffer prefix.
 */

// Magic byte signatures for accepted image types
const SIGNATURES: Array<{ type: string; bytes: number[]; offset?: number }> = [
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

export function validateMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    // Check if the buffer contains the exact byte sequence at the offset
    const match = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (match) return sig.type;
  }
  return null; // not a valid image type or signature mismatch
}
