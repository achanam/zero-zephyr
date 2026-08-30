import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";
import { corsFromRequest, originAllowed, jsonOrHtml, json, getClientIp } from "@/lib/zk/security";
import { sbGetBySlug, sbConditionalUpdateBySlug, sbConditionalDeleteBySlug, deactivateAndCleanup } from "@/lib/zk/supabase";
import { SLUG_PATTERN } from "@/lib/zk/validation";
import { mintDownloadToken } from "@/lib/zk/download-token";
import { checkAndRecordPublicAccess } from "@/lib/zk/rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsFromRequest(request) });
}

// PUBLIC — the server never validates the password (zero-knowledge). It
// just returns the ciphertext blob and lets the browser attempt decryption.
//
// CONCURRENCY: the check-then-act below is a COMPARE-AND-SWAP, not a plain
// read-then-write. Two near-simultaneous requests for the same slug both
// pass the initial read (sbGetBySlug) with the same view_count, but only
// ONE can win the conditional write (sbConditionalUpdateBySlug /
// sbConditionalDeleteBySlug, filtered on the view_count this request
// observed). The loser is told the link is exhausted and gets NO
// ciphertext — this is what actually prevents a burn-after-read (or final)
// view from being consumed twice by parallel requests.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const cors = corsFromRequest(request);
  const env = await getEnv();

  try {
    return await handleReceive(request, params, env, cors);
  } catch (err) {
    console.error("Unhandled /receive/[slug] error:", err instanceof Error ? err.stack : err);
    return json({ error: "Internal error. Please try again later." }, 500, cors);
  }
}

async function handleReceive(
  request: NextRequest,
  params: Promise<{ slug: string }>,
  env: Awaited<ReturnType<typeof getEnv>>,
  cors: Record<string, string>
) {
  if (!originAllowed(request)) {
    return jsonOrHtml(request, { error: "Forbidden — origin not allowed" }, 403, cors);
  }

  const accessResult = await checkAndRecordPublicAccess(env.RATE_LIMIT_KV, getClientIp(request), "/receive");
  if (!accessResult.allowed) {
    return json(
      { error: "Too many requests from this IP. Please slow down.", retry_after_seconds: accessResult.retryAfterSeconds },
      429,
      cors
    );
  }

  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return jsonOrHtml(request, { error: "Send not found or no longer active" }, 404, cors);
  }

  const row = await sbGetBySlug(env, slug);
  if (!row || !row.is_active) {
    return jsonOrHtml(request, { error: "Send not found or no longer active" }, 404, cors);
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await deactivateAndCleanup(env, row);
    return json({ error: "This send has expired" }, 410, cors);
  }

  const observedViewCount = row.view_count || 0;
  if (row.max_views && observedViewCount >= row.max_views) {
    await deactivateAndCleanup(env, row);
    return json({ error: "This send has reached its maximum view limit" }, 410, cors);
  }

  const newViewCount = observedViewCount + 1;
  const willExhaust = row.burn_after_read || newViewCount >= row.max_views;

  const [salt, ivMeta, metaCiphertext] = (row.content || "").split(".");
  if (!salt || !ivMeta || !metaCiphertext) {
    return json({ error: "Corrupted send data" }, 500, cors);
  }

  // Claim this view FIRST, atomically, before touching R2 or returning any
  // ciphertext. This compare-and-swap is what closes the race.
  if (willExhaust) {
    const deleted = await sbConditionalDeleteBySlug(env, slug, observedViewCount);
    if (!deleted) {
      // Lost the race — another request already exhausted/consumed this send.
      return json({ error: "This send has reached its maximum view limit" }, 410, cors);
    }
  } else {
    const updated = await sbConditionalUpdateBySlug(env, slug, observedViewCount, {
      view_count: newViewCount,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (!updated) {
      // Lost the race — view_count changed under us. The safe failure mode
      // here is to REJECT, not to guess or silently retry.
      return json({ error: "This send has reached its maximum view limit" }, 410, cors);
    }
  }

  // Case: a FILE that's about to be exhausted — the compare-and-swap above
  // already WON, so it's safe to fetch+stream the ciphertext bytes now; no
  // other request can win this same row again. The R2 object is deleted
  // RIGHT after being read, before the response is sent.
  if (willExhaust && row.type === "file" && row.file_path) {
    const obj = await env.BUCKET.get(row.file_path);
    if (!obj) {
      // R2 object missing (orphaned) — the DB row is already gone via the
      // compare-and-swap above, and that's still correct: this view was
      // already claimed irrevocably, so there's nothing to roll back.
      return jsonOrHtml(request, { error: "File not found in storage" }, 404, cors);
    }
    const ivFile = obj.customMetadata?.ivFile || "";
    const saltFile = obj.customMetadata?.saltFile || "";
    const fileBuffer = await obj.arrayBuffer();

    await env.BUCKET.delete(row.file_path).catch(() => {});

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/octet-stream",
        "X-Vaultline-Burned": "1",
        "X-Salt": salt,
        "X-Iv-Meta": ivMeta,
        "X-Meta-Cipher": metaCiphertext,
        "X-Iv-File": ivFile,
        "X-Salt-File": saltFile,
      },
    });
  }

  const payload: Record<string, unknown> = {
    type: row.type,
    burned: willExhaust,
    salt,
    iv_meta: ivMeta,
    meta_cipher: metaCiphertext,
  };

  if (row.type !== "text") {
    // required by /download — see download-token.ts
    const token = await mintDownloadToken(env.RATE_LIMIT_KV, slug);
    payload.download_url = `${new URL(request.url).origin}/api/download/${slug}?token=${token}`;
  }

  return json(payload, 200, cors);
}
