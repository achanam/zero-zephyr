import { getCloudflareContext } from "@opennextjs/cloudflare";

interface KVBinding {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface R2ObjectBody {
  body: ReadableStream;
  size: number;
  customMetadata?: Record<string, string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

interface R2Binding {
  get: (key: string) => Promise<R2ObjectBody | null>;
  put: (
    key: string,
    value: ArrayBuffer | ReadableStream,
    opts?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  // Only valid API key in the system (see guardInternalKey in
  // src/lib/zk/security.ts) — bypasses the public rate limit, unlocks DELETE.
  INTERNAL_KEY: string;
  RATE_LIMIT_KV: KVBinding;
  BUCKET: R2Binding;
}

/**
 * Get Cloudflare env/bindings from a Route Handler, Server Component, or
 * Server Action. Requires initOpenNextCloudflareForDev() in next.config.mjs
 * to work under `next dev` locally.
 */
export async function getEnv(): Promise<Env> {
  const ctx = await getCloudflareContext({ async: true });
  return ctx.env as unknown as Env;
}
