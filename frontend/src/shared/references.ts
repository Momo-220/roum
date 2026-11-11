/**
 * Références uniques lisibles : numéros de suivi d'expédition et références de devis.
 *
 * Formats :
 *   - Suivi : RM-[AIR|SEA|ROAD]-[AAMM]-[6 caractères]   ex. RM-AIR-2610-K8P9Q2
 *   - Devis : DEV-[AAMM]-[6 caractères]                   ex. DEV-2610-M3X7T1
 *
 * Le suffixe utilise 32 caractères sans ambiguïté visuelle (pas de 0/O ni de 1/I).
 * 256 étant un multiple de 32, `octet & 31` donne une distribution parfaitement uniforme (aucun biais).
 *
 * ⚠️ Collisions : 32^6 ≈ 1,07 milliard de combinaisons par type et par mois. Le risque est très faible
 * mais non nul : l'API DOIT réessayer avec une nouvelle référence si la contrainte UNIQUE échoue.
 *
 * La période AAMM est calculée en UTC pour être identique quel que soit le fuseau du serveur.
 */

export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const REFERENCE_SUFFIX_LENGTH = 6;

export const TRANSPORT_TYPES = ["AIR", "SEA"] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

/** Source d'aléa injectable (pour des tests déterministes). Doit renvoyer `length` octets aléatoires. */
export type RandomBytesSource = (length: number) => Uint8Array;

const cryptoRandomBytes: RandomBytesSource = (length) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const SUFFIX_PATTERN = `[A-Z0-9]{${REFERENCE_SUFFIX_LENGTH}}`;
const PERIOD_PATTERN = "\\d{2}(?:0[1-9]|1[0-2])";

export const TRACKING_NUMBER_REGEX = new RegExp(`^RM-(?:AIR|SEA)-${PERIOD_PATTERN}-${SUFFIX_PATTERN}$`);
export const QUOTE_REFERENCE_REGEX = new RegExp(`^DEV-${PERIOD_PATTERN}-${SUFFIX_PATTERN}$`);

export function generateReferenceSuffix(randomBytes: RandomBytesSource = cryptoRandomBytes): string {
  const bytes = randomBytes(REFERENCE_SUFFIX_LENGTH);
  if (bytes.length !== REFERENCE_SUFFIX_LENGTH) {
    throw new Error(`La source d'aléa doit fournir ${REFERENCE_SUFFIX_LENGTH} octets.`);
  }
  let suffix = "";
  for (const byte of bytes) {
    suffix += REFERENCE_ALPHABET.charAt(byte & 31);
  }
  return suffix;
}

/** Période AAMM en UTC. */
export function formatReferencePeriod(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date invalide pour la génération de référence.");
  }
  const yy = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

export function generateTrackingNumber(
  transportType: TransportType,
  date: Date = new Date(),
  randomBytes: RandomBytesSource = cryptoRandomBytes,
): string {
  if (!TRANSPORT_TYPES.includes(transportType)) {
    throw new Error(`Type de transport inconnu : ${String(transportType)}`);
  }
  return `RM-${transportType}-${formatReferencePeriod(date)}-${generateReferenceSuffix(randomBytes)}`;
}

export function generateQuoteReference(
  date: Date = new Date(),
  randomBytes: RandomBytesSource = cryptoRandomBytes,
): string {
  return `DEV-${formatReferencePeriod(date)}-${generateReferenceSuffix(randomBytes)}`;
}

export function isValidTrackingNumber(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const clean = value.trim().toUpperCase();
  if (TRACKING_NUMBER_REGEX.test(clean)) return true;
  if (/^RT-\d{4,10}$/.test(clean)) return true;
  if (/^RM-[A-Z0-9]{3,12}-[A-Z0-9]{4,12}$/.test(clean)) return true;
  return false;
}

/**
 * Normalise une saisie client (mobile, copier-coller WhatsApp) :
 * minuscules, espaces, tirets manquants ou en trop sont tolérés.
 * Renvoie le numéro au format canonique, ou `null` s'il est invalide.
 *
 *   " rm air 2610 k8p9q2 " -> "RM-AIR-2610-K8P9Q2"
 */
export function normalizeTrackingNumber(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim().toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "");

  // Cas 1 : Format standard RM-AIR / RM-SEA
  const rmMatch = /^RM(AIR|SEA)(\d{4})([A-Z0-9]{6})$/.exec(compact);
  if (rmMatch) {
    const [, type, period, suffix] = rmMatch;
    return `RM-${type}-${period}-${suffix}`;
  }

  // Cas 2 : Format interne RT-XXXXXX
  const rtMatch = /^RT(\d{4,10})$/.exec(compact);
  if (rtMatch) {
    return `RT-${rtMatch[1]}`;
  }

  // Cas 3 : Format avec tirets déjà valide
  if (isValidTrackingNumber(raw)) {
    return raw;
  }

  return null;
}

/** Numéro d'une commande Roum Boutique : RB-AAMM-XXXXXX. */
export const SHOP_REFERENCE_REGEX = /^RB-\d{4}-[A-Z0-9]{6}$/;

export function isShopReference(value: string): boolean {
  return typeof value === "string" && SHOP_REFERENCE_REGEX.test(value.trim().toUpperCase());
}

/** Même tolérance que pour les colis : " rb 2611 k8p9q2 " -> "RB-2611-K8P9Q2". */
export function normalizeShopReference(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const match = /^RB(\d{4})([A-Z0-9]{6})$/.exec(input.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""));
  return match ? `RB-${match[1]}-${match[2]}` : null;
}

/** Ce que la page Suivi accepte : un colis Roum Transit ou une commande Roum Boutique. */
export function normalizeTrackingInput(input: string): string | null {
  return normalizeTrackingNumber(input) ?? normalizeShopReference(input);
}
