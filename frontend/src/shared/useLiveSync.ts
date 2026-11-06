"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "./api";

export type SyncStatus = "connecting" | "online" | "offline";

interface LiveSyncOptions {
  /** `/api/v1/public/sync` ou `/api/admin/sync`. */
  endpoint: string;
  token?: string | null;
  enabled?: boolean;
  /** Domaines à surveiller. Sans précision, tous ceux renvoyés par le serveur. */
  scopes?: string[];
  intervalMs?: number;
  /**
   * Appelé au premier contact, puis à chaque changement détecté, avec les domaines concernés.
   * Renvoyer `false` (échec de rechargement) fait retenter ces domaines au tour suivant.
   */
  onChange: (changedScopes: string[]) => Promise<boolean | void> | boolean | void;
  onUnauthorized?: () => void;
}

/**
 * Maintient un écran aligné sur la base de données.
 *
 * Toutes les quelques secondes, on lit de simples compteurs incrémentés par des triggers SQL : aucune
 * écriture ne peut y échapper. Les données ne sont rechargées que si un compteur a bougé. Une vérification
 * immédiate a lieu au retour sur l'onglet et au retour du réseau, ce qui rattrape toute coupure.
 */
export function useLiveSync({
  endpoint,
  token,
  enabled = true,
  scopes,
  intervalMs = 4000,
  onChange,
  onUnauthorized,
}: LiveSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>("connecting");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const onChangeRef = useRef(onChange);
  const onUnauthorizedRef = useRef(onUnauthorized);
  onChangeRef.current = onChange;
  onUnauthorizedRef.current = onUnauthorized;

  const versionsRef = useRef<Record<string, number> | null>(null);
  const tickRef = useRef<() => void>(() => {});
  const scopesKey = scopes?.join(",") || "";

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const watched = scopesKey ? scopesKey.split(",") : null;

    const schedule = () => {
      if (stopped) return;
      clearTimeout(timer);
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      timer = setTimeout(tick, hidden ? intervalMs * 5 : intervalMs);
    };

    async function tick() {
      if (stopped || running) return;
      running = true;
      try {
        const data = await apiRequest<{ versions: Record<string, number> }>(endpoint, {
          token,
          retries: 0,
          timeoutMs: 10000,
        });
        if (stopped) return;

        const next = data.versions || {};
        const previous = versionsRef.current;
        const keys = Object.keys(next).filter((scope) => !watched || watched.includes(scope));
        const changed = keys.filter((scope) => !previous || previous[scope] !== next[scope]);

        if (changed.length > 0) {
          const result = await onChangeRef.current(changed);
          if (stopped) return;
          if (result !== false) versionsRef.current = { ...previous, ...next };
        } else {
          versionsRef.current = { ...previous, ...next };
        }

        setStatus("online");
        setLastSyncedAt(Date.now());
      } catch (err: any) {
        if (stopped) return;
        if (err?.status === 401) onUnauthorizedRef.current?.();
        setStatus("offline");
      } finally {
        running = false;
        schedule();
      }
    }

    tickRef.current = () => {
      clearTimeout(timer);
      void tick();
    };

    const wake = () => {
      if (document.visibilityState !== "hidden") tickRef.current();
    };

    void tick();
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);

    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [endpoint, token, enabled, scopesKey, intervalMs]);

  const checkNow = useCallback(() => tickRef.current(), []);

  return { status, lastSyncedAt, checkNow };
}
