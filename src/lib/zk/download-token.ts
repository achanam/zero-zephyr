// Ties /download to a prior /receive call for the same slug — without this,
// the slug alone was enough to re-fetch a file's ciphertext indefinitely,
// bypassing max_views/burn_after_read entirely.

import type { Env } from "../cf";

const DOWNLOAD_TOKEN_TTL_SECONDS = 30 * 60;

function tokenKey(slug: string, token: string): string {
  return `dltoken:${slug}:${token}`;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function mintDownloadToken(kv: Env["RATE_LIMIT_KV"], slug: string): Promise<string> {
  const token = randomToken();
  await kv.put(tokenKey(slug, token), "1", { expirationTtl: DOWNLOAD_TOKEN_TTL_SECONDS });
  return token;
}

export async function verifyDownloadToken(kv: Env["RATE_LIMIT_KV"], slug: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  return (await kv.get(tokenKey(slug, token))) !== null;
}
