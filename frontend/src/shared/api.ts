/**
 * Accès unique à l'API.
 *
 * Règle : une action n'est présentée comme réussie que si le serveur l'a confirmée. Toute autre issue
 * lève une `ApiError` avec un message lisible, que l'écran doit afficher.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly conflict: boolean;

  constructor(message: string, status: number, conflict = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.conflict = conflict;
  }
}

const NETWORK_ERROR_MESSAGE = "Connexion impossible. Vérifiez votre réseau puis réessayez.";
const SERVER_ERROR_MESSAGE = "Le serveur n'a pas répondu correctement. Veuillez réessayer.";
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  /**
   * Nombre de nouveaux essais automatiques. Par défaut, seules les lectures et les écritures rejouables
   * (GET, PUT, DELETE) sont retentées. Un POST ou PATCH ne doit l'être que s'il est idempotent côté serveur.
   */
  retries?: number;
  timeoutMs?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method || "GET";
  const defaultRetries = method === "GET" || method === "PUT" || method === "DELETE" ? 2 : 0;
  const maxRetries = options.retries ?? defaultRetries;
  const timeoutMs = options.timeoutMs ?? 20000;

  let lastError: ApiError = new ApiError(NETWORK_ERROR_MESSAGE, 0);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) await delay(400 * 2 ** (attempt - 1));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(path, {
        method,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const data: any = await res.json().catch(() => null);

      if (res.ok) return data as T;

      const message = readErrorMessage(data) || SERVER_ERROR_MESSAGE;
      lastError = new ApiError(message, res.status, Boolean(data?.conflict));
      const retryable = RETRYABLE_STATUS.has(res.status) || (res.status >= 500 && data === null);
      if (!retryable) throw lastError;
    } catch (err) {
      if (err instanceof ApiError && err === lastError && !RETRYABLE_STATUS.has(err.status) && err.status < 500) {
        throw err;
      }
      if (!(err instanceof ApiError)) {
        lastError = new ApiError(NETWORK_ERROR_MESSAGE, 0);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

/** Les erreurs de validation Zod arrivent sous forme d'objet : on en extrait le premier message utile. */
function readErrorMessage(data: any): string | null {
  if (!data) return null;
  if (typeof data.error === "string") return data.error;
  const issues = data.error?.issues || data.issues;
  if (Array.isArray(issues) && typeof issues[0]?.message === "string") return issues[0].message;
  if (typeof data.message === "string") return data.message;
  return null;
}

/** Identifiant unique, y compris hors contexte HTTPS où `crypto.randomUUID` n'existe pas. */
export function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
