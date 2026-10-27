import { z } from "zod";

/**
 * Statuts d'expédition.
 *
 * La liste complète des statuts vit en base (`shipment_statuses`) et reste configurable.
 * Seuls deux statuts sont "système" car le code en dépend : ils ne peuvent être ni supprimés,
 * ni désactivés, ni renommés (protégé par triggers SQL).
 */
export const INITIAL_STATUS_CODE = "DRAFT" as const;
export const CANCELLED_STATUS_CODE = "CANCELLED" as const;

export const SYSTEM_STATUS_CODES = [INITIAL_STATUS_CODE, CANCELLED_STATUS_CODE] as const;

/** Code statut : majuscules, chiffres et `_`, commence par une lettre, 2 à 40 caractères. */
export const STATUS_CODE_REGEX = /^[A-Z][A-Z0-9_]{1,39}$/;

export const statusCodeSchema = z
  .string()
  .trim()
  .regex(STATUS_CODE_REGEX, "Code statut invalide (majuscules, chiffres et _ uniquement, 2 à 40 caractères).");
