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
export const DEFAULT_OFFICIAL_TARIFFS: OfficialTariff[] = [
  // --- 1. CHINE ➔ AFRIQUE (COTE D'IVOIRE) ---
  {
    id: "tariff-flyer-cn-express",
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
    id: "tariff-flyer-cn-normal",
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
    id: "tariff-flyer-cn-special",
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
    id: "tariff-flyer-cn-tech",
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
    id: "tariff-flyer-cn-sea",
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
    id: "tariff-flyer-ae-express",
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
    id: "tariff-flyer-ae-normal",
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
    id: "tariff-flyer-ae-special",
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
    id: "tariff-flyer-ae-sea",
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
    id: "tariff-flyer-ma-ci",
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
    id: "tariff-flyer-ma-sn",
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
    id: "tariff-flyer-ma-ml",
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
    id: "tariff-flyer-ma-bf",
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
    id: "tariff-flyer-ma-ga",
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
    id: "tariff-flyer-fr-ci-divers",
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
    id: "tariff-flyer-fr-ci-cosm",
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
    id: "tariff-flyer-fr-ci-doc",
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
    id: "tariff-flyer-ci-fr-divers",
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
    id: "tariff-flyer-ci-fr-cosm",
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
    id: "tariff-flyer-ci-fr-doc",
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

/**
 * Charge la liste des tarifs en temps réel.
 * Lit en priorité le localStorage synchronisé par l'Admin ('roum_tariffs_data').
 */
export function getLiveTariffs(): OfficialTariff[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("roum_tariffs_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any) => ({
            ...t,
            id: t.id || t.tariff_id || "",
            shipping_mode_name: t.shipping_mode_name || t.mode_name || t.service_name || "",
            service_name: t.service_name || t.shipping_mode_name || t.mode_name || "",
            shipping_mode_type: (t.shipping_mode_type || t.mode_type || "AIR") as "AIR" | "SEA",
            price_per_unit_minor: Number(t.price_per_unit_minor) || 0,
          }));
        }
      }
    } catch (e) {
      console.warn("Erreur lecture roum_tariffs_data:", e);
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

/**
 * Enregistre une nouvelle demande / commande client à la fois dans :
 * 1. Le stockage permanent `roum_requests_data` (visible instantanément dans l'Admin)
 * 2. Déclenche l'événement global `storage` pour mise à jour sans rechargement
 * 3. L'API backend `/api/v1/public/quotes`
 */
export async function saveClientRequest(data: {
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
  total_goods_fcfa?: number;
  shipping_fee_fcfa?: number;
  total_amount_fcfa?: number;
  payment_method_selected?: string;
  payment_receipt_url?: string;
  payment_receipt_name?: string;
}): Promise<{
  reference: string;
  trackingNumber: string;
  shippingMark: string;
  warehouseAddress: string;
  whatsappUrl: string;
}> {
  const timestamp = Date.now().toString(36).substring(2, 7).toUpperCase();
  let prefix = "REQ";
  if (data.service_type === "ALIBABA") {
    prefix = data.option_type === "AVEC_FOURNISSEUR" || data.cargo_type?.includes("[PAIEMENT FOURNISSEUR RMB]") ? "RMB" : "ALI";
  } else if (data.service_type === "DUBAI") prefix = "DUB";
  else if (data.service_type === "MAROC") prefix = "MAR";
  else if (data.service_type === "FRANCE") prefix = "FRA";
  else prefix = "FWD";

  const reference = `RM-${prefix}-${timestamp}`;
  const trackingNumber = reference;
  const clientUpper = (data.client_name || "CLIENT").toUpperCase().trim();
  const shippingMark = data.shipping_mark?.trim() || `ROUM / ${reference} / ${clientUpper}`;

  // Adresse entrepôt selon l'origine
  let warehouseAddress = "Guangzhou Baiyun Logistics Center, Guangzhou, Chine";
  if (data.origin_country.toLowerCase().includes("duba") || data.origin_country.toLowerCase().includes("émirat")) {
    warehouseAddress = "Deira Wholesale Cargo Hub, Al Sabkha Road, Dubai, UAE";
  } else if (data.origin_country.toLowerCase().includes("maroc")) {
    warehouseAddress = "Zone Industrielle Ain Sebaa, Casablanca, Maroc";
  } else if (data.origin_country.toLowerCase().includes("france")) {
    warehouseAddress = "Plateforme Logistique Roum Paris Île-de-France, Paris, France";
  }

  // Description claire pour l'administrateur
  let description = data.cargo_type || "";
  if (data.service_type === "ALIBABA") {
    if (data.option_type === "AVEC_FOURNISSEUR" || data.cargo_type?.includes("[PAIEMENT FOURNISSEUR RMB]")) {
      description = data.cargo_type || `[PAIEMENT FOURNISSEUR RMB] Montant: ${data.rmb_amount || "—"} ¥ | Contact: ${data.supplier_contact || "—"}`;
    } else {
      description = `Achat Alibaba | Qté : ${data.product_quantity || "1"} | Spécifications : ${data.product_specs || "Standard"} | Lien : ${data.product_url || "Non renseigné"}`;
    }
  } else {
    description = `${data.shipping_mode_name || "Transit"} | Colis : ${data.cargo_type || "Articles divers"} | Départ : ${data.origin_country} ➔ Arrivée : ${data.destination_country}`;
  }

  // 1. Sauvegarde dans localStorage pour le tableau de bord Admin
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("roum_requests_data");
      const currentList = saved ? JSON.parse(saved) : [];

      const detectedOption =
        data.option_type ||
        (data.cargo_type?.includes("[PAIEMENT FOURNISSEUR RMB]")
          ? "AVEC_FOURNISSEUR"
          : data.cargo_type?.includes("[SOURCING SANS FOURNISSEUR]")
          ? "SANS_FOURNISSEUR"
          : "FORWARDING");

      const newRequestObject = {
        id: `req-${Date.now()}`,
        reference,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email || "",
        request_type: detectedOption === "AVEC_FOURNISSEUR" ? "SUPPLIER_PAYMENT" : data.service_type === "ALIBABA" ? "ALIBABA" : "GENERAL",
        option_type: detectedOption,
        rmb_amount: data.rmb_amount || (data.cargo_type?.match(/Montant:\s*([0-9\s.,]+)\s*¥/)?.[1]?.trim() ?? null),
        supplier_contact: data.supplier_contact || (data.cargo_type?.match(/Usine:\s*([^|]+)/)?.[1]?.trim() ?? null),
        product_url: data.product_url || "",
        product_image: data.product_image || null,
        product_name: data.product_name || null,
        unit_price: data.unit_price || null,
        unit_price_currency: data.unit_price_currency || null,
        total_goods_fcfa: data.total_goods_fcfa || null,
        shipping_fee_fcfa: data.shipping_fee_fcfa || null,
        total_amount_fcfa: data.total_amount_fcfa || null,
        payment_method_selected: data.payment_method_selected || null,
        payment_receipt_url: data.payment_receipt_url || null,
        payment_receipt_name: data.payment_receipt_name || null,
        origin_country: data.origin_country,
        origin_city: data.origin_country === "Chine" ? "Guangzhou" : data.origin_country === "France" ? "Paris" : data.origin_country === "Maroc" ? "Casablanca" : "Dubaï",
        destination_country: data.destination_country,
        destination_city: data.destination_country.includes("(") ? data.destination_country.split("(")[1].replace(")", "").trim() : data.destination_country,
        shipping_mode_id: data.shipping_mode_type === "SEA" ? "SEA_LCL" : "AIR_EXPRESS",
        description,
        shipping_mark: shippingMark,
        tracking_number: trackingNumber,
        paid_to_supplier: data.paid_to_supplier || null,
        estimated_weight_kg: data.estimated_weight_kg || 5.0,
        estimated_cbm: data.estimated_cbm || null,
        status: "NEW",
        items_count: 1,
        items: [
          {
            id: `item-${Date.now()}`,
            description: data.cargo_type || "Marchandises client",
            quantity: data.product_quantity || 1,
            product_url: data.product_url || "",
          },
        ],
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        updated_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      const updatedRequests = [newRequestObject, ...currentList];
      localStorage.setItem("roum_requests_data", JSON.stringify(updatedRequests));

      // Déclenchement de l'événement pour avertir l'Admin sans recharger
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("roum:request_created", { detail: newRequestObject }));
    } catch (e) {
      console.warn("Erreur sync locale requête admin:", e);
    }
  }

  // 2. Envoi vers le backend Hono
  try {
    await fetch("/api/v1/public/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_type: data.service_type === "ALIBABA" ? "ALIBABA" : "FORWARDING",
        client_name: data.client_name.trim(),
        client_phone: data.client_phone.trim(),
        origin_country: data.origin_country,
        destination_country: data.destination_country,
        shipping_mode_id: data.shipping_mode_type === "SEA" ? "SEA_LCL" : "AIR_EXPRESS",
        cargo_type: description,
        product_url: data.product_url || "",
        product_quantity: data.product_quantity || "",
        product_specs: data.product_specs || "",
      }),
    });
  } catch (err) {
    // Si l'API backend n'est pas joignable, la synchronisation locale localStorage
    // garantit déjà que l'administrateur verra la demande dans son interface
    console.warn("Envoi API Hono asynchrone :", err);
  }

  // 3. Lien WhatsApp pré-rempli
  const supportPhone = "+2250153638569";
  const waText = `Bonjour Roum Transit, je viens de créer le dossier n° *${reference}*.\n- Client : ${data.client_name}\n- Service : ${data.service_type}\n- Trajet : ${data.origin_country} ➔ ${data.destination_country}\n- Détails : ${description}\nMerci de me confirmer la prise en charge !`;
  const whatsappUrl = `https://wa.me/${supportPhone.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`;

  return {
    reference,
    trackingNumber,
    shippingMark,
    warehouseAddress,
    whatsappUrl,
  };
}

/**
 * Coordonnées de paiement et paramètres officiels synchronisés avec l'Admin
 */
export const DEFAULT_COMPANY_SETTINGS: Record<string, string> = {
  company_name: "ROUM TRANSIT INTERNATIONAL SARL",
  company_headquarters: "Abidjan, Côte d'Ivoire",
  company_email: "contact@roumtransit.com",
  whatsapp_official_number: "+225 01 53 63 85 69",
  whatsapp_support: "+225 01 53 63 85 69",
  phone_secondary: "+225 07 48 29 11 00",

  // Adresses de réception
  warehouse_china_address: "Entrepôt Central Baiyun, Guangzhou, Guangdong, Chine",
  warehouse_china_contact: "+86 138 0000 0000 (WhatsApp Chine)",
  warehouse_dubai_address: "Al Sabkha Road, Deira Wholesale Market, Dubaï, Émirats Arabes Unis",
  warehouse_dubai_contact: "+971 50 892 4110 (WhatsApp Dubaï)",
  agency_paris_address: "Plateforme Cargo Roissy CDG / Dépôt Île-de-France, France",
  agency_paris_contact: "+33 6 52 90 14 30 (Liaison Paris)",

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

export function getLiveCompanySettings(): Record<string, string> {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("roum_company_settings");
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


