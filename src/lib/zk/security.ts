// Ported 1:1 from the old "zk" worker (indexZk.js). The concepts, check
// ordering, and security rationale are unchanged — only the shape was
// adapted to Next.js Route Handlers (NextRequest/NextResponse, bindings via
// getEnv() instead of globals).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = ["https://z.achanam.com"];

export function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-File-Name, X-File-Mime, X-Api-Key, X-Meta-Cipher, X-Salt, X-Iv-Meta, X-Iv-File, X-Salt-File, X-Burn-After-Read, X-Max-Views, X-Expires-In-Hours",
    "Access-Control-Expose-Headers":
      "X-Iv-File, X-Salt-File, X-Salt, X-Iv-Meta, X-Meta-Cipher, X-Vaultline-Burned, Content-Length, Content-Disposition",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  // Only send Allow-Origin when the origin is whitelisted. If it doesn't
  // match (or there's no Origin header), this is deliberately omitted so
  // the browser blocks the response.
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cross-Origin-Resource-Policy": "same-site",
  };
}

export function noStoreHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
  };
}

/** CORS + security + no-store combined — single control point used by ALL responses. */
export function baseHeaders(cors: Record<string, string>): Record<string, string> {
  return { ...cors, ...securityHeaders(), ...noStoreHeaders() };
}

export function corsFromRequest(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("Origin");
  return baseHeaders(buildCorsHeaders(origin));
}

/**
 * Server-side origin check — browser CORS alone can be bypassed by a
 * non-browser request that fakes the Origin header. Strict mode: Origin
 * MUST be present and whitelisted, and if Referer is also sent, it must
 * be consistent with Origin.
 */
export function originAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return false;

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== origin) return false;
    } catch {
      return false; // malformed Referer — reject rather than let it pass
    }
  }
  return true;
}

export function json(data: unknown, status = 200, cors: Record<string, string> = {}): NextResponse {
  return NextResponse.json(data, { status, headers: cors });
}

const BRAND_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#222"><title>Zero Zephyr</title><style>body{margin:0;padding:0;background-color:#222;height:100vh;display:flex;justify-content:center;align-items:center;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif}.github-link{color:#000;text-decoration:none;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;padding:8px 16px;border-radius:20px;background-color:#fff;transition:all .3s ease}.github-link:hover{background-color:#e5e5e5;transform:scale(1.05)}.github-icon{width:18px;height:18px;fill:currentColor}</style></head><body><a href="https://github.com/achanam/zero-zephyr" class="github-link" target="_blank"><svg class="github-icon" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>Zero Zephyr</a></body></html>`;

/** Browser hits (Accept: text/html) get the branded page instead of raw JSON error body. */
export function wantsHtml(request: NextRequest): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html");
}

export function jsonOrHtml(
  request: NextRequest,
  data: unknown,
  status: number,
  cors: Record<string, string>
): NextResponse {
  if (wantsHtml(request)) {
    return new NextResponse(BRAND_HTML, {
      status,
      headers: {
        ...cors,
        "Content-Type": "text/html; charset=UTF-8",
        // Override default-src 'none' — this response has an inline <style>.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
      },
    });
  }
  return json(data, status, cors);
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

/**
 * Constant-time string compare for secrets (INTERNAL_KEY). Deliberately
 * doesn't short-circuit on the first differing char — that's a textbook
 * timing side-channel with a plain `a !== b`. INTERNAL_KEY is the most
 * sensitive credential here (bypasses all rate limits, unlocks DELETE), so
 * it gets constant-time treatment even though this attack is hard to
 * exploit in practice on Cloudflare's edge network.
 */
export function timingSafeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }
  return diff === 0;
}

/** SHA-256 hash of an API key, hex-encoded — see the old indexZk.js comments for its scope. */
export async function hashApiKey(key: string | null): Promise<string | null> {
  if (!key) return null;
  const bytes = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
