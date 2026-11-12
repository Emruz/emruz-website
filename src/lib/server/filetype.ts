import 'server-only';
import { fileTypeFromBuffer } from 'file-type';

/** Types evidence files may be shown inline as, decided from the file's bytes (security finding E8). */
export const INLINE_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/** MIME type detected from the bytes, or null when unknown (text, CSV, etc.). The browser-sent type is never trusted. */
export async function detectType(data: ArrayBuffer | Uint8Array): Promise<string | null> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const r = await fileTypeFromBuffer(bytes.subarray(0, 4100));
  return r?.mime ?? null;
}
