// Base exhaustive des pays du monde et devises pour ROUM TRANSIT
// Monnaie par défaut : Franc CFA (FCFA)

export interface CountryInfo {
  code: string;
  name: string;
  hubCity?: string;
  popular?: boolean;
  region: "AFRIQUE" | "ASIE_MOYEN_ORIENT" | "EUROPE" | "AMERIQUES" | "OCEANIE" | string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  short: string;
  isDefault?: boolean;
}

export const DEFAULT_CURRENCY = "FCFA";

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "FCFA", name: "Franc CFA (XOF / XAF)", symbol: "FCFA", short: "FCFA", isDefault: true },
  { code: "EUR", name: "Euro (€)", symbol: "€", short: "€" },
  { code: "USD", name: "Dollar américain ($)", symbol: "$", short: "$" },
  { code: "AED", name: "Dirham des Émirats Arabes Unis (د.إ)", symbol: "AED", short: "Dhs" },
  { code: "MAD", name: "Dirham marocain (DH)", symbol: "MAD", short: "DH" },
  { code: "GBP", name: "Livre sterling (£)", symbol: "£", short: "£" },
  { code: "CNY", name: "Yuan chinois (¥)", symbol: "¥", short: "¥" },
  { code: "CAD", name: "Dollar canadien ($ CA)", symbol: "$ CAD", short: "$ CA" },
  { code: "TRY", name: "Livre turque (₺)", symbol: "₺", short: "₺" },
];

// Couloirs et hubs stratégiques majeurs de ROUM TRANSIT
export const STRATEGIC_HUBS: CountryInfo[] = [
  { code: "CN", name: "Chine", hubCity: "Guangzhou", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "AE", name: "Émirats Arabes Unis (Dubaï)", hubCity: "Dubaï", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "MA", name: "Maroc", hubCity: "Casablanca", popular: true, region: "AFRIQUE" },
  { code: "FR", name: "France", hubCity: "Paris", popular: true, region: "EUROPE" },
  { code: "CI", name: "Côte d'Ivoire", hubCity: "Abidjan", popular: true, region: "AFRIQUE" },
  { code: "TR", name: "Turquie", hubCity: "Istanbul", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "US", name: "États-Unis", hubCity: "New York", popular: true, region: "AMERIQUES" },
  { code: "GB", name: "Royaume-Uni", hubCity: "Londres", popular: true, region: "EUROPE" },
];

// Destinations africaines fréquentes
export const AFRICAN_COUNTRIES: CountryInfo[] = [
  { code: "CI", name: "Côte d'Ivoire", hubCity: "Abidjan", popular: true, region: "AFRIQUE" },
  { code: "SN", name: "Sénégal", hubCity: "Dakar", popular: true, region: "AFRIQUE" },
  { code: "ML", name: "Mali", hubCity: "Bamako", popular: true, region: "AFRIQUE" },
  { code: "BF", name: "Burkina Faso", hubCity: "Ouagadougou", popular: true, region: "AFRIQUE" },
  { code: "GA", name: "Gabon", hubCity: "Libreville", popular: true, region: "AFRIQUE" },
  { code: "GN", name: "Guinée", hubCity: "Conakry", popular: true, region: "AFRIQUE" },
  { code: "TG", name: "Togo", hubCity: "Lomé", popular: true, region: "AFRIQUE" },
  { code: "BJ", name: "Bénin", hubCity: "Cotonou", popular: true, region: "AFRIQUE" },
  { code: "CM", name: "Cameroun", hubCity: "Douala", popular: true, region: "AFRIQUE" },
  { code: "CG", name: "Congo (Brazzaville)", hubCity: "Brazzaville", popular: true, region: "AFRIQUE" },
  { code: "CD", name: "Rép. Dém. du Congo (Kinshasa)", hubCity: "Kinshasa", popular: true, region: "AFRIQUE" },
  { code: "NE", name: "Niger", hubCity: "Niamey", region: "AFRIQUE" },
  { code: "TD", name: "Tchad", hubCity: "N'Djamena", region: "AFRIQUE" },
  { code: "NG", name: "Nigéria", hubCity: "Lagos", region: "AFRIQUE" },
  { code: "GH", name: "Ghana", hubCity: "Accra", region: "AFRIQUE" },
  { code: "RW", name: "Rwanda", hubCity: "Kigali", region: "AFRIQUE" },
  { code: "KE", name: "Kenya", hubCity: "Nairobi", region: "AFRIQUE" },
  { code: "ZA", name: "Afrique du Sud", hubCity: "Johannesburg", region: "AFRIQUE" },
  { code: "TN", name: "Tunisie", hubCity: "Tunis", region: "AFRIQUE" },
  { code: "DZ", name: "Algérie", hubCity: "Alger", region: "AFRIQUE" },
  { code: "EG", name: "Égypte", hubCity: "Le Caire", region: "AFRIQUE" },
  { code: "AO", name: "Angola", hubCity: "Luanda", region: "AFRIQUE" },
  { code: "MR", name: "Mauritanie", hubCity: "Nouakchott", region: "AFRIQUE" },
  { code: "LR", name: "Libéria", hubCity: "Monrovia", region: "AFRIQUE" },
  { code: "SL", name: "Sierra Leone", hubCity: "Freetown", region: "AFRIQUE" },
];

// Liste exhaustive de tous les pays du monde triés par ordre alphabétique
export const ALL_WORLD_COUNTRIES: CountryInfo[] = [
  // Hubs & Afrique inclus
  ...AFRICAN_COUNTRIES,
  { code: "AF", name: "Afghanistan", region: "ASIE_MOYEN_ORIENT" },
  { code: "AL", name: "Albanie", region: "EUROPE" },
  { code: "DE", name: "Allemagne", hubCity: "Francfort", region: "EUROPE" },
  { code: "AD", name: "Andorre", region: "EUROPE" },
  { code: "SA", name: "Arabie Saoudite", hubCity: "Riyad", region: "ASIE_MOYEN_ORIENT" },
  { code: "AR", name: "Argentine", region: "AMERIQUES" },
  { code: "AM", name: "Arménie", region: "ASIE_MOYEN_ORIENT" },
  { code: "AU", name: "Australie", hubCity: "Sydney", region: "OCEANIE" },
  { code: "AT", name: "Autriche", region: "EUROPE" },
  { code: "AZ", name: "Azerbaïdjan", region: "ASIE_MOYEN_ORIENT" },
  { code: "BS", name: "Bahamas", region: "AMERIQUES" },
  { code: "BH", name: "Bahreïn", region: "ASIE_MOYEN_ORIENT" },
  { code: "BD", name: "Bangladesh", region: "ASIE_MOYEN_ORIENT" },
  { code: "BE", name: "Belgique", hubCity: "Bruxelles", region: "EUROPE" },
  { code: "BR", name: "Brésil", hubCity: "São Paulo", region: "AMERIQUES" },
  { code: "BG", name: "Bulgarie", region: "EUROPE" },
  { code: "CA", name: "Canada", hubCity: "Montréal", region: "AMERIQUES" },
  { code: "CL", name: "Chili", region: "AMERIQUES" },
  { code: "CN", name: "Chine", hubCity: "Guangzhou", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "CY", name: "Chypre", region: "EUROPE" },
  { code: "CO", name: "Colombie", region: "AMERIQUES" },
  { code: "KM", name: "Comores", region: "AFRIQUE" },
  { code: "KR", name: "Corée du Sud", hubCity: "Séoul", region: "ASIE_MOYEN_ORIENT" },
  { code: "CR", name: "Costa Rica", region: "AMERIQUES" },
  { code: "HR", name: "Croatie", region: "EUROPE" },
  { code: "DK", name: "Danemark", region: "EUROPE" },
  { code: "DJ", name: "Djibouti", region: "AFRIQUE" },
  { code: "ES", name: "Espagne", hubCity: "Madrid", region: "EUROPE" },
  { code: "EE", name: "Estonie", region: "EUROPE" },
  { code: "US", name: "États-Unis", hubCity: "New York", popular: true, region: "AMERIQUES" },
  { code: "AE", name: "Émirats Arabes Unis (Dubaï)", hubCity: "Dubaï", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "FI", name: "Finlande", region: "EUROPE" },
  { code: "FR", name: "France", hubCity: "Paris", popular: true, region: "EUROPE" },
  { code: "GE", name: "Géorgie", region: "EUROPE" },
  { code: "GR", name: "Grèce", region: "EUROPE" },
  { code: "HU", name: "Hongrie", region: "EUROPE" },
  { code: "IN", name: "Inde", hubCity: "Mumbai", region: "ASIE_MOYEN_ORIENT" },
  { code: "ID", name: "Indonésie", region: "ASIE_MOYEN_ORIENT" },
  { code: "IQ", name: "Irak", region: "ASIE_MOYEN_ORIENT" },
  { code: "IR", name: "Iran", region: "ASIE_MOYEN_ORIENT" },
  { code: "IE", name: "Irlande", region: "EUROPE" },
  { code: "IS", name: "Islande", region: "EUROPE" },
  { code: "IL", name: "Israël", region: "ASIE_MOYEN_ORIENT" },
  { code: "IT", name: "Italie", hubCity: "Milan", region: "EUROPE" },
  { code: "JP", name: "Japon", hubCity: "Tokyo", region: "ASIE_MOYEN_ORIENT" },
  { code: "JO", name: "Jordanie", region: "ASIE_MOYEN_ORIENT" },
  { code: "KZ", name: "Kazakhstan", region: "ASIE_MOYEN_ORIENT" },
  { code: "KW", name: "Koweït", region: "ASIE_MOYEN_ORIENT" },
  { code: "LB", name: "Liban", hubCity: "Beyrouth", region: "ASIE_MOYEN_ORIENT" },
  { code: "LU", name: "Luxembourg", region: "EUROPE" },
  { code: "MG", name: "Madagascar", region: "AFRIQUE" },
  { code: "MY", name: "Malaisie", region: "ASIE_MOYEN_ORIENT" },
  { code: "MA", name: "Maroc", hubCity: "Casablanca", popular: true, region: "AFRIQUE" },
  { code: "MU", name: "Maurice", region: "AFRIQUE" },
  { code: "MX", name: "Mexique", region: "AMERIQUES" },
  { code: "MC", name: "Monaco", region: "EUROPE" },
  { code: "NO", name: "Norvège", region: "EUROPE" },
  { code: "NZ", name: "Nouvelle-Zélande", region: "OCEANIE" },
  { code: "OM", name: "Oman", region: "ASIE_MOYEN_ORIENT" },
  { code: "PK", name: "Pakistan", region: "ASIE_MOYEN_ORIENT" },
  { code: "PA", name: "Panama", region: "AMERIQUES" },
  { code: "NL", name: "Pays-Bas", hubCity: "Amsterdam", region: "EUROPE" },
  { code: "PH", name: "Philippines", region: "ASIE_MOYEN_ORIENT" },
  { code: "PL", name: "Pologne", region: "EUROPE" },
  { code: "PT", name: "Portugal", hubCity: "Lisbonne", region: "EUROPE" },
  { code: "QA", name: "Qatar", hubCity: "Doha", region: "ASIE_MOYEN_ORIENT" },
  { code: "RO", name: "Roumanie", region: "EUROPE" },
  { code: "GB", name: "Royaume-Uni", hubCity: "Londres", popular: true, region: "EUROPE" },
  { code: "RU", name: "Russie", hubCity: "Moscou", region: "EUROPE" },
  { code: "RS", name: "Serbie", region: "EUROPE" },
  { code: "SG", name: "Singapour", region: "ASIE_MOYEN_ORIENT" },
  { code: "SE", name: "Suède", region: "EUROPE" },
  { code: "CH", name: "Suisse", hubCity: "Genève", region: "EUROPE" },
  { code: "TH", name: "Thaïlande", hubCity: "Bangkok", region: "ASIE_MOYEN_ORIENT" },
  { code: "TR", name: "Turquie", hubCity: "Istanbul", popular: true, region: "ASIE_MOYEN_ORIENT" },
  { code: "UA", name: "Ukraine", region: "EUROPE" },
  { code: "VN", name: "Vietnam", hubCity: "Hanoï", region: "ASIE_MOYEN_ORIENT" },
].filter((item, index, self) => index === self.findIndex((t) => t.code === item.code))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

// Helper pour retrouver le code ISO 2 lettres depuis un nom de pays
export function getCountryCodeFromName(name: string = ""): string {
  const n = name.trim().toLowerCase();
  if (!n) return "CI";
  if (n.includes("chine") || n.includes("china")) return "CN";
  if (n.includes("émirat") || n.includes("emirats") || n.includes("dubai") || n.includes("dubaï") || n.includes("uae")) return "AE";
  if (n.includes("maroc") || n.includes("morocco")) return "MA";
  if (n.includes("france") || n.includes("paris")) return "FR";
  if (n.includes("ivoire") || n.includes("ivory")) return "CI";
  if (n.includes("sénégal") || n.includes("senegal")) return "SN";
  if (n.includes("mali")) return "ML";
  if (n.includes("burkina")) return "BF";
  if (n.includes("gabon")) return "GA";
  if (n.includes("guinée") || n.includes("guinea")) return "GN";
  if (n.includes("togo")) return "TG";
  if (n.includes("bénin") || n.includes("benin")) return "BJ";
  if (n.includes("cameroun") || n.includes("cameroon")) return "CM";
  if (n.includes("congo") && !n.includes("dém")) return "CG";
  if (n.includes("kinshasa") || n.includes("rdc") || n.includes("dém")) return "CD";
  if (n.includes("niger")) return "NE";
  if (n.includes("tchad")) return "TD";
  if (n.includes("turquie") || n.includes("turkey")) return "TR";
  if (n.includes("états") || n.includes("etats") || n.includes("usa") || n.includes("united states")) return "US";
  if (n.includes("royaume") || n.includes("uk") || n.includes("angleterre") || n.includes("britain")) return "GB";
  if (n.includes("allemagne") || n.includes("germany")) return "DE";
  if (n.includes("italie") || n.includes("italy")) return "IT";
  if (n.includes("espagne") || n.includes("spain")) return "ES";
  if (n.includes("belgique") || n.includes("belgium")) return "BE";
  if (n.includes("suisse") || n.includes("switzerland")) return "CH";
  if (n.includes("canada")) return "CA";
  if (n.includes("inde") || n.includes("india")) return "IN";
  if (n.includes("vietnam")) return "VN";
  if (n.includes("thaïlande") || n.includes("thailand")) return "TH";
  if (n.includes("qatar")) return "QA";
  if (n.includes("arabie") || n.includes("saoudite")) return "SA";

  const found = ALL_WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === n || n.includes(c.name.toLowerCase()));
  return found ? found.code : "CI";
}
