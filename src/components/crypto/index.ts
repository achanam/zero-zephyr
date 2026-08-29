"use client";

// PBKDF2-SHA256 (600k iterations, OWASP 2023 floor) -> AES-GCM 256.
// All encrypt/decrypt happens in the browser; the server only ever sees
// ciphertext + salt + iv. Changing PBKDF2_ITERATIONS breaks decryption
// of links created with a different value (derived key changes).
const PBKDF2_ITERATIONS = 600_000;

export function randomBytes(len: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(len));
}

export function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function b64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, saltBytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptJson(
  password: string,
  obj: unknown
): Promise<{ salt: string; iv: string; ciphertext: string }> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { salt: bufToB64(salt), iv: bufToB64(iv), ciphertext: bufToB64(ciphertext) };
}

export async function decryptJson<T = unknown>(
  password: string,
  saltB64: string,
  ivB64: string,
  ciphertextB64: string
): Promise<T> {
  const salt = b64ToBuf(saltB64);
  const iv = b64ToBuf(ivB64);
  const key = await deriveKey(password, salt);
  const ciphertext = b64ToBuf(ciphertextB64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export async function encryptBytes(
  password: string,
  saltBytes: Uint8Array<ArrayBuffer>,
  bytes: Uint8Array<ArrayBuffer>
): Promise<{ iv: string; ciphertext: ArrayBuffer }> {
  const iv = randomBytes(12);
  const key = await deriveKey(password, saltBytes);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv: bufToB64(iv), ciphertext };
}

export async function decryptBytes(
  password: string,
  saltB64: string,
  ivB64: string,
  ciphertextBuf: ArrayBuffer
): Promise<ArrayBuffer> {
  const salt = b64ToBuf(saltB64);
  const iv = b64ToBuf(ivB64);
  const key = await deriveKey(password, salt);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertextBuf);
}
