"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  Plus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
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
  ArrowRight,
  Edit,
  Edit3,
  Camera,
  Upload,
  UserCheck,
  Banknote,
  HandCoins,
  ClipboardCheck,
  Smartphone,
  PackageCheck,
  Coins,
  History,
  TrendingUp,
  RotateCcw,
  Menu,
} from "lucide-react";
import { AdminLogin } from "@/components/AdminLogin";
import { AssistantWorkspace } from "@/components/AssistantWorkspace";
import { SiteContentEditor } from "@/components/SiteContentEditor";
import { ExchangeRatesCard } from "@/components/ExchangeRatesCard";
import { ShipmentPhotosManager } from "@/components/ShipmentPhotosManager";
import RouteGlobe from "@/components/RouteGlobe";
import { CircularFlag } from "@/components/CircularFlag";
import { BillsIcon } from "@/components/icons/BillsIcon";
import {
  WaveLogo,
  OrangeMoneyLogo,
  CompteMarocLogo,
  BankBaciLogo,
  IbanLogo,
  ReceiptSealLogo,
  WhatsAppLogo,
} from "@/components/PaymentLogos";
import {
  STRATEGIC_HUBS,
  AFRICAN_COUNTRIES,
  ALL_WORLD_COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  getCountryCodeFromName,
} from "@/data/countries";
import {
  buildAdminShipmentWhatsAppUrl,
  buildAdminRequestWhatsAppUrl,
  buildAdminQuotePaymentWhatsAppUrl,
  buildAdminPaymentConfirmedTrackingWhatsAppUrl,
  buildWhatsAppUrl,
  getExchangeRates,
  getPaymentPageUrl,
  getTrackingPageUrl,
  decodeHtmlEntitiesText,
} from "@/shared";
import { ApiError, apiRequest, type ApiOptions } from "@/shared/api";
import { useLiveSync } from "@/shared/useLiveSync";
import {
  downloadOfficialReceiptPdf,
  printOfficialReceipt,
  RoumReceiptData,
} from "@/utils/receiptPdf";

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
    role: "Grand Entrepôt Aérien",
    timezone: "UTC+8",
    lon: 113.3,
    lat: 23.3,
  },
  {
    code: "YIW",
    city: "Yiwu",
    country: "Chine",
    role: "Grand Entrepôt Maritime & Cargo",
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

/** Le compte Maroc n'apparaît dans un devis que s'il est réellement renseigné. */
function moroccoAccountLabel(settings: Record<string, string>): string | undefined {
  const rib = (settings.payment_morocco_rib || "").trim();
  if (!rib) return undefined;
  return [settings.payment_morocco_bank, rib].filter(Boolean).join(" · ");
}

function getWhatsAppUrl(
  phone?: string,
  trackingNumber?: string,
  clientName?: string,
  extra?: {
    origin?: string;
    destination?: string;
    statusLabel?: string;
    shippingMode?: string;
    weightKg?: number;
    volumeCbm?: number;
    amountLabel?: string;
    shippingMark?: string;
  }
): string {
  return buildAdminShipmentWhatsAppUrl({
    clientPhone: phone || "",
    clientName: clientName || "cher client",
    trackingNumber: trackingNumber || "",
    origin: extra?.origin,
    destination: extra?.destination,
    statusLabel: extra?.statusLabel,
    shippingMode: extra?.shippingMode,
    weightKg: extra?.weightKg,
    volumeCbm: extra?.volumeCbm,
    amountLabel: extra?.amountLabel,
    shippingMark: extra?.shippingMark,
  });
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

function renderPaymentMethodBadge(method: string = "") {
  const m = (method || "").toUpperCase();
  if (m.includes("WAVE")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "9999px",
          background: "#E0F2FE",
          border: "1px solid rgba(14, 165, 233, 0.28)",
          color: "#0369A1",
          fontSize: "0.74rem",
          fontWeight: "700",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <WaveLogo size={16} />
        <span>Wave</span>
      </span>
    );
  }
  if (m.includes("ORANGE")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "9999px",
          background: "#F6F0E6",
          border: "1px solid rgba(107, 88, 68, 0.28)",
          color: "#6B5844",
          fontSize: "0.74rem",
          fontWeight: "700",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <OrangeMoneyLogo size={16} />
        <span>Orange Money</span>
      </span>
    );
  }
  if (m.includes("BANK") || m.includes("VIREMENT") || m.includes("IBAN")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "9999px",
          background: "#F3F4F6",
          border: "1px solid rgba(75, 85, 99, 0.22)",
          color: "#374151",
          fontSize: "0.74rem",
          fontWeight: "700",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <IbanLogo size={16} />
        <span>Virement / IBAN</span>
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        background: "#F5F3FF",
        border: "1px solid rgba(139, 92, 246, 0.22)",
        color: "#6D28D9",
        fontSize: "0.74rem",
        fontWeight: "700",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <BillsIcon size={14} />
      <span>{m.includes("CASH") || m.includes("ESP") ? "Espèces" : method || "Paiement"}</span>
    </span>
  );
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
      return "Achats Chine en ligne";
    case "SUPPLIER_TRANSIT":
      return "Transit Direct";
    case "PARCEL_SHIPPING":
      return "Envoi Colis";
    case "TRACKING_HELP":
      return "Suivi Colis";
    case "CONTACT":
      return "Contact Client";
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

export function formatShipmentStatusShort(status?: string): string {
  switch (status) {
    case "DRAFT":
      return "Enregistré";
    case "RECEIVED_AT_HUB":
      return "Reçu au Magasin";
    case "PACKED_READY":
      return "Prêt départ";
    case "IN_TRANSIT":
      return "En transit";
    case "CUSTOMS_HOLD":
      return "En douane";
    case "ARRIVED_DESTINATION":
      return "Arrivé agence";
    case "READY_FOR_PICKUP":
    case "READY_PICKUP":
      return "Prêt retrait";
    case "OUT_FOR_DELIVERY":
      return "En livraison";
    case "DELIVERED":
      return "Livré";
    case "INCIDENT":
      return "Incident";
    case "CANCELLED":
      return "Annulé";
    default:
      return "En cours";
  }
}

export function formatShippingModeShort(modeName?: string, modeId?: string): string {
  const raw = (modeName || "").toLowerCase();
  if (modeId === "SEA_LCL" || raw.includes("maritime") || raw.includes("bateau")) return "Maritime (CBM)";
  if (modeId === "AIR_STANDARD" || raw.includes("standard")) return "Aérien Standard";
  if (modeId === "AIR_EXPRESS" || raw.includes("express") || raw.includes("aérien")) return "Aérien Express";
  return modeName || "Aérien Express";
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
  "shipments.status.update": "Mettre à jour l'étape du colis",
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
  "tasks.manage": "Gérer les tâches",
  "exports.run": "Exporter les données",
  "settings.manage": "Gérer les coordonnées d'agences",
  "audit.view": "Consulter l'historique d'audit",
};

export function formatPermissionLabel(perm: string): string {
  return PERMISSION_LABELS_MAP[perm] || perm.replace(/[._]/g, " ");
}

export function formatAuditAction(action?: string): string {
  if (!action) return "Opération";
  const norm = action.toLowerCase().replace(/[._]/g, " ");
  if (norm.includes("tariffs") || norm.includes("tariff")) {
    return "Mise à jour des tarifs";
  }
  if (norm.includes("change password") || norm.includes("change_password")) {
    return "Changement mot de passe";
  }
  if (norm.includes("settings") || norm.includes("setting")) {
    return "Mise à jour coordonnées";
  }
  if (norm.includes("intake") || norm.includes("weighing")) {
    return "Pesée en magasin";
  }
  if (norm.includes("status")) {
    return "Changement d'étape colis";
  }
  if (norm.includes("payment confirmed")) {
    return "Validation en caisse";
  }
  if (norm.includes("payment")) {
    return "Enregistrement paiement";
  }
  if (norm.includes("convert")) {
    return "Conversion en colis";
  }
  if (norm.includes("create")) {
    return "Création";
  }
  if (norm.includes("update")) {
    return "Modification";
  }
  if (norm.includes("delete")) {
    return "Suppression";
  }
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
      return "Pesée en magasin";
    case "PAYMENT_RECORD":
      return "Enregistrement paiement";
    case "PAYMENT_CONFIRMED":
      return "Validation caisse";
    case "REQUEST_CONVERT":
      return "Conversion en colis";
    default:
      return action.replace(/[_.]/g, " ");
  }
}

export function formatAuditEntity(entity?: string): string {
  if (!entity) return "Général";
  const norm = entity.toLowerCase();
  if (norm.includes("tariff")) return "Tarif & Route";
  if (norm.includes("setting")) return "Coordonnées & Magasins";
  if (norm.includes("shipment")) return "Colis & Expédition";
  if (norm.includes("request")) return "Commande Client";
  if (norm.includes("payment")) return "Règlement Caisse";
  if (norm.includes("task")) return "Tâche Opérationnelle";
  if (norm.includes("user")) return "Compte Utilisateur";
  if (norm.includes("role")) return "Rôle & Accès";
  return entity;
}

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

    let current = 0;
    const interval = setInterval(() => {
      current += 7;
      if (current >= text.length) {
        setDisplayedLength(text.length);
        hasFinishedRef.current = true;
        clearInterval(interval);
      } else {
        setDisplayedLength(current);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, isNew]);

  const displayedText = text.slice(0, displayedLength);
  const isTyping = isNew && !hasFinishedRef.current && displayedLength < text.length;

  return (
    <div style={{ position: "relative", lineHeight: "1.55" }}>
      {/* Espace réservé fixe : fige la hauteur finale dès la première milliseconde pour zéro décalage de page */}
      <div style={{ visibility: isTyping ? "hidden" : "visible" }}>
        {renderCleanAssistantText(text)}
      </div>

      {/* Couche de frappe superposée sans aucun impact sur le flux ni le scroll */}
      {isTyping && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          {renderCleanAssistantText(displayedText)}
          <span
            style={{
              display: "inline-block",
              width: "2px",
              height: "13px",
              background: "var(--brown-dark)",
              marginLeft: "3px",
              verticalAlign: "middle",
              borderRadius: "1px",
              animation: "iosCaretBlink 0.65s infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Les coordonnées, adresses et comptes de paiement sont saisis par la direction dans Paramètres :
// aucune valeur inventée ne doit pouvoir partir chez un client.
const DEFAULT_COMPANY_SETTINGS: Record<string, string> = {
  company_name: "ROUM TRANSIT",
  whatsapp_official_number: "+225 01 53 63 85 69",
};

/** Jeton de session locale : n'existe que pendant le développement, jamais dans le site en ligne. */
const DEV_SESSION_TOKEN = process.env.NODE_ENV === "development" ? "roum_local_admin_session" : null;
const CUSTOM_HUBS_SETTING = "custom_hubs_json";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire de connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<
    | "assistant"
    | "dashboard"
    | "requests"
    | "supplier_payments"
    | "shipments"
    | "clients"
    | "tariffs"
    | "finances"
    | "tasks"
    | "settings"
    | "content"
  >("dashboard");

  // Données : uniquement ce que la base renvoie. Rien n'est conservé ni inventé dans le navigateur.
  const [stats, setStats] = useState<any>({
    total_shipments: 0,
    active_shipments: 0,
    pending_requests: 0,
    total_clients: 0,
    total_payments_minor: 0,
  });
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [tariffsList, setTariffsList] = useState<any[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);
  const [modesList, setModesList] = useState<any[]>([]);
  const availableModes = modesList;
  const availableRoutes = routesList;
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<Record<string, string>>(DEFAULT_COMPANY_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [editingPaymentCard, setEditingPaymentCard] = useState<string | null>(null);
  const [backupSettings, setBackupSettings] = useState<Record<string, string> | null>(null);

  // Formulaire et état du changement de mot de passe de direction
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Changement de l'e-mail de connexion : l'écran ne change qu'après confirmation du serveur.
  const [emailForm, setEmailForm] = useState({ newEmail: "", confirmEmail: "", currentPassword: "" });
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    if (newEmail !== emailForm.confirmEmail.trim().toLowerCase()) {
      triggerToast("Les deux adresses e-mail saisies ne sont pas identiques.", "Confirmation incorrecte", "error");
      return;
    }

    setIsChangingEmail(true);
    try {
      const data = await apiRequest<{ email: string }>("/api/auth/change-email", {
        method: "POST",
        token,
        body: { newEmail, currentPassword: emailForm.currentPassword },
      });
      setUser((curr) => (curr ? { ...curr, email: data.email } : curr));
      setEmailForm({ newEmail: "", confirmEmail: "", currentPassword: "" });
      triggerToast("Utilisez cette adresse à votre prochaine connexion.", "E-mail modifié");
    } catch (err: any) {
      triggerToast(err.message || "Erreur de connexion au serveur.", "Échec modification", "error");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      triggerToast("Veuillez saisir votre mot de passe actuel.", "Mot de passe requis", "error");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      triggerToast("Le nouveau mot de passe doit comporter au moins 6 caractères.", "Mot de passe trop court", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerToast("Les deux mots de passe saisis ne sont pas identiques.", "Confirmation incorrecte", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Impossible de mettre à jour le mot de passe.");
      }

      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 5000);
      triggerToast("Votre mot de passe de direction a été modifié avec succès.", "Sécurité Compte Direction", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      triggerToast(err.message || "Erreur de connexion au serveur.", "Échec modification", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStartEditPaymentCard = (cardKey: string) => {
    setBackupSettings({ ...companySettings });
    setEditingPaymentCard(cardKey);
  };

  const handleCancelEditPaymentCard = () => {
    if (backupSettings) {
      setCompanySettings(backupSettings);
    }
    setEditingPaymentCard(null);
  };

  const handleSaveEditPaymentCard = async (cardKey: string, cardLabel: string) => {
    const saved = await adminCall(
      "/settings",
      { method: "PUT", body: companySettings },
      { scopes: [], success: `Coordonnées ${cardLabel} enregistrées avec succès !`, successTitle: "Moyens de Paiement" }
    );
    if (saved) setEditingPaymentCard(null);
  };

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
  const [saveConfirmationPopup, setSaveConfirmationPopup] = useState<{
    title: string;
    subtitle: string;
    item: {
      service: string;
      price: string;
      route: string;
      delay?: string;
      transport?: string;
    };
  } | null>(null);
  const [pendingTariffEdits, setPendingTariffEdits] = useState<Record<string, any>>({});
  const [initialTariffsBackup, setInitialTariffsBackup] = useState<any[] | null>(null);
  const [isSavingBatchTariffs, setIsSavingBatchTariffs] = useState(false);
  const pendingTariffEditsRef = useRef<Record<string, any>>({});
  useEffect(() => {
    pendingTariffEditsRef.current = pendingTariffEdits;
  }, [pendingTariffEdits]);

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
    roleName: "CEO",
    phone: "+225 07 00 00 00 00",
    email: "ceo@roumtransit.com",
    avatarUrl: "",
  });

  // Chargement du profil sauvegardé (normalisé sur Madame Marouba · CEO)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("roum_profile_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          const rawName = (parsed.fullName || "").trim();
          const normalizedName =
            !rawName ||
            rawName === "Direction ROUM TRANSIT" ||
            rawName === "Directeur Général"
              ? "Madame Marouba"
              : rawName;
          const rawRole = (parsed.roleName || "CEO")
            .replace(/\s*·?\s*direction\s+g[eé]n[eé]rale/gi, "")
            .trim();
          const cleanRole =
            !rawRole ||
            rawRole.toUpperCase() === "SUPER ADMINISTRATEUR" ||
            rawRole.toUpperCase() === "SUPER ADMIN"
              ? "CEO"
              : rawRole;
          setUser((curr) => {
            const baseUser: UserSession = curr || {
              userId: "user-ceo-marouba",
              email: parsed.email || "ceo@roumtransit.com",
              fullName: normalizedName,
              roleId: "CEO",
              roleName: cleanRole,
              isSuperAdmin: true,
              hubLocation: "Abidjan / Bamako",
              permissions: ["*"],
              allowedStatuses: ["*"],
            };
            return {
              ...baseUser,
              fullName: normalizedName,
              roleName: cleanRole,
              avatarUrl: parsed.avatarUrl || baseUser.avatarUrl,
              phone: parsed.phone || baseUser.phone,
            };
          });
          const savedAvatar = localStorage.getItem("roum_ceo_avatar_photo") || parsed.avatarUrl || "";
          setProfileForm({
            fullName: normalizedName,
            roleName: cleanRole,
            phone: parsed.phone || "+225 07 00 00 00 00",
            email: parsed.email || "ceo@roumtransit.com",
            avatarUrl: savedAvatar,
          });
        }
      } catch {}
    }
  }, []);

  const openProfileModal = () => {
    let savedAvatar = "";
    if (typeof window !== "undefined") {
      try {
        savedAvatar = localStorage.getItem("roum_ceo_avatar_photo") || "";
      } catch {}
    }
    setProfileForm({
      fullName: user?.fullName || "Madame Marouba",
      roleName: user?.roleName || "CEO",
      phone: user?.phone || "+225 07 00 00 00 00",
      email: user?.email || "ceo@roumtransit.com",
      avatarUrl: user?.avatarUrl || savedAvatar || "",
    });
    setShowProfileModal(true);
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  /**
   * Avant, la photo restait dans le navigateur. Si la base n'en a pas encore, on y envoie
   * celle de cet appareil une seule fois ; ensuite, la base fait foi sur tous les appareils.
   */
  const adoptLocalAvatar = async (jwtToken: string, serverUser: any) => {
    if (typeof window === "undefined" || !serverUser) return;
    let localAvatar = "";
    try {
      localAvatar =
        localStorage.getItem("roum_ceo_avatar_photo") ||
        JSON.parse(localStorage.getItem("roum_profile_data") || "{}").avatarUrl ||
        "";
    } catch {}
    if (!localAvatar) return;
    try {
      if (!serverUser.avatarUrl && localAvatar.startsWith("data:image/")) {
        await apiRequest("/api/auth/avatar", { method: "PUT", token: jwtToken, body: { avatar: localAvatar } });
        setUser((curr) => (curr ? { ...curr, avatarUrl: localAvatar } : curr));
      }
      localStorage.removeItem("roum_ceo_avatar_photo");
      const saved = JSON.parse(localStorage.getItem("roum_profile_data") || "{}");
      delete saved.avatarUrl;
      localStorage.setItem("roum_profile_data", JSON.stringify(saved));
    } catch {
      // La photo reste dans le navigateur : nouvel essai à la prochaine ouverture.
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // « Retirer la photo » vide le champ : on n'y remet pas l'ancienne.
    const finalAvatar = profileForm.avatarUrl || null;
    if (finalAvatar !== (user?.avatarUrl || null)) {
      setIsSavingProfile(true);
      try {
        await apiRequest("/api/auth/avatar", { method: "PUT", token, body: { avatar: finalAvatar } });
      } catch (err: any) {
        triggerToast(err.message || "La photo n'a pas pu être enregistrée.", "Photo de profil", "error");
        return;
      } finally {
        setIsSavingProfile(false);
      }
    }
    const updatedUser: UserSession = {
      ...(user || {
        userId: "user-ceo-marouba",
        email: profileForm.email,
        fullName: profileForm.fullName,
        roleId: "CEO",
        roleName: profileForm.roleName,
        isSuperAdmin: true,
        hubLocation: "Abidjan / Bamako",
        permissions: ["*"],
        allowedStatuses: ["*"],
      }),
      fullName: profileForm.fullName.trim() || "Madame Marouba",
      roleName: profileForm.roleName.trim() || "CEO",
      phone: profileForm.phone,
      avatarUrl: finalAvatar,
    };

    setUser(updatedUser);
    if (typeof window !== "undefined") {
      // La photo vit en base ; le navigateur ne garde que le nom et le téléphone.
      const { avatarUrl: _avatar, ...localProfile } = updatedUser;
      localStorage.setItem("roum_profile_data", JSON.stringify(localProfile));
      localStorage.removeItem("roum_ceo_avatar_photo");
    }
    triggerToast("Votre profil et photo ont été mis à jour avec succès !", "Profil Direction");
    setShowProfileModal(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        triggerToast("Veuillez choisir une photo de taille inférieure à 8 Mo.", "Photo de profil", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result as string;
        // Compression par canvas (max 320x320) pour garantir une persistance parfaite dans localStorage sans dépassement de quota
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            setProfileForm((prev) => ({ ...prev, avatarUrl: compressed }));
          } else {
            setProfileForm((prev) => ({ ...prev, avatarUrl: rawData }));
          }
        };
        img.onerror = () => {
          setProfileForm((prev) => ({ ...prev, avatarUrl: rawData }));
        };
        img.src = rawData;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sur téléphone, les tableaux deviennent des cartes : chaque cellule affiche l'intitulé de sa colonne.
  useEffect(() => {
    const root = document.querySelector(".admin-main-viewport");
    if (!root) return;

    const labelCells = () => {
      root.querySelectorAll("table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() || "");
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            const label = (cell as HTMLTableCellElement).colSpan > 1 ? "" : headers[index] || "";
            if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label);
          });
        });
      });
    };

    labelCells();
    const observer = new MutationObserver(labelCells);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [user]);

  // Sur téléphone, choisir une rubrique referme le menu.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);
  const [isGlobeExpanded, setIsGlobeExpanded] = useState(false);

  // Synchronisation Tableau de bord & Globe 3D
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [globeFocusTarget, setGlobeFocusTarget] = useState<{ lon: number; lat: number } | null>(null);
  const [activeHubCode, setActiveHubCode] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<string>("ALL");
  const [dashboardSearch, setDashboardSearch] = useState<string>("");

  // --- ASSISTANTE DE DIRECTION ROUM (Design Exécutif Inspiré de l'ADN Marque) ---
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
  const [agentTab, setAgentTab] = useState<"alerts" | "activity">("alerts");

  const pendingPaymentsList = paymentsList.filter((p) => p.status === "PENDING");
  const pendingAmount = pendingPaymentsList.reduce((acc, p) => acc + (p.amount_minor || 0), 0);
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

  // --- GESTION DÉDIÉE OPTION 2 : PAIEMENTS FOURNISSEURS EN YUANS (RMB ¥) ---
  const isOption2SupplierPayment = (r: any) => {
    return (
      r.option_type === "AVEC_FOURNISSEUR" ||
      r.request_type === "SUPPLIER_PAYMENT" ||
      (r.description && (
        r.description.includes("[PAIEMENT FOURNISSEUR RMB]") ||
        r.description.includes("¥") ||
        r.description.toLowerCase().includes("rmb") ||
        r.description.toLowerCase().includes("proforma")
      )) ||
      Boolean(r.rmb_amount)
    );
  };

  const supplierPaymentsList = useMemo(() => {
    return requestsList.filter(isOption2SupplierPayment);
  }, [requestsList]);

  const rmbPendingCount = supplierPaymentsList.filter(
    (r) => r.status === "NEW" || r.status === "IN_REVIEW" || r.status === "QUOTE_SENT"
  ).length;

  const [supplierPaymentFilter, setSupplierPaymentFilter] = useState<string>("ALL");
  const [supplierPaymentSearch, setSupplierPaymentSearch] = useState<string>("");
  const [requestCategoryFilter, setRequestCategoryFilter] = useState<"ALL" | "OPTION_2" | "OPTION_1" | "TRANSIT">("ALL");

  const buildInitialCeoReport = (bossName: string) => {
    const greeting = bossName || "Madame Marouba";
    const pAmount = pendingPaymentsList.reduce((acc, p) => acc + (p.amount_minor || 0), 0);
    const parts: string[] = [];
    if (pendingPaymentsList.length > 0) {
      parts.push(`nous avons ${pendingPaymentsList.length} paiement(s) en attente d'approbation en caisse (${formatCurrencyPrice(pAmount, "FCFA")})`);
    }
    if (pendingRequestsList.length > 0) {
      parts.push(`${pendingRequestsList.length} demande(s) de cotation client à arbitrer`);
    }
    if (pendingWeighingsList.length > 0) {
      parts.push(`${pendingWeighingsList.length} colis réceptionné(s) au magasin à peser`);
    }
    if (urgentTasksList.length > 0) {
      parts.push(`${urgentTasksList.length} tâche(s) prioritaire(s) à superviser`);
    }

    if (parts.length === 0) {
      return `Bonjour ${greeting}, je suis à votre entière disposition. Toutes vos opérations de la journée sont parfaitement synchronisées. Que souhaitez-vous que nous examinions ensemble ?`;
    }

    return `Bonjour ${greeting}, j'ai préparé l'ensemble de vos dossiers pour aujourd'hui. Pour ce matin, ${parts.join(", et ")}. Je reste entièrement à votre écoute pour traiter chaque dossier selon vos directives.`;
  };

  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: "user" | "agent";
      text: string;
      time: string;
      actions?: Array<{ label: string; tab?: string; kind?: string }>;
    }>
  >(() => [
    {
      sender: "agent",
      text: `Bonjour Madame Marouba, je suis à vos côtés pour la supervision de vos opérations. Vos dossiers de caisse, expéditions et demandes de transit sont synchronisés. Que souhaitez-vous que nous voyions ensemble ?`,
      time: "En direct",
      actions: [
        { label: "Point Caisse", tab: "finances" },
        { label: "Devis & Cotations", tab: "requests" },
        { label: "Arrivages Magasin", tab: "shipments" },
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Met à jour le briefing initial dès que les données opérationnelles sont chargées
  useEffect(() => {
    const boss = user?.fullName || "Madame Marouba";
    setChatMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === "agent") {
        return [
          {
            sender: "agent",
            text: buildInitialCeoReport(boss),
            time: "En direct",
            actions: [
              { label: `Valider Caisse (${pendingPaymentsList.length})`, tab: "finances" },
              { label: `Cotations (${pendingRequestsList.length})`, tab: "requests" },
              { label: `Pesées Magasin (${pendingWeighingsList.length})`, tab: "shipments" },
              { label: `Urgences (${urgentTasksList.length})`, tab: "tasks" },
            ],
          },
        ];
      }
      return prev;
    });
  }, [
    user?.fullName,
    pendingPaymentsList.length,
    pendingRequestsList.length,
    pendingWeighingsList.length,
    urgentTasksList.length,
  ]);

  // Scroll strictement confiné à l'intérieur du conteneur de chat (zéro mouvement de la page)
  const scrollToChatBottom = () => {
    const el = chatScrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeTab === "assistant") {
      requestAnimationFrame(() => {
        scrollToChatBottom();
      });
    }
  }, [chatMessages.length, isAgentThinking, activeTab]);

  const handleAskAgent = async (qText: string) => {
    const q = qText.trim();
    if (!q) return;

    const boss = user?.fullName || "Madame Marouba";
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

    const qLower = q.toLowerCase();
    let reply = "";
    let msgActions: Array<{ label: string; tab?: string; kind?: string }> | undefined = undefined;

    // 1. Moteur d'exécution instantané (~90ms) : rapporte directement les tâches que la CEO doit exécuter
    await new Promise((r) => setTimeout(r, 90));

    if (
      qLower.includes("tâche") ||
      qLower.includes("tache") ||
      qLower.includes("exécut") ||
      qLower.includes("execut") ||
      qLower.includes("rapport") ||
      qLower.includes("attente") ||
      qLower.includes("urgent") ||
      qLower.includes("priorit") ||
      qLower.includes("action") ||
      qLower.includes("faire") ||
      qLower.includes("bilan") ||
      qLower.includes("jour")
    ) {
      reply = `${boss}, voici les ${totalAgentAlerts} tâche(s) qui requièrent votre exécution immédiate :\n1. Validation Caisse : ${pendingPaymentsList.length} règlement(s) en attente d'approbation (${formatCurrencyPrice(pendingAmount, "FCFA")}).\n2. Commandes Clients : ${pendingRequestsList.length} commande(s) d'achats à chiffrer (${pendingRequestsList.slice(0, 2).map((r) => r.reference).join(", ") || "aucun"}).\n3. Pesées en Magasin : ${pendingWeighingsList.length} colis à peser avant départ (${pendingWeighingsList.slice(0, 2).map((s) => s.tracking_number).join(", ") || "aucun"}).\n4. Tâches prioritaires : ${urgentTasksList.length} tâche(s) urgente(s) (${urgentTasksList.slice(0, 2).map((t) => t.title).join(" ; ") || "aucune"}).`;
      msgActions = [
        { label: `Exécuter Caisse (${pendingPaymentsList.length})`, tab: "finances" },
        { label: `Traiter Commandes (${pendingRequestsList.length})`, tab: "requests" },
        { label: `Exécuter Pesées (${pendingWeighingsList.length})`, tab: "shipments" },
        { label: `Voir Urgences (${urgentTasksList.length})`, tab: "tasks" },
      ];
    } else if (
      qLower.includes("caisse") ||
      qLower.includes("paiement") ||
      qLower.includes("argent") ||
      qLower.includes("finance") ||
      qLower.includes("encaiss") ||
      qLower.includes("wave") ||
      qLower.includes("orange")
    ) {
      const details = pendingPaymentsList
        .slice(0, 3)
        .map((p, idx) => `${idx + 1}. ${p.client_name || "Client"} : ${formatCurrencyPrice(p.amount_minor || 0, "FCFA")} (${p.payment_method})`)
        .join("\n");
      reply =
        pendingPaymentsList.length > 0
          ? `Tâches CEO — Validation Caisse (${pendingPaymentsList.length} à exécuter pour ${formatCurrencyPrice(pendingAmount, "FCFA")}) :\n${details}\nTotal déjà validé en caisse : ${formatCurrencyPrice(confirmed, "FCFA")}.`
          : `Aucune validation de caisse en attente, ${boss}. Trésorerie validée à jour : ${formatCurrencyPrice(confirmed, "FCFA")}.`;
      msgActions = [{ label: "Ouvrir & Valider la Caisse", tab: "finances" }];
    } else if (
      qLower.includes("pesée") ||
      qLower.includes("pesee") ||
      qLower.includes("peser") ||
      qLower.includes("hub") ||
      qLower.includes("magasin")
    ) {
      const details = pendingWeighingsList
        .slice(0, 3)
        .map((s, idx) => `${idx + 1}. ${s.tracking_number} (${s.client_name}) — ${s.origin_country} vers ${s.destination_country}`)
        .join("\n");
      reply =
        pendingWeighingsList.length > 0
          ? `Tâches CEO — Pesées en Magasin (${pendingWeighingsList.length} colis à peser) :\n${details}\nFaites la pesée depuis « À faire » ou dans Expéditions.`
          : `Tous les colis au magasin de départ disposent d'une pesée officielle validée.`;
      msgActions = [{ label: "Peser les Colis au Magasin", tab: "shipments" }];
    } else if (
      qLower.includes("alibaba") ||
      qLower.includes("sourcing") ||
      qLower.includes("demande") ||
      qLower.includes("commande") ||
      qLower.includes("cotation") ||
      qLower.includes("devis")
    ) {
      const details = pendingRequestsList
        .slice(0, 3)
        .map((r, idx) => `${idx + 1}. ${r.reference} — ${r.client_name} (${formatRequestType(r.request_type)})`)
        .join("\n");
      reply =
        pendingRequestsList.length > 0
          ? `Tâches CEO — Commandes & Achats Clients (${pendingRequestsList.length} dossier(s) à valider) :\n${details}`
          : `Aucune commande client en attente de validation CEO.`;
      msgActions = [{ label: "Traiter les Commandes", tab: "requests" }];
    } else if (
      qLower.includes("vol") ||
      qLower.includes("mer") ||
      qLower.includes("transit") ||
      qLower.includes("expedition") ||
      qLower.includes("expédition") ||
      qLower.includes("colis")
    ) {
      const active = inTransitShipments.slice(0, 3);
      reply =
        active.length > 0
          ? `Supervision CEO — ${inTransitShipments.length} expédition(s) en transit actif :\n${active
              .map((s, idx) => `${idx + 1}. ${s.tracking_number} (${s.client_name}) : ${s.origin_country} vers ${s.destination_country} — ${s.total_weight_kg || 0} kg`)
              .join("\n")}`
          : "Aucune expédition en transit actif actuellement.";
      msgActions = [{ label: "Piloter les Expéditions", tab: "shipments" }];
    } else {
      // Recherche directe d'un dossier précis (colis ou client)
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
        reply = `Dossier Colis ${foundShipment.tracking_number} (${foundShipment.client_name}) :\n- Corridor : ${foundShipment.origin_country} vers ${foundShipment.destination_country}\n- Statut : ${formatShipmentStatus(foundShipment.current_status, foundShipment.status_label)} (${foundShipment.total_weight_kg || 0} kg)\n- Action CEO : ${foundShipment.payment_status === "PAID" ? "Règlement validé, prêt pour livraison" : "Règlement en attente de validation caisse"}.`;
        msgActions = [{ label: "Voir dans Expéditions", tab: "shipments" }];
      } else if (foundRequest) {
        reply = `Commande Client ${foundRequest.reference} (${foundRequest.client_name}) :\n- Type : ${formatRequestType(foundRequest.request_type)} (${foundRequest.origin_country || "Chine"} vers ${foundRequest.destination_country || "Afrique"})\n- Action CEO : Valider la cotation tarifaire et convertir en expédition.`;
        msgActions = [{ label: "Exécuter ce Dossier", tab: "requests" }];
      } else {
        // Appel ultra-rapide à l'API IA (avec repli instantané sur le rapport d'exécution CEO)
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
          activeShipmentsSample: inTransitShipments.slice(0, 4).map((s) => `${s.tracking_number} (${s.client_name})`),
        };

        try {
          const res = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              message: q,
              context: liveContext,
              history: chatMessages.slice(-4),
              userFullName: boss,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.reply) {
              reply = data.reply;
            }
          }
        } catch {}

        if (!reply) {
          reply = buildInitialCeoReport(boss);
        }
        msgActions = [
          { label: `Valider Caisse (${pendingPaymentsList.length})`, tab: "finances" },
          { label: `Cotations (${pendingRequestsList.length})`, tab: "requests" },
          { label: `Urgences (${urgentTasksList.length})`, tab: "tasks" },
        ];
      }
    }

    const agentMsg = {
      sender: "agent" as const,
      text: reply,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      actions: msgActions,
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
  const [showPhotosModal, setShowPhotosModal] = useState<any | null>(null);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState<any | null>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<any | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateTariffModal, setShowCreateTariffModal] = useState(false);
  const [showCreateAirRouteModal, setShowCreateAirRouteModal] = useState(false);
  const [airRouteForm, setAirRouteForm] = useState({
    isBilateral: true,
    origin_country: "France",
    origin_city: "Paris",
    destination_country: "Côte d'Ivoire",
    destination_city: "Abidjan",
    service_name: "Liaison Aérienne Bilatérale (Paris ↔ Abidjan)",
    category_tag: "Liaison Aérienne",
    pricing_basis: "PER_KG",
    currency: "FCFA",
    price_per_unit: 8500,
    estimated_days_min: 3,
    estimated_days_max: 5,
    note: "Expéditions régulières dans les 2 sens · Agence Bingerville",
  });
  const [showAddMoroccoCountryModal, setShowAddMoroccoCountryModal] = useState(false);
  const [moroccoCountryForm, setMoroccoCountryForm] = useState({
    destination_country: "Sénégal",
    destination_city: "Dakar",
    price_per_unit: 7000,
    currency: "FCFA",
    estimated_days_min: 5,
    estimated_days_max: 5,
    note: "Groupage aérien Maroc 5 jours garantis",
  });
  const [customHubs, setCustomHubs] = useState<any[]>([]);
  const [showAddHubModal, setShowAddHubModal] = useState(false);
  const [newHubForm, setNewHubForm] = useState({
    name: "Entrepôt Istanbul (Turquie)",
    country: "Turquie",
    countryCode: "TR",
    city: "Istanbul",
    address: "Entrepôt Istanbul : Laleli Mah., Fatih, Istanbul, Turquie",
    shipping_mark: "ROUM-TRANSIT-[NOM_CLIENT]-[DESTINATION]",
    contact: "+90 530 000 0000",
  });

  // Nouvelles modales opérationnelles (commandes, réception magasin, détails)
  const [showRequestDetailModal, setShowRequestDetailModal] = useState<any | null>(null);
  const [showConvertRequestModal, setShowConvertRequestModal] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState<any | null>(null);
  const [showShipmentDetailModal, setShowShipmentDetailModal] = useState<any | null>(null);
  const [zoomProductImage, setZoomProductImage] = useState<string | null>(null);
  const [copiedPaymentLink, setCopiedPaymentLink] = useState(false);

  // Devis Admin Étape 2 (Estimation du poids + Calcul du fret + Lien de paiement WhatsApp)
  const [adminQuoteForm, setAdminQuoteForm] = useState({
    weight_kg: 2,
    volume_cbm: 0.1,
    rate_per_unit: 12000,
    goods_fcfa: 0,
    shipping_fcfa: 24000,
    total_fcfa: 24000,
  });

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
    hub_location: "Entrepôt Guangzhou",
    status: "RECEIVED_AT_HUB",
    comment: "Pesée physique effectuée au magasin de départ, carton vérifié",
    final_price_minor: 0,
  });

  const [statusUpdate, setStatusUpdate] = useState({
    new_status: "RECEIVED_AT_HUB",
    location: "Entrepôt Guangzhou",
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

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("roum_admin_token");
    localStorage.removeItem("roum_admin_token");
    setToken(null);
    setUser(null);
    setHasLoadedData(false);
  }, []);

  useEffect(() => {
    // Une session ouverte survit à l'actualisation de la page ; le serveur la valide à chaque ouverture.
    const activeSessionToken =
      sessionStorage.getItem("roum_admin_token") || localStorage.getItem("roum_admin_token") || DEV_SESSION_TOKEN;
    if (activeSessionToken) {
      fetchSession(activeSessionToken);
      return;
    }
    setLoading(false);
  }, []);

  const normalizeCeoUser = (rawUser: any): UserSession => {
    // Les droits viennent toujours du serveur : seul le profil de la direction est personnalisable ici.
    if (rawUser && !rawUser.isSuperAdmin) return rawUser;

    let savedProfile: any = null;
    let savedAvatar: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("roum_profile_data");
        if (stored) savedProfile = JSON.parse(stored);
        savedAvatar = localStorage.getItem("roum_ceo_avatar_photo");
      } catch {}
    }

    const rawName = (savedProfile?.fullName || rawUser?.fullName || "").trim();
    const fullName =
      !rawName ||
      rawName === "Direction ROUM TRANSIT" ||
      rawName === "Directeur Général"
        ? "Madame Marouba"
        : rawName;
    const rawRole = (savedProfile?.roleName || rawUser?.roleName || "CEO")
      .replace(/\s*·?\s*direction\s+g[eé]n[eé]rale/gi, "")
      .trim();
    const roleName =
      !rawRole ||
      rawRole.toUpperCase() === "SUPER ADMINISTRATEUR" ||
      rawRole.toUpperCase() === "SUPER ADMIN"
        ? "CEO"
        : rawRole;

    // En ligne, la photo vient de la base ; hors ligne, de la dernière copie de cet appareil.
    const resolvedAvatar = rawUser
      ? rawUser.avatarUrl || undefined
      : savedAvatar || savedProfile?.avatarUrl || undefined;

    return {
      userId: rawUser?.userId || savedProfile?.userId || "user-ceo-marouba",
      email: rawUser?.email || savedProfile?.email || "ceo@roumtransit.com",
      fullName,
      roleId: rawUser?.roleId || "CEO",
      roleName,
      isSuperAdmin: Boolean(rawUser?.isSuperAdmin),
      hubLocation: rawUser?.hubLocation || "Abidjan / Bamako",
      permissions: rawUser?.permissions || [],
      allowedStatuses: rawUser?.allowedStatuses || [],
      avatarUrl: resolvedAvatar,
      phone: savedProfile?.phone || rawUser?.phone || undefined,
    };
  };

  const fetchSession = async (jwtToken: string) => {
    try {
      const data = await apiRequest<{ user: any }>("/api/auth/me", { token: jwtToken });
      setToken(jwtToken);
      setUser(normalizeCeoUser(data.user));
      void adoptLocalAvatar(jwtToken, data.user);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearSession();
      } else {
        // Serveur injoignable : la session reste ouverte et le bandeau de connexion prend le relais.
        setToken(jwtToken);
        setUser(normalizeCeoUser(null));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const data = await apiRequest<{ token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      sessionStorage.setItem("roum_admin_token", data.token);
      localStorage.setItem("roum_admin_token", data.token);
      setPassword("");
      setToken(data.token);
      setUser(normalizeCeoUser(data.user));
      void adoptLocalAvatar(data.token, data.user);
    } catch (err: any) {
      setLoginError(err?.message || "Connexion impossible.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    apiRequest("/api/auth/logout", { method: "POST", token }).catch(() => {});
    clearSession();
  };

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const scopeSequenceRef = useRef<Record<string, number>>({});
  const metaLoadedRef = useRef(false);
  const hubsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Lecture d'un domaine. Une réponse dépassée par une lecture plus récente est ignorée. */
  const loadScope = async <T,>(scope: string, path: string, apply: (data: T) => void) => {
    const sequence = (scopeSequenceRef.current[scope] = (scopeSequenceRef.current[scope] || 0) + 1);
    try {
      const data = await apiRequest<T>(`/api/admin${path}`, { token });
      if (scopeSequenceRef.current[scope] === sequence) apply(data);
    } catch (err) {
      // Un rôle limité n'a pas accès à tous les domaines : ce n'est pas une panne.
      if (err instanceof ApiError && err.status === 403) return;
      throw err;
    }
  };

  const loadSettings = async () => {
    await loadScope<{ settings: Record<string, string> }>("settings", "/settings", (d) => {
      const { [CUSTOM_HUBS_SETTING]: hubsJson, ...rest } = d.settings || {};
      setCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, ...rest });
      if (hubsJson) {
        try {
          setCustomHubs(JSON.parse(hubsJson));
        } catch {
          setCustomHubs([]);
        }
      } else {
        // Reprise unique des entrepôts créés quand ils n'existaient que dans ce navigateur.
        try {
          const legacy = JSON.parse(localStorage.getItem("roum_custom_hubs") || "[]");
          if (Array.isArray(legacy) && legacy.length > 0) {
            setCustomHubs(legacy);
            void persistHubs(legacy);
          }
        } catch {
          setCustomHubs([]);
        }
      }
    });
  };

  /** Recharge depuis la base les domaines indiqués. Renvoie `false` si l'un d'eux a échoué. */
  const refreshData = async (scopes: string[]): Promise<boolean> => {
    const has = (scope: string) => scopes.includes(scope);
    const tasks: Promise<unknown>[] = [
      loadScope<{ stats: any }>("stats", "/stats", (d) => d.stats && setStats(d.stats)),
      loadScope<{ logs: any[] }>("audit", "/audit-logs", (d) => setAuditLogs(d.logs || [])),
    ];

    if (has("shipments")) {
      tasks.push(loadScope<{ shipments: any[] }>("shipments", "/shipments", (d) => setShipments(d.shipments || [])));
    }
    if (has("requests")) {
      tasks.push(
        loadScope<{ requests: any[] }>("requests", "/requests", (d) => {
          const list = d.requests || [];
          setRequestsList(list);
          // La fiche ouverte suit la base, sans perdre la preuve de paiement chargée à part.
          setShowRequestDetailModal((open: any) => {
            if (!open) return open;
            const fresh = list.find((r) => r.id === open.id);
            if (!fresh) return open;
            return { ...open, ...fresh, payment_receipt_url: fresh.payment_receipt_url || open.payment_receipt_url };
          });
        })
      );
    }
    if (has("account")) {
      tasks.push(
        apiRequest<{ user: any }>("/api/auth/me", { token }).then((d) => setUser(normalizeCeoUser(d.user)))
      );
    }
    if (has("clients")) {
      tasks.push(loadScope<{ clients: any[] }>("clients", "/clients", (d) => setClientsList(d.clients || [])));
    }
    if (has("payments")) {
      tasks.push(loadScope<{ payments: any[] }>("payments", "/payments", (d) => setPaymentsList(d.payments || [])));
    }
    if (has("tasks")) {
      tasks.push(loadScope<{ tasks: any[] }>("tasks", "/tasks", (d) => setTasksList(d.tasks || [])));
    }
    if (has("tariffs")) {
      tasks.push(
        loadScope<{ tariffs: any[] }>("tariffs", "/tariffs", (d) => {
          setTariffsList(
            (d.tariffs || []).map((serverT: any) => {
              const priceMinor = Number(serverT.price_per_unit_minor) || 0;
              const minimumMinor = Number(serverT.minimum_charge_minor) || 0;
              const cleanServiceName = String(serverT.service_name || serverT.category_tag || "Transport Standard")
                .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F9FF}]/gu, "")
                .trim();
              return {
                ...serverT,
                service_name: cleanServiceName,
                shipping_mode_name: cleanServiceName,
                mode_name: cleanServiceName,
                shipping_mode_type: serverT.shipping_mode_type || "AIR",
                price_per_unit_minor: priceMinor,
                price_per_unit: priceMinor / 100,
                minimum_charge: minimumMinor / 100,
              };
            })
          );
        }),
        loadScope<{ routes: any[] }>("routes", "/routes", (d) => setRoutesList(d.routes || [])),
        loadScope<{ modes: any[] }>("modes", "/modes", (d) => setModesList(d.modes || []))
      );
    }
    // Un formulaire de paramètres en cours de saisie n'est jamais écrasé : il se recharge à la sortie de l'onglet.
    if (has("settings") && (activeTabRef.current !== "settings" || !metaLoadedRef.current)) {
      tasks.push(loadSettings());
    }

    if (!metaLoadedRef.current) {
      tasks.push(
        loadScope<{ roles: any[] }>("roles", "/roles", (d) => setRoles(d.roles || [])),
        loadScope<{ permissions: any[] }>("permissions", "/permissions", (d) => setAllPermissions(d.permissions || [])),
        loadScope<{ statuses: any[] }>("statuses", "/statuses", (d) => setAllStatuses(d.statuses || [])),
        loadScope<{ users: any[] }>("users", "/users", (d) => setUsersList(d.users || []))
      );
    }

    setIsRefreshing(true);
    const results = await Promise.allSettled(tasks);
    setIsRefreshing(false);

    const unauthorized = results.some(
      (r) => r.status === "rejected" && r.reason instanceof ApiError && r.reason.status === 401
    );
    if (unauthorized) {
      clearSession();
      return false;
    }

    const ok = results.every((r) => r.status === "fulfilled");
    if (ok) {
      metaLoadedRef.current = true;
      setHasLoadedData(true);
    }
    return ok;
  };

  const { status: syncStatus, checkNow: checkSyncNow } = useLiveSync({
    endpoint: "/api/admin/sync",
    token,
    enabled: Boolean(token && user),
    intervalMs: 3000,
    onChange: refreshData,
    onUnauthorized: clearSession,
  });

  useEffect(() => {
    if (activeTab !== "settings" && token && user && metaLoadedRef.current) {
      loadSettings().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /**
   * Toute écriture passe par ici. Le message de succès n'apparaît qu'après confirmation du serveur ;
   * sinon l'erreur réelle est affichée, l'écran reste inchangé et la fonction renvoie `null`.
   */
  const adminCall = async <T = any,>(
    path: string,
    options: ApiOptions,
    feedback: { scopes: string[]; success?: string; successTitle?: string; errorTitle?: string }
  ): Promise<T | null> => {
    try {
      const data = await apiRequest<T>(`/api/admin${path}`, { ...options, token });
      if (feedback.success) triggerToast(feedback.success, feedback.successTitle);
      await refreshData(feedback.scopes);
      return data ?? ({} as T);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        return null;
      }
      triggerToast(
        err?.message || "L'action n'a pas pu être enregistrée.",
        feedback.errorTitle || "Non enregistré",
        "error"
      );
      if (err instanceof ApiError && err.conflict) await refreshData(feedback.scopes);
      return null;
    }
  };

  const persistHubs = (hubs: any[], feedback?: { success: string; successTitle: string }) =>
    adminCall(
      "/settings",
      { method: "PUT", body: { [CUSTOM_HUBS_SETTING]: JSON.stringify(hubs) } },
      { scopes: [], ...feedback }
    );

  /** Modification champ par champ : on attend la fin de la frappe avant d'enregistrer. */
  const queueHubsSave = (hubs: any[]) => {
    if (hubsSaveTimerRef.current) clearTimeout(hubsSaveTimerRef.current);
    hubsSaveTimerRef.current = setTimeout(() => void persistHubs(hubs), 800);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const created = await adminCall<{ tracking_number: string }>(
      "/shipments",
      {
        method: "POST",
        body: {
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
        },
      },
      { scopes: ["shipments", "clients"], successTitle: "Expédition créée", success: "Expédition enregistrée en base." }
    );
    if (created) setShowCreateShipmentModal(false);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showStatusModal) return;

    const updated = await adminCall(
      `/shipments/${showStatusModal.id}/status`,
      { method: "PATCH", body: statusUpdate },
      { scopes: ["shipments", "requests"], success: "Statut enregistré : le client le voit déjà.", successTitle: "Suivi Colis" }
    );
    if (updated) setShowStatusModal(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPayment.client_id) return;

    const recorded = await adminCall(
      "/payments",
      {
        method: "POST",
        body: {
          client_id: newPayment.client_id,
          shipment_id: newPayment.shipment_id || undefined,
          amount_minor: Math.round(Number(newPayment.amount) * 100),
          currency: newPayment.currency,
          payment_method: newPayment.payment_method,
          payment_type: newPayment.payment_type,
          reference_code: newPayment.reference_code || undefined,
          status: newPayment.status || "PENDING",
          receipt_notes: newPayment.receipt_notes || undefined,
        },
      },
      { scopes: ["payments", "shipments"], success: "Paiement enregistré.", successTitle: "Finances & Caisse" }
    );
    if (recorded) setShowRecordPaymentModal(null);
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!token) return;
    if (!confirm("Confirmer la bonne réception de ce paiement sur le compte / en caisse de Roum Transit ?")) return;

    await adminCall(
      `/payments/${paymentId}/status`,
      { method: "PATCH", body: { status: "CONFIRMED" } },
      { scopes: ["payments", "shipments"], success: "Paiement confirmé.", successTitle: "Finances & Caisse" }
    );
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!token) return;
    if (!confirm("Rejeter ou annuler ce paiement ?")) return;

    await adminCall(
      `/payments/${paymentId}/status`,
      { method: "PATCH", body: { status: "CANCELLED" } },
      { scopes: ["payments", "shipments"], success: "Paiement annulé.", successTitle: "Finances & Caisse" }
    );
  };

  const initAdminQuoteFormForRequest = (reqObj: any) => {
    const isSea =
      reqObj?.shipping_mode_type === "SEA" ||
      String(reqObj?.shipping_mode_name || "").toLowerCase().includes("maritime") ||
      String(reqObj?.shipping_mode_name || "").toLowerCase().includes("bateau");
    const modeStr = String(reqObj?.shipping_mode_name || "").toLowerCase();
    const defaultRate = isSea
      ? 300000
      : modeStr.includes("batterie") || modeStr.includes("spécial")
      ? 14000
      : modeStr.includes("normal") || modeStr.includes("standard")
      ? 10000
      : 12000;

    const wKg = Number(reqObj?.estimated_weight_kg) || 2;
    const vCbm = Number(reqObj?.estimated_cbm) || 0.1;
    const goodsFcfa = Number(reqObj?.total_goods_fcfa) || 0;
    const existingShip = Number(reqObj?.shipping_fee_fcfa) || 0;
    const calcShip =
      existingShip > 0
        ? existingShip
        : isSea
        ? Math.round(vCbm * defaultRate)
        : Math.round(wKg * defaultRate);
    const totalFcfa = goodsFcfa + calcShip;

    setAdminQuoteForm({
      weight_kg: wKg,
      volume_cbm: vCbm,
      rate_per_unit: defaultRate,
      goods_fcfa: goodsFcfa,
      shipping_fcfa: calcShip,
      total_fcfa: totalFcfa,
    });
  };

  const handleOpenRequestDetail = async (reqItem: any) => {
    const initial = { ...reqItem, items: reqItem.items || [] };
    setShowRequestDetailModal(initial);
    initAdminQuoteFormForRequest(initial);

    if (!token) return;
    try {
      const data = await apiRequest<{ request: any; items: any[] }>(
        `/api/admin/requests/${encodeURIComponent(reqItem.reference || reqItem.id)}`,
        { token, timeoutMs: 60000 }
      );
      if (data.request) {
        setShowRequestDetailModal({ ...data.request, items: data.items || [] });
        initAdminQuoteFormForRequest(data.request);
      }
    } catch (err: any) {
      triggerToast(err?.message || "Impossible de charger le dossier.", "Commandes Clients", "error");
    }
  };

  // ÉTAPE 2 (Admin) : le devis est d'abord enregistré en base, le lien de paiement n'est envoyé qu'ensuite
  const handleSaveQuoteAndSendPaymentWhatsApp = async (reqObj: any, openWhatsApp = true): Promise<any | null> => {
    if (!reqObj) return null;
    const isSea =
      reqObj.shipping_mode_type === "SEA" ||
      String(reqObj.shipping_mode_name || "").toLowerCase().includes("maritime");

    const saved = await adminCall<{ request: any }>(
      `/requests/${encodeURIComponent(reqObj.reference || reqObj.id)}/quote`,
      {
        method: "PATCH",
        body: {
          estimatedWeightKg: isSea ? null : Number(adminQuoteForm.weight_kg) || 1,
          estimatedCbm: isSea ? Number(adminQuoteForm.volume_cbm) || 0.1 : null,
          goodsTotalFcfa: Number(adminQuoteForm.goods_fcfa) || 0,
          shippingFeeFcfa: Number(adminQuoteForm.shipping_fcfa) || 0,
          totalAmountFcfa: Number(adminQuoteForm.total_fcfa) || 0,
          shippingModeName: reqObj.shipping_mode_name,
          expectedVersion: reqObj.row_version,
        },
      },
      {
        scopes: ["requests", "shipments", "payments"],
        success: `Devis enregistré (${Number(adminQuoteForm.total_fcfa).toLocaleString("fr-FR")} FCFA) : le client le voit déjà.`,
        successTitle: "Devis Enregistré en Base",
      }
    );
    if (!saved?.request) return null;

    const updatedReq = saved.request;
    setShowRequestDetailModal((open: any) =>
      open && open.id === updatedReq.id
        ? { ...open, ...updatedReq, payment_receipt_url: updatedReq.payment_receipt_url || open.payment_receipt_url }
        : open
    );

    if (openWhatsApp && typeof window !== "undefined") {
      const waUrl = buildAdminQuotePaymentWhatsAppUrl({
        clientPhone: updatedReq.client_phone || "",
        clientName: updatedReq.client_name || "Client",
        reference: updatedReq.reference,
        accessKey: updatedReq.access_key,
        destination: updatedReq.destination_country || "Côte d'Ivoire",
        shippingMode: updatedReq.shipping_mode_name || (isSea ? "Voie Maritime" : "Voie Aérienne"),
        estimatedWeightKg: isSea ? undefined : Number(adminQuoteForm.weight_kg) || 1,
        estimatedCbm: isSea ? Number(adminQuoteForm.volume_cbm) || 0.1 : undefined,
        productName: updatedReq.product_name || updatedReq.items?.[0]?.product_name || "Article commandé",
        productQuantity: Number(updatedReq.product_quantity || updatedReq.items?.[0]?.quantity || 1),
        goodsTotalFcfa: Number(adminQuoteForm.goods_fcfa) || 0,
        shippingFeeFcfa: Number(adminQuoteForm.shipping_fcfa) || 0,
        totalAmountFcfa: Number(adminQuoteForm.total_fcfa) || 0,
        waveNumber: companySettings.payment_wave_ci,
        orangeNumber: companySettings.payment_orange_money_ci,
        moroccoRib: moroccoAccountLabel(companySettings),
      });
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    return updatedReq;
  };

  // ÉTAPE 3 (Admin) : le serveur crée en une transaction l'expédition, le suivi et le paiement en caisse
  const handleConfirmEncashmentAndGenerateTracking = async (reqObj: any, openWhatsApp = true) => {
    if (!reqObj) return;
    const isSea =
      reqObj.shipping_mode_type === "SEA" ||
      String(reqObj.shipping_mode_name || "").toLowerCase().includes("maritime");

    // Les valeurs du formulaire ne concernent que le dossier ouvert à l'écran.
    const formApplies = showRequestDetailModal?.id === reqObj.id;
    const finalWeight = isSea ? null : Number((formApplies && adminQuoteForm.weight_kg) || reqObj.estimated_weight_kg) || null;
    const finalVolume = isSea ? Number((formApplies && adminQuoteForm.volume_cbm) || reqObj.estimated_cbm) || null : null;
    const finalTotal = Number((formApplies && adminQuoteForm.total_fcfa) || reqObj.total_amount_fcfa) || 0;

    const confirmed = await adminCall<{ tracking_number: string; request: any; already_confirmed?: boolean }>(
      `/requests/${encodeURIComponent(reqObj.reference || reqObj.id)}/confirm-tracking`,
      {
        method: "POST",
        // Rejouable : le serveur renvoie le même numéro sans rien créer de plus.
        retries: 2,
        body: {
          weightKg: finalWeight,
          volumeCbm: finalVolume,
          goodsTotalFcfa: Number((formApplies && adminQuoteForm.goods_fcfa) || reqObj.total_goods_fcfa) || 0,
          shippingFeeFcfa: Number((formApplies && adminQuoteForm.shipping_fcfa) || reqObj.shipping_fee_fcfa) || 0,
          totalAmountFcfa: finalTotal > 0 ? finalTotal : undefined,
        },
      },
      { scopes: ["requests", "shipments", "payments", "clients"], successTitle: "Suivi Colis Actif" }
    );
    if (!confirmed?.tracking_number) return;

    const officialTracking = confirmed.tracking_number;
    triggerToast(`Encaissement confirmé ! N° de Suivi officiel : ${officialTracking}`, "Suivi Colis Actif");

    if (confirmed.request) {
      setShowRequestDetailModal((open: any) =>
        open && open.id === confirmed.request.id
          ? { ...open, ...confirmed.request, payment_receipt_url: confirmed.request.payment_receipt_url || open.payment_receipt_url }
          : open
      );
    }

    if (openWhatsApp && typeof window !== "undefined") {
      const updatedReq = confirmed.request || reqObj;
      const waUrl = buildAdminPaymentConfirmedTrackingWhatsAppUrl({
        clientPhone: updatedReq.client_phone || "",
        clientName: updatedReq.client_name || "Client",
        reference: updatedReq.reference || "DOSSIER",
        trackingNumber: officialTracking,
        shippingMark: updatedReq.shipping_mark,
        destination: updatedReq.destination_country || "Côte d'Ivoire",
        shippingMode: updatedReq.shipping_mode_name || (isSea ? "Voie Maritime" : "Voie Aérienne"),
        weightOrVolume: isSea ? `${finalVolume} m³` : `${finalWeight} kg`,
        productName: updatedReq.product_name || "Article commandé",
        totalAmountFcfa: finalTotal,
      });
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenConvertModal = (reqItem: any) => {
    const routesPool = availableRoutes;
    let matchedRouteId = routesPool[0]?.id || "";
    if (reqItem.destination_country) {
      const found = routesPool.find(
        (r) =>
          (r.destination_country || "").toLowerCase().includes((reqItem.destination_country || "").toLowerCase()) ||
          (reqItem.destination_country || "").toLowerCase().includes((r.destination_country || "").toLowerCase())
      );
      if (found) matchedRouteId = found.id;
    }

    const modesPool = availableModes;
    let matchedModeId = modesPool[0]?.id || "";
    if (reqItem.shipping_mode_id || reqItem.shipping_mode_type) {
      const found = modesPool.find(
        (m) =>
          m.id === reqItem.shipping_mode_id ||
          (reqItem.shipping_mode_type === "SEA" ? m.id.includes("SEA") : m.id.includes("AIR"))
      );
      if (found) matchedModeId = found.id;
    }

    setConvertForm({
      shipping_mode_id: matchedModeId,
      route_id: matchedRouteId,
      weight_kg: reqItem.estimated_weight_kg || 5,
      volume_cbm: reqItem.estimated_cbm || 0.05,
      package_label: `Dossier ${reqItem.reference}`,
      description: reqItem.description || "Marchandises client",
      estimated_price: reqItem.total_amount_fcfa || reqItem.shipping_fee_fcfa || 60000,
      currency: "FCFA",
    });
    setShowConvertRequestModal(reqItem);
  };

  const handleConvertRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConvertRequestModal) return;

    const targetIdentifier = showConvertRequestModal.reference || showConvertRequestModal.id;
    const converted = await adminCall<{ tracking_number: string }>(
      `/requests/${encodeURIComponent(targetIdentifier)}/convert`,
      {
        method: "POST",
        body: {
          shipping_mode_id: convertForm.shipping_mode_id,
          route_id: convertForm.route_id,
          weight_kg: Number(convertForm.weight_kg),
          volume_cbm: Number(convertForm.volume_cbm) || undefined,
          package_label: convertForm.package_label,
          description: convertForm.description,
          estimated_price_minor: Math.round(Number(convertForm.estimated_price) * 100),
          currency: convertForm.currency,
        },
      },
      { scopes: ["requests", "shipments", "clients"], successTitle: "Conversion réussie" }
    );
    if (!converted?.tracking_number) return;

    triggerToast(`Dossier converti ! N° de suivi attribué : ${converted.tracking_number}`, "Conversion réussie");
    setShowConvertRequestModal(null);
  };

  const handleOpenIntakeModal = (shipment: any) => {
    setIntakeForm({
      total_weight_kg: shipment.total_weight_kg || 1,
      total_volume_cbm: shipment.total_volume_cbm || 0.05,
      hub_location: user?.hubLocation || "Entrepôt Guangzhou",
      status: "RECEIVED_AT_HUB",
      comment: `Pesée physique réelle effectuée (${shipment.total_weight_kg || 1} kg), colis étiqueté`,
      final_price_minor: shipment.final_price_minor || 0,
    });
    setShowIntakeModal(shipment);
  };

  const handleShipmentIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showIntakeModal) return;

    const saved = await adminCall(
      `/shipments/${showIntakeModal.id}/intake`,
      {
        method: "PATCH",
        body: {
          total_weight_kg: Number(intakeForm.total_weight_kg),
          total_volume_cbm: Number(intakeForm.total_volume_cbm) || undefined,
          hub_location: intakeForm.hub_location,
          status: intakeForm.status,
          comment: intakeForm.comment,
          final_price_minor: intakeForm.final_price_minor ? Number(intakeForm.final_price_minor) : undefined,
        },
      },
      {
        scopes: ["shipments", "requests", "payments"],
        success: "Réception physique et pesée réelle enregistrées !",
        successTitle: "Réception Magasin",
      }
    );
    if (saved) setShowIntakeModal(null);
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

    const created = await adminCall(
      "/clients",
      { method: "POST", body: newClient },
      { scopes: ["clients"], success: "Nouveau client enregistré avec succès !", successTitle: "Client Ajouté" }
    );
    if (created) setShowCreateClientModal(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const created = await adminCall(
      "/tasks",
      { method: "POST", body: { ...newTask, due_date: newTask.due_date || undefined } },
      { scopes: ["tasks"], success: "Nouvelle tâche planifiée !", successTitle: "Tâche Créée" }
    );
    if (created) {
      setShowCreateTaskModal(false);
      setNewTask({ title: "", description: "", category: "GENERAL", priority: "MEDIUM", due_date: "" });
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    await adminCall(
      `/tasks/${taskId}/status`,
      { method: "PATCH", body: { status: nextStatus } },
      {
        scopes: ["tasks"],
        success: nextStatus === "DONE" ? "Tâche marquée comme terminée !" : "Tâche réouverte",
        successTitle: "Tâches",
      }
    );
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

    const created = await adminCall(
      "/tariffs",
      {
        method: "POST",
        body: {
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
          service_name: newTariff.service_name || undefined,
          category_tag: newTariff.category_tag || undefined,
          note: newTariff.note || undefined,
        },
      },
      { scopes: ["tariffs"], success: "Nouveau tarif ajouté : il est déjà visible par les clients.", successTitle: "Grille Tarifaire" }
    );
    if (created) setShowCreateTariffModal(false);
  };

  const handleCreateAirRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(airRouteForm.price_per_unit || 0);
    const priceMinor = Math.round(priceNum * 100);
    const timestamp = Date.now();
    const newItems: any[] = [];

    const item1 = {
      id: `tariff-air-${timestamp}-1`,
      origin_country: airRouteForm.origin_country.trim(),
      origin_city: airRouteForm.origin_city.trim() || null,
      destination_country: airRouteForm.destination_country.trim(),
      destination_city: airRouteForm.destination_city.trim() || null,
      shipping_mode_name: airRouteForm.service_name.trim() || "Liaison Aérienne Directe",
      shipping_mode_type: "AIR",
      category_tag: airRouteForm.category_tag.trim() || "Liaison Aérienne",
      pricing_basis: airRouteForm.pricing_basis,
      currency: airRouteForm.currency,
      price_per_unit_minor: priceMinor,
      minimum_charge_minor: priceMinor,
      price_per_unit: priceNum,
      estimated_days_min: Number(airRouteForm.estimated_days_min) || 3,
      estimated_days_max: Number(airRouteForm.estimated_days_max) || 5,
      note: airRouteForm.note.trim() || (airRouteForm.isBilateral ? "Liaison bilatérale dans les 2 sens" : "Liaison aérienne directe"),
      is_active: 1,
    };
    newItems.push(item1);

    if (airRouteForm.isBilateral) {
      const item2 = {
        id: `tariff-air-${timestamp}-2`,
        origin_country: airRouteForm.destination_country.trim(),
        origin_city: airRouteForm.destination_city.trim() || null,
        destination_country: airRouteForm.origin_country.trim(),
        destination_city: airRouteForm.origin_city.trim() || null,
        shipping_mode_name: (airRouteForm.service_name.trim() || "Liaison Aérienne") + " (Sens Retour)",
        shipping_mode_type: "AIR",
        category_tag: airRouteForm.category_tag.trim() || "Liaison Aérienne",
        pricing_basis: airRouteForm.pricing_basis,
        currency: airRouteForm.currency,
        price_per_unit_minor: priceMinor,
        minimum_charge_minor: priceMinor,
        price_per_unit: priceNum,
        estimated_days_min: Number(airRouteForm.estimated_days_min) || 3,
        estimated_days_max: Number(airRouteForm.estimated_days_max) || 5,
        note: "Liaison bilatérale reliée dans les 2 sens",
        is_active: 1,
      };
      newItems.push(item2);
    }

    for (const item of newItems) {
      const { id: _localId, ...payload } = item;
      const saved = await adminCall(
        "/tariffs",
        { method: "POST", body: { ...payload, service_name: item.shipping_mode_name } },
        { scopes: ["tariffs"] }
      );
      if (!saved) return;
    }

    setShowCreateAirRouteModal(false);
    setSaveConfirmationPopup({
      title: airRouteForm.isBilateral ? "Liaison Bilatérale Reliée !" : "Liaison Aérienne Créée !",
      subtitle: airRouteForm.isBilateral
        ? "Les deux directions (Aller et Retour) ont été créées et enregistrées avec succès en base de données."
        : "La liaison aérienne a été enregistrée avec succès en base de données.",
      item: {
        service: airRouteForm.service_name,
        price: `${priceNum.toLocaleString()} ${airRouteForm.currency} / kg`,
        route: `${airRouteForm.origin_country} (${airRouteForm.origin_city}) ➔ ${airRouteForm.destination_country} (${airRouteForm.destination_city})`,
        delay: `${airRouteForm.estimated_days_min} à ${airRouteForm.estimated_days_max} jours`,
        transport: "Liaison Aérienne Directe",
      },
    });
  };

  const handleAddMoroccoCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    const dest = moroccoCountryForm.destination_country.trim();
    const priceNum = Number(moroccoCountryForm.price_per_unit || 7000);
    const priceMinor = Math.round(priceNum * 100);

    const newMoroccoTariff = {
      id: `tariff-ma-custom-${Date.now()}`,
      service_name: `Groupage vers ${dest}`,
      origin_country: "Maroc",
      origin_city: "Casablanca",
      destination_country: dest,
      destination_city: moroccoCountryForm.destination_city.trim() || dest,
      shipping_mode_name: `Groupage Aérien Casablanca ➔ ${dest}`,
      shipping_mode_type: "AIR",
      category_tag: "Groupage Maroc",
      pricing_basis: "PER_KG",
      transport_mode: "AIR_STANDARD",
      currency: moroccoCountryForm.currency || "FCFA",
      price_per_unit: priceNum,
      price_per_unit_minor: priceMinor,
      minimum_charge_minor: priceMinor,
      estimated_days_min: Number(moroccoCountryForm.estimated_days_min || 5),
      estimated_days_max: Number(moroccoCountryForm.estimated_days_max || 5),
      note: moroccoCountryForm.note.trim() || "Groupage aérien Casablanca 5 jours garantis",
      is_active: 1,
    };

    const { id: _localId, ...moroccoPayload } = newMoroccoTariff;
    const savedMorocco = await adminCall(
      "/tariffs",
      { method: "POST", body: moroccoPayload },
      { scopes: ["tariffs"] }
    );
    if (!savedMorocco) return;

    setShowAddMoroccoCountryModal(false);
    setSaveConfirmationPopup({
      title: "Nouvelle Destination Maroc Enregistrée !",
      subtitle: "La destination a été ajoutée et synchronisée immédiatement avec succès.",
      item: {
        service: newMoroccoTariff.service_name,
        price: `${priceNum.toLocaleString()} ${newMoroccoTariff.currency} / kg`,
        route: `Maroc (Casablanca) ➔ ${dest}`,
        delay: `${newMoroccoTariff.estimated_days_min} jours garantis`,
        transport: "Groupage Subsaharien",
      },
    });
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `hub-custom-${Date.now()}`;
    const countryInfo = [...STRATEGIC_HUBS, ...ALL_WORLD_COUNTRIES].find(
      (c) => c.name.toLowerCase() === newHubForm.country.toLowerCase()
    );
    const code = countryInfo?.code || getCountryCodeFromName(newHubForm.country) || "TR";

    const createdHub = {
      id,
      name: newHubForm.name.trim() || `Entrepôt ${newHubForm.city} (${newHubForm.country})`,
      country: newHubForm.country.trim(),
      countryCode: code,
      city: newHubForm.city.trim(),
      address: newHubForm.address.trim(),
      shipping_mark: newHubForm.shipping_mark.trim(),
      contact: newHubForm.contact.trim(),
    };

    const updated = [...customHubs, createdHub];
    if (!(await persistHubs(updated))) return;
    setCustomHubs(updated);

    setShowAddHubModal(false);
    setSaveConfirmationPopup({
      title: "Nouvel Entrepôt Enregistré !",
      subtitle: "La plateforme de réception a été ajoutée et configurée avec succès.",
      item: {
        service: createdHub.name,
        price: "Plateforme Active",
        route: `${createdHub.country} (${createdHub.city})`,
        delay: "Réception Fournisseurs",
        transport: "Entrepôt International",
      },
    });
  };

  const handleDeleteHub = async (hubId: string) => {
    const updated = customHubs.filter((h) => h.id !== hubId);
    const saved = await persistHubs(updated, {
      success: "Entrepôt retiré avec succès.",
      successTitle: "Entrepôts Internationaux",
    });
    if (saved) setCustomHubs(updated);
  };

  const handleDeleteTariff = async (tariffId: string) => {
    await adminCall(
      `/tariffs/${tariffId}`,
      { method: "DELETE" },
      { scopes: ["tariffs"], success: "Tarif retiré de la grille.", successTitle: "Tarif Supprimé" }
    );
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    // « Payé » n'est pas un simple libellé : c'est l'encaissement qui crée l'expédition et le suivi.
    if (newStatus === "CONVERTED") {
      const reqObj = requestsList.find((r) => r.id === requestId || r.reference === requestId);
      if (reqObj && !reqObj.shipment_id) {
        await handleConfirmEncashmentAndGenerateTracking(reqObj, false);
        return;
      }
    }

    const label =
      newStatus === "NEW"
        ? "NOUVEAU"
        : newStatus === "IN_REVIEW"
        ? "EN ANALYSE"
        : newStatus === "QUOTE_SENT"
        ? "DEVIS ENVOYÉ"
        : newStatus === "CONVERTED"
        ? "PAYÉ & SUIVI ACTIF"
        : newStatus === "CLOSED"
        ? "CLÔTURÉ"
        : newStatus === "CANCELLED"
        ? "ANNULÉ"
        : newStatus;

    await adminCall(
      `/requests/${encodeURIComponent(requestId)}/status`,
      { method: "PATCH", body: { status: newStatus } },
      { scopes: ["requests", "shipments"], success: `Statut mis à jour : ${label}`, successTitle: "Commandes Clients" }
    );
  };

  // --- ACTIONS DES MODALES MODIFIER : l'écran n'est mis à jour qu'après confirmation de la base ---
  const handleSaveEditTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;
    const priceNum = Number(editingTariff.price_per_unit || 0);
    const priceMinor = Math.round(priceNum * 100);
    const minChargeMinor = Math.round(Number(editingTariff.minimum_charge || priceNum) * 100);
    const originCountry = editingTariff.origin_country || "Chine";
    const destinationCountry = editingTariff.destination_country || "Côte d'Ivoire";
    const currency = editingTariff.currency || "FCFA";

    const saved = await adminCall(
      `/tariffs/${editingTariff.id}`,
      {
        method: "PUT",
        body: {
          service_name: editingTariff.service_name,
          origin_country: originCountry,
          destination_country: destinationCountry,
          transport_mode: editingTariff.transport_mode,
          price_per_unit_minor: priceMinor,
          minimum_charge_minor: minChargeMinor,
          currency,
          estimated_days_min: editingTariff.estimated_days_min,
          estimated_days_max: editingTariff.estimated_days_max,
          note: editingTariff.note,
        },
      },
      { scopes: ["tariffs"], success: "Tarif mis à jour et validé en base.", successTitle: "Succès Enregistrement" }
    );
    if (!saved) return;

    setEditingTariff(null);
    setSaveConfirmationPopup({
      title: "Tarif Enregistré & Synchronisé !",
      subtitle: "La modification est enregistrée en base et déjà visible par les clients.",
      item: {
        service: editingTariff.service_name,
        price: `${priceNum.toLocaleString()} ${currency}`,
        route: `${originCountry} ➔ ${destinationCountry}`,
        delay: editingTariff.estimated_days_min
          ? `${editingTariff.estimated_days_min} à ${editingTariff.estimated_days_max || editingTariff.estimated_days_min} jours`
          : "Délai garanti",
        transport: editingTariff.shipping_mode_type === "SEA" ? "Maritime Groupage" : "Aérien",
      },
    });
  };

  const handleSaveAllPendingTariffs = async () => {
    const pendingItems = Object.values(pendingTariffEdits);
    if (pendingItems.length === 0) return;
    setIsSavingBatchTariffs(true);

    const saved = await adminCall(
      "/tariffs/batch",
      {
        method: "PUT",
        body: {
          tariffs: pendingItems.map((t) => ({
            id: t.id,
            service_name: t.service_name,
            price_per_unit_minor: t.price_per_unit_minor,
            minimum_charge_minor: t.minimum_charge_minor,
            currency: t.currency,
            estimated_days_min: t.estimated_days_min,
            estimated_days_max: t.estimated_days_max,
            note: t.note,
            category_tag: t.category_tag,
          })),
        },
      },
      {
        scopes: ["tariffs"],
        success: `Toutes les ${pendingItems.length} modifications ont été enregistrées en base !`,
        successTitle: "Grille Tarifaire",
      }
    );

    if (saved) {
      setPendingTariffEdits({});
      setInitialTariffsBackup(null);
    }
    setIsSavingBatchTariffs(false);
  };

  const handleCancelPendingTariffs = () => {
    if (initialTariffsBackup) {
      setTariffsList(initialTariffsBackup);
    } else {
      setTariffsList((prev) =>
        prev.map((t) => {
          if (t._isPendingEdit) {
            const { _isPendingEdit, ...rest } = t;
            return rest;
          }
          return t;
        })
      );
    }
    setPendingTariffEdits({});
    setInitialTariffsBackup(null);
    triggerToast("Toutes les modifications tarifaires en attente ont été annulées.", "Grille Tarifaire");
  };

  const handleSaveEditShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    const priceMinor = Math.round(Number(editingShipment.estimated_price || (editingShipment.estimated_price_minor / 100) || 0) * 100);

    const saved = await adminCall(
      `/shipments/${editingShipment.id}`,
      {
        method: "PATCH",
        body: {
          current_status: editingShipment.current_status,
          payment_status: editingShipment.payment_status,
          total_weight_kg: Number(editingShipment.total_weight_kg) || 0,
          total_volume_cbm: editingShipment.total_volume_cbm,
          estimated_price_minor: priceMinor > 0 ? priceMinor : editingShipment.estimated_price_minor,
          final_price_minor: editingShipment.final_price_minor,
          currency: editingShipment.currency,
          client_name: editingShipment.recipient_name || editingShipment.client_name,
          client_phone: editingShipment.recipient_phone || editingShipment.client_phone,
          client_city: editingShipment.client_city,
          client_country: editingShipment.client_country,
          sender_name: editingShipment.sender_name,
          sender_phone: editingShipment.sender_phone,
          origin_country: editingShipment.origin_country,
          destination_country: editingShipment.destination_country,
        },
      },
      {
        scopes: ["shipments", "clients", "requests", "tariffs", "payments"],
        success: "Dossier d'expédition mis à jour : le client le voit déjà.",
        successTitle: "Expédition",
      }
    );
    if (!saved) return;

    setEditingShipment(null);
    if (selectedShipment?.id === editingShipment.id) setSelectedShipment(null);
  };

  const handleSaveEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const saved = await adminCall(
      `/requests/${encodeURIComponent(editingRequest.id)}`,
      { method: "PATCH", body: { ...editingRequest, expected_version: editingRequest.row_version } },
      {
        scopes: ["requests", "shipments", "clients"],
        success: "Commande modifiée : le client le voit déjà.",
        successTitle: "Commandes Clients",
      }
    );
    if (saved) setEditingRequest(null);
  };

  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const saved = await adminCall(
      `/clients/${editingClient.id}`,
      { method: "PUT", body: { ...editingClient, phone_whatsapp: editingClient.phone ?? editingClient.phone_whatsapp } },
      {
        scopes: ["clients", "shipments", "requests"],
        success: "Fiche client enregistrée avec succès !",
        successTitle: "Répertoire Clients",
      }
    );
    if (saved) setEditingClient(null);
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amountMinor = Math.round(Number(editingPayment.amount || (editingPayment.amount_minor / 100) || 0) * 100);

    const saved = await adminCall(
      `/payments/${editingPayment.id}`,
      {
        method: "PATCH",
        body: {
          amount_minor: amountMinor,
          currency: editingPayment.currency,
          payment_method: editingPayment.payment_method,
          payment_type: editingPayment.payment_type,
          reference_code: editingPayment.payment_reference ?? editingPayment.reference_code,
          shipment_tracking: editingPayment.shipment_tracking || undefined,
          status: editingPayment.status,
          receipt_notes: editingPayment.receipt_notes,
        },
      },
      { scopes: ["payments", "shipments"], success: "Paiement mis à jour et validé en caisse !", successTitle: "Finances & Caisse" }
    );
    if (saved) setEditingPayment(null);
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const saved = await adminCall(
      `/tasks/${editingTask.id}`,
      { method: "PATCH", body: editingTask },
      { scopes: ["tasks"], success: "Tâche mise à jour avec succès !", successTitle: "Tâches Opérationnelles" }
    );
    if (saved) setEditingTask(null);
  };

  // ÉCRAN 1 : CONNEXION
  if (!token || !user) {
    return (
      <AdminLogin
        email={email}
        password={password}
        error={loginError}
        loading={loginLoading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const navItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { id: "assistant", label: "Assistant Roum", icon: Compass, badge: totalAgentAlerts },
    { id: "requests", label: "Commandes & Sourcing", icon: ShoppingBag, badge: stats?.pending_requests },
    { id: "supplier_payments", label: "Paiements Fournisseurs (RMB)", icon: Coins, badge: rmbPendingCount || undefined },
    { id: "shipments", label: "Expéditions & Colis", icon: Package },
    { id: "clients", label: "Clients", icon: Users },
    { id: "tariffs", label: "Tarifs & Grilles", icon: DollarSign },
    { id: "content", label: "Contenu du site", icon: FileText },
    { id: "finances", label: "Finances & Paiements", icon: HandCoins },
    { id: "tasks", label: "Tâches", icon: CheckSquare, badge: stats?.pending_tasks },
  ];

  // ÉCRAN 2 : INTERFACE SOBRE, MINIMALISTE ET ÉLÉGANTE DU DASHBOARD
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      <div
        className={`admin-drawer-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* SIDEBAR DISCRÈTE ET RÉTRACTABLE (Logo 100% Isolé et Imposant) */}
      <aside
        className={`admin-sidebar ${isMobileMenuOpen ? "is-open" : ""}`}
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
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="sidebar-item" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                    gap: isSidebarCollapsed ? "0" : "11px",
                    padding: isSidebarCollapsed ? "8px 0" : "7px 9px",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  {/* Pastille circulaire vectorielle haute précision */}
                  <span
                    className="sidebar-icon-circle"
                    style={{
                      width: "32px",
                      height: "32px",
                      minWidth: "32px",
                      minHeight: "32px",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive ? "#1C1917" : "#FAF8F5",
                      border: isActive ? "1px solid #1C1917" : "1px solid rgba(28, 25, 23, 0.09)",
                      color: isActive ? "#FFFFFF" : "var(--brown-dark)",
                      boxShadow: isActive ? "0 2px 6px rgba(28, 25, 23, 0.2)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
                      transition: "all 0.16s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.1 : 1.8}
                      color="currentColor"
                    />
                  </span>

                  {!isSidebarCollapsed && (
                    <span
                      style={{
                        flex: 1,
                        textAlign: "left",
                        fontSize: "0.85rem",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#1C1917" : "#4B5563",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>
                  )}

                  {!isSidebarCollapsed && item.badge && item.badge > 0 && (
                    <span className="sidebar-nav-badge" style={{ marginLeft: "auto" }}>
                      {item.badge}
                    </span>
                  )}

                  {isSidebarCollapsed && item.badge && item.badge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 8,
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--brown-dark)",
                        border: "2px solid #FFFFFF",
                      }}
                    />
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
          <div className="sidebar-item" style={{ position: "relative", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`sidebar-nav-btn ${activeTab === "settings" ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                gap: isSidebarCollapsed ? "0" : "11px",
                padding: isSidebarCollapsed ? "8px 0" : "7px 9px",
                width: "100%",
                borderRadius: "12px",
              }}
            >
              <span
                className="sidebar-icon-circle"
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  minHeight: "32px",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: activeTab === "settings" ? "#1C1917" : "#FAF8F5",
                  border: activeTab === "settings" ? "1px solid #1C1917" : "1px solid rgba(28, 25, 23, 0.09)",
                  color: activeTab === "settings" ? "#FFFFFF" : "var(--brown-dark)",
                  boxShadow: activeTab === "settings" ? "0 2px 6px rgba(28, 25, 23, 0.2)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.16s ease",
                  flexShrink: 0,
                }}
              >
                <Settings
                  size={15}
                  strokeWidth={activeTab === "settings" ? 2.1 : 1.8}
                  color="currentColor"
                />
              </span>

              {!isSidebarCollapsed && (
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    fontSize: "0.85rem",
                    fontWeight: activeTab === "settings" ? 700 : 500,
                    color: activeTab === "settings" ? "#1C1917" : "#4B5563",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Paramètres & Audit
                </span>
              )}
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
              onClick={openProfileModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(28, 25, 23, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "8px 10px",
                background: "transparent",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              title="Cliquer pour modifier votre profil & photo officielle"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                <div
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
                    border: "none",
                    flexShrink: 0,
                  }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (user?.fullName || "M").charAt(0)
                  )}
                </div>
                <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.fullName || "Madame Marouba"}
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {(user?.roleName || "CEO").replace(/\s*·?\s*direction\s+g[eé]n[eé]rale/gi, "").trim() || "CEO"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSidebarCollapsed(true);
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  padding: 0,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                title="Rétracter la barre latérale"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div
                onClick={openProfileModal}
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
                  border: "none",
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
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "10px",
                fontSize: "0.84rem",
                padding: "6px 8px",
                borderRadius: "12px",
                fontWeight: 600,
                color: "#78716C",
              }}
            >
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FAF8F5",
                  border: "1px solid rgba(28, 25, 23, 0.08)",
                  color: "#78716C",
                  flexShrink: 0,
                }}
              >
                <LogOut size={14} />
              </span>
              <span>Déconnexion</span>
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
        {!(isGlobeExpanded && activeTab === "dashboard") && (
          <div className="admin-mobile-bar">
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => {
                setIsSidebarCollapsed(false);
                setIsMobileMenuOpen(true);
              }}
              aria-label="Ouvrir le menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={20} strokeWidth={2.2} />
            </button>
            <img src="/images/roum-logo-tight.png" alt="Roum Transit" style={{ height: "30px", width: "auto" }} />
          </div>
        )}

        {syncStatus === "offline" && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              padding: "11px 16px",
              marginBottom: "16px",
              background: "#FEF2F2",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "12px",
              color: "#B91C1C",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {hasLoadedData
                ? "Connexion au serveur perdue. Ces données peuvent dater et aucune action ne sera enregistrée pour le moment."
                : "Impossible de charger les données du serveur."}
            </span>
            <button type="button" className="btn btn-secondary" onClick={checkSyncNow} style={{ padding: "5px 12px", fontSize: "0.76rem" }}>
              Réessayer
            </button>
          </div>
        )}

        {/* En-tête de page sobre (Masqué en mode plein cadre de la sphère) */}
        {!(isGlobeExpanded && activeTab === "dashboard") && (
          <div
            className="admin-page-head"
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
            <h2 className="roum-brush-title" style={{ fontSize: "1.48rem", fontWeight: "800" }}>
              {activeTab === "assistant" && "Assistant Roum"}
              {activeTab === "dashboard" && "Tableau de Bord"}
              {activeTab === "requests" && "Commandes & Achats Clients"}
              {activeTab === "supplier_payments" && "Paiements Fournisseurs Chine (RMB ¥)"}
              {activeTab === "shipments" && "Expéditions & Colis"}
              {activeTab === "clients" && "Répertoire Clients"}
              {activeTab === "tariffs" && "Grilles Tarifaires"}
              {activeTab === "finances" && "Paiements & Encaissements"}
              {activeTab === "tasks" && "Tâches Opérationnelles"}
              {activeTab === "settings" && "Paramètres & Audit"}
              {activeTab === "content" && "Contenu du site"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
              {activeTab === "assistant"
                ? "Supervision des opérations, actions prioritaires et requêtes directes"
                : activeTab === "supplier_payments"
                ? "Dossiers Option 2 (Avec Fournisseur) : conversion FCFA / Yuans, contacts WeChat/WhatsApp usines & virements 24h"
                : "Gestion Opérationnelle"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>


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

        {/* 0. ASSISTANT ROUM : LA DISCUSSION ET CE QU'IL RESTE À FAIRE */}
        {activeTab === "assistant" && (
          <AssistantWorkspace
            stats={[
              { key: "caisse", label: "à valider", value: pendingPaymentsList.length, icon: <ClipboardCheck size={18} />, onClick: () => setActiveTab("finances") },
              { key: "pesees", label: "à peser", value: pendingWeighingsList.length, icon: <Scale size={18} />, onClick: () => setActiveTab("shipments") },
              { key: "commandes", label: "à chiffrer", value: pendingRequestsList.length, icon: <ShoppingBag size={18} />, onClick: () => setActiveTab("requests") },
              { key: "taches", label: "urgentes", value: urgentTasksList.length, icon: <CheckSquare size={18} />, onClick: () => setActiveTab("tasks") },
            ]}
            suggestions={[
              { label: "Bilan du jour", prompt: "Fais-moi un récapitulatif exécutif complet des opérations en cours." },
              { label: "Point caisse", prompt: "Fais-moi le point complet de la trésorerie et des encaissements en attente." },
              { label: "Pesées", prompt: "Quels sont les colis arrivés au magasin sans pesée officielle ?" },
              { label: "Devis", prompt: "Quelles sont les demandes clients en attente de cotation ?" },
            ]}
            groups={[
              {
                key: "paiements",
                title: "Paiements à valider",
                icon: <DollarSign size={14} />,
                items: pendingPaymentsList.map((p) => ({
                  id: p.id,
                  title: `${p.client_name || "Client"} · ${formatCurrencyPrice(p.amount_minor || 0, "FCFA")}`,
                  subtitle: `${p.payment_method} · Réf : ${p.transaction_reference || p.reference || "—"}`,
                  actions: [
                    { label: "Valider", primary: true, onClick: () => handleConfirmPayment(p.id) },
                    { label: "Rejeter", onClick: () => handleCancelPayment(p.id) },
                  ],
                })),
              },
              {
                key: "pesees",
                title: "Colis à peser",
                icon: <Scale size={14} />,
                items: pendingWeighingsList.map((s) => ({
                  id: s.id,
                  title: `${s.tracking_number} · ${s.client_name}`,
                  subtitle: (
                    <>
                      <CircularFlag countryName={s.origin_country} size={13} />
                      {s.origin_country} →
                      <CircularFlag countryName={s.destination_country} size={13} />
                      {s.destination_country}
                    </>
                  ),
                  actions: [
                    { label: "Peser", icon: <Scale size={13} />, primary: true, onClick: () => handleOpenIntakeModal(s) },
                    { label: "Photos", icon: <Camera size={13} />, onClick: () => setShowPhotosModal(s) },
                  ],
                })),
              },
              {
                key: "demandes",
                title: "Demandes à chiffrer",
                icon: <Inbox size={14} />,
                items: pendingRequestsList.map((r) => ({
                  id: r.id,
                  title: `${r.reference} · ${r.client_name}`,
                  subtitle: (
                    <>
                      {formatRequestType(r.request_type)} ·
                      <CircularFlag countryName={r.origin_country || "Chine"} size={13} />
                      {r.origin_country || "Chine"} →
                      <CircularFlag countryName={r.destination_country || "Afrique"} size={13} />
                      {r.destination_country || "Afrique"}
                    </>
                  ),
                  actions: [{ label: "Traiter", primary: true, onClick: () => handleOpenRequestDetail(r) }],
                })),
              },
              {
                key: "taches",
                title: "Tâches prioritaires",
                icon: <CheckSquare size={14} />,
                items: urgentTasksList.map((task) => ({
                  id: task.id,
                  title: task.title,
                  subtitle: formatTaskPriority(task.priority),
                  actions: [{ label: "Voir", onClick: () => setActiveTab("tasks") }],
                })),
              },
            ]}
            messages={chatMessages}
            thinking={isAgentThinking}
            input={chatInput}
            onInputChange={setChatInput}
            onAsk={handleAskAgent}
            onOpenTab={(tab) => setActiveTab(tab as any)}
            scrollRef={chatScrollContainerRef}
            endRef={chatMessagesEndRef}
            renderAgentText={(message, isLatest) => (
              <IOSTypingMessage text={message.text} isNew={isLatest} onTick={() => scrollToChatBottom()} />
            )}
          />
        )}

        {/* 1. TABLEAU DE BORD : CONSOLE HAUTE LOGISTIQUE & THÉÂTRE OPÉRATIONNEL SYNCHRONISÉ */}
        {activeTab === "dashboard" && (
          <div key="dashboard" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* TIER 1 : 4 INDICATEURS CLÉS ESSENTIELS (Grille Symétrique Épurée sur 1 ligne) */}
              <div className="kpi-grid-4">
                <div
                  className="ios-metric-card"
                  onClick={() => setDashboardFilter("IN_TRANSIT")}
                  style={{ cursor: "pointer" }}
                  title="Filtrer les colis en transit actif"
                >
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Package size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">
                        En Transit Actif
                      </span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                      Actif
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {shipments.filter((s) => s.current_status === "IN_TRANSIT").length} dossiers
                    </div>
                    <div className="metric-card-sub">
                      {shipments.filter((s) => s.current_status === "IN_TRANSIT").reduce((acc, s) => acc + (Number(s.total_weight_kg) || 0), 0).toLocaleString("fr-FR")} kg en acheminement
                    </div>
                  </div>
                </div>

                <div
                  className="ios-metric-card"
                  onClick={() => setActiveTab("requests")}
                  style={{ cursor: "pointer" }}
                  title="Ouvrir les commandes clients"
                >
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <ShoppingBag size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">
                        Commandes Clients
                      </span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-gold">
                      En cours
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {stats?.pending_requests ?? (requestsList.length > 0 ? requestsList.filter((r) => r.status === "NEW" || r.status === "IN_REVIEW").length : 3)} commandes
                    </div>
                    <div className="metric-card-sub">
                      Achats en Chine & commandes
                    </div>
                  </div>
                </div>

                <div
                  className="ios-metric-card"
                  onClick={() => setDashboardFilter("DELIVERED")}
                  style={{ cursor: "pointer" }}
                  title="Filtrer les colis livrés"
                >
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <PackageCheck size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">
                        Colis Livrés
                      </span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      100%
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {shipments.filter((s) => s.current_status === "DELIVERED").length} livrés
                    </div>
                    <div className="metric-card-sub">
                      Remis en mains propres aux clients
                    </div>
                  </div>
                </div>

                <div
                  className="ios-metric-card"
                  onClick={() => setActiveTab("finances")}
                  style={{ cursor: "pointer" }}
                  title="Ouvrir Paiements & Caisse"
                >
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <BillsIcon size={19} />
                      </span>
                      <span className="metric-card-title">
                        Trésorerie Caisse
                      </span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">
                      Sécurisé
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {formatCurrencyPrice(stats?.total_payments_minor || 0, "FCFA")}
                    </div>
                    <div className="metric-card-sub">
                      {paymentsList.filter((p: any) => p.status === "CONFIRMED").length} règlements clients confirmés
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 2 : THÉÂTRE OPÉRATIONNEL (GLOBE 3D RADAR · FICHE COLIS EN DIRECT) */}
              <div
                className="operational-theatre-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.4fr) 356px",
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
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    background: "#FFFFFF",
                    borderRadius: "22px",
                    border: "1px solid rgba(28, 25, 23, 0.08)",
                    boxShadow: "0 8px 28px -4px rgba(28, 25, 23, 0.04)",
                  }}
                >
                  {activeShipment ? (
                    <>
                      {/* Entête Fiche Colis */}
                      <div style={{ paddingBottom: "14px", borderBottom: "1px solid rgba(28, 25, 23, 0.07)", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "8px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--brown-light)" }}>
                            <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                            Fiche Colis en direct
                          </span>
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
                                whiteSpace: "nowrap",
                              }}
                              title="Réafficher l'ensemble des flux du réseau sur le globe"
                            >
                              Tous les flux
                            </button>
                          )}
                        </div>

                        {/* Numéro de suivi & Bouton Copier */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <div style={{ fontSize: "1.22rem", fontWeight: "800", color: "var(--brown-dark)", letterSpacing: "-0.015em" }} className="tabular-nums">
                            {activeShipment.tracking_number}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(activeShipment.tracking_number)}
                            title="Copier le numéro de suivi"
                            style={{
                              background: copiedTracking ? "rgba(40, 167, 69, 0.1)" : "#F7F5F2",
                              border: "1px solid " + (copiedTracking ? "#28A745" : "rgba(28, 25, 23, 0.08)"),
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

                        {/* Statut en dessous à la ligne (jamais écrasé) */}
                        <div>
                          <span
                            className={`badge-clean ${
                              activeShipment.current_status === "DELIVERED"
                                ? "badge-delivered"
                                : activeShipment.current_status === "IN_TRANSIT"
                                ? "badge-transit"
                                : "badge-draft"
                            }`}
                            style={{ fontSize: "0.73rem", padding: "4px 12px", borderRadius: "9999px", fontWeight: "700", display: "inline-flex", alignItems: "center" }}
                          >
                            {activeShipment.status_label || (activeShipment.current_status === "IN_TRANSIT" ? "En cours d'acheminement" : activeShipment.current_status === "DELIVERED" ? "Livré au client" : "Reçu au magasin")}
                          </span>
                        </div>
                      </div>

                      {/* Trajet & Mode de transport (Style Bordereau Épuré, Zéro Dépassement) */}
                      <div style={{ padding: "12px 14px", background: "#FFFFFF", borderRadius: "14px", border: "1px solid var(--border-light)", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "8px", minWidth: 0 }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Corridor
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "var(--brown-dark)", fontWeight: "700", background: "#FFFFFF", padding: "2px 8px", borderRadius: "9999px", border: "1px solid rgba(28, 25, 23, 0.08)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {(activeShipment.shipping_mode_name || "").includes("Aérien") || activeShipment.shipping_mode_id === "AIR_EXPRESS" ? (
                              <>
                                <Plane size={11} strokeWidth={1.8} /> Aérien Express
                              </>
                            ) : (
                              <>
                                <Ship size={11} strokeWidth={1.8} /> Fret Maritime
                              </>
                            )}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                            <CircularFlag countryName={activeShipment.origin_country || "Chine"} size={16} />
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {activeShipment.origin_country || "Chine"}
                            </span>
                          </div>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", minWidth: "16px" }}>
                            <div style={{ flex: 1, height: "1px", borderTop: "1px dashed rgba(107, 88, 68, 0.35)" }} />
                            <span style={{ color: "var(--brown-light)", fontSize: "0.75rem", lineHeight: 1 }}>→</span>
                            <div style={{ flex: 1, height: "1px", borderTop: "1px dashed rgba(107, 88, 68, 0.35)" }} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                            <CircularFlag countryName={activeShipment.destination_country || "Afrique"} size={16} />
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--brown-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {activeShipment.destination_country || "Afrique"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Client Destinataire & Contact direct WhatsApp */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#FFFFFF", borderRadius: "13px", border: "1px solid var(--border-light)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "2px" }}>
                            Client Destinataire
                          </div>
                          <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {activeShipment.client_name || "Client Partenaire"}
                          </div>
                          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "1px" }} className="tabular-nums">
                            {activeShipment.client_phone || "+223 ..."}
                          </div>
                        </div>
                        {activeShipment.client_phone && (
                          <a
                            href={getWhatsAppUrl(activeShipment.client_phone, activeShipment.tracking_number, activeShipment.client_name)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none",
                              transition: "transform 0.15s ease",
                              flexShrink: 0,
                            }}
                            title="Ouvrir WhatsApp direct pour informer le client"
                          >
                            <WhatsAppLogo size={32} />
                          </a>
                        )}
                      </div>

                      {/* Métriques Poids & Colis */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ padding: "9px 12px", background: "#F8F7F5", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)" }}>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.04em" }}>Poids Total</div>
                          <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", marginTop: "2px" }} className="tabular-nums">
                            {activeShipment.total_weight_kg || activeShipment.weight_kg || 0} kg
                          </div>
                        </div>
                        <div style={{ padding: "9px 12px", background: "#F8F7F5", borderRadius: "12px", border: "1px solid rgba(28, 25, 23, 0.06)" }}>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.04em" }}>Colisage</div>
                          <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", marginTop: "2px" }} className="tabular-nums">
                            {activeShipment.total_parcels_count || 1} colis
                          </div>
                        </div>
                      </div>

                      {/* Progression des Étapes avec ligne verticale continue */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.66rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                            Progression de livraison
                          </span>
                          <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--brown-dark)", background: "#F6F3EE", padding: "2px 8px", borderRadius: "9999px", border: "1px solid rgba(28, 25, 23, 0.08)" }}>
                            Étape {getShipmentPhase(activeShipment.current_status)} / 5
                          </span>
                        </div>
                        {(() => {
                          const currentPhase = getShipmentPhase(activeShipment.current_status);
                          const phases = [
                            "Reçu au magasin départ",
                            "Contrôlé et emballé",
                            "En vol / En mer vers l'Afrique",
                            "Arrivé en agence locale",
                            "Livré au client",
                          ];
                          return (
                            <div style={{ display: "flex", flexDirection: "column", padding: "12px 14px", background: "#FFFFFF", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                              {phases.map((label, idx) => {
                                const phaseNumber = idx + 1;
                                const isDone = phaseNumber < currentPhase;
                                const isCurrent = phaseNumber === currentPhase;
                                const isLast = idx === phases.length - 1;
                                return (
                                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", position: "relative", paddingBottom: isLast ? 0 : "10px" }}>
                                    {!isLast && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          left: "4.5px",
                                          top: "12px",
                                          bottom: 0,
                                          width: "1.5px",
                                          background: isDone ? "#059669" : "rgba(28, 25, 23, 0.12)",
                                        }}
                                      />
                                    )}
                                    <span
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        marginTop: "3px",
                                        borderRadius: "50%",
                                        background: isDone
                                          ? "#059669"
                                          : isCurrent
                                          ? "var(--brown-dark)"
                                          : "#E5E7EB",
                                        boxShadow: isCurrent ? "0 0 0 3px rgba(28, 25, 23, 0.16)" : "none",
                                        flexShrink: 0,
                                        zIndex: 1,
                                      }}
                                    />
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, gap: "6px", fontSize: "0.75rem", lineHeight: 1.25 }}>
                                      <span
                                        style={{
                                          fontWeight: isCurrent ? "800" : isDone ? "600" : "400",
                                          color: isCurrent ? "var(--brown-dark)" : isDone ? "var(--text-main)" : "var(--text-muted)",
                                        }}
                                      >
                                        {label}
                                      </span>
                                      {isCurrent && (
                                        <span style={{ fontSize: "0.62rem", fontWeight: "800", color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.04em", background: "#F6F3EE", padding: "2px 6px", borderRadius: "4px", flexShrink: 0 }}>
                                          En cours
                                        </span>
                                      )}
                                      {isDone && (
                                        <span style={{ color: "#059669", fontSize: "0.72rem", fontWeight: "700", flexShrink: 0 }}>
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Boutons d'action rapide */}
                      <div style={{ marginTop: "auto", display: "flex", gap: "8px", paddingTop: "2px" }}>
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
                          onClick={() => setShowPhotosModal(activeShipment)}
                          className="btn btn-secondary"
                          style={{ padding: "9px 14px", fontSize: "0.8rem", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          title="Ajouter les photos du colis, visibles par le client dans son suivi"
                        >
                          <Camera size={14} />
                          Photos
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
              <div className="card-clean" style={{ padding: "22px 24px", background: "#FFFFFF", borderRadius: "22px" }}>
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
                    <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                      Cliquez sur une expédition pour l&apos;inspecter et la localiser sur le globe 3D.
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
                          label: `Au Magasin (${shipments.filter((s) => s.current_status === "RECEIVED_AT_HUB" || s.current_status === "IN_PREPARATION" || s.current_status === "PREPARATION").length})`,
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

                    {/* Barre de recherche Minimaliste */}
                    <div style={{ position: "relative" }}>
                      <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Rechercher tracking, client..."
                        value={dashboardSearch}
                        onChange={(e) => setDashboardSearch(e.target.value)}
                        style={{
                          padding: "6px 14px 6px 34px",
                          fontSize: "0.8rem",
                          border: "1px solid var(--border-light)",
                          borderRadius: "8px",
                          background: "#FFFFFF",
                          width: "220px",
                          height: "36px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tableau */}
                <div style={{ overflowX: "auto" }}>
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th style={{ borderTopLeftRadius: "10px" }}>N° Dossier</th>
                        <th>Client</th>
                        <th>Corridor</th>
                        <th>Mode</th>
                        <th>Poids / Colis</th>
                        <th>Statut</th>
                        <th>Règlement</th>
                        <th className="col-right" style={{ borderTopRightRadius: "10px" }}>Radar 3D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDashboardShipments.map((s) => {
                        const isSelected = activeShipment?.id === s.id;
                        const shortMode = formatShippingModeShort(s.shipping_mode_name, s.shipping_mode_id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => handleSelectShipment(s)}
                            className={`table-row-clean ${isSelected ? "active-row-highlight" : ""}`}
                            style={{ cursor: "pointer" }}
                          >
                            <td>
                              <div style={{ fontWeight: "800", fontSize: "0.8rem", color: "var(--brown-dark)", display: "inline-flex", alignItems: "center", gap: "6px" }} className="tabular-nums">
                                <span>{s.tracking_number}</span>
                                {isSelected && (
                                  <span style={{ fontSize: "0.62rem", padding: "2px 6px", background: "var(--brown-dark)", color: "#FFF", borderRadius: "9999px", fontWeight: "700" }}>
                                    Actif
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.82rem" }}>{s.client_name}</div>
                              <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }} className="tabular-nums">{s.client_phone}</div>
                            </td>
                            <td>
                              <div className="corridor-pill-clean" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <CircularFlag countryName={s.origin_country || "Chine"} size={14} />
                                <span>{s.origin_country || "Chine"}</span>
                                <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>→</span>
                                <CircularFlag countryName={s.destination_country || "Afrique"} size={14} />
                                <strong style={{ color: "var(--brown-dark)" }}>{s.destination_country || "Afrique"}</strong>
                              </div>
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: "600", fontSize: "0.78rem" }}>
                                {shortMode.includes("Maritime") ? (
                                  <Ship size={13} color="var(--brown-light)" />
                                ) : (
                                  <Plane size={13} color="var(--brown-light)" />
                                )}
                                <span>{shortMode}</span>
                              </div>
                            </td>
                            <td>
                              <div className="tabular-nums" style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.8rem" }}>{s.total_weight_kg || 0} kg</div>
                              <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }}>{s.total_parcels_count || 1} colis</div>
                            </td>
                            <td>
                              <span
                                className={`badge-clean ${
                                  s.current_status === "DELIVERED"
                                    ? "badge-delivered"
                                    : s.current_status === "IN_TRANSIT"
                                    ? "badge-transit"
                                    : "badge-draft"
                                }`}
                                title={formatShipmentStatus(s.current_status, s.status_label)}
                              >
                                {formatShipmentStatusShort(s.current_status)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge-clean ${s.payment_status === "PAID" ? "badge-delivered" : "badge-draft"}`}>
                                {s.payment_status === "PAID" ? "Payé" : "En attente"}
                              </span>
                            </td>
                            <td className="col-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectShipment(s);
                                }}
                                style={{
                                  background: isSelected ? "var(--brown-dark)" : "#FFFFFF",
                                  color: isSelected ? "#FFFFFF" : "var(--brown-dark)",
                                  border: isSelected ? "1px solid var(--brown-dark)" : "1px solid var(--border-light)",
                                  borderRadius: "9999px",
                                  padding: "4px 10px",
                                  fontSize: "0.72rem",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <Compass size={12} /> {isSelected ? "Ciblé" : "Centrer"}
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
              <div className="card-clean" style={{ padding: "20px 24px", background: "#FFFFFF", borderRadius: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "0.98rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                      Tâches Prioritaires
                    </h3>
                    <span className="ios-trend-pill ios-trend-pill-neutral">
                      {tasksList.filter((t) => t.status !== "DONE").length} en attente
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
                  {tasksList.slice(0, 4).map((t) => {
                    const isDone = t.status === "DONE";
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTaskStatus(t.id, t.status)}
                        style={{
                          padding: "11px 14px",
                          background: isDone ? "#FAFAFC" : "#FAF9F7",
                          border: "1px solid rgba(28, 25, 23, 0.07)",
                          borderRadius: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "11px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: isDone ? "none" : "1.5px solid #D1D5DB",
                            background: isDone ? "var(--brown-dark)" : "#FFFFFF",
                            color: "#FFFFFF",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isDone && <Check size={11} strokeWidth={3} />}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: "700", textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--text-muted)" : "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                            padding: "2px 7px",
                            borderRadius: "9999px",
                            background: t.priority === "URGENT" ? "#FEF2F2" : "#FFFFFF",
                            color: t.priority === "URGENT" ? "#DC2626" : "var(--text-secondary)",
                            border: `1px solid ${t.priority === "URGENT" ? "rgba(220, 38, 38, 0.25)" : "var(--border-light)"}`,
                            flexShrink: 0,
                          }}
                        >
                          {formatTaskPriority(t.priority)}
                        </span>
                      </div>
                    );
                  })}
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
          <div key="requests" className="animate-fade-in card-clean" style={{ padding: "22px 24px", borderRadius: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Rechercher par référence, client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-clean"
                  style={{ paddingLeft: "36px", borderRadius: "9999px", background: "#FAFAFB" }}
                />
              </div>
              <span className="ios-trend-pill ios-trend-pill-neutral">
                {requestsList.length} demandes enregistrées
              </span>
            </div>

            {/* Filtres par Catégorie de Commande (DA sobre & minimaliste) */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setRequestCategoryFilter("ALL")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: requestCategoryFilter === "ALL" ? 700 : 500,
                  background: requestCategoryFilter === "ALL" ? "#140D09" : "#F3F4F6",
                  color: requestCategoryFilter === "ALL" ? "#FAF6F0" : "#4B5563",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tous les dossiers ({requestsList.length})
              </button>
              <button
                type="button"
                onClick={() => setRequestCategoryFilter("OPTION_2")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: requestCategoryFilter === "OPTION_2" ? 700 : 500,
                  background: requestCategoryFilter === "OPTION_2" ? "#6B5844" : "#F6F0E6",
                  color: requestCategoryFilter === "OPTION_2" ? "#FFFFFF" : "#6B5844",
                  border: "1px solid rgba(107, 88, 68, 0.25)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Paiements Fournisseurs RMB (Option 2)</span>
                <span style={{ background: requestCategoryFilter === "OPTION_2" ? "rgba(255,255,255,0.25)" : "#DCCDB6", padding: "1px 6px", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 }}>
                  {supplierPaymentsList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRequestCategoryFilter("OPTION_1")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: requestCategoryFilter === "OPTION_1" ? 700 : 500,
                  background: requestCategoryFilter === "OPTION_1" ? "#140D09" : "#F3F4F6",
                  color: requestCategoryFilter === "OPTION_1" ? "#FAF6F0" : "#4B5563",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sourcing Sans Fournisseur ({requestsList.filter((r) => !isOption2SupplierPayment(r) && r.request_type === "ALIBABA").length})
              </button>
              <button
                type="button"
                onClick={() => setRequestCategoryFilter("TRANSIT")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: requestCategoryFilter === "TRANSIT" ? 700 : 500,
                  background: requestCategoryFilter === "TRANSIT" ? "#140D09" : "#F3F4F6",
                  color: requestCategoryFilter === "TRANSIT" ? "#FAF6F0" : "#4B5563",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Expéditions Directes ({requestsList.filter((r) => r.request_type !== "ALIBABA" && !isOption2SupplierPayment(r)).length})
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table-clean">
                <thead>
                  <tr>
                    <th style={{ borderTopLeftRadius: "10px" }}>Dossier &amp; Article</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Trajet &amp; Mode</th>
                    <th>Poids &amp; Devis ROUM</th>
                    <th>Statut</th>
                    <th className="col-right" style={{ borderTopRightRadius: "10px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList
                    .filter((r) => {
                      if (requestCategoryFilter === "OPTION_2" && !isOption2SupplierPayment(r)) return false;
                      if (requestCategoryFilter === "OPTION_1" && (isOption2SupplierPayment(r) || r.request_type !== "ALIBABA")) return false;
                      if (requestCategoryFilter === "TRANSIT" && (isOption2SupplierPayment(r) || r.request_type === "ALIBABA")) return false;
                      return (
                        !searchTerm ||
                        r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.client_phone?.includes(searchTerm) ||
                        r.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                    })
                    .map((r) => (
                      <tr key={r.id} className="table-row-clean">
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {r.product_image ? (
                              <img
                                src={r.product_image}
                                alt={r.product_name || "Produit"}
                                onClick={() => handleOpenRequestDetail(r)}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  objectFit: "contain",
                                  background: "#FFFFFF",
                                  flexShrink: 0,
                                  border: "1px solid var(--border-light)",
                                  cursor: "pointer",
                                }}
                                title="Cliquez pour voir la photo et tous les détails"
                              />
                            ) : (
                              <div
                                onClick={() => handleOpenRequestDetail(r)}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  background: "var(--bg-app)",
                                  border: "1px dashed var(--border-light)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <Package size={18} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRequestDetail(r)}
                                  className="tabular-nums"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--brown-dark)",
                                    fontWeight: "800",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontFamily: "inherit",
                                    textAlign: "left",
                                    whiteSpace: "nowrap",
                                  }}
                                  title="Ouvrir le dossier complet"
                                >
                                  {r.reference}
                                </button>
                                {r.tracking_number && (
                                  <Link
                                    href={`/tracking/${r.tracking_number}`}
                                    target="_blank"
                                    style={{
                                      fontSize: "0.66rem",
                                      color: "#0F766E",
                                      background: "#CCFBF1",
                                      padding: "1px 6px",
                                      borderRadius: "9999px",
                                      fontWeight: 800,
                                      textDecoration: "none",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    title="N° de suivi actif (cliquable)"
                                  >
                                    <Package size={11} />
                                    <span>{r.tracking_number}</span>
                                  </Link>
                                )}
                                {(r.has_payment_proof || r.payment_receipt_url) && (
                                  <span
                                    style={{
                                      fontSize: "0.66rem",
                                      color: "#166534",
                                      background: "#DCFCE7",
                                      padding: "1px 6px",
                                      borderRadius: "9999px",
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <CheckCircle2 size={11} />
                                    <span>
                                      {String(r.payment_receipt_mime || r.payment_receipt_url || "").includes("video") || /\.(mp4|mov|webm)$/i.test(r.payment_receipt_url || "")
                                        ? "Preuve vidéo"
                                        : "Preuve reçue"}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-main)",
                                  fontWeight: 600,
                                  maxWidth: "220px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  marginTop: "2px",
                                }}
                                title={decodeHtmlEntitiesText(r.product_name || r.items?.[0]?.product_name || r.description || "")}
                              >
                                {decodeHtmlEntitiesText(r.product_name || r.items?.[0]?.product_name || "Article commandé")}
                              </div>
                              <div style={{ fontSize: "0.69rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>Qté: {r.product_quantity || r.items?.[0]?.quantity || 1} pcs</span>
                                {r.unit_price ? (
                                  <span>
                                    · {r.unit_price} {r.unit_price_currency || "USD"}
                                  </span>
                                ) : null}
                                {r.product_url && (
                                  <a
                                    href={r.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#2563EB", textDecoration: "underline", fontWeight: 700 }}
                                  >
                                    Lien ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-clean badge-draft">
                            {formatRequestType(r.request_type)}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.82rem" }}>{r.client_name}</div>
                          <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }} className="tabular-nums">{r.client_phone}</div>
                        </td>
                        <td>
                          <div className="corridor-pill-clean" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <CircularFlag countryName={r.origin_country || "Chine"} size={14} />
                            <span>{r.origin_country || "Chine"}</span>
                            <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>→</span>
                            <CircularFlag countryName={r.destination_country || "Afrique"} size={14} />
                            <strong style={{ color: "var(--brown-dark)" }}>{r.destination_country || "Afrique"}</strong>
                          </div>
                          {r.shipping_mode_name && (
                            <div style={{ fontSize: "0.69rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              {r.shipping_mode_name}
                            </div>
                          )}
                        </td>
                        <td className="tabular-nums">
                          {r.estimated_weight_kg || r.estimated_cbm ? (
                            <div>
                              <div style={{ fontWeight: "800", color: "#166534", fontSize: "0.8rem" }}>
                                {r.estimated_weight_kg ? `${r.estimated_weight_kg} kg` : `${r.estimated_cbm} m³`}
                              </div>
                              {r.total_amount_fcfa ? (
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--brown-dark)" }}>
                                  {Number(r.total_amount_fcfa).toLocaleString("fr-FR")} FCFA
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRequestDetail(r)}
                              style={{
                                background: "#F1E7D9",
                                color: "#6B5844",
                                border: "1px solid rgba(184, 164, 136, 0.35)",
                                borderRadius: "9999px",
                                padding: "3px 9px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Cliquez pour estimer le poids et envoyer le lien de paiement au client"
                            >
                              <Scale size={11} />
                              <span>Estimer poids &amp; devis</span>
                            </button>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const badgeStyle = (() => {
                              switch (r.status) {
                                case "NEW":
                                  return { bg: "#EFF6FF", color: "#1D4ED8", border: "rgba(59, 130, 246, 0.28)", stroke: "%231D4ED8" };
                                case "IN_REVIEW":
                                  return { bg: "#F5F3FF", color: "#6D28D9", border: "rgba(139, 92, 246, 0.28)", stroke: "%236D28D9" };
                                case "QUOTE_SENT":
                                  return { bg: "#F6F0E6", color: "#6B5844", border: "rgba(184, 164, 136, 0.28)", stroke: "%236B5844" };
                                case "CONVERTED":
                                  return { bg: "#ECFDF5", color: "#047857", border: "rgba(16, 185, 129, 0.28)", stroke: "%23047857" };
                                case "CANCELLED":
                                  return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(239, 68, 68, 0.28)", stroke: "%23DC2626" };
                                default:
                                  return { bg: "#F3F4F6", color: "#4B5563", border: "rgba(107, 114, 128, 0.28)", stroke: "%234B5563" };
                              }
                            })();
                            return (
                              <select
                                value={r.status}
                                onChange={(e) => handleUpdateRequestStatus(r.reference || r.id, e.target.value)}
                                className="status-select-pill"
                                style={{
                                  backgroundColor: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  borderColor: badgeStyle.border,
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${badgeStyle.stroke}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 10px center",
                                  backgroundSize: "10px 10px",
                                }}
                              >
                                <option value="NEW" style={{ background: "#FFFFFF", color: "#111827" }}>NOUVEAU</option>
                                <option value="IN_REVIEW" style={{ background: "#FFFFFF", color: "#111827" }}>EN ANALYSE</option>
                                <option value="QUOTE_SENT" style={{ background: "#FFFFFF", color: "#111827" }}>DEVIS ENVOYÉ</option>
                                <option value="CONVERTED" style={{ background: "#FFFFFF", color: "#111827" }}>PAYÉ &amp; SUIVI ACTIF</option>
                                <option value="CLOSED" style={{ background: "#FFFFFF", color: "#111827" }}>CLÔTURÉ</option>
                                <option value="CANCELLED" style={{ background: "#FFFFFF", color: "#111827" }}>ANNULÉ</option>
                              </select>
                            );
                          })()}
                        </td>
                        <td className="col-right">
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenRequestDetail(r)}
                              className="btn btn-primary"
                              style={{ padding: "4px 10px", fontSize: "0.73rem", height: "28px" }}
                            >
                              Voir tout &amp; Devis
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRequest(r)}
                              className="btn-icon-clean"
                              title="Modifier la demande"
                            >
                              <Edit3 size={13} />
                            </button>
                            <a
                              href={
                                r.tracking_number
                                  ? buildAdminPaymentConfirmedTrackingWhatsAppUrl({
                                      clientPhone: r.client_phone || "",
                                      clientName: r.client_name || "Client",
                                      reference: r.reference || "",
                                      trackingNumber: r.tracking_number,
                                      shippingMark: r.shipping_mark,
                                      destination: r.destination_country || "Côte d'Ivoire",
                                      shippingMode: r.shipping_mode_name || "Voie Aérienne",
                                      weightOrVolume: r.estimated_weight_kg ? `${r.estimated_weight_kg} kg` : r.estimated_cbm ? `${r.estimated_cbm} m³` : "Estimé",
                                      productName: r.product_name || "Article commandé",
                                      totalAmountFcfa: Number(r.total_amount_fcfa || 0),
                                    })
                                  : buildAdminQuotePaymentWhatsAppUrl({
                                      clientPhone: r.client_phone || "",
                                      clientName: r.client_name || "Client",
                                      reference: r.reference || "",
                                      destination: r.destination_country || "Côte d'Ivoire",
                                      shippingMode: r.shipping_mode_name || "Voie Aérienne",
                                      estimatedWeightKg: r.estimated_weight_kg || 2,
                                      estimatedCbm: r.estimated_cbm || undefined,
                                      productName: r.product_name || "Article commandé",
                                      accessKey: r.access_key,
                                      productQuantity: Number(r.product_quantity || 1),
                                      goodsTotalFcfa: Number(r.total_goods_fcfa || 0),
                                      shippingFeeFcfa: Number(r.shipping_fee_fcfa || 0),
                                      totalAmountFcfa: Number(r.total_amount_fcfa || 0),
                                      waveNumber: companySettings.payment_wave_ci,
                                      orangeNumber: companySettings.payment_orange_money_ci,
                                      moroccoRib: moroccoAccountLabel(companySettings),
                                    })
                              }
                              onClick={(e) => {
                                // Un devis sans montant ne doit jamais partir chez le client.
                                if (!r.tracking_number && !(Number(r.total_amount_fcfa) > 0)) {
                                  e.preventDefault();
                                  handleOpenRequestDetail(r);
                                  triggerToast("Saisissez d'abord le poids et le montant du devis.", "Devis à préparer", "info");
                                }
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
                              title={
                                r.tracking_number
                                  ? "Envoyer le N° de Suivi cliquable sur WhatsApp"
                                  : "Envoyer le Devis & Lien de Paiement sur WhatsApp"
                              }
                            >
                              <WhatsAppLogo size={28} />
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

        {/* SECTION DÉDIÉE : PAIEMENTS FOURNISSEURS EN YUANS (OPTION 2 "AVEC FOURNISSEUR") */}
        {activeTab === "supplier_payments" && (() => {
          const totalRmbToPay = supplierPaymentsList
            .filter((r) => r.status !== "CANCELLED" && r.status !== "CLOSED")
            .reduce((sum, r) => {
              const str = (r.rmb_amount || r.description?.match(/Montant:\s*([0-9\s.,]+)\s*¥/)?.[1] || "0")
                .replace(/\s/g, "")
                .replace(",", ".");
              const val = parseFloat(str) || 0;
              return sum + val;
            }, 0);

          const estimatedCfaTotal = Math.round(totalRmbToPay * getExchangeRates(companySettings).rmb);

          const filteredPayments = supplierPaymentsList.filter((r) => {
            if (supplierPaymentFilter === "NEW" && r.status !== "NEW") return false;
            if (supplierPaymentFilter === "IN_REVIEW" && r.status !== "IN_REVIEW" && r.status !== "QUOTE_SENT") return false;
            if (supplierPaymentFilter === "PAID" && r.status !== "CONVERTED") return false;
            if (!supplierPaymentSearch) return true;
            const q = supplierPaymentSearch.toLowerCase();
            return (
              r.reference?.toLowerCase().includes(q) ||
              r.client_name?.toLowerCase().includes(q) ||
              r.client_phone?.includes(q) ||
              r.supplier_contact?.toLowerCase().includes(q) ||
              r.description?.toLowerCase().includes(q)
            );
          });

          return (
            <div key="supplier_payments" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 1. KPIs EXÉCUTIFS PAIEMENT FOURNISSEUR CHINE (DA ÉPURÉE) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* KPI 1 : Total RMB */}
                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Volume Yuans à Régler
                    </span>
                    <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F6F0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B5844" }}>
                      <Coins size={16} />
                    </span>
                  </div>
                  <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#140D09", fontFamily: "var(--c-font-display)", letterSpacing: "-0.02em" }}>
                    ¥ {totalRmbToPay.toLocaleString("fr-FR")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "4px" }}>
                    Équivalent estimé : <strong style={{ color: "#6B5844" }}>{estimatedCfaTotal.toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                </div>

                {/* KPI 2 : Dossiers Actifs */}
                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Dossiers Avec Fournisseur
                    </span>
                    <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D4ED8" }}>
                      <Building2 size={16} />
                    </span>
                  </div>
                  <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#140D09", fontFamily: "var(--c-font-display)", letterSpacing: "-0.02em" }}>
                    {supplierPaymentsList.length}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "4px" }}>
                    <strong style={{ color: "#1D4ED8" }}>{rmbPendingCount}</strong> en attente de virement usine
                  </div>
                </div>

                {/* KPI 3 : Délai d'exécution */}
                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Délai de Virement Usine
                    </span>
                    <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
                      <Clock size={16} />
                    </span>
                  </div>
                  <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#140D09", fontFamily: "var(--c-font-display)", letterSpacing: "-0.02em" }}>
                    &lt; 24 Heures
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#15803D", marginTop: "4px", fontWeight: 600 }}>
                    Quittance de paiement bancaire remise au client
                  </div>
                </div>

                {/* KPI 4 : Canaux de Réception & Envoi Officiels */}
                <div className="card-clean" style={{ padding: "18px 20px", borderRadius: "18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Canaux de Paiement Officiels
                    </span>
                    <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FAF5FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#7E22CE" }}>
                      <ShieldCheck size={16} />
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#F0F9FF", padding: "3px 8px", borderRadius: "9999px", border: "1px solid #BAE6FD" }}>
                      <WaveLogo size={16} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0369A1" }}>Wave</span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#F6F0E6", padding: "3px 8px", borderRadius: "9999px", border: "1px solid #FFEDD5" }}>
                      <OrangeMoneyLogo size={16} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B5844" }}>Orange</span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#F0FDF4", padding: "3px 8px", borderRadius: "9999px", border: "1px solid #BBF7D0" }}>
                      <CompteMarocLogo size={16} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803D" }}>Compte Maroc</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "6px" }}>
                    Comptes officiels synchronisés en direct sur le site public
                  </div>
                </div>
              </div>

              {/* 2. TABLEAU PRINCIPAL DES DOSSIERS DE PAIEMENT RMB */}
              <div className="card-clean" style={{ padding: "22px 24px", borderRadius: "22px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                  {/* Recherche */}
                  <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                    <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Rechercher fournisseur WeChat, client, réf..."
                      value={supplierPaymentSearch}
                      onChange={(e) => setSupplierPaymentSearch(e.target.value)}
                      className="input-clean"
                      style={{ paddingLeft: "36px", borderRadius: "9999px", background: "#FAFAFB" }}
                    />
                  </div>

                  {/* Filtres d'état */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSupplierPaymentFilter("ALL")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.76rem",
                        fontWeight: supplierPaymentFilter === "ALL" ? 700 : 500,
                        background: supplierPaymentFilter === "ALL" ? "#140D09" : "#F3F4F6",
                        color: supplierPaymentFilter === "ALL" ? "#FAF6F0" : "#4B5563",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Tous ({supplierPaymentsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupplierPaymentFilter("NEW")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.76rem",
                        fontWeight: supplierPaymentFilter === "NEW" ? 700 : 500,
                        background: supplierPaymentFilter === "NEW" ? "#EFF6FF" : "#F3F4F6",
                        color: supplierPaymentFilter === "NEW" ? "#1D4ED8" : "#4B5563",
                        border: supplierPaymentFilter === "NEW" ? "1px solid #BFDBFE" : "none",
                        cursor: "pointer",
                      }}
                    >
                      Nouveaux ({supplierPaymentsList.filter((r) => r.status === "NEW").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupplierPaymentFilter("IN_REVIEW")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.76rem",
                        fontWeight: supplierPaymentFilter === "IN_REVIEW" ? 700 : 500,
                        background: supplierPaymentFilter === "IN_REVIEW" ? "#F6F0E6" : "#F3F4F6",
                        color: supplierPaymentFilter === "IN_REVIEW" ? "#6B5844" : "#4B5563",
                        border: supplierPaymentFilter === "IN_REVIEW" ? "1px solid #E3D4BF" : "none",
                        cursor: "pointer",
                      }}
                    >
                      En cours ({supplierPaymentsList.filter((r) => r.status === "IN_REVIEW" || r.status === "QUOTE_SENT").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupplierPaymentFilter("PAID")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.76rem",
                        fontWeight: supplierPaymentFilter === "PAID" ? 700 : 500,
                        background: supplierPaymentFilter === "PAID" ? "#ECFDF5" : "#F3F4F6",
                        color: supplierPaymentFilter === "PAID" ? "#047857" : "#4B5563",
                        border: supplierPaymentFilter === "PAID" ? "1px solid #A7F3D0" : "none",
                        cursor: "pointer",
                      }}
                    >
                      Payés en Chine ({supplierPaymentsList.filter((r) => r.status === "CONVERTED").length})
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "6px" }}>
                  <table className="table-clean" style={{ width: "100%", minWidth: "760px" }}>
                    <thead>
                      <tr>
                        <th style={{ borderTopLeftRadius: "10px", width: "200px" }}>Dossier &amp; Client</th>
                        <th style={{ width: "140px" }}>Montant Proforma</th>
                        <th style={{ width: "180px" }}>Fournisseur &amp; Mark</th>
                        <th>Article &amp; Lien</th>
                        <th style={{ width: "130px" }}>Statut Virement</th>
                        <th className="col-right" style={{ borderTopRightRadius: "10px", width: "200px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((r) => {
                        const rmbAmountVal =
                          r.rmb_amount ||
                          r.description?.match(/Montant:\s*([0-9\s.,]+)\s*¥/)?.[1]?.trim() ||
                          r.description?.match(/([0-9\s.,]+)\s*RMB/i)?.[1]?.trim() ||
                          "5 800";

                        const supplierVal =
                          r.supplier_contact ||
                          r.description?.match(/Usine:\s*([^|]+)/)?.[1]?.trim() ||
                          r.supplier_name ||
                          "WeChat: sz_supplier";

                        const shippingMarkVal =
                          r.shipping_mark ||
                          r.description?.match(/Shipping Mark:\s*([^|]+)/)?.[1]?.trim() ||
                          `ROUM / ${r.reference}`;

                        const productLinkVal =
                          r.product_url ||
                          r.items?.[0]?.product_url ||
                          r.description?.match(/Réf:\s*(https?:\/\/[^\s|]+)/)?.[1] ||
                          "";

                        const goodsVal =
                          r.product_name ||
                          r.items?.[0]?.description ||
                          r.description?.match(/Marchandise:\s*([^|]+)/)?.[1]?.trim() ||
                          r.description ||
                          "Marchandises Chine";

                        const parsedRmbNum = parseFloat(rmbAmountVal.replace(/\s/g, "").replace(",", ".")) || 0;
                        const cfaEquivalent = Math.round(parsedRmbNum * getExchangeRates(companySettings).rmb);

                        const productImg = r.product_image || "";

                        return (
                          <tr key={r.id} className="table-row-clean">
                            {/* 1. Dossier & Client */}
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRequestDetail(r)}
                                    className="tabular-nums"
                                    style={{
                                      background: "#F6F0E6",
                                      border: "1px solid #FFEDD5",
                                      color: "#6B5844",
                                      fontWeight: 800,
                                      fontSize: "0.78rem",
                                      cursor: "pointer",
                                      padding: "2px 8px",
                                      borderRadius: "9999px",
                                      fontFamily: "monospace",
                                    }}
                                    title="Consulter le dossier complet"
                                  >
                                    {r.reference}
                                  </button>
                                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                    {r.created_at?.substring(0, 10) || "Aujourd'hui"}
                                  </span>
                                </div>
                                <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.84rem", marginTop: "2px" }}>
                                  {r.client_name}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "#15803D" }}>
                                  <a
                                    href={buildAdminRequestWhatsAppUrl({
                                      clientPhone: r.client_phone || "",
                                      clientName: r.client_name || "Client",
                                      reference: r.reference || "",
                                      trackingNumber: r.tracking_number || r.reference || "",
                                      shippingMark: shippingMarkVal,
                                      destination: r.destination_country,
                                      productName: goodsVal,
                                      rmbAmount: `${rmbAmountVal} RMB ¥ (~ ${cfaEquivalent.toLocaleString("fr-FR")} FCFA)`,
                                      statusLabel: "Suivi Règlement Fournisseur Chine",
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#15803D", textDecoration: "none", fontWeight: 600 }}
                                  >
                                    <WhatsAppLogo size={16} />
                                    {r.client_phone}
                                  </a>
                                </div>
                                <div style={{ fontSize: "0.70rem", color: "#6B7280" }}>
                                  ➔ {r.destination_country || "Côte d'Ivoire"}
                                </div>
                              </div>
                            </td>

                            {/* 2. Montant Yuans RMB */}
                            <td>
                              <div
                                style={{
                                  display: "inline-block",
                                  background: "#F6F0E6",
                                  border: "1px solid #FFEDD5",
                                  padding: "6px 10px",
                                  borderRadius: "12px",
                                }}
                              >
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#3A2A21", fontFamily: "var(--c-font-display)" }}>
                                  ¥ {rmbAmountVal}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "#6B5844", fontWeight: 600, marginTop: "2px" }}>
                                  ~ {cfaEquivalent.toLocaleString("fr-FR")} FCFA
                                </div>
                              </div>
                            </td>

                            {/* 3. Fournisseur & Shipping Mark */}
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-main)" }}>
                                  {supplierVal}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof navigator !== "undefined") {
                                      navigator.clipboard.writeText(supplierVal);
                                    }
                                  }}
                                  style={{
                                    background: "#F3F4F6",
                                    border: "none",
                                    borderRadius: "9999px",
                                    color: "#4B5563",
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "3px 8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    width: "fit-content",
                                  }}
                                >
                                  <Copy size={10} />
                                  <span>Copier contact usine</span>
                                </button>
                                <div style={{ fontSize: "0.70rem", color: "#475569", marginTop: "2px" }}>
                                  Mark : <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}>{shippingMarkVal}</span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Article & Lien Proforma (avec photo réelle mise par le client) */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {productImg ? (
                                  <img
                                    src={productImg}
                                    alt="Photo article"
                                    referrerPolicy="no-referrer"
                                    style={{
                                      width: "44px",
                                      height: "44px",
                                      objectFit: "cover",
                                      borderRadius: "10px",
                                      flexShrink: 0,
                                      border: "1px solid #E5E7EB",
                                      background: "#FFFFFF",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "44px",
                                      height: "44px",
                                      borderRadius: "10px",
                                      border: "1px dashed #D1D5DB",
                                      background: "#F9FAFB",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#9CA3AF",
                                      flexShrink: 0,
                                    }}
                                    title="Aucune photo d'article jointe"
                                  >
                                    <Package size={18} />
                                  </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                      color: "var(--text-main)",
                                      lineHeight: 1.35,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "180px",
                                    }}
                                    title={goodsVal}
                                  >
                                    {goodsVal}
                                  </div>
                                  {productLinkVal ? (
                                    <a
                                      href={productLinkVal}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.70rem",
                                        fontWeight: 600,
                                        color: "#2563EB",
                                        textDecoration: "none",
                                      }}
                                      title={productLinkVal}
                                    >
                                      <span>Lien proforma</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>Lien direct</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 5. Statut Virement */}
                            <td>
                              <select
                                value={r.status}
                                onChange={(e) => handleUpdateRequestStatus(r.reference || r.id, e.target.value)}
                                className="status-select-pill"
                                style={{
                                  fontSize: "0.74rem",
                                  padding: "5px 10px",
                                  borderRadius: "9999px",
                                  fontWeight: 700,
                                }}
                              >
                                <option value="NEW">NOUVEAU</option>
                                <option value="IN_REVIEW">ANALYSE PROFORMA</option>
                                <option value="QUOTE_SENT">EN ATTENTE MOBILE MONEY</option>
                                <option value="CONVERTED">VIREMENT RMB EFFECTUÉ</option>
                                <option value="CLOSED">MARCHANDISE REÇUE MAGASIN</option>
                                <option value="CANCELLED">ANNULÉ</option>
                              </select>
                            </td>

                            {/* 6. Actions en pilules */}
                            <td className="col-right">
                              <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenConvertModal(r)}
                                  className="btn btn-secondary"
                                  style={{ padding: "5px 10px", fontSize: "0.72rem", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                  title="Attribuer un numéro de suivi et créer l'expédition"
                                >
                                  <Package size={12} />
                                  <span>Convertir</span>
                                </button>
                                <a
                                  href={buildAdminRequestWhatsAppUrl({
                                    clientPhone: r.client_phone || "",
                                    clientName: r.client_name || "Client",
                                    reference: r.reference || "",
                                    trackingNumber: r.tracking_number || r.reference || "",
                                    shippingMark: shippingMarkVal,
                                    destination: r.destination_country,
                                    productName: goodsVal,
                                    rmbAmount: `${rmbAmountVal} RMB ¥ (~ ${cfaEquivalent.toLocaleString("fr-FR")} FCFA)`,
                                    statusLabel:
                                      r.status === "CONVERTED"
                                        ? "Virement RMB effectué en Chine"
                                        : "Dossier fournisseur en traitement",
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                                  title="Contacter le client sur WhatsApp avec lien de suivi cliquable"
                                  aria-label="Contacter le client sur WhatsApp"
                                >
                                  <WhatsAppLogo size={28} />
                                </a>
                                {r.status !== "CONVERTED" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRequestStatus(r.reference || r.id, "CONVERTED")}
                                    className="btn btn-primary"
                                    style={{ padding: "5px 10px", fontSize: "0.72rem", borderRadius: "9999px" }}
                                    title="Confirmer que le virement a été fait en Chine"
                                  >
                                    Valider Virement
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-dim)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <Coins size={32} color="#D1D5DB" />
                              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                                Aucun dossier de paiement fournisseur en attente
                              </div>
                              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, maxWidth: "420px" }}>
                                Dès qu&apos;un client sélectionne l&apos;Option 2 &quot;Avec Fournisseur&quot; sur le site, son montant en Yuans et ses coordonnées usine apparaîtront instantanément ici.
                              </p>
                            </div>
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

        {/* 3. EXPÉDITIONS & COLIS */}
        {activeTab === "shipments" && (
          <div key="shipments" className="animate-fade-in card-clean" style={{ padding: "22px 24px", borderRadius: "22px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
                  <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Rechercher par n° suivi, client, téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-clean"
                    style={{ paddingLeft: "36px", borderRadius: "9999px", background: "#FAFAFB" }}
                  />
                </div>

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
              <table className="table-clean">
                <thead>
                  <tr>
                    <th style={{ borderTopLeftRadius: "10px" }}>N° Suivi</th>
                    <th>Client</th>
                    <th>Liaison</th>
                    <th>Mode</th>
                    <th>Colis / Poids</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th className="col-right" style={{ borderTopRightRadius: "10px" }}>Actions</th>
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
                    .map((s) => {
                      const shortMode = formatShippingModeShort(s.shipping_mode_name, s.shipping_mode_id);
                      return (
                        <tr key={s.id} className="table-row-clean">
                          <td>
                            <Link
                              href={`/tracking/${s.tracking_number}`}
                              target="_blank"
                              style={{ fontWeight: "800", fontSize: "0.79rem", color: "var(--brown-dark)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              className="tabular-nums"
                            >
                              <span>{s.tracking_number}</span>
                              <ExternalLink size={11} />
                            </Link>
                            <div style={{ fontSize: "0.69rem", color: "var(--text-muted)" }} className="tabular-nums">
                              {new Date(s.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.82rem" }}>{s.client_name}</div>
                            <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }} className="tabular-nums">{s.client_phone}</div>
                          </td>
                          <td>
                            <div className="corridor-pill-clean" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <CircularFlag countryName={s.origin_country} size={14} />
                              <span>{s.origin_country}</span>
                              <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>→</span>
                              <CircularFlag countryName={s.destination_country} size={14} />
                              <strong style={{ color: "var(--brown-dark)" }}>{s.destination_country}</strong>
                            </div>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.77rem" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              {shortMode.includes("Maritime") ? (
                                <Ship size={13} color="var(--brown-light)" />
                              ) : (
                                <Plane size={13} color="var(--brown-light)" />
                              )}
                              <span>{shortMode}</span>
                            </div>
                          </td>
                          <td className="tabular-nums">
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.8rem" }}>{s.total_parcels_count} colis</div>
                            <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }}>
                              {s.total_weight_kg} kg{s.total_volume_cbm ? ` · ${s.total_volume_cbm} m³` : ""}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge-clean ${
                                s.current_status === "DELIVERED"
                                  ? "badge-delivered"
                                  : s.current_status === "IN_TRANSIT"
                                  ? "badge-transit"
                                  : "badge-draft"
                              }`}
                              title={formatShipmentStatus(s.current_status, s.status_label)}
                            >
                              {formatShipmentStatusShort(s.current_status)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-clean ${s.payment_status === "PAID" ? "badge-delivered" : "badge-draft"}`}>
                              {s.payment_status === "PAID" ? "Réglé" : s.payment_status === "PARTIAL" ? "Acompte" : "En attente"}
                            </span>
                          </td>
                          <td className="col-right">
                            <div style={{ display: "inline-flex", gap: "5px", alignItems: "center", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={() => setEditingShipment({ ...s, recipient_name: s.client_name, recipient_phone: s.client_phone })}
                                className="btn-icon-clean"
                                title="Modifier tous les champs de l'expédition"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenIntakeModal(s)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", height: "28px" }}
                                title="Pesée réelle et réception physique au magasin"
                              >
                                Pesée
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenShipmentDetail(s)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", height: "28px" }}
                                title="Historique complet des étapes et paiements"
                              >
                                Historique
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowStatusModal(s)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", height: "28px" }}
                                title="Mettre à jour l'étape du colis"
                              >
                                Étape
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowPhotosModal(s)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.72rem", height: "28px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                title="Ajouter les photos du colis, visibles par le client dans son suivi"
                              >
                                <Camera size={13} />
                                Photos{s.photos_count > 0 ? ` (${s.photos_count})` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowPrintLabelModal(s)}
                                className="btn-icon-clean"
                                title="Imprimer bordereau"
                              >
                                <Printer size={13} />
                              </button>
                              <a
                                href={getWhatsAppUrl(
                                  s.client_phone,
                                  s.tracking_number,
                                  s.client_name,
                                  {
                                    origin: s.origin_country,
                                    destination: s.destination_country,
                                    statusLabel: formatShipmentStatus(s.current_status, s.status_label),
                                    shippingMode: shortMode,
                                    weightKg: s.total_weight_kg,
                                    volumeCbm: s.total_volume_cbm,
                                  }
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
                                title="Envoyer le suivi WhatsApp cliquable au client"
                              >
                                <WhatsAppLogo size={26} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "28px", color: "var(--text-dim)" }}>
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
          <div key="clients" className="animate-fade-in card-clean" style={{ padding: "22px 24px", borderRadius: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-clean"
                  style={{ paddingLeft: "36px", borderRadius: "9999px", background: "#FAFAFB" }}
                />
              </div>
              <span className="ios-trend-pill ios-trend-pill-neutral">
                {clientsList.length} clients partenaires
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table-clean">
                <thead>
                  <tr>
                    <th style={{ borderTopLeftRadius: "10px" }}>Nom du Client</th>
                    <th>WhatsApp / Téléphone</th>
                    <th>Email</th>
                    <th>Localisation</th>
                    <th>Dossiers</th>
                    <th className="col-right" style={{ borderTopRightRadius: "10px" }}>Actions</th>
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
                      <tr key={c.id} className="table-row-clean">
                        <td style={{ fontWeight: "700", color: "var(--text-main)" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#F6F3EE", border: "1px solid rgba(28, 25, 23, 0.08)", color: "var(--brown-dark)", fontSize: "0.74rem", fontWeight: "800", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {(c.full_name || "C").charAt(0).toUpperCase()}
                            </span>
                            <span>{c.full_name}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--brown-dark)", fontWeight: "700" }} className="tabular-nums">
                          {c.phone_whatsapp || c.phone || "—"}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {c.email || "—"}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          <span className="corridor-pill-clean">
                            {c.city ? `${c.city}, ` : ""}<strong style={{ color: "var(--brown-dark)" }}>{c.country}</strong>
                          </span>
                        </td>
                        <td>
                          <span className="badge-clean badge-draft">
                            {c.shipments_count || 0} expédition(s)
                          </span>
                        </td>
                        <td className="col-right">
                          <div style={{ display: "inline-flex", gap: "7px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setEditingClient({ ...c, phone: c.phone_whatsapp })}
                              className="btn-icon-clean"
                              title="Modifier la fiche client"
                            >
                              <Edit3 size={13} />
                            </button>
                            <a
                              href={buildWhatsAppUrl(c.phone_whatsapp || c.phone || "", `Bonjour ${c.full_name},\n\nC'est ROUM TRANSIT. Comment pouvons-nous vous aider ?`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
                              title="Contacter le client sur WhatsApp"
                            >
                              <WhatsAppLogo size={28} />
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
              if (tariffCorridorFilter === "CN") {
                if (!orig.includes("chine") && !dest.includes("chine")) return false;
              } else if (tariffCorridorFilter === "AE") {
                if (!orig.includes("émirat") && !orig.includes("duba") && !dest.includes("duba")) return false;
              } else if (tariffCorridorFilter === "MA") {
                if (!orig.includes("maroc") && !dest.includes("maroc")) return false;
              } else if (tariffCorridorFilter === "AIR_CUSTOM") {
                const isAir = t.shipping_mode_type === "AIR" || (t.shipping_mode_name || "").toLowerCase().includes("aérien") || (t.shipping_mode_name || "").toLowerCase().includes("vol");
                const isOther = !orig.includes("chine") && !orig.includes("émirat") && !orig.includes("duba") && !orig.includes("maroc");
                if (!isAir && !isOther) return false;
              }
            }
            if (tariffModeFilter !== "ALL") {
              const nameLower = (t.shipping_mode_name || "").toLowerCase();
              if (tariffModeFilter === "AIR" && t.shipping_mode_type !== "AIR" && !nameLower.includes("aérien") && !nameLower.includes("vol") && !nameLower.includes("express")) return false;
              if (tariffModeFilter === "SEA" && t.shipping_mode_type !== "SEA" && !nameLower.includes("maritime") && !nameLower.includes("bateau") && !nameLower.includes("cbm")) return false;
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
              {/* BANDEAU DES 4 CARTES KPI EXÉCUTIVES TARIFS */}
              <div className="kpi-grid-4">
                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <FileText size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Grille Active</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">Officielle</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{tariffsList.length} tarifs</div>
                    <div className="metric-card-sub">Forfaits & barèmes configurés</div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Globe size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Corridors Actifs</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">Réseau</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{uniqueCorridors} liaisons</div>
                    <div className="metric-card-sub">Chine, Dubaï, Maroc & Europe</div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Plane size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Fret Aérien</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">4 à 14 j</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{airCount} formules</div>
                    <div className="metric-card-sub">Express, Standard & Spécial</div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Ship size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Fret Maritime</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">CBM</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{seaCount} {seaCount > 1 ? "formules" : "formule"}</div>
                    <div className="metric-card-sub">Groupage conteneur au m³</div>
                  </div>
                </div>
              </div>

              {/* DISPOSITION EN 4 CARTES STRATÉGIQUES : CHINE, DUBAÏ, MAROC & LIAISONS AÉRIENNES (CONTRÔLE ABSOLU) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
                {/* 1. CHINE ➔ AFRIQUE */}
                <div
                  className="card-clean"
                  style={{
                    padding: "20px 22px",
                    borderRadius: "20px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                        <CircularFlag countryCode="CN" size={20} />
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            1. Chine ➔ Afrique
                          </h3>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Entrepôts Guangzhou & Yiwu · Aérien & Maritime
                          </span>
                        </div>
                      </div>
                      <span className="ios-trend-pill ios-trend-pill-gold">
                        Par défaut
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { key: "cn-normale", icon: Plane, name: "Voie normale (2 semaines)", delay: "12 à 14 j", price: "10 000 FCFA", unit: "/ kg", matchId: "tariff-cn-ci-normal", altId: "tariff-flyer-cn-normal", keyword: "normale", defaultVal: 10000 },
                        { key: "cn-express", icon: Zap, name: "Voie express (4 jours)", delay: "4 à 5 j", price: "12 000 FCFA", unit: "/ kg", matchId: "tariff-cn-ci-express", altId: "tariff-flyer-cn-express", keyword: "express", defaultVal: 12000 },
                        { key: "cn-batteries", icon: BatteryCharging, name: "Batteries & Compléments", delay: "7 à 10 j", price: "14 000 FCFA", unit: "/ kg", matchId: "tariff-cn-ci-special", altId: "tariff-flyer-cn-special", keyword: "batterie", defaultVal: 14000 },
                        { key: "cn-hightech", icon: Laptop, name: "Pièces d'ordinateur & High-Tech", delay: "Express", price: "50 000 FCFA", unit: "/ pièce", matchId: "tariff-cn-ci-tech", altId: "tariff-flyer-cn-tech", keyword: "ordinateur", defaultVal: 50000 },
                        { key: "cn-bateau", icon: Ship, name: "Par Bateau (Le CBM conteneur)", delay: "35 - 45 jours", price: "300 000 FCFA", unit: "/ m³", matchId: "tariff-cn-ci-sea", altId: "tariff-flyer-cn-sea", keyword: "bateau", defaultVal: 300000 },
                      ].map((item, idx, arr) => {
                        const matchedTariff = tariffsList.find(
                          (t) =>
                            (t.origin_country || "").toLowerCase().includes("chine") &&
                            (t.id === item.matchId ||
                              t.id === item.altId ||
                              (t.service_name || "").toLowerCase().includes(item.keyword) ||
                              (t.shipping_mode_name || "").toLowerCase().includes(item.keyword) ||
                              (t.category_tag || "").toLowerCase().includes(item.keyword) ||
                              (t.id || "").toLowerCase().includes(item.keyword))
                        );
                        const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : item.price;
                        const ItemIcon = item.icon;

                        return (
                          <div className="admin-tariff-row"
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              padding: "10px 4px",
                              borderBottom: idx < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0, flex: 1 }}>
                              <span style={{
                                width: "26px",
                                height: "26px",
                                minWidth: "26px",
                                minHeight: "26px",
                                borderRadius: "50%",
                                backgroundColor: "#FAF8F5",
                                border: "1px solid rgba(28, 25, 23, 0.09)",
                                color: "var(--brown-dark)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <ItemIcon size={13} strokeWidth={2} />
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  Délai : {matchedTariff?.estimated_days_min ? `${matchedTariff.estimated_days_min} à ${matchedTariff.estimated_days_max} j` : item.delay}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--brown-dark)" }} className="tabular-nums">
                                  {currentPrice}
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginLeft: "3px" }}>{item.unit}</span>
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
                                      id: item.matchId,
                                      service_name: item.name,
                                      shipping_mode_name: item.name,
                                      origin_country: "Chine",
                                      destination_country: "Côte d'Ivoire",
                                      price_per_unit: item.defaultVal,
                                      currency: "FCFA",
                                      estimated_days_min: 4,
                                      estimated_days_max: 14,
                                      note: "Tarif officiel Chine ➔ Afrique",
                                    });
                                  }
                                }}
                                className="btn-icon-clean"
                                style={{ width: "26px", height: "26px" }}
                                title="Modifier ce tarif"
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. DUBAÏ ➔ AFRIQUE */}
                <div
                  className="card-clean"
                  style={{
                    padding: "20px 22px",
                    borderRadius: "20px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                        <CircularFlag countryCode="AE" size={20} />
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            2. Dubaï ➔ Afrique
                          </h3>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Entrepôt Dubaï Cargo & Transit Émirats
                          </span>
                        </div>
                      </div>
                      <span className="ios-trend-pill ios-trend-pill-gold">
                        Par défaut
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { key: "ae-express", icon: Zap, name: "Voie express Dubaï (4 jours)", delay: "4 à 5 j", price: "12 000 FCFA", unit: "/ kg", matchId: "tariff-ae-ci-express", altId: "tariff-flyer-ae-express", keyword: "express", defaultVal: 12000 },
                        { key: "ae-normale", icon: Plane, name: "Voie normale Dubaï (2 semaines)", delay: "10 à 14 j", price: "10 000 FCFA", unit: "/ kg", matchId: "tariff-ae-ci-normal", altId: "tariff-flyer-ae-normal", keyword: "normale", defaultVal: 10000 },
                        { key: "ae-special", icon: ShoppingBag, name: "Marchandises Spéciales Dubaï", delay: "7 à 10 j", price: "14 000 FCFA", unit: "/ kg", matchId: "tariff-ae-ci-special", altId: "tariff-flyer-ae-special", keyword: "spécial", defaultVal: 14000 },
                        { key: "ae-bateau", icon: Ship, name: "Par Bateau Dubaï (Le CBM)", delay: "30 - 40 jours", price: "300 000 FCFA", unit: "/ m³", matchId: "tariff-ae-ci-sea", altId: "tariff-flyer-ae-sea", keyword: "bateau", defaultVal: 300000 },
                      ].map((item, idx, arr) => {
                        const matchedTariff = tariffsList.find(
                          (t) =>
                            ((t.origin_country || "").toLowerCase().includes("émirat") || (t.origin_country || "").toLowerCase().includes("duba")) &&
                            (t.id === item.matchId ||
                              t.id === item.altId ||
                              (t.service_name || "").toLowerCase().includes(item.keyword) ||
                              (t.shipping_mode_name || "").toLowerCase().includes(item.keyword) ||
                              (t.category_tag || "").toLowerCase().includes(item.keyword) ||
                              (t.id || "").toLowerCase().includes(item.keyword))
                        );
                        const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : item.price;
                        const ItemIcon = item.icon;

                        return (
                          <div className="admin-tariff-row"
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              padding: "10px 4px",
                              borderBottom: idx < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0, flex: 1 }}>
                              <span style={{
                                width: "26px",
                                height: "26px",
                                minWidth: "26px",
                                minHeight: "26px",
                                borderRadius: "50%",
                                backgroundColor: "#FAF8F5",
                                border: "1px solid rgba(28, 25, 23, 0.09)",
                                color: "var(--brown-dark)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <ItemIcon size={13} strokeWidth={2} />
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  Délai : {matchedTariff?.estimated_days_min ? `${matchedTariff.estimated_days_min} à ${matchedTariff.estimated_days_max} j` : item.delay}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--brown-dark)" }} className="tabular-nums">
                                  {currentPrice}
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginLeft: "3px" }}>{item.unit}</span>
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
                                      id: item.matchId,
                                      service_name: item.name,
                                      shipping_mode_name: item.name,
                                      origin_country: "Émirats Arabes Unis",
                                      origin_city: "Dubaï",
                                      destination_country: "Côte d'Ivoire",
                                      price_per_unit: item.defaultVal,
                                      currency: "FCFA",
                                      estimated_days_min: 4,
                                      estimated_days_max: 14,
                                      note: "Tarif officiel Dubaï ➔ Afrique",
                                    });
                                  }
                                }}
                                className="btn-icon-clean"
                                style={{ width: "26px", height: "26px" }}
                                title="Modifier ce tarif"
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. GROUPAGE SUBSAHARIEN MAROC */}
                {(() => {
                  const baseRoutes = [
                    { dest: "Côte d'Ivoire", flag: "CI", price: "6 500 FCFA", matchKeyword: "ivoire", defaultVal: 6500 },
                    { dest: "Sénégal, Mali, Burkina", flag: "SN", price: "7 000 FCFA", matchKeyword: "mali", defaultVal: 7000 },
                    { dest: "Gabon", flag: "GA", price: "7 500 FCFA", matchKeyword: "gabon", defaultVal: 7500 },
                  ];

                  const customMoroccoTariffs = tariffsList.filter((t) => {
                    const isMa = (t.origin_country || "").toLowerCase().includes("maroc") || (t.category_tag || "").toLowerCase().includes("maroc");
                    if (!isMa) return false;
                    const matchesBase = baseRoutes.some((b) =>
                      (t.destination_country || "").toLowerCase().includes(b.matchKeyword) ||
                      (t.service_name || "").toLowerCase().includes(b.matchKeyword)
                    );
                    return !matchesBase;
                  });

                  const totalDestCount = baseRoutes.length + customMoroccoTariffs.length;

                  return (
                    <div
                      className="card-clean"
                      style={{
                        padding: "20px 22px",
                        borderRadius: "20px",
                        background: "#FFFFFF",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                            <CircularFlag countryCode="MA" size={20} />
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                3. Groupage Subsaharien (Maroc)
                              </h4>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                Casablanca ➔ {totalDestCount} Destinations · 5 jours garantis
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <span className="ios-trend-pill ios-trend-pill-up">
                              5 jours
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddMoroccoCountryModal(true)}
                              className="btn btn-primary"
                              style={{
                                padding: "6px 14px",
                                fontSize: "0.76rem",
                                borderRadius: "9999px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                gap: "5px",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Plus size={13} />
                              <span>Ajouter un pays</span>
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {baseRoutes.map((route, idx) => {
                            const matchedTariff = tariffsList.find(
                              (t) =>
                                (t.origin_country || "").toLowerCase().includes("maroc") &&
                                ((t.destination_country || "").toLowerCase().includes(route.matchKeyword) ||
                                  (t.service_name || "").toLowerCase().includes(route.matchKeyword))
                            );
                            const currentPrice = matchedTariff ? formatCurrencyPrice(matchedTariff.price_per_unit_minor, matchedTariff.currency) : route.price;
                            const isLast = idx === baseRoutes.length - 1 && customMoroccoTariffs.length === 0;

                            return (
                              <div className="admin-tariff-row"
                                key={route.dest}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  padding: "10px 4px",
                                  borderBottom: isLast ? "none" : "1px solid var(--border-light)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                                  <CircularFlag countryCode={route.flag} size={16} />
                                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {route.dest}
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                  <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--brown-dark)" }} className="tabular-nums">
                                    {currentPrice} / kg
                                  </span>
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
                                    className="btn-icon-clean"
                                    style={{ width: "26px", height: "26px" }}
                                    title="Modifier ce tarif"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {customMoroccoTariffs.map((t, idx, arr) => {
                            const destName = t.destination_country || t.service_name || "Destination";
                            const flagCode = getCountryCodeFromName(destName) || "MA";
                            const currentPrice = formatCurrencyPrice(t.price_per_unit_minor, t.currency);

                            return (
                              <div className="admin-tariff-row"
                                key={t.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  padding: "10px 4px",
                                  borderBottom: idx < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                                  <CircularFlag countryCode={flagCode} size={16} />
                                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {destName}
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                  <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "var(--brown-dark)" }} className="tabular-nums">
                                    {currentPrice} / kg
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTariff({
                                        ...t,
                                        price_per_unit: t.price_per_unit || (t.price_per_unit_minor / 100),
                                      });
                                    }}
                                    className="btn-icon-clean"
                                    style={{ width: "26px", height: "26px" }}
                                    title="Modifier ce tarif"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. LIAISONS AÉRIENNES DYNAMIQUES (CONTRÔLE ABSOLU DIRECTION) */}
                <div
                  className="card-clean"
                  style={{
                    padding: "20px 22px",
                    borderRadius: "20px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(28, 25, 23, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Plane size={16} color="var(--brown-dark)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            4. Liaisons Aériennes Libres
                          </h4>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Création & liaison libre · Contrôle absolu Direction
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateAirRouteModal(true)}
                        className="btn btn-primary"
                        style={{
                          padding: "6px 14px",
                          fontSize: "0.76rem",
                          borderRadius: "9999px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          gap: "5px",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Plus size={13} />
                        <span>Relier une liaison</span>
                      </button>
                    </div>

                    {/* Listing dynamique des liaisons aériennes hors hubs par défaut */}
                    {(() => {
                      const customAirTariffs = tariffsList.filter((t) => {
                        const orig = (t.origin_country || "").toLowerCase();
                        const isCn = orig.includes("chine");
                        const isAe = orig.includes("émirat") || orig.includes("duba");
                        const isMa = orig.includes("maroc");
                        if (isCn || isAe || isMa) return false;
                        const isAir = t.shipping_mode_type === "AIR" || (t.shipping_mode_name || "").toLowerCase().includes("aérien") || (t.shipping_mode_name || "").toLowerCase().includes("vol") || (t.category_tag || "").toLowerCase().includes("paris") || (t.category_tag || "").toLowerCase().includes("pli");
                        return isAir || orig.includes("france");
                      });

                      if (customAirTariffs.length === 0) {
                        return (
                          <div style={{ textAlign: "center", padding: "20px 14px", background: "#FFFFFF", borderRadius: "12px", border: "1px dashed var(--border-light)" }}>
                            <Plane size={22} style={{ color: "var(--brown-light)", margin: "0 auto 6px auto", opacity: 0.8 }} />
                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--brown-dark)", marginBottom: "3px" }}>
                              Aucune liaison imposée
                            </div>
                            <p style={{ fontSize: "0.71rem", color: "var(--text-muted)", margin: "0 0 10px 0" }}>
                              Vous avez le contrôle total pour relier n&apos;importe quelle liaison aérienne (Paris, Istanbul, New York, Bruxelles...).
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowCreateAirRouteModal(true)}
                              className="btn btn-primary"
                              style={{ padding: "5px 14px", fontSize: "0.74rem", borderRadius: "9999px" }}
                            >
                              <Plus size={12} /> Créer & Relier une Liaison Aérienne
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", paddingRight: "2px" }}>
                          {customAirTariffs.slice(0, 5).map((t, idx, arr) => (
                            <div className="admin-tariff-row"
                              key={t.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                padding: "10px 4px",
                                borderBottom: idx < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                  <CircularFlag countryName={t.origin_country} size={15} />
                                  <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--brown-light)" }}>➔</span>
                                  <CircularFlag countryName={t.destination_country} size={15} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {t.service_name || `${t.origin_country} ➔ ${t.destination_country}`}
                                  </div>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                    {t.origin_city || t.origin_country} ➔ {t.destination_city || t.destination_country} · {t.estimated_days_min ? `${t.estimated_days_min} à ${t.estimated_days_max || t.estimated_days_min} j` : "Délai garanti"}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                <div style={{ textAlign: "right" }}>
                                  <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--brown-dark)" }} className="tabular-nums">
                                    {formatCurrencyPrice(t.price_per_unit_minor, t.currency)}
                                  </span>
                                  <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", marginLeft: "2px" }}>
                                    {t.pricing_basis === "PER_UNIT" ? "/ pli" : "/ kg"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingTariff({
                                      ...t,
                                      price_per_unit: t.price_per_unit || (t.price_per_unit_minor / 100),
                                    })
                                  }
                                  className="btn-icon-clean"
                                  style={{ width: "26px", height: "26px" }}
                                  title="Modifier cette liaison"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTariff(t.id)}
                                  className="btn-icon-clean"
                                  style={{ width: "26px", height: "26px", color: "#C53030", borderColor: "rgba(197, 48, 48, 0.2)" }}
                                  title="Retirer cette liaison"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
                        id: "CN",
                        label: "Chine",
                        icon: <CircularFlag countryCode="CN" size={14} />,
                      },
                      {
                        id: "AE",
                        label: "Dubaï",
                        icon: <CircularFlag countryCode="AE" size={14} />,
                      },
                      {
                        id: "MA",
                        label: "Maroc",
                        icon: <CircularFlag countryCode="MA" size={14} />,
                      },
                      {
                        id: "AIR_CUSTOM",
                        label: "Liaisons Aériennes",
                        icon: <Plane size={14} />,
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
              <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "22px", border: "1px solid var(--border-light)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Trajet d&apos;Acheminement</th>
                        <th>Service & Mode</th>
                        <th>Prix Unitaire</th>
                        <th>Facturation</th>
                        <th>Délai Garanti</th>
                        <th>Spécificité / Note</th>
                        <th className="col-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTariffs.length > 0 ? (
                        filteredTariffs.map((t) => {
                          const isSea = t.shipping_mode_type === "SEA" || (t.shipping_mode_name || "").toLowerCase().includes("maritime") || (t.shipping_mode_name || "").toLowerCase().includes("bateau") || (t.pricing_basis === "PER_CBM");
                          const isUnit = t.pricing_basis === "PER_UNIT";
                          const unitLabel = isSea ? "Par m³ (CBM)" : isUnit ? "Par pièce / pli" : "Par kg";
                          const cleanTag = (t.category_tag || t.shipping_mode_name || "").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                          const noteText = t.note || (t.flyer_source ? `Offre : ${t.flyer_source}` : "Tarif standard");
                          const isPending = Boolean(t._isPendingEdit || pendingTariffEdits[t.id]);

                          return (
                            <tr key={t.id} className="table-row-clean" style={isPending ? { background: "rgba(107, 88, 68, 0.04)" } : undefined}>
                              <td>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <CircularFlag countryName={t.origin_country} size={18} />
                                  <span style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.82rem" }}>
                                    {t.origin_country}
                                  </span>
                                  <span style={{ color: "var(--brown-light)", fontWeight: "800", fontSize: "0.78rem" }}>➔</span>
                                  <CircularFlag countryName={t.destination_country} size={18} />
                                  <span style={{ fontWeight: "800", color: "var(--brown-dark)", fontSize: "0.82rem" }}>
                                    {t.destination_country}
                                  </span>
                                </div>
                                {(t.origin_city || t.destination_city) && (
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", paddingLeft: "24px" }}>
                                    {t.origin_city || t.origin_country} → {t.destination_city || t.destination_country}
                                  </div>
                                )}
                              </td>

                              <td>
                                <span
                                  className="badge-clean"
                                  style={{
                                    background: "#FFFFFF",
                                    color: "var(--brown-dark)",
                                    border: "1px solid var(--border-light)",
                                    fontWeight: "700",
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  {isSea ? (
                                    <Ship size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("Express") ? (
                                    <Zap size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("Batterie") || cleanTag.includes("Complément") ? (
                                    <BatteryCharging size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("High-Tech") || cleanTag.includes("PC") || cleanTag.includes("ordinateur") ? (
                                    <Laptop size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("Cosmétique") ? (
                                    <Package size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("Document") || cleanTag.includes("Pli") ? (
                                    <FileText size={13} strokeWidth={1.8} />
                                  ) : cleanTag.includes("Divers") ? (
                                    <ShoppingBag size={13} strokeWidth={1.8} />
                                  ) : (
                                    <Plane size={13} strokeWidth={1.8} />
                                  )}
                                  <span>{cleanTag}</span>
                                </span>
                              </td>

                              <td>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "var(--brown-dark)", fontVariantNumeric: "tabular-nums" }}>
                                    {formatCurrencyPrice(t.price_per_unit_minor, t.currency)} {isSea ? "/ m³" : isUnit ? "" : "/ kg"}
                                  </div>
                                  {isPending && (
                                    <span style={{ fontSize: "0.62rem", background: "#F1E7D9", color: "#6B5844", padding: "1px 6px", borderRadius: "9999px", fontWeight: "700" }}>
                                      En attente
                                    </span>
                                  )}
                                </div>
                                {t.secondary_display && (
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "600", marginTop: "1px" }}>
                                    {t.secondary_display}
                                  </div>
                                )}
                              </td>

                              <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: "500" }}>
                                {unitLabel}
                              </td>

                              <td>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.74rem", color: "var(--text-main)", fontWeight: "600", background: "var(--bg-app)", padding: "3px 9px", borderRadius: "9999px", border: "1px solid var(--border-light)", whiteSpace: "nowrap" }}>
                                  <Clock size={12} style={{ color: "var(--brown-light)" }} />
                                  {t.estimated_days_min && t.estimated_days_max
                                    ? t.estimated_days_min === t.estimated_days_max
                                      ? `${t.estimated_days_min} jours`
                                      : `${t.estimated_days_min} à ${t.estimated_days_max} j`
                                    : "3 à 7 j"}
                                </span>
                              </td>

                              <td style={{ color: "var(--text-muted)", fontSize: "0.75rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }} title={noteText}>
                                {noteText}
                              </td>

                              <td className="col-right">
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTariff({
                                      ...t,
                                      price_per_unit: t.price_per_unit || (t.price_per_unit_minor / 100),
                                      minimum_charge: t.minimum_charge || (t.minimum_charge_minor / 100),
                                    })}
                                    className="btn-icon-clean"
                                    title="Modifier ce tarif"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTariff(t.id)}
                                    className="btn-icon-clean"
                                    style={{ color: "#C53030", borderColor: "rgba(197, 48, 48, 0.2)" }}
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
            <div key="finances" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* BANDEAU DES 4 CARTES KPI EXÉCUTIVES */}
              <div className="kpi-grid-4">
                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <HandCoins size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Total Encaissé</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">{confirmedPayments.length} reçus</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {formatCurrencyPrice(stats?.total_payments_minor || confirmedTotalMinor, "FCFA")}
                    </div>
                    <div className="metric-card-sub">
                      Recettes confirmées en caisse
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <ClipboardCheck size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Contrôle Caisse</span>
                    </div>
                    <span className={`ios-trend-pill ${pendingPayments.length > 0 ? "ios-trend-pill-gold" : "ios-trend-pill-up"}`}>
                      {pendingPayments.length > 0 ? `${pendingPayments.length} à valider` : "À jour"}
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {formatCurrencyPrice(pendingTotalMinor, "FCFA")}
                    </div>
                    <div className="metric-card-sub">
                      {pendingPayments.length > 0 ? `${pendingPayments.length} transaction(s) en attente` : "Aucun règlement en attente"}
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Smartphone size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Mobile Money</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">Instantané</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {formatCurrencyPrice(waveTotalMinor, "FCFA")}
                    </div>
                    <div className="metric-card-sub">
                      Wave & Orange Money validés
                    </div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <BillsIcon size={19} />
                      </span>
                      <span className="metric-card-title">Espèces Guichet</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">Comptoirs</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">
                      {formatCurrencyPrice(cashTotalMinor, "FCFA")}
                    </div>
                    <div className="metric-card-sub">
                      Versements physiques en agence
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLEAU 1 : EN ATTENTE DE CONTRÔLE CAISSE (Compact si 0, Tableau complet si > 0) */}
              {pendingPayments.length === 0 ? (
                <div
                  className="card-clean"
                  style={{
                    padding: "16px 22px",
                    borderRadius: "18px",
                    background: "#FFFFFF",
                    border: "1px solid rgba(28, 25, 23, 0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="metric-icon-box" style={{ background: "rgba(5, 150, 105, 0.09)", color: "#059669", borderColor: "rgba(5, 150, 105, 0.22)" }}>
                      <CheckCircle2 size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "0.94rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                          Contrôle Caisse à jour
                        </h3>
                        <span className="ios-trend-pill ios-trend-pill-up">0 en attente</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        Toutes les transactions signalées par les clients ou agences ont été vérifiées par la Direction.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRecordPaymentModal({})}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontSize: "0.8rem", gap: "6px" }}
                  >
                    <Plus size={15} strokeWidth={2.2} /> Consigner un Paiement
                  </button>
                </div>
              ) : (
                <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "22px", border: "1px solid var(--border-light)", background: "#FFFFFF" }}>
                  <div style={{ padding: "18px 24px", background: "#FFFFFF", borderBottom: "1px solid rgba(28, 25, 23, 0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className="metric-icon-box">
                        <ClipboardCheck size={18} strokeWidth={2} />
                      </span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                            Paiements en Attente de Contrôle Caisse
                          </h3>
                          <span className="ios-trend-pill ios-trend-pill-gold">{pendingPayments.length} à valider</span>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                          Transactions signalées par les clients ou agences nécessitant la validation de la Direction
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRecordPaymentModal({})}
                      className="btn btn-primary"
                      style={{ padding: "8px 16px", fontSize: "0.8rem", gap: "6px" }}
                    >
                      <Plus size={14} /> Consigner un Paiement
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="table-clean">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Client</th>
                          <th>N° Dossier</th>
                          <th>Montant Déclaré</th>
                          <th>Méthode</th>
                          <th>Réf. Transaction</th>
                          <th className="col-right">Actions de Contrôle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPayments.map((p: any) => (
                          <tr key={p.id} className="table-row-clean">
                            <td style={{ color: "var(--text-muted)" }} className="tabular-nums">
                              {new Date(p.recorded_at || p.created_at || Date.now()).toLocaleDateString("fr-FR")}
                            </td>
                            <td style={{ fontWeight: "700", color: "var(--text-main)" }}>
                              <div>{p.client_name}</div>
                              {p.client_phone && <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }} className="tabular-nums">{p.client_phone}</div>}
                            </td>
                            <td style={{ color: "var(--brown-dark)", fontWeight: "800", fontSize: "0.79rem" }} className="tabular-nums">
                              {p.tracking_number || "—"}
                            </td>
                            <td style={{ fontWeight: "800", color: "#6B5844" }} className="tabular-nums">
                              {formatCurrencyPrice(p.amount_minor, p.currency || "FCFA")}
                            </td>
                            <td>
                              {renderPaymentMethodBadge(p.payment_method)}
                            </td>
                            <td style={{ fontSize: "0.77rem", color: "var(--text-secondary)" }}>
                              {p.reference_code || "Manuel"}
                            </td>
                            <td className="col-right">
                              <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(p.id)}
                                  className="btn btn-primary"
                                  style={{ padding: "4px 10px", fontSize: "0.73rem", height: "28px", background: "var(--state-success-text)", borderColor: "var(--state-success-text)" }}
                                  title="Valider la réception"
                                >
                                  Valider
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPayment({
                                    ...p,
                                    amount: p.amount || (p.amount_minor / 100),
                                    payment_reference: p.reference_code,
                                    shipment_tracking: p.tracking_number,
                                  })}
                                  className="btn-icon-clean"
                                  title="Modifier ce paiement"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelPayment(p.id)}
                                  className="btn btn-secondary"
                                  style={{ padding: "4px 10px", fontSize: "0.73rem", height: "28px", color: "#C53030", borderColor: "rgba(197, 48, 48, 0.2)" }}
                                  title="Rejeter"
                                >
                                  Rejeter
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TABLEAU 2 SÉPARÉ : HISTORIQUE DES ENCAISSEMENTS CONFIRMÉS */}
              <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "22px", border: "1px solid var(--border-light)", background: "#FFFFFF" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(28, 25, 23, 0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "1.02rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                          Historique des Encaissements Confirmés & Validés
                        </h3>
                        <span className="ios-trend-pill ios-trend-pill-neutral">{confirmedPayments.length} règlements</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        Fonds réceptionnés et comptabilisés dans le livre de caisse ROUM TRANSIT
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client Payeur</th>
                        <th>Dossier Associé</th>
                        <th>Montant Encaissé</th>
                        <th>Canal / Méthode</th>
                        <th>Réf. Caisse</th>
                        <th>Statut</th>
                        <th className="col-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedPayments.length > 0 ? (
                        confirmedPayments.map((p: any) => (
                          <tr key={p.id} className="table-row-clean">
                            <td style={{ color: "var(--text-muted)" }} className="tabular-nums">
                              {new Date(p.recorded_at || p.created_at || Date.now()).toLocaleDateString("fr-FR")}
                            </td>
                            <td style={{ fontWeight: "700", color: "var(--text-main)" }}>
                              <div>{p.client_name}</div>
                              {p.client_phone && <div style={{ fontSize: "0.71rem", color: "var(--text-muted)" }} className="tabular-nums">{p.client_phone}</div>}
                            </td>
                            <td style={{ color: "var(--brown-dark)", fontWeight: "800", fontSize: "0.79rem" }} className="tabular-nums">
                              {p.tracking_number || "—"}
                            </td>
                            <td style={{ fontWeight: "800", color: "var(--state-success-text)" }} className="tabular-nums">
                              {formatCurrencyPrice(p.amount_minor, p.currency || "FCFA")}
                            </td>
                            <td>
                              <span className="badge-clean badge-delivered">
                                {p.payment_method === "ORANGE_MONEY" ? "Orange Money" : p.payment_method === "WAVE" ? "Wave" : p.payment_method === "CASH" ? "Espèces" : p.payment_method === "BANK_TRANSFER" ? "Virement" : p.payment_method || "Validé"}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.77rem", color: "var(--text-secondary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>
                              <div>{p.reference_code || "Certifié"}</div>
                              {p.receipt_notes && (
                                <div style={{ fontSize: "0.69rem", color: "var(--text-muted)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis" }} title={p.receipt_notes}>
                                  {p.receipt_notes}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="badge-clean badge-delivered" style={{ fontSize: "0.72rem" }}>
                                ✓ Encaissé
                              </span>
                            </td>
                            <td className="col-right">
                              <button
                                type="button"
                                onClick={() => setEditingPayment({
                                  ...p,
                                  amount: p.amount || (p.amount_minor / 100),
                                  payment_reference: p.reference_code,
                                  shipment_tracking: p.tracking_number,
                                })}
                                className="btn-icon-clean"
                                title="Modifier ce paiement"
                              >
                                <Edit3 size={13} />
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

        {/* 7. TÂCHES */}
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
              <div className="kpi-grid-3">
                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <CheckSquare size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Tâches Actives</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-neutral">En cours</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{pendingCount} {pendingCount > 1 ? "tâches" : "tâche"}</div>
                    <div className="metric-card-sub">Opérations à suivre</div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <Flame size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Urgences</span>
                    </div>
                    <span className={`ios-trend-pill ${urgentCount > 0 ? "ios-trend-pill-gold" : "ios-trend-pill-up"}`}>
                      {urgentCount > 0 ? "Prioritaire" : "RAS"}
                    </span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{urgentCount} {urgentCount > 1 ? "urgences" : "urgence"}</div>
                    <div className="metric-card-sub">Traitement immédiat requis</div>
                  </div>
                </div>

                <div className="ios-metric-card">
                  <div className="metric-card-header">
                    <div className="metric-card-label">
                      <span className="metric-icon-box">
                        <CheckCircle2 size={17} strokeWidth={2} />
                      </span>
                      <span className="metric-card-title">Terminées</span>
                    </div>
                    <span className="ios-trend-pill ios-trend-pill-up">Clôturées</span>
                  </div>
                  <div className="metric-card-body">
                    <div className="metric-card-value">{doneCount} {doneCount > 1 ? "accomplies" : "accomplie"}</div>
                    <div className="metric-card-sub">Missions validées et archivées</div>
                  </div>
                </div>
              </div>

              {/* Barre de filtres & Action d'ajout */}
              <div className="card-clean" style={{ padding: "14px 20px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div className="pill-selector">
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
                      className={`pill-option ${taskFilter === filterItem.id ? "pill-option-active" : ""}`}
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
                          {t.category === "WEIGHING" ? <Scale size={12} /> : t.category === "CUSTOMS" ? <ShieldCheck size={12} /> : <FileText size={12} />}
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
                            className="btn-icon-clean"
                            style={{ width: "26px", height: "26px" }}
                            title="Modifier la tâche"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: isDone ? "var(--text-muted)" : "var(--brown-dark)",
                              fontSize: "0.74rem",
                              fontWeight: "700",
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
        {activeTab === "content" && (
          <SiteContentEditor
            settings={companySettings}
            token={token}
            notify={triggerToast}
            onSave={async (changes) => {
              const saved = await adminCall(
                "/settings",
                { method: "PUT", body: changes },
                {
                  scopes: [],
                  success: "Textes enregistrés : vos clients les voient déjà.",
                  successTitle: "Contenu du site",
                }
              );
              if (saved) setCompanySettings((prev) => ({ ...prev, ...changes }));
              return Boolean(saved);
            }}
            onImageSaved={(settingKey, version) =>
              setCompanySettings((prev) => {
                const next = { ...prev };
                if (version) next[settingKey] = version;
                else delete next[settingKey];
                return next;
              })
            }
          />
        )}

        {activeTab === "settings" && (
          <div key="settings" className="animate-fade-in" style={{ display: "grid", gap: "24px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
            {/* TAUX DE CHANGE : ILS S'APPLIQUENT AUSSITÔT AUX PRIX AFFICHÉS AUX CLIENTS */}
            <ExchangeRatesCard
              settings={companySettings}
              onChange={(key, value) => setCompanySettings({ ...companySettings, [key]: value })}
              onSave={() =>
                adminCall(
                  "/settings",
                  {
                    method: "PUT",
                    body: {
                      exchange_rate_rmb: String(companySettings.exchange_rate_rmb ?? ""),
                      exchange_rate_usd: String(companySettings.exchange_rate_usd ?? ""),
                      exchange_rate_eur: String(companySettings.exchange_rate_eur ?? ""),
                    },
                  },
                  { scopes: [], success: "Les nouveaux taux sont appliqués sur le site.", successTitle: "Taux enregistrés" },
                )
              }
            />

            {/* CARTE 1 : IDENTITÉ LÉGALE & SIÈGE SOCIAL DE L'ENTREPRISE */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                    Identité & Coordonnées Officielles de l&apos;Entreprise
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Coordonnées officielles, siège social et contacts de direction affichés sur les devis et factures.
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
                    Adresse du Siège Social & Agence Principale
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_headquarters || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_headquarters: e.target.value })}
                    className="input-clean"
                    placeholder="Quartier, ville, pays"
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
                    placeholder="+225 XX XX XX XX XX"
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
                    placeholder="contact@exemple.com"
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
                    placeholder="facturation@exemple.com"
                  />
                </div>
              </div>
            </div>

            {/* CARTE 2 : RÉSEAU DES ENTREPÔTS INTERNATIONAUX (CHINE, DUBAÏ, FRANCE & ENTREPÔTS PERSONNALISÉS) */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                    Entrepôts & Magasins Internationaux de Réception
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Adresses exactes de réception des colis (Chine, Dubaï, France...) avec code client.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className="badge-clean badge-transit" style={{ padding: "4px 12px", fontSize: "0.74rem" }}>
                    {3 + customHubs.length} Plateformes Actives
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddHubModal(true)}
                    className="btn btn-primary"
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.76rem",
                      borderRadius: "9999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      gap: "5px",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={13} />
                    <span>Ajouter un entrepôt</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
                {/* Entrepôt Chine */}
                <div style={{ padding: "12px 6px 20px 6px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="CN" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Entrepôt Guangzhou (Chine)</strong>
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
                        Code client sur colis (Shipping Mark)
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
                        Contact Réception Chine
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

                {/* Entrepôt Dubaï */}
                <div style={{ padding: "12px 6px 20px 6px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="AE" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Entrepôt Dubaï (Émirats Arabes Unis)</strong>
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
                        Contact WhatsApp Entrepôt Dubaï
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

                {/* Magasin & Dépôt France */}
                <div style={{ padding: "12px 6px 20px 6px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="FR" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Magasin & Dépôt Paris (France & Europe)</strong>
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
                        Contact Magasin Paris
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

                {/* Dépôt Casablanca */}
                <div style={{ padding: "12px 6px 20px 6px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CircularFlag countryCode="MA" size={16} />
                    <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)" }}>Dépôt Casablanca (Maroc)</strong>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: 600 }}>
                        Adresse Dépôt Casablanca
                      </label>
                      <textarea
                        rows={2}
                        value={companySettings.hub_casablanca_address || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, hub_casablanca_address: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: 600 }}>
                        Contact Dépôt Casablanca
                      </label>
                      <input
                        type="text"
                        value={companySettings.hub_casablanca_contact || ""}
                        onChange={(e) => setCompanySettings({ ...companySettings, hub_casablanca_contact: e.target.value })}
                        className="input-clean"
                        style={{ fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ENTREPÔTS INTERNATIONAUX AJOUTÉS DYNAMIQUEMENT */}
                {customHubs.map((hub) => (
                  <div
                    key={hub.id}
                    style={{
                      padding: "12px 6px 20px 6px",
                      borderBottom: "1px solid var(--border-light)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <CircularFlag countryCode={hub.countryCode} size={16} />
                          <strong style={{ fontSize: "0.88rem", color: "var(--brown-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {hub.name}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteHub(hub.id)}
                          className="btn-icon-clean"
                          style={{ width: "24px", height: "24px", color: "var(--text-muted)" }}
                          title="Supprimer cet entrepôt"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                            Adresse Réception Colis
                          </label>
                          <textarea
                            rows={2}
                            value={hub.address}
                            onChange={(e) => {
                              const updated = customHubs.map((h) => h.id === hub.id ? { ...h, address: e.target.value } : h);
                              setCustomHubs(updated);
                              queueHubsSave(updated);
                            }}
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
                            value={hub.shipping_mark}
                            onChange={(e) => {
                              const updated = customHubs.map((h) => h.id === hub.id ? { ...h, shipping_mark: e.target.value } : h);
                              setCustomHubs(updated);
                              queueHubsSave(updated);
                            }}
                            className="input-clean"
                            style={{ fontSize: "0.82rem" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>
                            Contact Réception Magasin
                          </label>
                          <input
                            type="text"
                            value={hub.contact}
                            onChange={(e) => {
                              const updated = customHubs.map((h) => h.id === hub.id ? { ...h, contact: e.target.value } : h);
                              setCustomHubs(updated);
                              queueHubsSave(updated);
                            }}
                            className="input-clean"
                            style={{ fontSize: "0.82rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                {(() => {
                  const isEditing = editingPaymentCard === "wave";
                  return (
                    <div
                      style={{
                        padding: isEditing ? "18px" : "12px 6px 20px 6px",
                        background: isEditing ? "#FFFFFF" : "transparent",
                        borderRadius: isEditing ? "16px" : "0",
                        border: isEditing ? "1.5px solid var(--brown-dark)" : "none",
                        borderBottom: isEditing ? "1.5px solid var(--brown-dark)" : "1px solid var(--border-light)",
                        boxShadow: isEditing ? "0 8px 24px rgba(28, 25, 23, 0.08)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <WaveLogo size={34} />
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                              Wave Côte d&apos;Ivoire & Sénégal
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                              Sans Frais Client
                            </span>
                          </div>
                        </div>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={handleCancelEditPaymentCard}
                              className="btn btn-secondary"
                              style={{
                                padding: "5px 10px",
                                fontSize: "0.74rem",
                                fontWeight: "600",
                                borderRadius: "8px",
                                border: "1px solid var(--border-light)",
                                cursor: "pointer",
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPaymentCard("wave", "Wave")}
                              className="btn btn-primary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                fontSize: "0.74rem",
                                fontWeight: "700",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={13} />
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditPaymentCard("wave")}
                            className="btn btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "8px",
                              border: "1px solid var(--border-light)",
                              background: "var(--bg-subtle)",
                              cursor: "pointer",
                              color: "var(--brown-dark)",
                            }}
                            title="Modifier ce compte Wave"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Numéro Compte Wave</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_wave_ci || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_ci: e.target.value })}
                            className="input-clean"
                            placeholder="+225 XX XX XX XX XX"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Nom du Compte Wave</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_wave_name || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_name: e.target.value })}
                            className="input-clean"
                            placeholder="Nom du titulaire"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Lien / QR Code Marchand</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_wave_merchant || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_wave_merchant: e.target.value })}
                            className="input-clean"
                            placeholder="Lien marchand Wave (facultatif)"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Orange Money */}
                {(() => {
                  const isEditing = editingPaymentCard === "orange";
                  return (
                    <div
                      style={{
                        padding: isEditing ? "18px" : "12px 6px 20px 6px",
                        background: isEditing ? "#FFFFFF" : "transparent",
                        borderRadius: isEditing ? "16px" : "0",
                        border: isEditing ? "1.5px solid var(--brown-dark)" : "none",
                        borderBottom: isEditing ? "1.5px solid var(--brown-dark)" : "1px solid var(--border-light)",
                        boxShadow: isEditing ? "0 8px 24px rgba(28, 25, 23, 0.08)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <OrangeMoneyLogo size={34} />
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                              Orange Money (OM CI / UEMOA)
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                              Code Marchand & Transfert
                            </span>
                          </div>
                        </div>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={handleCancelEditPaymentCard}
                              className="btn btn-secondary"
                              style={{
                                padding: "5px 10px",
                                fontSize: "0.74rem",
                                fontWeight: "600",
                                borderRadius: "8px",
                                border: "1px solid var(--border-light)",
                                cursor: "pointer",
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPaymentCard("orange", "Orange Money")}
                              className="btn btn-primary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                fontSize: "0.74rem",
                                fontWeight: "700",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={13} />
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditPaymentCard("orange")}
                            className="btn btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "8px",
                              border: "1px solid var(--border-light)",
                              background: "var(--bg-subtle)",
                              cursor: "pointer",
                              color: "var(--brown-dark)",
                            }}
                            title="Modifier ce compte Orange Money"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Code Marchand OM / Numéro</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_orange_money_ci || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_orange_money_ci: e.target.value })}
                            className="input-clean"
                            placeholder="+225 XX XX XX XX XX"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Nom Enregistré Orange Money</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_orange_name || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_orange_name: e.target.value })}
                            className="input-clean"
                            placeholder="Nom du titulaire"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Compte & Coordonnées Bancaires Maroc (Casablanca) */}
                {(() => {
                  const isEditing = editingPaymentCard === "morocco";
                  return (
                    <div
                      style={{
                        padding: isEditing ? "18px" : "12px 6px 20px 6px",
                        background: isEditing ? "#FFFFFF" : "transparent",
                        borderRadius: isEditing ? "16px" : "0",
                        border: isEditing ? "1.5px solid var(--brown-dark)" : "none",
                        borderBottom: isEditing ? "1.5px solid var(--brown-dark)" : "1px solid var(--border-light)",
                        boxShadow: isEditing ? "0 8px 24px rgba(28, 25, 23, 0.08)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CircularFlag countryCode="MA" size={34} />
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                              Compte & Virement Maroc
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                              Agence Casablanca · CIH / Attijariwafa
                            </span>
                          </div>
                        </div>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={handleCancelEditPaymentCard}
                              className="btn btn-secondary"
                              style={{
                                padding: "5px 10px",
                                fontSize: "0.74rem",
                                fontWeight: "600",
                                borderRadius: "8px",
                                border: "1px solid var(--border-light)",
                                cursor: "pointer",
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPaymentCard("morocco", "Compte Maroc")}
                              className="btn btn-primary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                fontSize: "0.74rem",
                                fontWeight: "700",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={13} />
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditPaymentCard("morocco")}
                            className="btn btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "8px",
                              border: "1px solid var(--border-light)",
                              background: "var(--bg-subtle)",
                              cursor: "pointer",
                              color: "var(--brown-dark)",
                            }}
                            title="Modifier ce compte Maroc"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Établissement Bancaire au Maroc</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_morocco_bank || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_morocco_bank: e.target.value })}
                            className="input-clean"
                            placeholder="Nom de la banque"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Titulaire du Compte</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_morocco_holder || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_morocco_holder: e.target.value })}
                            className="input-clean"
                            placeholder="Nom du titulaire"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>RIB Bancaire Marocain (24 chiffres)</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_morocco_rib || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_morocco_rib: e.target.value })}
                            className="input-clean"
                            placeholder="RIB à 24 chiffres"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "600" }}>Ville / Agence & Contact WhatsApp Maroc</label>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            value={companySettings.payment_morocco_whatsapp || ""}
                            onChange={(e) => setCompanySettings({ ...companySettings, payment_morocco_whatsapp: e.target.value })}
                            className="input-clean"
                            placeholder="Ville, agence et WhatsApp"
                            style={{
                              background: "#FFFFFF",
                              cursor: isEditing ? "text" : "default",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                    const saved = await adminCall(
                      "/settings",
                      { method: "PUT", body: companySettings },
                      {
                        scopes: [],
                        success: "Paramètres enregistrés : les clients voient déjà ces coordonnées.",
                        successTitle: "Configuration",
                      }
                    );
                    if (saved) {
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 3500);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: "11px 28px", fontSize: "0.92rem", borderRadius: "9999px", boxShadow: "0 4px 14px rgba(28, 25, 23, 0.25)" }}
                >
                  Enregistrer l&apos;ensemble des Paramètres
                </button>
              </div>
            </div>

            {/* CARTE : E-MAIL DE CONNEXION DE LA DIRECTION */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(28, 25, 23, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--brown-dark)",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                      E-mail de connexion
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                      Adresse actuelle : <strong>{user?.email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleChangeEmail} style={{ maxWidth: "720px", display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Nouvelle adresse e-mail
                    </label>
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      className="input-clean"
                      placeholder="nouvelle@adresse.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Confirmer la nouvelle adresse
                    </label>
                    <input
                      type="email"
                      value={emailForm.confirmEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                      className="input-clean"
                      placeholder="nouvelle@adresse.com"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={emailForm.currentPassword}
                      onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                      className="input-clean"
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    Vérifiez bien l&apos;adresse : c&apos;est elle qui servira à vous connecter.
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingEmail}
                    className="btn btn-primary"
                    style={{
                      borderRadius: "9999px",
                      padding: "8px 20px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      cursor: isChangingEmail ? "not-allowed" : "pointer",
                      opacity: isChangingEmail ? 0.7 : 1,
                    }}
                  >
                    {isChangingEmail ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Modification en cours...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>Changer l&apos;e-mail</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* CARTE 4 : SÉCURITÉ & MODIFICATION DU MOT DE PASSE DE DIRECTION */}
            <div className="card-clean" style={{ padding: "26px", borderRadius: "20px", background: "#FFFFFF", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(28, 25, 23, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--brown-dark)",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 3px 0" }}>
                      Sécurité & Mot de Passe de Direction
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                      Modifiez votre mot de passe d&apos;accès administrateur en toute sécurité.
                    </p>
                  </div>
                </div>
                <span className="badge-clean badge-delivered" style={{ padding: "4px 12px", fontSize: "0.72rem", borderRadius: "9999px" }}>
                  Session Protégée
                </span>
              </div>

              <form onSubmit={handleChangePassword} style={{ maxWidth: "720px", display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="input-clean"
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input-clean"
                      placeholder="Min. 6 caractères"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input-clean"
                      placeholder="Retapez à l'identique"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {showPasswordSuccess ? (
                      <span style={{ color: "#16A34A", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <CheckCircle2 size={15} /> Mot de passe mis à jour avec succès !
                      </span>
                    ) : (
                      "Utilisez au moins 6 caractères pour garantir la sécurité de votre accès."
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn btn-primary"
                    style={{
                      borderRadius: "9999px",
                      padding: "8px 20px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      cursor: isChangingPassword ? "not-allowed" : "pointer",
                      opacity: isChangingPassword ? 0.7 : 1,
                    }}
                  >
                    {isChangingPassword ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Mise à jour en cours...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        <span>Mettre à jour le mot de passe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="card-clean" style={{ padding: "0", overflow: "hidden", borderRadius: "22px", border: "1px solid var(--border-light)" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF" }}>
                <div>
                  <h3 style={{ fontSize: "1.02rem", fontWeight: "700", margin: "0 0 2px 0", color: "var(--text-main)" }}>Journal d&apos;Audit</h3>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>Historique des opérations et modifications sur la plateforme</p>
                </div>
                <span className="badge-clean" style={{ background: "#FFFFFF", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
                  {auditLogs.length} entrées
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Auteur</th>
                      <th>Action</th>
                      <th>Entité</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l) => {
                      let cleanDetails = l.details_json || "—";
                      if (typeof cleanDetails === "string" && cleanDetails.startsWith("{")) {
                        try {
                          const parsed = JSON.parse(cleanDetails);
                          cleanDetails = Object.entries(parsed)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ");
                        } catch {}
                      }
                      return (
                        <tr key={l.id} className="table-row-clean">
                          <td style={{ color: "var(--text-muted)" }} className="tabular-nums">
                            {new Date(l.created_at).toLocaleString("fr-FR")}
                          </td>
                          <td style={{ fontWeight: "600", color: "var(--text-main)" }}>{l.user_name || "Système"}</td>
                          <td>
                            <span className="badge-clean badge-draft" style={{ color: "var(--brown-dark)", fontWeight: "700" }}>
                              {formatAuditAction(l.action)}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontWeight: "500" }}>{formatAuditEntity(l.entity_type)}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.76rem", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis" }} title={cleanDetails}>
                            {cleanDetails}
                          </td>
                        </tr>
                      );
                    })}
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
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(28, 25, 23, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brown-dark)" }}>
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
                    <select value={availableRoutes.some((r) => r.id === newShipment.route_id) ? newShipment.route_id : availableRoutes[0]?.id || ""} onChange={(e) => setNewShipment({ ...newShipment, route_id: e.target.value })} className="input-clean" style={{ height: "40px" }}>
                      {availableRoutes.map((r) => (
                        <option key={r.id} value={r.id}>{r.origin_country} → {r.destination_country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mode</label>
                    <select value={availableModes.some((m) => m.id === newShipment.shipping_mode_id) ? newShipment.shipping_mode_id : availableModes[0]?.id || ""} onChange={(e) => setNewShipment({ ...newShipment, shipping_mode_id: e.target.value })} className="input-clean" style={{ height: "40px" }}>
                      {availableModes.map((m) => (
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
                <button type="button" onClick={() => setShowCreateShipmentModal(false)} className="btn btn-secondary" style={{ padding: "9px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={14} /> Créer Expédition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CHANGEMENT STATUT (AMÉLIORÉE & SIMPLE) */}
      {showPhotosModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}
          onClick={() => setShowPhotosModal(null)}
        >
          <div
            className="card-clean"
            style={{ maxWidth: "520px", width: "100%", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: "1.15rem", margin: 0, overflowWrap: "anywhere" }}>{showPhotosModal.tracking_number}</h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "3px" }}>
                  {showPhotosModal.client_name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotosModal(null)}
                className="btn-icon-clean"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <ShipmentPhotosManager shipmentId={showPhotosModal.id} token={token} />
          </div>
        </div>
      )}

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
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block", marginBottom: "3px" }}>Trajet</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CircularFlag countryName={showStatusModal.origin_country || "Chine"} size={14} />
                  <strong>{showStatusModal.origin_country || "Départ"}</strong>
                  <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>➔</span>
                  <CircularFlag countryName={showStatusModal.destination_country || "Côte d'Ivoire"} size={14} />
                  <strong>{showStatusModal.destination_country || "Arrivée"}</strong>
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>Statut actuel</span>
                <span style={{ color: "#8A7660", fontWeight: "700" }}>
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
                <button type="button" onClick={() => setShowStatusModal(null)} className="btn btn-secondary" style={{ padding: "9px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} /> Valider le nouveau statut
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
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem", marginBottom: "3px" }}>LIAISON</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <CircularFlag countryName={showPrintLabelModal.origin_country} size={13} />
                  <strong>{showPrintLabelModal.origin_country}</strong>
                  <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>→</span>
                  <CircularFlag countryName={showPrintLabelModal.destination_country} size={13} />
                  <strong>{showPrintLabelModal.destination_country}</strong>
                </span>
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
              <button type="button" onClick={() => setShowPrintLabelModal(null)} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <X size={14} /> Fermer
              </button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Printer size={14} /> Imprimer
              </button>
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
                <button type="button" onClick={() => setShowCreateClientModal(false)} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck size={14} /> Enregistrer Client
                </button>
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
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(28, 25, 23, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brown-dark)" }}>
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
                <button type="button" onClick={() => setShowRecordPaymentModal(null)} className="btn btn-secondary" style={{ padding: "9px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "9px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} /> Enregistrer Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : DÉTAIL COMPLET D'UNE COMMANDE CLIENT + ÉTAPE 2 (POIDS & LIEN DE PAIEMENT) + ÉTAPE 3 (ENCAISSEMENT & TRACKING) */}
      {showRequestDetailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div className="card-clean" style={{ maxWidth: "760px", width: "100%", padding: "26px", maxHeight: "92vh", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", overflowWrap: "anywhere", wordBreak: "break-word" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Dossier {showRequestDetailModal.reference}</h3>
                  <span className="badge-clean badge-draft">
                    {formatRequestType(showRequestDetailModal.request_type)}
                  </span>

                  {/* SÉLECTEUR DE STATUT DIRECT & SYNCHRONISÉ EN TEMPS RÉEL DANS LA MODALE */}
                  <select
                    value={showRequestDetailModal.status || "NEW"}
                    onChange={(e) =>
                      handleUpdateRequestStatus(
                        showRequestDetailModal.reference || showRequestDetailModal.id,
                        e.target.value
                      )
                    }
                    className="status-select-pill"
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      padding: "4px 26px 4px 10px",
                      borderRadius: "9999px",
                      border: "1.5px solid var(--border-light)",
                      cursor: "pointer",
                    }}
                    title="Modifier le statut du dossier"
                  >
                    <option value="NEW">NOUVEAU</option>
                    <option value="IN_REVIEW">EN ANALYSE</option>
                    <option value="QUOTE_SENT">DEVIS ENVOYÉ</option>
                    <option value="CONVERTED">PAYÉ &amp; SUIVI ACTIF</option>
                    <option value="CLOSED">CLÔTURÉ</option>
                    <option value="CANCELLED">ANNULÉ</option>
                  </select>

                  {showRequestDetailModal.tracking_number ? (
                    <Link
                      href={`/tracking/${showRequestDetailModal.tracking_number}`}
                      target="_blank"
                      style={{
                        background: "#CCFBF1",
                        color: "#0F766E",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.74rem",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      ✓ Suivi actif : {showRequestDetailModal.tracking_number} ↗
                    </Link>
                  ) : (
                    <span
                      style={{
                        background: "#F1E7D9",
                        color: "#6B5844",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      Sans N° de suivi actif
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Client : <strong style={{ color: "var(--text-main)" }}>{showRequestDetailModal.client_name}</strong> · WhatsApp :{" "}
                  <strong style={{ color: "var(--brown-dark)" }}>{showRequestDetailModal.client_phone}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestDetailModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* SECTION A : TOUT CE QUE LE CLIENT A ENVOYÉ (PRODUIT, PHOTO, LIEN, QUANTITÉ, TRANSPORT) */}
            <div
              style={{
                background: "#FAF8F5",
                border: "1.5px solid rgba(184, 164, 136, 0.4)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "18px",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--brown-dark)",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Package size={14} />
                  <span>1. Informations complètes envoyées par le client</span>
                </span>
                <span>{showRequestDetailModal.created_at?.substring(0, 16) || "Aujourd'hui"}</span>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "14px" }}>
                {showRequestDetailModal.product_image ? (
                  <div
                    onClick={() => setZoomProductImage(showRequestDetailModal.product_image)}
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: "1px solid var(--border-light)",
                      background: "#FFFFFF",
                      flexShrink: 0,
                      cursor: "zoom-in",
                      position: "relative",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
                    }}
                    title="Cliquez pour agrandir la photo du produit en plein écran"
                  >
                    <img
                      src={showRequestDetailModal.product_image}
                      alt={decodeHtmlEntitiesText(showRequestDetailModal.product_name || "Produit")}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        right: "4px",
                        background: "rgba(28,24,21,0.75)",
                        color: "#FFF",
                        fontSize: "0.62rem",
                        padding: "2px 6px",
                        borderRadius: "9999px",
                        fontWeight: 700,
                      }}
                    >
                      Agrandir
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "14px",
                      border: "1px dashed var(--border-light)",
                      background: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.72rem",
                      flexShrink: 0,
                    }}
                  >
                    <Package size={24} />
                    <span>Aucune photo</span>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: "200px", maxWidth: "100%" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "#1C1815", lineHeight: 1.35, marginBottom: "6px", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {decodeHtmlEntitiesText(
                      showRequestDetailModal.product_name ||
                        showRequestDetailModal.items?.[0]?.product_name ||
                        "Article commandé"
                    )}
                  </div>

                  {showRequestDetailModal.product_url ? (
                    <div style={{ marginBottom: "8px" }}>
                      <a
                        href={showRequestDetailModal.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#2563EB",
                          background: "#EFF6FF",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Ouvrir le lien exact de l&apos;article (Alibaba / 1688)</span>
                      </a>
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "8px",
                      background: "#FFFFFF",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-light)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Quantité souhaitée</span>
                      <strong style={{ color: "#1C1815", fontSize: "0.86rem" }}>
                        {showRequestDetailModal.product_quantity ||
                          showRequestDetailModal.items?.[0]?.quantity ||
                          1}{" "}
                        pcs
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Prix unitaire usine</span>
                      <strong style={{ color: "#6B5844", fontSize: "0.86rem" }}>
                        {showRequestDetailModal.unit_price
                          ? `${Number(showRequestDetailModal.unit_price).toLocaleString("fr-FR")} ${showRequestDetailModal.unit_price_currency || "USD"}`
                          : "Chiffré par ROUM"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Sous-total Marchandises</span>
                      <strong style={{ color: "#166534", fontSize: "0.86rem" }}>
                        {showRequestDetailModal.total_goods_fcfa
                          ? `${Number(showRequestDetailModal.total_goods_fcfa).toLocaleString("fr-FR")} FCFA`
                          : showRequestDetailModal.paid_to_supplier || "À chiffrer à l'Étape 2"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  background: "#FFFFFF",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-light)",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Destination choisie</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 700, flexWrap: "wrap" }}>
                    <CircularFlag countryName={showRequestDetailModal.origin_country || "Chine"} size={13} />
                    <span>{showRequestDetailModal.origin_country || "Chine"}</span>
                    <span>➔</span>
                    <CircularFlag countryName={showRequestDetailModal.destination_country || "Côte d'Ivoire"} size={13} />
                    <span>{showRequestDetailModal.destination_country || "Côte d'Ivoire"}</span>
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Moyen de transport souhaité</span>
                  <strong>{showRequestDetailModal.shipping_mode_name || showRequestDetailModal.shipping_mode_type || "Voie Aérienne"}</strong>
                </div>
                {showRequestDetailModal.shipping_mark && (
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Shipping Mark</span>
                    <strong style={{ fontFamily: "monospace", color: "var(--brown-dark)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{showRequestDetailModal.shipping_mark}</strong>
                  </div>
                )}
                {(showRequestDetailModal.supplier_name || showRequestDetailModal.paid_to_supplier) && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Infos Fournisseur (Option 2)</span>
                    <strong>
                      {showRequestDetailModal.paid_to_supplier ? `Payé: ${showRequestDetailModal.paid_to_supplier} ` : ""}
                      {showRequestDetailModal.supplier_name ? `(${showRequestDetailModal.supplier_name})` : ""}
                    </strong>
                  </div>
                )}
              </div>

              {showRequestDetailModal.description && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    background: "#FFFFFF",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <strong>Note / Récapitulatif :</strong>{" "}
                  {decodeHtmlEntitiesText(
                    String(showRequestDetailModal.description).replace(/\s*\|\s*Lien\s*:\s*https?:\/\/\S+/gi, "")
                  )}
                </div>
              )}
            </div>

            {/* SECTION B : PREUVE DE PAIEMENT DU CLIENT (SI DÉJÀ TÉLÉVERSÉE) */}
            {showRequestDetailModal.payment_receipt_url ? (
              <div style={{ background: "#F0FDF4", border: "2px solid #22C55E", padding: "16px", borderRadius: "16px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "#166534", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={18} />
                    {showRequestDetailModal.payment_receipt_url.startsWith("data:video") || /\.(mp4|mov|webm|ogg)$/i.test(showRequestDetailModal.payment_receipt_url)
                      ? "Preuve Vidéo de Paiement reçue du client"
                      : "Preuve de Paiement reçue du client"}{" "}
                    ({showRequestDetailModal.payment_method_selected?.toUpperCase() || "MOBILE MONEY"})
                  </span>
                  <a
                    href={showRequestDetailModal.payment_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={showRequestDetailModal.payment_receipt_name || "preuve_paiement"}
                    className="btn btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.74rem", background: "#FFFFFF" }}
                  >
                    Télécharger / Ouvrir ↗
                  </a>
                </div>

                {showRequestDetailModal.payment_receipt_url.startsWith("data:video") || /\.(mp4|mov|webm|ogg)$/i.test(showRequestDetailModal.payment_receipt_url) ? (
                  <video
                    src={showRequestDetailModal.payment_receipt_url}
                    controls
                    playsInline
                    style={{ width: "100%", maxHeight: "260px", borderRadius: "10px", border: "1px solid #BBF7D0", background: "#000", display: "block" }}
                  />
                ) : showRequestDetailModal.payment_receipt_url.startsWith("data:image") || /\.(png|jpg|jpeg|webp|gif)$/i.test(showRequestDetailModal.payment_receipt_url) ? (
                  <img
                    src={showRequestDetailModal.payment_receipt_url}
                    alt="Reçu de paiement"
                    onClick={() => setZoomProductImage(showRequestDetailModal.payment_receipt_url)}
                    style={{ maxHeight: "220px", borderRadius: "10px", border: "1px solid #BBF7D0", display: "block", objectFit: "contain", cursor: "zoom-in", background: "#FFFFFF" }}
                  />
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "#15803D", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={14} />
                    <span>Fichier joint : <strong>{showRequestDetailModal.payment_receipt_name || "recu_paiement.pdf"}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: "#F6F0E6", border: "1px solid #E3D4BF", padding: "12px 14px", borderRadius: "12px", marginBottom: "18px", fontSize: "0.8rem", color: "#6B5844", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <Clock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Aucune preuve de paiement jointe pour le moment.</strong> Estimez le poids ci-dessous et envoyez le lien de paiement sur WhatsApp au client pour qu&apos;il règle et téléverse son reçu.
                </div>
              </div>
            )}

            {/* SECTION C : ÉTAPE 2 (ADMIN) — ESTIMER LE POIDS, FAIRE LE DEVIS & ENVOYER LE LIEN DE PAIEMENT PAR WHATSAPP */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--border-light)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "18px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#1C1815", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Scale size={15} />
                <span>2. Étape Admin : Estimer le Poids, Calculer le Devis &amp; Envoyer le Lien de Paiement</span>
              </div>

              {(() => {
                const isSea =
                  showRequestDetailModal.shipping_mode_type === "SEA" ||
                  String(showRequestDetailModal.shipping_mode_name || "").toLowerCase().includes("maritime");
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.73rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        {isSea ? "Volume estimé par ROUM (m³)" : "Poids estimé par ROUM (kg)"}
                      </label>
                      <input
                        type="number"
                        step={isSea ? "0.01" : "0.5"}
                        min="0"
                        placeholder={isSea ? "0.1" : "1"}
                        value={(isSea ? adminQuoteForm.volume_cbm : adminQuoteForm.weight_kg) || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const val = cleaned === "" ? 0 : parseFloat(cleaned) || 0;
                          const newShip = Math.round(val * (adminQuoteForm.rate_per_unit || 12000));
                          setAdminQuoteForm((prev) => ({
                            ...prev,
                            ...(isSea ? { volume_cbm: val } : { weight_kg: val }),
                            shipping_fcfa: newShip,
                            total_fcfa: (prev.goods_fcfa || 0) + newShip,
                          }));
                        }}
                        className="input-clean"
                        style={{ height: "38px", fontWeight: 800 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.73rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Tarif Fret ({isSea ? "FCFA/m³" : "FCFA/kg"})
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        placeholder="12000"
                        value={adminQuoteForm.rate_per_unit || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const rate = cleaned === "" ? 0 : parseFloat(cleaned) || 0;
                          const qtyUnit = isSea ? adminQuoteForm.volume_cbm : adminQuoteForm.weight_kg;
                          const newShip = Math.round((qtyUnit || 1) * rate);
                          setAdminQuoteForm((prev) => ({
                            ...prev,
                            rate_per_unit: rate,
                            shipping_fcfa: newShip,
                            total_fcfa: (prev.goods_fcfa || 0) + newShip,
                          }));
                        }}
                        className="input-clean"
                        style={{ height: "38px", fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.73rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Marchandises (FCFA)
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        placeholder="0"
                        value={adminQuoteForm.goods_fcfa === 0 ? "" : adminQuoteForm.goods_fcfa}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const g = cleaned === "" ? 0 : parseFloat(cleaned) || 0;
                          setAdminQuoteForm((prev) => ({
                            ...prev,
                            goods_fcfa: g,
                            total_fcfa: g + (prev.shipping_fcfa || 0),
                          }));
                        }}
                        className="input-clean"
                        style={{ height: "38px", fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.73rem", fontWeight: 700, color: "#166534", display: "block", marginBottom: "4px" }}>
                        Total Devis à Payer (FCFA)
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        placeholder="0"
                        value={adminQuoteForm.total_fcfa || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          const tot = cleaned === "" ? 0 : parseFloat(cleaned) || 0;
                          setAdminQuoteForm((prev) => ({
                            ...prev,
                            total_fcfa: tot,
                          }));
                        }}
                        className="input-clean"
                        style={{ height: "38px", fontWeight: 800, color: "#166534", background: "#ECFDF5", borderColor: "#86EFAC" }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleSaveQuoteAndSendPaymentWhatsApp(showRequestDetailModal, true)}
                  style={{
                    background: "#16A34A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "9px 16px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    boxShadow: "0 3px 10px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  <WhatsAppLogo size={18} />
                  <span>Enregistrer le Devis &amp; Envoyer le Lien de Paiement sur WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const savedDossier = await handleSaveQuoteAndSendPaymentWhatsApp(showRequestDetailModal, false);
                    if (!savedDossier) return;
                    const link = getPaymentPageUrl({
                      reference: savedDossier.reference,
                      accessKey: savedDossier.access_key,
                    });
                    navigator.clipboard?.writeText(link);
                    setCopiedPaymentLink(true);
                    setTimeout(() => setCopiedPaymentLink(false), 2500);
                  }}
                  className="btn btn-secondary"
                  style={{ borderRadius: "9999px", padding: "8px 14px", fontSize: "0.76rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  {copiedPaymentLink ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                  <span>{copiedPaymentLink ? "Lien de paiement copié !" : "Copier le lien de paiement"}</span>
                </button>
              </div>
            </div>

            {/* SECTION D : ÉTAPE 3 (ADMIN) — CONFIRMER L'ENCAISSEMENT & GÉNÉRER + ENVOYER LE TRACKING NUMBER OFFICIEL */}
            <div
              style={{
                background: "#F0FDF4",
                border: "1.5px solid #86EFAC",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "18px",
              }}
            >
              <div style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#166534", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={15} />
                <span>3. Étape Finale Admin : Confirmer l&apos;Encaissement &amp; Envoyer le N° de Suivi Officiel</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#15803D", margin: "0 0 12px 0" }}>
                Une fois le paiement vérifié, cliquez ci-dessous pour générer le <strong>Tracking Number officiel</strong>, activer le suivi en direct et l&apos;envoyer au client sur WhatsApp.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleConfirmEncashmentAndGenerateTracking(showRequestDetailModal, true)}
                  style={{
                    background: "#1C1815",
                    color: "#FAF8F5",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "10px 18px",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(28, 24, 21, 0.2)",
                  }}
                >
                  <CheckCircle2 size={16} color="#4ADE80" />
                  <span>
                    {showRequestDetailModal.tracking_number
                      ? `Renvoyer le N° de Suivi (${showRequestDetailModal.tracking_number}) sur WhatsApp`
                      : "Confirmer l'Encaissement & Générer + Envoyer le N° de Suivi sur WhatsApp"}
                  </span>
                </button>
              </div>
            </div>

            {/* Pied de modale : Reçu PDF, Imprimer & Fermer */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const r = showRequestDetailModal;
                    const receipt: RoumReceiptData = {
                      supportPhone: companySettings.whatsapp_official_number,
                      receiptTitle: r.tracking_number
                        ? "REÇU OFFICIEL DE COMMANDE & SUIVI ACTIF"
                        : "DEVIS & FICHE DE COMMANDE ROUM TRANSIT",
                      reference: r.reference || "DOSSIER",
                      trackingNumber: r.tracking_number || undefined,
                      shippingMark: r.shipping_mark,
                      date: r.created_at?.substring(0, 10) || new Date().toLocaleDateString("fr-FR"),
                      clientName: r.client_name || "Client",
                      clientPhone: r.client_phone || "",
                      origin: r.origin_country || "Chine",
                      destination: r.destination_country || "Côte d'Ivoire",
                      optionType: r.option_type === "AVEC_FOURNISSEUR" ? "avec_fournisseur" : "sans_fournisseur",
                      transportMode: r.shipping_mode_name || r.shipping_mode_type || "Fret International",
                      weightOrVolume: r.estimated_cbm
                        ? `${r.estimated_cbm} m³`
                        : r.estimated_weight_kg
                        ? `${r.estimated_weight_kg} kg`
                        : `${adminQuoteForm.weight_kg} kg (estimé)`,
                      productTitle: r.product_name || r.cargo_type || "Marchandises",
                      productUrl: r.product_url,
                      productImage: r.product_image,
                      quantity: Number(r.product_quantity || 1),
                      goodsTotalFcfa: Number(r.total_goods_fcfa ?? adminQuoteForm.goods_fcfa),
                      paidToSupplierLabel: r.paid_to_supplier || r.rmb_amount,
                      shippingFeeFcfa: Number(r.shipping_fee_fcfa ?? adminQuoteForm.shipping_fcfa),
                      grandTotalFcfa: Number(r.total_amount_fcfa ?? adminQuoteForm.total_fcfa),
                      paymentMethodLabel: r.payment_method_selected,
                    };
                    downloadOfficialReceiptPdf(receipt);
                  }}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "9999px" }}
                >
                  <Download size={14} />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = showRequestDetailModal;
                    const receipt: RoumReceiptData = {
                      supportPhone: companySettings.whatsapp_official_number,
                      receiptTitle: r.tracking_number
                        ? "REÇU OFFICIEL DE COMMANDE & SUIVI ACTIF"
                        : "DEVIS & FICHE DE COMMANDE ROUM TRANSIT",
                      reference: r.reference || "DOSSIER",
                      trackingNumber: r.tracking_number || undefined,
                      shippingMark: r.shipping_mark,
                      date: r.created_at?.substring(0, 10) || new Date().toLocaleDateString("fr-FR"),
                      clientName: r.client_name || "Client",
                      clientPhone: r.client_phone || "",
                      origin: r.origin_country || "Chine",
                      destination: r.destination_country || "Côte d'Ivoire",
                      optionType: r.option_type === "AVEC_FOURNISSEUR" ? "avec_fournisseur" : "sans_fournisseur",
                      transportMode: r.shipping_mode_name || r.shipping_mode_type || "Fret International",
                      weightOrVolume: r.estimated_cbm
                        ? `${r.estimated_cbm} m³`
                        : r.estimated_weight_kg
                        ? `${r.estimated_weight_kg} kg`
                        : `${adminQuoteForm.weight_kg} kg (estimé)`,
                      productTitle: r.product_name || r.cargo_type || "Marchandises",
                      productUrl: r.product_url,
                      productImage: r.product_image,
                      quantity: Number(r.product_quantity || 1),
                      goodsTotalFcfa: Number(r.total_goods_fcfa ?? adminQuoteForm.goods_fcfa),
                      paidToSupplierLabel: r.paid_to_supplier || r.rmb_amount,
                      shippingFeeFcfa: Number(r.shipping_fee_fcfa ?? adminQuoteForm.shipping_fcfa),
                      grandTotalFcfa: Number(r.total_amount_fcfa ?? adminQuoteForm.total_fcfa),
                      paymentMethodLabel: r.payment_method_selected,
                    };
                    printOfficialReceipt(receipt);
                  }}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "9999px" }}
                >
                  <Printer size={14} />
                  <span>Imprimer</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowRequestDetailModal(null)}
                className="btn btn-secondary"
                style={{ borderRadius: "9999px" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PLEIN ÉCRAN POUR AGRANDIR LA PHOTO DU PRODUIT OU LE REÇU DE PAIEMENT CÔTÉ ADMIN */}
      {zoomProductImage && (
        <div
          onClick={() => setZoomProductImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 24, 21, 0.85)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#FFFFFF",
              padding: "14px",
              borderRadius: "20px",
              maxWidth: "90vw",
              maxHeight: "88vh",
            }}
          >
            <button
              type="button"
              onClick={() => setZoomProductImage(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                background: "#1C1815",
                color: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={zoomProductImage}
              alt="Aperçu grand format"
              style={{ maxWidth: "85vw", maxHeight: "80vh", objectFit: "contain", display: "block", borderRadius: "12px" }}
            />
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

            <form onSubmit={handleConvertRequestSubmit} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "#374151", display: "block", marginBottom: "4px", fontWeight: "700" }}>Liaison Corridors</label>
                  <select
                    value={convertForm.route_id}
                    onChange={(e) => setConvertForm({ ...convertForm, route_id: e.target.value })}
                    className="input-clean"
                    style={{
                      color: "#111827",
                      backgroundColor: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      height: "44px",
                      borderRadius: "14px",
                      border: "1px solid #D1D5DB",
                    }}
                  >
                    {(availableRoutes.length > 0 ? availableRoutes : [
                      { id: "route-cn-ci-gz", origin_country: "Chine", destination_country: "Côte d'Ivoire" },
                      { id: "route-cn-sn", origin_country: "Chine", destination_country: "Sénégal" },
                      { id: "route-cn-ml", origin_country: "Chine", destination_country: "Mali" },
                      { id: "route-cn-bf", origin_country: "Chine", destination_country: "Burkina Faso" },
                      { id: "route-cn-gn", origin_country: "Chine", destination_country: "Guinée" },
                      { id: "route-cn-cm-gz", origin_country: "Chine", destination_country: "Cameroun" },
                      { id: "route-cn-bj-gz", origin_country: "Chine", destination_country: "Bénin" },
                      { id: "route-ae-ci", origin_country: "Émirats Arabes Unis", destination_country: "Côte d'Ivoire" },
                      { id: "route-ma-sn", origin_country: "Maroc", destination_country: "Sénégal" },
                      { id: "route-fr-ci", origin_country: "France", destination_country: "Côte d'Ivoire" },
                    ]).map((r) => (
                      <option key={r.id} value={r.id} style={{ color: "#111827", backgroundColor: "#FFFFFF" }}>
                        {r.origin_country} ➔ {r.destination_country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "#374151", display: "block", marginBottom: "4px", fontWeight: "700" }}>Mode de Transport</label>
                  <select
                    value={convertForm.shipping_mode_id}
                    onChange={(e) => setConvertForm({ ...convertForm, shipping_mode_id: e.target.value })}
                    className="input-clean"
                    style={{
                      color: "#111827",
                      backgroundColor: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      height: "44px",
                      borderRadius: "14px",
                      border: "1px solid #D1D5DB",
                    }}
                  >
                    {(availableModes.length > 0 ? availableModes : [
                      { id: "AIR_EXPRESS", name: "Avion Express (4 à 5 jours)" },
                      { id: "AIR_STANDARD", name: "Avion Normal (10 à 14 jours)" },
                      { id: "AIR_SPECIAL", name: "Spécial Batteries & High-Tech (7 à 10 jours)" },
                      { id: "SEA_LCL", name: "Voie Maritime Groupage (35 à 45 jours)" },
                      { id: "SEA_FCL", name: "Voie Maritime Conteneur Complet" },
                    ]).map((m) => (
                      <option key={m.id} value={m.id} style={{ color: "#111827", backgroundColor: "#FFFFFF" }}>
                        {m.name}
                      </option>
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
                    style={{ borderRadius: "12px" }}
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
                    style={{ borderRadius: "12px" }}
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
                  style={{ borderRadius: "12px" }}
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
                  style={{ borderRadius: "12px" }}
                  placeholder="Ex: Colis Vêtements & Marchandises"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "14px" }}>
                <button type="button" onClick={() => setShowConvertRequestModal(null)} className="btn btn-secondary" style={{ borderRadius: "9999px", padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: "9999px", padding: "8px 22px", display: "inline-flex", alignItems: "center", gap: "6px", background: "#1C1815", color: "#FAF8F5" }}>
                  <Package size={14} /> Générer le Suivi &amp; Créer Expédition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : RÉCEPTION PHYSIQUE & PESÉE RÉELLE AU MAGASIN */}
      {showIntakeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "520px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "4px" }}>
              Pesée Réelle & Réception Magasin ({showIntakeModal.tracking_number})
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
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Magasin / Entrepôt de réception</label>
                <input
                  type="text"
                  required
                  value={intakeForm.hub_location}
                  onChange={(e) => setIntakeForm({ ...intakeForm, hub_location: e.target.value })}
                  className="input-clean"
                  placeholder="Ex : Entrepôt Guangzhou, Magasin Yiwu, Agence Bamako..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Statut appliqué</label>
                <select
                  value={intakeForm.status}
                  onChange={(e) => setIntakeForm({ ...intakeForm, status: e.target.value })}
                  className="input-clean"
                >
                  <option value="RECEIVED_AT_HUB">Reçu au magasin de départ</option>
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
                <button type="button" onClick={() => setShowIntakeModal(null)} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Scale size={14} /> Enregistrer Pesée & Statut
                </button>
              </div>
            </form>

            <div style={{ marginTop: "16px" }}>
              <ShipmentPhotosManager shipmentId={showIntakeModal.id} token={token} />
            </div>
          </div>
        </div>
      )}

      {/* MODALE : HISTORIQUE COMPLET D'EXPÉDITION (ÉTAPES DU COLIS, MESURES, PAIEMENTS) */}
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

            <div style={{ marginBottom: "16px" }}>
              <ShipmentPhotosManager shipmentId={showShipmentDetailModal.id} token={token} />
            </div>

            {/* Résumé Mesures et Liaison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", background: "var(--bg-app)", padding: "14px", borderRadius: "10px", marginBottom: "18px", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Liaison :</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CircularFlag countryName={showShipmentDetailModal.origin_country} size={14} />
                  <strong>{showShipmentDetailModal.origin_country}</strong>
                  <span style={{ color: "var(--brown-light)", fontSize: "0.7rem" }}>➔</span>
                  <CircularFlag countryName={showShipmentDetailModal.destination_country} size={14} />
                  <strong>{showShipmentDetailModal.destination_country}</strong>
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Poids réel mesuré :</span>
                <strong>{showShipmentDetailModal.total_weight_kg} kg {showShipmentDetailModal.total_volume_cbm ? `· ${showShipmentDetailModal.total_volume_cbm} m³` : ""}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Règlement :</span>
                <strong style={{ color: showShipmentDetailModal.payment_status === "PAID" ? "var(--state-success-text)" : "#6B5844" }}>
                  {showShipmentDetailModal.payment_status === "PAID" ? "Intégralement Réglé" : showShipmentDetailModal.payment_status === "PARTIAL" ? "Acompte Versé" : "En Attente de Règlement"}
                </strong>
              </div>
            </div>

            {/* Étapes de Suivi du Colis */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.92rem", fontWeight: "700", marginBottom: "10px" }}>
                Chronologie des Étapes du Colis ({showShipmentDetailModal.tracking_events?.length || 0})
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
                Réajuster Pesée Magasin
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
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <X size={14} /> Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={14} /> Créer Tâche
                </button>
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
            icon: <Zap size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <Plane size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <BatteryCharging size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <Laptop size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <Award size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <ShoppingBag size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <Package size={13} style={{ color: "var(--brown-dark)" }} />,
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
            icon: <FileText size={13} style={{ color: "var(--brown-dark)" }} />,
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
                  <Zap size={13} style={{ color: "var(--brown-light)" }} />
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
                          <optgroup label="Grands Entrepôts Stratégiques">
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
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Entrepôts fréquents :</span>
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
                          <optgroup label="Entrepôts Internationaux">
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

      {/* MODALE DÉDIÉE : CRÉER & RELIER UNE LIAISON AÉRIENNE (CONTRÔLE ABSOLU DIRECTION) */}
      {showCreateAirRouteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "580px", width: "100%", maxHeight: "92vh", overflowY: "auto", borderRadius: "24px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)", background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(28, 25, 23, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plane size={20} color="var(--brown-dark)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>
                    Créer & Relier une Liaison Aérienne
                  </h3>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
                    Contrôle absolu Direction : reliez librement vos aéroports et configurez vos barèmes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAirRouteModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAirRoute} style={{ display: "grid", gap: "14px" }}>
              {/* Type de liaison / Sens */}
              <div style={{ background: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--brown-dark)", display: "block", marginBottom: "8px" }}>
                  Sens de la liaison aérienne
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setAirRouteForm({ ...airRouteForm, isBilateral: true })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid " + (airRouteForm.isBilateral ? "var(--brown-dark)" : "var(--border-light)"),
                      background: airRouteForm.isBilateral ? "#FFFFFF" : "transparent",
                      color: airRouteForm.isBilateral ? "var(--brown-dark)" : "var(--text-secondary)",
                      fontWeight: airRouteForm.isBilateral ? "800" : "500",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: airRouteForm.isBilateral ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <span>↔ Bilatérale (2 sens)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAirRouteForm({ ...airRouteForm, isBilateral: false })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid " + (!airRouteForm.isBilateral ? "var(--brown-dark)" : "var(--border-light)"),
                      background: !airRouteForm.isBilateral ? "#FFFFFF" : "transparent",
                      color: !airRouteForm.isBilateral ? "var(--brown-dark)" : "var(--text-secondary)",
                      fontWeight: !airRouteForm.isBilateral ? "800" : "500",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: !airRouteForm.isBilateral ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <span>➔ Aller simple</span>
                  </button>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  {airRouteForm.isBilateral
                    ? "Crée automatiquement les deux directions reliées (ex: Paris ➔ Abidjan ET Abidjan ➔ Paris)."
                    : "Crée uniquement la liaison dans le sens Aller (Départ ➔ Arrivée)."}
                </div>
              </div>

              {/* Aéroports reliés : Départ et Arrivée */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Départ (Menu déroulant)
                  </label>
                  <select
                    value={airRouteForm.origin_country}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const found = [...STRATEGIC_HUBS, ...AFRICAN_COUNTRIES, ...ALL_WORLD_COUNTRIES].find((c) => c.name === selectedName);
                      setAirRouteForm({
                        ...airRouteForm,
                        origin_country: selectedName,
                        origin_city: found?.hubCity || airRouteForm.origin_city,
                      });
                    }}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    <optgroup label="Entrepôts Stratégiques ROUM">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`air-hub-orig-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Pays Africains">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`air-afr-orig-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`air-all-orig-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <input
                    type="text"
                    placeholder="Ville / Entrepôt de départ (Ex: Paris CDG)"
                    value={airRouteForm.origin_city}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, origin_city: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: "6px", fontSize: "0.76rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Destination (Menu déroulant)
                  </label>
                  <select
                    value={airRouteForm.destination_country}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const found = [...AFRICAN_COUNTRIES, ...STRATEGIC_HUBS, ...ALL_WORLD_COUNTRIES].find((c) => c.name === selectedName);
                      setAirRouteForm({
                        ...airRouteForm,
                        destination_country: selectedName,
                        destination_city: found?.hubCity || airRouteForm.destination_city,
                      });
                    }}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    <optgroup label="Destinations Africaines">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`air-afr-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Entrepôts Stratégiques">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`air-hub-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`air-all-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <input
                    type="text"
                    placeholder="Ville / Entrepôt d'arrivée (Ex: Abidjan FHB)"
                    value={airRouteForm.destination_city}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, destination_city: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: "6px", fontSize: "0.76rem" }}
                  />
                </div>
              </div>

              {/* Nom du service / Formule */}
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Nom de la Formule / Service Aérien
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fret Aérien Direct Paris ↔ Abidjan"
                  value={airRouteForm.service_name}
                  onChange={(e) => setAirRouteForm({ ...airRouteForm, service_name: e.target.value })}
                  className="input-clean"
                />
              </div>

              {/* Tarification et Unité */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Prix Unitaire
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ex: 8500"
                    value={airRouteForm.price_per_unit || ""}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, price_per_unit: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontWeight: "800", color: "var(--brown-dark)" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Base de calcul
                  </label>
                  <select
                    value={airRouteForm.pricing_basis}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, pricing_basis: e.target.value })}
                    className="input-clean"
                  >
                    <option value="PER_KG">Par kg (/ kg)</option>
                    <option value="PER_UNIT">Par pli / pièce</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Devise
                  </label>
                  <select
                    value={airRouteForm.currency}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, currency: e.target.value })}
                    className="input-clean"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Délais */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Délai min (jours)
                  </label>
                  <input
                    type="number"
                    value={airRouteForm.estimated_days_min}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, estimated_days_min: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Délai max (jours)
                  </label>
                  <input
                    type="number"
                    value={airRouteForm.estimated_days_max}
                    onChange={(e) => setAirRouteForm({ ...airRouteForm, estimated_days_max: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
              </div>

              {/* Notes / Conditions */}
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Conditions & Magasin / Entrepôt associé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Agence Bingerville · Expéditions régulières dans les 2 sens"
                  value={airRouteForm.note}
                  onChange={(e) => setAirRouteForm({ ...airRouteForm, note: e.target.value })}
                  className="input-clean"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAirRouteModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 18px", borderRadius: "9999px" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 24px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={14} />
                  Créer & Relier cette Liaison
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DÉDIÉE : AJOUTER UN PAYS (GROUPAGE SUBSAHARIEN MAROC) */}
      {showAddMoroccoCountryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)", background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CircularFlag countryCode="MA" size={24} />
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>
                    Ajouter une Destination (Maroc)
                  </h3>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
                    Groupage Subsaharien Casablanca ➔ Nouvelle destination africaine
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMoroccoCountryModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMoroccoCountry} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Départ
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Maroc (Casablanca)"
                    className="input-clean"
                    style={{ background: "#F3F4F6", fontWeight: "700", cursor: "not-allowed" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Destination (Menu déroulant)
                  </label>
                  <select
                    value={moroccoCountryForm.destination_country}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const found = [...AFRICAN_COUNTRIES, ...ALL_WORLD_COUNTRIES].find((c) => c.name === selectedName);
                      setMoroccoCountryForm({
                        ...moroccoCountryForm,
                        destination_country: selectedName,
                        destination_city: found?.hubCity || selectedName,
                      });
                    }}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    <optgroup label="Destinations Africaines">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`ma-add-afr-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`ma-add-all-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Ville / Entrepôt d&apos;arrivée
                  </label>
                  <input
                    type="text"
                    value={moroccoCountryForm.destination_city}
                    onChange={(e) => setMoroccoCountryForm({ ...moroccoCountryForm, destination_city: e.target.value })}
                    className="input-clean"
                    placeholder="Ex: Dakar, Bamako, Lomé..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Prix unitaire (FCFA / kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={moroccoCountryForm.price_per_unit}
                    onChange={(e) => setMoroccoCountryForm({ ...moroccoCountryForm, price_per_unit: Number(e.target.value) })}
                    className="input-clean"
                    style={{ fontWeight: "800", color: "var(--brown-dark)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Délai garanti (jours)
                  </label>
                  <input
                    type="number"
                    value={moroccoCountryForm.estimated_days_min}
                    onChange={(e) => setMoroccoCountryForm({ ...moroccoCountryForm, estimated_days_min: Number(e.target.value), estimated_days_max: Number(e.target.value) })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Devise
                  </label>
                  <select
                    value={moroccoCountryForm.currency}
                    onChange={(e) => setMoroccoCountryForm({ ...moroccoCountryForm, currency: e.target.value })}
                    className="input-clean"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={`curr-ma-${c.code}`} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Note / Modalités
                </label>
                <input
                  type="text"
                  value={moroccoCountryForm.note}
                  onChange={(e) => setMoroccoCountryForm({ ...moroccoCountryForm, note: e.target.value })}
                  className="input-clean"
                  placeholder="Ex: Groupage aérien départ Casablanca 5 jours garantis"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddMoroccoCountryModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 18px", borderRadius: "9999px" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 22px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={14} /> Enregistrer la destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DÉDIÉE : AJOUTER UN ENTREPÔT / DÉPÔT INTERNATIONAL */}
      {showAddHubModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="card-clean animate-fade-in" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "26px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)", background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CircularFlag countryCode={newHubForm.countryCode || "TR"} size={24} />
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 2px 0" }}>
                    Ajouter un Entrepôt International
                  </h3>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
                    Nouvelle plateforme de transit, entrepôt ou adresse de réception à l&apos;étranger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHubModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddHub} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Nom de l&apos;Entrepôt / Magasin *
                </label>
                <input
                  type="text"
                  required
                  value={newHubForm.name}
                  onChange={(e) => setNewHubForm({ ...newHubForm, name: e.target.value })}
                  className="input-clean"
                  placeholder="Ex : Entrepôt Istanbul (Turquie), Dépôt Milan (Italie)..."
                  style={{ fontWeight: "700" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays (Menu déroulant) *
                  </label>
                  <select
                    value={newHubForm.country}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const found = [...STRATEGIC_HUBS, ...ALL_WORLD_COUNTRIES].find((c) => c.name === selectedName);
                      const code = found?.code || getCountryCodeFromName(selectedName) || "TR";
                      setNewHubForm({
                        ...newHubForm,
                        country: selectedName,
                        countryCode: code,
                        city: found?.hubCity || newHubForm.city,
                      });
                    }}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    <optgroup label="Entrepôts Stratégiques & Partenaires">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`hub-add-strat-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`hub-add-all-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Ville du Dépôt / Magasin *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHubForm.city}
                    onChange={(e) => setNewHubForm({ ...newHubForm, city: e.target.value })}
                    className="input-clean"
                    placeholder="Ex: Istanbul, New York, Milan..."
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Adresse Physique Complète de Livraison *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newHubForm.address}
                  onChange={(e) => setNewHubForm({ ...newHubForm, address: e.target.value })}
                  className="input-clean"
                  placeholder="Adresse précise pour vos fournisseurs (Rue, Bâtiment, Quartier, Code postal)..."
                  style={{ resize: "vertical", fontSize: "0.82rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Code client sur colis (Shipping Mark) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHubForm.shipping_mark}
                    onChange={(e) => setNewHubForm({ ...newHubForm, shipping_mark: e.target.value })}
                    className="input-clean"
                    placeholder="Ex: ROUM-IST-[NOM_CLIENT]"
                    style={{ fontWeight: "700", color: "var(--brown-dark)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Contact Téléphone / WhatsApp de l&apos;Entrepôt
                  </label>
                  <input
                    type="text"
                    value={newHubForm.contact}
                    onChange={(e) => setNewHubForm({ ...newHubForm, contact: e.target.value })}
                    className="input-clean"
                    placeholder="Ex: +90 532 000 0000"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddHubModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 18px", borderRadius: "9999px" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 22px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={14} /> Enregistrer cet entrepôt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Départ (Menu déroulant)
                  </label>
                  <select
                    value={editingTariff.origin_country || ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, origin_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingTariff.origin_country && (
                      <option value={editingTariff.origin_country}>{editingTariff.origin_country}</option>
                    )}
                    <optgroup label="Entrepôts Stratégiques ROUM">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`edit-hub-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Pays Africains">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`edit-afr-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`edit-all-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Destination (Menu déroulant)
                  </label>
                  <select
                    value={editingTariff.destination_country || ""}
                    onChange={(e) => setEditingTariff({ ...editingTariff, destination_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingTariff.destination_country && (
                      <option value={editingTariff.destination_country}>{editingTariff.destination_country}</option>
                    )}
                    <optgroup label="Destinations Africaines">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`edit-afr-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Entrepôts Stratégiques">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`edit-hub-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`edit-all-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
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
                  <Check size={14} /> Appliquer à la grille
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
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays d&apos;Origine (Menu déroulant)
                  </label>
                  <select
                    value={editingShipment.origin_country || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, origin_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingShipment.origin_country && (
                      <option value={editingShipment.origin_country}>{editingShipment.origin_country}</option>
                    )}
                    <optgroup label="Entrepôts Stratégiques ROUM">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`ship-hub-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Pays Africains">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`ship-afr-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`ship-all-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Destination (Menu déroulant)
                  </label>
                  <select
                    value={editingShipment.destination_country || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, destination_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingShipment.destination_country && (
                      <option value={editingShipment.destination_country}>{editingShipment.destination_country}</option>
                    )}
                    <optgroup label="Destinations Africaines">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`ship-afr-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Entrepôts Stratégiques">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`ship-hub-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`ship-all-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
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
                    <option value="RECEIVED_ORIGIN_HUB">Reçu au Magasin de départ</option>
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
                    value={editingShipment.payment_status || "PENDING"}
                    onChange={(e) => setEditingShipment({ ...editingShipment, payment_status: e.target.value })}
                    className="input-clean"
                  >
                    <option value="PENDING">En attente de règlement</option>
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
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Départ (Menu déroulant)
                  </label>
                  <select
                    value={editingRequest.origin_country || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, origin_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingRequest.origin_country && (
                      <option value={editingRequest.origin_country}>{editingRequest.origin_country}</option>
                    )}
                    <optgroup label="Entrepôts Stratégiques ROUM">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`req-hub-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Pays Africains">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`req-afr-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`req-all-dep-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Pays de Destination (Menu déroulant)
                  </label>
                  <select
                    value={editingRequest.destination_country || ""}
                    onChange={(e) => setEditingRequest({ ...editingRequest, destination_country: e.target.value })}
                    className="input-clean"
                    style={{ fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingRequest.destination_country && (
                      <option value={editingRequest.destination_country}>{editingRequest.destination_country}</option>
                    )}
                    <optgroup label="Destinations Africaines">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={`req-afr-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Entrepôts Stratégiques">
                      {STRATEGIC_HUBS.map((c) => (
                        <option key={`req-hub-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tous les Pays du Monde">
                      {ALL_WORLD_COUNTRIES.map((c) => (
                        <option key={`req-all-dest-${c.code}`} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
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
                    <option value="CASH">Espèces au Guichet</option>
                    <option value="BANK_TRANSFER">Virement Bancaire (Compte Transit)</option>
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
            {/* Entête Modale Épurée */}
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
              <h3 style={{ fontSize: "1.18rem", fontWeight: "800", color: "var(--brown-dark)", margin: 0 }}>
                Mon Profil de Direction
              </h3>
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
                      E-mail de connexion
                    </label>
                    <input type="email" value={user?.email || profileForm.email} className="input-clean" readOnly />
                    <span style={{ display: "block", marginTop: "4px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Se change dans Paramètres.
                    </span>
                  </div>
                </div>
              </div>



              {/* Boutons d Action */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "9px 20px", borderRadius: "9999px", fontSize: "0.84rem" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn btn-primary"
                  style={{
                    padding: "9px 24px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "0.84rem",
                    boxShadow: "0 4px 14px rgba(28, 25, 23, 0.22)",
                  }}
                >
                  <Check size={15} />
                  {isSavingProfile ? "Enregistrement..." : "Enregistrer mon Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP EXÉCUTIF DE CONFIRMATION AUTOMATIQUE (DEMANDÉ EXPLICITEMENT PAR L'UTILISATEUR) */}
      {saveConfirmationPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "20px",
          }}
        >
          <div
            className="card-clean animate-fade-in"
            style={{
              maxWidth: "460px",
              width: "100%",
              borderRadius: "24px",
              padding: "28px 24px",
              background: "#FFFFFF",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.22)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <Check size={28} strokeWidth={2.8} />
            </div>

            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brown-dark)", margin: "0 0 6px 0" }}>
              {saveConfirmationPopup.title}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 20px 0", lineHeight: 1.4 }}>
              {saveConfirmationPopup.subtitle}
            </p>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid var(--border-light)",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Service</span>
                <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "var(--brown-dark)" }}>
                  {saveConfirmationPopup.item.service}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Itinéraire</span>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-main)" }}>
                  {saveConfirmationPopup.item.route}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Tarif unitaire</span>
                <span style={{ fontSize: "0.95rem", fontWeight: "900", color: "#10B981" }} className="tabular-nums">
                  {saveConfirmationPopup.item.price}
                </span>
              </div>
              {saveConfirmationPopup.item.delay && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Délai estimé</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                    {saveConfirmationPopup.item.delay}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.72rem", color: "#10B981", fontWeight: "700", marginBottom: "18px" }}>
              <Check size={14} />
              <span>Enregistrement automatique réussi · Base de données synchronisée</span>
            </div>

            <button
              type="button"
              onClick={() => setSaveConfirmationPopup(null)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", borderRadius: "9999px", fontSize: "0.88rem", fontWeight: "800" }}
            >
              Continuer
            </button>
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