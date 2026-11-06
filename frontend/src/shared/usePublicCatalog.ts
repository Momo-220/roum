"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_OFFICIAL_TARIFFS,
  cachePublicCatalog,
  getLiveCompanySettings,
  getLiveTariffs,
  mapApiTariff,
  type OfficialTariff,
} from "./services-data";
import { useLiveSync, type SyncStatus } from "./useLiveSync";

interface PublicCatalog {
  tariffs: OfficialTariff[];
  settings: Record<string, string>;
  syncStatus: SyncStatus;
}

const PublicCatalogContext = createContext<PublicCatalog | null>(null);

/**
 * Tarifs et coordonnées officielles, alignés en continu sur la base de données.
 * Placé dans la mise en page publique : une seule surveillance, partagée par toutes les pages client.
 * La copie du navigateur ne sert qu'à afficher quelque chose le temps de la première réponse du serveur.
 */
export function PublicCatalogProvider({ children }: { children: ReactNode }) {
  const [tariffs, setTariffs] = useState<OfficialTariff[]>(DEFAULT_OFFICIAL_TARIFFS);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_COMPANY_SETTINGS);

  useEffect(() => {
    setTariffs(getLiveTariffs());
    setSettings(getLiveCompanySettings());
  }, []);

  const { status } = useLiveSync({
    endpoint: "/api/v1/public/sync",
    scopes: ["tariffs", "settings"],
    onChange: async (changed) => {
      try {
        if (changed.includes("tariffs")) {
          const data = await apiRequest<{ tariffs: any[] }>("/api/v1/public/tariffs");
          const mapped = (data.tariffs || []).map(mapApiTariff);
          setTariffs(mapped);
          cachePublicCatalog({ tariffs: mapped });
        }
        if (changed.includes("settings")) {
          const data = await apiRequest<{ settings: Record<string, string> }>("/api/v1/public/settings");
          cachePublicCatalog({ settings: data.settings || {} });
          setSettings(getLiveCompanySettings());
        }
        return true;
      } catch {
        return false;
      }
    },
  });

  const value = useMemo(() => ({ tariffs, settings, syncStatus: status }), [tariffs, settings, status]);
  return createElement(PublicCatalogContext.Provider, { value }, children);
}

export function usePublicCatalog(): PublicCatalog {
  const catalog = useContext(PublicCatalogContext);
  if (!catalog) throw new Error("usePublicCatalog doit être utilisé dans PublicCatalogProvider.");
  return catalog;
}
