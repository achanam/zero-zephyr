// Ported 1:1 from indexZk.js. Three separate rate-limit mechanisms — don't
// merge them, each has its own design reason (see per-function comments):
//   1. checkAndRecordPublicSend  — per-IP, per-endpoint, timestamp array
//      (needs a precise retry_after shown to the user).
//   2. checkAndRecordGlobalCeiling — cross-IP backstop, single counter
//      (not for individual users, just an aggregate cap).
//   3. checkLockout/recordFailedAttempt — brute-force protection for
//      INTERNAL_KEY itself (repeated wrong X-Api-Key → lockout).

import type { Env } from "../cf";

export const PUBLIC_SEND_LIMITS: Record<string, { maxAttempts: number; windowSeconds: number }> = {
  "/send/text": { maxAttempts: 9, windowSeconds: 17 * 60 },
  "/send/file": { maxAttempts: 5, windowSeconds: 30 * 60 },
};

// Aggregate cross-IP backstop — see the old indexZk.js for why a per-IP
// limiter alone isn't enough against botnets/IP churn.
export const GLOBAL_SEND_CEILING: Record<string, { maxAttempts: number; windowSeconds: number }> = {
  "/send/text": { maxAttempts: 300, windowSeconds: 17 * 60 },
  "/send/file": { maxAttempts: 150, windowSeconds: 30 * 60 },
};

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const RATE_LIMIT_LOCKOUT_SECONDS = 30 * 60;

export async function checkAndRecordPublicSend(kv: Env["RATE_LIMIT_KV"], ip: string, path: string) {
  const limit = PUBLIC_SEND_LIMITS[path];
  const key = `pubsend:${path}:${ip}`;
  const now = Date.now();
  const windowStart = now - limit.windowSeconds * 1000;

  const raw = await kv.get(key);
  let timestamps: number[] = [];
  if (raw) {
    try {
      timestamps = (JSON.parse(raw) as number[]).filter((t) => t > windowStart);
    } catch {
      timestamps = [];
    }
  }

  if (timestamps.length >= limit.maxAttempts) {
    const oldestInWindow = Math.min(...timestamps);
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + limit.windowSeconds * 1000 - now) / 1000));
    return { allowed: false as const, retryAfterSeconds };
  }

  timestamps.push(now);
  await kv.put(key, JSON.stringify(timestamps), { expirationTtl: limit.windowSeconds });
  return { allowed: true as const, recordedAt: now };
}

export async function rollbackPublicSendAttempt(
  kv: Env["RATE_LIMIT_KV"],
  ip: string,
  path: string,
  recordedAt: number | null
) {
  const limit = PUBLIC_SEND_LIMITS[path];
  const key = `pubsend:${path}:${ip}`;
  const raw = await kv.get(key);
  if (!raw) return;
  try {
    const timestamps = (JSON.parse(raw) as number[]).filter((t) => t !== recordedAt);
    if (timestamps.length === 0) {
      await kv.delete(key);
    } else {
      await kv.put(key, JSON.stringify(timestamps), { expirationTtl: limit.windowSeconds });
    }
  } catch {
    // Parse failed — let the natural TTL clean up this key.
  }
}

export async function checkAndRecordGlobalCeiling(kv: Env["RATE_LIMIT_KV"], path: string) {
  const ceiling = GLOBAL_SEND_CEILING[path];
  const key = `globalsend:${path}`;
  const raw = await kv.get(key);
  const count = Number(raw) || 0;

  if (count >= ceiling.maxAttempts) {
    return { allowed: false as const };
  }

  await kv.put(key, String(count + 1), { expirationTtl: ceiling.windowSeconds });
  return { allowed: true as const };
}

export async function rollbackGlobalCeilingAttempt(kv: Env["RATE_LIMIT_KV"], path: string) {
  const ceiling = GLOBAL_SEND_CEILING[path];
  const key = `globalsend:${path}`;
  const raw = await kv.get(key);
  if (!raw) return;
  const count = Number(raw) || 0;
  const next = Math.max(0, count - 1);
  if (next === 0) {
    await kv.delete(key);
  } else {
    await kv.put(key, String(next), { expirationTtl: ceiling.windowSeconds });
  }
}

/**
 * Single call site for "this request failed validation for a reason OTHER
 * than rate limiting, so undo the quota it already used" — wraps the
 * per-IP + global-ceiling rollback into one call so every early-return in
 * the /send/text and /send/file handlers only needs to call this ONE function.
 */
export async function rollbackPublicSendIfNeeded(
  kv: Env["RATE_LIMIT_KV"],
  ip: string,
  path: string,
  isPublicSend: boolean,
  publicSendRecordedAt: number | null,
  globalCeilingRecorded: boolean
) {
  if (!isPublicSend) return;
  await rollbackPublicSendAttempt(kv, ip, path, publicSendRecordedAt);
  if (globalCeilingRecorded) {
    await rollbackGlobalCeilingAttempt(kv, path);
  }
}

export async function checkLockout(kv: Env["RATE_LIMIT_KV"], ip: string) {
  const lockKey = `lock:${ip}`;
  const lockedUntilRaw = await kv.get(lockKey);
  if (!lockedUntilRaw) return { locked: false, remainingSeconds: 0 };

  const lockedUntil = Number(lockedUntilRaw);
  const now = Date.now();
  if (now < lockedUntil) {
    return { locked: true, remainingSeconds: Math.ceil((lockedUntil - now) / 1000) };
  }
  await kv.delete(lockKey);
  return { locked: false, remainingSeconds: 0 };
}

export async function recordFailedAttempt(kv: Env["RATE_LIMIT_KV"], ip: string) {
  const attemptKey = `attempts:${ip}`;
  const current = await kv.get(attemptKey);
  const count = (Number(current) || 0) + 1;

  if (count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const lockKey = `lock:${ip}`;
    const lockedUntil = Date.now() + RATE_LIMIT_LOCKOUT_SECONDS * 1000;
    await kv.put(lockKey, String(lockedUntil), { expirationTtl: RATE_LIMIT_LOCKOUT_SECONDS });
    await kv.delete(attemptKey);
  } else {
    await kv.put(attemptKey, String(count), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  }
}

export async function clearFailedAttempts(kv: Env["RATE_LIMIT_KV"], ip: string) {
  await kv.delete(`attempts:${ip}`);
  await kv.delete(`lock:${ip}`);
}
