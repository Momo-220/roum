/**
 * Roum Boutique : types partagés, panier gardé dans le navigateur et messages WhatsApp.
 * Le stock, les prix et les totaux font toujours foi côté serveur.
 */

export interface ShopVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
}

export interface ShopProduct {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  priceFcfa: number;
  promoPriceFcfa: number | null;
  promoEndsAt: string | null;
  originCountry: string;
  images: string[];
  variants: ShopVariant[];
  /** Date d'ajout (UTC « AAAA-MM-JJ HH:MM:SS ») : sert au badge « Nouveau » et au tri. */
  createdAt?: string;
}

export interface ShopCategory {
  id: string;
  name: string;
}

export interface ShopCatalog {
  categories: ShopCategory[];
  products: ShopProduct[];
  countries: string[];
}

export interface DeliveryOption {
  id: string;
  method: "BOUTIQUE" | "TRANSIT";
  label: string;
  delay: string;
  priceFcfa: number;
}

export type ShopOrderStatus = "AWAITING_PAYMENT" | "PROOF_SENT" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface ShopOrder {
  reference: string;
  status: ShopOrderStatus;
  statusLabel: string;
  customer: { name: string; phone: string; country: string; city: string; address: string; note: string };
  delivery: { method: "BOUTIQUE" | "TRANSIT"; label: string; priceFcfa: number };
  itemsFcfa: number;
  totalFcfa: number;
  paymentMethod: string | null;
  proofSent: boolean;
  trackingNumber: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    productId: string | null;
    productName: string;
    color: string;
    size: string;
    unitPriceFcfa: number;
    quantity: number;
    lineTotalFcfa: number;
  }>;
}

export interface CartLine {
  variantId: string;
  quantity: number;
}

export const SHOP_NAME = "ROUM BOUTIQUE";
export const MAX_QUANTITY_PER_LINE = 50;

export const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

export const shopImageUrl = (id: string) => `/api/v1/public/shop/images/${id}`;

/** Prix affiché : la promotion, si elle est en cours. */
export const productPrice = (p: Pick<ShopProduct, "priceFcfa" | "promoPriceFcfa">) => p.promoPriceFcfa ?? p.priceFcfa;

export const productStock = (p: ShopProduct) => p.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);

export const variantLabel = (v: Pick<ShopVariant, "color" | "size">) => [v.color, v.size].filter(Boolean).join(" · ");

/** Pourcentage de remise arrondi, pour l'étiquette « -20 % ». */
export function discountPercent(p: Pick<ShopProduct, "priceFcfa" | "promoPriceFcfa">): number | null {
  if (p.promoPriceFcfa === null || p.priceFcfa <= 0) return null;
  return Math.round((1 - p.promoPriceFcfa / p.priceFcfa) * 100);
}

// ---------- Panier (navigateur) ----------

const CART_KEY = "roum_shop_cart";
const ORDERS_KEY = "roum_shop_orders";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((l) => typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {}
}

export interface SavedOrder {
  reference: string;
  key: string;
  totalFcfa: number;
  createdAt: string;
}

/** Les commandes passées depuis cet appareil, pour les retrouver sans compte. */
export function readSavedOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((o) => o?.reference && o?.key) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: SavedOrder) {
  try {
    const others = readSavedOrders().filter((o) => o.reference !== order.reference);
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...others].slice(0, 30)));
  } catch {}
}

export const orderPageUrl = (reference: string, key: string) =>
  `/boutique/commande/${encodeURIComponent(reference)}?key=${encodeURIComponent(key)}`;

// ---------- Tailles proposées à la gérante ----------

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const SIZE_PRESETS: Array<{ id: string; label: string; sizes: string[] }> = [
  { id: "women_shoes", label: "Chaussures femme (35 à 42)", sizes: range(35, 42) },
  { id: "men_shoes", label: "Chaussures homme (39 à 47)", sizes: range(39, 47) },
  { id: "kids_shoes", label: "Chaussures enfant (24 à 34)", sizes: range(24, 34) },
  { id: "clothes", label: "Vêtements (XS à XXL)", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { id: "one_size", label: "Taille unique", sizes: [] },
];

// ---------- Messages WhatsApp ----------

const lines = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join("\n");

export function whatsappLink(phoneDigits: string, message: string) {
  return `https://wa.me/${phoneDigits.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Le client prévient la boutique après sa commande ou son paiement. */
export function customerOrderMessage(order: Pick<ShopOrder, "reference" | "totalFcfa">, pageUrl: string, paid: boolean) {
  return lines(
    `Bonjour ${SHOP_NAME},`,
    paid
      ? `J'ai payé ma commande ${order.reference} (${formatFcfa(order.totalFcfa)}) et envoyé la preuve.`
      : `Je viens de passer la commande ${order.reference} (${formatFcfa(order.totalFcfa)}).`,
    `Suivi : ${pageUrl}`
  );
}

/** La gérante écrit au client à chaque étape de sa commande. */
export function managerOrderMessage(order: ShopOrder, pageUrl: string) {
  const name = order.customer.name.split(" ")[0] || order.customer.name;
  const hello = `Bonjour ${name},`;
  switch (order.status) {
    case "AWAITING_PAYMENT":
      if (order.proofSent) {
        return lines(
          hello,
          `Votre preuve de paiement pour la commande ${order.reference} n'a pas pu être validée.`,
          `Merci de vérifier le montant (${formatFcfa(order.totalFcfa)}) et d'envoyer une nouvelle capture sur votre page :`,
          pageUrl,
          SHOP_NAME
        );
      }
      return lines(
        hello,
        `Merci pour votre commande ${order.reference} : ${formatFcfa(order.totalFcfa)}.`,
        "Pour la valider, payez puis envoyez la preuve sur votre page de commande :",
        pageUrl,
        SHOP_NAME
      );
    case "PROOF_SENT":
      return lines(hello, `Nous vérifions votre paiement pour la commande ${order.reference}.`, pageUrl, SHOP_NAME);
    case "CONFIRMED":
      return lines(
        hello,
        `Paiement reçu pour la commande ${order.reference}, merci ! Nous préparons votre colis.`,
        pageUrl,
        SHOP_NAME
      );
    case "SHIPPED":
      return lines(
        hello,
        `Votre commande ${order.reference} est en route.`,
        order.trackingNumber && `Numéro de suivi : ${order.trackingNumber}`,
        pageUrl,
        SHOP_NAME
      );
    case "DELIVERED":
      return lines(hello, `Votre commande ${order.reference} est livrée. Merci de votre confiance !`, SHOP_NAME);
    case "CANCELLED":
      return lines(
        hello,
        `Votre commande ${order.reference} a été annulée.`,
        order.cancelReason && `Motif : ${order.cancelReason}`,
        SHOP_NAME
      );
  }
}

export const ORDER_STEPS: Array<{ status: ShopOrderStatus; label: string }> = [
  { status: "AWAITING_PAYMENT", label: "Commande reçue" },
  { status: "PROOF_SENT", label: "Paiement envoyé" },
  { status: "CONFIRMED", label: "Paiement confirmé" },
  { status: "SHIPPED", label: "Expédiée" },
  { status: "DELIVERED", label: "Livrée" },
];

export const stepIndex = (status: ShopOrderStatus) => ORDER_STEPS.findIndex((s) => s.status === status);

/** Un numéro Roum Transit ouvre la page de suivi du colis. */
export const isTransitTrackingNumber = (value: string | null) => Boolean(value && /^RM-(AIR|SEA)-/i.test(value));

// ---------- Présentation ----------

/** Nuancier des couleurs courantes : une pastille plutôt qu'un mot. Une couleur inconnue garde son nom seul. */
const SWATCHES: Array<[RegExp, string]> = [
  [/noir|black/i, "#1B1411"],
  [/blanc|white|ivoire/i, "#FFFFFF"],
  [/cr[eè]me|ecru|écru/i, "#F3EADB"],
  [/beige|nude/i, "#E2CDB0"],
  [/sable|sand/i, "#D8C3A0"],
  [/camel/i, "#C19A6B"],
  [/cognac|caramel/i, "#9A5B2E"],
  [/marron|brun|chocolat|brown/i, "#6B4423"],
  [/taupe/i, "#8B7B6B"],
  [/terracotta|brique|rouille/i, "#B9654B"],
  [/bordeaux|prune/i, "#6D1A2A"],
  [/rouge|red/i, "#B3261E"],
  [/rose|pink/i, "#E3AEB2"],
  [/orange/i, "#D9822B"],
  [/jaune|moutarde|yellow/i, "#D9B23F"],
  [/kaki|olive/i, "#7A7346"],
  [/vert|green/i, "#3F6B4F"],
  [/bleu marine|marine|navy/i, "#1F2A44"],
  [/bleu|blue|jean/i, "#3E5C8A"],
  [/violet|mauve|lilas/i, "#7A5C8E"],
  [/gris|gray|grey/i, "#9A9590"],
  [/argent|silver/i, "#C8C8C8"],
  [/dor[ée]|or\b|gold/i, "#C9A646"],
];

export function colorSwatch(name: string): string | null {
  for (const [pattern, hex] of SWATCHES) if (pattern.test(name)) return hex;
  return null;
}

const NEW_FOR_DAYS = 21;

export function isNewProduct(p: Pick<ShopProduct, "createdAt">): boolean {
  if (!p.createdAt) return false;
  const date = new Date(p.createdAt.includes("T") ? p.createdAt : `${p.createdAt.replace(" ", "T")}Z`);
  return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() < NEW_FOR_DAYS * 86_400_000;
}

/** « 36 – 40 », « S – L » ou « Taille unique » : la plage des tailles en vente. */
export function sizeRange(p: Pick<ShopProduct, "variants">): string {
  const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))];
  if (sizes.length === 0) return "";
  if (sizes.length === 1) return sizes[0];
  return `${sizes[0]} – ${sizes[sizes.length - 1]}`;
}

export const productColors = (p: Pick<ShopProduct, "variants">) => [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
