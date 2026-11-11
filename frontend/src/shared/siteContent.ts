/**
 * Textes et images du site que la direction modifie depuis l'admin (onglet Contenu du site).
 *
 * Chaque texte garde sa version d'origine : un champ vidé, ou remis à l'origine, la retrouve.
 * Les valeurs vivent dans les paramètres (`site_<clé>`) et arrivent sur chaque page client
 * par la synchronisation des paramètres. Une image remplacée porte sa version (`site_image_<clé>`).
 */

export interface SiteTextField {
  key: string;
  label: string;
  fallback: string;
  /** Plusieurs lignes : une puce ou une étiquette par ligne. */
  list?: boolean;
  long?: boolean;
}

export interface SiteSection {
  id: string;
  title: string;
  hint?: string;
  fields: SiteTextField[];
}

export interface SiteImageField {
  key: string;
  label: string;
  fallback: string;
}

const card = (prefix: string, name: string, fields: Array<[string, string, string, Partial<SiteTextField>?]>) =>
  fields.map(([suffix, label, fallback, extra]) => ({
    key: `${prefix}_${suffix}`,
    label: `${name} · ${label}`,
    fallback,
    ...extra,
  }));

export const SITE_SECTIONS: SiteSection[] = [
  {
    id: "vitrine",
    title: "Page d'accueil Roum (Transit et Boutique)",
    hint: "La première page du site : le visiteur choisit Roum Transit ou Roum Boutique.",
    fields: [
      { key: "vitrine_kicker", label: "Petit titre", fallback: "BIENVENUE CHEZ ROUM" },
      { key: "vitrine_title", label: "Titre", fallback: "Expédier ou acheter ?" },
      {
        key: "vitrine_text",
        label: "Introduction",
        fallback: "Faites venir vos marchandises avec Roum Transit, ou achetez chaussures, sacs et vêtements chez Roum Boutique.",
        long: true,
      },
      {
        key: "vitrine_transit_text",
        label: "Carte Transit · texte",
        fallback: "Achats en Chine, fret aérien et maritime, livraison jusqu'à destination.",
        long: true,
      },
      { key: "vitrine_transit_cta", label: "Carte Transit · bouton", fallback: "Entrer chez Roum Transit" },
      {
        key: "vitrine_boutique_text",
        label: "Carte Boutique · texte",
        fallback: "Chaussures, sacs et vêtements. Paiement Wave ou Orange Money, livraison suivie.",
        long: true,
      },
      { key: "vitrine_boutique_cta", label: "Carte Boutique · bouton", fallback: "Voir la boutique" },
      { key: "vitrine_tracking", label: "Suivi · phrase", fallback: "Déjà client ? Suivez votre colis ou votre commande." },
    ],
  },
  {
    id: "home",
    title: "Accueil",
    fields: [
      { key: "home_title_1", label: "Grand titre · ligne 1", fallback: "Transport maritime & aérien" },
      { key: "home_title_2", label: "Grand titre · ligne 2", fallback: "direct vers l'Afrique." },
      { key: "home_search_placeholder", label: "Champ de suivi · texte d'aide", fallback: "Votre numéro de suivi" },
      { key: "home_services_kicker", label: "Services · petit titre", fallback: "01 / NOS VOIES DE TRANSPORT OFFICIELLES" },
      {
        key: "home_services_title",
        label: "Services · titre",
        fallback: "Choisissez votre mode d'acheminement direct vers l'Afrique.",
      },
      {
        key: "home_services_text",
        label: "Services · phrase",
        fallback: "Touchez un service pour dérouler ses détails, délais et garanties.",
      },
    ],
  },
  {
    id: "home_cards",
    title: "Accueil · cartes des services",
    hint: "Les prix et délais des cartes Maritime et Aérienne suivent automatiquement la grille tarifaire.",
    fields: [
      ...card("home_card_achats", "Achat", [
        ["badge", "étiquette", "ALIBABA, 1688 & TAOBAO"],
        ["title", "titre", "Centrale d'Achat"],
        ["subtitle", "sous-titre", "Paiement en Yuans (RMB) par Mobile Money"],
        [
          "description",
          "description",
          "Commandez sur Alibaba et 1688 en réglant en FCFA par Mobile Money. Nous payons votre usine en Yuans sous 24h avec contrôle colis inclus.",
          { long: true },
        ],
        ["option_1_tag", "option 1", "Option 1 · Sans fournisseur"],
        ["option_1_text", "option 1 · détail", "Sourcing produit & négociation directe en usine."],
        ["option_2_tag", "option 2", "Option 2 · Avec fournisseur"],
        ["option_2_text", "option 2 · détail", "Règlement de votre proforma en Yuans sous 24h."],
        [
          "features",
          "points forts",
          [
            "Paiement direct (Wave, Orange Money, Compte Maroc)",
            "Zéro carte bancaire internationale requise",
            "Photos, pesée et contrôle des cartons à Guangzhou",
            "Dédouanement complet inclus jusqu'à destination",
          ].join("\n"),
          { list: true },
        ],
        ["cta", "bouton", "Accéder à la Centrale d'Achat"],
      ]),
      ...card("home_card_maritime", "Maritime", [
        ["title", "titre", "Voie Maritime"],
        ["subtitle", "sous-titre", "Groupage CBM & Conteneurs FCL"],
        [
          "description",
          "description",
          "Acheminement maritime économique au m³ depuis la Chine. Dédouanement 100% compris jusqu'à destination finale.",
          { long: true },
        ],
        [
          "features",
          "points forts",
          [
            "Groupage au m³ sans minimum lourd",
            "Dédouanement & taxes portuaires inclus",
            "Départs réguliers chaque semaine",
            "Scellés de sécurité & suivi en temps réel",
          ].join("\n"),
          { list: true },
        ],
        ["cta", "bouton", "Voir les tarifs maritimes"],
      ]),
      ...card("home_card_aerien", "Aérien", [
        ["title", "titre", "Voie Aérienne"],
        ["subtitle", "sous-titre", "Chine, Dubaï, France & Maroc direct"],
        [
          "description",
          "description",
          "Vols hebdomadaires pour colis urgents, téléphones et électronique. Pesée, photos et dédouanement complet inclus au kilo.",
          { long: true },
        ],
        [
          "features",
          "points forts",
          [
            "Vols réguliers Chine, Dubaï, France & Maroc",
            "Formule Express (4 à 5 j) ou Normale (10 à 12 j)",
            "Dédouanement intégral compris au kilo",
            "Photos et pesée dès réception",
          ].join("\n"),
          { list: true },
        ],
        ["cta", "bouton", "Voir les tarifs aériens"],
      ]),
    ],
  },
  {
    id: "services",
    title: "Page Services",
    hint: "Les prix affichés sur les cartes suivent automatiquement la grille tarifaire.",
    fields: [
      { key: "services_kicker", label: "Petit titre", fallback: "01 / CATALOGUE LOGISTIQUE OFFICIEL" },
      { key: "services_title", label: "Titre", fallback: "Nos Voies & Services d'Acheminement." },
      {
        key: "services_text",
        label: "Introduction",
        fallback:
          "Règlement de vos usines chinoises en Yuans, fret maritime et fret aérien direct. Dédouanement 100% inclus jusqu'à votre destination finale.",
        long: true,
      },
      ...card("services_achat", "Achat", [
        ["tag", "étiquette", "Achats en Chine"],
        ["title", "titre", "Centrale d'Achat"],
        [
          "text",
          "phrase",
          "Payez en FCFA par Wave ou Orange Money, sans carte internationale. Nous réglons votre usine.",
          { long: true },
        ],
        ["chips", "pastilles", "Sans fournisseur : on trouve l'usine\nAvec fournisseur : on paie votre proforma", { list: true }],
        ["cta", "bouton", "Lancer une commande"],
      ]),
      ...card("services_aerien", "Aérien", [
        ["tag", "étiquette", "Par les airs"],
        ["title", "titre", "Voie Aérienne"],
        ["text", "phrase", "Plis urgents, téléphones et colis réguliers, au départ de quatre pays.", { long: true }],
        ["chips", "pastilles", "Douane incluse\nPhotos et pesée", { list: true }],
        ["cta", "bouton", "Voir les tarifs"],
      ]),
      ...card("services_maritime", "Maritime", [
        ["tag", "étiquette", "Par la mer"],
        ["title", "titre", "Voie Maritime"],
        ["text", "phrase", "Groupage au m³ ou conteneur complet, depuis Guangzhou, Ningbo et Yiwu.", { long: true }],
        ["chips", "pastilles", "Douane incluse\nScellés et suivi", { list: true }],
        ["cta", "bouton", "Voir les tarifs"],
      ]),
      ...card("services_comptoirs", "Comptoirs", [
        ["tag", "étiquette", "Nos comptoirs"],
        ["title", "titre", "Comptoirs Internationaux"],
        ["text", "phrase", "Déposez votre colis près de chez vous : il part directement vers l'Afrique.", { long: true }],
        ["chips", "pastilles", "Dubaï : high-tech\nParis et Île-de-France\nCasablanca : 5 capitales", { list: true }],
        ["cta", "bouton", "Voir les tarifs"],
      ]),
      { key: "services_depots_label", label: "Dépôts · petit titre", fallback: "Vos adresses de réception" },
      { key: "services_depots_title", label: "Dépôts · titre", fallback: "Nos dépôts & le marquage des cartons" },
    ],
  },
  {
    id: "tariffs",
    title: "Page Tarifs",
    fields: [
      { key: "tariffs_kicker", label: "Petit titre", fallback: "Tarifs" },
      { key: "tariffs_title", label: "Titre", fallback: "Combien coûte votre envoi ?" },
      {
        key: "tariffs_text",
        label: "Introduction",
        fallback: "Choisissez votre trajet, réglez le poids, et le prix s'affiche. Douane comprise.",
        long: true,
      },
    ],
  },
  {
    id: "warehouses",
    title: "Page Dépôts",
    hint: "Les adresses et contacts des dépôts se changent dans Paramètres.",
    fields: [
      { key: "warehouses_title", label: "Titre", fallback: "Nos dépôts" },
      {
        key: "warehouses_text",
        label: "Introduction",
        fallback:
          "Copiez l'adresse du pays où vous achetez et donnez-la à votre fournisseur, avec le marquage à inscrire sur le carton.",
        long: true,
      },
      { key: "warehouses_cn_text", label: "Chine · phrase", fallback: "Pour vos commandes sur 1688, Taobao ou auprès d'usines en Chine." },
      {
        key: "warehouses_ae_text",
        label: "Dubaï · phrase",
        fallback: "Pour vos achats de parfumerie, cosmétiques, téléphones et électronique à Deira.",
      },
      { key: "warehouses_ae_mark", label: "Dubaï · marquage", fallback: "ROUM TRANSIT DUBAI / [Votre Nom]" },
      { key: "warehouses_ma_text", label: "Casablanca · phrase", fallback: "Pour vos marchandises au Maroc, avec un départ express." },
      { key: "warehouses_ma_mark", label: "Casablanca · marquage", fallback: "ROUM TRANSIT MAROC / [Votre Nom]" },
      { key: "warehouses_fr_text", label: "Paris · phrase", fallback: "Pour vos colis personnels, produits de beauté et plis administratifs." },
      { key: "warehouses_fr_mark", label: "Paris · marquage", fallback: "ROUM TRANSIT PARIS / [Votre Nom]" },
      {
        key: "warehouses_empty",
        label: "Sans adresse saisie · phrase",
        fallback: "Écrivez-nous sur WhatsApp : nous vous donnons l'adresse du dépôt qui correspond à votre achat.",
        long: true,
      },
      {
        key: "warehouses_tip",
        label: "Conseil en bas de page",
        fallback:
          "Demandez à votre expéditeur d'inscrire votre nom et votre numéro de téléphone sur le carton : nous vous attribuons ainsi le colis dès son entrée au dépôt.",
        long: true,
      },
    ],
  },
  {
    id: "tracking",
    title: "Page Suivi",
    fields: [
      { key: "tracking_kicker", label: "Petit titre", fallback: "TRAÇABILITÉ EN DIRECT & BORDEREAU" },
      { key: "tracking_title", label: "Titre", fallback: "Suivre mon Colis en Temps Réel" },
      {
        key: "tracking_text",
        label: "Introduction",
        fallback: "Entrez le numéro inscrit sur votre bordereau pour visualiser sa progression officielle.",
        long: true,
      },
    ],
  },
  {
    id: "envoi",
    title: "Page Envoyer un colis",
    fields: [
      { key: "envoi_title", label: "Titre", fallback: "Envoyer un colis" },
      {
        key: "envoi_text",
        label: "Introduction",
        fallback: "Pesez votre colis, remplissez ce formulaire : nous vous envoyons votre devis sur WhatsApp.",
        long: true,
      },
    ],
  },
  {
    id: "boutique",
    title: "Roum Boutique",
    fields: [
      { key: "boutique_kicker", label: "Petit titre", fallback: "Roum Boutique" },
      { key: "boutique_title", label: "Titre", fallback: "Chaussures, sacs & vêtements" },
      {
        key: "boutique_text",
        label: "Introduction",
        fallback: "Choisissez votre taille et votre couleur, payez par Wave ou Orange Money, et suivez votre livraison.",
        long: true,
      },
      { key: "boutique_cta", label: "Bouton de l'en-tête", fallback: "Découvrir la collection" },
      {
        key: "boutique_highlights",
        label: "Points forts (un par ligne, 3 au plus)",
        fallback: "Paiement Wave ou Orange Money\nLivraison suivie jusqu'à chez vous\nStock réel, taille par taille",
        list: true,
      },
      { key: "boutique_collection_title", label: "Titre de la collection", fallback: "La collection" },
      { key: "boutique_steps_title", label: "Commander · titre", fallback: "Commander, simplement" },
      {
        key: "boutique_steps",
        label: "Commander · étapes (une par ligne)",
        fallback: "Choisissez votre taille et votre couleur\nPayez, puis envoyez la capture du paiement\nSuivez votre commande jusqu'à la livraison",
        list: true,
      },
      { key: "boutique_empty", label: "Aucun article en vente", fallback: "Les nouveaux articles arrivent bientôt." },
      {
        key: "boutique_payment_text",
        label: "Paiement · consigne",
        fallback: "Payez le total sur l'un de ces comptes, puis envoyez la capture de votre paiement ci-dessous.",
        long: true,
      },
      { key: "boutique_tracking_kicker", label: "Suivi · petit titre", fallback: "SUIVI DE COMMANDE" },
      { key: "boutique_tracking_title", label: "Suivi · titre", fallback: "Suivre ma commande" },
      {
        key: "boutique_tracking_text",
        label: "Suivi · texte",
        fallback: "Entrez le numéro reçu après votre commande, ou celui de votre colis Roum Transit.",
        long: true,
      },
      { key: "boutique_footer", label: "Pied de page", fallback: "Paiement Wave, Orange Money ou compte Maroc · Livraison suivie" },
    ],
  },
];

export const SITE_IMAGES: SiteImageField[] = [
  { key: "boutique_hero", label: "Boutique · grande image (sinon : photos des derniers articles)", fallback: "" },
  { key: "vitrine_transit", label: "Accueil · carte Transit", fallback: "/images/services/aerien-hublot.jpg" },
  { key: "vitrine_boutique", label: "Accueil · carte Boutique (sinon : photo du premier article)", fallback: "" },
  { key: "achat", label: "Achat en Chine", fallback: "/images/services/achat.jpg" },
  { key: "aerien", label: "Voie aérienne", fallback: "/images/services/aerien-hublot.jpg" },
  { key: "maritime", label: "Voie maritime", fallback: "/images/services/maritime-ciel.jpg" },
  { key: "comptoirs", label: "Comptoirs internationaux", fallback: "/images/services/international_points.jpg" },
];

const TEXT_FALLBACKS = new Map(SITE_SECTIONS.flatMap((section) => section.fields.map((f) => [f.key, f.fallback])));
const IMAGE_FALLBACKS = new Map(SITE_IMAGES.map((image) => [image.key, image.fallback]));

export const siteTextKey = (key: string) => `site_${key}`;
export const siteImageKey = (key: string) => `site_image_${key}`;

/** Le texte a-t-il été personnalisé par la direction ? */
export function hasSiteText(settings: Record<string, string>, key: string): boolean {
  return Boolean(settings[siteTextKey(key)]?.trim());
}

export function siteText(settings: Record<string, string>, key: string): string {
  const custom = settings[siteTextKey(key)];
  return custom?.trim() ? custom : TEXT_FALLBACKS.get(key) ?? "";
}

/** Texte sur plusieurs lignes : une entrée par ligne non vide. */
export function siteLines(settings: Record<string, string>, key: string): string[] {
  return siteText(settings, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function siteImage(settings: Record<string, string>, key: string): string {
  const version = settings[siteImageKey(key)];
  return version
    ? `/api/v1/public/site-images/${key}?v=${encodeURIComponent(version)}`
    : IMAGE_FALLBACKS.get(key) ?? "";
}

export function siteTextFallback(key: string): string {
  return TEXT_FALLBACKS.get(key) ?? "";
}
