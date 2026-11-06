"use client";

import { usePublicCatalog } from "@/shared/usePublicCatalog";

/** Nom de l'entreprise tel que configuré dans l'administration. */
export function CompanyName() {
  const { settings } = usePublicCatalog();
  return <>{settings.company_name || "ROUM TRANSIT INTERNATIONAL"}</>;
}
