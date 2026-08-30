import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";
import { corsFromRequest, originAllowed, jsonOrHtml, json, getClientIp } from "@/lib/zk/security";
import { sbGetBySlug, deactivateAndCleanup } from "@/lib/zk/supabase";
import { SLUG_PATTERN } from "@/lib/zk/validation";
import { verifyDownloadToken } from "@/lib/zk/download-token";
import { checkAndRecordPublicAccess } from "@/lib/zk/rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsFromRequest(request) });
}

// Requires ?token= minted by /receive — see download-token.ts. Only for
// files still within max_views (not yet burned).
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const cors = corsFromRequest(request);
  const env = await getEnv();

  try {
    return await handleDownload(request, params, env, cors);
  } catch (err) {
    console.error("Unhandled /download/[slug] error:", err instanceof Error ? err.stack : err);
    return json({ error: "Internal error. Please try again later." }, 500, cors);
  }
}

async function handleDownload(
  request: NextRequest,
  params: Promise<{ slug: string }>,
  env: Awaited<ReturnType<typeof getEnv>>,
  cors: Record<string, string>
) {
  if (!originAllowed(request)) {
    return jsonOrHtml(request, { error: "Forbidden — origin not allowed" }, 403, cors);
  }

  const accessResult = await checkAndRecordPublicAccess(env.RATE_LIMIT_KV, getClientIp(request), "/download");
  if (!accessResult.allowed) {
    return json(
      { error: "Too many requests from this IP. Please slow down.", retry_after_seconds: accessResult.retryAfterSeconds },
      429,
      cors
    );
  }

  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return jsonOrHtml(request, { error: "File not found" }, 404, cors);
  }

  const row = await sbGetBySlug(env, slug);
  if (!row || row.type !== "file" || !row.file_path) {
    return jsonOrHtml(request, { error: "File not found" }, 404, cors);
  }
  if (!row.is_active) {
    await deactivateAndCleanup(env, row);
    return json({ error: "This send is no longer active" }, 410, cors);
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await deactivateAndCleanup(env, row);
    return json({ error: "This send has expired" }, 410, cors);
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!(await verifyDownloadToken(env.RATE_LIMIT_KV, slug, token))) {
    return jsonOrHtml(
      request,
      { error: "Missing or invalid download token — reopen the link to try again." },
      403,
      cors
    );
  }

  const obj = await env.BUCKET.get(row.file_path);
  if (!obj) {
    return jsonOrHtml(request, { error: "File not found in storage" }, 404, cors);
  }

  const ivFile = obj.customMetadata?.ivFile || "";
  const saltFile = obj.customMetadata?.saltFile || "";

  return new NextResponse(obj.body, {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/octet-stream",
      "X-Iv-File": ivFile,
      "X-Salt-File": saltFile,
      "Content-Length": String(obj.size),
    },
  });
}
