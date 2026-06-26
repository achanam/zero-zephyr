const ALLOWED_ORIGINS = [
  "https://zero.achanam.com",
];

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const RATE_LIMIT_LOCKOUT_SECONDS = 30 * 60;

const MAX_FILE_BYTES = 100 * 1024 * 1024;

const MAX_TEXT_BODY_BYTES = 1 * 1024 * 1024;

const EXPIRES_MIN_HOURS = 1;
const EXPIRES_MAX_HOURS = 72;

const MAX_VIEWS_MIN = 1;
const MAX_VIEWS_MAX = 9;

const PUBLIC_SEND_LIMITS = {
  "/send/text": { maxAttempts: 9, windowSeconds: 17 * 60 },
  "/send/file": { maxAttempts: 5, windowSeconds: 30 * 60 },
};

const GLOBAL_SEND_CEILING = {
  "/send/text": { maxAttempts: 300, windowSeconds: 17 * 60 },
  "/send/file": { maxAttempts: 150, windowSeconds: 30 * 60 },
};

function buildCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-File-Name, X-File-Mime, X-Api-Key, X-Meta-Cipher, X-Salt, X-Iv-Meta, X-Iv-File, X-Salt-File, X-Burn-After-Read, X-Max-Views, X-Expires-In-Hours",
    "Access-Control-Expose-Headers":
      "X-Iv-File, X-Salt-File, X-Salt, X-Iv-Meta, X-Meta-Cipher, X-Vaultline-Burned, Content-Length, Content-Disposition",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cross-Origin-Resource-Policy": "same-site",
  };
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
  };
}

function baseHeaders(cors) {
  return { ...cors, ...securityHeaders(), ...noStoreHeaders() };
}

function originAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return false;

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function checkAndRecordPublicSend(ip, path) {
  const limit = PUBLIC_SEND_LIMITS[path];
  const key = `pubsend:${path}:${ip}`;
  const now = Date.now();
  const windowStart = now - limit.windowSeconds * 1000;

  const raw = await RATE_LIMIT_KV.get(key);
  let timestamps = [];
  if (raw) {
    try {
      timestamps = JSON.parse(raw).filter((t) => t > windowStart);
    } catch {
      timestamps = [];
    }
  }

  if (timestamps.length >= limit.maxAttempts) {
    const oldestInWindow = Math.min(...timestamps);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestInWindow + limit.windowSeconds * 1000 - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  await RATE_LIMIT_KV.put(key, JSON.stringify(timestamps), {
    expirationTtl: limit.windowSeconds,
  });
  return { allowed: true, recordedAt: now };
}

async function rollbackPublicSendAttempt(ip, path, recordedAt) {
  const limit = PUBLIC_SEND_LIMITS[path];
  const key = `pubsend:${path}:${ip}`;
  const raw = await RATE_LIMIT_KV.get(key);
  if (!raw) return;
  try {
    const timestamps = JSON.parse(raw).filter((t) => t !== recordedAt);
    if (timestamps.length === 0) {
      await RATE_LIMIT_KV.delete(key);
    } else {
      await RATE_LIMIT_KV.put(key, JSON.stringify(timestamps), {
        expirationTtl: limit.windowSeconds,
      });
    }
  } catch {
  }
}

async function checkAndRecordGlobalCeiling(path) {
  const ceiling = GLOBAL_SEND_CEILING[path];
  const key = `globalsend:${path}`;
  const raw = await RATE_LIMIT_KV.get(key);
  const count = Number(raw) || 0;

  if (count >= ceiling.maxAttempts) {
    return { allowed: false };
  }

  await RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: ceiling.windowSeconds,
  });
  return { allowed: true };
}

async function rollbackGlobalCeilingAttempt(path) {
  const ceiling = GLOBAL_SEND_CEILING[path];
  const key = `globalsend:${path}`;
  const raw = await RATE_LIMIT_KV.get(key);
  if (!raw) return;
  const count = Number(raw) || 0;
  const next = Math.max(0, count - 1);
  if (next === 0) {
    await RATE_LIMIT_KV.delete(key);
  } else {
    await RATE_LIMIT_KV.put(key, String(next), {
      expirationTtl: ceiling.windowSeconds,
    });
  }
}

async function rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded) {
  if (!isPublicSend) return;
  await rollbackPublicSendAttempt(getClientIp(request), path, publicSendRecordedAt);
  if (globalCeilingRecorded) {
    await rollbackGlobalCeilingAttempt(path);
  }
}

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function readJsonWithLimit(request, maxBytes) {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    const err = new Error("Request body exceeds the allowed size.");
    err.tooLarge = true;
    throw err;
  }

  if (!request.body) {
    return JSON.parse("");
  }

  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      const err = new Error("Request body exceeds the allowed size.");
      err.tooLarge = true;
      throw err;
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(combined);
  return JSON.parse(text);
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function sbInsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/secure_sends`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0];
}

async function sbGetBySlug(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&select=*`,
    { headers: sbHeaders() }
  );
  if (!res.ok) {
    throw new Error(`Supabase select failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0] || null;
}

async function sbUpdateBySlug(slug, patch) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: sbHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase update failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0];
}

async function sbConditionalUpdateBySlug(slug, expectedViewCount, patch) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&view_count=eq.${encodeURIComponent(expectedViewCount)}`,
    {
      method: "PATCH",
      headers: sbHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase conditional update failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0] || null;
}

async function sbDeleteBySlug(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
      headers: sbHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase delete failed: ${res.status} ${await res.text()}`);
  }
  return true;
}

async function sbConditionalDeleteBySlug(slug, expectedViewCount) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/secure_sends?slug=eq.${encodeURIComponent(slug)}&view_count=eq.${encodeURIComponent(expectedViewCount)}`,
    {
      method: "DELETE",
      headers: sbHeaders({ Prefer: "return=representation" }),
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase conditional delete failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.length > 0;
}

function randomSlug() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SLUG_PATTERN = "[0-9a-f]{32}";

async function hashApiKey(key) {
  if (!key) return null;
  const bytes = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
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

function validateExpiresInHours(raw) {
  const hours = Number(raw);
  if (!raw || Number.isNaN(hours)) return null;
  if (hours < EXPIRES_MIN_HOURS || hours > EXPIRES_MAX_HOURS) return null;
  return hours;
}

function validateMaxViews(raw) {
  if (raw === undefined || raw === null || raw === "") return MAX_VIEWS_MIN;
  const views = Number(raw);
  if (!Number.isInteger(views)) return null;
  if (views < MAX_VIEWS_MIN || views > MAX_VIEWS_MAX) return null;
  return views;
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function checkLockout(ip) {
  const lockKey = `lock:${ip}`;
  const lockedUntilRaw = await RATE_LIMIT_KV.get(lockKey);
  if (!lockedUntilRaw) return { locked: false, remainingSeconds: 0 };

  const lockedUntil = Number(lockedUntilRaw);
  const now = Date.now();
  if (now < lockedUntil) {
    return { locked: true, remainingSeconds: Math.ceil((lockedUntil - now) / 1000) };
  }
  await RATE_LIMIT_KV.delete(lockKey);
  return { locked: false, remainingSeconds: 0 };
}

async function recordFailedAttempt(ip) {
  const attemptKey = `attempts:${ip}`;
  const current = await RATE_LIMIT_KV.get(attemptKey);
  const count = (Number(current) || 0) + 1;

  if (count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const lockKey = `lock:${ip}`;
    const lockedUntil = Date.now() + RATE_LIMIT_LOCKOUT_SECONDS * 1000;
    await RATE_LIMIT_KV.put(lockKey, String(lockedUntil), {
      expirationTtl: RATE_LIMIT_LOCKOUT_SECONDS,
    });
    await RATE_LIMIT_KV.delete(attemptKey);
  } else {
    await RATE_LIMIT_KV.put(attemptKey, String(count), {
      expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
    });
  }
}

async function clearFailedAttempts(ip) {
  await RATE_LIMIT_KV.delete(`attempts:${ip}`);
  await RATE_LIMIT_KV.delete(`lock:${ip}`);
}

async function guardInternalKey(request, cors) {
  const ip = getClientIp(request);

  const lockStatus = await checkLockout(ip);
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
  if (!INTERNAL_KEY || !timingSafeEqual(apiKey, INTERNAL_KEY)) {
    await recordFailedAttempt(ip);
    return json({ error: "Unauthorized — Internal Key is missing or incorrect" }, 401, cors);
  }

  await clearFailedAttempts(ip);
  return null;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = baseHeaders(buildCorsHeaders(origin));

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/health") {
        return json({ status: "ok", ts: Date.now() }, 200, cors);
      }

      if (!originAllowed(request)) {
        return json({ error: "Forbidden — origin not allowed" }, 403, cors);
      }

      let isPublicSend = false;
      let publicSendRecordedAt = null;
      let globalCeilingRecorded = false;
      if (PUBLIC_SEND_LIMITS[path]) {
        const hasKey = !!(request.headers.get("X-Api-Key") || "");
        if (!hasKey) {
          isPublicSend = true;
          const ip = getClientIp(request);
          const limit = PUBLIC_SEND_LIMITS[path];
          const result = await checkAndRecordPublicSend(ip, path);
          if (!result.allowed) {
            return json(
              {
                error: `Too many requests from this IP. Try again later, or provide an Internal Key.`,
              },
              429,
              cors
            );
          }
          publicSendRecordedAt = result.recordedAt;

          const globalResult = await checkAndRecordGlobalCeiling(path);
          if (!globalResult.allowed) {
            await rollbackPublicSendAttempt(ip, path, publicSendRecordedAt);
            return json(
              {
                error: "This service is experiencing high demand right now. Please try again shortly, or provide an Internal Key.",
              },
              429,
              cors
            );
          }
          globalCeilingRecorded = true;
        }
      }

      if (request.method === "POST" && path === "/send/text") {
        const providedKey = request.headers.get("X-Api-Key") || "";
        if (providedKey) {
          const guardResp = await guardInternalKey(request, cors);
          if (guardResp) return guardResp;
        }

        let body;
        try {
          body = await readJsonWithLimit(request, MAX_TEXT_BODY_BYTES);
        } catch (err) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          if (err && err.tooLarge) {
            return json(
              { error: `Request body too large. Max ${MAX_TEXT_BODY_BYTES / 1024 / 1024} MB for text sends.` },
              413,
              cors
            );
          }
          body = null;
        }
        if (!body || !body.ciphertext || !body.salt || !body.iv) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({ error: "Missing encrypted payload (ciphertext/salt/iv)" }, 400, cors);
        }

        const expiresInHours = validateExpiresInHours(body.expires_in_hours);
        if (expiresInHours === null) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({
            error: `expires_in_hours is required and must be between ${EXPIRES_MIN_HOURS} and ${EXPIRES_MAX_HOURS} hours.`,
          }, 400, cors);
        }

        const maxViews = validateMaxViews(body.max_views);
        if (maxViews === null) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({
            error: `max_views must be a whole number between ${MAX_VIEWS_MIN} and ${MAX_VIEWS_MAX}.`,
          }, 400, cors);
        }

        const slug = randomSlug();
        const row = {
          slug,
          title: "[encrypted]",
          type: "text",
          content: `${body.salt}.${body.iv}.${body.ciphertext}`,
          storage_type: "inline",
          burn_after_read: !!body.burn_after_read,
          max_views: body.burn_after_read ? 1 : maxViews,
          view_count: 0,
          is_active: true,
          expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          created_with_key_hash: providedKey ? await hashApiKey(providedKey) : null,
        };

        const saved = await sbInsert(row);
        return json({ slug: saved.slug, type: saved.type }, 200, cors);
      }

      if (request.method === "POST" && path === "/send/file") {
        const PUBLIC_MAX_BYTES = 20 * 1024 * 1024;
        const AUTH_MAX_BYTES   = 100 * 1024 * 1024;

        const providedKey = request.headers.get("X-Api-Key") || "";
        let authenticated = false;

        if (providedKey) {
          const guardResp = await guardInternalKey(request, cors);
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
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({ error: "Missing encrypted metadata (meta-cipher/salt/iv)" }, 400, cors);
        }

        const expiresInHours = validateExpiresInHours(request.headers.get("X-Expires-In-Hours"));
        if (expiresInHours === null) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({
            error: `X-Expires-In-Hours is required and must be between ${EXPIRES_MIN_HOURS} and ${EXPIRES_MAX_HOURS} hours.`,
          }, 400, cors);
        }

        const maxViews = validateMaxViews(request.headers.get("X-Max-Views"));
        if (maxViews === null) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({
            error: `X-Max-Views must be a whole number between ${MAX_VIEWS_MIN} and ${MAX_VIEWS_MAX}.`,
          }, 400, cors);
        }

        const encryptedBody = await request.arrayBuffer();
        if (encryptedBody.byteLength === 0) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({ error: "File is empty" }, 400, cors);
        }
        if (encryptedBody.byteLength > maxAllowedBytes) {
          await rollbackPublicSendIfNeeded(request, path, isPublicSend, publicSendRecordedAt, globalCeilingRecorded);
          return json({
            error: `File too large. ${authenticated
              ? `Max ${AUTH_MAX_BYTES / 1024 / 1024} MB with Internal Key.`
              : `Max ${PUBLIC_MAX_BYTES / 1024 / 1024} MB without Internal Key. Provide a valid key to upload up to ${AUTH_MAX_BYTES / 1024 / 1024} MB.`
            }`,
            requires_key: !authenticated,
          }, 413, cors);
        }

        const slug = randomSlug();
        const r2Key = `files/${slug}/blob`;

        await BUCKET.put(r2Key, encryptedBody, {
          httpMetadata: { contentType: "application/octet-stream" },
          customMetadata: { slug, ivFile, saltFile },
        });

        const row = {
          slug,
          title: "[encrypted]",
          type: "file",
          content: `${salt}.${ivMeta}.${metaCipher}`,
          file_path: r2Key,
          file_size: encryptedBody.byteLength,
          file_mime: "application/octet-stream",
          storage_type: "r2",
          burn_after_read: burnAfterRead,
          max_views: burnAfterRead ? 1 : maxViews,
          view_count: 0,
          is_active: true,
          expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          created_with_key_hash: providedKey ? await hashApiKey(providedKey) : null,
        };

        const saved = await sbInsert(row);
        return json({ slug: saved.slug, type: saved.type }, 200, cors);
      }

      const receiveMatch = path.match(new RegExp(`^/receive/(${SLUG_PATTERN})$`));
      if (request.method === "POST" && receiveMatch) {
        const slug = receiveMatch[1];
        const row = await sbGetBySlug(slug);

        if (!row || !row.is_active) {
          return json({ error: "Send not found or no longer active" }, 404, cors);
        }
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          await deactivateAndCleanup(row);
          return json({ error: "This send has expired" }, 410, cors);
        }
        const observedViewCount = row.view_count || 0;
        if (row.max_views && observedViewCount >= row.max_views) {
          await deactivateAndCleanup(row);
          return json({ error: "This send has reached its maximum view limit" }, 410, cors);
        }

        const newViewCount = observedViewCount + 1;
        const willExhaust = row.burn_after_read || newViewCount >= row.max_views;

        const [salt, ivMeta, metaCiphertext] = (row.content || "").split(".");
        if (!salt || !ivMeta || !metaCiphertext) {
          return json({ error: "Corrupted send data" }, 500, cors);
        }

        if (willExhaust) {
          const deleted = await sbConditionalDeleteBySlug(slug, observedViewCount);
          if (!deleted) {
            return json({ error: "This send has reached its maximum view limit" }, 410, cors);
          }
        } else {
          const updated = await sbConditionalUpdateBySlug(slug, observedViewCount, {
            view_count: newViewCount,
            is_active: true,
            updated_at: new Date().toISOString(),
          });
          if (!updated) {
            return json({ error: "This send has reached its maximum view limit" }, 410, cors);
          }
        }

        if (willExhaust && row.type === "file") {
          const obj = await BUCKET.get(row.file_path);
          if (!obj) {
            return json({ error: "File not found in storage" }, 404, cors);
          }
          const ivFile = obj.customMetadata?.ivFile || "";
          const saltFile = obj.customMetadata?.saltFile || "";
          const fileBuffer = await obj.arrayBuffer();

          await BUCKET.delete(row.file_path).catch(() => {});

          return new Response(fileBuffer, {
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

        const payload = {
          type: row.type,
          burned: willExhaust,
          salt,
          iv_meta: ivMeta,
          meta_cipher: metaCiphertext,
        };

        if (row.type === "text") {
        } else {
          payload.download_url = `${url.origin}/download/${slug}`;
        }

        return json(payload, 200, cors);
      }

      const downloadMatch = path.match(new RegExp(`^/download/(${SLUG_PATTERN})$`));
      if (request.method === "GET" && downloadMatch) {
        const slug = downloadMatch[1];
        const row = await sbGetBySlug(slug);

        if (!row || row.type !== "file" || !row.file_path) {
          return json({ error: "File not found" }, 404, cors);
        }
        if (!row.is_active) {
          await deactivateAndCleanup(row);
          return json({ error: "This send is no longer active" }, 410, cors);
        }
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          await deactivateAndCleanup(row);
          return json({ error: "This send has expired" }, 410, cors);
        }

        const obj = await BUCKET.get(row.file_path);
        if (!obj) return json({ error: "File not found in storage" }, 404, cors);

        const ivFile = obj.customMetadata?.ivFile || "";
        const saltFile = obj.customMetadata?.saltFile || "";

        return new Response(obj.body, {
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

      const deleteMatch = path.match(new RegExp(`^/send/(${SLUG_PATTERN})$`));
      if (request.method === "DELETE" && deleteMatch) {
        const guardResp = await guardInternalKey(request, cors);
        if (guardResp) return guardResp;
        const slug = deleteMatch[1];
        const row = await sbGetBySlug(slug);
        if (!row) return json({ error: "Not found" }, 404, cors);

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

        await deactivateAndCleanup(row);
        return json({ deleted: true, slug }, 200, cors);
      }

      return json({ error: "Not found" }, 404, cors);
    } catch (err) {
      console.error("Unhandled worker error:", err && err.stack ? err.stack : err);
      return json({ error: "Internal error. Please try again later." }, 500, cors);
    }
  }

async function deactivateAndCleanup(row) {
  if (row.type === "file" && row.file_path) {
    await BUCKET.delete(row.file_path).catch(() => {});
  }
  await sbDeleteBySlug(row.slug);
}
