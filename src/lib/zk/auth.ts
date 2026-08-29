import type { NextRequest } from "next/server";
import type { Env } from "../cf";
import { json, timingSafeEqual, getClientIp } from "./security";
import { checkLockout, recordFailedAttempt, clearFailedAttempts } from "./rate-limit";

/**
 * Validate X-Api-Key against INTERNAL_KEY, with brute-force lockout.
 * Returns null when valid (proceed to the handler). Returns a NextResponse
 * when rejected (429 locked, or 401 unauthorized) — caller should `return`
 * that directly.
 */
export async function guardInternalKey(env: Env, request: NextRequest, cors: Record<string, string>) {
  const ip = getClientIp(request);

  const lockStatus = await checkLockout(env.RATE_LIMIT_KV, ip);
  if (lockStatus.locked) {
    const minutes = Math.ceil(lockStatus.remainingSeconds / 60);
    return json(
      {
        error: `Too many failed attempts. Try again in ${minutes} minute(s).`,
        locked: true,
        retry_after_seconds: lockStatus.remainingSeconds,
      },
      429,
      cors
    );
  }

  const apiKey = request.headers.get("X-Api-Key");
  if (!env.INTERNAL_KEY || !timingSafeEqual(apiKey, env.INTERNAL_KEY)) {
    await recordFailedAttempt(env.RATE_LIMIT_KV, ip);
    return json({ error: "Unauthorized — Internal Key is missing or incorrect" }, 401, cors);
  }

  await clearFailedAttempts(env.RATE_LIMIT_KV, ip);
  return null;
}
