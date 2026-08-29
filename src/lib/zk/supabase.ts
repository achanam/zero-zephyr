// Ported 1:1 from indexZk.js. DO NOT simplify sbConditionalUpdateBySlug /
// sbConditionalDeleteBySlug into plain sbUpdateBySlug / sbDeleteBySlug —
// the `view_count=eq.<expectedViewCount>` filter is what makes the
// operation an atomic compare-and-swap at the Postgres level (via
// PostgREST), not just "fast". This is what prevents a burn-after-read /
// max-views link from being opened twice by two near-simultaneous
// requests for the same slug.

import type { Env } from "../cf";

export interface SecureSendRow {
  slug: string;
  title: string;
  type: "text" | "file";
  content: string;
  storage_type: "inline" | "r2";
  file_path?: string;
  file_size?: number;
  file_mime?: string;
  burn_after_read: boolean;
  max_views: number;
  view_count: number;
  is_active: boolean;
  expires_at: string;
  created_with_key_hash: string | null;
  updated_at?: string;
}

function sbHeaders(env: Env, extra: Record<string, string> = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function sbInsert(env: Env, row: Partial<SecureSendRow>): Promise<SecureSendRow> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/secure_sends`, {
    method: "POST",
    headers: sbHeaders(env, { Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as SecureSendRow[];
  return data[0];
}

export async function sbGetBySlug(env: Env, slug: string): Promise<SecureSendRow | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&select=*`,
    { headers: sbHeaders(env) }
  );
  if (!res.ok) {
    throw new Error(`Supabase select failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as SecureSendRow[];
  return data[0] || null;
}

/**
 * Compare-and-swap PATCH — the `view_count=eq.<expectedViewCount>` filter
 * makes this atomic at the DB level, not a plain read-then-write. Returns
 * null if the filter matched nothing (lost the race / row already changed).
 */
export async function sbConditionalUpdateBySlug(
  env: Env,
  slug: string,
  expectedViewCount: number,
  patch: Partial<SecureSendRow>
): Promise<SecureSendRow | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&view_count=eq.${encodeURIComponent(String(expectedViewCount))}`,
    {
      method: "PATCH",
      headers: sbHeaders(env, { Prefer: "return=representation" }),
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase conditional update failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as SecureSendRow[];
  return data[0] || null;
}

export async function sbDeleteBySlug(env: Env, slug: string): Promise<true> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: sbHeaders(env),
  });
  if (!res.ok) {
    throw new Error(`Supabase delete failed: ${res.status} ${await res.text()}`);
  }
  return true;
}

/** Compare-and-swap counterpart for DELETE — same principle as sbConditionalUpdateBySlug. */
export async function sbConditionalDeleteBySlug(
  env: Env,
  slug: string,
  expectedViewCount: number
): Promise<boolean> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&view_count=eq.${encodeURIComponent(String(expectedViewCount))}`,
    {
      method: "DELETE",
      headers: sbHeaders(env, { Prefer: "return=representation" }),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase conditional delete failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as SecureSendRow[];
  return data.length > 0;
}

/** Deletes the R2 file (if any) + the Supabase row — called on expiry/exhaustion/manual delete. */
export async function deactivateAndCleanup(env: Env, row: SecureSendRow): Promise<void> {
  if (row.type === "file" && row.file_path) {
    await env.BUCKET.delete(row.file_path).catch(() => {});
  }
  await sbDeleteBySlug(env, row.slug);
}
