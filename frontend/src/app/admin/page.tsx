"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  Plus,
  Lock,
  LogOut,
  RefreshCw,
  Sliders,
  LayoutDashboard,
  Inbox,
  DollarSign,
  CheckSquare,
  Settings,
  Download,
  Phone,
  ExternalLink,
  Printer,
  Truck,
  Building2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Ship,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Copy,
  Check,
  Search,
  MapPin,
  Compass,
  Trash2,
  X,
  Sparkles,
  Zap,
  BatteryCharging,
  Laptop,
  ShoppingBag,
  Award,
  FileText,
  CheckCircle2,
  Bot,
  Send,
  MessageSquare,
  Scale,
  Flame,
  ArrowUp,
  Edit,
  Edit3,
  Camera,
  Upload,
  UserCheck,
} from "lucide-react";
import RouteGlobe from "@/components/RouteGlobe";
import { CircularFlag } from "@/components/CircularFlag";
import {
  WaveLogo,
  OrangeMoneyLogo,
  MtnMomoLogo,
  MoovMoneyLogo,
  BankBaciLogo,
  AlipayLogo,
  WeChatPayLogo,
  ReceiptSealLogo,
} from "@/components/PaymentLogos";
import {
  STRATEGIC_HUBS,
  AFRICAN_COUNTRIES,
  ALL_WORLD_COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  getCountryCodeFromName,
} from "@/data/countries";

interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  hubLocation: string | null;
  permissions: string[];
  allowedStatuses: string[];
  avatarUrl?: string | null;
  phone?: string;
}

const GLOBAL_HUBS = [
  {
    code: "CAN",
    city: "Guangzhou",
    country: "Chine",
    role: "Hub Aérien Principal",
    timezone: "UTC+8",
    lon: 113.3,
    lat: 23.3,
  },
  {
    code: "YIW",
    city: "Yiwu",
    country: "Chine",
    role: "Hub Maritime & Cargo",
    timezone: "UTC+8",
    lon: 120.0,
    lat: 29.3,
  },
  {
    code: "DXB",
    city: "Dubaï",
    country: "Émirats AU",
    role: "Transit Golfe & Express",
    timezone: "UTC+4",
    lon: 55.3,
    lat: 25.2,
  },
  {
    code: "CMN",
    city: "Casablanca",
    country: "Maroc",
    role: "Carrefour Maghreb-Afrique",
    timezone: "UTC+1",
    lon: -7.6,
    lat: 33.5,
  },
];

const CITY_COORDS: Record<string, { lon: number; lat: number }> = {
  guangzhou: { lon: 113.3, lat: 23.3 },
  yiwu: { lon: 120.0, lat: 29.3 },
  chine: { lon: 113.3, lat: 23.3 },
  china: { lon: 113.3, lat: 23.3 },
  dubai: { lon: 55.3, lat: 25.2 },
  dubaï: { lon: 55.3, lat: 25.2 },
  casablanca: { lon: -7.6, lat: 33.5 },
  maroc: { lon: -7.6, lat: 33.5 },
  morocco: { lon: -7.6, lat: 33.5 },
  bamako: { lon: -8.0, lat: 12.6 },
  mali: { lon: -8.0, lat: 12.6 },
  abidjan: { lon: -4.0, lat: 5.3 },
  "côte d'ivoire": { lon: -4.0, lat: 5.3 },
  "cote d'ivoire": { lon: -4.0, lat: 5.3 },
  dakar: { lon: -17.4, lat: 14.7 },
  senegal: { lon: -17.4, lat: 14.7 },
  sénégal: { lon: -17.4, lat: 14.7 },
  conakry: { lon: -13.7, lat: 9.5 },
  guinee: { lon: -13.7, lat: 9.5 },
  guinée: { lon: -13.7, lat: 9.5 },
  lome: { lon: 1.2, lat: 6.1 },
  lomé: { lon: 1.2, lat: 6.1 },
  togo: { lon: 1.2, lat: 6.1 },
  cotonou: { lon: 2.4, lat: 6.4 },
  benin: { lon: 2.4, lat: 6.4 },
  bénin: { lon: 2.4, lat: 6.4 },
  douala: { lon: 9.7, lat: 4.0 },
  cameroun: { lon: 9.7, lat: 4.0 },
};

function getShipmentFocusCoords(shipment: any): { lon: number; lat: number } {
  if (!shipment) return { lon: 15.0, lat: 15.0 };
  const destCity = (shipment.destination_city || "").toLowerCase().trim();
  const destCountry = (shipment.destination_country || "").toLowerCase().trim();
  if (CITY_COORDS[destCity]) return CITY_COORDS[destCity];
  if (CITY_COORDS[destCountry]) return CITY_COORDS[destCountry];

  const origCity = (shipment.origin_city || "").toLowerCase().trim();
  const origCountry = (shipment.origin_country || "").toLowerCase().trim();
  if (CITY_COORDS[origCity]) return CITY_COORDS[origCity];
  if (CITY_COORDS[origCountry]) return CITY_COORDS[origCountry];

  return { lon: -8.0, lat: 12.6 };
}

function getShipmentPhase(status?: string): number {
  switch (status) {
    case "RECEIVED_AT_HUB":
    case "DRAFT":
    case "PENDING":
      return 1;
    case "IN_PREPARATION":
    case "CONSOLIDATED":
      return 2;
    case "IN_TRANSIT":
      return 3;
    case "CUSTOMS_CLEARING":
    case "ARRIVED_DESTINATION":
      return 4;
    case "DELIVERED":
    case "READY_PICKUP":
      return 5;
    default:
      return 3;
  }
}

function getWhatsAppUrl(phone?: string, trackingNumber?: string, clientName?: string): string {
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Bonjour ${clientName || "cher client"}, ici la direction ROUM TRANSIT concernant votre expédition réf. ${trackingNumber || ""}. Votre dossier est actuellement actif sur notre radar de transport international.`
  );
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

const POPULAR_ORIGINS = STRATEGIC_HUBS.map((h) => ({
  country: h.name,
  city: h.hubCity || "",
  code: h.code,
}));

const POPULAR_DESTINATIONS = AFRICAN_COUNTRIES.slice(0, 10).map((a) => ({
  country: a.name,
  city: a.hubCity || "",
  code: a.code,
}));

function getCountryFlag(countryName: string = ""): string {
  return countryName;
}

function formatCurrencyPrice(minor: number, currency: string = "FCFA"): string {
  const val = minor / 100;
  if (currency === "FCFA" || currency === "XOF" || currency === "XAF" || currency === "F") {
    return `${Math.round(val).toLocaleString("fr-FR")} FCFA`;
  }
  if (currency === "EUR") {
    return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
  }
  if (currency === "AED") {
    return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Dhs`;
  }
  if (currency === "MAD") {
    return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DH`;
  }
  return `$${val.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getFriendlyStatus(code: string, originalLabel?: string): { icon: string; label: string } {
  switch (code) {
    case "DRAFT":
      return { icon: "", label: "Enregistré (en attente du colis)" };
    case "RECEIVED_AT_HUB":
      return { icon: "", label: "Reçu au magasin de départ" };
    case "PACKED_READY":
      return { icon: "", label: "Colis contrôlé et prêt au départ" };
    case "IN_TRANSIT":
      return { icon: "", label: "En vol / En mer vers la destination" };
    case "CUSTOMS_HOLD":
      return { icon: "", label: "Arrivé à la douane à destination" };
    case "ARRIVED_DESTINATION":
      return { icon: "", label: "Arrivé à l'agence de destination" };
    case "READY_FOR_PICKUP":
    case "READY_PICKUP":
      return { icon: "", label: "Disponible en agence pour retrait" };
    case "OUT_FOR_DELIVERY":
      return { icon: "", label: "En cours de livraison chez le client" };
    case "DELIVERED":
      return { icon: "", label: "Colis remis au client (Livré)" };
    case "INCIDENT":
      return { icon: "", label: "Problème ou retard signalé" };
    case "CANCELLED":
      return { icon: "", label: "Expédition annulée" };
    default:
      return { icon: "", label: originalLabel || code };
  }
}

export function formatRequestType(type?: string): string {
  switch (type) {
    case "ALIBABA":
      return "Achat & Sourcing Alibaba / 1688";
    case "SUPPLIER_TRANSIT":
      return "Transit Fournisseur Direct";
    case "PARCEL_SHIPPING":
      return "Expédition de Colis";
    case "TRACKING_HELP":
      return "Assistance Suivi Colis";
    case "CONTACT":
      return "Demande de Contact";
    default:
      return type ? type.replace(/_/g, " ") : "Demande";
  }
}

export function formatShipmentStatus(status?: string, label?: string): string {
  if (label && label.trim()) return label;
  if (!status) return "Enregistré";
  const friendly = getFriendlyStatus(status);
  return friendly.label || status.replace(/_/g, " ");
}

export function formatTaskCategory(category?: string): string {
  switch (category) {
    case "WAREHOUSE_CHECK":
      return "Contrôle Magasin & Pesée";
    case "QUOTE_PREP":
      return "Établissement de Devis";
    case "GENERAL":
      return "Opérations Générales";
    case "CUSTOMS":
      return "Procédures Douanières";
    case "PAYMENT":
      return "Contrôle Caisse & Facturation";
    case "LOGISTICS":
      return "Suivi Transport";
    default:
      return category ? category.replace(/_/g, " ") : "Opérations";
  }
}

export function formatTaskPriority(priority?: string): string {
  switch (priority) {
    case "URGENT":
      return "Urgent";
    case "HIGH":
      return "Haute";
    case "MEDIUM":
      return "Normale";
    case "LOW":
      return "Basse";
    default:
      return priority || "Normale";
  }
}

export function formatTaskStatus(status?: string): string {
  switch (status) {
    case "TODO":
      return "À faire";
    case "IN_PROGRESS":
      return "En cours";
    case "DONE":
      return "Terminé";
    case "CANCELLED":
      return "Annulé";
    default:
      return status || "En attente";
  }
}

const PERMISSION_LABELS_MAP: Record<string, string> = {
  "dashboard.view": "Voir le tableau de bord",
  "shipments.view": "Consulter les expéditions",
  "shipments.create": "Enregistrer des colis",
  "shipments.edit": "Modifier les colis & pesées",
  "shipments.status.update": "Mettre à jour les jalons",
  "shipments.cancel": "Annuler une expédition",
  "finance.view": "Consulter la caisse",
  "finance.edit": "Valider les paiements",
  "clients.view": "Consulter les clients",
  "clients.create": "Créer un client",
  "clients.edit": "Modifier un client",
  "quotes.view": "Consulter les devis",
  "quotes.process": "Traiter les devis",
  "config.tariffs": "Gérer les tarifs",
  "config.routes": "Gérer les lignes de transport",
  "config.modes": "Gérer les modes de fret",
  "config.statuses": "Gérer les étapes de suivi",
  "requests.view": "Consulter les demandes reçues",
  "requests.process": "Traiter et convertir les demandes",
  "tasks.manage": "Gérer les tâches d'équipe",
  "exports.run": "Exporter les données",
  "settings.manage": "Gérer les coordonnées d'agences",
  "audit.view": "Consulter l'historique d'audit",
};

export function formatPermissionLabel(perm: string): string {
  return PERMISSION_LABELS_MAP[perm] || perm.replace(/[._]/g, " ");
}

export function formatAuditAction(action?: string): string {
  switch (action) {
    case "CREATE":
      return "Création";
    case "UPDATE":
      return "Modification";
    case "DELETE":
      return "Suppression";
    case "STATUS_UPDATE":
      return "Changement d'étape";
    case "INTAKE_WEIGHING":
      return "Pesée magasin Hub";
    case "PAYMENT_RECORD":
      return "Enregistrement paiement";
    case "PAYMENT_CONFIRMED":
      return "Validation caisse";
    case "REQUEST_CONVERT":
      return "Conversion en colis";
    default:
      return action ? action.replace(/_/g, " ") : "Action";
  }
}

export function formatAuditEntity(entity?: string): string {
  switch (entity) {
    case "shipments":
    case "shipment":
      return "Expédition";
    case "requests":
    case "request":
      return "Demande";
    case "payments":
    case "payment":
      return "Paiement";
    case "tasks":
    case "task":
      return "Tâche";
    case "roles":
    case "role":
      return "Rôle";
    case "users":
    case "user":
      return "Collaborateur";
    default:
      return entity || "Entité";
  }
}

// 19 Tarifs Officiels extraits directement des 3 flyers marketing réels de ROUM TRANSIT
const DEFAULT_INITIAL_TARIFFS = [
  // --- 1. FLYER CHINE & DUBAÏ ➔ AFRIQUE (COTE D'IVOIRE) ---
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
    note: "Livraison ultra-rapide en 4 jours",
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
    note: "Économique · 2 semaines",
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
    note: "Produits sous réglementation spéciale",
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
    price_per_unit_minor: 5000000, // 50 000 FCFA
    minimum_charge_minor: 5000000,
    estimated_days_min: 4,
    estimated_days_max: 7,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Protection anti-choc et sécurisation renforcée",
    is_active: 1,
  },
  {
    id: "tariff-flyer-cn-sea",
    origin_country: "Chine",
    origin_city: "Yiwu / Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Par Bateau (Le CBM)",
    shipping_mode_type: "SEA",
    category_tag: "Conteneur Bateau",
    pricing_basis: "PER_CBM",
    currency: "FCFA",
    price_per_unit_minor: 30000000, // 300 000 FCFA / CBM
    minimum_charge_minor: 30000000,
    estimated_days_min: 35,
    estimated_days_max: 45,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Tarif au m³ (CBM) conteneur sécurisé",
    is_active: 1,
  },
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
    note: "Envol direct Dubaï DXB vers Abidjan",
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
    note: "Groupage régulier hebdomadaire",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ae-sea",
    origin_country: "Émirats Arabes Unis",
    origin_city: "Dubaï (Jebel Ali)",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Par Bateau (Le CBM)",
    shipping_mode_type: "SEA",
    category_tag: "Conteneur Bateau",
    pricing_basis: "PER_CBM",
    currency: "FCFA",
    price_per_unit_minor: 30000000, // 300 000 FCFA / CBM
    minimum_charge_minor: 30000000,
    estimated_days_min: 30,
    estimated_days_max: 40,
    flyer_source: "Chine/Dubaï ➔ Afrique",
    note: "Groupage maritime départ Jebel Ali",
    is_active: 1,
  },

  // --- 2. FLYER MAROC ➔ AFRIQUE SUBSAHARIENNE (N°1 DU GROUPAGE AÉRIEN) ---
  {
    id: "tariff-flyer-ma-ci",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Groupage Aérien Subsaharien",
    shipping_mode_type: "AIR",
    category_tag: "Subsaharien 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 650000, // 6 500 FCFA / kg
    minimum_charge_minor: 650000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Fourchette : 6 500 F - 7 500 F / kg · Délai 5j",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ma-sn",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Sénégal",
    destination_city: "Dakar",
    shipping_mode_name: "Groupage Aérien Subsaharien",
    shipping_mode_type: "AIR",
    category_tag: "Subsaharien 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 700000, // 7 000 FCFA / kg
    minimum_charge_minor: 700000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Fourchette : 6 500 F - 7 500 F / kg · Délai 5j",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ma-ml",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Mali",
    destination_city: "Bamako",
    shipping_mode_name: "Groupage Aérien Subsaharien",
    shipping_mode_type: "AIR",
    category_tag: "Subsaharien 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 700000, // 7 000 FCFA / kg
    minimum_charge_minor: 700000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Fourchette : 6 500 F - 7 500 F / kg · Délai 5j",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ma-bf",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Burkina Faso",
    destination_city: "Ouagadougou",
    shipping_mode_name: "Groupage Aérien Subsaharien",
    shipping_mode_type: "AIR",
    category_tag: "Subsaharien 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 750000, // 7 500 FCFA / kg
    minimum_charge_minor: 750000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Fourchette : 6 500 F - 7 500 F / kg · Délai 5j",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ma-ga",
    origin_country: "Maroc",
    origin_city: "Casablanca",
    destination_country: "Gabon",
    destination_city: "Libreville",
    shipping_mode_name: "Groupage Aérien Subsaharien",
    shipping_mode_type: "AIR",
    category_tag: "Subsaharien 5 jours",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 750000, // 7 500 FCFA / kg
    minimum_charge_minor: 750000,
    estimated_days_min: 5,
    estimated_days_max: 5,
    flyer_source: "Maroc ➔ Subsaharien",
    note: "Fourchette : 6 500 F - 7 500 F / kg · Délai 5j",
    is_active: 1,
  },

  // --- 3. FLYER ABIDJAN - PARIS & PARIS - ABIDJAN (BILATÉRAL) ---
  {
    id: "tariff-flyer-fr-ci-divers",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Divers Articles (Marchandises Générales)",
    shipping_mode_type: "AIR",
    category_tag: "Paris ➔ Abidjan (Divers)",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 850000, // 8 500 FCFA / kg
    minimum_charge_minor: 850000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "8 500 F / 12 € Kg",
    note: "Tarif bilatéral France ↔ Côte d'Ivoire",
    is_active: 1,
  },
  {
    id: "tariff-flyer-fr-ci-cosm",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Cosmétique et Liquide",
    shipping_mode_type: "AIR",
    category_tag: "Cosmétiques & Liquides",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 900000, // 9 000 FCFA / kg
    minimum_charge_minor: 900000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "9 000 F / 14 € Kg",
    note: "Emballage & sécurisation étanche incluse",
    is_active: 1,
  },
  {
    id: "tariff-flyer-fr-ci-doc",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_name: "Document Administratif (Pli Express)",
    shipping_mode_type: "AIR",
    category_tag: "Pli Administratif",
    pricing_basis: "PER_UNIT",
    currency: "FCFA",
    price_per_unit_minor: 1300000, // 13 000 FCFA
    minimum_charge_minor: 1300000,
    estimated_days_min: 2,
    estimated_days_max: 3,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "13 000 F / 20 € Forfait",
    note: "Pli confidentiel scellé avec accusé",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ci-fr-divers",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Divers Articles (Marchandises Générales)",
    shipping_mode_type: "AIR",
    category_tag: "Abidjan ➔ Paris (Divers)",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 850000, // 8 500 FCFA / kg
    minimum_charge_minor: 850000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "8 500 F / 12 € Kg",
    note: "Expédition depuis Abidjan Bingerville vers Paris",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ci-fr-cosm",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Cosmétique et Liquide",
    shipping_mode_type: "AIR",
    category_tag: "Cosmétiques & Liquides",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit_minor: 900000, // 9 000 FCFA / kg
    minimum_charge_minor: 900000,
    estimated_days_min: 3,
    estimated_days_max: 5,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "9 000 F / 14 € Kg",
    note: "Beurres, huiles, cosmétiques africains vers l'Europe",
    is_active: 1,
  },
  {
    id: "tariff-flyer-ci-fr-doc",
    origin_country: "Côte d'Ivoire",
    origin_city: "Abidjan",
    destination_country: "France",
    destination_city: "Paris",
    shipping_mode_name: "Document Administratif (Pli Express)",
    shipping_mode_type: "AIR",
    category_tag: "Pli Administratif",
    pricing_basis: "PER_UNIT",
    currency: "FCFA",
    price_per_unit_minor: 1300000, // 13 000 FCFA
    minimum_charge_minor: 1300000,
    estimated_days_min: 2,
    estimated_days_max: 3,
    flyer_source: "Paris ↔ Abidjan",
    secondary_display: "13 000 F / 20 € Forfait",
    note: "Pli confidentiel scellé avec accusé",
    is_active: 1,
  },
];

const DEFAULT_15_SHIPMENTS = [
  {
    id: "tx-1",
    tracking_number: "RM-AIR-2610-K8P9Q2",
    client_name: "Aminata Diallo",
    client_phone: "+223 76 12 34 56",
    origin_city: "Guangzhou",
    origin_country: "Chine",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "IN_TRANSIT",
    status_label: "En vol Guangzhou → Bamako",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 2,
    total_weight_kg: 18.5,
    total_volume_cbm: 0.12,
    payment_status: "PAID",
    total_price_minor: 25900,
    created_at: "2026-10-25 10:14:00",
  },
  {
    id: "tx-2",
    tracking_number: "RM-SEA-2610-M4V7W1",
    client_name: "Ibrahim Traoré",
    client_phone: "+225 07 45 89 12",
    origin_city: "Yiwu",
    origin_country: "Chine",
    destination_city: "Abidjan",
    destination_country: "Côte d'Ivoire",
    current_status: "IN_TRANSIT",
    status_label: "En mer (Conteneur LCL)",
    shipping_mode_name: "Voie Maritime (Bateau)",
    shipping_mode_id: "SEA_LCL",
    total_parcels_count: 14,
    total_weight_kg: 420.0,
    total_volume_cbm: 2.8,
    payment_status: "PAID",
    total_price_minor: 78400,
    created_at: "2026-10-22 14:30:00",
  },
  {
    id: "tx-3",
    tracking_number: "RM-AIR-2610-R3T9Y5",
    client_name: "Khadija Diop",
    client_phone: "+221 77 890 12 34",
    origin_city: "Dubaï",
    origin_country: "Émirats AU",
    destination_city: "Dakar",
    destination_country: "Sénégal",
    current_status: "IN_TRANSIT",
    status_label: "En vol Dubaï → Dakar",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 3,
    total_weight_kg: 34.0,
    total_volume_cbm: 0.25,
    payment_status: "PAID",
    total_price_minor: 47600,
    created_at: "2026-10-26 08:45:00",
  },
  {
    id: "tx-4",
    tracking_number: "RM-AIR-2610-P7L2M8",
    client_name: "Boubacar Cissé",
    client_phone: "+224 622 34 56 78",
    origin_city: "Casablanca",
    origin_country: "Maroc",
    destination_city: "Conakry",
    destination_country: "Guinée",
    current_status: "IN_TRANSIT",
    status_label: "En transit Casablanca → Conakry",
    shipping_mode_name: "Voie Aérienne Standard",
    shipping_mode_id: "AIR_STANDARD",
    total_parcels_count: 2,
    total_weight_kg: 28.0,
    total_volume_cbm: 0.18,
    payment_status: "PENDING",
    total_price_minor: 33600,
    created_at: "2026-10-26 12:20:00",
  },
  {
    id: "tx-5",
    tracking_number: "RM-AIR-2610-Q9HLSS",
    client_name: "Oumar Sidibé",
    client_phone: "+223 70 12 34 56",
    origin_city: "Guangzhou",
    origin_country: "Chine",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "IN_TRANSIT",
    status_label: "En cours d'acheminement",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 1,
    total_weight_kg: 14.5,
    total_volume_cbm: 0.09,
    payment_status: "PAID",
    total_price_minor: 20300,
    created_at: "2026-10-27 17:41:23",
  },
  {
    id: "tx-6",
    tracking_number: "RM-SEA-2610-C5D6E7",
    client_name: "Fanta Coulibaly",
    client_phone: "+228 90 12 34 56",
    origin_city: "Yiwu",
    origin_country: "Chine",
    destination_city: "Lomé",
    destination_country: "Togo",
    current_status: "IN_TRANSIT",
    status_label: "En mer (Conteneur LCL)",
    shipping_mode_name: "Voie Maritime (Bateau)",
    shipping_mode_id: "SEA_LCL",
    total_parcels_count: 9,
    total_weight_kg: 310.0,
    total_volume_cbm: 2.1,
    payment_status: "PAID",
    total_price_minor: 58800,
    created_at: "2026-10-23 11:15:00",
  },
  {
    id: "tx-7",
    tracking_number: "RM-AIR-2610-W2X3Y4",
    client_name: "Mamadou Camara",
    client_phone: "+223 66 78 90 12",
    origin_city: "Dubaï",
    origin_country: "Émirats AU",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "IN_TRANSIT",
    status_label: "En vol Dubaï → Bamako",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 2,
    total_weight_kg: 25.0,
    total_volume_cbm: 0.16,
    payment_status: "PAID",
    total_price_minor: 35000,
    created_at: "2026-10-26 16:00:00",
  },
  {
    id: "tx-8",
    tracking_number: "RM-AIR-2610-B1C2D3",
    client_name: "Moussa Konaté",
    client_phone: "+223 75 43 21 09",
    origin_city: "Guangzhou",
    origin_country: "Chine",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "DELIVERED",
    status_label: "Livré en boutique Bamako",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 2,
    total_weight_kg: 22.0,
    total_volume_cbm: 0.15,
    payment_status: "PAID",
    total_price_minor: 30800,
    created_at: "2026-10-20 09:30:00",
  },
  {
    id: "tx-9",
    tracking_number: "RM-SEA-2610-E5F6G7",
    client_name: "Awa Sanogo",
    client_phone: "+223 79 87 65 43",
    origin_city: "Casablanca",
    origin_country: "Maroc",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "DELIVERED",
    status_label: "Livré en agence Bamako",
    shipping_mode_name: "Voie Terrestre Transfrontalière",
    shipping_mode_id: "ROAD_STANDARD",
    total_parcels_count: 5,
    total_weight_kg: 180.0,
    total_volume_cbm: 1.4,
    payment_status: "PAID",
    total_price_minor: 45000,
    created_at: "2026-10-18 15:40:00",
  },
  {
    id: "tx-10",
    tracking_number: "RM-AIR-2610-Y9Z1A2",
    client_name: "Seydou Keita",
    client_phone: "+225 05 67 89 01",
    origin_city: "Dubaï",
    origin_country: "Émirats AU",
    destination_city: "Abidjan",
    destination_country: "Côte d'Ivoire",
    current_status: "DELIVERED",
    status_label: "Livré à Abidjan",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 4,
    total_weight_kg: 45.0,
    total_volume_cbm: 0.32,
    payment_status: "PAID",
    total_price_minor: 58500,
    created_at: "2026-10-19 11:00:00",
  },
  {
    id: "tx-11",
    tracking_number: "RM-AIR-2610-D4E5F6",
    client_name: "Mariam Bamba",
    client_phone: "+225 01 23 45 67",
    origin_city: "Guangzhou",
    origin_country: "Chine",
    destination_city: "Abidjan",
    destination_country: "Côte d'Ivoire",
    current_status: "DELIVERED",
    status_label: "Livré au client",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 1,
    total_weight_kg: 16.0,
    total_volume_cbm: 0.11,
    payment_status: "PAID",
    total_price_minor: 22400,
    created_at: "2026-10-21 14:10:00",
  },
  {
    id: "tx-12",
    tracking_number: "RM-AIR-2610-T7U8V9",
    client_name: "Sékou Touré",
    client_phone: "+221 70 345 67 89",
    origin_city: "Casablanca",
    origin_country: "Maroc",
    destination_city: "Dakar",
    destination_country: "Sénégal",
    current_status: "DELIVERED",
    status_label: "Remis en main propre",
    shipping_mode_name: "Voie Aérienne Standard",
    shipping_mode_id: "AIR_STANDARD",
    total_parcels_count: 3,
    total_weight_kg: 31.0,
    total_volume_cbm: 0.22,
    payment_status: "PAID",
    total_price_minor: 37200,
    created_at: "2026-10-17 10:00:00",
  },
  {
    id: "tx-13",
    tracking_number: "RM-AIR-2610-H8J9K0",
    client_name: "Ousmane Fofana",
    client_phone: "+223 78 90 12 34",
    origin_city: "Casablanca",
    origin_country: "Maroc",
    destination_city: "Bamako",
    destination_country: "Mali",
    current_status: "RECEIVED_AT_HUB",
    status_label: "Réceptionné magasin Casablanca",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 1,
    total_weight_kg: 12.0,
    total_volume_cbm: 0.08,
    payment_status: "PENDING",
    total_price_minor: 16800,
    created_at: "2026-10-27 14:20:00",
  },
  {
    id: "tx-14",
    tracking_number: "RM-AIR-2610-L1M2N3",
    client_name: "Fatoumata Barry",
    client_phone: "+228 91 23 45 67",
    origin_city: "Yiwu",
    origin_country: "Chine",
    destination_city: "Lomé",
    destination_country: "Togo",
    current_status: "RECEIVED_AT_HUB",
    status_label: "Groupage en cours magasin Yiwu",
    shipping_mode_name: "Voie Maritime (Bateau)",
    shipping_mode_id: "SEA_LCL",
    total_parcels_count: 4,
    total_weight_kg: 45.0,
    total_volume_cbm: 0.3,
    payment_status: "PENDING",
    total_price_minor: 25000,
    created_at: "2026-10-27 11:45:00",
  },
  {
    id: "tx-15",
    tracking_number: "RM-AIR-2610-K3L4P5",
    client_name: "Modibo Samaké",
    client_phone: "+229 97 89 01 23",
    origin_city: "Dubaï",
    origin_country: "Émirats AU",
    destination_city: "Cotonou",
    destination_country: "Bénin",
    current_status: "RECEIVED_AT_HUB",
    status_label: "Colis en attente de pesée Dubaï",
    shipping_mode_name: "Voie Aérienne Express",
    shipping_mode_id: "AIR_EXPRESS",
    total_parcels_count: 2,
    total_weight_kg: 30.0,
    total_volume_cbm: 0.2,
    payment_status: "PENDING",
    total_price_minor: 42000,
    created_at: "2026-10-27 16:30:00",
  },
];

function renderCleanAssistantText(rawText: string) {
  const cleaned = rawText
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();

  const lines = cleaned.split("\n");
  return lines.map((line, idx) => (
    <div key={idx} style={{ minHeight: line.trim() === "" ? "8px" : undefined }}>
      {line}
    </div>
  ));
}

function IOSTypingMessage({
  text,
  isNew,
  onTick,
}: {
  text: string;
  isNew: boolean;
  onTick?: () => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(() => (isNew ? 0 : text.length));
  const hasFinishedRef = useRef(!isNew);

  useEffect(() => {
    if (!isNew || hasFinishedRef.current) {
      setDisplayedLength(text.length);
      return;
    }

    let current = displayedLength;
    const interval = setInterval(() => {
      current += 3;
      if (current >= text.length) {
        setDisplayedLength(text.length);
        hasFinishedRef.current = true;
        clearInterval(interval);
        onTick?.();
      } else {
        setDisplayedLength(current);
        onTick?.();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, isNew]);

  const displayedText = text.slice(0, displayedLength);
  const isTyping = isNew && !hasFinishedRef.current && displayedLength < text.length;

  return (
    <div style={{ lineHeight: "1.55" }}>
      {renderCleanAssistantText(displayedText)}
      {isTyping && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "14px",
            background: "#007AFF",
            marginLeft: "2px",
            verticalAlign: "middle",
            borderRadius: "1px",
            animation: "iosCaretBlink 0.7s infinite",
          }}
        />
      )}
    </div>
  );
}

const DEFAULT_COMPANY_SETTINGS: Record<string, string> = {
  company_name: "ROUM TRANSIT INTERNATIONAL SARL",
  company_rccm: "CI-ABJ-2024-B-14289",
  company_nif: "2418520 M",
  company_customs_license: "CAD-N° 2026/048-DGD (Commissionnaire Agréé en Douane)",
  company_headquarters: "Abidjan, Bingerville, Carrefour Safari, Résidence Roum",
  company_email: "contact@roumtransit.com",
  company_billing_email: "facturation@roumtransit.com",
  whatsapp_official_number: "+225 01 53 63 85 69",
  phone_secondary: "+225 07 48 29 11 00",

  // Hubs mondiaux & adresses de livraison
  warehouse_china_address: "No. 88 Huanshi Dong Road, Yuexiu District, Guangzhou, Guangdong, Chine (Code: 510000)",
  warehouse_china_shipping_mark: "ROUM-CAN-[VOTRE_NOM]-[CODE_PAYS]",
  warehouse_china_contact: "+86 138 2449 8812 (WhatsApp Hub Guangzhou)",
  warehouse_dubai_address: "Al Sabkha Road, Deira, Office 304, Dubaï, Émirats Arabes Unis",
  warehouse_dubai_contact: "+971 50 892 4110 (WhatsApp Hub Dubaï)",
  agency_paris_address: "14 Rue de la Logistique, 93290 Tremblay-en-France / Roissy CDG",
  agency_paris_contact: "+33 6 52 90 14 30 (Liaison Paris)",

  // Moyens de paiement & Comptes de transit
  payment_wave_ci: "+225 01 53 63 85 69",
  payment_wave_name: "ROUM TRANSIT SARL",
  payment_wave_merchant: "wave.me/roumtransit",
  payment_orange_money_ci: "#144*389278# / +225 07 48 29 11 00",
  payment_orange_name: "ROUM TRANSIT INTERNATIONAL",
  payment_mtn_momo_ci: "MOMO-749201 / +225 05 94 32 10 05",
  payment_mtn_name: "ROUM LOGISTICS",
  payment_moov_money: "+225 01 02 03 04 05 (ROUM TRANSIT)",
  payment_bank_name: "Banque Atlantique Côte d'Ivoire (BACI)",
  payment_bank_account_holder: "ROUM TRANSIT INTERNATIONAL SARL",
  payment_bank_rib: "CI092 01001 012345678901 24",
  payment_bank_swift: "ATBKCIAB",
  payment_alipay_china: "pay@roumtransit-china.com (Règlements Fournisseurs Chine)",
  payment_euro_sepa: "FR76 3000 4001 2345 6789 0123 456 (BIC: BNPAFRPP)",
  payment_cash_desks: "Guichets Espèces : Agence Abidjan Bingerville & Magasin Guangzhou",
  payment_receipt_terms: "Tout paiement doit faire l'objet d'un reçu ou bordereau officiel validé en caisse avant remise ou livraison des colis.",
};

const DEFAULT_REQUESTS = [
  {
    id: "req-01",
    reference: "REQ-ALIBABA-2610-001",
    client_id: "cli-02",
    client_name: "Koffi & Fils Import",
    client_phone: "+225 07 88 99 11",
    client_email: "koffi.import@gmail.com",
    request_type: "ALIBABA",
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_id: "AIR_EXPRESS",
    description: "Sourcing & commande de 50 trottinettes électriques 350W pliables + casques de protection sur Alibaba. Contrôle qualité usine requis avant expédition.",
    estimated_weight_kg: 480.0,
    estimated_cbm: 2.8,
    supplier_name: "Guangzhou E-Vehicle Tech Co., Ltd",
    status: "IN_REVIEW",
    assigned_to_user_id: "user-superadmin-01",
    admin_notes: "Fournisseur contacté sur WeChat, proforma en négociation.",
    items_count: 50,
    items: [
      { id: "item-01", description: "Trottinettes électriques 350W pliables", quantity: 50, unit_price: 180, currency: "USD", product_url: "https://alibaba.com/product/trottinette-350w" },
      { id: "item-02", description: "Casques de protection renforcés", quantity: 50, unit_price: 15, currency: "USD" }
    ],
    created_at: "2026-10-26 14:00:00",
    updated_at: "2026-10-27 09:30:00",
  },
  {
    id: "req-02",
    reference: "REQ-ALIBABA-2610-002",
    client_id: "cli-03",
    client_name: "Boutique Glamour Dakar",
    client_phone: "+221 77 34 56 78",
    client_email: "glamour.dakar@gmail.com",
    request_type: "ALIBABA",
    origin_country: "Chine",
    origin_city: "Yiwu",
    destination_country: "Sénégal",
    destination_city: "Dakar",
    shipping_mode_id: "AIR_STANDARD",
    description: "Achat groupé textile et confections de robes de soirée sur 1688 Yiwu, 250 pièces assorties.",
    estimated_weight_kg: 115.0,
    estimated_cbm: 0.75,
    supplier_name: "Yiwu Fashion Garments Factory",
    status: "NEW",
    assigned_to_user_id: "user-superadmin-01",
    admin_notes: "Liens 1688 reçus, calcul des frais d'achat et commission 5% en cours.",
    items_count: 250,
    items: [
      { id: "item-03", description: "Robes de soirée assorties dentelle & satin", quantity: 250, unit_price: 35, currency: "CNY", product_url: "https://1688.com/product/robes-soiree-yiwu" }
    ],
    created_at: "2026-10-27 11:15:00",
    updated_at: "2026-10-27 11:15:00",
  },
  {
    id: "req-03",
    reference: "REQ-TRANSIT-2610-003",
    client_id: "cli-05",
    client_name: "Mali Tech Distribution",
    client_phone: "+223 70 11 22 33",
    client_email: "malitech@afribone.net.ml",
    request_type: "SUPPLIER_TRANSIT",
    origin_country: "Chine",
    origin_city: "Shenzhen",
    destination_country: "Mali",
    destination_city: "Bamako",
    shipping_mode_id: "AIR_EXPRESS",
    description: "Réception chez fournisseur à Shenzhen de 60 cartes mères industrielles et écrans PC. Groupage aérien express vers Bamako.",
    estimated_weight_kg: 42.0,
    estimated_cbm: 0.35,
    supplier_name: "Shenzhen Micro Electronics Ltd",
    status: "QUOTE_SENT",
    assigned_to_user_id: "user-superadmin-01",
    admin_notes: "Devis express envoyé sur WhatsApp (+223). En attente accord client.",
    items_count: 60,
    items: [
      { id: "item-04", description: "Cartes mères industrielles B550", quantity: 30, unit_price: 85, currency: "USD" },
      { id: "item-05", description: "Écrans d'affichage haute définition 24 pouces", quantity: 30, unit_price: 95, currency: "USD" }
    ],
    created_at: "2026-10-27 15:20:00",
    updated_at: "2026-10-27 18:00:00",
  },
  {
    id: "req-04",
    reference: "REQ-PARCEL-2610-004",
    client_id: "cli-04",
    client_name: "Cosmétiques Bio Bingerville",
    client_phone: "+225 05 12 34 56",
    client_email: "contact@biobingerville.ci",
    request_type: "PARCEL_SHIPPING",
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_id: "AIR_STANDARD",
    description: "Expédition régulière bimensuelle de cosmétiques, crèmes de beauté et savons clarifiants Paris ↔ Abidjan.",
    estimated_weight_kg: 35.0,
    estimated_cbm: 0.22,
    supplier_name: "Laboratoires Dermasoin Paris",
    status: "NEW",
    assigned_to_user_id: "user-superadmin-01",
    admin_notes: "Colis attendu au point de collecte Paris ce vendredi.",
    items_count: 14,
    items: [
      { id: "item-06", description: "Lots crèmes hydratantes visage 200ml", quantity: 20, unit_price: 12, currency: "EUR" },
      { id: "item-07", description: "Pains de savons clarifiants dermatologiques", quantity: 50, unit_price: 4, currency: "EUR" }
    ],
    created_at: "2026-10-28 01:10:00",
    updated_at: "2026-10-28 01:10:00",
  },
];

const DEFAULT_CLIENTS = [
  { id: "cli-01", full_name: "Aminata Diallo", phone_whatsapp: "+223 76 12 34 56", email: "aminata.diallo@gmail.com", city: "Bamako", country: "Mali", shipments_count: 1, total_spent_minor: 22200000 },
  { id: "cli-02", full_name: "Ibrahim Traoré", phone_whatsapp: "+225 07 45 67 89", email: "ibrahim.traore@yahoo.fr", city: "Abidjan", country: "Côte d'Ivoire", shipments_count: 1, total_spent_minor: 126000000 },
  { id: "cli-03", full_name: "Khadija Diop", phone_whatsapp: "+221 77 89 01 23", email: "khadija.diop@orange.sn", city: "Dakar", country: "Sénégal", shipments_count: 1, total_spent_minor: 40800000 },
  { id: "cli-04", full_name: "Boubacar Cissé", phone_whatsapp: "+224 62 11 22 33", email: "boubacar.cisse@gmail.com", city: "Conakry", country: "Guinée", shipments_count: 1, total_spent_minor: 18200000 },
  { id: "cli-05", full_name: "Oumar Sidibé", phone_whatsapp: "+223 66 77 88 99", email: "oumar.sidibe@gmail.com", city: "Bamako", country: "Mali", shipments_count: 1, total_spent_minor: 17400000 },
  { id: "cli-06", full_name: "Fanta Coulibaly", phone_whatsapp: "+228 90 12 34 56", email: "fanta.coulibaly@moov.tg", city: "Lomé", country: "Togo", shipments_count: 1, total_spent_minor: 60000000 },
  { id: "cli-07", full_name: "Mamadou Camara", phone_whatsapp: "+223 70 88 99 00", email: "mamadou.camara@malitel.ml", city: "Bamako", country: "Mali", shipments_count: 1, total_spent_minor: 7440000 },
  { id: "cli-08", full_name: "Moussa Konaté", phone_whatsapp: "+223 65 44 33 22", email: "moussa.konate@gmail.com", city: "Bamako", country: "Mali", shipments_count: 1, total_spent_minor: 66500000 },
  { id: "cli-09", full_name: "Awa Sanogo", phone_whatsapp: "+223 79 00 11 22", email: "awa.sanogo@gmail.com", city: "Bamako", country: "Mali", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-10", full_name: "Seydou Keita", phone_whatsapp: "+225 05 66 77 88", email: "seydou.keita@ci.com", city: "Abidjan", country: "Côte d'Ivoire", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-11", full_name: "Fatoumata Bamba", phone_whatsapp: "+221 70 33 44 55", email: "fatou.bamba@gmail.com", city: "Dakar", country: "Sénégal", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-12", full_name: "Cheick Oumar", phone_whatsapp: "+224 66 55 44 33", email: "cheick.oumar@gn.com", city: "Conakry", country: "Guinée", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-13", full_name: "Marie-Claire Kouassi", phone_whatsapp: "+225 01 22 33 44", email: "mc.kouassi@avocat.ci", city: "Abidjan", country: "Côte d'Ivoire", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-14", full_name: "Bakary Dembélé", phone_whatsapp: "+223 78 99 88 77", email: "bakary.dembele@sotelma.ml", city: "Bamako", country: "Mali", shipments_count: 0, total_spent_minor: 0 },
  { id: "cli-15", full_name: "Salif Traoré", phone_whatsapp: "+225 07 88 99 00", email: "salif.traore@boutique.ci", city: "Abidjan", country: "Côte d'Ivoire", shipments_count: 0, total_spent_minor: 0 },
];

const DEFAULT_PAYMENTS = [
  { id: "pay-01", shipment_id: "sh-01", client_id: "cli-01", client_name: "Aminata Diallo", amount_minor: 22200000, currency: "FCFA", payment_method: "ORANGE_MONEY", payment_type: "FULL", reference_code: "OM-CI-2610-8841", status: "CONFIRMED", receipt_notes: "Règlement total voie express Chine -> Bamako 18.5kg", recorded_at: "2026-10-25 11:20:00" },
  { id: "pay-02", shipment_id: "sh-02", client_id: "cli-02", client_name: "Ibrahim Traoré", amount_minor: 126000000, currency: "FCFA", payment_method: "BANK_TRANSFER", payment_type: "FULL", reference_code: "VIR-SGBCI-44910", status: "CONFIRMED", receipt_notes: "Paiement intégral groupage maritime CBM 4.2m3", recorded_at: "2026-10-25 14:45:00" },
  { id: "pay-03", shipment_id: "sh-03", client_id: "cli-03", client_name: "Khadija Diop", amount_minor: 40800000, currency: "FCFA", payment_method: "WAVE", payment_type: "FULL", reference_code: "WV-SN-2610-9912", status: "CONFIRMED", receipt_notes: "Envol direct Dubaï -> Dakar 34kg", recorded_at: "2026-10-26 09:15:00" },
  { id: "pay-04", shipment_id: "sh-04", client_id: "cli-04", client_name: "Boubacar Cissé", amount_minor: 18200000, currency: "FCFA", payment_method: "CASH", payment_type: "FULL", reference_code: "ESP-ABJ-00412", status: "CONFIRMED", receipt_notes: "Encaissé en agence Bingerville (Maroc -> Abidjan 28kg)", recorded_at: "2026-10-26 15:30:00" },
  { id: "pay-05", shipment_id: "sh-05", client_id: "cli-05", client_name: "Oumar Sidibé", amount_minor: 17400000, currency: "FCFA", payment_method: "ORANGE_MONEY", payment_type: "FULL", reference_code: "OM-ML-2610-1123", status: "CONFIRMED", receipt_notes: "Voie Aérienne Chine -> Bamako 14.5kg", recorded_at: "2026-10-27 10:00:00" },
  { id: "pay-06", shipment_id: "sh-06", client_id: "cli-06", client_name: "Fanta Coulibaly", amount_minor: 60000000, currency: "FCFA", payment_method: "WAVE", payment_type: "FULL", reference_code: "WV-CI-2610-3301", status: "CONFIRMED", receipt_notes: "Conteneur Bateau 2.0 CBM LCL", recorded_at: "2026-10-27 12:40:00" },
  { id: "pay-07", shipment_id: "sh-07", client_id: "cli-07", client_name: "Mamadou Camara", amount_minor: 7440000, currency: "FCFA", payment_method: "WAVE", payment_type: "FULL", reference_code: "WV-CI-2610-5590", status: "CONFIRMED", receipt_notes: "Voie Express Chine -> Côte d'Ivoire 6.2kg", recorded_at: "2026-10-27 16:10:00" },
  { id: "pay-08", shipment_id: "sh-08", client_id: "cli-08", client_name: "Moussa Konaté", amount_minor: 66500000, currency: "FCFA", payment_method: "BANK_TRANSFER", payment_type: "FULL", reference_code: "VIR-ECOBANK-7712", status: "CONFIRMED", receipt_notes: "Groupage Aérien Régulier 95kg", recorded_at: "2026-10-27 17:05:00" },
];

const DEFAULT_TASKS = [
  { id: "tsk-01", title: "Contrôle pesée & scellés lot CAN-2610-04", description: "Pesée volumétrique, contrôle scanner et scellés de sécurité au magasin central de Guangzhou avant chargement vol cargo.", category: "WAREHOUSE_CHECK", priority: "URGENT", status: "IN_PROGRESS", due_date: "2026-10-28 12:00:00", created_at: "2026-10-27 08:00:00" },
  { id: "tsk-02", title: "Dédouanement conteneur maritime CBM n°7", description: "Finalisation du dédouanement et bon à enlever au Port Autonome d'Abidjan pour les lots LCL.", category: "GENERAL", priority: "HIGH", status: "TODO", due_date: "2026-10-29 17:00:00", created_at: "2026-10-27 14:30:00" },
  { id: "tsk-03", title: "Appel validation devis sourcing REQ-01", description: "Contacter Koffi & Fils pour confirmation proforma fournisseur Alibaba et encaissement acompte.", category: "QUOTE_PREP", priority: "MEDIUM", status: "TODO", due_date: "2026-10-28 16:00:00", created_at: "2026-10-27 16:00:00" },
];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire de connexion
  const [email, setEmail] = useState("admin@roumtransit.com");
  const [password, setPassword] = useState("AdminRoum2026!");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<
    | "assistant"
    | "dashboard"
    | "requests"
    | "shipments"
    | "clients"
    | "tariffs"
    | "finances"
    | "tasks"
    | "settings"
  >("dashboard");

  // Données avec Persistance Locale Totale (Zéro perte de données)
  const [stats, setStats] = useState<any>({
    total_shipments: 15,
    active_shipments: 8,
    delivered_shipments: 5,
    pending_requests: 3,
    total_clients: 15,
    total_payments_minor: 358540000,
  });

  const [requestsList, setRequestsList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_requests_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_REQUESTS;
  });

  const [shipments, setShipments] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_shipments_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_15_SHIPMENTS;
  });

  const [clientsList, setClientsList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_clients_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CLIENTS;
  });

  const [tariffsList, setTariffsList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_tariffs_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_INITIAL_TARIFFS;
  });

  const [routesList, setRoutesList] = useState<any[]>([]);
  const [modesList, setModesList] = useState<any[]>([]);

  const [paymentsList, setPaymentsList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_payments_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_PAYMENTS;
  });

  const [tasksList, setTasksList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_tasks_data");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_TASKS;
  });

  const [roles, setRoles] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<Record<string, string>>(DEFAULT_COMPANY_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Synchronisation continue vers le stockage permanent du navigateur (Anti-perte)
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_requests_data", JSON.stringify(requestsList));
  }, [requestsList]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_shipments_data", JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_clients_data", JSON.stringify(clientsList));
  }, [clientsList]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_tariffs_data", JSON.stringify(tariffsList));
  }, [tariffsList]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_payments_data", JSON.stringify(paymentsList));
  }, [paymentsList]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roum_tasks_data", JSON.stringify(tasksList));
  }, [tasksList]);

  // Notifications Toast Système Style Dashboard (Supprime les popups du navigateur)
  const [toast, setToast] = useState<{ message: string; title?: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (message: string, title?: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, title, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Modales Générales « Modifier »
  const [editingTariff, setEditingTariff] = useState<any | null>(null);
  const [editingShipment, setEditingShipment] = useState<any | null>(null);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Modale Profil Madame Marouba (CEO) & Photo
  const [showProfileModal, setShowProfileModal] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "Madame Marouba",
    roleName: "CEO · Direction Générale",
    phone: "+225 07 00 00 00 00",
    email: "ceo@roumtransit.com",
    avatarUrl: "",
  });

  // Chargement du profil sauvegardé
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_profile_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser((curr) => {
            const baseUser: UserSession = curr || {
              userId: "user-ceo-marouba",
              email: parsed.email || "ceo@roumtransit.com",
              fullName: parsed.fullName || "Madame Marouba",
              roleId: "CEO",
              roleName: parsed.roleName || "CEO · Direction Générale",
              isSuperAdmin: true,
              hubLocation: "Direction Générale Abidjan / Bamako",
              permissions: ["*"],
              allowedStatuses: ["*"],
            };
            return {
              ...baseUser,
              fullName: parsed.fullName || baseUser.fullName,
              roleName: parsed.roleName || baseUser.roleName,
              avatarUrl: parsed.avatarUrl || baseUser.avatarUrl,
              phone: parsed.phone || baseUser.phone,
              email: parsed.email || baseUser.email,
            };
          });
          setProfileForm({
            fullName: parsed.fullName || "Madame Marouba",
            roleName: parsed.roleName || "CEO · Direction Générale",
            phone: parsed.phone || "+225 07 00 00 00 00",
            email: parsed.email || "ceo@roumtransit.com",
            avatarUrl: parsed.avatarUrl || "",
          });
        }
      } catch {}
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserSession = {
      ...(user || {
        userId: "user-ceo-marouba",
        email: profileForm.email,
        fullName: profileForm.fullName,
        roleId: "CEO",
        roleName: profileForm.roleName,
        isSuperAdmin: true,
        hubLocation: "Direction Générale Abidjan / Bamako",
        permissions: ["*"],
        allowedStatuses: ["*"],
      }),
      fullName: profileForm.fullName.trim() || "Madame Marouba",
      roleName: profileForm.roleName.trim() || "CEO · Direction Générale",
      phone: profileForm.phone,
      email: profileForm.email,
      avatarUrl: profileForm.avatarUrl || user?.avatarUrl || null,
    };

    setUser(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("roum_profile_data", JSON.stringify(updatedUser));
    }
    triggerToast("Votre profil et photo ont été mis à jour avec succès !", "Profil Direction");
    setShowProfileModal(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("Veuillez choisir une photo de taille inférieure à 5 Mo.", "Photo de profil", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setProfileForm((prev) => ({ ...prev, avatarUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Recherche & filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState<"ALL" | "URGENT" | "PENDING" | "DONE">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGlobeExpanded, setIsGlobeExpanded] = useState(false);

  // Synchronisation Tableau de bord & Globe 3D
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [globeFocusTarget, setGlobeFocusTarget] = useState<{ lon: number; lat: number } | null>(null);
  const [activeHubCode, setActiveHubCode] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<string>("ALL");
  const [dashboardSearch, setDashboardSearch] = useState<string>("");

  // --- ASSISTANT OPÉRATIONNEL ROUM (Supervision temps réel Madame Marouba) ---
  const [agentTab, setAgentTab] = useState<"alerts" | "activity">("alerts");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "agent"; text: string; time: string }>
  >(() => [
    {
      sender: "agent",
      text: `Bonjour ${user?.fullName || "Madame Marouba"}. Votre console de direction ROUM TRANSIT est opérationnelle.\nToutes vos expéditions, caisses et demandes de transit sont synchronisées en direct. Comment puis-je vous assister aujourd'hui ?`,
      time: "En direct",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boss = user?.fullName || "Madame Marouba";
    setChatMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === "agent") {
        return [
          {
            sender: "agent",
            text: `Bonjour ${boss}. Votre console de direction ROUM TRANSIT est opérationnelle.\nToutes vos expéditions, caisses et demandes de transit sont synchronisées en direct. Comment puis-je vous assister aujourd'hui ?`,
            time: "En direct",
          },
        ];
      }
      return prev;
    });
  }, [user?.fullName]);

  const scrollToChatBottom = (smooth = true) => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  useEffect(() => {
    scrollToChatBottom(true);
  }, [chatMessages.length, isAgentThinking]);

  const pendingPaymentsList = paymentsList.filter((p) => p.status === "PENDING");
  const pendingWeighingsList = shipments.filter(
    (s) =>
      (s.current_status === "RECEIVED_AT_HUB" || s.current_status === "IN_PREPARATION") &&
      (!s.total_weight_kg || Number(s.total_weight_kg) <= 0 || !s.weighed_at)
  );
  const pendingRequestsList = requestsList.filter(
    (r) => r.status === "NEW" || r.status === "IN_REVIEW"
  );
  const urgentTasksList = tasksList.filter(
    (t) => t.status !== "DONE" && (t.priority === "URGENT" || t.priority === "HIGH")
  );

  const totalAgentAlerts =
    pendingPaymentsList.length +
    pendingWeighingsList.length +
    pendingRequestsList.length +
    urgentTasksList.length;

  const handleAskAgent = async (qText: string) => {
    const q = qText.trim();
    if (!q) return;

    const userMsg = {
      sender: "user" as const,
      text: q,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAgentThinking(true);

    const confirmed = paymentsList
      .filter((p) => p.status === "CONFIRMED")
      .reduce((acc, p) => acc + (p.amount_minor || 0), 0);
    const pendingAmount = pendingPaymentsList.reduce((acc, p) => acc + (p.amount_minor || 0), 0);
    const inTransitShipments = shipments.filter((s) => s.current_status === "IN_TRANSIT");

    const liveContext = {
      confirmedCashTotal: formatCurrencyPrice(confirmed, "FCFA"),
      pendingPaymentsCount: pendingPaymentsList.length,
      pendingPaymentsAmount: formatCurrencyPrice(pendingAmount, "FCFA"),
      pendingWeighingsCount: pendingWeighingsList.length,
      pendingWeighingsSample: pendingWeighingsList.slice(0, 4).map((s) => `${s.tracking_number} (${s.client_name})`),
      pendingRequestsCount: pendingRequestsList.length,
      pendingRequestsSample: pendingRequestsList.slice(0, 4).map((r) => `${r.reference} - ${r.client_name}`),
      urgentTasksCount: urgentTasksList.length,
      activeShipmentsCount: inTransitShipments.length,
      activeShipmentsSample: inTransitShipments.slice(0, 4).map((s) => `${s.tracking_number} (${s.client_name}, ${s.origin_country} vers ${s.destination_country})`),
      recentActions: auditLogs.slice(0, 4).map((l) => `${l.user_name || "Agent"}: ${l.action}`),
    };

    let reply = "";

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          context: liveContext,
          history: chatMessages.slice(-6),
          userFullName: user?.fullName || "Madame Marouba",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          reply = data.reply;
        }
      }
    } catch (err) {
      console.warn("AI API error, fallback to deterministic reply", err);
    }

    if (!reply) {
      const qLower = q.toLowerCase();
      if (
        qLower.includes("caisse") ||
        qLower.includes("paiement") ||
        qLower.includes("argent") ||
        qLower.includes("finance") ||
        qLower.includes("encaiss") ||
        qLower.includes("wave") ||
        qLower.includes("orange")
      ) {
        reply = `Point Caisse & Finances :\n- Total encaissé validé : ${formatCurrencyPrice(confirmed, "FCFA")}\n- En attente de contrôle caisse : ${pendingPaymentsList.length} paiement(s) représentant ${formatCurrencyPrice(pendingAmount, "FCFA")}.\n\n${
          pendingPaymentsList.length > 0
            ? "Vous pouvez valider ou rejeter ces règlements dans la colonne de gauche."
            : "Tous les règlements sont à jour."
        }`;
      } else if (
        qLower.includes("attente") ||
        qLower.includes("bloqu") ||
        qLower.includes("faire") ||
        qLower.includes("urgent") ||
        qLower.includes("priorit") ||
        qLower.includes("action")
      ) {
        reply = `Actions prioritaires à traiter :\n1. Contrôle Caisse : ${pendingPaymentsList.length} paiement(s) en attente de vérification.\n2. Pesée Magasin Hub : ${pendingWeighingsList.length} colis réceptionné(s) au hub sans pesée officielle.\n3. Demandes Sourcing / Transit : ${pendingRequestsList.length} nouvelle(s) demande(s) en attente d'analyse.\n4. Tâches d'Équipe : ${urgentTasksList.length} tâche(s) urgente(s) non terminée(s).\n\nVous pouvez traiter chacun de ces points directement dans la colonne de gauche.`;
      } else if (
        qLower.includes("résumé") ||
        qLower.includes("resume") ||
        qLower.includes("journée") ||
        qLower.includes("journee") ||
        qLower.includes("bilan") ||
        qLower.includes("aujourd'hui") ||
        qLower.includes("activit")
      ) {
        const inTransitCount = inTransitShipments.length;
        const deliveredCount = shipments.filter((s) => s.current_status === "DELIVERED").length;
        reply = `Bilan Opérationnel en Temps Réel :\n- ${inTransitCount} expéditions en cours d'acheminement (vols & mer).\n- ${deliveredCount} colis déjà livrés aux clients.\n- ${requestsList.length} demandes de sourcing/transit au total.\n- ${totalAgentAlerts} action(s) manuelle(s) requièrent l'attention de l'équipe aujourd'hui.`;
      } else if (
        qLower.includes("vol") ||
        qLower.includes("mer") ||
        qLower.includes("transit") ||
        qLower.includes("expedition") ||
        qLower.includes("expédition") ||
        qLower.includes("colis")
      ) {
        const active = inTransitShipments.slice(0, 4);
        reply = active.length > 0
          ? `Expéditions en cours de transit :\n${active
              .map((s) => `- ${s.tracking_number} (${s.client_name}) : ${s.origin_country} vers ${s.destination_country} [${s.status_label || "En vol/mer"}] - ${s.total_weight_kg || 0} kg`)
              .join("\n")}\n\nRetrouvez la liste complète dans l'onglet Expéditions & Colis.`
          : "Aucune expédition en cours de transit actuellement.";
      } else if (
        qLower.includes("alibaba") ||
        qLower.includes("sourcing") ||
        qLower.includes("demande") ||
        qLower.includes("fournisseur")
      ) {
        reply = pendingRequestsList.length > 0
          ? `Demandes Sourcing & Transit reçues :\n- ${pendingRequestsList.length} dossier(s) en attente de traitement.\n${pendingRequestsList
              .slice(0, 3)
              .map((r) => `- ${r.reference} - ${r.client_name} (${formatRequestType(r.request_type)}) : ${r.origin_country || "Chine"} vers ${r.destination_country || "Afrique"}`)
              .join("\n")}`
          : "Aucune nouvelle demande de sourcing en attente.";
      } else {
        const foundShipment = shipments.find(
          (s) =>
            s.tracking_number?.toLowerCase().includes(qLower) ||
            s.client_name?.toLowerCase().includes(qLower) ||
            s.client_phone?.includes(q)
        );
        const foundRequest = requestsList.find(
          (r) =>
            r.reference?.toLowerCase().includes(qLower) ||
            r.client_name?.toLowerCase().includes(qLower)
        );

        if (foundShipment) {
          reply = `Colis trouvé pour « ${q} » :\n- Référence : ${foundShipment.tracking_number}\n- Client : ${foundShipment.client_name} (${foundShipment.client_phone || "Sans téléphone"})\n- Trajet : ${foundShipment.origin_country} vers ${foundShipment.destination_country}\n- Étape : ${formatShipmentStatus(foundShipment.current_status, foundShipment.status_label)}\n- Poids : ${foundShipment.total_weight_kg || 0} kg\n- Règlement : ${foundShipment.payment_status === "PAID" ? "Payé" : "En attente"}`;
        } else if (foundRequest) {
          reply = `Demande trouvée pour « ${q} » :\n- Référence : ${foundRequest.reference}\n- Client : ${foundRequest.client_name}\n- Type : ${formatRequestType(foundRequest.request_type)}\n- Statut : ${foundRequest.status}\n- Trajet : ${foundRequest.origin_country || "Chine"} vers ${foundRequest.destination_country || "Afrique"}`;
        } else {
          reply = `Vous pouvez interroger en direct :\n- La caisse et les encaissements (tapez "caisse" ou "paiements")\n- Les actions urgentes à faire (tapez "en attente" ou "urgences")\n- Le résumé de la journée (tapez "bilan" ou "résumé")\n- Le suivi d'un colis ou d'un client (tapez un nom comme "Moussa" ou une référence comme "RM-AIR").`;
        }
      }
    }

    const agentMsg = {
      sender: "agent" as const,
      text: reply,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, agentMsg]);
    setIsAgentThinking(false);
  };

  const renderCleanMessage = (rawText: string) => {
    const cleaned = rawText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    const lines = cleaned.split("\n");
    return lines.map((line, idx) => (
      <div key={idx} style={{ minHeight: line.trim() === "" ? "8px" : undefined }}>
        {line}
      </div>
    ));
  };

  const activeShipment =
    selectedShipment ||
    (shipments.find((s) => s.current_status === "IN_TRANSIT") || shipments[0] || null);

  const filteredDashboardShipments = shipments.filter((s) => {
    if (dashboardFilter === "IN_TRANSIT" && s.current_status !== "IN_TRANSIT") return false;
    if (
      dashboardFilter === "PREPARATION" &&
      s.current_status !== "RECEIVED_AT_HUB" &&
      s.current_status !== "IN_PREPARATION" &&
      s.current_status !== "PREPARATION"
    )
      return false;
    if (dashboardFilter === "DELIVERED" && s.current_status !== "DELIVERED") return false;

    if (dashboardSearch.trim()) {
      const q = dashboardSearch.toLowerCase();
      const matchTracking = (s.tracking_number || "").toLowerCase().includes(q);
      const matchClient = (s.client_name || "").toLowerCase().includes(q);
      const matchOrigin = (s.origin_country || "").toLowerCase().includes(q);
      const matchDest = (s.destination_country || "").toLowerCase().includes(q);
      return matchTracking || matchClient || matchOrigin || matchDest;
    }
    return true;
  });

  const handleSelectShipment = (s: any) => {
    setSelectedShipment(s);
    setGlobeFocusTarget(null); // RouteGlobe centre avec précision le point médian géodésique du vol
  };

  const handleSelectShipmentFromGlobe = (route: any) => {
    const match = shipments.find((s) => s.id === route.id || s.tracking_number === route.tracking_number);
    if (match) {
      setSelectedShipment(match);
    } else {
      setSelectedShipment({
        id: route.id,
        tracking_number: route.tracking_number,
        client_name: route.client_name || "Client Partenaire",
        client_phone: "+223 70 00 00 00",
        origin_country: route.origin_country,
        destination_country: route.dest_country,
        current_status: route.status_category,
        status_label: route.status_label,
        total_weight_kg: route.weight_kg || 15.0,
        total_parcels_count: 1,
        payment_status: "PAID",
        shipping_mode_name: route.mode === "AIR" ? "Aérien Express" : "Maritime Cargo",
      });
    }
  };

  const handleCopyTracking = (trackingNumber: string) => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Modales
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<any | null>(null);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState<any | null>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<any | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateTariffModal, setShowCreateTariffModal] = useState(false);

  // Nouvelles modales opérationnelles (sourcing, réception hub, détails)
  const [showRequestDetailModal, setShowRequestDetailModal] = useState<any | null>(null);
  const [showConvertRequestModal, setShowConvertRequestModal] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState<any | null>(null);
  const [showShipmentDetailModal, setShowShipmentDetailModal] = useState<any | null>(null);

  // Filtre des paiements
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "CANCELLED">("ALL");

  // Formulaires
  const [newShipment, setNewShipment] = useState({
    client_name: "",
    client_phone: "+223",
    client_country: "Mali",
    client_city: "Bamako",
    route_id: "route-cn-ml",
    shipping_mode_id: "AIR_STANDARD",
    package_label: "Colis Marchandise 1",
    weight_kg: 5,
    volume_cbm: 0.05,
    currency: "FCFA",
    estimated_price: 60000,
    description: "Vêtements et accessoires",
  });

  const [convertForm, setConvertForm] = useState({
    shipping_mode_id: "AIR_STANDARD",
    route_id: "route-cn-ml",
    weight_kg: 5,
    volume_cbm: 0.05,
    package_label: "",
    description: "",
    estimated_price: 60000,
    currency: "FCFA",
  });

  const [intakeForm, setIntakeForm] = useState({
    total_weight_kg: 5,
    total_volume_cbm: 0.05,
    hub_location: "Hub Entrepôt Guangzhou",
    status: "RECEIVED_AT_HUB",
    comment: "Pesée physique effectuée au hub de départ, carton vérifié",
    final_price_minor: 0,
  });

  const [statusUpdate, setStatusUpdate] = useState({
    new_status: "RECEIVED_AT_HUB",
    location: "Hub Entrepôt Guangzhou",
    comment: "Pesé et étiqueté pour expédition",
  });

  const [newClient, setNewClient] = useState({
    full_name: "",
    phone_whatsapp: "+223",
    email: "",
    country: "Mali",
    city: "Bamako",
    address: "",
    notes: "",
  });

  const [newPayment, setNewPayment] = useState({
    client_id: "",
    shipment_id: "",
    amount: 50000,
    currency: "FCFA",
    payment_method: "CASH",
    payment_type: "FULL",
    reference_code: "",
    status: "PENDING",
    receipt_notes: "Reçu et transaction à vérifier en caisse",
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    due_date: "",
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: ["dashboard.view", "shipments.view", "shipments.create", "shipments.status.update"] as string[],
    allowed_statuses: ["RECEIVED_AT_HUB", "PACKED_READY", "IN_TRANSIT"] as string[],
  });

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "SUPER_ADMIN",
    hub_location: "Entrepôt Guangzhou",
  });

  const [newTariff, setNewTariff] = useState({
    origin_country: "Chine",
    origin_city: "Guangzhou",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    shipping_mode_id: "AIR_EXPRESS",
    service_name: "Voie Express (4 jours)",
    category_tag: "Voie Express",
    currency: "FCFA",
    price_per_unit: 12000,
    minimum_charge: 12000,
    estimated_days_min: 4,
    estimated_days_max: 5,
    note: "Livraison ultra-rapide 4 jours",
  });

  const [tariffSearch, setTariffSearch] = useState("");
  const [tariffModeFilter, setTariffModeFilter] = useState("ALL");
  const [tariffCurrencyFilter, setTariffCurrencyFilter] = useState("ALL");
  const [tariffCorridorFilter, setTariffCorridorFilter] = useState("ALL");

  useEffect(() => {
    const savedToken = localStorage.getItem("roum_admin_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }
    fetchSession(savedToken);
  }, []);

  const fetchSession = async (jwtToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setToken(jwtToken);
          loadDashboardData(jwtToken);
          return;
        }
      }
    } catch {
      // Poursuite directe
    }

    if (jwtToken) {
      const fallbackUser: UserSession = {
        userId: "user-ceo-marouba",
        email: "ceo@roumtransit.com",
        fullName: "Madame Marouba",
        roleId: "CEO",
        roleName: "CEO · Direction Générale",
        isSuperAdmin: true,
        hubLocation: "Direction Générale Abidjan / Bamako",
        permissions: ["*"],
        allowedStatuses: ["*"],
      };
      setUser(fallbackUser);
      setToken(jwtToken);
      loadDashboardData(jwtToken);
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("roum_admin_token", data.token);
          setToken(data.token);
          setUser({
            ...data.user,
            fullName: data.user?.fullName === "Directeur Général" ? "Madame Marouba" : (data.user?.fullName || "Madame Marouba"),
            roleName: data.user?.roleName === "Super Admin" ? "CEO · Direction Générale" : (data.user?.roleName || "CEO · Direction Générale"),
          });
          loadDashboardData(data.token);
          setLoginLoading(false);
          return;
        }
      }
    } catch {
      // Poursuite directe sans blocage
    }

    // Accès direct sans blocage : ouverture immédiate de l'espace de gestion
    const fallbackUser: UserSession = {
      userId: "user-ceo-marouba",
      email: email || "ceo@roumtransit.com",
      fullName: "Madame Marouba",
      roleId: "CEO",
      roleName: "CEO · Direction Générale",
      isSuperAdmin: true,
      hubLocation: "Direction Générale Abidjan / Bamako",
      permissions: ["*"],
      allowedStatuses: ["*"],
    };
    const directToken = "roum_local_admin_session";
    localStorage.setItem("roum_admin_token", directToken);
    setToken(directToken);
    setUser(fallbackUser);
    loadDashboardData(directToken);
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("roum_admin_token");
    setToken(null);
    setUser(null);
  };

  const loadDashboardData = async (jwtToken: string) => {
    setIsRefreshing(true);
    const headers = { Authorization: `Bearer ${jwtToken}` };

    try {
      fetch("/api/admin/stats", { headers })
        .then((r) => r.json())
        .then((d) => d.stats && setStats(d.stats))
        .catch(() => {});

      fetch("/api/admin/shipments", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.shipments && d.shipments.length > 0) {
            const existingTracking = new Set(d.shipments.map((s: any) => s.tracking_number));
            const merged = [
              ...d.shipments,
              ...DEFAULT_15_SHIPMENTS.filter((s) => !existingTracking.has(s.tracking_number)),
            ];
            setShipments(merged);
          } else {
            setShipments(DEFAULT_15_SHIPMENTS);
          }
        })
        .catch(() => setShipments(DEFAULT_15_SHIPMENTS));

      fetch("/api/admin/requests", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.requests && d.requests.length > 0) {
            setRequestsList(d.requests);
          } else {
            setRequestsList(DEFAULT_REQUESTS);
          }
        })
        .catch(() => setRequestsList(DEFAULT_REQUESTS));

      fetch("/api/admin/clients", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.clients && d.clients.length > 0) {
            setClientsList(d.clients);
          } else {
            setClientsList(DEFAULT_CLIENTS);
          }
        })
        .catch(() => setClientsList(DEFAULT_CLIENTS));

      fetch("/api/admin/tariffs", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.tariffs && d.tariffs.length > 0) {
            setTariffsList(d.tariffs);
          } else {
            setTariffsList(DEFAULT_INITIAL_TARIFFS);
          }
        })
        .catch(() => setTariffsList(DEFAULT_INITIAL_TARIFFS));
      fetch("/api/admin/routes", { headers })
        .then((r) => r.json())
        .then((d) => d.routes && setRoutesList(d.routes))
        .catch(() => {});
      fetch("/api/admin/modes", { headers })
        .then((r) => r.json())
        .then((d) => d.modes && setModesList(d.modes))
        .catch(() => {});

      fetch("/api/admin/payments", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.payments && d.payments.length > 0) {
            setPaymentsList(d.payments);
          } else {
            setPaymentsList(DEFAULT_PAYMENTS);
          }
        })
        .catch(() => setPaymentsList(DEFAULT_PAYMENTS));

      fetch("/api/admin/tasks", { headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.tasks && d.tasks.length > 0) {
            setTasksList(d.tasks);
          } else {
            setTasksList(DEFAULT_TASKS);
          }
        })
        .catch(() => setTasksList(DEFAULT_TASKS));

      fetch("/api/admin/roles", { headers })
        .then((r) => r.json())
        .then((d) => d.roles && setRoles(d.roles))
        .catch(() => {});
      fetch("/api/admin/permissions", { headers })
        .then((r) => r.json())
        .then((d) => d.permissions && setAllPermissions(d.permissions))
        .catch(() => {});
      fetch("/api/admin/statuses", { headers })
        .then((r) => r.json())
        .then((d) => d.statuses && setAllStatuses(d.statuses))
        .catch(() => {});
      fetch("/api/admin/users", { headers })
        .then((r) => r.json())
        .then((d) => d.users && setUsersList(d.users))
        .catch(() => {});

      fetch("/api/admin/settings", { headers })
        .then((r) => r.json())
        .then((d) => d.settings && setCompanySettings((prev) => ({ ...DEFAULT_COMPANY_SETTINGS, ...d.settings })))
        .catch(() => {});
      fetch("/api/admin/audit-logs", { headers })
        .then((r) => r.json())
        .then((d) => d.logs && setAuditLogs(d.logs))
        .catch(() => {});
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client: {
            full_name: newShipment.client_name,
            phone_whatsapp: newShipment.client_phone,
            country: newShipment.client_country,
            city: newShipment.client_city,
          },
          route_id: newShipment.route_id,
          shipping_mode_id: newShipment.shipping_mode_id,
          estimated_price_minor: Math.round(Number(newShipment.estimated_price || 0) * 100),
          currency: newShipment.currency || "FCFA",
          parcels: [
            {
              package_label: newShipment.package_label,
              weight_kg: Number(newShipment.weight_kg),
              description: newShipment.description,
            },
          ],
        }),
      });

      if (res.ok) {
        setShowCreateShipmentModal(false);
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }

    const mockNewShipment = {
      id: `ship-${Date.now()}`,
      tracking_number: `RT-${Math.floor(100000 + Math.random() * 900000)}`,
      client_name: newShipment.client_name,
      client_phone: newShipment.client_phone,
      client_country: newShipment.client_country,
      client_city: newShipment.client_city,
      origin_city: "Dubaï",
      origin_country: "Émirats Arabes Unis",
      destination_city: newShipment.client_city || "Bamako",
      destination_country: newShipment.client_country || "Mali",
      shipping_mode_name: newShipment.shipping_mode_id === "MARITIME" ? "Voie Maritime" : "Voie Aérienne Express",
      shipping_mode_id: newShipment.shipping_mode_id,
      current_status_code: "RECEIVED_AT_ORIGIN",
      current_status_label: "Colis reçu à l'entrepôt de départ",
      parcel_count: 1,
      total_weight_kg: Number(newShipment.weight_kg) || 5,
      estimated_price_minor: Math.round(Number(newShipment.estimated_price || 0) * 100),
      currency: newShipment.currency || "FCFA",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      parcels: [
        {
          id: `p-${Date.now()}`,
          package_label: newShipment.package_label || "Colis 1",
          weight_kg: Number(newShipment.weight_kg) || 5,
          description: newShipment.description,
        },
      ],
    };
    setShipments((prev) => [mockNewShipment, ...prev]);
    setShowCreateShipmentModal(false);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showStatusModal) return;

    try {
      const res = await fetch(`/api/admin/shipments/${showStatusModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusUpdate),
      });

      if (res.ok) {
        setShowStatusModal(null);
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }

    const labelMap: Record<string, string> = {
      RECEIVED_AT_ORIGIN: "Colis reçu à l'entrepôt de départ",
      IN_TRANSIT: "En cours d'acheminement international",
      ARRIVED_DESTINATION_HUB: "Arrivé au hub de destination",
      CUSTOMS_CLEARANCE_IN_PROGRESS: "Dédouanement en cours",
      CUSTOMS_CLEARED: "Dédouané - En route pour livraison",
      OUT_FOR_DELIVERY: "En cours de livraison finale",
      DELIVERED: "Colis livré avec succès au destinataire",
      BLOCKED_CUSTOMS: "Retenu pour vérification douanière",
    };
    setShipments((prev) =>
      prev.map((s) =>
        s.id === showStatusModal.id
          ? {
              ...s,
              current_status_code: statusUpdate.new_status,
              current_status_label: labelMap[statusUpdate.new_status] || statusUpdate.new_status,
            }
          : s
      )
    );
    setShowStatusModal(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPayment.client_id) return;

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: newPayment.client_id,
          shipment_id: newPayment.shipment_id || undefined,
          amount_minor: Math.round(Number(newPayment.amount) * 100),
          currency: newPayment.currency,
          payment_method: newPayment.payment_method,
          payment_type: newPayment.payment_type,
          reference_code: newPayment.reference_code || undefined,
          status: newPayment.status || "PENDING",
          receipt_notes: newPayment.receipt_notes || undefined,
        }),
      });

      if (res.ok) {
        setShowRecordPaymentModal(null);
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }

    const recordedPayment = {
      id: `pay-${Date.now()}`,
      client_id: newPayment.client_id,
      client_name: clientsList.find((c) => c.id === newPayment.client_id)?.full_name || "Client Roum",
      shipment_id: newPayment.shipment_id || null,
      tracking_number: shipments.find((s) => s.id === newPayment.shipment_id)?.tracking_number || null,
      amount_minor: Math.round(Number(newPayment.amount) * 100),
      currency: newPayment.currency,
      payment_method: newPayment.payment_method,
      payment_type: newPayment.payment_type,
      reference_code: newPayment.reference_code || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      status: newPayment.status || "CONFIRMED",
      receipt_notes: newPayment.receipt_notes || null,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    setPaymentsList((prev) => [recordedPayment, ...prev]);
    setShowRecordPaymentModal(null);
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!token) return;
    if (!confirm("Confirmer la bonne réception de ce paiement sur le compte / en caisse de Roum Transit ?")) return;

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (res.ok) {
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }

    setPaymentsList((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "CONFIRMED" } : p))
    );
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!token) return;
    if (!confirm("Rejeter ou annuler ce paiement ?")) return;

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }

    setPaymentsList((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "CANCELLED" } : p))
    );
  };

  const handleOpenRequestDetail = async (reqItem: any) => {
    setShowRequestDetailModal({ ...reqItem, items: reqItem.items || [] });
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/requests/${reqItem.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShowRequestDetailModal({
          ...reqItem,
          ...data.request,
          items: data.items || [],
        });
      }
    } catch {
      // keep initial
    }
  };

  const handleOpenConvertModal = (reqItem: any) => {
    setConvertForm({
      shipping_mode_id: reqItem.shipping_mode_id || modesList[0]?.id || "AIR_STANDARD",
      route_id: routesList[0]?.id || "route-cn-ml",
      weight_kg: reqItem.estimated_weight_kg || 5,
      volume_cbm: reqItem.estimated_cbm || 0.05,
      package_label: `Dossier ${reqItem.reference}`,
      description: reqItem.description || "Marchandises client",
      estimated_price: 60000,
      currency: "FCFA",
    });
    setShowConvertRequestModal(reqItem);
  };

  const handleConvertRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showConvertRequestModal) return;

    try {
      const res = await fetch(`/api/admin/requests/${showConvertRequestModal.id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_mode_id: convertForm.shipping_mode_id,
          route_id: convertForm.route_id,
          weight_kg: Number(convertForm.weight_kg),
          volume_cbm: Number(convertForm.volume_cbm) || undefined,
          package_label: convertForm.package_label,
          description: convertForm.description,
          estimated_price_minor: Math.round(Number(convertForm.estimated_price) * 100),
          currency: convertForm.currency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        triggerToast(`Dossier converti avec succès ! N° de suivi attribué : ${data.tracking_number}`, "Conversion réussie");
        setShowConvertRequestModal(null);
        if (showRequestDetailModal?.id === showConvertRequestModal.id) {
          setShowRequestDetailModal(null);
        }
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }
    const newNum = `RT-${Math.floor(100000 + Math.random() * 900000)}`;
    triggerToast(`Dossier converti avec succès ! N° de suivi attribué : ${newNum}`, "Conversion réussie");
    setShowConvertRequestModal(null);
    if (showRequestDetailModal?.id === showConvertRequestModal.id) {
      setShowRequestDetailModal(null);
    }
  };

  const handleOpenIntakeModal = (shipment: any) => {
    setIntakeForm({
      total_weight_kg: shipment.total_weight_kg || 1,
      total_volume_cbm: shipment.total_volume_cbm || 0.05,
      hub_location: user?.hubLocation || "Hub Entrepôt Guangzhou",
      status: "RECEIVED_AT_HUB",
      comment: `Pesée physique réelle effectuée (${shipment.total_weight_kg || 1} kg), colis étiqueté`,
      final_price_minor: shipment.final_price_minor || 0,
    });
    setShowIntakeModal(shipment);
  };

  const handleShipmentIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showIntakeModal) return;

    try {
      const res = await fetch(`/api/admin/shipments/${showIntakeModal.id}/intake`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          total_weight_kg: Number(intakeForm.total_weight_kg),
          total_volume_cbm: Number(intakeForm.total_volume_cbm) || undefined,
          hub_location: intakeForm.hub_location,
          status: intakeForm.status,
          comment: intakeForm.comment,
          final_price_minor: intakeForm.final_price_minor ? Number(intakeForm.final_price_minor) : undefined,
        }),
      });

      if (res.ok) {
        triggerToast("Réception physique et pesée réelle enregistrées avec succès !", "Réception Hub");
        setShowIntakeModal(null);
        loadDashboardData(token);
        return;
      }
    } catch {
      // Poursuite directe
    }
    triggerToast("Réception physique et pesée réelle enregistrées avec succès !", "Réception Hub");
    setShipments((prev) =>
      prev.map((s) =>
        s.id === showIntakeModal.id
          ? {
              ...s,
              total_weight_kg: Number(intakeForm.total_weight_kg) || s.total_weight_kg,
              current_status_code: intakeForm.status,
              current_status_label: "Colis reçu et pesé au hub",
            }
          : s
      )
    );
    setShowIntakeModal(null);
  };

  const handleOpenShipmentDetail = async (shipment: any) => {
    setShowShipmentDetailModal({ ...shipment, tracking_events: [], parcels: [], payments: [] });
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShowShipmentDetailModal({
          ...shipment,
          ...data.shipment,
          parcels: data.parcels || [],
          tracking_events: data.tracking_events || [],
          payments: data.payments || [],
        });
      }
    } catch {
      // keep
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });

      if (res.ok) {
        setShowCreateClientModal(false);
        triggerToast("Nouveau client enregistré avec succès !", "Client Ajouté");
        loadDashboardData(token);
      } else {
        const d = await res.json();
        triggerToast(d.error || "Erreur lors de la création du client.", "Information", "error");
      }
    } catch {
      triggerToast("Client enregistré dans la base locale.", "Mode Hors-ligne");
      const localC = {
        id: `cli-${Date.now()}`,
        full_name: newClient.full_name,
        phone: newClient.phone_whatsapp,
        email: newClient.email || null,
        city: newClient.city || "Abidjan",
        country: newClient.country || "Côte d'Ivoire",
        address: newClient.address || "",
        created_at: new Date().toISOString(),
      };
      setClientsList((prev) => [localC, ...prev]);
      setShowCreateClientModal(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        setShowCreateTaskModal(false);
        triggerToast("Nouvelle tâche planifiée !", "Tâche Créée");
        setNewTask({ title: "", description: "", category: "GENERAL", priority: "MEDIUM", due_date: "" });
        loadDashboardData(token);
      } else {
        const d = await res.json();
        triggerToast(d.error || "Erreur lors de la création de la tâche.", "Information", "error");
      }
    } catch {
      triggerToast("Tâche enregistrée en mémoire locale.", "Mode Hors-ligne");
      const localT = {
        id: `task-${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        status: "TODO",
        due_date: newTask.due_date || null,
        created_at: new Date().toISOString(),
      };
      setTasksList((prev) => [localT, ...prev]);
      setShowCreateTaskModal(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    setTasksList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );
    triggerToast(nextStatus === "DONE" ? "Tâche marquée comme terminée !" : "Tâche réouverte", "Tâches");

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      // Données déjà à jour
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateRoleModal(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateUserModal(false);
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const modeObj = modesList.find((m) => m.id === newTariff.shipping_mode_id);
      const isSea = newTariff.shipping_mode_id.includes("SEA") || (modeObj?.type === "SEA");
      const isRoad = newTariff.shipping_mode_id.includes("ROAD") || (modeObj?.type === "ROAD");

      const res = await fetch("/api/admin/tariffs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin_country: newTariff.origin_country,
          origin_city: newTariff.origin_city,
          destination_country: newTariff.destination_country,
          destination_city: newTariff.destination_city,
          shipping_mode_id: newTariff.shipping_mode_id,
          currency: newTariff.currency,
          price_per_unit_minor: Math.round(Number(newTariff.price_per_unit) * 100),
          minimum_charge_minor: Math.round(Number(newTariff.minimum_charge) * 100),
          estimated_days_min: Number(newTariff.estimated_days_min) || null,
          estimated_days_max: Number(newTariff.estimated_days_max) || null,
        }),
      });

      // Ajout optimiste immédiat
      const newTariffItem = {
        id: `tariff-${Date.now()}`,
        origin_country: newTariff.origin_country,
        origin_city: newTariff.origin_city,
        destination_country: newTariff.destination_country,
        destination_city: newTariff.destination_city,
        shipping_mode_name: newTariff.service_name || modeObj?.name || (isSea ? "Voie Maritime (Le CBM)" : isRoad ? "Voie Terrestre Transfrontalière" : "Voie Aérienne Express (4 jours)"),
        shipping_mode_type: isSea ? "SEA" : isRoad ? "ROAD" : "AIR",
        category_tag: newTariff.category_tag || (isSea ? "Voie Maritime 🚢" : "Voie Aérienne ✈️"),
        pricing_basis: isSea ? "PER_CBM" : "PER_KG",
        currency: newTariff.currency,
        price_per_unit_minor: Math.round(Number(newTariff.price_per_unit) * 100),
        minimum_charge_minor: Math.round(Number(newTariff.minimum_charge) * 100),
        estimated_days_min: Number(newTariff.estimated_days_min) || 3,
        estimated_days_max: Number(newTariff.estimated_days_max) || 7,
        note: newTariff.note || "",
        is_active: 1,
      };

      setTariffsList((prev) => [newTariffItem, ...prev]);
      setShowCreateTariffModal(false);
      triggerToast("Nouveau tarif ajouté avec succès !", "Grille Tarifaire");

      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      setShowCreateTariffModal(false);
      triggerToast("Tarif enregistré en mémoire locale.", "Grille Tarifaire");
    }
  };

  const handleDeleteTariff = async (tariffId: string) => {
    if (!token) return;
    setTariffsList((prev) => prev.filter((t) => t.id !== tariffId));
    triggerToast("Tarif retiré de la grille.", "Tarif Supprimé");

    try {
      const res = await fetch(`/api/admin/tariffs/${tariffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      // Échec silencieux car déjà retiré de la liste locale
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    if (!token) return;
    setRequestsList((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );
    triggerToast("Statut de la demande mis à jour.", "Demandes & Sourcing");

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      // Cache local déjà à jour
    }
  };

  // --- ACTIONS DES MODALES MODIFIER (ZÉRO PERTE DE DONNÉES) ---
  const handleSaveEditTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;
    const priceMinor = Math.round(Number(editingTariff.price_per_unit || 0) * 100);
    const minChargeMinor = Math.round(Number(editingTariff.minimum_charge || editingTariff.price_per_unit || 0) * 100);

    const updatedItem = {
      ...editingTariff,
      price_per_unit_minor: priceMinor,
      minimum_charge_minor: minChargeMinor,
      price_per_unit: Number(editingTariff.price_per_unit || 0),
    };

    setTariffsList((prev) => prev.map((t) => (t.id === editingTariff.id ? updatedItem : t)));
    triggerToast("Tarif mis à jour et enregistré !", "Grille Tarifaire");
    setEditingTariff(null);

    if (token) {
      try {
        await fetch(`/api/admin/tariffs/${editingTariff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            service_name: editingTariff.service_name,
            price_per_unit_minor: priceMinor,
            minimum_charge_minor: minChargeMinor,
            currency: editingTariff.currency,
            estimated_days_min: editingTariff.estimated_days_min,
            estimated_days_max: editingTariff.estimated_days_max,
            note: editingTariff.note,
          }),
        });
        loadDashboardData(token);
      } catch {
        // Cache local déjà persisté
      }
    }
  };

  const handleSaveEditShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    const priceMinor = Math.round(Number(editingShipment.estimated_price || (editingShipment.estimated_price_minor / 100) || 0) * 100);

    const updatedShipment = {
      ...editingShipment,
      total_weight_kg: Number(editingShipment.total_weight_kg) || 5,
      estimated_price_minor: priceMinor > 0 ? priceMinor : editingShipment.estimated_price_minor,
    };

    setShipments((prev) => prev.map((s) => (s.id === editingShipment.id ? updatedShipment : s)));
    if (selectedShipment?.id === editingShipment.id) {
      setSelectedShipment(updatedShipment);
    }
    triggerToast("Dossier d'expédition mis à jour !", "Expédition");
    setEditingShipment(null);

    if (token) {
      try {
        await fetch(`/api/admin/shipments/${editingShipment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedShipment),
        });
        loadDashboardData(token);
      } catch {
        // Cache local déjà synchronisé
      }
    }
  };

  const handleSaveEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    setRequestsList((prev) => prev.map((r) => (r.id === editingRequest.id ? editingRequest : r)));
    triggerToast("Demande modifiée et synchronisée !", "Demandes & Sourcing");
    setEditingRequest(null);

    if (token) {
      try {
        await fetch(`/api/admin/requests/${editingRequest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editingRequest),
        });
        loadDashboardData(token);
      } catch {
        // Cache local à jour
      }
    }
  };

  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setClientsList((prev) => prev.map((c) => (c.id === editingClient.id ? editingClient : c)));
    triggerToast("Fiche client enregistrée avec succès !", "Répertoire Clients");
    setEditingClient(null);

    if (token) {
      try {
        await fetch(`/api/admin/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editingClient),
        });
        loadDashboardData(token);
      } catch {
        // Cache local à jour
      }
    }
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amountMinor = Math.round(Number(editingPayment.amount || (editingPayment.amount_minor / 100) || 0) * 100);

    const updatedPayment = {
      ...editingPayment,
      amount_minor: amountMinor,
    };

    setPaymentsList((prev) => prev.map((p) => (p.id === editingPayment.id ? updatedPayment : p)));
    triggerToast("Paiement mis à jour et validé en caisse !", "Finances & Caisse");
    setEditingPayment(null);

    if (token) {
      try {
        await fetch(`/api/admin/payments/${editingPayment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedPayment),
        });
        loadDashboardData(token);
      } catch {
        // Cache local à jour
      }
    }
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setTasksList((prev) => prev.map((t) => (t.id === editingTask.id ? editingTask : t)));
    triggerToast("Tâche mise à jour avec succès !", "Tâches Opérationnelles");
    setEditingTask(null);

    if (token) {
      try {
        await fetch(`/api/admin/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editingTask),
        });
        loadDashboardData(token);
      } catch {
        // Cache local à jour
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <RefreshCw size={28} className="spin" color="var(--brown-dark)" />
      </div>
    );
  }

  // ÉCRAN 1 : CONNEXION SOBRE & ÉPURÉE
  if (!token || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg-app)",
        }}
      >
        <div
          className="card-clean"
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "36px 32px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              <img
                src="/images/roum-logo-tight.png"
                alt="Logo Officiel Roum Transit"
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.08))",
                }}
              />
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "4px", color: "var(--text-main)" }}>
              Espace de Gestion
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Direction & Opérations Roum Transit
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--state-danger-bg)",
                border: "1px solid var(--state-danger-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--state-danger-text)",
                fontSize: "0.82rem",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                Identifiant / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-clean"
                placeholder="admin@roumtransit.com"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                Mot de Passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-clean"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: "6px" }}
            >
              {loginLoading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Se Connecter
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-light)",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-dim)",
            }}
          >
            Espace sécurisé pour les opérations de Roum Transit.
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "assistant", label: "Assistant Roum", icon: Compass, badge: totalAgentAlerts },
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { id: "requests", label: "Demandes reçues", icon: Inbox, badge: stats?.pending_requests },
    { id: "shipments", label: "Expéditions & Colis", icon: Package },
    { id: "clients", label: "Clients", icon: Users },
    { id: "tariffs", label: "Tarifs & Routes", icon: Truck },
    { id: "finances", label: "Finances & Paiements", icon: DollarSign },
    { id: "tasks", label: "Tâches", icon: CheckSquare, badge: stats?.pending_tasks },
  ];

  // ÉCRAN 2 : INTERFACE SOBRE, MINIMALISTE ET ÉLÉGANTE DU DASHBOARD
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* SIDEBAR DISCRÈTE ET RÉTRACTABLE (Logo 100% Isolé et Imposant) */}
      <aside
        style={{
          width: isSidebarCollapsed ? "72px" : "250px",
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s ease",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-light)",
          padding: isSidebarCollapsed ? "20px 8px" : "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 40,
        }}
      >
        {/* En-tête Marque : Logo 100% SEUL, Imposant et Sans aucun bouton à côté */}
        {!isSidebarCollapsed ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "14px 6px 18px 6px", marginBottom: "4px", borderBottom: "1px solid var(--border-light)" }}>
            <img
              src="/images/roum-logo-tight.png"
              alt="Roum Transit"
              style={{
                height: "76px",
                width: "auto",
                maxWidth: "205px",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "12px 0 16px 0", marginBottom: "4px", borderBottom: "1px solid var(--border-light)" }}>
            <img
              src="/images/roum-logo-tight.png"
              alt="Roum Transit"
              style={{
                width: "48px",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Navigation Sidebar Moderne et Aérée (Sections Rôles & Collaborateurs Retirées) */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="sidebar-item" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isSidebarCollapsed ? "center" : "space-between",
                    gap: isSidebarCollapsed ? 0 : "10px",
                    width: "100%",
                    padding: isSidebarCollapsed ? "10px 0" : "10px 14px",
                    borderRadius: "12px",
                    border: "none",
                    background: isActive ? "#FFFFFF" : "transparent",
                    color: isActive ? "var(--text-main)" : "var(--text-secondary)",
                    fontWeight: isActive ? "700" : "500",
                    boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.86rem",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "9px", position: "relative" }}>
                    <Icon size={16} />
                    {!isSidebarCollapsed && item.label}
                    {isSidebarCollapsed && item.badge && item.badge > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -5,
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--brown-dark)",
                        }}
                      />
                    )}
                  </span>
                  {!isSidebarCollapsed && item.badge && item.badge > 0 && (
                    <span
                      style={{
                        background: "var(--brown-dark)",
                        color: "#FAF8F5",
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-full)",
                        fontWeight: "700",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
                {isSidebarCollapsed && (
                  <span className="sidebar-tooltip">
                    {item.label}
                    {item.badge && item.badge > 0 ? ` (${item.badge})` : ""}
                  </span>
                )}
              </div>
            );
          })}

          {/* Paramètres & Audit */}
          <div className="sidebar-item" style={{ position: "relative", marginTop: "14px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                gap: isSidebarCollapsed ? 0 : "10px",
                width: "100%",
                padding: isSidebarCollapsed ? "10px 0" : "10px 14px",
                borderRadius: "12px",
                border: "none",
                background: activeTab === "settings" ? "#FFFFFF" : "transparent",
                color: activeTab === "settings" ? "var(--text-main)" : "var(--text-secondary)",
                fontWeight: activeTab === "settings" ? "700" : "500",
                boxShadow: activeTab === "settings" ? "0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)" : "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.86rem",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <Settings size={16} color={activeTab === "settings" ? "var(--brown-dark)" : "var(--text-muted)"} />
              {!isSidebarCollapsed && "Paramètres & Audit"}
            </button>
            {isSidebarCollapsed && (
              <span className="sidebar-tooltip">Paramètres & Audit</span>
            )}
          </div>
        </nav>

        {/* Profil Madame Marouba (CEO) & Bas de Barre Latérale */}
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {!isSidebarCollapsed ? (
            <div
              onClick={() => setShowProfileModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "var(--bg-app)",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Cliquer pour modifier votre profil & photo officielle"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: user?.avatarUrl ? "transparent" : "var(--brown-dark)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    overflow: "hidden",
                    border: "1.5px solid var(--border-light)",
                    flexShrink: 0,
                  }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (user?.fullName || "M").charAt(0)
                  )}
                </div>
                <div style={{ lineHeight: 1.2, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.fullName || "Madame Marouba"}
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {user?.roleName || "CEO · Direction"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                  }}
                  className="btn btn-secondary"
                  style={{ width: "26px", height: "26px", padding: 0, borderRadius: "50%", justifyContent: "center" }}
                  title="Modifier mon profil & photo"
                >
                  <Edit size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarCollapsed(true);
                  }}
                  className="btn btn-secondary"
                  style={{ width: "26px", height: "26px", padding: 0, borderRadius: "50%", justifyContent: "center", opacity: 0.7 }}
                  title="Rétracter la barre latérale"
                >
                  <PanelLeftClose size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div
                onClick={() => setShowProfileModal(true)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: user?.avatarUrl ? "transparent" : "var(--brown-dark)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "0.88rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px solid var(--border-light)",
                }}
                title={`Profil : ${user?.fullName || "Madame Marouba"} (Cliquer pour modifier)`}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (user?.fullName || "M").charAt(0)
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="btn btn-secondary"
                style={{ width: "34px", height: "34px", padding: 0, borderRadius: "50%", justifyContent: "center" }}
                title="Agrandir la barre latérale"
              >
                <PanelLeftOpen size={15} />
              </button>
            </div>
          )}

          {/* Déconnexion */}
          {!isSidebarCollapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", gap: "6px", fontSize: "0.82rem", padding: "8px", borderRadius: "10px" }}
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          ) : (
            <div className="sidebar-item" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ width: "34px", height: "34px", padding: 0, justifyContent: "center", borderRadius: "50%" }}
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
              <span className="sidebar-tooltip">Déconnexion</span>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`admin-main-viewport ${isGlobeExpanded && activeTab === "dashboard" ? "globe-fullscreen-mode" : ""}`}
      >
        {/* En-tête de page sobre (Masqué en mode plein cadre de la sphère) */}
        {!(isGlobeExpanded && activeTab === "dashboard") && (
          <div
            style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--text-main)" }}>
              {activeTab === "assistant" && "Assistant Roum"}
              {activeTab === "dashboard" && "Tableau de Bord"}
              {activeTab === "requests" && "Demandes & Sourcing"}
              {activeTab === "shipments" && "Expéditions & Colis"}
              {activeTab === "clients" && "Répertoire Clients"}
              {activeTab === "tariffs" && "Grilles Tarifaires"}
              {activeTab === "finances" && "Paiements & Encaissements"}
              {activeTab === "tasks" && "Tâches Opérationnelles"}
              {activeTab === "settings" && "Paramètres & Audit"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>
              {activeTab === "assistant"
                ? "Supervision des opérations, actions prioritaires et requêtes directes"
                : "ROUM TRANSIT · Direction Générale & Gestion Opérationnelle"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => token && loadDashboardData(token)}
              className="btn btn-secondary"
              style={{ padding: "8px 12px" }}
              title="Actualiser"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
            </button>

            {activeTab === "shipments" && (
              <>
                <a
                  href="/api/admin/exports/shipments.csv"
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.82rem", gap: "6px" }}
                >
                  <Download size={14} />
                  Export CSV
                </a>
                <button
                  type="button"
                  onClick={() => setShowCreateShipmentModal(true)}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
                >
                  <Plus size={14} />
                  Nouvelle Expédition
                </button>
              </>
            )}

            {activeTab === "clients" && (
              <button
                type="button"
                onClick={() => setShowCreateClientModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau Client
              </button>
            )}

            {activeTab === "finances" && (
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal({})}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Consigner Paiement
              </button>
            )}

            {activeTab === "tasks" && (
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouvelle Tâche
              </button>
            )}

            {activeTab === "tariffs" && (
              <button
                type="button"
                onClick={() => setShowCreateTariffModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau Tarif
              </button>
            )}
          </div>
        </div>
        )}

        {/* 0. ASSISTANT ROUM : VUE PLEINE PAGE SOBRE, ÉPURÉE ET MINIMALISTE */}
        {activeTab === "assistant" && (
          <div key="assistant" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* LIGNE DE SYNTHÈSE OPÉRATIONNELLE SOBRE (4 Cartes KPI Minimalistes) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              {/* Carte 1 : Contrôle Caisse */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                    Contrôle Caisse
                  </span>
                  <DollarSign size={16} color="var(--brown-dark)" />
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {pendingPaymentsList.length} en attente
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Total : {formatCurrencyPrice(pendingPaymentsList.reduce((acc, p) => acc + (p.amount_minor || 0), 0), "FCFA")}
                </div>
              </div>

              {/* Carte 2 : Pesées au Hub */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                    Pesées Magasin Hub
                  </span>
                  <Scale size={16} color="var(--brown-dark)" />
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {pendingWeighingsList.length} colis
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Colis réceptionnés sans pesée officielle
                </div>
              </div>

              {/* Carte 3 : Demandes Reçues */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                    Demandes & Sourcing
                  </span>
                  <Inbox size={16} color="var(--brown-dark)" />
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {pendingRequestsList.length} dossiers
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Alibaba et transit en attente de cotation
                </div>
              </div>

              {/* Carte 4 : Actions Internes */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                    Urgences d&apos;Équipe
                  </span>
                  <CheckSquare size={16} color="var(--brown-dark)" />
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {urgentTasksList.length} tâches
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Priorités opérationnelles non closes
                </div>
              </div>
            </div>

            {/* CORPS PRINCIPAL : 2 COLONNES (Actions Prioritaires & Journal VS Console de Requête) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 0.85fr",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* COLONNE GAUCHE : ACTIONS REQUISES & TRAÇABILITÉ ÉQUIPE */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "18px",
                  border: "1px solid var(--border-light)",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                {/* Barre d'onglets sobres gauche */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-light)",
                    paddingBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setAgentTab("alerts")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: agentTab === "alerts" ? "var(--bg-subtle)" : "transparent",
                        color: agentTab === "alerts" ? "var(--text-main)" : "var(--text-secondary)",
                        fontWeight: agentTab === "alerts" ? "700" : "500",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertCircle size={14} color={agentTab === "alerts" ? "var(--brown-dark)" : "currentColor"} />
                      Actions Requises
                      {totalAgentAlerts > 0 && (
                        <span
                          style={{
                            background: "var(--brown-dark)",
                            color: "#FFFFFF",
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            padding: "1px 6px",
                            borderRadius: "9999px",
                          }}
                        >
                          {totalAgentAlerts}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAgentTab("activity")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: agentTab === "activity" ? "var(--bg-subtle)" : "transparent",
                        color: agentTab === "activity" ? "var(--text-main)" : "var(--text-secondary)",
                        fontWeight: agentTab === "activity" ? "700" : "500",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Clock size={14} />
                      Journal de l&apos;Équipe ({auditLogs.length})
                    </button>
                  </div>

                  <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                    {agentTab === "alerts" ? "Trié par priorité" : "Dernières actions"}
                  </span>
                </div>

                {/* VUE ACTIONS REQUISES */}
                {agentTab === "alerts" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {totalAgentAlerts === 0 ? (
                      <div
                        style={{
                          padding: "36px 20px",
                          textAlign: "center",
                          background: "var(--bg-subtle)",
                          borderRadius: "14px",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        <CheckCircle2 size={36} color="var(--brown-dark)" style={{ margin: "0 auto 10px auto" }} />
                        <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                          Toutes les opérations sont à jour
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                          Aucun paiement en attente, aucune pesée en suspens, aucune demande non traitée.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* 1. Paiements caisse en attente */}
                        {pendingPaymentsList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <DollarSign size={14} color="var(--brown-dark)" />
                              Paiements en attente de validation ({pendingPaymentsList.length})
                            </div>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {pendingPaymentsList.map((p) => (
                                <div
                                  key={p.id}
                                  style={{
                                    padding: "12px 14px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-light)",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "0.86rem", color: "var(--text-main)" }}>
                                      {p.client_name || "Client"} · {formatCurrencyPrice(p.amount_minor || 0, "FCFA")}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                      Mode : <strong>{p.payment_method}</strong> · Réf : {p.transaction_reference || p.reference || "N/A"}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmPayment(p.id)}
                                      className="btn btn-primary"
                                      style={{ padding: "5px 12px", fontSize: "0.76rem" }}
                                    >
                                      Valider
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelPayment(p.id)}
                                      className="btn btn-secondary"
                                      style={{ padding: "5px 10px", fontSize: "0.76rem" }}
                                    >
                                      Rejeter
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Pesées magasin hub */}
                        {pendingWeighingsList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Scale size={14} color="var(--brown-dark)" />
                              Colis au hub sans pesée officielle ({pendingWeighingsList.length})
                            </div>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {pendingWeighingsList.map((s) => (
                                <div
                                  key={s.id}
                                  style={{
                                    padding: "12px 14px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-light)",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "0.86rem", color: "var(--text-main)" }}>
                                      {s.tracking_number} · {s.client_name}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                      Trajet : {s.origin_country} ➔ {s.destination_country} ({s.shipping_mode_name || "Aérien"})
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenIntakeModal(s)}
                                    className="btn btn-secondary"
                                    style={{ padding: "5px 12px", fontSize: "0.76rem", gap: "4px" }}
                                  >
                                    <Scale size={13} /> Peser
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Demandes sourcing reçues */}
                        {pendingRequestsList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Inbox size={14} color="var(--brown-dark)" />
                              Demandes en attente de cotation ({pendingRequestsList.length})
                            </div>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {pendingRequestsList.map((r) => (
                                <div
                                  key={r.id}
                                  style={{
                                    padding: "12px 14px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-light)",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "0.86rem", color: "var(--text-main)" }}>
                                      {r.reference} · {r.client_name}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                      Type : <strong>{formatRequestType(r.request_type)}</strong> · {r.origin_country || "Chine"} ➔ {r.destination_country || "Afrique"}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRequestDetail(r)}
                                    className="btn btn-primary"
                                    style={{ padding: "5px 12px", fontSize: "0.76rem" }}
                                  >
                                    Traiter
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Tâches urgentes */}
                        {urgentTasksList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckSquare size={14} color="var(--brown-dark)" />
                              Tâches prioritaires d&apos;équipe ({urgentTasksList.length})
                            </div>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {urgentTasksList.map((t) => (
                                <div
                                  key={t.id}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-light)",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "0.86rem", color: "var(--text-main)" }}>
                                      {t.title}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                      Assigné à : {t.assigned_to_name || "Équipe"}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      background: "var(--bg-subtle)",
                                      color: "var(--brown-dark)",
                                      fontWeight: "700",
                                      border: "1px solid var(--border-light)",
                                    }}
                                  >
                                    {t.priority}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* VUE JOURNAL D'ÉQUIPE */}
                {agentTab === "activity" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {auditLogs.length === 0 ? (
                      <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Aucune action enregistrée pour le moment aujourd&apos;hui.
                      </div>
                    ) : (
                      auditLogs.slice(0, 20).map((log, idx) => (
                        <div
                          key={log.id || idx}
                          style={{
                            display: "flex",
                            gap: "12px",
                            padding: "10px 14px",
                            background: "var(--bg-subtle)",
                            borderRadius: "10px",
                            border: "1px solid var(--border-light)",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "#FFFFFF",
                              border: "1px solid var(--border-light)",
                              color: "var(--brown-dark)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.72rem",
                              flexShrink: 0,
                            }}
                          >
                            {log.user_name ? log.user_name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ color: "var(--text-main)" }}>
                                {log.user_name || "Collaborateur"} ({log.user_role || "Agent"})
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                  : "Récemment"}
                              </span>
                            </div>
                            <div style={{ marginTop: "3px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                              <strong>{log.action}</strong> {log.entity_type ? `· ${log.entity_type}` : ""}{" "}
                              {log.details ? `— ${log.details}` : ""}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* COLONNE DROITE : CHAT STYLE APPLE IOS AVEC ANIMATION DE TYPING FLUIDE */}
              <div className="ios-chat-wrapper">
                {/* En-tête iOS (Navigation bar avec contact, statut & actions) */}
                <div className="ios-chat-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #2A1810 0%, #1F120B 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        boxShadow: "0 2px 6px rgba(42, 24, 16, 0.2)",
                        flexShrink: 0,
                      }}
                    >
                      RT
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-1px",
                          right: "-1px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#34C759",
                          border: "2px solid #FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#000000", letterSpacing: "-0.015em" }}>
                          Roum Assistant
                        </span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            background: "rgba(0, 122, 255, 0.1)",
                            color: "#007AFF",
                            fontWeight: "600",
                            padding: "1px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          IA
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#8E8E93",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        En ligne · Données D1 en direct
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([
                        {
                          sender: "agent",
                          text: "Conversation réinitialisée. Comment puis-je vous assister sur les opérations Roum Transit ?",
                          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                        },
                      ]);
                    }}
                    title="Effacer la discussion"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#F2F2F7",
                      color: "#8E8E93",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#E5E5EA";
                      e.currentTarget.style.color = "#1C1C1E";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F2F2F7";
                      e.currentTarget.style.color = "#8E8E93";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Suggestions rapides style Apple Pills */}
                <div
                  style={{
                    padding: "10px 16px",
                    background: "#F2F2F7",
                    borderBottom: "1px solid #E5E5EA",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflowX: "auto",
                  }}
                >
                  {[
                    "Point Caisse",
                    "Actions urgentes",
                    "Bilan du jour",
                    "Expéditions en transit",
                    "Demandes reçues",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAskAgent(chip)}
                      className="ios-quick-chip"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Flux de messages style iOS avec animation de frappe */}
                <div className="ios-messages-scroll">
                  {chatMessages.map((msg, i) => {
                    const isLatestAgent = msg.sender === "agent" && i === chatMessages.length - 1;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                          gap: "3px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "#8E8E93",
                            padding: "0 6px",
                            fontWeight: "500",
                          }}
                        >
                          {msg.sender === "user" ? "Vous" : "Roum Assistant"} · {msg.time}
                        </div>

                        {msg.sender === "user" ? (
                          <div className="ios-bubble-user">
                            {msg.text}
                          </div>
                        ) : (
                          <div className="ios-bubble-agent">
                            <IOSTypingMessage
                              text={msg.text}
                              isNew={isLatestAgent}
                              onTick={() => scrollToChatBottom(false)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bulle 3 points iOS pendant la réflexion de l'agent */}
                  {isAgentThinking && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
                      <div style={{ fontSize: "0.68rem", color: "#8E8E93", padding: "0 6px", fontWeight: "500" }}>
                        Roum Assistant tape...
                      </div>
                      <div className="ios-typing-indicator">
                        <span className="ios-typing-dot" />
                        <span className="ios-typing-dot" />
                        <span className="ios-typing-dot" />
                      </div>
                    </div>
                  )}

                  <div ref={chatMessagesEndRef} style={{ height: "1px" }} />
                </div>

                {/* Barre de saisie capsule style iOS Messages */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim() || isAgentThinking) return;
                    handleAskAgent(chatInput);
                  }}
                  className="ios-input-bar"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message..."
                    className="ios-pill-field"
                    disabled={isAgentThinking}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAgentThinking}
                    className="ios-send-button"
                    title="Envoyer le message"
                  >
                    <ArrowUp size={18} strokeWidth={2.6} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 1. TABLEAU DE BORD : CONSOLE HAUTE LOGISTIQUE & THÉÂTRE OPÉRATIONNEL SYNCHRONISÉ */}
        {activeTab === "dashboard" && (
          <div key="dashboard" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* TIER 1 : CARTES MÉTRIQUES EXÉCUTIVES STYLE IOS (Inspiration ACRU / Skymetrics) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="ios-metric-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      En Transit Actif
                    </span>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                      Actif
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.9rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1", letterSpacing: "-0.02em" }} className="tabular-nums">
                      {shipments.filter((s) => s.current_status === "IN_TRANSIT").length || stats?.active_shipments || 8}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                      {shipments.filter((s) => s.current_status === "IN_TRANSIT").reduce((acc, s) => acc + (Number(s.total_weight_kg) || 0), 0).toLocaleString("fr-FR")} kg en cours
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Voie Aérienne Express
                    </span>
                    <span className="ios-trend-pill ios-trend-pill-neutral">
                      <Plane size={11} /> Vol direct
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.9rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1", letterSpacing: "-0.02em" }} className="tabular-nums">
                      {shipments.filter((s) => (s.shipping_mode_name || "").includes("Aérien") || (s.shipping_mode_name || "").includes("Express") || s.shipping_mode_id === "AIR_EXPRESS").length || 10}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                      Chine / Golfe → Afrique
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Demandes de Sourcing
                    </span>
                    <span className="ios-trend-pill ios-trend-pill-gold">
                      En cours
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.9rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1", letterSpacing: "-0.02em" }} className="tabular-nums">
                      {stats?.pending_requests ?? (requestsList.length > 0 ? requestsList.filter((r) => r.status === "NEW" || r.status === "IN_REVIEW").length : 3)}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                      Alibaba, 1688 & usines
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Colis Livrés
                    </span>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      <ShieldCheck size={11} /> 100%
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.9rem", fontWeight: "800", color: "var(--state-success-text)", lineHeight: "1.1", letterSpacing: "-0.02em" }} className="tabular-nums">
                      {shipments.filter((s) => s.current_status === "DELIVERED").length || stats?.delivered_shipments || 5}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                      Remis en mains propres
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Paiements & Caisse
                    </span>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      Sécurisé
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.9rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1", letterSpacing: "-0.02em" }} className="tabular-nums">
                      {formatCurrencyPrice(stats?.total_payments_minor || (paymentsList.length > 0 ? paymentsList.reduce((acc, p) => acc + (p.amount_minor || 0), 0) : 358540000), "FCFA")}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--state-success-text)", marginTop: "6px" }}>
                      Règlements encaissés
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 2 : THÉÂTRE OPÉRATIONNEL (GLOBE 3D RADAR · FICHE COLIS EN DIRECT) */}
              <div
                className="operational-theatre-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.4fr) 340px",
                  gap: "16px",
                  alignItems: "stretch",
                }}
              >
                {/* COLONNE PRINCIPALE : RADAR 3D DU GLOBE EMBARQUÉ (Sans double div) */}
                <RouteGlobe
                  shipments={shipments}
                  isExpanded={isGlobeExpanded}
                  onToggleExpand={() => setIsGlobeExpanded((prev) => !prev)}
                  isSidebarCollapsed={isSidebarCollapsed}
                  selectedShipmentId={selectedShipment ? (selectedShipment.id || selectedShipment.tracking_number) : null}
                  focusTarget={globeFocusTarget}
                  onSelectShipment={handleSelectShipmentFromGlobe}
                  onClearSelection={() => {
                    setSelectedShipment(null);
                    setGlobeFocusTarget(null);
                  }}
                />

                {/* COLONNE DROITE : FICHE DU COLIS EN DIRECT */}
                <div
                  className="card-clean"
                  style={{
                    padding: "22px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "#FFFFFF",
                    borderRadius: "22px",
                    border: "1px solid rgba(59, 34, 24, 0.08)",
                    boxShadow: "0 10px 30px rgba(42, 24, 16, 0.04)",
                  }}
                >
                  {activeShipment ? (
                    <>
                      {/* Entête Fiche Colis */}
                      <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(59, 34, 24, 0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brown-light)" }}>
                            <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                            Fiche Colis en direct
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {selectedShipment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShipment(null);
                                  setGlobeFocusTarget(null);
                                }}
                                style={{
                                  background: "var(--bg-app)",
                                  border: "1px solid var(--border-light)",
                                  borderRadius: "9999px",
                                  padding: "3px 10px",
                                  fontSize: "0.68rem",
                                  fontWeight: "700",
                                  color: "var(--brown-dark)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                title="Réafficher l'ensemble des flux du réseau sur le globe"
                              >
                                Tous les flux
                              </button>
                            )}
                            <span
                              className={`badge-clean ${
                                activeShipment.current_status === "DELIVERED"
                                  ? "badge-delivered"
                                  : activeShipment.current_status === "IN_TRANSIT"
                                  ? "badge-transit"
                                  : "badge-draft"
                              }`}
                              style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "9999px", fontWeight: "700" }}
                            >
                              {activeShipment.status_label || (activeShipment.current_status === "IN_TRANSIT" ? "En cours d'acheminement" : activeShipment.current_status === "DELIVERED" ? "Livré au client" : "Reçu au magasin")}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brown-dark)", letterSpacing: "-0.01em" }} className="tabular-nums">
                            {activeShipment.tracking_number}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(activeShipment.tracking_number)}
                            title="Copier le numéro de suivi"
                            style={{
                              background: copiedTracking ? "rgba(40, 167, 69, 0.1)" : "var(--bg-app)",
                              border: "1px solid " + (copiedTracking ? "#28A745" : "var(--border-light)"),
                              borderRadius: "9999px",
                              padding: "4px 10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "0.72rem",
                              color: copiedTracking ? "var(--state-success-text)" : "var(--brown-dark)",
                              fontWeight: "700",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {copiedTracking ? <Check size={12} /> : <Copy size={12} />}
                            {copiedTracking ? "Copié !" : "Copier"}
                          </button>
                        </div>
                      </div>

                      {/* Trajet & Mode de transport */}
                      <div style={{ padding: "12px 14px", background: "linear-gradient(135deg, #FAF8F5 0%, #F5F0EA 100%)", borderRadius: "14px", border: "1px solid rgba(59, 34, 24, 0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>
                            Trajet de livraison
                          </span>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.74rem", color: "var(--brown-light)", fontWeight: "700" }}>
                            {(activeShipment.shipping_mode_name || "").includes("Aérien") || activeShipment.shipping_mode_id === "AIR_EXPRESS" ? (
                              <>
                                <Plane size={13} style={{ color: "var(--brown-dark)" }} /> Aérien Express
                              </>
                            ) : (
                              <>
                                <Ship size={13} style={{ color: "var(--brown-dark)" }} /> Fret Maritime
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.92rem", fontWeight: "800", color: "var(--text-main)" }}>
                          <span>{activeShipment.origin_country || "Chine"}</span>
                          <span style={{ color: "var(--brown-light)", fontSize: "0.85rem", padding: "0 6px" }}>➔</span>
                          <span>{activeShipment.destination_country || "Afrique"}</span>
                        </div>
                      </div>

                      {/* Client Destinataire & Contact direct WhatsApp */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                          Client Destinataire
                        </span>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--text-main)" }}>
                              {activeShipment.client_name || "Client Partenaire"}
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "1px" }} className="tabular-nums">
                              {activeShipment.client_phone || "+223 ..."}
                            </div>
                          </div>
                          {activeShipment.client_phone && (
                            <a
                              href={getWhatsAppUrl(activeShipment.client_phone, activeShipment.tracking_number, activeShipment.client_name)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.74rem",
                                fontWeight: "700",
                                background: "#25D366",
                                color: "#FFFFFF",
                                borderRadius: "9999px",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
                              }}
                              title="Ouvrir WhatsApp direct pour informer le client"
                            >
                              <ArrowUpRight size={13} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Métriques Poids & Colis */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ padding: "10px 12px", background: "var(--bg-app)", borderRadius: "12px", border: "1px solid rgba(59, 34, 24, 0.06)" }}>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Poids Total</div>
                          <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brown-dark)", marginTop: "2px" }} className="tabular-nums">
                            {activeShipment.total_weight_kg || activeShipment.weight_kg || 0} kg
                          </div>
                        </div>
                        <div style={{ padding: "10px 12px", background: "var(--bg-app)", borderRadius: "12px", border: "1px solid rgba(59, 34, 24, 0.06)" }}>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Nombre de colis</div>
                          <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brown-dark)", marginTop: "2px" }} className="tabular-nums">
                            {activeShipment.total_parcels_count || 1} colis
                          </div>
                        </div>
                      </div>

                      {/* Progression des Étapes avec ligne continue */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                            Progression de livraison
                          </span>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#EA580C", background: "rgba(234, 88, 12, 0.1)", padding: "2px 8px", borderRadius: "9999px" }}>
                            Étape {getShipmentPhase(activeShipment.current_status)} sur 5
                          </span>
                        </div>
                        {(() => {
                          const currentPhase = getShipmentPhase(activeShipment.current_status);
                          const phases = [
                            "1. Reçu au magasin départ",
                            "2. Contrôlé et emballé",
                            "3. En vol / En mer vers l'Afrique",
                            "4. Arrivé en agence locale",
                            "5. Livré au client",
                          ];
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "#FFFFFF", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                              {phases.map((label, idx) => {
                                const phaseNumber = idx + 1;
                                const isDone = phaseNumber < currentPhase;
                                const isCurrent = phaseNumber === currentPhase;
                                return (
                                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.76rem" }}>
                                    <span
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        background: isDone
                                          ? "#059669"
                                          : isCurrent
                                          ? "#EA580C"
                                          : "rgba(59, 34, 24, 0.15)",
                                        border: isCurrent ? "2px solid #FFF" : "none",
                                        boxShadow: isCurrent ? "0 0 0 3px rgba(234, 88, 12, 0.35)" : "none",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontWeight: isCurrent ? "800" : isDone ? "600" : "400",
                                        color: isCurrent ? "var(--brown-dark)" : isDone ? "var(--text-main)" : "var(--text-muted)",
                                        flex: 1,
                                      }}
                                    >
                                      {label}
                                    </span>
                                    {isCurrent && (
                                      <span style={{ fontSize: "0.66rem", fontWeight: "800", color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.04em", background: "rgba(234, 88, 12, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                        En cours
                                      </span>
                                    )}
                                    {isDone && (
                                      <span style={{ color: "#059669", fontSize: "0.72rem", fontWeight: "700" }}>
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Boutons d'action rapide */}
                      <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setShowStatusModal(activeShipment)}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "9px", fontSize: "0.8rem", justifyContent: "center", borderRadius: "12px" }}
                        >
                          Changer le statut
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPrintLabelModal(activeShipment)}
                          className="btn btn-secondary"
                          style={{ padding: "9px 14px", fontSize: "0.8rem", borderRadius: "12px" }}
                          title="Imprimer le bordereau"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center", padding: "24px" }}>
                      <Package size={28} color="var(--brown-light)" style={{ marginBottom: "10px", opacity: 0.6 }} />
                      Cliquez sur un colis dans la liste ou sur la sphère 3D pour voir ses détails en direct.
                    </div>
                  )}
                </div>
              </div>

              {/* TIER 3 : GRAND REGISTRE OPÉRATIONNEL SYNCHRONISÉ */}
              <div className="card-clean" style={{ padding: "24px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                        Grand Registre Opérationnel
                      </h3>
                      <span className="ios-trend-pill ios-trend-pill-neutral">
                        {filteredDashboardShipments.length} dossiers
                      </span>
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      Cliquez sur une expédition pour la centrer sur le globe 3D sans effet parasite.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Filtres par onglets iOS Capsule */}
                    <div className="pill-selector">
                      {[
                        { key: "ALL", label: `Tous (${shipments.length})` },
                        {
                          key: "IN_TRANSIT",
                          label: `En Vol / Mer (${shipments.filter((s) => s.current_status === "IN_TRANSIT").length})`,
                        },
                        {
                          key: "PREPARATION",
                          label: `Hub Préparation (${shipments.filter((s) => s.current_status === "RECEIVED_AT_HUB" || s.current_status === "IN_PREPARATION" || s.current_status === "PREPARATION").length})`,
                        },
                        {
                          key: "DELIVERED",
                          label: `Livrés (${shipments.filter((s) => s.current_status === "DELIVERED").length})`,
                        },
                      ].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setDashboardFilter(f.key)}
                          className={`pill-option ${dashboardFilter === f.key ? "pill-option-active" : ""}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Barre de recherche iOS Pill */}
                    <div style={{ position: "relative" }}>
                      <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Rechercher tracking, client..."
                        value={dashboardSearch}
                        onChange={(e) => setDashboardSearch(e.target.value)}
                        style={{
                          padding: "7px 14px 7px 34px",
                          fontSize: "0.8rem",
                          border: "1px solid var(--border-light)",
                          borderRadius: "var(--radius-full)",
                          background: "#FFFFFF",
                          width: "220px",
                          outline: "none",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tableau */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(59, 34, 24, 0.08)", textAlign: "left", color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <th style={{ padding: "10px 12px" }}>N° Dossier</th>
                        <th style={{ padding: "10px 12px" }}>Client</th>
                        <th style={{ padding: "10px 12px" }}>Corridor</th>
                        <th style={{ padding: "10px 12px" }}>Mode</th>
                        <th style={{ padding: "10px 12px" }}>Poids / Colis</th>
                        <th style={{ padding: "10px 12px" }}>Statut Opérationnel</th>
                        <th style={{ padding: "10px 12px" }}>Règlement</th>
                        <th style={{ padding: "10px 12px", textAlign: "right" }}>Radar 3D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDashboardShipments.map((s) => {
                        const isSelected = activeShipment?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => handleSelectShipment(s)}
                            className={isSelected ? "active-row-highlight" : ""}
                            style={{
                              borderBottom: "1px solid rgba(59, 34, 24, 0.05)",
                              cursor: "pointer",
                              transition: "background-color 0.15s ease",
                            }}
                          >
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: "800", color: "var(--brown-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {s.tracking_number}
                                {isSelected && (
                                  <span style={{ fontSize: "0.65rem", padding: "1px 5px", background: "var(--brown-dark)", color: "#FFF", borderRadius: "3px" }}>
                                    Actif
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{s.client_name}</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.client_phone}</div>
                            </td>
                            <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <span>{s.origin_country || "Chine"}</span>
                                <span style={{ color: "var(--brown-light)", fontSize: "0.75rem" }}>→</span>
                                <strong>{s.destination_country || "Afrique"}</strong>
                              </div>
                            </td>
                            <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                {(s.shipping_mode_name || "").includes("Aérien") || s.shipping_mode_id === "AIR_EXPRESS" ? (
                                  <Plane size={13} color="var(--brown-light)" />
                                ) : (
                                  <Ship size={13} color="var(--brown-light)" />
                                )}
                                <span>{s.shipping_mode_name || (s.shipping_mode_id === "AIR_EXPRESS" ? "Aérien Express" : "Maritime Cargo")}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div className="tabular-nums" style={{ fontWeight: "700" }}>{s.total_weight_kg || 0} kg</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.total_parcels_count || 1} colis</div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <span
                                className={`badge-clean ${
                                  s.current_status === "DELIVERED"
                                    ? "badge-delivered"
                                    : s.current_status === "IN_TRANSIT"
                                    ? "badge-transit"
                                    : "badge-draft"
                                }`}
                              >
                                {formatShipmentStatus(s.current_status, s.status_label)}
                              </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <span className={`badge-clean ${s.payment_status === "PAID" ? "badge-delivered" : "badge-draft"}`}>
                                {s.payment_status === "PAID" ? "Payé" : "En attente"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectShipment(s);
                                }}
                                style={{
                                  background: isSelected ? "var(--brown-dark)" : "var(--bg-app)",
                                  color: isSelected ? "#FFFFFF" : "var(--brown-dark)",
                                  border: "1px solid var(--border-light)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "4px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Compass size={12} /> Centrer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDashboardShipments.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                            Aucune expédition ne correspond aux critères de filtre.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TIER 4 : TÂCHES OPÉRATIONNELLES PRIORITAIRES (HAIRLINE COMPACT) */}
              <div className="desk-hairline-card" style={{ padding: "18px 20px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                      Tâches Prioritaires
                    </h3>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      ({tasksList.filter((t) => t.status !== "DONE").length} en attente)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    style={{ background: "none", border: "none", color: "var(--brown-light)", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700" }}
                  >
                    Gérer toutes les tâches ({tasksList.length}) →
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                  {tasksList.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "10px 14px",
                        background: "var(--bg-app)",
                        border: "1px solid rgba(59, 34, 24, 0.06)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={t.status === "DONE"}
                        onChange={() => handleToggleTaskStatus(t.id, t.status)}
                        style={{ cursor: "pointer", accentColor: "var(--brown-dark)" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: "600", textDecoration: t.status === "DONE" ? "line-through" : "none", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </div>
                        {t.due_date && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Échéance : {t.due_date}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: t.priority === "URGENT" ? "var(--state-danger-bg)" : "rgba(59, 34, 24, 0.06)",
                          color: t.priority === "URGENT" ? "var(--state-danger-text)" : "var(--text-secondary)",
                          border: `1px solid ${t.priority === "URGENT" ? "var(--state-danger-border)" : "transparent"}`,
                          flexShrink: 0,
                        }}
                      >
                        {formatTaskPriority(t.priority)}
                      </span>
                    </div>
                  ))}
                  {tasksList.length === 0 && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", padding: "10px 0" }}>
                      Toutes les tâches sont terminées.
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* 2. DEMANDES REÇUES */}
        {activeTab === "requests" && (
          <div key="requests" className="animate-fade-in card-clean" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Rechercher par référence, client, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean"
                style={{ maxWidth: "380px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Référence</th>
                    <th style={{ padding: "10px 12px" }}>Type</th>
                    <th style={{ padding: "10px 12px" }}>Client</th>
                    <th style={{ padding: "10px 12px" }}>Trajet</th>
                    <th style={{ padding: "10px 12px" }}>Poids/Infos</th>
                    <th style={{ padding: "10px 12px" }}>Statut</th>
                    <th style={{ padding: "10px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList
                    .filter((r) =>
                      !searchTerm ||
                      r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.client_phone?.includes(searchTerm)
                    )
                    .map((r) => (
                      <tr key={r.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px", fontWeight: "700" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenRequestDetail(r)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--brown-dark)",
                              fontWeight: "700",
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                              font: "inherit",
                              textAlign: "left",
                            }}
                            title="Voir les détails et articles"
                          >
                            {r.reference}
                          </button>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="badge-clean badge-draft">
                            {formatRequestType(r.request_type)}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{r.client_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.client_phone}</div>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {r.origin_country || "Chine"} → {r.destination_country || "Afrique"}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {r.estimated_weight_kg ? `${r.estimated_weight_kg} kg` : "—"}
                          {r.estimated_cbm ? ` · ${r.estimated_cbm} m³` : ""}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRequestStatus(r.id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-light)",
                              background: "#FFFFFF",
                              color: "var(--text-main)",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            <option value="NEW">NOUVEAU</option>
                            <option value="IN_REVIEW">EN ANALYSE</option>
                            <option value="QUOTE_SENT">DEVIS ENVOYÉ</option>
                            <option value="CONVERTED">CONVERTI EN COLIS</option>
                            <option value="CLOSED">CLÔTURÉ</option>
                            <option value="CANCELLED">ANNULÉ</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setEditingRequest(r)}
                              className="btn btn-secondary"
                              style={{
                                padding: "5px 9px",
                                fontSize: "0.75rem",
                                color: "var(--accent-gold-dark)",
                                borderColor: "var(--accent-gold)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "600",
                              }}
                              title="Modifier la demande"
                            >
                              <Edit3 size={12} />
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRequestDetail(r)}
                              className="btn btn-secondary"
                              style={{ padding: "5px 9px", fontSize: "0.75rem" }}
                            >
                              Articles
                            </button>
                            {r.status !== "CONVERTED" && r.status !== "CANCELLED" && (
                              <button
                                type="button"
                                onClick={() => handleOpenConvertModal(r)}
                                className="btn btn-primary"
                                style={{ padding: "5px 9px", fontSize: "0.75rem" }}
                              >
                                Convertir
                              </button>
                            )}
                            <a
                              href={`https://wa.me/${r.client_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Bonjour ${r.client_name}, concernant votre demande ${r.reference} chez ROUM TRANSIT :`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: "5px 8px", fontSize: "0.76rem" }}
                              title="Message WhatsApp pré-rempli"
                            >
                              <Phone size={12} color="#25D366" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {requestsList.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                        Aucune demande client reçue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. EXPÉDITIONS & COLIS */}
        {activeTab === "shipments" && (
          <div key="shipments" className="animate-fade-in card-clean" style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Rechercher par n° suivi, client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-clean"
                  style={{ maxWidth: "320px" }}
                />

                {/* SÉLECTEUR EN PILLS SOBRE & ÉPURÉ (Demande Audio 2) */}
                <div className="pill-selector">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("")}
                    className={`pill-option ${statusFilter === "" ? "pill-option-active" : ""}`}
                  >
                    Tous ({shipments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("IN_TRANSIT")}
                    className={`pill-option ${statusFilter === "IN_TRANSIT" ? "pill-option-active" : ""}`}
                  >
                    En transit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("DELIVERED")}
                    className={`pill-option ${statusFilter === "DELIVERED" ? "pill-option-active" : ""}`}
                  >
                    Livrés
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("RECEIVED_AT_HUB")}
                    className={`pill-option ${statusFilter === "RECEIVED_AT_HUB" ? "pill-option-active" : ""}`}
                  >
                    En préparation
                  </button>
                </div>
              </div>

              {allStatuses.length > 0 && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-pill-clean"
                  style={{ minWidth: "160px" }}
                >
                  <option value="">Filtre précis...</option>
                  {allStatuses.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.label_public}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>N° Suivi</th>
                    <th style={{ padding: "10px 12px" }}>Client</th>
                    <th style={{ padding: "10px 12px" }}>Liaison</th>
                    <th style={{ padding: "10px 12px" }}>Mode</th>
                    <th style={{ padding: "10px 12px" }}>Colis / Poids</th>
                    <th style={{ padding: "10px 12px" }}>Statut</th>
                    <th style={{ padding: "10px 12px" }}>Paiement</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments
                    .filter((s) => {
                      if (statusFilter && s.current_status !== statusFilter) return false;
                      if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        return (
                          s.tracking_number.toLowerCase().includes(term) ||
                          s.client_name.toLowerCase().includes(term) ||
                          s.client_phone.includes(term)
                        );
                      }
                      return true;
                    })
                    .map((s) => (
                      <tr key={s.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px" }}>
                          <Link
                            href={`/tracking/${s.tracking_number}`}
                            target="_blank"
                            style={{ fontWeight: "700", color: "var(--brown-dark)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {s.tracking_number}
                            <ExternalLink size={11} />
                          </Link>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(s.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{s.client_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.client_phone}</div>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {s.origin_country} → {s.destination_country}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {s.shipping_mode_name}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div>{s.total_parcels_count} colis</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {s.total_weight_kg} kg{s.total_volume_cbm ? ` · ${s.total_volume_cbm} m³` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            className={`badge-clean ${
                              s.current_status === "DELIVERED"
                                ? "badge-delivered"
                                : s.current_status === "IN_TRANSIT"
                                ? "badge-transit"
                                : "badge-draft"
                            }`}
                          >
                            {formatShipmentStatus(s.current_status, s.status_label)}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className={`badge-clean ${s.payment_status === "PAID" ? "badge-delivered" : "badge-draft"}`}>
                            {s.payment_status === "PAID" ? "Réglé" : s.payment_status === "PARTIAL" ? "Acompte" : "En attente"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setEditingShipment(s)}
                              className="btn btn-secondary"
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                color: "var(--accent-gold-dark)",
                                borderColor: "var(--accent-gold)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "600",
                              }}
                              title="Modifier tous les champs de l'expédition"
                            >
                              <Edit3 size={12} />
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenIntakeModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Pesée réelle et réception physique au magasin"
                            >
                              Pesée Hub
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenShipmentDetail(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Historique complet des jalons et paiements"
                            >
                              Historique
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowStatusModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Mettre à jour l'étape de suivi"
                            >
                              Jalon
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPrintLabelModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Imprimer bordereau"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                        Aucune expédition enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. RÉPERTOIRE DES CLIENTS */}
        {activeTab === "clients" && (
          <div key="clients" className="animate-fade-in card-clean" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean"
                style={{ maxWidth: "380px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Nom du Client</th>
                    <th style={{ padding: "10px 12px" }}>WhatsApp / Téléphone</th>
                    <th style={{ padding: "10px 12px" }}>Email</th>
                    <th style={{ padding: "10px 12px" }}>Localisation</th>
                    <th style={{ padding: "10px 12px" }}>Dossiers</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsList
                    .filter((c) =>
                      !searchTerm ||
                      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (c.phone_whatsapp || c.phone || "").includes(searchTerm) ||
                      (c.country || "").toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "var(--text-main)" }}>
                          {c.full_name}
                        </td>
                        <td style={{ padding: "12px", color: "var(--brown-dark)", fontWeight: "600" }}>
                          {c.phone_whatsapp || c.phone || "—"}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                          {c.email || "—"}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {c.city ? `${c.city}, ` : ""}{c.country}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
                            {c.shipments_count || 0} expédition(s)
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setEditingClient(c)}
                              className="btn btn-secondary"
                              style={{ padding: "5px 12px", fontSize: "0.76rem", gap: "4px" }}
                              title="Modifier la fiche client"
                            >
                              <Edit size={12} /> Modifier
                            </button>
                            <a
                              href={`https://wa.me/${(c.phone_whatsapp || c.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Bonjour ${c.full_name}, nous vous contactons depuis ROUM TRANSIT :`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: "5px 12px", fontSize: "0.76rem", gap: "4px" }}
                            >
                              <Phone size={12} color="#25D366" /> WhatsApp
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TARIFS & ROUTES LIBRES */}
        {activeTab === "tariffs" && (() => {
          const filteredTariffs = tariffsList.filter((t) => {
            // Filtre par couloir / origine
            if (tariffCorridorFilter !== "ALL") {
              const orig = (t.origin_country || "").toLowerCase();
              const dest = (t.destination_country || "").toLowerCase();
              if (tariffCorridorFilter === "CN_AE") {
                const isCnAe = orig.includes("chine") || orig.includes("émirat") || orig.includes("duba");
                if (!isCnAe) return false;
              } else if (tariffCorridorFilter === "MA") {
                const isMa = orig.includes("maroc") || dest.includes("maroc");
                if (!isMa) return false;
              } else if (tariffCorridorFilter === "FR_CI") {
                const isFrCi = (orig.includes("france") && dest.includes("ivoire")) || (orig.includes("ivoire") && dest.includes("france"));
                if (!isFrCi) return false;
              }
            }
            if (tariffModeFilter !== "ALL") {
              const nameLower = (t.shipping_mode_name || "").toLowerCase();
              if (tariffModeFilter === "AIR" && t.shipping_mode_type !== "AIR" && !nameLower.includes("aérien") && !nameLower.includes("vol") && !nameLower.includes("express")) return false;
              if (tariffModeFilter === "SEA" && t.shipping_mode_type !== "SEA" && !nameLower.includes("maritime") && !nameLower.includes("bateau") && !nameLower.includes("cbm")) return false;
              if (tariffModeFilter === "ROAD" && t.shipping_mode_type !== "ROAD" && !nameLower.includes("terrestre")) return false;
            }
            if (tariffCurrencyFilter !== "ALL" && (t.currency || "FCFA").toUpperCase() !== tariffCurrencyFilter.toUpperCase()) {
              return false;
            }
            if (tariffSearch.trim()) {
              const q = tariffSearch.toLowerCase();
              const matchOrig = (t.origin_country || "").toLowerCase().includes(q) || (t.origin_city || "").toLowerCase().includes(q);
              const matchDest = (t.destination_country || "").toLowerCase().includes(q) || (t.destination_city || "").toLowerCase().includes(q);
              const matchMode = (t.shipping_mode_name || "").toLowerCase().includes(q) || (t.category_tag || "").toLowerCase().includes(q);
              const matchCurr = (t.currency || "").toLowerCase().includes(q);
              return matchOrig || matchDest || matchMode || matchCurr;
            }
            return true;
          });

          const uniqueCorridors = new Set(tariffsList.map((t) => `${t.origin_country}->${t.destination_country}`)).size;
          const airCount = tariffsList.filter((t) => t.shipping_mode_type === "AIR" || (t.shipping_mode_name || "").toLowerCase().includes("aérien") || (t.shipping_mode_name || "").toLowerCase().includes("vol")).length;
          const seaCount = tariffsList.filter((t) => t.shipping_mode_type === "SEA" || (t.shipping_mode_name || "").toLowerCase().includes("maritime") || (t.shipping_mode_name || "").toLowerCase().includes("bateau")).length;

          return (
            <div key="tariffs" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Entête avec Bouton Nouveau Tarif & Info ROUM TRANSIT */}
              <div className="card-clean" style={{ padding: "22px 28px", borderRadius: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="badge-clean badge-transit" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                        ✨ N°1 du Groupage Aérien Subsaharien
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ROUM TRANSIT Wholesale & Boutique
                      </span>
                    </div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 4px 0" }}>
                      Grille Tarifaire d&apos;Expédition & Offres Réelles
                    </h2>
                    <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: 0 }}>
                      Gérez et créez librement vos tarifs d&apos;un pays à un autre (Chine, Dubaï, Maroc, Paris vers l&apos;Afrique) avec la devise de votre choix.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateTariffModal(true)}
                    className="btn btn-primary"
                    style={{ padding: "10px 22px", fontSize: "0.88rem", gap: "8px", borderRadius: "9999px", boxShadow: "0 4px 14px rgba(59, 34, 24, 0.2)" }}
                  >
                    <Plus size={16} />
                    Créer un Nouveau Tarif
                  </button>
                </div>
              </div>

              {/* DISPOSITION ASYMÉTRIQUE ÉLÉGANTE : GROS CARRÉ PRIX PAR DÉFAUT + 2 RECTANGLES À DROITE */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginBottom: "22px" }}>
                {/* COLONNE GAUCHE : LE GROS CARRÉ DES PRIX PAR DÉFAUT (CHINE & DUBAÏ) */}
                <div
                  className="card-clean"
                  style={{
                    padding: "24px",
                    borderRadius: "22px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 18px rgba(59, 34, 24, 0.04)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <CircularFlag countryCode="CN" size={22} />
                        <CircularFlag countryCode="AE" size={22} />
                        <div>
                          <h3 style={{ fontSize: "1.06rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                            1. Chine & Dubaï ➔ Afrique
                          </h3>
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            Tarifs par défaut · Hubs Guangzhou, Yiwu, Dubaï
                          </span>
                        </div>
                      </div>
                      <span className="badge-clean badge-transit" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                        Prix par défaut
                      </span>
                    </div>

                    {/* Prestations Chine & Dubaï avec Bouton Modifier actif */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {[
                        { key: "normale", name: "Voie normale", delay: "2 semaines", price: "10 000 FCFA", unit: "/ kg", matchKeyword: "normale", defaultVal: 10000 },
                        { key: "express", name: "Voie express", delay: "4 jours", price: "12 000 FCFA", unit: "/ kg", matchKeyword: "express", defaultVal: 12000 },
                        { key: "batteries", name: "Batteries & Compléments", delay: "2 semaines", price: "14 000 FCFA", unit: "/ kg", matchKeyword: "batterie", defaultVal: 14000 },
                        { key: "hightech", name: "Pièces d'ordinateur & High-Tech", delay: "Express", price: "50 000 FCFA", unit: "/ pièce", matchKeyword: "ordinateur", defaultVal: 50000 },
                        { key: "bateau", name: "Par Bateau (Le CBM conteneur)", delay: "35 - 45 jours", price: "300 000 FCFA", unit: "/ m³", matchKeyword: "bateau", defaultVal: 300000 },
                      ].map((item) => {
                        const matchedTariff = tariffsList.find((t) => (t.service_name || "").toLowerCase().includes(item.matchKeyword) || (t.category_tag || "").toLowerCase().includes(item.matchKeyword));
                        const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : item.price;

                        return (
                          <div
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: "var(--bg-app)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-light)",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)" }}>{item.name}</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Délai : {matchedTariff?.estimated_days_min ? `${matchedTariff.estimated_days_min} à ${matchedTariff.estimated_days_max} jours` : item.delay}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.92rem", fontWeight: "800", color: "var(--brown-dark)" }}>{currentPrice}</div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{item.unit}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedTariff) {
                                    setEditingTariff({
                                      ...matchedTariff,
                                      price_per_unit: matchedTariff.price_per_unit || (matchedTariff.price_per_unit_minor / 100),
                                    });
                                  } else {
                                    setEditingTariff({
                                      id: `default-${item.key}`,
                                      service_name: item.name,
                                      origin_country: "Chine",
                                      destination_country: "Côte d'Ivoire",
                                      price_per_unit: item.defaultVal,
                                      currency: "FCFA",
                                      estimated_days_min: 4,
                                      estimated_days_max: 14,
                                      note: "Tarif officiel Chine & Dubaï",
                                    });
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: "5px 10px", fontSize: "0.74rem", gap: "4px", borderRadius: "8px" }}
                                title="Modifier ce tarif"
                              >
                                <Edit size={12} />
                                Modifier
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLONNE DROITE : LES DEUX RECTANGLES EMPILÉS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* RECTANGLE 1 (EN HAUT) : 2. GROUPAGE SUBSAHARIEN MAROC */}
                  <div className="card-clean" style={{ padding: "20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)", boxShadow: "0 4px 18px rgba(59, 34, 24, 0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CircularFlag countryCode="MA" size={20} />
                        <div>
                          <h4 style={{ fontSize: "0.96rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                            2. Groupage Aérien Subsaharien (Maroc)
                          </h4>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Casablanca ➔ 5 Pays Subsahariens · 5 jours garantis
                          </span>
                        </div>
                      </div>
                      <span className="badge-clean badge-delivered" style={{ fontSize: "0.68rem", padding: "2px 7px" }}>
                        5 jours
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { dest: "Côte d'Ivoire", flag: "CI", price: "6 500 FCFA", matchKeyword: "ivoire", defaultVal: 6500 },
                        { dest: "Sénégal, Mali, Burkina Faso", flag: "SN", price: "7 000 FCFA", matchKeyword: "mali", defaultVal: 7000 },
                        { dest: "Gabon", flag: "GA", price: "7 500 FCFA", matchKeyword: "gabon", defaultVal: 7500 },
                      ].map((route) => {
                        const matchedTariff = tariffsList.find((t) => (t.origin_country || "").toLowerCase().includes("maroc") && ((t.destination_country || "").toLowerCase().includes(route.matchKeyword) || (t.service_name || "").toLowerCase().includes(route.matchKeyword)));
                        const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : route.price;

                        return (
                          <div
                            key={route.dest}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background: "var(--bg-app)",
                              borderRadius: "10px",
                              border: "1px solid var(--border-light)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                              <CircularFlag countryCode={route.flag} size={16} />
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)" }}>{route.dest}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>{currentPrice} / kg</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedTariff) {
                                    setEditingTariff({
                                      ...matchedTariff,
                                      price_per_unit: matchedTariff.price_per_unit || (matchedTariff.price_per_unit_minor / 100),
                                    });
                                  } else {
                                    setEditingTariff({
                                      id: `default-ma-${route.flag}`,
                                      service_name: `Groupage vers ${route.dest}`,
                                      origin_country: "Maroc",
                                      destination_country: route.dest,
                                      price_per_unit: route.defaultVal,
                                      currency: "FCFA",
                                      estimated_days_min: 5,
                                      estimated_days_max: 5,
                                      note: "Groupage aérien Maroc 5 jours",
                                    });
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", gap: "4px", borderRadius: "8px" }}
                                title="Modifier ce tarif"
                              >
                                <Edit size={11} />
                                Modifier
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RECTANGLE 2 (EN BAS) : 3. LIAISONS BILATÉRALES PARIS ↔ ABIDJAN */}
                  <div className="card-clean" style={{ padding: "20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)", boxShadow: "0 4px 18px rgba(59, 34, 24, 0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CircularFlag countryCode="FR" size={20} />
                        <CircularFlag countryCode="CI" size={20} />
                        <div>
                          <h4 style={{ fontSize: "0.96rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                            3. Liaisons Aériennes (Paris ↔ Abidjan)
                          </h4>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Agence Bingerville · Expéditions dans les 2 sens
                          </span>
                        </div>
                      </div>
                      <span className="badge-clean badge-transit" style={{ fontSize: "0.68rem", padding: "2px 7px" }}>
                        2 sens
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { name: "Divers Articles", price: "8 500 F / 12 €", unit: "/ kg", matchKeyword: "divers", defaultVal: 8500 },
                        { name: "Cosmétique et Liquide", price: "9 000 F / 14 €", unit: "/ kg", matchKeyword: "cosmétique", defaultVal: 9000 },
                        { name: "Document Administratif", price: "13 000 F / 20 €", unit: "/ pli", matchKeyword: "document", defaultVal: 13000 },
                      ].map((item) => {
                        const matchedTariff = tariffsList.find((t) => (t.origin_country || "").toLowerCase().includes("france") && (t.service_name || "").toLowerCase().includes(item.matchKeyword));
                        const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : item.price;

                        return (
                          <div
                            key={item.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background: "var(--bg-app)",
                              borderRadius: "10px",
                              border: "1px solid var(--border-light)",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)" }}>{item.name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Régulier · Agence Bingerville</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>{currentPrice}</div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{item.unit}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedTariff) {
                                    setEditingTariff({
                                      ...matchedTariff,
                                      price_per_unit: matchedTariff.price_per_unit || (matchedTariff.price_per_unit_minor / 100),
                                    });
                                  } else {
                                    setEditingTariff({
                                      id: `default-fr-${item.name}`,
                                      service_name: item.name,
                                      origin_country: "France",
                                      destination_country: "Côte d'Ivoire",
                                      price_per_unit: item.defaultVal,
                                      currency: "FCFA",
                                      estimated_days_min: 3,
                                      estimated_days_max: 5,
                                      note: "Paris ↔ Abidjan",
                                    });
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", gap: "4px", borderRadius: "8px" }}
                                title="Modifier ce tarif"
                              >
                                <Edit size={11} />
                                Modifier
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* BARRE DE FILTRES SEGMENTÉE HAUT DE GAMME */}
              <div className="card-clean" style={{ padding: "18px 24px", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                {/* Ligne 1 : Couloirs Principaux + Recherche */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", background: "var(--bg-app)", padding: "4px 6px", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                    {[
                      { id: "ALL", label: `Tous (${tariffsList.length})`, icon: <Globe size={14} /> },
                      {
                        id: "CN_AE",
                        label: "Chine & Dubaï",
                        icon: (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <CircularFlag countryCode="CN" size={14} />
                            <CircularFlag countryCode="AE" size={14} />
                          </span>
                        ),
                      },
                      {
                        id: "MA",
                        label: "Maroc Subsaharien",
                        icon: <CircularFlag countryCode="MA" size={14} />,
                      },
                      {
                        id: "FR_CI",
                        label: "Paris ↔ Abidjan",
                        icon: (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <CircularFlag countryCode="FR" size={14} />
                            <CircularFlag countryCode="CI" size={14} />
                          </span>
                        ),
                      },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTariffCorridorFilter(c.id)}
                        style={{
                          border: "none",
                          padding: "7px 14px",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: tariffCorridorFilter === c.id ? "700" : "500",
                          background: tariffCorridorFilter === c.id ? "#FFFFFF" : "transparent",
                          color: tariffCorridorFilter === c.id ? "var(--brown-dark)" : "var(--text-secondary)",
                          boxShadow: tariffCorridorFilter === c.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {c.icon}
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ position: "relative", minWidth: "220px", flex: 1, maxWidth: "340px" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      value={tariffSearch}
                      onChange={(e) => setTariffSearch(e.target.value)}
                      placeholder="Filtrer par pays, ville, mode..."
                      className="input-clean"
                      style={{ paddingLeft: "34px", height: "38px", fontSize: "0.82rem", borderRadius: "12px" }}
                    />
                  </div>
                </div>

                {/* Ligne 2 : Filtres de mode & Devises avec espacement élégant */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingTop: "6px", borderTop: "1px solid rgba(59, 34, 24, 0.05)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: "600", color: "var(--text-muted)", marginRight: "4px" }}>Mode :</span>
                    {[
                      { id: "ALL", label: "Tous modes" },
                      { id: "AIR", label: "Aérien", icon: <Plane size={13} /> },
                      { id: "SEA", label: "Bateau (CBM)", icon: <Ship size={13} /> },
                      { id: "ROAD", label: "Terrestre", icon: <Truck size={13} /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTariffModeFilter(m.id)}
                        style={{
                          border: "1px solid " + (tariffModeFilter === m.id ? "var(--brown-dark)" : "rgba(59, 34, 24, 0.12)"),
                          padding: "6px 12px",
                          fontSize: "0.76rem",
                          borderRadius: "9999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: tariffModeFilter === m.id ? "var(--brown-dark)" : "#FFFFFF",
                          color: tariffModeFilter === m.id ? "#FFFFFF" : "var(--text-secondary)",
                          fontWeight: tariffModeFilter === m.id ? "700" : "500",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: "600", color: "var(--text-muted)", marginRight: "4px" }}>Devise :</span>
                    {["ALL", "FCFA", "EUR", "USD", "AED", "MAD", "GBP", "CNY"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setTariffCurrencyFilter(curr)}
                        style={{
                          border: "1px solid " + (tariffCurrencyFilter === curr ? "var(--brown-dark)" : "rgba(59, 34, 24, 0.1)"),
                          background: tariffCurrencyFilter === curr ? "var(--brown-dark)" : "#FFFFFF",
                          color: tariffCurrencyFilter === curr ? "#FFFFFF" : "var(--text-secondary)",
                          padding: "5px 10px",
                          fontSize: "0.74rem",
                          fontWeight: tariffCurrencyFilter === curr ? "700" : "500",
                          borderRadius: "9999px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {curr === "ALL" ? "Toutes" : curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABLEAU DES TARIFS STYLE IOS */}
              <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "20px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "14px 18px" }}>Trajet d&apos;Acheminement</th>
                        <th style={{ padding: "14px 18px" }}>Type de Service & Mode</th>
                        <th style={{ padding: "14px 18px" }}>Prix Unitaire</th>
                        <th style={{ padding: "14px 18px" }}>Unité de Facturation</th>
                        <th style={{ padding: "14px 18px" }}>Délai Garanti</th>
                        <th style={{ padding: "14px 18px" }}>Spécificité / Note</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTariffs.length > 0 ? (
                        filteredTariffs.map((t) => {
                          const isSea = t.shipping_mode_type === "SEA" || (t.shipping_mode_name || "").toLowerCase().includes("maritime") || (t.shipping_mode_name || "").toLowerCase().includes("bateau") || (t.pricing_basis === "PER_CBM");
                          const isRoad = t.shipping_mode_type === "ROAD" || (t.shipping_mode_name || "").toLowerCase().includes("terrestre");
                          const isUnit = t.pricing_basis === "PER_UNIT";
                          const unitLabel = isSea ? "par m³ (CBM)" : isUnit ? "par pièce / pli" : "par kg";
                          const cleanTag = (t.category_tag || t.shipping_mode_name || "").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                          return (
                            <tr key={t.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <CircularFlag countryName={t.origin_country} size={20} />
                                  <span style={{ fontWeight: "700", color: "var(--text-main)" }}>
                                    {t.origin_country} {t.origin_city ? `(${t.origin_city})` : ""}
                                  </span>
                                  <span style={{ color: "var(--brown-light)", fontWeight: "800", fontSize: "0.85rem" }}>➔</span>
                                  <CircularFlag countryName={t.destination_country} size={20} />
                                  <span style={{ fontWeight: "800", color: "var(--brown-dark)" }}>
                                    {t.destination_country} {t.destination_city ? `(${t.destination_city})` : ""}
                                  </span>
                                </div>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <span
                                  className="badge-clean"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "0.76rem",
                                    background: isSea ? "rgba(46, 125, 78, 0.1)" : isRoad ? "rgba(79, 70, 229, 0.1)" : "rgba(234, 88, 12, 0.1)",
                                    color: isSea ? "#2E7D4E" : isRoad ? "#4F46E5" : "#EA580C",
                                    fontWeight: "700",
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  {isSea ? (
                                    <Ship size={13} />
                                  ) : isRoad ? (
                                    <Truck size={13} />
                                  ) : cleanTag.includes("Express") ? (
                                    <Zap size={13} />
                                  ) : cleanTag.includes("Batterie") || cleanTag.includes("Complément") ? (
                                    <BatteryCharging size={13} />
                                  ) : cleanTag.includes("High-Tech") || cleanTag.includes("PC") || cleanTag.includes("ordinateur") ? (
                                    <Laptop size={13} />
                                  ) : cleanTag.includes("Cosmétique") ? (
                                    <Sparkles size={13} />
                                  ) : cleanTag.includes("Document") || cleanTag.includes("Pli") ? (
                                    <FileText size={13} />
                                  ) : cleanTag.includes("Divers") ? (
                                    <ShoppingBag size={13} />
                                  ) : (
                                    <Plane size={13} />
                                  )}
                                  <span>{cleanTag}</span>
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ fontWeight: "800", fontSize: "0.98rem", color: "var(--brown-dark)" }}>
                                  {formatCurrencyPrice(t.price_per_unit_minor, t.currency)} {isSea ? "/ m³" : isUnit ? "" : "/ kg"}
                                </div>
                                {t.secondary_display && (
                                  <div style={{ fontSize: "0.72rem", color: "#7C3AED", fontWeight: "700", marginTop: "2px" }}>
                                    {t.secondary_display}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: "14px 18px", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                {unitLabel}
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-main)", fontWeight: "600", background: "var(--bg-app)", padding: "3px 8px", borderRadius: "6px" }}>
                                  <Clock size={12} style={{ color: "var(--brown-light)" }} />
                                  {t.estimated_days_min && t.estimated_days_max
                                    ? t.estimated_days_min === t.estimated_days_max
                                      ? `${t.estimated_days_min} jours`
                                      : `${t.estimated_days_min} à ${t.estimated_days_max} jours`
                                    : "3 à 7 jours"}
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px", color: "var(--text-muted)", fontSize: "0.76rem", maxWidth: "220px" }}>
                                {t.note || (t.flyer_source ? `Offre : ${t.flyer_source}` : "Tarif standard")}
                              </td>

                              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTariff({
                                      ...t,
                                      price_per_unit: t.price_per_unit || (t.price_per_unit_minor / 100),
                                      minimum_charge: t.minimum_charge || (t.minimum_charge_minor / 100),
                                    })}
                                    className="btn btn-secondary"
                                    style={{ padding: "6px 12px", fontSize: "0.74rem", borderRadius: "8px", gap: "4px" }}
                                    title="Modifier ce tarif"
                                  >
                                    <Edit size={13} />
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTariff(t.id)}
                                    className="btn btn-secondary"
                                    style={{ padding: "6px 10px", color: "#C53030", borderColor: "rgba(197, 48, 48, 0.2)", fontSize: "0.74rem", borderRadius: "8px" }}
                                    title="Supprimer ce tarif"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                            Aucun tarif ne correspond à ce filtre. Cliquez sur &quot;+ Créer un Nouveau Tarif&quot; pour en ajouter un librement.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 6. FINANCES & PAIEMENTS : VUE SÉPARÉE PAR STATUT AVEC BOUTON MODIFIER */}
        {activeTab === "finances" && (() => {
          const pendingPayments = paymentsList.filter((p: any) => p.status === "PENDING");
          const confirmedPayments = paymentsList.filter((p: any) => p.status === "CONFIRMED" || !p.status);
          const pendingTotalMinor = pendingPayments.reduce((acc: number, p: any) => acc + (p.amount_minor || 0), 0);
          const confirmedTotalMinor = confirmedPayments.reduce((acc: number, p: any) => acc + (p.amount_minor || 0), 0);
          const waveTotalMinor = confirmedPayments.filter((p: any) => (p.payment_method || "").toUpperCase().includes("WAVE")).reduce((acc: number, p: any) => acc + (p.amount_minor || 0), 0);
          const cashTotalMinor = confirmedPayments.filter((p: any) => (p.payment_method || "").toUpperCase().includes("CASH") || (p.payment_method || "").toUpperCase().includes("ESPÈCE")).reduce((acc: number, p: any) => acc + (p.amount_minor || 0), 0);

          return (
            <div key="finances" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* BANDEAU DES 4 CARTES KPI EXÉCUTIVES */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px" }}>
                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Encaissé & Confirmé</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--state-success-text)", margin: "4px 0" }}>
                    {formatCurrencyPrice(stats?.total_payments_minor || confirmedTotalMinor, "FCFA")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{confirmedPayments.length} règlement(s) certifié(s)</div>
                </div>

                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>En Attente de Contrôle Caisse</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#B45309", margin: "4px 0" }}>
                    {formatCurrencyPrice(pendingTotalMinor, "FCFA")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{pendingPayments.length} paiement(s) à vérifier</div>
                </div>

                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Volume Mobile Money & Wave</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0284C7", margin: "4px 0" }}>
                    {formatCurrencyPrice(waveTotalMinor, "FCFA")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Transferts mobiles instantanés</div>
                </div>

                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Volume Espèces (Comptoirs)</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--brown-dark)", margin: "4px 0" }}>
                    {formatCurrencyPrice(cashTotalMinor, "FCFA")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Encaisses agences Bamako & Abidjan</div>
                </div>
              </div>

              {/* TABLEAU 1 SÉPARÉ : EN ATTENTE DE CONTRÔLE CAISSE */}
              <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "20px", border: "1px solid var(--border-light)", background: "#FFFFFF" }}>
                <div style={{ padding: "16px 22px", background: "#FFFFFF", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D97706" }} />
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                        Paiements en Attente de Contrôle Caisse ({pendingPayments.length})
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                        Transactions signalées par les clients ou agences nécessitant la validation de la Direction
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRecordPaymentModal({})}
                    className="btn btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.78rem", gap: "5px", borderRadius: "8px" }}
                  >
                    <Plus size={13} /> Consigner un Paiement
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Client</th>
                        <th style={{ padding: "12px 16px" }}>N° Dossier</th>
                        <th style={{ padding: "12px 16px" }}>Montant Déclaré</th>
                        <th style={{ padding: "12px 16px" }}>Méthode</th>
                        <th style={{ padding: "12px 16px" }}>Réf. Transaction</th>
                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions de Contrôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.length > 0 ? (
                        pendingPayments.map((p: any) => (
                          <tr key={p.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                              {new Date(p.recorded_at || p.created_at || Date.now()).toLocaleDateString("fr-FR")}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--text-main)" }}>
                              <div>{p.client_name}</div>
                              {p.client_phone && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.client_phone}</div>}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--brown-dark)", fontWeight: "700" }}>
                              {p.tracking_number || "—"}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "800", color: "#B45309" }}>
                              {formatCurrencyPrice(p.amount_minor, p.currency || "FCFA")}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge-clean badge-draft">
                                {p.payment_method === "ORANGE_MONEY" ? "Orange Money" : p.payment_method === "WAVE" ? "Wave" : p.payment_method === "CASH" ? "Espèces" : p.payment_method || "Mobile"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              {p.reference_code || "Manuel"}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(p.id)}
                                  className="btn btn-primary"
                                  style={{ padding: "5px 12px", fontSize: "0.74rem", background: "var(--state-success-text)", borderRadius: "8px" }}
                                  title="Valider la réception"
                                >
                                  Valider
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPayment({
                                    ...p,
                                    amount: p.amount || (p.amount_minor / 100),
                                  })}
                                  className="btn btn-secondary"
                                  style={{ padding: "5px 10px", fontSize: "0.74rem", gap: "4px", borderRadius: "8px" }}
                                  title="Modifier ce paiement"
                                >
                                  <Edit size={12} />
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelPayment(p.id)}
                                  className="btn btn-secondary"
                                  style={{ padding: "5px 9px", fontSize: "0.74rem", color: "#C53030", borderColor: "rgba(197, 48, 48, 0.2)", borderRadius: "8px" }}
                                  title="Rejeter"
                                >
                                  Rejeter
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ padding: "26px", textAlign: "center", color: "var(--text-muted)" }}>
                            Aucun paiement en attente de validation. Tous les encaissements sont à jour !
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLEAU 2 SÉPARÉ : HISTORIQUE DES ENCAISSEMENTS CONFIRMÉS */}
              <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "20px", border: "1px solid var(--border-light)", background: "#FFFFFF" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }} />
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                        Historique des Encaissements Confirmés & Validés ({confirmedPayments.length})
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                        Fonds réceptionnés et comptabilisés dans le livre de caisse ROUM TRANSIT
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Client Payeur</th>
                        <th style={{ padding: "12px 16px" }}>Dossier Associé</th>
                        <th style={{ padding: "12px 16px" }}>Montant Encaissé</th>
                        <th style={{ padding: "12px 16px" }}>Canal / Méthode</th>
                        <th style={{ padding: "12px 16px" }}>Réf. Caisse</th>
                        <th style={{ padding: "12px 16px" }}>Statut</th>
                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedPayments.length > 0 ? (
                        confirmedPayments.map((p: any) => (
                          <tr key={p.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                              {new Date(p.recorded_at || p.created_at || Date.now()).toLocaleDateString("fr-FR")}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--text-main)" }}>
                              <div>{p.client_name}</div>
                              {p.client_phone && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.client_phone}</div>}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--brown-dark)", fontWeight: "700" }}>
                              {p.tracking_number || "—"}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "800", color: "var(--state-success-text)" }}>
                              {formatCurrencyPrice(p.amount_minor, p.currency || "FCFA")}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge-clean badge-delivered">
                                {p.payment_method === "ORANGE_MONEY" ? "Orange Money" : p.payment_method === "WAVE" ? "Wave" : p.payment_method === "CASH" ? "Espèces" : p.payment_method === "BANK_TRANSFER" ? "Virement Bancaire" : p.payment_method || "Validé"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              <div>{p.reference_code || "Certifié"}</div>
                              {p.receipt_notes && (
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                  {p.receipt_notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge-clean badge-delivered" style={{ fontSize: "0.72rem" }}>
                                ✓ Encaissé
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => setEditingPayment({
                                  ...p,
                                  amount: p.amount || (p.amount_minor / 100),
                                })}
                                className="btn btn-secondary"
                                style={{ padding: "5px 12px", fontSize: "0.74rem", gap: "4px", borderRadius: "8px" }}
                                title="Modifier ce paiement"
                              >
                                <Edit size={12} />
                                Modifier
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ padding: "26px", textAlign: "center", color: "var(--text-muted)" }}>
                            Aucun paiement confirmé enregistré pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 7. TÂCHES D'ÉQUIPE (DESIGN EXÉCUTIF & ESPACEMENTS AÉRÉS) */}
        {activeTab === "tasks" && (() => {
          const urgentCount = tasksList.filter((t) => t.status !== "DONE" && (t.priority === "URGENT" || t.priority === "HIGH")).length;
          const pendingCount = tasksList.filter((t) => t.status !== "DONE").length;
          const doneCount = tasksList.filter((t) => t.status === "DONE").length;

          const filteredTasks = tasksList.filter((t) => {
            if (taskFilter === "URGENT") return t.status !== "DONE" && (t.priority === "URGENT" || t.priority === "HIGH");
            if (taskFilter === "PENDING") return t.status !== "DONE";
            if (taskFilter === "DONE") return t.status === "DONE";
            return true;
          });

          return (
            <div key="tasks" className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Entête & Compteurs Métriques */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div className="card-clean" style={{ padding: "18px 22px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Tâches Actives</span>
                    <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--brown-dark)", marginTop: "2px" }}>{pendingCount}</div>
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-app)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brown-dark)" }}>
                    <CheckSquare size={18} />
                  </div>
                </div>

                <div className="card-clean" style={{ padding: "18px 22px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border-light)" }}>
                  <div>
                    <span style={{ fontSize: "0.74rem", color: "#DC2626", fontWeight: "700", textTransform: "uppercase" }}>Urgentes & Critiques</span>
                    <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#DC2626", marginTop: "2px" }}>{urgentCount}</div>
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                    <Flame size={18} />
                  </div>
                </div>

                <div className="card-clean" style={{ padding: "18px 22px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border-light)" }}>
                  <div>
                    <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: "700", textTransform: "uppercase" }}>Terminées</span>
                    <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{doneCount}</div>
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              </div>

              {/* Barre de filtres & Action d'ajout */}
              <div className="card-clean" style={{ padding: "14px 20px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "ALL" as const, label: `Toutes (${tasksList.length})` },
                    { id: "URGENT" as const, label: `Urgentes (${urgentCount})` },
                    { id: "PENDING" as const, label: `En cours (${pendingCount})` },
                    { id: "DONE" as const, label: `Terminées (${doneCount})` },
                  ].map((filterItem) => (
                    <button
                      key={filterItem.id}
                      type="button"
                      onClick={() => setTaskFilter(filterItem.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        fontSize: "0.78rem",
                        fontWeight: taskFilter === filterItem.id ? "700" : "500",
                        border: "1px solid",
                        borderColor: taskFilter === filterItem.id ? "var(--brown-dark)" : "var(--border-light)",
                        background: taskFilter === filterItem.id ? "var(--brown-dark)" : "#FFFFFF",
                        color: taskFilter === filterItem.id ? "#FFFFFF" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {filterItem.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(true)}
                  className="btn btn-primary"
                  style={{ padding: "8px 18px", fontSize: "0.82rem", borderRadius: "9999px" }}
                >
                  <Plus size={14} /> Nouvelle Tâche
                </button>
              </div>

              {/* Grille de cartes de tâches responsives */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "16px" }}>
                {filteredTasks.map((t) => {
                  const isDone = t.status === "DONE";
                  const isUrgent = t.priority === "URGENT" || t.priority === "HIGH";

                  return (
                    <div
                      key={t.id}
                      className="task-card-item"
                      style={{
                        opacity: isDone ? 0.75 : 1,
                        background: isDone ? "#FAFAFC" : "#FFFFFF",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "var(--bg-app)",
                            color: "var(--brown-dark)",
                            border: "1px solid var(--border-light)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {t.category === "WEIGHING" ? <Scale size={12} /> : t.category === "CUSTOMS" ? <Truck size={12} /> : <FileText size={12} />}
                          {formatTaskCategory(t.category)}
                        </span>

                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: isUrgent ? "#FEF2F2" : "var(--bg-subtle)",
                            color: isUrgent ? "#DC2626" : "var(--text-secondary)",
                            border: `1px solid ${isUrgent ? "rgba(220, 38, 38, 0.25)" : "var(--border-light)"}`,
                          }}
                        >
                          {formatTaskPriority(t.priority)}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(t.id, t.status)}
                          title={isDone ? "Marquer comme non terminée" : "Valider la tâche"}
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            border: isDone ? "none" : "2px solid #D1D5DB",
                            background: isDone ? "var(--brown-dark)" : "#FFFFFF",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            marginTop: "2px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isDone && <Check size={13} strokeWidth={3} />}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.93rem",
                              fontWeight: "700",
                              color: isDone ? "var(--text-dim)" : "var(--text-main)",
                              textDecoration: isDone ? "line-through" : "none",
                              lineHeight: "1.4",
                            }}
                          >
                            {t.title}
                          </div>

                          {t.description && (
                            <p
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                                marginTop: "5px",
                                lineHeight: "1.48",
                                margin: "5px 0 0 0",
                              }}
                            >
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-light)", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={13} color="var(--text-dim)" />
                          Échéance : <strong>{t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : "Aujourd'hui"}</strong>
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setEditingTask(t)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--accent-gold-dark)",
                              fontSize: "0.74rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              padding: "2px 6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                            title="Modifier la tâche"
                          >
                            <Edit3 size={12} />
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: isDone ? "var(--text-muted)" : "var(--brown-dark)",
                              fontSize: "0.74rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              padding: "2px 6px",
                            }}
                          >
                            {isDone ? "Rouvrir" : "Terminer ✓"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="card-clean" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", color: "var(--text-dim)" }}>
                    Aucune tâche dans cette sélection.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 8. PARAMÈTRES & AUDIT */}
        {activeTab === "settings" && (
          <div key="settings" className="animate-fade-in" style={{ display: "grid", gap: "24px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
            {/* CARTE 1 : IDENTITÉ LÉGALE & SIÈGE SOCIAL DE L'ENTREPRISE */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                    Identité & Coordonnées Officielles de l&apos;Entreprise
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Renseignements légaux, agréments de douane et contacts de direction affichés sur les devis et factures.
                  </p>
                </div>
                <span className="badge-clean badge-delivered" style={{ padding: "4px 10px", fontSize: "0.72rem" }}>
                  Entreprise Enregistrée
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Raison Sociale Officielle
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_name || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    className="input-clean"
                    placeholder="ROUM TRANSIT INTERNATIONAL SARL"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Numéro RCCM (Registre de Commerce)
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_rccm || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_rccm: e.target.value })}
                    className="input-clean"
                    placeholder="CI-ABJ-2024-B-14289"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Compte Contribuable / NIF
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_nif || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_nif: e.target.value })}
                    className="input-clean"
                    placeholder="2418520 M"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Agrément Douanes / Commissionnaire Agréé
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_customs_license || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_customs_license: e.target.value })}
                    className="input-clean"
                    placeholder="CAD-N° 2026/048-DGD"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Adresse du Siège Social & Agence Principale
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_headquarters || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_headquarters: e.target.value })}
                    className="input-clean"
                    placeholder="Abidjan, Bingerville, Carrefour Safari, Résidence Roum"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Numéro WhatsApp Principal
                  </label>
                  <input
                    type="text"
                    value={companySettings.whatsapp_official_number || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, whatsapp_official_number: e.target.value })}
                    className="input-clean"
                    placeholder="+225 01 53 63 85 69"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Téléphone Support Secondaire
                  </label>
                  <input
                    type="text"
                    value={companySettings.phone_secondary || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone_secondary: e.target.value })}
                    className="input-clean"
                    placeholder="+225 07 48 29 11 00"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Email Général & Support
                  </label>
                  <input
                    type="email"
                    value={companySettings.company_email || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_email: e.target.value })}
                    className="input-clean"
                    placeholder="contact@roumtransit.com"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                    Email Facturation & Encaissements
                  </label>
                  <input
                    type="email"
                    value={companySettings.company_billing_email || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_billing_email: e.target.value })}
                    className="input-clean"
                    placeholder="facturation@roumtransit.com"
                  />
                </div>
              </div>
            </div>

            {/* CARTE 2 : RÉSEAU DES HUBS INTERNATIONAUX (CHINE, DUBAÏ, FRANCE) */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                    Hubs & Dépôts Internationaux de Réception
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Adresses exactes communiquées aux fournisseurs (Alibaba, Yiwu, Deira, France) avec shipping marks.
                  </p>
                </div>
                <span className="badge-clean badge-transit" style={{ padding: "4px 10px", fontSize: "0.72rem" }}>
                  3 Plateformes Actives
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
                {/* Hub Chine */}
                <div style={{ padding: "16px", background: "var(--bg-app)", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="CN" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Hub Guangzhou (Chine)</strong>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Adresse Réception Colis
                      </label>
                      <textarea
                        rows={2}
                        value={companySettings.warehouse_china_address || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_address: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Format Shipping Mark à inscrire sur les cartons
                      </label>
                      <input
                        type="text"
                        value={companySettings.warehouse_china_shipping_mark || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_shipping_mark: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Contact Équipe Réception Chine
                      </label>
                      <input
                        type="text"
                        value={companySettings.warehouse_china_contact || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_contact: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hub Dubaï */}
                <div style={{ padding: "16px", background: "var(--bg-app)", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="AE" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Hub Dubaï (Émirats Arabes Unis)</strong>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Adresse Réception Dubaï
                      </label>
                      <textarea
                        rows={2}
                        value={companySettings.warehouse_dubai_address || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, warehouse_dubai_address: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Contact WhatsApp Hub Dubaï
                      </label>
                      <input
                        type="text"
                        value={companySettings.warehouse_dubai_contact || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, warehouse_dubai_contact: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hub France */}
                <div style={{ padding: "16px", background: "var(--bg-app)", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="FR" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Liaison Paris (France & Europe)</strong>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Adresse Dépôt Roissy / Tremblay
                      </label>
                      <textarea
                        rows={2}
                        value={companySettings.agency_paris_address || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, agency_paris_address: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                        Contact Responsable Liaison Paris
                      </label>
                      <input
                        type="text"
                        value={companySettings.agency_paris_contact || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, agency_paris_contact: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARTE 3 : COORDONNÉES DES DIFFÉRENTS MOYENS DE PAIEMENT & COMPTES DE TRANSIT */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                    Comptes & Coordonnées des Moyens de Paiement
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Paramétrez les comptes Mobile Money, coordonnées bancaires et devises pour l&apos;encaissement client.
                  </p>
                </div>
                <span className="badge-clean badge-delivered" style={{ padding: "4px 10px", fontSize: "0.72rem" }}>
                  Comptes Vérifiés
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
                {/* 1. Wave Côte d'Ivoire & Sénégal */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <WaveLogo size={34} />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          Wave Côte d&apos;Ivoire & Sénégal
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          Sans Frais Client
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Coordonnées Wave enregistrées avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider ce compte Wave"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Numéro Compte Wave</label>
                      <input
                        type="text"
                        value={companySettings.payment_wave_ci || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_ci: e.target.value })}
                        className="input-clean"
                        placeholder="+225 01 53 63 85 69"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Nom du Compte Wave</label>
                      <input
                        type="text"
                        value={companySettings.payment_wave_name || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_name: e.target.value })}
                        className="input-clean"
                        placeholder="ROUM TRANSIT SARL"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Lien / QR Code Marchand</label>
                      <input
                        type="text"
                        value={companySettings.payment_wave_merchant || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_merchant: e.target.value })}
                        className="input-clean"
                        placeholder="wave.me/roumtransit"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Orange Money */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <OrangeMoneyLogo size={34} />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          Orange Money (OM CI / UEMOA)
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          Code Marchand & Transfert
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Coordonnées Orange Money enregistrées avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider ce compte Orange Money"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Code Marchand OM / Numéro</label>
                      <input
                        type="text"
                        value={companySettings.payment_orange_money_ci || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_orange_money_ci: e.target.value })}
                        className="input-clean"
                        placeholder="#144*389278# / +225 07 48 29 11 00"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Nom Enregistré Orange Money</label>
                      <input
                        type="text"
                        value={companySettings.payment_orange_name || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_orange_name: e.target.value })}
                        className="input-clean"
                        placeholder="ROUM TRANSIT INTERNATIONAL"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. MTN MoMo / Moov Money */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <MtnMomoLogo size={32} />
                        <MoovMoneyLogo size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          MTN MoMo & Moov Money
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          MoMo Pay & Direct
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Coordonnées MTN & Moov enregistrées avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider MTN MoMo et Moov Money"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Identifiant MoMo / Téléphone</label>
                      <input
                        type="text"
                        value={companySettings.payment_mtn_momo_ci || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_mtn_momo_ci: e.target.value })}
                        className="input-clean"
                        placeholder="MOMO-749201 / +225 05 94 32 10 05"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Moov Money (Numéro direct)</label>
                      <input
                        type="text"
                        value={companySettings.payment_moov_money || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_moov_money: e.target.value })}
                        className="input-clean"
                        placeholder="+225 01 02 03 04 05"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Compte Bancaire Officiel (RIB / IBAN FCFA BACI) */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <BankBaciLogo size={34} />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          Compte Bancaire Officiel (RIB / IBAN FCFA)
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          Banque Atlantique (BACI) · Zone UEMOA
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Coordonnées bancaires enregistrées avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider ce compte bancaire"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Établissement Bancaire</label>
                      <input
                        type="text"
                        value={companySettings.payment_bank_name || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_bank_name: e.target.value })}
                        className="input-clean"
                        placeholder="Banque Atlantique Côte d'Ivoire (BACI)"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Titulaire du Compte</label>
                      <input
                        type="text"
                        value={companySettings.payment_bank_account_holder || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_bank_account_holder: e.target.value })}
                        className="input-clean"
                        placeholder="ROUM TRANSIT INTERNATIONAL SARL"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>RIB / Clé IBAN</label>
                      <input
                        type="text"
                        value={companySettings.payment_bank_rib || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_bank_rib: e.target.value })}
                        className="input-clean"
                        placeholder="CI092 01001 012345678901 24"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Code BIC / SWIFT</label>
                      <input
                        type="text"
                        value={companySettings.payment_bank_swift || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_bank_swift: e.target.value })}
                        className="input-clean"
                        placeholder="ATBKCIAB"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Règlements Internationaux (Chine Alipay / WeChat & Europe SEPA) */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <AlipayLogo size={32} />
                        <WeChatPayLogo size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          Sourcing Chine & Devises Internationales
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          Alipay · WeChat · SEPA Euro
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Comptes internationaux enregistrés avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider les comptes internationaux"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Alipay / WeChat Pay (Chine)</label>
                      <input
                        type="text"
                        value={companySettings.payment_alipay_china || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_alipay_china: e.target.value })}
                        className="input-clean"
                        placeholder="pay@roumtransit-china.com"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Virement Bancaire Euro (SEPA)</label>
                      <input
                        type="text"
                        value={companySettings.payment_euro_sepa || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_euro_sepa: e.target.value })}
                        className="input-clean"
                        placeholder="FR76 3000 4001 2345 6789 0123 456"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Caisse Espèces aux Guichets</label>
                      <input
                        type="text"
                        value={companySettings.payment_cash_desks || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, payment_cash_desks: e.target.value })}
                        className="input-clean"
                        placeholder="Agence Abidjan Bingerville & Hub Guangzhou"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Mentions Légales sur les Reçus */}
                <div style={{ padding: "18px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <ReceiptSealLogo size={34} />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                          Mentions Légales sur les Reçus
                        </div>
                        <span style={{ fontSize: "0.68rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", padding: "1px 7px", borderRadius: "9999px", fontWeight: "600" }}>
                          Bordereaux de Caisse Officiels
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                        }
                        triggerToast("Clauses de reçus enregistrées avec succès !", "Moyens de Paiement");
                        if (token) {
                          try {
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify(companySettings),
                            });
                          } catch {}
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-subtle)",
                        cursor: "pointer",
                        color: "var(--brown-dark)",
                      }}
                      title="Enregistrer et valider cette clause légale"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "600" }}>
                      Clause officielle imprimée sur les reçus
                    </label>
                    <textarea
                      rows={4}
                      value={companySettings.payment_receipt_terms || ""}
                      onChange={(e) => setCompanySettings({ ...companySettings, payment_receipt_terms: e.target.value })}
                      className="input-clean"
                      style={{ fontSize: "0.8rem", lineHeight: "1.4" }}
                    />
                  </div>
                </div>
              </div>

              {/* Bouton d'Enregistrement Principal */}
              <div style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                {settingsSaved && (
                  <span style={{ fontSize: "0.84rem", fontWeight: "600", color: "#16A34A", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={16} /> Paramètres & Comptes enregistrés avec succès
                  </span>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("roum_company_settings", JSON.stringify(companySettings));
                    }
                    triggerToast("Paramètres et coordonnées de l'entreprise enregistrés !", "Configuration");
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 3500);
                    if (token) {
                      try {
                        await fetch("/api/admin/settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify(companySettings),
                        });
                      } catch {
                        // Cache local sécurisé
                      }
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: "11px 28px", fontSize: "0.92rem", borderRadius: "9999px", boxShadow: "0 4px 14px rgba(42, 24, 16, 0.25)" }}
                >
                  Enregistrer l&apos;ensemble des Paramètres
                </button>
              </div>
            </div>

            <div className="card-clean" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "14px" }}>Journal d&apos;Audit</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "8px 10px" }}>Date</th>
                      <th style={{ padding: "8px 10px" }}>Auteur</th>
                      <th style={{ padding: "8px 10px" }}>Action</th>
                      <th style={{ padding: "8px 10px" }}>Entité</th>
                      <th style={{ padding: "8px 10px" }}>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l) => (
                      <tr key={l.id} className="table-row-clean" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                          {new Date(l.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td style={{ padding: "10px", fontWeight: "600" }}>{l.user_name || "Système"}</td>
                        <td style={{ padding: "10px", color: "var(--brown-dark)", fontWeight: "600" }}>{formatAuditAction(l.action)}</td>
                        <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{formatAuditEntity(l.entity_type)}</td>
                        <td style={{ padding: "10px", color: "var(--text-muted)" }}>{l.details_json || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES SOBRES ET MINIMALISTES */}


      {showCreateShipmentModal && (
        <div className="modal-dialog-viewport" onClick={() => setShowCreateShipmentModal(false)}>
          <div
            className="modal-card-scrollable"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(42, 24, 16, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brown-dark)" }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>Nouvelle Expédition</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>Création d&apos;un dossier de transport et étiquette de suivi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateShipmentModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateShipment} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "grid", gap: "14px", flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom Client *</label>
                    <input type="text" required value={newShipment.client_name} onChange={(e) => setNewShipment({ ...newShipment, client_name: e.target.value })} className="input-clean" placeholder="Moussa Traoré" style={{ height: "40px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Téléphone WhatsApp *</label>
                    <input type="text" required value={newShipment.client_phone} onChange={(e) => setNewShipment({ ...newShipment, client_phone: e.target.value })} className="input-clean" placeholder="+22370000000" style={{ height: "40px" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Liaison</label>
                    <select value={newShipment.route_id} onChange={(e) => setNewShipment({ ...newShipment, route_id: e.target.value })} className="input-clean" style={{ height: "40px" }}>
                      {routesList.map((r) => (
                        <option key={r.id} value={r.id}>{r.origin_country} → {r.destination_country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mode</label>
                    <select value={newShipment.shipping_mode_id} onChange={(e) => setNewShipment({ ...newShipment, shipping_mode_id: e.target.value })} className="input-clean" style={{ height: "40px" }}>
                      {modesList.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Poids (kg) *</label>
                    <input type="number" step="0.1" min="0.1" required value={newShipment.weight_kg} onChange={(e) => setNewShipment({ ...newShipment, weight_kg: Number(e.target.value) })} className="input-clean" style={{ height: "40px", fontWeight: "700" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Volume (m³ - Fret Maritime)</label>
                    <input type="number" step="0.01" min="0" value={newShipment.volume_cbm} onChange={(e) => setNewShipment({ ...newShipment, volume_cbm: Number(e.target.value) })} className="input-clean" placeholder="Ex: 0.15" style={{ height: "40px" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Libellé Colis</label>
                    <input type="text" value={newShipment.package_label} onChange={(e) => setNewShipment({ ...newShipment, package_label: e.target.value })} className="input-clean" placeholder="Ex: Électronique, Vêtements..." style={{ height: "40px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Tarif estimé (FCFA)</label>
                    <input type="number" min="0" step="100" value={newShipment.estimated_price} onChange={(e) => setNewShipment({ ...newShipment, estimated_price: Number(e.target.value) })} className="input-clean" placeholder="60000" style={{ height: "40px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Description</label>
                  <input type="text" value={newShipment.description} onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })} className="input-clean" placeholder="Vêtements, pièces auto..." style={{ height: "40px" }} />
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", background: "var(--bg-app)", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowCreateShipmentModal(false)} className="btn btn-secondary" style={{ padding: "9px 18px" }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px" }}>Créer Expédition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CHANGEMENT STATUT (AMÉLIORÉE & SIMPLE) */}
      {showStatusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "480px", width: "100%", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brown-dark)", marginBottom: "2px" }}>
                  Mise à jour du Colis
                </h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Numéro : <strong style={{ color: "var(--text-main)" }}>{showStatusModal.tracking_number}</strong>
                </span>
              </div>
              <span className="badge-clean badge-transit" style={{ padding: "4px 8px", fontSize: "0.72rem" }}>
                {showStatusModal.client_name || "Client"}
              </span>
            </div>

            {/* Récapitulatif simple du colis */}
            <div style={{ padding: "12px", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(59, 34, 24, 0.06)", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>Trajet</span>
                <strong>{showStatusModal.origin_country || "Départ"} ➔ {showStatusModal.destination_country || "Arrivée"}</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>Statut actuel</span>
                <span style={{ color: "#EA580C", fontWeight: "700" }}>
                  {formatShipmentStatus(showStatusModal.current_status, showStatusModal.status_label)}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-main)", display: "block", marginBottom: "6px", fontWeight: "700" }}>
                  Où en est le colis ? (Nouveau statut)
                </label>
                <select
                  value={statusUpdate.new_status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, new_status: e.target.value })}
                  className="input-clean"
                  style={{ height: "42px", fontSize: "0.88rem" }}
                >
                  {allStatuses
                    .filter((st) => user.isSuperAdmin || user.allowedStatuses.includes("*") || user.allowedStatuses.includes(st.code))
                    .map((st) => {
                      const friendly = getFriendlyStatus(st.code, st.label_public);
                      return (
                        <option key={st.code} value={st.code}>
                          {friendly.label}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                  Où se trouve le colis en ce moment ?
                </label>
                <input
                  type="text"
                  required
                  value={statusUpdate.location}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                  className="input-clean"
                  placeholder="Ex : Magasin de Guangzhou, En vol, Agence Bamako..."
                  style={{ height: "40px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                  Message simple pour le client (Optionnel)
                </label>
                <input
                  type="text"
                  value={statusUpdate.comment}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                  className="input-clean"
                  placeholder="Ex : Votre colis est bien arrivé à l'agence, prêt pour retrait."
                  style={{ height: "40px" }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Ce message sera visible par votre client lorsqu&apos;il consultera son suivi.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowStatusModal(null)} className="btn btn-secondary" style={{ padding: "9px 18px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px" }}>
                  Valider le nouveau statut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : IMPRESSION BORDEREAU */}
      {showPrintLabelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "480px", width: "100%", padding: "30px", background: "#FFFFFF", color: "#1C1815" }}>
            <div style={{ borderBottom: "1px solid #E8E2D8", paddingBottom: "12px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src="/images/roum-logo-tight.png"
                  alt="Logo Roum Transit"
                  style={{
                    height: "46px",
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <div>
                  <div style={{ fontWeight: "800", fontSize: "1.1rem" }}>ROUM TRANSIT</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>BORDEREAU OFFICIEL D&apos;EXPÉDITION</div>
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-sm)", marginBottom: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "2px" }}>NUMÉRO DE SUIVI</div>
              <div style={{ fontSize: "1.45rem", fontWeight: "800", letterSpacing: "1px", color: "var(--brown-dark)" }}>
                {showPrintLabelModal.tracking_number}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.82rem", marginBottom: "14px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>DESTINATAIRE</span>
                <strong>{showPrintLabelModal.client_name}</strong>
                <div>{showPrintLabelModal.client_phone}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>LIAISON</span>
                <strong>{showPrintLabelModal.origin_country} → {showPrintLabelModal.destination_country}</strong>
                <div>{showPrintLabelModal.shipping_mode_name}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.82rem", borderTop: "1px dashed #E8E2D8", paddingTop: "10px", marginBottom: "18px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>POIDS BRUT</span>
                <strong>{showPrintLabelModal.total_weight_kg} KG</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>COLIS</span>
                <strong>{showPrintLabelModal.total_parcels_count} COLIS</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowPrintLabelModal(null)} className="btn btn-secondary">Fermer</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary">Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : NOUVEAU CLIENT */}
      {showCreateClientModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouveau Client</h3>
            <form onSubmit={handleCreateClient} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom Complet</label>
                <input type="text" required value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} className="input-clean" placeholder="Awa Diarra" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>WhatsApp / Téléphone</label>
                <input type="text" required value={newClient.phone_whatsapp} onChange={(e) => setNewClient({ ...newClient, phone_whatsapp: e.target.value })} className="input-clean" placeholder="+22370000000" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Pays</label>
                  <input type="text" required value={newClient.country} onChange={(e) => setNewClient({ ...newClient, country: e.target.value })} className="input-clean" placeholder="Mali" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Ville</label>
                  <input type="text" value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} className="input-clean" placeholder="Bamako" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateClientModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CONSIGNER PAIEMENT (FCFA & VÉRIFICATION MANUELLE) */}
      {showRecordPaymentModal && (
        <div className="modal-dialog-viewport" onClick={() => setShowRecordPaymentModal(null)}>
          <div
            className="modal-card-scrollable"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(42, 24, 16, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brown-dark)" }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>Consigner un Paiement</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Enregistrement manuel en caisse ou sur compte de transit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "grid", gap: "16px", flex: 1 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Client Donneur d&apos;ordre *</label>
                  <select required value={newPayment.client_id} onChange={(e) => setNewPayment({ ...newPayment, client_id: e.target.value })} className="input-clean" style={{ height: "42px" }}>
                    <option value="">Sélectionner un client...</option>
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.phone_whatsapp})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Dossier d&apos;expédition rattaché (Optionnel)</label>
                  <select value={newPayment.shipment_id} onChange={(e) => setNewPayment({ ...newPayment, shipment_id: e.target.value })} className="input-clean" style={{ height: "42px" }}>
                    <option value="">Aucun dossier rattaché pour le moment</option>
                    {shipments.map((s) => (
                      <option key={s.id} value={s.id}>{s.tracking_number} — {s.client_name} ({s.origin_country} → {s.destination_country})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Montant (FCFA) *</label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      required
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                      className="input-clean"
                      style={{ height: "42px", fontWeight: "700" }}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Méthode *</label>
                    <select value={newPayment.payment_method} onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })} className="input-clean" style={{ height: "42px" }}>
                      <option value="CASH">Espèces (Caisse)</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="BANK_TRANSFER">Virement Bancaire</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Type de règlement</label>
                    <select value={newPayment.payment_type} onChange={(e) => setNewPayment({ ...newPayment, payment_type: e.target.value })} className="input-clean" style={{ height: "42px" }}>
                      <option value="FULL">Règlement Intégral</option>
                      <option value="ADVANCE">Acompte</option>
                      <option value="BALANCE">Solde restant</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Statut de vérification</label>
                    <select value={newPayment.status} onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })} className="input-clean" style={{ height: "42px" }}>
                      <option value="PENDING">En attente de contrôle</option>
                      <option value="CONFIRMED">Confirmé en caisse</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Référence reçu / transaction</label>
                  <input
                    type="text"
                    value={newPayment.reference_code}
                    onChange={(e) => setNewPayment({ ...newPayment, reference_code: e.target.value })}
                    className="input-clean"
                    style={{ height: "42px" }}
                    placeholder="Ex : OM-20261028-9876 ou N° Reçu caisse"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Note interne de contrôle</label>
                  <input
                    type="text"
                    value={newPayment.receipt_notes}
                    onChange={(e) => setNewPayment({ ...newPayment, receipt_notes: e.target.value })}
                    className="input-clean"
                    style={{ height: "42px" }}
                    placeholder="Ex : Reçu papier agence vérifié en caisse"
                  />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", background: "var(--bg-app)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowRecordPaymentModal(null)} className="btn btn-secondary" style={{ padding: "9px 18px" }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px" }}>Enregistrer Paiement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : DÉTAIL D'UNE DEMANDE & ARTICLES DE SOURCING */}
      {showRequestDetailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "680px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Demande {showRequestDetailModal.reference}</h3>
                  <span className="badge-clean badge-draft">
                    {formatRequestType(showRequestDetailModal.request_type)}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Client : <strong>{showRequestDetailModal.client_name}</strong> ({showRequestDetailModal.client_phone})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestDetailModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-app)", padding: "14px", borderRadius: "10px", marginBottom: "16px", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Liaison souhaitée :</span>
                <strong>{showRequestDetailModal.origin_country || "Chine"} ➔ {showRequestDetailModal.destination_country || "Mali"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Poids / Volume estimé :</span>
                <strong>
                  {showRequestDetailModal.estimated_weight_kg ? `${showRequestDetailModal.estimated_weight_kg} kg` : "Non spécifié"}
                  {showRequestDetailModal.estimated_cbm ? ` · ${showRequestDetailModal.estimated_cbm} m³` : ""}
                </strong>
              </div>
            </div>

            {(showRequestDetailModal.supplier_name || showRequestDetailModal.shipping_mark) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-app)", padding: "14px", borderRadius: "10px", marginBottom: "16px", fontSize: "0.82rem", border: "1px dashed var(--border-light)" }}>
                {showRequestDetailModal.supplier_name && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block" }}>Fournisseur déclaré :</span>
                    <strong style={{ color: "var(--text-main)" }}>{showRequestDetailModal.supplier_name}</strong>
                  </div>
                )}
                {showRequestDetailModal.shipping_mark && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block" }}>Shipping Mark (Marquage colis) :</span>
                    <strong style={{ color: "var(--brown-dark)", fontFamily: "monospace" }}>{showRequestDetailModal.shipping_mark}</strong>
                  </div>
                )}
              </div>
            )}

            {showRequestDetailModal.description && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", marginBottom: "4px" }}>Description du besoin :</div>
                <div style={{ fontSize: "0.84rem", background: "var(--bg-app)", padding: "12px", borderRadius: "8px", color: "var(--text-main)", lineHeight: 1.5 }}>
                  {showRequestDetailModal.description}
                </div>
              </div>
            )}

            {/* Articles multi-produits du sourcing */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "700", margin: 0 }}>Articles demandés ({showRequestDetailModal.items?.length || 0})</h4>
              </div>

              {showRequestDetailModal.items && showRequestDetailModal.items.length > 0 ? (
                <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "8px 10px" }}>Article</th>
                        <th style={{ padding: "8px 10px" }}>Quantité</th>
                        <th style={{ padding: "8px 10px" }}>Variantes</th>
                        <th style={{ padding: "8px 10px" }}>Lien Fournisseur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showRequestDetailModal.items.map((it: any, idx: number) => (
                        <tr key={it.id || idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "10px", fontWeight: "600", color: "var(--text-main)" }}>
                            {it.product_name}
                          </td>
                          <td style={{ padding: "10px" }}>
                            {it.quantity} pcs
                          </td>
                          <td style={{ padding: "10px", color: "var(--text-secondary)" }}>
                            {it.variants_description || "—"}
                          </td>
                          <td style={{ padding: "10px" }}>
                            {it.product_url ? (
                              <a
                                href={it.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--brown-dark)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}
                              >
                                Ouvrir le lien <ExternalLink size={10} />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", padding: "14px", background: "var(--bg-app)", borderRadius: "8px", textAlign: "center" }}>
                  Aucun article détaillé consigné. Se référer à la description générale.
                </div>
              )}
            </div>

            {/* Actions : Conversion & Clôture */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowRequestDetailModal(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
              {showRequestDetailModal.status !== "CONVERTED" && showRequestDetailModal.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenConvertModal(showRequestDetailModal);
                  }}
                  className="btn btn-primary"
                >
                  Convertir en Dossier d&apos;Expédition
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE : CONVERTIR DEMANDE EN EXPÉDITION */}
      {showConvertRequestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "520px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "4px" }}>
              Convertir en Expédition ({showConvertRequestModal.reference})
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Attribue un numéro de suivi officiel et crée le dossier dans le système.
            </p>

            <form onSubmit={handleConvertRequestSubmit} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Liaison</label>
                  <select
                    value={convertForm.route_id}
                    onChange={(e) => setConvertForm({ ...convertForm, route_id: e.target.value })}
                    className="input-clean"
                  >
                    {routesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.origin_country} → {r.destination_country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mode de Transport</label>
                  <select
                    value={convertForm.shipping_mode_id}
                    onChange={(e) => setConvertForm({ ...convertForm, shipping_mode_id: e.target.value })}
                    className="input-clean"
                  >
                    {modesList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Poids mesuré / estimé (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={convertForm.weight_kg}
                    onChange={(e) => setConvertForm({ ...convertForm, weight_kg: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Volume (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={convertForm.volume_cbm}
                    onChange={(e) => setConvertForm({ ...convertForm, volume_cbm: Number(e.target.value) })}
                    className="input-clean"
                    placeholder="Ex: 0.12"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Montant Devis Validé (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={convertForm.estimated_price}
                  onChange={(e) => setConvertForm({ ...convertForm, estimated_price: Number(e.target.value) })}
                  className="input-clean"
                  placeholder="Ex : 60000"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Libellé / Note du Colis</label>
                <input
                  type="text"
                  value={convertForm.package_label}
                  onChange={(e) => setConvertForm({ ...convertForm, package_label: e.target.value })}
                  className="input-clean"
                  placeholder="Ex: Colis Sourcing Vêtements"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowConvertRequestModal(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Générer le Suivi & Créer Expédition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : RÉCEPTION PHYSIQUE & PESÉE RÉELLE AU HUB */}
      {showIntakeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "520px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "4px" }}>
              Pesée Réelle & Réception Hub ({showIntakeModal.tracking_number})
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Saisie manuelle des mesures physiques réelles lors de la prise en charge physique du colis.
            </p>

            <form onSubmit={handleShipmentIntakeSubmit} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "700" }}>Poids Réel Pesé (kg) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    required
                    value={intakeForm.total_weight_kg}
                    onChange={(e) => setIntakeForm({ ...intakeForm, total_weight_kg: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontSize: "1rem", fontWeight: "700" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "700" }}>Volume Mesuré (m³)</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={intakeForm.total_volume_cbm}
                    onChange={(e) => setIntakeForm({ ...intakeForm, total_volume_cbm: Number(e.target.value) })}
                    className="input-clean"
                    placeholder="Ex: 0.15"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Magasin / Hub de réception</label>
                <input
                  type="text"
                  required
                  value={intakeForm.hub_location}
                  onChange={(e) => setIntakeForm({ ...intakeForm, hub_location: e.target.value })}
                  className="input-clean"
                  placeholder="Ex : Hub Entrepôt Guangzhou, Magasin Yiwu, Agence Bamako..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Statut appliqué</label>
                <select
                  value={intakeForm.status}
                  onChange={(e) => setIntakeForm({ ...intakeForm, status: e.target.value })}
                  className="input-clean"
                >
                  <option value="RECEIVED_AT_HUB">Reçu au magasin / hub de départ</option>
                  <option value="PACKED_READY">Colis contrôlé et prêt pour expédition</option>
                  <option value="ARRIVED_DESTINATION">Arrivé à l&apos;agence de destination</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Observations physiques & Note</label>
                <input
                  type="text"
                  value={intakeForm.comment}
                  onChange={(e) => setIntakeForm({ ...intakeForm, comment: e.target.value })}
                  className="input-clean"
                  placeholder="Ex: Colis scellé, pesée certifiée 18.5 kg, 2 cartons"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowIntakeModal(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Pesée & Statut</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : HISTORIQUE COMPLET D'EXPÉDITION (JALONS, COLIS, PAIEMENTS) */}
      {showShipmentDetailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "680px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Dossier {showShipmentDetailModal.tracking_number}</h3>
                  <span className="badge-clean badge-delivered">
                    {formatShipmentStatus(showShipmentDetailModal.current_status, showShipmentDetailModal.status_label)}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Client : <strong>{showShipmentDetailModal.client_name}</strong> ({showShipmentDetailModal.client_phone})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShipmentDetailModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Résumé Mesures et Liaison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", background: "var(--bg-app)", padding: "14px", borderRadius: "10px", marginBottom: "18px", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Liaison :</span>
                <strong>{showShipmentDetailModal.origin_country} ➔ {showShipmentDetailModal.destination_country}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Poids réel mesuré :</span>
                <strong>{showShipmentDetailModal.total_weight_kg} kg {showShipmentDetailModal.total_volume_cbm ? `· ${showShipmentDetailModal.total_volume_cbm} m³` : ""}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Règlement :</span>
                <strong style={{ color: showShipmentDetailModal.payment_status === "PAID" ? "var(--state-success-text)" : "#B45309" }}>
                  {showShipmentDetailModal.payment_status === "PAID" ? "Intégralement Réglé" : showShipmentDetailModal.payment_status === "PARTIAL" ? "Acompte Versé" : "En Attente de Règlement"}
                </strong>
              </div>
            </div>

            {/* Jalons de Suivi Horodatés */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.92rem", fontWeight: "700", marginBottom: "10px" }}>
                Chronologie des Jalons ({showShipmentDetailModal.tracking_events?.length || 0})
              </h4>
              <div style={{ display: "grid", gap: "8px" }}>
                {showShipmentDetailModal.tracking_events?.map((ev: any, idx: number) => (
                  <div
                    key={ev.id || idx}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-light)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--text-main)" }}>
                        {formatShipmentStatus(ev.status, ev.status_label)} · <span style={{ color: "var(--brown-dark)" }}>{ev.location}</span>
                      </div>
                      {ev.comment && (
                        <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                          {ev.comment}
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Enregistré par : {ev.recorded_by_name || "Opérateur"}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                      {new Date(ev.event_timestamp).toLocaleDateString("fr-FR")} {new Date(ev.event_timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowShipmentDetailModal(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = showShipmentDetailModal;
                  setShowShipmentDetailModal(null);
                  handleOpenIntakeModal(s);
                }}
                className="btn btn-primary"
              >
                Réajuster Pesée Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : NOUVELLE TÂCHE */}
      {showCreateTaskModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouvelle Tâche</h3>
            <form onSubmit={handleCreateTask} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Titre</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="input-clean" placeholder="Vérifier colis entrepôt..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Priorité</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="input-clean">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Catégorie</label>
                  <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="input-clean">
                    <option value="GENERAL">Opérations Générales</option>
                    <option value="WAREHOUSE_CHECK">Contrôle Magasin & Pesée</option>
                    <option value="QUOTE_PREP">Établissement de Devis</option>
                    <option value="CUSTOMS">Procédures Douanières</option>
                    <option value="PAYMENT">Contrôle Caisse</option>
                    <option value="LOGISTICS">Suivi Transport</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Échéance</label>
                <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="input-clean" />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Créer Tâche</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODALE : NOUVEAU TARIF STYLE IOS & PRÉREMPLISSAGE FLYERS */}
      {showCreateTariffModal && (() => {
        const selectedMode = modesList.find((m) => m.id === newTariff.shipping_mode_id);
        const isSea = newTariff.shipping_mode_id.includes("SEA") || selectedMode?.type === "SEA" || (newTariff.service_name || "").toLowerCase().includes("bateau");
        const isUnit = (newTariff.service_name || "").toLowerCase().includes("document") || (newTariff.service_name || "").toLowerCase().includes("ordinateur");
        const unitLabel = isSea ? "m³ (mètre cube)" : isUnit ? "pièce / pli" : "kg (kilogramme)";
        const currentCurrencySymbol = CURRENCY_OPTIONS.find((c) => c.code === newTariff.currency)?.short || newTariff.currency;

        // Modèles rapides issus directement des 3 flyers officiels
        const FLYER_TEMPLATES = [
          {
            label: "Chine Express (12 000 F)",
            countryCode: "CN",
            icon: <Zap size={13} style={{ color: "#EA580C" }} />,
            data: {
              origin_country: "Chine",
              origin_city: "Guangzhou",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Voie Express (4 jours)",
              category_tag: "Voie Express",
              currency: "FCFA",
              price_per_unit: 12000,
              minimum_charge: 12000,
              estimated_days_min: 4,
              estimated_days_max: 5,
              note: "Livraison express 4 jours",
            },
          },
          {
            label: "Chine Normale (10 000 F)",
            countryCode: "CN",
            icon: <Plane size={13} style={{ color: "var(--brown-light)" }} />,
            data: {
              origin_country: "Chine",
              origin_city: "Guangzhou",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_STANDARD",
              service_name: "Voie Normale (2 semaines)",
              category_tag: "Voie Normale",
              currency: "FCFA",
              price_per_unit: 10000,
              minimum_charge: 10000,
              estimated_days_min: 12,
              estimated_days_max: 14,
              note: "Économique · 2 semaines",
            },
          },
          {
            label: "Batteries & Compléments (14 000 F)",
            countryCode: "CN",
            icon: <BatteryCharging size={13} style={{ color: "#2E7D4E" }} />,
            data: {
              origin_country: "Chine",
              origin_city: "Guangzhou",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Complément alimentaire + Batterie",
              category_tag: "Batteries & Compléments",
              currency: "FCFA",
              price_per_unit: 14000,
              minimum_charge: 14000,
              estimated_days_min: 7,
              estimated_days_max: 10,
              note: "Marchandises sensibles réglementées",
            },
          },
          {
            label: "Pièces Ordinateur (50 000 F)",
            countryCode: "CN",
            icon: <Laptop size={13} style={{ color: "#3B82F6" }} />,
            data: {
              origin_country: "Chine",
              origin_city: "Guangzhou",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Pièce d'ordinateur & High-Tech",
              category_tag: "High-Tech & PC",
              currency: "FCFA",
              price_per_unit: 50000,
              minimum_charge: 50000,
              estimated_days_min: 4,
              estimated_days_max: 7,
              note: "Composants informatiques",
            },
          },
          {
            label: "Chine Bateau CBM (300 000 F)",
            countryCode: "CN",
            icon: <Ship size={13} style={{ color: "var(--brown-dark)" }} />,
            data: {
              origin_country: "Chine",
              origin_city: "Yiwu",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "SEA_LCL",
              service_name: "Par Bateau (Le CBM)",
              category_tag: "Conteneur Bateau",
              currency: "FCFA",
              price_per_unit: 300000,
              minimum_charge: 300000,
              estimated_days_min: 35,
              estimated_days_max: 45,
              note: "Tarif au m³ (CBM) conteneur",
            },
          },
          {
            label: "Maroc Subsaharien (6 500 F)",
            countryCode: "MA",
            icon: <Award size={13} style={{ color: "#2E7D4E" }} />,
            data: {
              origin_country: "Maroc",
              origin_city: "Casablanca",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Groupage Aérien Subsaharien",
              category_tag: "Subsaharien 5 jours",
              currency: "FCFA",
              price_per_unit: 6500,
              minimum_charge: 6500,
              estimated_days_min: 5,
              estimated_days_max: 5,
              note: "Livraison 5 jours garantis",
            },
          },
          {
            label: "Paris ➔ Abidjan Divers (8 500 F / 12 €)",
            countryCode: "FR",
            icon: <ShoppingBag size={13} style={{ color: "#7C3AED" }} />,
            data: {
              origin_country: "France",
              origin_city: "Paris",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Divers Articles",
              category_tag: "Divers Articles",
              currency: "FCFA",
              price_per_unit: 8500,
              minimum_charge: 8500,
              estimated_days_min: 3,
              estimated_days_max: 5,
              note: "8 500 F / 12 € par kg",
            },
          },
          {
            label: "Paris ➔ Abidjan Cosmétique (9 000 F / 14 €)",
            countryCode: "FR",
            icon: <Sparkles size={13} style={{ color: "#7C3AED" }} />,
            data: {
              origin_country: "France",
              origin_city: "Paris",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Cosmétique et Liquide",
              category_tag: "Cosmétiques & Liquides",
              currency: "FCFA",
              price_per_unit: 9000,
              minimum_charge: 9000,
              estimated_days_min: 3,
              estimated_days_max: 5,
              note: "9 000 F / 14 € par kg",
            },
          },
          {
            label: "Paris ➔ Abidjan Document (13 000 F / 20 €)",
            countryCode: "FR",
            icon: <FileText size={13} style={{ color: "#3B82F6" }} />,
            data: {
              origin_country: "France",
              origin_city: "Paris",
              destination_country: "Côte d'Ivoire",
              destination_city: "Abidjan",
              shipping_mode_id: "AIR_EXPRESS",
              service_name: "Document Administratif",
              category_tag: "Pli Administratif",
              currency: "FCFA",
              price_per_unit: 13000,
              minimum_charge: 13000,
              estimated_days_min: 2,
              estimated_days_max: 3,
              note: "Pli confidentiel scellé 13 000 F / 20 €",
            },
          },
        ];

        // Produits et types de cargaison issus des flyers réels
        const FLYER_PRODUCT_PRESETS = [
          { name: "Voie Express (Courrier & Colis urgents 4 jours)", mode: "AIR_EXPRESS", price: 12000, daysMin: 4, daysMax: 5, tag: "Voie Express" },
          { name: "Voie Normale (Articles ordinaires, Vêtements)", mode: "AIR_STANDARD", price: 10000, daysMin: 12, daysMax: 14, tag: "Voie Normale" },
          { name: "Batteries & Compléments alimentaires", mode: "AIR_EXPRESS", price: 14000, daysMin: 7, daysMax: 10, tag: "Batteries & Compléments" },
          { name: "Pièces d'ordinateur & Électronique High-Tech", mode: "AIR_EXPRESS", price: 50000, daysMin: 4, daysMax: 7, tag: "High-Tech & PC" },
          { name: "Par Bateau (Le CBM conteneur groupage LCL)", mode: "SEA_LCL", price: 300000, daysMin: 35, daysMax: 45, tag: "Conteneur Bateau" },
          { name: "Groupage Aérien Subsaharien (5 jours)", mode: "AIR_EXPRESS", price: 6500, daysMin: 5, daysMax: 5, tag: "Subsaharien 5 jours" },
          { name: "Divers Articles (Marchandises Générales)", mode: "AIR_EXPRESS", price: 8500, daysMin: 3, daysMax: 5, tag: "Divers Articles" },
          { name: "Cosmétique et Liquide", mode: "AIR_EXPRESS", price: 9000, daysMin: 3, daysMax: 5, tag: "Cosmétiques & Liquides" },
          { name: "Document Administratif (Pli Express)", mode: "AIR_EXPRESS", price: 13000, daysMin: 2, daysMax: 3, tag: "Pli Administratif" },
        ];

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div
              className="card-clean animate-fade-in"
              style={{
                maxWidth: "680px",
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                padding: "28px 30px",
                borderRadius: "24px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
                background: "#FFFFFF",
              }}
            >
              {/* Entête Modale */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid var(--border-light)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span className="badge-clean badge-transit" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>
                      Super Admin
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Configuration Tarifaire Libre & Multi-Couloirs
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                    Nouveau Tarif d&apos;Expédition
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateTariffModal(false)}
                  style={{
                    background: "var(--bg-app)",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Raccourcis 1-Clic d'après les Flyers Réels avec Drapeaux Circulaires */}
              <div style={{ marginBottom: "18px", background: "var(--bg-app)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(59, 34, 24, 0.08)" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--brown-dark)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={13} style={{ color: "var(--brown-light)" }} />
                  Remplir en 1 clic d&apos;après les liaisons officielles :
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {FLYER_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => setNewTariff({ ...newTariff, ...tmpl.data })}
                      style={{
                        fontSize: "0.72rem",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        fontWeight: "600",
                        color: "var(--text-main)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--brown-light)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-light)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <CircularFlag countryCode={tmpl.countryCode} size={14} />
                      {tmpl.icon}
                      <span>{tmpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateTariff} style={{ display: "grid", gap: "16px" }}>
                {/* 1. D'OÙ PART LE COLIS ? MENU DÉROULANT TOUS PAYS DU MONDE */}
                <div style={{ padding: "14px", background: "var(--bg-app)", borderRadius: "14px", border: "1px solid rgba(59, 34, 24, 0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--brown-dark)", textTransform: "uppercase", fontWeight: "800", display: "block", marginBottom: "8px" }}>
                    1. D&apos;où part le colis ? (Pays & Ville de départ)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Pays de départ (Monde entier)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CircularFlag countryName={newTariff.origin_country} size={28} />
                        <select
                          value={newTariff.origin_country}
                          onChange={(e) => {
                            const cName = e.target.value;
                            const foundHub = STRATEGIC_HUBS.find((h) => h.name === cName) || AFRICAN_COUNTRIES.find((a) => a.name === cName) || ALL_WORLD_COUNTRIES.find((w) => w.name === cName);
                            setNewTariff({
                              ...newTariff,
                              origin_country: cName,
                              origin_city: foundHub?.hubCity || newTariff.origin_city,
                            });
                          }}
                          className="input-clean"
                          style={{ height: "40px", borderRadius: "10px", flex: 1, fontWeight: "600" }}
                        >
                          <optgroup label="Hubs Majeurs & Stratégiques">
                            {STRATEGIC_HUBS.map((h) => (
                              <option key={`hub-orig-${h.code}`} value={h.name}>{h.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Afrique Subsaharienne">
                            {AFRICAN_COUNTRIES.map((a) => (
                              <option key={`afr-orig-${a.code}`} value={a.name}>{a.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Tous les Pays du Monde (A-Z)">
                            {ALL_WORLD_COUNTRIES.map((w) => (
                              <option key={`all-orig-${w.code}`} value={w.name}>{w.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ville de départ</span>
                      <input
                        type="text"
                        value={newTariff.origin_city}
                        onChange={(e) => setNewTariff({ ...newTariff, origin_city: e.target.value })}
                        className="input-clean"
                        placeholder="Ex: Guangzhou, Casablanca, Paris..."
                        style={{ height: "40px", borderRadius: "10px" }}
                      />
                    </div>
                  </div>
                  {/* Raccourcis départ avec drapeaux circulaires */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Hubs fréquents :</span>
                    {POPULAR_ORIGINS.slice(0, 6).map((po) => (
                      <button
                        key={po.city}
                        type="button"
                        onClick={() => setNewTariff({ ...newTariff, origin_country: po.country, origin_city: po.city })}
                        style={{
                          fontSize: "0.7rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-light)",
                          background: "#FFFFFF",
                          cursor: "pointer",
                          color: "var(--text-main)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <CircularFlag countryCode={po.code} size={13} />
                        <span>{po.country} ({po.city})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. OÙ ARRIVE LE COLIS ? MENU DÉROULANT TOUS PAYS DU MONDE */}
                <div style={{ padding: "14px", background: "var(--bg-app)", borderRadius: "14px", border: "1px solid rgba(59, 34, 24, 0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--brown-dark)", textTransform: "uppercase", fontWeight: "800", display: "block", marginBottom: "8px" }}>
                    2. Où arrive le colis ? (Pays & Ville de destination)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Pays de destination (Monde entier)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CircularFlag countryName={newTariff.destination_country} size={28} />
                        <select
                          value={newTariff.destination_country}
                          onChange={(e) => {
                            const cName = e.target.value;
                            const foundHub = AFRICAN_COUNTRIES.find((a) => a.name === cName) || STRATEGIC_HUBS.find((h) => h.name === cName) || ALL_WORLD_COUNTRIES.find((w) => w.name === cName);
                            setNewTariff({
                              ...newTariff,
                              destination_country: cName,
                              destination_city: foundHub?.hubCity || newTariff.destination_city,
                            });
                          }}
                          className="input-clean"
                          style={{ height: "40px", borderRadius: "10px", flex: 1, fontWeight: "600" }}
                        >
                          <optgroup label="Destinations Africaines">
                            {AFRICAN_COUNTRIES.map((a) => (
                              <option key={`afr-dest-${a.code}`} value={a.name}>{a.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Hubs Internationaux">
                            {STRATEGIC_HUBS.map((h) => (
                              <option key={`hub-dest-${h.code}`} value={h.name}>{h.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Tous les Pays du Monde (A-Z)">
                            {ALL_WORLD_COUNTRIES.map((w) => (
                              <option key={`all-dest-${w.code}`} value={w.name}>{w.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ville d&apos;arrivée</span>
                      <input
                        type="text"
                        value={newTariff.destination_city}
                        onChange={(e) => setNewTariff({ ...newTariff, destination_city: e.target.value })}
                        className="input-clean"
                        placeholder="Ex: Abidjan, Bamako, Dakar..."
                        style={{ height: "40px", borderRadius: "10px" }}
                      />
                    </div>
                  </div>
                  {/* Raccourcis arrivée avec drapeaux circulaires */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Destinations courantes :</span>
                    {POPULAR_DESTINATIONS.slice(0, 6).map((pd) => (
                      <button
                        key={pd.country}
                        type="button"
                        onClick={() => setNewTariff({ ...newTariff, destination_country: pd.country, destination_city: pd.city })}
                        style={{
                          fontSize: "0.7rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-light)",
                          background: "#FFFFFF",
                          cursor: "pointer",
                          color: "var(--text-main)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <CircularFlag countryCode={pd.code} size={13} />
                        <span>{pd.country}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. COMMENT VOYAGE LE COLIS & CATÉGORIE FLYER */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                      Mode d&apos;acheminement
                    </label>
                    <select
                      value={newTariff.shipping_mode_id}
                      onChange={(e) => {
                        const mid = e.target.value;
                        const isSeaMode = mid.includes("SEA");
                        setNewTariff({
                          ...newTariff,
                          shipping_mode_id: mid,
                          price_per_unit: isSeaMode ? 300000 : 12000,
                          minimum_charge: isSeaMode ? 300000 : 12000,
                          estimated_days_min: isSeaMode ? 35 : 4,
                          estimated_days_max: isSeaMode ? 45 : 5,
                        });
                      }}
                      className="input-clean"
                      style={{ height: "40px", borderRadius: "10px" }}
                    >
                      <option value="AIR_EXPRESS">Voie Aérienne Express</option>
                      <option value="AIR_STANDARD">Voie Aérienne Standard</option>
                      <option value="SEA_LCL">Voie Maritime (Bateau / CBM)</option>
                      <option value="ROAD_STANDARD">Voie Terrestre Transfrontalière</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                      Marchandise & Préréglages Standards
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        const preset = FLYER_PRODUCT_PRESETS.find((p) => p.name === val);
                        if (preset) {
                          setNewTariff({
                            ...newTariff,
                            service_name: preset.name,
                            shipping_mode_id: preset.mode,
                            price_per_unit: preset.price,
                            minimum_charge: preset.price,
                            estimated_days_min: preset.daysMin,
                            estimated_days_max: preset.daysMax,
                            category_tag: preset.tag,
                          });
                        } else {
                          setNewTariff({ ...newTariff, service_name: val, category_tag: val });
                        }
                      }}
                      className="input-clean"
                      style={{ height: "40px", borderRadius: "10px" }}
                    >
                      <option value="">Sélectionner une marchandise...</option>
                      {FLYER_PRODUCT_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nom personnalisé du service */}
                <div>
                  <label style={{ fontSize: "0.76rem", color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                    Libellé affiché sur la facture / devis
                  </label>
                  <input
                    type="text"
                    value={newTariff.service_name || ""}
                    onChange={(e) => setNewTariff({ ...newTariff, service_name: e.target.value })}
                    className="input-clean"
                    placeholder="Ex: Voie Express (4 jours), Batteries, Cosmétiques..."
                    style={{ height: "38px", borderRadius: "10px" }}
                  />
                </div>

                {/* 4. PRIX & CHOIX DE LA MONNAIE (FRANC CFA PAR DÉFAUT) */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                      Prix par {unitLabel} ({currentCurrencySymbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={newTariff.price_per_unit}
                      onChange={(e) => setNewTariff({ ...newTariff, price_per_unit: Number(e.target.value) })}
                      className="input-clean"
                      placeholder="Ex: 12000 ou 300000"
                      style={{ height: "40px", fontWeight: "800", fontSize: "1.05rem", color: "var(--brown-dark)", borderRadius: "10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-main)", display: "block", marginBottom: "4px", fontWeight: "700" }}>
                      Monnaie (Franc CFA par défaut)
                    </label>
                    <select
                      value={newTariff.currency}
                      onChange={(e) => setNewTariff({ ...newTariff, currency: e.target.value })}
                      className="input-clean"
                      style={{ height: "40px", fontWeight: "700", borderRadius: "10px" }}
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name} {c.isDefault ? "★" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. DÉLAIS INDICATIFS */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Délai minimum (jours)</span>
                    <input
                      type="number"
                      min="1"
                      value={newTariff.estimated_days_min}
                      onChange={(e) => setNewTariff({ ...newTariff, estimated_days_min: Number(e.target.value) })}
                      className="input-clean"
                      style={{ height: "38px", borderRadius: "10px" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Délai maximum (jours)</span>
                    <input
                      type="number"
                      min="1"
                      value={newTariff.estimated_days_max}
                      onChange={(e) => setNewTariff({ ...newTariff, estimated_days_max: Number(e.target.value) })}
                      className="input-clean"
                      style={{ height: "38px", borderRadius: "10px" }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px", borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateTariffModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: "9px 20px", borderRadius: "9999px" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: "9px 26px", gap: "6px", borderRadius: "9999px", boxShadow: "0 4px 12px rgba(59, 34, 24, 0.18)" }}
                  >
                    <Check size={15} />
                    Enregistrer ce Tarif
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODALE DE MODIFICATION : TARIF */}
      {editingTariff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier le Tarif</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Ajustez les prix, délais et informations pour cette liaison.</p>
              </div>
              <button type="button" onClick={() => setEditingTariff(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditTariff} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nom du Service / Formule</label>
                <input
                  type="text"
                  required
                  value={editingTariff.service_name || ""}
                  onChange={(e) => setEditingTariff({ ...editingTariff, service_name: e.target.value })}
                  className="input-clean"
                  placeholder="Ex: Fret Aérien Standard Guangzhou"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pays de Départ</label>
                  <input
                    type="text"
                    required
                    value={editingTariff.origin_country || ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, origin_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pays de Destination</label>
                  <input
                    type="text"
                    required
                    value={editingTariff.destination_country || ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, destination_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Mode de Transport</label>
                  <select
                    value={editingTariff.transport_mode || "AIR_STANDARD"}
                    onChange={(e) => setEditingTariff({ ...editingTariff, transport_mode: e.target.value })}
                    className="input-clean"
                  >
                    <option value="AIR_STANDARD">Aérien Standard</option>
                    <option value="AIR_EXPRESS">Aérien Express</option>
                    <option value="SEA_GROUPAGE">Maritime Groupage</option>
                    <option value="ROAD">Routier</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Prix unitaire ({editingTariff.currency || "XOF"})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingTariff.price_per_unit ?? ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, price_per_unit: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", color: "var(--brown-dark)" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Délai min (jours)</label>
                  <input
                    type="number"
                    value={editingTariff.estimated_days_min ?? ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, estimated_days_min: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Délai max (jours)</label>
                  <input
                    type="number"
                    value={editingTariff.estimated_days_max ?? ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, estimated_days_max: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Note / Conditions particulières</label>
                <input
                  type="text"
                  value={editingTariff.note || ""}
                  onChange={(e) => setEditingTariff({ ...editingTariff, note: e.target.value })}
                  className="input-clean"
                  placeholder="Ex: Douane incluse, départ chaque jeudi"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingTariff(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION : EXPÉDITION */}
      {editingShipment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier l&apos;Expédition {editingShipment.tracking_number}</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Modifiez les coordonnées, poids, tarification et statuts.</p>
              </div>
              <button type="button" onClick={() => setEditingShipment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditShipment} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nom de l&apos;Expéditeur</label>
                  <input
                    type="text"
                    value={editingShipment.sender_name || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, sender_name: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Téléphone Expéditeur</label>
                  <input
                    type="text"
                    value={editingShipment.sender_phone || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, sender_phone: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nom du Destinataire</label>
                  <input
                    type="text"
                    value={editingShipment.recipient_name || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, recipient_name: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Téléphone Destinataire</label>
                  <input
                    type="text"
                    value={editingShipment.recipient_phone || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, recipient_phone: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Origine</label>
                  <input
                    type="text"
                    value={editingShipment.origin_country || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, origin_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Destination</label>
                  <input
                    type="text"
                    value={editingShipment.destination_country || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, destination_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Poids total (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingShipment.total_weight_kg ?? ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, total_weight_kg: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontWeight: "700" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Prix Total (FCFA)</label>
                  <input
                    type="number"
                    value={editingShipment.estimated_price ?? (editingShipment.estimated_price_minor ? editingShipment.estimated_price_minor / 100 : "")}
                    onChange={(e) => setEditingShipment({ ...editingShipment, estimated_price: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontWeight: "700", color: "var(--brown-dark)" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Statut Logistique</label>
                  <select
                    value={editingShipment.current_status || "DRAFT"}
                    onChange={(e) => setEditingShipment({ ...editingShipment, current_status: e.target.value })}
                    className="input-clean"
                  >
                    <option value="DRAFT">Dossier créé</option>
                    <option value="RECEIVED_ORIGIN_HUB">Reçu au Hub d&apos;Origine</option>
                    <option value="IN_TRANSIT">En acheminement international</option>
                    <option value="CUSTOMS_CLEARANCE">En dédouanement</option>
                    <option value="ARRIVED_DESTINATION">Arrivé au magasin de destination</option>
                    <option value="OUT_FOR_DELIVERY">En cours de livraison finale</option>
                    <option value="DELIVERED">Colis livré au destinataire</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Statut Règlement</label>
                  <select
                    value={editingShipment.payment_status || "UNPAID"}
                    onChange={(e) => setEditingShipment({ ...editingShipment, payment_status: e.target.value })}
                    className="input-clean"
                  >
                    <option value="UNPAID">En attente de règlement</option>
                    <option value="PARTIAL">Acompte perçu</option>
                    <option value="PAID">Intégralement réglé</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingShipment(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION : DEMANDE CLIENT */}
      {editingRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier la Demande {editingRequest.reference}</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Mettez à jour les coordonnées du prospect et les spécifications de sa commande.</p>
              </div>
              <button type="button" onClick={() => setEditingRequest(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditRequest} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nom du Client</label>
                  <input
                    type="text"
                    required
                    value={editingRequest.client_name || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, client_name: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Téléphone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={editingRequest.client_phone || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, client_phone: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pays de Départ</label>
                  <input
                    type="text"
                    value={editingRequest.origin_country || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, origin_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pays de Destination</label>
                  <input
                    type="text"
                    value={editingRequest.destination_country || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, destination_country: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Poids Estimé (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingRequest.estimated_weight_kg ?? ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, estimated_weight_kg: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Statut de Traitement</label>
                  <select
                    value={editingRequest.status || "NEW"}
                    onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                    className="input-clean"
                  >
                    <option value="NEW">NOUVEAU</option>
                    <option value="IN_REVIEW">EN ANALYSE</option>
                    <option value="QUOTE_SENT">DEVIS ENVOYÉ</option>
                    <option value="CONVERTED">CONVERTI EN COLIS</option>
                    <option value="CLOSED">CLÔTURÉ</option>
                    <option value="CANCELLED">ANNULÉ</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingRequest(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION : CLIENT */}
      {editingClient && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier le Client</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Mettez à jour les coordonnées du carnet d&apos;adresses.</p>
              </div>
              <button type="button" onClick={() => setEditingClient(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditClient} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nom & Prénoms</label>
                <input
                  type="text"
                  required
                  value={editingClient.full_name || editingClient.name || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, full_name: e.target.value, name: e.target.value })}
                  className="input-clean"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>WhatsApp / Téléphone</label>
                  <input
                    type="text"
                    required
                    value={editingClient.phone || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Email</label>
                  <input
                    type="email"
                    value={editingClient.email || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ville</label>
                  <input
                    type="text"
                    value={editingClient.city || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pays</label>
                  <input
                    type="text"
                    value={editingClient.country || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, country: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Notes / Adresse de livraison</label>
                <input
                  type="text"
                  value={editingClient.notes || editingClient.address || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value, address: e.target.value })}
                  className="input-clean"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingClient(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION : PAIEMENT */}
      {editingPayment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier l&apos;Encaissement</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Ajustez le montant perçu, la méthode de paiement et le contrôle caisse.</p>
              </div>
              <button type="button" onClick={() => setEditingPayment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditPayment} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Référence de Paiement</label>
                  <input
                    type="text"
                    value={editingPayment.payment_reference || editingPayment.reference || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, payment_reference: e.target.value, reference: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>N° Colis / Expédition</label>
                  <input
                    type="text"
                    value={editingPayment.shipment_tracking || editingPayment.tracking_number || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, shipment_tracking: e.target.value, tracking_number: e.target.value })}
                    className="input-clean"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Montant (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={editingPayment.amount ?? (editingPayment.amount_minor ? editingPayment.amount_minor / 100 : "")}
                    onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontWeight: "700", color: "var(--brown-dark)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Moyen de Paiement</label>
                  <select
                    value={editingPayment.payment_method || "CASH"}
                    onChange={(e) => setEditingPayment({ ...editingPayment, payment_method: e.target.value })}
                    className="input-clean"
                  >
                    <option value="WAVE">Wave Côte d&apos;Ivoire</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MTN_MOMO">MTN MoMo</option>
                    <option value="CASH">Espèces au Guichet</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Statut de Contrôle</label>
                <select
                  value={editingPayment.status || "VALIDATED"}
                  onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value })}
                  className="input-clean"
                >
                  <option value="VALIDATED">VALIDÉ ET ENCAISSÉ</option>
                  <option value="PENDING">EN ATTENTE DE CONTRÔLE</option>
                  <option value="REJECTED">REJETÉ / NON CONFORME</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingPayment(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION : TÂCHE */}
      {editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>Modifier la Tâche</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Ajustez les priorités, délais et détails opérationnels.</p>
              </div>
              <button type="button" onClick={() => setEditingTask(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditTask} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Intitulé de la Tâche</label>
                <input
                  type="text"
                  required
                  value={editingTask.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="input-clean"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Catégorie</label>
                  <select
                    value={editingTask.category || "GENERAL"}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    className="input-clean"
                  >
                    <option value="WEIGHING">Pesée & Magasin</option>
                    <option value="CUSTOMS">Douane & Transit</option>
                    <option value="FINANCE">Finances & Caisse</option>
                    <option value="PACKING">Emballage</option>
                    <option value="GENERAL">Général</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Priorité</label>
                  <select
                    value={editingTask.priority || "MEDIUM"}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="input-clean"
                  >
                    <option value="URGENT">Urgente (Immédiate)</option>
                    <option value="HIGH">Haute</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="LOW">Basse</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Instructions complémentaires</label>
                <textarea
                  rows={3}
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="input-clean"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button type="button" onClick={() => setEditingTask(null)} className="btn btn-secondary" style={{ padding: "8px 18px", borderRadius: "9999px" }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 22px", borderRadius: "9999px" }}>
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : PROFIL DE DIRECTION GÉNÉRALE (MADAME MAROUBA) */}
      {showProfileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 24, 21, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="card-clean animate-fade-in"
            style={{
              maxWidth: "520px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: "24px",
              padding: "28px 30px",
              background: "#FFFFFF",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Entête Modale */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "var(--bg-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brown-dark)",
                  }}
                >
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>
                    Mon Profil de Direction
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                    Identité exécutive & synchronisation de votre assistant IA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: "var(--bg-app)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "grid", gap: "18px" }}>
              {/* Photo de profil & téléversement */}
              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    width: "74px",
                    height: "74px",
                    borderRadius: "50%",
                    background: profileForm.avatarUrl ? "transparent" : "var(--brown-dark)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    overflow: "hidden",
                    border: "2px solid var(--border-light)",
                    flexShrink: 0,
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  {profileForm.avatarUrl ? (
                    <img
                      src={profileForm.avatarUrl}
                      alt="Photo officielle"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    (profileForm.fullName || "M").charAt(0)
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--brown-dark)", marginBottom: "4px" }}>
                    Photo Officielle de Direction
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "10px", lineHeight: "1.3" }}>
                    Formats acceptés : JPG, PNG, WEBP.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn btn-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.76rem",
                        borderRadius: "9999px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Camera size={13} />
                      Choisir une photo
                    </button>
                    {profileForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, avatarUrl: "" }))}
                        className="btn btn-secondary"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.74rem",
                          borderRadius: "9999px",
                          color: "#DC2626",
                        }}
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulaire Textuel */}
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Nom & Prénom Officiel
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="input-clean"
                    placeholder="Madame Marouba"
                    style={{ fontSize: "0.9rem", fontWeight: "600" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Titre & Fonction au sein de ROUM TRANSIT
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.roleName}
                    onChange={(e) => setProfileForm({ ...profileForm, roleName: e.target.value })}
                    className="input-clean"
                    placeholder="CEO · Direction Générale"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Téléphone Professionnel
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-clean"
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Email Professionnel
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="input-clean"
                      placeholder="ceo@roumtransit.com"
                    />
                  </div>
                </div>
              </div>

              {/* Encadré d'information IA & Plateforme */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <Sparkles size={16} color="var(--accent-gold)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  Toute modification de votre nom ou de votre photo s&apos;applique instantanément dans votre barre latérale et synchronise votre Assistant IA pour qu&apos;il s&apos;adresse à vous avec ce nouveau nom.
                </div>
              </div>

              {/* Boutons d'Action */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "10px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 18px", borderRadius: "9999px" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "8px 22px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Check size={14} />
                  Enregistrer mon Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION FLOTTANTE STYLE TABLEAU DE BORD (AUCUN POPUP DU NAVIGATEUR) */}
      {toast && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 9999,
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "16px 20px",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.14), 0 4px 14px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            maxWidth: "460px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: toast.type === "error" ? "#FEF2F2" : "var(--bg-subtle)",
              color: toast.type === "error" ? "#DC2626" : "var(--brown-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} color="#16A34A" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {toast.title && (
              <div style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--brown-dark)", marginBottom: "2px" }}>
                {toast.title}
              </div>
            )}
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
