import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";
import { corsFromRequest, originAllowed, jsonOrHtml, json, timingSafeEqual, hashApiKey } from "@/lib/zk/security";
import { guardInternalKey } from "@/lib/zk/auth";
import { sbGetBySlug, deactivateAndCleanup } from "@/lib/zk/supabase";
import { SLUG_PATTERN } from "@/lib/zk/validation";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsFromRequest(request) });
}

// REQUIRES INTERNAL_KEY (rate-limited via guardInternalKey), PLUS: if this
// row was created WITH a key (created_with_key_hash set), the key used to
// DELETE must MATCH the key that created it (constant-time compare). Rows
// created via the PUBLIC path (created_with_key_hash null) can be deleted
// by any valid INTERNAL_KEY holder — that's intentional, not a hole: the
// public path has no concept of "ownership" at all.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const cors = corsFromRequest(request);
  const env = await getEnv();

  try {
    return await handleDelete(request, params, env, cors);
  } catch (err) {
    console.error("Unhandled DELETE /send/[slug] error:", err instanceof Error ? err.stack : err);
    return json({ error: "Internal error. Please try again later." }, 500, cors);
  }
}

async function handleDelete(
  request: NextRequest,
  params: Promise<{ slug: string }>,
  env: Awaited<ReturnType<typeof getEnv>>,
  cors: Record<string, string>
) {
  if (!originAllowed(request)) {
    return jsonOrHtml(request, { error: "Forbidden — origin not allowed" }, 403, cors);
  }

  const guardResp = await guardInternalKey(env, request, cors);
  if (guardResp) return guardResp;

  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return jsonOrHtml(request, { error: "Not found" }, 404, cors);
  }

  const row = await sbGetBySlug(env, slug);
  if (!row) return jsonOrHtml(request, { error: "Not found" }, 404, cors);

  if (row.created_with_key_hash) {
    const requestKey = request.headers.get("X-Api-Key") || "";
    const requestKeyHash = await hashApiKey(requestKey);
    if (!timingSafeEqual(requestKeyHash || "", row.created_with_key_hash)) {
      return json(
        { error: "This send was created with a different key and cannot be deleted with the key provided." },
        403,
        cors
      );
    }
  }

  await deactivateAndCleanup(env, row);
  return json({ deleted: true, slug }, 200, cors);
}
