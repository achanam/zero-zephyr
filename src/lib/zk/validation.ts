// Ported 1:1 from indexZk.js.

export const EXPIRES_MIN_HOURS = 1;
export const EXPIRES_MAX_HOURS = 72; // 3 days
export const MAX_VIEWS_MIN = 1;
export const MAX_VIEWS_MAX = 9;
export const MAX_TEXT_BODY_BYTES = 1 * 1024 * 1024; // 1 MB — see indexZk.js for why this exists beyond rate limiting

/** 128-bit entropy (16 random bytes -> 32 hex chars) — large enough that an active slug can't be brute-forced. */
export function randomSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Exact shape of randomSlug() — used by the route matcher to reject obviously-invalid slugs before hitting Supabase. */
export const SLUG_PATTERN = /^[0-9a-f]{32}$/;

export function validateExpiresInHours(raw: unknown): number | null {
  const hours = Number(raw);
  if (!raw || Number.isNaN(hours)) return null;
  if (hours < EXPIRES_MIN_HOURS || hours > EXPIRES_MAX_HOURS) return null;
  return hours;
}

/** max_views is OPTIONAL — omitted defaults to MAX_VIEWS_MIN. If provided, must be an integer in range. */
export function validateMaxViews(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return MAX_VIEWS_MIN;
  const views = Number(raw);
  if (!Number.isInteger(views)) return null;
  if (views < MAX_VIEWS_MIN || views > MAX_VIEWS_MAX) return null;
  return views;
}

export class TooLargeError extends Error {
  tooLarge = true as const;
}

// Content-Length pre-check + streamed read that aborts once maxBytes is
// exceeded, so an oversized body is never fully buffered first.
async function readStreamWithLimit(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new TooLargeError("Request body exceeds the allowed size.");
  }

  if (!request.body) {
    return new Uint8Array(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new TooLargeError("Request body exceeds the allowed size.");
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

/** Parses JSON under maxBytes — used by /send/text. */
export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const bytes = await readStreamWithLimit(request, maxBytes);
  if (bytes.byteLength === 0) return JSON.parse("");
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Raw-bytes version — used by /send/file. */
export async function readBytesWithLimit(request: Request, maxBytes: number): Promise<ArrayBuffer> {
  const bytes = await readStreamWithLimit(request, maxBytes);
  return bytes.buffer as ArrayBuffer;
}
