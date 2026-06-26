# Zero Zephyr

A secure ephemeral messaging app. Send text or files to someone — they get one link, one shot to open it, and then it's gone.

Built as a personal hobby project. Use it however you want — personal, commercial, whatever. No strings attached.

---

## What it does

- Send an encrypted message or file to someone via a one-time link
- Everything is encrypted in the browser before it leaves your device — the server only ever sees ciphertext
- Links expire automatically (1 hour to 3 days, your choice)
- Optional burn-after-read: destroyed the moment it's opened
- Built-in password generator so you don't have to think about it

The server never sees your password, your message, or your file. If someone intercepts the ciphertext without the password, there's nothing useful there.

---

## Stack

- **Frontend** — vanilla HTML/CSS/JS, no build step
- **Worker** — Cloudflare Workers (Service Worker format)
- **Storage** — Cloudflare R2 (file blobs) + Cloudflare KV (rate limiting)
- **Database** — Supabase (send metadata, view counts, expiry)

---

## How the crypto works

Encryption happens entirely client-side using the Web Crypto API:

- Key derivation: PBKDF2-SHA256, 600,000 iterations
- Encryption: AES-GCM 256-bit
- Password generator: `crypto.getRandomValues()` with rejection sampling (no `Math.random()`)

**On the 600k PBKDF2 iterations:** this is intentionally lower than what you'd use for a long-term password store. Zero Zephyr isn't a password manager — files are ephemeral and gone after expiry. The frontend ships a strong password generator, so the assumption is that most passwords are high-entropy and randomly generated. 600k is the OWASP 2023 recommendation floor for PBKDF2-SHA256, and it's the right call for this use case.

---

## Deploy it yourself

### Worker

1. Create a Cloudflare Worker and paste `worker/zeroZephyr.js`
2. Set up the bindings in your Worker settings:
   - **KV namespace** → bind as `RATE_LIMIT_KV`
   - **R2 bucket** → bind as `BUCKET`
3. Set these environment variables (as secrets, not plain text):
   ```
   INTERNAL_KEY        → a long random string, your private API key
   SUPABASE_URL        → your Supabase project URL
   SUPABASE_SERVICE_KEY → your Supabase service role key
   ```

### Supabase

Create a table called `secure_sends` with these columns:

| Column | Type |
|---|---|
| `slug` | text, primary key |
| `title` | text |
| `type` | text (`text` or `file`) |
| `content` | text |
| `file_path` | text, nullable |
| `file_size` | int8, nullable |
| `file_mime` | text, nullable |
| `storage_type` | text |
| `burn_after_read` | boolean |
| `max_views` | int4 |
| `view_count` | int4, default 0 |
| `is_active` | boolean, default true |
| `expires_at` | timestamptz |
| `created_with_key_hash` | text, nullable |
| `created_at` | timestamptz, default now() |
| `updated_at` | timestamptz, nullable |

### Frontend

Point `ZERO` in `frontend/page.html` to your Worker URL, then host the HTML file anywhere — Vercel, Cloudflare Pages, a plain web server, whatever.

---

## Contributing

If you want to fix something or add something, go ahead and open a PR. No formal process — just explain what you changed and why.

---

## License

MIT. Do whatever you want with it.
