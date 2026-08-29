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
import { validateExpiresInHours, validateMaxViews, randomSlug } from "@/lib/zk/validation";

export const dynamic = "force-dynamic";

const PATH = "/send/file";
const PUBLIC_MAX_BYTES = 20 * 1024 * 1024; // 20 MB without a key
const AUTH_MAX_BYTES = 100 * 1024 * 1024; // 100 MB with a valid X-Api-Key

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsFromRequest(request) });
}

export async function POST(request: NextRequest) {
  const cors = corsFromRequest(request);
  const env = await getEnv();

  try {
    return await handleSendFile(request, env, cors);
  } catch (err) {
    console.error("Unhandled /send/file error:", err instanceof Error ? err.stack : err);
    return json({ error: "Internal error. Please try again later." }, 500, cors);
  }
}

async function handleSendFile(request: NextRequest, env: Awaited<ReturnType<typeof getEnv>>, cors: Record<string, string>) {
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
          error: `Too many sends from this IP. Limit is 5 per 30 minutes. Try again in ~${minutes} minute(s), or provide an Internal Key.`,
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
  let authenticated = false;
  if (providedKey) {
    const guardResp = await guardInternalKey(env, request, cors);
    if (guardResp) return guardResp;
    authenticated = true;
  }

  const maxAllowedBytes = authenticated ? AUTH_MAX_BYTES : PUBLIC_MAX_BYTES;

  const metaCipher = request.headers.get("X-Meta-Cipher");
  const salt = request.headers.get("X-Salt");
  const ivMeta = request.headers.get("X-Iv-Meta");
  const ivFile = request.headers.get("X-Iv-File");
  const saltFile = request.headers.get("X-Salt-File");
  const burnAfterRead = request.headers.get("X-Burn-After-Read") === "1";

  if (!metaCipher || !salt || !ivMeta || !ivFile || !saltFile) {
    await rollback();
    return json({ error: "Missing encrypted metadata (meta-cipher/salt/iv)" }, 400, cors);
  }

  const expiresInHours = validateExpiresInHours(request.headers.get("X-Expires-In-Hours"));
  if (expiresInHours === null) {
    await rollback();
    return json({ error: "X-Expires-In-Hours is required and must be between 1 and 72 hours." }, 400, cors);
  }

  const maxViews = validateMaxViews(request.headers.get("X-Max-Views"));
  if (maxViews === null) {
    await rollback();
    return json({ error: "X-Max-Views must be a whole number between 1 and 9." }, 400, cors);
  }

  const encryptedBody = await request.arrayBuffer();
  if (encryptedBody.byteLength === 0) {
    await rollback();
    return json({ error: "File is empty" }, 400, cors);
  }
  if (encryptedBody.byteLength > maxAllowedBytes) {
    await rollback();
    return json(
      {
        error: `File too large. ${
          authenticated
            ? `Max ${AUTH_MAX_BYTES / 1024 / 1024} MB with Internal Key.`
            : `Max ${PUBLIC_MAX_BYTES / 1024 / 1024} MB without Internal Key. Provide a valid key to upload up to ${AUTH_MAX_BYTES / 1024 / 1024} MB.`
        }`,
        requires_key: !authenticated,
      },
      413,
      cors
    );
  }

  const slug = randomSlug();
  const r2Key = `files/${slug}/blob`;

  await env.BUCKET.put(r2Key, encryptedBody, {
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: { slug, ivFile, saltFile },
  });

  const row = {
    slug,
    title: "[encrypted]",
    type: "file" as const,
    content: `${salt}.${ivMeta}.${metaCipher}`,
    file_path: r2Key,
    file_size: encryptedBody.byteLength,
    file_mime: "application/octet-stream",
    storage_type: "r2" as const,
    burn_after_read: burnAfterRead,
    max_views: burnAfterRead ? 1 : maxViews,
    view_count: 0,
    is_active: true,
    expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
    created_with_key_hash: providedKey ? await hashApiKey(providedKey) : null,
  };

  const saved = await sbInsert(env, row);
  return json({ slug: saved.slug, type: saved.type }, 200, cors);
}
