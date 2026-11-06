/**
 * SERVICES & TARIFS OFFICIELS ROUM TRANSIT INTERNATIONAL
 *
 * Source unique de vérité et synchronisation temps réel entre le Dashboard Admin
 * et le Portail Client public.
 *
 * RÈGLE ABSOLUE :
 * - ZÉRO jargon technique incompréhensible pour les clients (aucun acronyme abscons).
 * - Les tarifs et services sont 100% synchronisés : toute modification de prix
 *   dans le tableau de bord Admin est immédiatement reflétée sur le portail client.
 * - Toute commande ou demande créée par un client est instantanément enregistrée
 *   dans la liste des demandes du tableau de bord Admin (section "Commandes & Achats Clients").
 */

import { apiRequest, newUuid } from "./api";

export interface OfficialTariff {
  id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  shipping_mode_name: string;
  shipping_mode_type: "AIR" | "SEA";
  category_tag: string;
  pricing_basis: "PER_KG" | "PER_CBM" | "PER_UNIT";
  currency: string;
  price_per_unit_minor: number; // En centimes (ex: 1200000 = 12 000 FCFA)
  minimum_charge_minor?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  flyer_source?: string;
  secondary_display?: string;
  note: string;
  is_active: number;
  service_name?: string;
}

// 19 Tarifs Officiels extraits directement des flyers réels de ROUM TRANSIT
/** Copie navigateur des données publiques, écrite uniquement à partir des réponses du serveur. */
const TARIFFS_CACHE_KEY = "roum_public_tariffs_cache";
const SETTINGS_CACHE_KEY = "roum_public_settings_cache";

export const DEFAULT_OFFICIAL_TARIFFS: OfficialTariff[] = [
  // --- 1. CHINE ➔ AFRIQUE (COTE D'IVOIRE) ---
  {
    id: "tariff-cn-ci-express",
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Voie Express (4 jours)",
    shipping_mode_type: "AIR",
    category_tag: "Voie Express",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1200000, // 12 000 FCFA / kg
    minimum_charge_minor: 1200000,
    estimated_days_min: 4,
    estimated_days_max: 5,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Livraison ultra-rapide par avion en 4 à 5 jours chrono",
    is_active: 1,
  },
  {
    id: "tariff-cn-ci-normal",
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Voie Normale (2 semaines)",
    shipping_mode_type: "AIR",
    category_tag: "Voie Normale",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1000000, // 10 000 FCFA / kg
    minimum_charge_minor: 1000000,
    estimated_days_min: 12,
    estimated_days_max: 14,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Formule économique pour vêtements, chaussures et articles ordinaires",
    is_active: 1,
  },
  {
    id: "tariff-cn-ci-special",
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Complément alimentaire + Batterie",
    shipping_mode_type: "AIR",
    category_tag: "Batteries & Compléments",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1400000, // 14 000 FCFA / kg
    minimum_charge_minor: 1400000,
    estimated_days_min: 7,
    estimated_days_max: 10,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Produits sensibles avec batteries, crèmes ou compléments",
    is_active: 1,
  },
  {
    id: "tariff-cn-ci-tech",
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Pièce d'ordinateur & High-Tech",
    shipping_mode_type: "AIR",
    category_tag: "High-Tech & PC",
    pricing_basis: "PER_UNIT",
    currency: "FCFA",
    price_per_unit_minor: 5000000, // 50 000 FCFA le carton
    minimum_charge_minor: 5000000,
    estimated_days_min: 4,
    estimated_days_max: 7,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Protection anti-choc renforcée pour écrans, téléphones et ordinateurs",
    is_active: 1,
  },
  {
    id: "tariff-cn-ci-sea",
    origin_country: "Chine",
    origin_city: "Yiwu / Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Par Bateau (Le Mètre Cube - m³)",
    shipping_mode_type: "SEA",
    category_tag: "Conteneur Bateau",
    pricing_basis: "PER_CBM",
    currency: "FCFA",
    price_per_unit_minor: 30000000, // 300 000 FCFA / m³
    minimum_charge_minor: 30000000,
    estimated_days_min: 35,
    estimated_days_max: 45,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Tarif au mètre cube (m³) pour gros cartons et volumes importants",
    is_active: 1,
  },

  // --- 2. DUBAÏ ➔ AFRIQUE (COTE D'IVOIRE) ---
  {
    id: "tariff-ae-ci-express",
    origin_country: "Émirats Arabes Unis",
    origin_city: "Dubaï",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Voie Express Dubaï (4 jours)",
    shipping_mode_type: "AIR",
    category_tag: "Dubaï Express",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1200000, // 12 000 FCFA / kg
    minimum_charge_minor: 1200000,
    estimated_days_min: 4,
    estimated_days_max: 5,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Vol direct depuis Dubaï DXB vers Abidjan en 4 jours",
    is_active: 1,
  },
  {
    id: "tariff-ae-ci-normal",
    origin_country: "Émirats Arabes Unis",
    origin_city: "Dubaï",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Voie Normale Dubaï (2 semaines)",
    shipping_mode_type: "AIR",
    category_tag: "Dubaï Standard",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1000000, // 10 000 FCFA / kg
    minimum_charge_minor: 1000000,
    estimated_days_min: 10,
    estimated_days_max: 14,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Envoi groupé hebdomadaire économique depuis Dubaï",
    is_active: 1,
  },
  {
    id: "tariff-ae-ci-special",
    origin_country: "Émirats Arabes Unis",
    origin_city: "Dubaï",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Marchandises Spéciales Dubaï",
    shipping_mode_type: "AIR",
    category_tag: "Parfums & Cosmétiques",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 1400000, // 14 000 FCFA / kg
    minimum_charge_minor: 1400000,
    estimated_days_min: 7,
    estimated_days_max: 10,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Spécial parfumerie de Deira, cosmétiques et téléphones",
    is_active: 1,
  },
  {
    id: "tariff-ae-ci-sea",
    origin_country: "Émirats Arabes Unis",
    origin_city: "Dubaï (Jebel Ali)",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Par Bateau Dubaï (Le Mètre Cube - m³)",
    shipping_mode_type: "SEA",
    category_tag: "Conteneur Bateau",
    pricing_basis: "PER_CBM",
    currency: "FCFA",
    price_per_unit_minor: 30000000, // 300 000 FCFA / m³
    minimum_charge_minor: 30000000,
    estimated_days_min: 30,
    estimated_days_max: 40,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Expédition maritime sécurisée départ port de Jebel Ali",
    is_active: 1,
  },

  // --- 3. MAROC ➔ AFRIQUE SUBSAHARIENNE (CASABLANCA) ---
  {
    id: "tariff-ma-ci-sub",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Groupage Aérien Casablanca ➔ Abidjan",
    shipping_mode_type: "AIR",
    category_tag: "Maroc 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 650000, // 6 500 FCFA / kg
    minimum_charge_minor: 650000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Vol direct hebdomadaire garanti en 5 jours chrono",
    is_active: 1,
  },
  {
    id: "tariff-ma-sn-sub",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Sénégal",
    destination_city: "Dakar",
    shipping_mode_name: "Groupage Aérien Casablanca ➔ Dakar",
    shipping_mode_type: "AIR",
    category_tag: "Maroc 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 700000, // 7 000 FCFA / kg
    minimum_charge_minor: 700000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Vol direct vers Dakar en 5 jours",
    is_active: 1,
  },
  {
    id: "tariff-ma-ml-sub",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Mali",
    destination_city: "Bamako",
    shipping_mode_name: "Groupage Aérien Casablanca ➔ Bamako",
    shipping_mode_type: "AIR",
    category_tag: "Maroc 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 700000, // 7 000 FCFA / kg
    minimum_charge_minor: 700000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Vol direct vers Bamako en 5 jours",
    is_active: 1,
  },
  {
    id: "tariff-ma-bf-sub",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Burkina Faso",
    destination_city: "Ouagadougou",
    shipping_mode_name: "Groupage Aérien Casablanca ➔ Ouaga",
    shipping_mode_type: "AIR",
    category_tag: "Maroc 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 750000, // 7 500 FCFA / kg
    minimum_charge_minor: 750000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Vol direct vers Ouagadougou en 5 jours",
    is_active: 1,
  },
  {
    id: "tariff-ma-ga-sub",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Gabon",
    destination_city: "Libreville",
    shipping_mode_name: "Groupage Aérien Casablanca ➔ Libreville",
    shipping_mode_type: "AIR",
    category_tag: "Maroc 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 750000, // 7 500 FCFA / kg
    minimum_charge_minor: 750000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Vol direct vers Libreville en 5 jours",
    is_active: 1,
  },

  // --- 4. FRANCE ↔ CÔTE D'IVOIRE (PARIS ↔ ABIDJAN LIAISON ALLER-RETOUR) ---
  {
    id: "tariff-fr-ci-divers",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Colis Divers & Vêtements (Paris ➔ Abidjan)",
    shipping_mode_type: "AIR",
    category_tag: "Paris ➔ Abidjan (Divers)",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 850000, // 8 500 FCFA / kg (12 €)
    minimum_charge_minor: 850000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "8 500 F / 12 € le kg",
    note: "Colis personnels, vêtements, sacs et marchandises générales",
    is_active: 1,
  },
  {
    id: "tariff-fr-ci-cosmetic",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Cosmétiques, Beurres & Liquides (Paris ➔ Abidjan)",
    shipping_mode_type: "AIR",
    category_tag: "Cosmétiques & Liquides",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 900000, // 9 000 FCFA / kg (14 €)
    minimum_charge_minor: 900000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "9 000 F / 14 € le kg",
    note: "Emballage et sécurisation étanche garantis pour produits de beauté",
    is_active: 1,
  },
  {
    id: "tariff-fr-ci-doc",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Document Administratif & Pli Urgent",
    shipping_mode_type: "AIR",
    category_tag: "Pli Administratif",
    pricing_basis: "PER_UNIT",
    currency: "FCFA",
    price_per_unit_minor: 1300000, // 13 000 FCFA (20 €)
    minimum_charge_minor: 1300000,
    estimated_days_min: 2,
    estimated_days_max: 3,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "13 000 F / 20 € le pli",
    note: "Pli confidentiel scellé avec remise en main propre sécurisée",
    is_active: 1,
  },
  {
    id: "tariff-ci-fr-divers",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Colis Divers & Vêtements (Abidjan ➔ Paris)",
    shipping_mode_type: "AIR",
    category_tag: "Abidjan ➔ Paris (Divers)",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 850000, // 8 500 FCFA / kg (12 €)
    minimum_charge_minor: 850000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "8 500 F / 12 € le kg",
    note: "Expédition directe vers toute la France",
    is_active: 1,
  },
  {
    id: "tariff-ci-fr-cosmetic",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Cosmétiques & Produits Africains (Abidjan ➔ Paris)",
    shipping_mode_type: "AIR",
    category_tag: "Cosmétiques & Liquides",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 900000, // 9 000 FCFA / kg (14 €)
    minimum_charge_minor: 900000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "9 000 F / 14 € le kg",
    note: "Beurres de karité, huiles naturelles et cosmétiques vers l'Europe",
    is_active: 1,
  },
  {
    id: "tariff-ci-fr-doc",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Document Administratif (Abidjan ➔ Paris)",
    shipping_mode_type: "AIR",
    category_tag: "Pli Administratif",
    pricing_basis: "PER_UNIT",
    currency: "FCFA",
    price_per_unit_minor: 1300000, // 13 000 FCFA (20 €)
    minimum_charge_minor: 1300000,
    estimated_days_min: 2,
    estimated_days_max: 3,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "13 000 F / 20 € le pli",
    note: "Envoi rapide de papiers et diplômes vers la France",
    is_active: 1,
  },
];

/** Convertit une ligne de l'API vers le format des pages client. */
export function mapApiTariff(t: any): OfficialTariff {
  const modeType = (t.mode_type || t.shipping_mode_type || "AIR") as "AIR" | "SEA";
  return {
    id: t.tariff_id || t.id,
    origin_country: t.origin_country || "",
    origin_city: t.origin_city || "",
    destination_country: t.destination_country || "",
    destination_city: t.destination_city || "",
    shipping_mode_name: t.mode_name || t.shipping_mode_name || t.service_name || "",
    service_name: t.service_name || t.mode_name || t.shipping_mode_name || "",
    shipping_mode_type: modeType,
    category_tag: t.category_tag || "",
    pricing_basis: t.pricing_basis || (modeType === "SEA" ? "PER_CBM" : "PER_KG"),
    currency: t.currency || "FCFA",
    price_per_unit_minor: Number(t.price_per_unit_minor) || 0,
    minimum_charge_minor: t.minimum_charge_minor !== undefined ? Number(t.minimum_charge_minor) : undefined,
    estimated_days_min: Number(t.estimated_days_min) || 3,
    estimated_days_max: Number(t.estimated_days_max) || 7,
    flyer_source: t.flyer_source || "",
    secondary_display: t.secondary_display || "",
    note: t.note || "",
    is_active: t.is_active !== undefined ? Number(t.is_active) : 1,
  } as OfficialTariff;
}

export function cachePublicCatalog(data: { tariffs?: OfficialTariff[]; settings?: Record<string, string> }): void {
  if (typeof window === "undefined") return;
  try {
    if (data.tariffs) localStorage.setItem(TARIFFS_CACHE_KEY, JSON.stringify(data.tariffs));
    if (data.settings) localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data.settings));
  } catch {
    // Le cache n'est qu'un confort d'affichage : son échec n'a aucune conséquence.
  }
}

/** Dernière grille reçue du serveur, ou la grille officielle tant que rien n'a été reçu. */
export function getLiveTariffs(): OfficialTariff[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(TARIFFS_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Cache illisible : on retombe sur la grille officielle.
    }
  }
  return DEFAULT_OFFICIAL_TARIFFS;
}

/**
 * Trouve un tarif dynamique par identifiant ou mot-clé de recherche.
 */
export function findTariff(
  tariffs: OfficialTariff[],
  originKeyword: string,
  modeOrNameKeyword: string
): OfficialTariff | undefined {
  const oKey = originKeyword.toLowerCase();
  const mKey = modeOrNameKeyword.toLowerCase();

  return tariffs.find((t) => {
    const origMatch = (t.origin_country || "").toLowerCase().includes(oKey) ||
      (t.origin_city || "").toLowerCase().includes(oKey);
    const nameMatch = (t.shipping_mode_name || "").toLowerCase().includes(mKey) ||
      (t.service_name || "").toLowerCase().includes(mKey) ||
      (t.category_tag || "").toLowerCase().includes(mKey) ||
      (t.id || "").toLowerCase().includes(mKey);

    return origMatch && nameMatch;
  });
}

/**
 * Retourne la liste unique des pays de destination configurés côté Admin.
 * Se base exclusivement sur les tarifs officiels enregistrés dans le système.
 */
export function getAdminDestinations(tariffs: OfficialTariff[], originFilter?: string): string[] {
  const destSet = new Set<string>();
  const origKey = originFilter ? originFilter.toLowerCase().trim() : "";

  tariffs.forEach((t) => {
    if (!t.destination_country || !t.destination_country.trim()) return;
    if (origKey) {
      const tOrig = (t.origin_country || "").toLowerCase();
      const match =
        (origKey.includes("chine") && tOrig.includes("chine")) ||
        (origKey.includes("duba") && (tOrig.includes("duba") || tOrig.includes("mirat"))) ||
        (origKey.includes("maroc") && tOrig.includes("maroc")) ||
        (origKey.includes("france") && tOrig.includes("france")) ||
        tOrig.includes(origKey) ||
        origKey.includes(tOrig);
      if (!match) return;
    }
    destSet.add(t.destination_country.trim());
  });

  const list = Array.from(destSet);
  if (list.length > 0) return list;

  // Fallback si aucun tarif n'est encore chargé
  return ["Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso"];
}

/**
 * Retourne la liste détaillée des destinations (pays + ville) configurées côté Admin.
 */
export function getAdminDestinationsDetailed(
  tariffs: OfficialTariff[],
  originFilter?: string
): { country: string; city?: string; label: string }[] {
  const map = new Map<string, { country: string; city?: string; label: string }>();
  const origKey = originFilter ? originFilter.toLowerCase().trim() : "";

  tariffs.forEach((t) => {
    if (!t.destination_country || !t.destination_country.trim()) return;
    if (origKey) {
      const tOrig = (t.origin_country || "").toLowerCase();
      const match =
        (origKey.includes("chine") && tOrig.includes("chine")) ||
        (origKey.includes("duba") && (tOrig.includes("duba") || tOrig.includes("mirat"))) ||
        (origKey.includes("maroc") && tOrig.includes("maroc")) ||
        (origKey.includes("france") && tOrig.includes("france")) ||
        tOrig.includes(origKey) ||
        origKey.includes(tOrig);
      if (!match) return;
    }
    const country = t.destination_country.trim();
    const city = t.destination_city?.trim();
    const label = city ? `${country} — ${city}` : country;
    if (!map.has(label)) {
      map.set(label, { country, city, label });
    }
  });

  const list = Array.from(map.values());
  if (list.length > 0) return list;

  return [
    { country: "Côte d'Ivoire", city: "Abidjan", label: "Côte d'Ivoire — Abidjan" },
    { country: "Sénégal", city: "Dakar", label: "Sénégal — Dakar" },
    { country: "Mali", city: "Bamako", label: "Mali — Bamako" },
    { country: "Burkina Faso", city: "Ouagadougou", label: "Burkina Faso — Ouagadougou" },
  ];
}

/**
 * Formate un prix en FCFA ou devise avec arrondi propre.
 */
export function formatTariffPrice(minorOrNum: number, currency: string = "FCFA"): string {
  // Si le nombre est supérieur à 100 000, c'est très probablement en centimes (minor units)
  const val = minorOrNum > 100000 ? minorOrNum / 100 : minorOrNum;
  if (currency === "FCFA" || currency === "XOF" || currency === "XAF" || currency === "F") {
    return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
  }
  if (currency === "EUR") {
    return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
  }
  return `${val.toLocaleString("fr-FR")} ${currency}`;
}

export function decodeHtmlEntitiesText(text?: string | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&agrave;/gi, "à")
    .replace(/&acirc;/gi, "â")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&ucirc;/gi, "û")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&icirc;/gi, "î")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });
}

/**
 * Enregistre une commande dans la base. Le serveur attribue la référence et la clé d'accès.
 *
 * La promesse n'aboutit que si la commande est réellement enregistrée. En cas d'échec, elle lève une
 * `ApiError` : l'écran doit alors le dire et garder le formulaire. Réutiliser le même `idempotencyKey`
 * pour un nouvel essai garantit qu'une commande ne sera jamais créée deux fois.
 */
export async function saveClientRequest(
  data: {
    service_type: "ALIBABA" | "FORWARDING" | "MAROC" | "FRANCE" | "DUBAI" | "GENERAL";
    client_name: string;
    client_phone: string;
    client_email?: string;
    origin_country: string;
    destination_country: string;
    shipping_mode_name?: string;
    shipping_mode_type?: "AIR" | "SEA";
    estimated_weight_kg?: number;
    estimated_cbm?: number;
    product_url?: string;
    product_quantity?: string;
    product_specs?: string;
    cargo_type?: string;
    option_type?: "SANS_FOURNISSEUR" | "AVEC_FOURNISSEUR" | "FORWARDING";
    rmb_amount?: string;
    supplier_contact?: string;
    product_image?: string;
    product_name?: string;
    shipping_mark?: string;
    paid_to_supplier?: string;
    unit_price?: number;
    unit_price_currency?: string;
  },
  idempotencyKey: string = newUuid(),
): Promise<{ reference: string; accessKey: string; trackingNumber: string; shippingMark: string }> {
  const modeName = (data.shipping_mode_name || "").toLowerCase();
  const shippingModeId =
    data.shipping_mode_type === "SEA"
      ? "SEA_LCL"
      : modeName.includes("express")
        ? "AIR_EXPRESS"
        : modeName.includes("spécial") || modeName.includes("batterie")
          ? "AIR_SPECIAL"
          : "AIR_STANDARD";

  const cleanProductName = decodeHtmlEntitiesText(data.product_name || "Article commandé");

  const description =
    data.service_type === "ALIBABA"
      ? data.option_type === "AVEC_FOURNISSEUR"
        ? data.cargo_type || `[PAIEMENT FOURNISSEUR RMB] Montant: ${data.rmb_amount || "—"} ¥ | Contact: ${data.supplier_contact || "—"}`
        : `Achat Alibaba | Qté souhaitée : ${data.product_quantity || "1"} pcs | ${data.product_specs || "Estimation du prix & du poids par ROUM TRANSIT"}`
      : `${data.shipping_mode_name || "Transit"} | Colis : ${data.cargo_type || "Articles divers"} | Départ : ${data.origin_country} ➔ Arrivée : ${data.destination_country}`;

  const response = await apiRequest<{ quote_reference: string; access_key: string; shipping_mark: string }>(
    "/api/v1/public/quotes",
    {
      method: "POST",
      // Rejouable sans risque grâce à la clé d'idempotence.
      retries: 3,
      body: {
        idempotency_key: idempotencyKey,
        service_type: data.service_type,
        client_name: data.client_name.trim(),
        client_phone: data.client_phone.trim(),
        client_email: data.client_email || undefined,
        origin_country: data.origin_country,
        destination_country: data.destination_country,
        shipping_mode_id: shippingModeId,
        estimated_weight_kg: data.estimated_weight_kg,
        estimated_cbm: data.estimated_cbm,
        cargo_type: description.substring(0, 2000),
        product_url: data.product_url || "",
        product_quantity: data.product_quantity || "1",
        product_specs: data.product_specs || "",
        supplier_info: data.supplier_contact || "",
        shipping_mark: data.shipping_mark?.trim() || undefined,
        metadata: {
          option_type: data.option_type || "FORWARDING",
          product_name: cleanProductName,
          product_image: data.product_image,
          shipping_mode_name: data.shipping_mode_name,
          shipping_mode_type: data.shipping_mode_type || "AIR",
          supplier_contact: data.supplier_contact,
          paid_to_supplier: data.paid_to_supplier,
          rmb_amount: data.rmb_amount,
          unit_price: data.unit_price,
          unit_price_currency: data.unit_price_currency,
        },
      },
    },
  );

  return {
    reference: response.quote_reference,
    accessKey: response.access_key,
    // Le numéro de suivi officiel n'est attribué qu'après confirmation de l'encaissement par l'admin.
    trackingNumber: "",
    shippingMark: response.shipping_mark,
  };
}

/** Lit un dossier client. Sans clé d'accès valide, le serveur refuse. */
export async function fetchClientDossier(reference: string, accessKey: string): Promise<any> {
  const data = await apiRequest<{ request: any }>(
    `/api/v1/public/requests/${encodeURIComponent(reference.trim())}?key=${encodeURIComponent(accessKey)}`,
  );
  return data.request;
}

/**
 * ÉTAPE 2 BIS : envoie la preuve de paiement. Ne réussit que si le fichier complet est enregistré.
 * Le `proofId` rend l'envoi rejouable : un nouvel essai ne crée pas de seconde preuve.
 */
export async function submitClientPaymentProof(
  reference: string,
  proof: { proofId: string; accessKey: string; paymentMethod: string; fileName: string; dataUrl: string },
): Promise<any> {
  const data = await apiRequest<{ request: any }>(
    `/api/v1/public/requests/${encodeURIComponent(reference.trim())}/payment-proof`,
    {
      method: "POST",
      retries: 3,
      timeoutMs: 120000,
      body: {
        proof_id: proof.proofId,
        access_key: proof.accessKey,
        payment_method: proof.paymentMethod,
        file_name: proof.fileName,
        data_url: proof.dataUrl,
      },
    },
  );
  return data.request;
}

/**
 * Coordonnées de paiement et paramètres officiels synchronisés avec l'Admin
 */
export const DEFAULT_COMPANY_SETTINGS: Record<string, string> = {
  exchange_rate_rmb: "88",
  exchange_rate_usd: "610",
  exchange_rate_eur: "656",
  company_name: "ROUM TRANSIT INTERNATIONAL SARL",
  company_headquarters: "Abidjan, Côte d'Ivoire",
  company_email: "contact@roumtransit.com",
  whatsapp_official_number: "+225 01 53 63 85 69",
  whatsapp_support: "+225 01 53 63 85 69",
  phone_secondary: "+225 07 48 29 11 00",

  // Adresses de réception
  warehouse_china_address: "Entrepôt Central Baiyun, Guangzhou, Guangdong, Chine",
  warehouse_china_contact: "+86 138 0000 0000 (WhatsApp Chine)",
  warehouse_china_shipping_mark: "ROUM TRANSIT / [Votre Nom]",
  warehouse_dubai_address: "Al Sabkha Road, Deira Wholesale Market, Dubaï, Émirats Arabes Unis",
  warehouse_dubai_contact: "+971 50 892 4110 (WhatsApp Dubaï)",
  agency_paris_address: "Plateforme Cargo Roissy CDG / Dépôt Île-de-France, France",
  agency_paris_contact: "+33 6 52 90 14 30 (Liaison Paris)",
  hub_casablanca_address: "Zone Industrielle Ain Sebaa, Casablanca, Maroc",

  // Moyens de paiement & Comptes officiels configurés par l'administration (Wave, Orange Money, Maroc UNIQUEMENT)
  payment_wave_ci: "+225 01 53 63 85 69",
  payment_wave_name: "ROUM TRANSIT SARL",
  payment_wave_merchant: "wave.me/roumtransit",
  payment_orange_money_ci: "#144*389278# / +225 07 48 29 11 00",
  payment_orange_name: "ROUM TRANSIT INTERNATIONAL",
  payment_morocco_bank: "CIH Bank / Attijariwafa Bank Casablanca",
  payment_morocco_holder: "ROUM TRANSIT MAROC",
  payment_morocco_rib: "230 780 0001234567890123 45",
  payment_morocco_whatsapp: "Casablanca Maarif · WhatsApp : +212 6 00 00 00 00",
  payment_cash_desks: "Guichets Espèces : Agence Abidjan & Magasin Guangzhou",
  payment_receipt_terms: "Tout règlement donne lieu à un reçu officiel numéroté pour retrait de vos colis.",
};

/** Coordonnées officielles : dernière réponse du serveur, sinon valeurs par défaut. */
export function getLiveCompanySettings(): Record<string, string> {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          // Filtrage strict : uniquement Wave, Orange Money et Maroc
          const {
            payment_mtn_momo_ci: _m,
            payment_mtn_name: _mn,
            payment_moov_money: _mo,
            payment_bank_name: _bn,
            payment_bank_account_holder: _bh,
            payment_bank_rib: _br,
            payment_bank_swift: _bs,
            ...allowed
          } = parsed;
          return { ...DEFAULT_COMPANY_SETTINGS, ...allowed };
        }
      }
    } catch {}
  }
  return DEFAULT_COMPANY_SETTINGS;
}

/** Numéro WhatsApp de l'agence tel que configuré dans l'administration, en chiffres. */
export function getSupportPhoneDigits(settings: Record<string, string>): string {
  return (settings.whatsapp_official_number || settings.whatsapp_support || "").replace(/\D/g, "") || "2250153638569";
}

export interface ExchangeRates {
  rmb: number;
  usd: number;
  eur: number;
}

/** Taux en FCFA réglés dans l'administration. Une valeur illisible retombe sur le taux par défaut. */
export function getExchangeRates(settings: Record<string, string>): ExchangeRates {
  const read = (key: "exchange_rate_rmb" | "exchange_rate_usd" | "exchange_rate_eur") => {
    const value = Number(settings[key]);
    return Number.isFinite(value) && value > 0 ? value : Number(DEFAULT_COMPANY_SETTINGS[key]);
  };
  return { rmb: read("exchange_rate_rmb"), usd: read("exchange_rate_usd"), eur: read("exchange_rate_eur") };
}

/** Convertit un prix fournisseur en FCFA. Sans devise connue, il s'agit de dollars (Alibaba.com). */
export function convertToFcfa(amount: number, currency: string | undefined, rates: ExchangeRates): number {
  const value = Number(amount) || 0;
  const code = (currency || "USD").toUpperCase();
  if (code === "RMB" || code === "CNY" || code === "¥") return Math.round(value * rates.rmb);
  if (code === "EUR" || code === "€") return Math.round(value * rates.eur);
  if (code === "FCFA" || code === "XOF" || code === "XAF") return Math.round(value);
  return Math.round(value * rates.usd);
}

/** Entrepôts ajoutés depuis l'administration. */
export function getCustomHubs(settings: Record<string, string>): any[] {
  try {
    const hubs = JSON.parse(settings.custom_hubs_json || "[]");
    return Array.isArray(hubs) ? hubs : [];
  } catch {
    return [];
  }
}

/** Prix « à partir de » et délais calculés depuis la vraie grille, jamais écrits à la main. */
export function getStartingOffers(tariffs: OfficialTariff[]) {
  const usable = tariffs.filter(
    (t) => (t.currency === "FCFA" || t.currency === "XOF") && t.price_per_unit_minor > 0 && t.is_active !== 0
  );
  const cheapest = (list: OfficialTariff[]) =>
    list.reduce<OfficialTariff | undefined>(
      (best, t) => (!best || t.price_per_unit_minor < best.price_per_unit_minor ? t : best),
      undefined
    );
  const describe = (t?: OfficialTariff) =>
    t
      ? {
          price: Math.round(t.price_per_unit_minor / 100).toLocaleString("fr-FR"),
          delay: `${t.estimated_days_min} à ${t.estimated_days_max}`,
        }
      : null;

  const name = (t: OfficialTariff) => `${t.service_name || ""} ${t.shipping_mode_name || ""}`.toLowerCase();
  const perKg = usable.filter((t) => t.shipping_mode_type === "AIR" && t.pricing_basis === "PER_KG");

  return {
    sea: describe(cheapest(usable.filter((t) => t.shipping_mode_type === "SEA" && t.pricing_basis === "PER_CBM"))),
    air: describe(cheapest(perKg)),
    france: describe(cheapest(perKg.filter((t) => (t.origin_country || "").toLowerCase().includes("france")))),
    express: describe(cheapest(perKg.filter((t) => name(t).includes("express")))),
    normal: describe(cheapest(perKg.filter((t) => /normal|standard/.test(name(t))))),
  };
}
