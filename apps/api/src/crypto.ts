/**
 * Cryptographie sécurisée basée exclusivement sur l'API Web Crypto standard.
 * 100% compatible avec Cloudflare Workers (V8 Isolates), sans aucune dépendance C++ native.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

/**
 * Hache un mot de passe en utilisant PBKDF2 (SHA-256) avec 100 000 itérations et un sel aléatoire de 16 octets.
 * Format de sortie : `pbkdf2:100000:<salt_hex>:<hash_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(hashArray);

  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Vérifie un mot de passe contre son hash stocké en comparaison à temps constant.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = parseInt(parts[1] ?? "", 10);
  const saltHex = parts[2] ?? "";
  const expectedHashHex = parts[3] ?? "";

  if (Number.isNaN(iterations) || !saltHex || !expectedHashHex) {
    return false;
  }

  const salt = hexToBuffer(saltHex);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const computedHashHex = bufferToHex(new Uint8Array(derivedBits));
  return constantTimeCompare(computedHashHex, expectedHashHex);
}

/**
 * Signe un payload JSON sous forme de jeton JWT sécurisé (HS256).
 */
export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(dataToSign));
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Vérifie et décode un jeton JWT.
 */
export async function verifyJwt<T = Record<string, unknown>>(token: string, secret: string): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  const dataToSign = `${headerB64}.${payloadB64}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = base64UrlDecode(sigB64);
  const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, enc.encode(dataToSign));
  if (!isValid) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    return JSON.parse(payloadJson) as T;
  } catch {
    return null;
  }
}

// Utilitaires de conversion
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
