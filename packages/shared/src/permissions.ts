import { z } from "zod";

/**
 * Catalogue des permissions du logiciel.
 *
 * - Cette liste est la SEULE source de vérité des actions protégées : chaque route API
 *   vérifie l'un de ces codes.
 * - Le Super Admin ne crée pas de permissions : il choisit lesquelles attribuer à chaque rôle.
 * - La gestion des employés et des rôles n'apparaît volontairement PAS ici : elle est réservée
 *   au Super Admin et ne peut jamais être attribuée à un autre rôle (anti-escalade de privilèges).
 * - Renommer ou supprimer un code existant impose une migration des données `role_permissions`.
 */
export const PERMISSIONS = [
  { code: "dashboard.view", module: "Tableau de bord", label: "Voir les statistiques" },

  { code: "shipments.view", module: "Expéditions", label: "Voir la liste et le détail des expéditions" },
  { code: "shipments.create", module: "Expéditions", label: "Créer une expédition et ses colis" },
  { code: "shipments.edit", module: "Expéditions", label: "Modifier une expédition (poids, colis, informations)" },
  {
    code: "shipments.status.update",
    module: "Expéditions",
    label: "Changer le statut d'une expédition (limité aux statuts autorisés du rôle)",
  },
  { code: "shipments.cancel", module: "Expéditions", label: "Annuler une expédition" },

  { code: "finance.view", module: "Prix & paiements", label: "Voir les prix et montants" },
  { code: "finance.edit", module: "Prix & paiements", label: "Modifier le prix final et le statut de paiement" },

  { code: "clients.view", module: "Clients", label: "Consulter les clients" },
  { code: "clients.create", module: "Clients", label: "Créer un client" },
  { code: "clients.edit", module: "Clients", label: "Modifier un client" },

  { code: "quotes.view", module: "Devis", label: "Voir les demandes de devis" },
  { code: "quotes.process", module: "Devis", label: "Traiter les demandes de devis" },

  { code: "config.tariffs", module: "Configuration", label: "Gérer les tarifs" },
  { code: "config.routes", module: "Configuration", label: "Gérer les routes" },
  { code: "config.modes", module: "Configuration", label: "Gérer les modes de transport" },
  { code: "config.statuses", module: "Configuration", label: "Gérer la liste des statuts" },

  { code: "exports.run", module: "Exports", label: "Exporter les données (CSV)" },

  { code: "audit.view", module: "Journal", label: "Consulter le journal des actions" },
] as const;

export type PermissionDefinition = (typeof PERMISSIONS)[number];
export type PermissionCode = PermissionDefinition["code"];

export const PERMISSION_CODES = PERMISSIONS.map((p) => p.code) as [PermissionCode, ...PermissionCode[]];

const PERMISSION_CODE_SET: ReadonlySet<string> = new Set(PERMISSION_CODES);

export function isPermissionCode(value: unknown): value is PermissionCode {
  return typeof value === "string" && PERMISSION_CODE_SET.has(value);
}

/** Valide qu'un code reçu (formulaire, API) fait bien partie du catalogue. */
export const permissionCodeSchema = z.enum(PERMISSION_CODES);
