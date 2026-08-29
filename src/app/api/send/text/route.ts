import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";
import { corsFromRequest, originAllowed, jsonOrHtml, json, getClientIp, hashApiKey } from "@/lib/zk/security";
import { guardInternalKey } from "@/lib/zk/auth";
import {
  checkAndRecordPublicSend,
  checkAndRecordGlobalCeiling,
  rollbackPublicSendIfNeeded,
} from "@/lib/zk/rate-limit";
import { sbInsert } from "@/lib/zk/supabase";
import {
  readJsonWithLimit,
  TooLargeError,
  validateExpiresInHours,
  validateMaxViews,
  randomSlug,
  MAX_TEXT_BODY_BYTES,
} from "@/lib/zk/validation";

export const dynamic = "force-dynamic";

const PATH = "/send/text";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsFromRequest(request) });
}

// Public by default (no key needed), limited to 9x/17min per-IP plus a
// global backstop. A valid X-Api-Key exempts it from the public limit. A
// key that IS present but WRONG is also rejected here (guardInternalKey) —
// it does NOT silently fall back to the public path, so nobody can bypass
// the limit just by sending a made-up X-Api-Key header.
export async function POST(request: NextRequest) {
  const cors = corsFromRequest(request);
  const env = await getEnv();

  try {
    return await handleSendText(request, env, cors);
  } catch (err) {
    // Error details (Supabase message, stack, etc.) are NOT sent to the
    // client — could leak internal table/query structure. Still logged to
    // the worker console (visible via `wrangler tail`) for debugging.
    console.error("Unhandled /send/text error:", err instanceof Error ? err.stack : err);
    return json({ error: "Internal error. Please try again later." }, 500, cors);
  }
}

async function handleSendText(request: NextRequest, env: Awaited<ReturnType<typeof getEnv>>, cors: Record<string, string>) {
  if (!originAllowed(request)) {
    return jsonOrHtml(request, { error: "Forbidden — origin not allowed" }, 403, cors);
  }

  const ip = getClientIp(request);
  let isPublicSend = false;
  let publicSendRecordedAt: number | null = null;
  let globalCeilingRecorded = false;

  const hasKey = !!(request.headers.get("X-Api-Key") || "");
  if (!hasKey) {
    isPublicSend = true;
    const result = await checkAndRecordPublicSend(env.RATE_LIMIT_KV, ip, PATH);
    if (!result.allowed) {
      const minutes = Math.ceil(result.retryAfterSeconds / 60);
      return json(
        {
          error: `Too many sends from this IP. Limit is 9 per 17 minutes. Try again in ~${minutes} minute(s), or provide an Internal Key.`,
          retry_after_seconds: result.retryAfterSeconds,
        },
        429,
        cors
      );
    }
    publicSendRecordedAt = result.recordedAt;

    const globalResult = await checkAndRecordGlobalCeiling(env.RATE_LIMIT_KV, PATH);
    if (!globalResult.allowed) {
      await rollbackPublicSendIfNeeded(env.RATE_LIMIT_KV, ip, PATH, isPublicSend, publicSendRecordedAt, false);
      return json(
        { error: "This service is experiencing high demand right now. Please try again shortly, or provide an Internal Key." },
        429,
        cors
      );
    }
    globalCeilingRecorded = true;
  }

  const rollback = () =>
    rollbackPublicSendIfNeeded(env.RATE_LIMIT_KV, ip, PATH, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);

  const providedKey = request.headers.get("X-Api-Key") || "";
  if (providedKey) {
    const guardResp = await guardInternalKey(env, request, cors);
    if (guardResp) return guardResp;
  }

  let body: { ciphertext?: string; salt?: string; iv?: string; burn_after_read?: boolean; max_views?: unknown; expires_in_hours?: unknown } | null;
  try {
    body = (await readJsonWithLimit(request, MAX_TEXT_BODY_BYTES)) as typeof body;
  } catch (err) {
    await rollback();
    if (err instanceof TooLargeError) {
      return json({ error: `Request body too large. Max ${MAX_TEXT_BODY_BYTES / 1024 / 1024} MB for text sends.` }, 413, cors);
    }
    body = null;
  }
  if (!body || !body.ciphertext || !body.salt || !body.iv) {
    await rollback();
    return json({ error: "Missing encrypted payload (ciphertext/salt/iv)" }, 400, cors);
  }

  const expiresInHours = validateExpiresInHours(body.expires_in_hours);
  if (expiresInHours === null) {
    await rollback();
    return json({ error: "expires_in_hours is required and must be between 1 and 72 hours." }, 400, cors);
  }

  const maxViews = validateMaxViews(body.max_views);
  if (maxViews === null) {
    await rollback();
    return json({ error: "max_views must be a whole number between 1 and 9." }, 400, cors);
  }

  const slug = randomSlug();
  const row = {
    slug,
    title: "[encrypted]",
    type: "text" as const,
    content: `${body.salt}.${body.iv}.${body.ciphertext}`,
    storage_type: "inline" as const,
    burn_after_read: !!body.burn_after_read,
    max_views: body.burn_after_read ? 1 : maxViews,
    view_count: 0,
    is_active: true,
    expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
    created_with_key_hash: providedKey ? await hashApiKey(providedKey) : null,
  };

  const saved = await sbInsert(env, row);
  return json({ slug: saved.slug, type: saved.type }, 200, cors);
}
