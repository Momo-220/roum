import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { checkClientRateLimit, constantTimeCompare } from "../crypto";
import { formatReferencePeriod, generateReferenceSuffix } from "../shared";
import { newAccessKey } from "../requests";
import type { Env, UserSession } from "../types";

/**
 * Roum Boutique.
 *
 * Le client paie par Wave, Orange Money ou compte Maroc (aucune API : il envoie sa preuve),
 * la gérante vérifie puis confirme. Le stock est tenu par taille et couleur ; il est retiré
 * à la commande et rendu si elle est annulée. La livraison est soit au prix fixé par la boutique
 * pour une ville, soit calculée sur la grille Roum Transit selon le pays de départ et le poids.
 */

export const shopPublicRouter = new Hono<{ Bindings: Env }>();
export const shopAdminRouter = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const PROOF_DATA_URL = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;
/** Une ligne D1 ne dépasse pas 2 Mo. */
const MAX_IMAGE_CHARS = 1_500_000;
const MAX_PROOF_CHARS = 1_800_000;
const MAX_IMAGES_PER_PRODUCT = 8;
const DEFAULT_WEIGHT_KG = 1;

export const SHOP_ORDER_STATUSES = [
  "AWAITING_PAYMENT",
  "PROOF_SENT",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
type OrderStatus = (typeof SHOP_ORDER_STATUSES)[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "En attente de paiement",
  PROOF_SENT: "Paiement en cours de vérification",
  CONFIRMED: "Paiement confirmé · en préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

/** Étapes permises : la gérante ne peut pas, par exemple, livrer une commande non payée. */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  // Preuve refusée : la commande repasse en attente de paiement.
  PROOF_SENT: ["CONFIRMED", "AWAITING_PAYMENT", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

interface ProductRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price_fcfa: number;
  promo_price_fcfa: number | null;
  promo_ends_at: string | null;
  origin_country: string;
  weight_kg: number | null;
  is_active: number;
  position: number;
}

interface VariantRow {
  id: string;
  product_id: string;
  color: string;
  size: string;
  stock: number;
}

interface OrderRow {
  id: string;
  reference: string;
  access_key: string;
  customer_name: string;
  customer_phone: string;
  country: string;
  city: string;
  address: string;
  note: string;
  delivery_method: "BOUTIQUE" | "TRANSIT";
  delivery_label: string;
  delivery_fcfa: number;
  items_fcfa: number;
  total_fcfa: number;
  status: OrderStatus;
  payment_method: string | null;
  proof_mime: string | null;
  proof_sent_at: string | null;
  tracking_number: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

const ORDER_COLUMNS = `id, reference, access_key, customer_name, customer_phone, country, city, address, note,
  delivery_method, delivery_label, delivery_fcfa, items_fcfa, total_fcfa, status, payment_method,
  proof_mime, proof_sent_at, tracking_number, cancel_reason, created_at, updated_at`;

/** Une promotion compte jusqu'à la fin du jour indiqué ; sans date, tant qu'elle est saisie. */
function promoIsActive(p: Pick<ProductRow, "price_fcfa" | "promo_price_fcfa" | "promo_ends_at">, now = Date.now()) {
  if (p.promo_price_fcfa === null || p.promo_price_fcfa === undefined) return false;
  if (p.promo_price_fcfa >= p.price_fcfa) return false;
  if (!p.promo_ends_at) return true;
  const end = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(p.promo_ends_at) ? `${p.promo_ends_at}T23:59:59Z` : p.promo_ends_at);
  return Number.isNaN(end) || end >= now;
}

function effectivePrice(p: ProductRow): number {
  return promoIsActive(p) ? (p.promo_price_fcfa as number) : p.price_fcfa;
}

function toPublicProduct(p: ProductRow, variants: VariantRow[], imageIds: string[]) {
  const promo = promoIsActive(p);
  return {
    id: p.id,
    categoryId: p.category_id,
    name: p.name,
    description: p.description,
    priceFcfa: p.price_fcfa,
    promoPriceFcfa: promo ? p.promo_price_fcfa : null,
    promoEndsAt: promo ? p.promo_ends_at : null,
    originCountry: p.origin_country,
    images: imageIds,
    variants: variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: Math.max(0, v.stock) })),
  };
}

function toPublicOrder(order: OrderRow, items: any[]) {
  return {
    reference: order.reference,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      country: order.country,
      city: order.city,
      address: order.address,
      note: order.note,
    },
    delivery: { method: order.delivery_method, label: order.delivery_label, priceFcfa: order.delivery_fcfa },
    itemsFcfa: order.items_fcfa,
    totalFcfa: order.total_fcfa,
    paymentMethod: order.payment_method,
    proofSent: Boolean(order.proof_sent_at),
    trackingNumber: order.tracking_number,
    cancelReason: order.cancel_reason,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      color: item.color,
      size: item.size,
      unitPriceFcfa: item.unit_price_fcfa,
      quantity: item.quantity,
      lineTotalFcfa: item.line_total_fcfa,
    })),
  };
}

const placeholders = (count: number) => Array.from({ length: count }, () => "?").join(", ");

async function loadCatalog(db: D1Database, includeInactive: boolean) {
  const [categories, products, variants, images] = await Promise.all([
    db
      .prepare(
        `SELECT id, name, position, is_active FROM shop_categories
         ${includeInactive ? "" : "WHERE is_active = 1"} ORDER BY position, name`
      )
      .all<{ id: string; name: string; position: number; is_active: number }>(),
    db
      .prepare(
        `SELECT p.* FROM shop_products p
         LEFT JOIN shop_categories c ON c.id = p.category_id
         ${includeInactive ? "" : "WHERE p.is_active = 1 AND (p.category_id IS NULL OR c.is_active = 1)"}
         ORDER BY p.position, p.created_at DESC`
      )
      .all<ProductRow>(),
    db.prepare(`SELECT id, product_id, color, size, stock FROM shop_variants ORDER BY rowid`).all<VariantRow>(),
    db
      .prepare(`SELECT id, product_id FROM shop_product_images ORDER BY position, created_at`)
      .all<{ id: string; product_id: string }>(),
  ]);

  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const v of variants.results) {
    variantsByProduct.set(v.product_id, [...(variantsByProduct.get(v.product_id) || []), v]);
  }
  const imagesByProduct = new Map<string, string[]>();
  for (const image of images.results) {
    imagesByProduct.set(image.product_id, [...(imagesByProduct.get(image.product_id) || []), image.id]);
  }

  return {
    categories: categories.results,
    products: products.results.map((p) => ({
      row: p,
      variants: variantsByProduct.get(p.id) || [],
      images: imagesByProduct.get(p.id) || [],
    })),
  };
}

async function transitEnabled(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare(`SELECT value FROM business_settings WHERE key = 'shop_transit_delivery'`)
    .first<{ value: string }>();
  return row?.value !== "off";
}

interface DeliveryOption {
  id: string;
  method: "BOUTIQUE" | "TRANSIT";
  label: string;
  delay: string;
  priceFcfa: number;
}

/**
 * Les livraisons possibles pour un panier et une destination :
 * les zones de la boutique dans ce pays, puis chaque formule aérienne de Roum Transit
 * proposée depuis tous les pays de départ du panier, au poids.
 */
async function deliveryOptionsFor(
  db: D1Database,
  lines: Array<{ product: ProductRow; quantity: number }>,
  country: string,
  city: string
): Promise<DeliveryOption[]> {
  const options: DeliveryOption[] = [];

  const { results: zones } = await db
    .prepare(
      `SELECT id, name, price_fcfa, delay_text FROM shop_delivery_zones
       WHERE is_active = 1 AND LOWER(country) = LOWER(?) ORDER BY position, name`
    )
    .bind(country)
    .all<{ id: string; name: string; price_fcfa: number; delay_text: string }>();
  const cityKey = city.trim().toLowerCase();
  // La zone de la ville du client passe en premier.
  zones.sort((a, b) => Number(b.name.toLowerCase() === cityKey) - Number(a.name.toLowerCase() === cityKey));
  for (const zone of zones) {
    options.push({
      id: `zone:${zone.id}`,
      method: "BOUTIQUE",
      label: `Livraison Roum Boutique · ${zone.name}`,
      delay: zone.delay_text,
      priceFcfa: zone.price_fcfa,
    });
  }

  if (lines.length === 0 || !(await transitEnabled(db))) return options;

  const weightByOrigin = new Map<string, number>();
  for (const { product, quantity } of lines) {
    const weight = product.weight_kg && product.weight_kg > 0 ? product.weight_kg : DEFAULT_WEIGHT_KG;
    weightByOrigin.set(product.origin_country, (weightByOrigin.get(product.origin_country) || 0) + weight * quantity);
  }

  type ModeQuote = { label: string; price: number; daysMin: number; daysMax: number; origins: number };
  const modes = new Map<string, ModeQuote>();
  for (const [origin, weight] of weightByOrigin) {
    if (origin.toLowerCase() === country.toLowerCase()) continue;
    const { results: tariffs } = await db
      .prepare(
        `SELECT t.shipping_mode_id AS mode_id, COALESCE(t.category_tag, sm.name) AS label,
                t.price_per_unit_minor, COALESCE(t.minimum_charge_minor, 0) AS minimum_minor,
                COALESCE(t.estimated_days_min, 0) AS days_min, COALESCE(t.estimated_days_max, 0) AS days_max
         FROM tariffs t
         JOIN routes r ON r.id = t.route_id
         JOIN shipping_modes sm ON sm.id = t.shipping_mode_id
         WHERE r.is_active = 1 AND t.is_active = 1 AND sm.is_active = 1
           AND sm.type = 'AIR' AND sm.pricing_basis = 'PER_KG' AND UPPER(t.currency) = 'FCFA'
           AND LOWER(r.origin_country) = LOWER(?) AND LOWER(r.destination_country) = LOWER(?)
         ORDER BY t.price_per_unit_minor`
      )
      .bind(origin, country)
      .all<{
        mode_id: string;
        label: string;
        price_per_unit_minor: number;
        minimum_minor: number;
        days_min: number;
        days_max: number;
      }>();

    const seen = new Set<string>();
    for (const t of tariffs) {
      if (seen.has(t.mode_id)) continue;
      seen.add(t.mode_id);
      const price = Math.ceil(Math.max(t.minimum_minor, t.price_per_unit_minor * weight) / 100);
      const current = modes.get(t.mode_id);
      modes.set(t.mode_id, {
        label: current?.label || t.label,
        price: (current?.price || 0) + price,
        daysMin: Math.max(current?.daysMin || 0, t.days_min),
        daysMax: Math.max(current?.daysMax || 0, t.days_max),
        origins: (current?.origins || 0) + 1,
      });
    }
  }

  const originsToShip = [...weightByOrigin.keys()].filter((o) => o.toLowerCase() !== country.toLowerCase()).length;
  if (originsToShip === 0) return options;
  for (const [modeId, quote] of modes) {
    // Une formule n'est proposée que si elle couvre tous les pays de départ du panier.
    if (quote.origins !== originsToShip) continue;
    options.push({
      id: `transit:${modeId}`,
      method: "TRANSIT",
      // Les noms de la grille portent des émojis (✈️, ⚡) : on les retire du libellé de livraison.
      label: `Roum Transit · ${quote.label.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim()}`,
      delay: quote.daysMax ? `${quote.daysMin || quote.daysMax} à ${quote.daysMax} jours` : "",
      priceFcfa: quote.price,
    });
  }
  return options;
}

const cartItemsSchema = z
  .array(z.object({ variantId: z.string().min(1).max(80), quantity: z.number().int().min(1).max(50) }))
  .min(1)
  .max(50);

/** Regroupe les lignes d'un même article puis lit articles et stocks en base. */
async function loadCartLines(db: D1Database, items: Array<{ variantId: string; quantity: number }>) {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.variantId, (quantities.get(item.variantId) || 0) + item.quantity);
  const ids = [...quantities.keys()];
  const { results } = await db
    .prepare(
      `SELECT v.id AS variant_id, v.color, v.size, v.stock, p.*
       FROM shop_variants v JOIN shop_products p ON p.id = v.product_id
       LEFT JOIN shop_categories c ON c.id = p.category_id
       WHERE v.id IN (${placeholders(ids.length)}) AND p.is_active = 1 AND (p.category_id IS NULL OR c.is_active = 1)`
    )
    .bind(...ids)
    .all<ProductRow & { variant_id: string; color: string; size: string; stock: number }>();

  const byId = new Map(results.map((r) => [r.variant_id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  const lines = ids
    .filter((id) => byId.has(id))
    .map((id) => {
      const row = byId.get(id)!;
      return { product: row as ProductRow, variant: row, quantity: quantities.get(id)! };
    });
  return { lines, missing };
}

const unavailableMessage = (lines: Array<{ product: ProductRow; variant: { color: string; size: string; stock: number }; quantity: number }>) => {
  const short = lines.filter((l) => l.variant.stock < l.quantity);
  if (short.length === 0) return null;
  return short
    .map((l) => {
      const detail = [l.variant.color, l.variant.size].filter(Boolean).join(" · ");
      const left = Math.max(0, l.variant.stock);
      return `${l.product.name}${detail ? ` (${detail})` : ""} : ${left === 0 ? "rupture de stock" : `plus que ${left}`}`;
    })
    .join(" ; ");
};

// ============================================================================
// Côté client
// ============================================================================

shopPublicRouter.get("/catalog", async (c) => {
  const catalog = await loadCatalog(c.env.DB, false);
  const usedCategories = new Set(catalog.products.map((p) => p.row.category_id).filter(Boolean));

  // Pays proposés au client : ceux des zones de la boutique et ceux desservis par Roum Transit.
  const { results: zoneCountries } = await c.env.DB.prepare(
    `SELECT DISTINCT country FROM shop_delivery_zones WHERE is_active = 1`
  ).all<{ country: string }>();
  const origins = [...new Set(catalog.products.map((p) => p.row.origin_country))];
  let transitCountries: string[] = [];
  if (origins.length > 0 && (await transitEnabled(c.env.DB))) {
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT r.destination_country AS country
       FROM routes r JOIN tariffs t ON t.route_id = r.id JOIN shipping_modes sm ON sm.id = t.shipping_mode_id
       WHERE r.is_active = 1 AND t.is_active = 1 AND sm.type = 'AIR' AND sm.pricing_basis = 'PER_KG'
         AND r.origin_country IN (${placeholders(origins.length)})`
    )
      .bind(...origins)
      .all<{ country: string }>();
    transitCountries = results.map((r) => r.country);
  }
  const countries = [...new Set([...zoneCountries.map((z) => z.country), ...transitCountries])].sort((a, b) =>
    a.localeCompare(b, "fr")
  );

  c.header("Cache-Control", "no-store");
  return c.json({
    categories: catalog.categories
      .filter((cat) => usedCategories.has(cat.id))
      .map((cat) => ({ id: cat.id, name: cat.name })),
    products: catalog.products.map((p) => toPublicProduct(p.row, p.variants, p.images)),
    countries,
  });
});

shopPublicRouter.get("/images/:id", async (c) => {
  const image = await c.env.DB.prepare(`SELECT mime_type, data FROM shop_product_images WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<{ mime_type: string; data: string }>();
  if (!image) return c.json({ error: "Image introuvable." }, 404);
  const bytes = Uint8Array.from(atob(image.data), (char) => char.charCodeAt(0));
  return c.body(bytes, 200, {
    "Content-Type": image.mime_type,
    // Une photo remplacée reçoit un nouvel identifiant : celle-ci ne change jamais.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
});

const deliveryQuoteSchema = z.object({
  items: cartItemsSchema,
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().max(80).default(""),
});

shopPublicRouter.post("/delivery-options", zValidator("json", deliveryQuoteSchema), async (c) => {
  const { items, country, city } = c.req.valid("json");
  const { lines } = await loadCartLines(c.env.DB, items);
  const options = await deliveryOptionsFor(c.env.DB, lines, country, city);
  return c.json({ options });
});

const orderSchema = z.object({
  idempotencyKey: z.string().min(8).max(80),
  customer: z.object({
    name: z.string().trim().min(2, "Indiquez votre nom").max(120),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ().-]{6,24}$/, "Numéro WhatsApp invalide"),
    country: z.string().trim().min(2).max(60),
    city: z.string().trim().max(80).default(""),
    address: z.string().trim().max(300).default(""),
    note: z.string().trim().max(500).default(""),
  }),
  items: cartItemsSchema,
  deliveryOptionId: z.string().min(3).max(120),
});

shopPublicRouter.post("/orders", zValidator("json", orderSchema), async (c) => {
  const rateCheck = checkClientRateLimit(c, "shop-orders", 20, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop de commandes en peu de temps. Veuillez patienter quelques minutes." }, 429);
  }

  const body = c.req.valid("json");
  const db = c.env.DB;

  const findExisting = () =>
    db
      .prepare(`SELECT reference, access_key, total_fcfa FROM shop_orders WHERE idempotency_key = ?`)
      .bind(body.idempotencyKey)
      .first<{ reference: string; access_key: string; total_fcfa: number }>();
  const replay = (o: { reference: string; access_key: string; total_fcfa: number }) =>
    c.json({ reference: o.reference, accessKey: o.access_key, totalFcfa: o.total_fcfa });

  const existing = await findExisting();
  if (existing) return replay(existing);

  const { lines, missing } = await loadCartLines(db, body.items);
  if (missing.length > 0 || lines.length === 0) {
    return c.json({ error: "Un article de votre panier n'est plus en vente. Mettez votre panier à jour." }, 409);
  }
  const shortage = unavailableMessage(lines);
  if (shortage) return c.json({ error: `Stock insuffisant : ${shortage}.` }, 409);

  const options = await deliveryOptionsFor(db, lines, body.customer.country, body.customer.city);
  const delivery = options.find((o) => o.id === body.deliveryOptionId);
  if (!delivery) return c.json({ error: "Ce mode de livraison n'est pas disponible pour cette destination." }, 400);

  const itemsFcfa = lines.reduce((sum, l) => sum + effectivePrice(l.product) * l.quantity, 0);
  const orderId = crypto.randomUUID();
  const reference = `RB-${formatReferencePeriod(new Date())}-${generateReferenceSuffix()}`;
  const accessKey = newAccessKey();
  const { customer } = body;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO shop_orders (id, reference, access_key, idempotency_key, customer_name, customer_phone,
           country, city, address, note, delivery_method, delivery_label, delivery_fcfa, items_fcfa, total_fcfa)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        orderId,
        reference,
        accessKey,
        body.idempotencyKey,
        customer.name,
        customer.phone,
        customer.country,
        customer.city,
        customer.address,
        customer.note,
        delivery.method,
        [delivery.label, delivery.delay].filter(Boolean).join(" · "),
        delivery.priceFcfa,
        itemsFcfa,
        itemsFcfa + delivery.priceFcfa
      ),
  ];
  for (const line of lines) {
    const unit = effectivePrice(line.product);
    statements.push(
      db
        .prepare(
          `INSERT INTO shop_order_items (id, order_id, product_id, variant_id, product_name, color, size,
             unit_price_fcfa, quantity, line_total_fcfa)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          orderId,
          line.product.id,
          line.variant.variant_id,
          line.product.name,
          line.variant.color,
          line.variant.size,
          unit,
          line.quantity,
          unit * line.quantity
        ),
      // Le déclencheur refuse un stock négatif : la commande entière est alors annulée.
      db.prepare(`UPDATE shop_variants SET stock = stock - ? WHERE id = ?`).bind(line.quantity, line.variant.variant_id)
    );
  }

  try {
    await db.batch(statements);
  } catch (err) {
    const message = String(err);
    if (message.includes("STOCK_INSUFFISANT")) {
      const fresh = await loadCartLines(db, body.items);
      return c.json(
        { error: `Stock insuffisant : ${unavailableMessage(fresh.lines) || "un article vient d'être vendu"}.` },
        409
      );
    }
    if (message.includes("UNIQUE") && message.includes("idempotency_key")) {
      const again = await findExisting();
      if (again) return replay(again);
    }
    throw err;
  }

  return c.json({ reference, accessKey, totalFcfa: itemsFcfa + delivery.priceFcfa }, 201);
});

async function loadAuthorizedOrder(db: D1Database, reference: string, key: string | undefined) {
  if (!key) return null;
  const order = await db
    .prepare(`SELECT ${ORDER_COLUMNS} FROM shop_orders WHERE reference = ?`)
    .bind(reference.trim().toUpperCase())
    .first<OrderRow>();
  if (!order || !constantTimeCompare(order.access_key, key)) return null;
  return order;
}

const ORDER_ACCESS_ERROR = "Commande introuvable. Vérifiez le lien reçu après votre commande.";

shopPublicRouter.get("/orders/:reference", async (c) => {
  const rateCheck = checkClientRateLimit(c, "shop-order", 120, 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop de requêtes. Veuillez patienter quelques instants." }, 429);
  }
  const order = await loadAuthorizedOrder(c.env.DB, c.req.param("reference"), c.req.query("key"));
  if (!order) return c.json({ error: ORDER_ACCESS_ERROR }, 404);
  const { results: items } = await c.env.DB.prepare(`SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY rowid`)
    .bind(order.id)
    .all();
  c.header("Cache-Control", "no-store");
  return c.json({ order: toPublicOrder(order, items) });
});

const proofSchema = z.object({
  key: z.string().min(8).max(80),
  paymentMethod: z.string().trim().min(2).max(40),
  dataUrl: z.string().max(MAX_PROOF_CHARS, "Fichier trop lourd").regex(PROOF_DATA_URL, "Fichier invalide"),
});

shopPublicRouter.post("/orders/:reference/proof", zValidator("json", proofSchema), async (c) => {
  const rateCheck = checkClientRateLimit(c, "shop-proof", 20, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop d'envois. Veuillez patienter quelques minutes." }, 429);
  }
  const { key, paymentMethod, dataUrl } = c.req.valid("json");
  const order = await loadAuthorizedOrder(c.env.DB, c.req.param("reference"), key);
  if (!order) return c.json({ error: ORDER_ACCESS_ERROR }, 404);
  if (order.status !== "AWAITING_PAYMENT" && order.status !== "PROOF_SENT") {
    return c.json({ error: "Cette commande n'attend plus de preuve de paiement." }, 409);
  }

  const comma = dataUrl.indexOf(",");
  const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
  await c.env.DB.prepare(
    `UPDATE shop_orders SET status = 'PROOF_SENT', payment_method = ?, proof_mime = ?, proof_data = ?,
       proof_sent_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ? AND status IN ('AWAITING_PAYMENT', 'PROOF_SENT')`
  )
    .bind(paymentMethod, mime, dataUrl.slice(comma + 1), order.id)
    .run();

  return c.json({ success: true, status: "PROOF_SENT", statusLabel: STATUS_LABELS.PROOF_SENT });
});

// ============================================================================
// Côté admin (monté sous /api/admin/shop, après la vérification de session)
// ============================================================================

shopAdminRouter.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user?.isSuperAdmin && !user?.permissions.includes("*") && !user?.permissions.includes("settings.manage")) {
    return c.json({ error: "Permission insuffisante pour gérer la boutique." }, 403);
  }
  await next();
});

shopAdminRouter.get("/catalog", async (c) => {
  const catalog = await loadCatalog(c.env.DB, true);
  const { results: zones } = await c.env.DB.prepare(
    `SELECT id, name, country, price_fcfa, delay_text, position, is_active FROM shop_delivery_zones ORDER BY position, name`
  ).all();
  c.header("Cache-Control", "no-store");
  return c.json({
    categories: catalog.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      position: cat.position,
      isActive: cat.is_active === 1,
    })),
    products: catalog.products.map((p) => ({
      ...toPublicProduct(p.row, p.variants, p.images),
      promoPriceFcfa: p.row.promo_price_fcfa,
      promoEndsAt: p.row.promo_ends_at,
      promoActive: promoIsActive(p.row),
      weightKg: p.row.weight_kg,
      isActive: p.row.is_active === 1,
      position: p.row.position,
    })),
    zones: (zones as any[]).map((z) => ({
      id: z.id,
      name: z.name,
      country: z.country,
      priceFcfa: z.price_fcfa,
      delay: z.delay_text,
      position: z.position,
      isActive: z.is_active === 1,
    })),
    transitDelivery: await transitEnabled(c.env.DB),
  });
});

// ---------- Catégories ----------

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(60),
  position: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

shopAdminRouter.post("/categories", zValidator("json", categorySchema), async (c) => {
  const body = c.req.valid("json");
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO shop_categories (id, name, position, is_active) VALUES (?, ?, ?, ?)`)
    .bind(id, body.name, body.position ?? 0, body.isActive === false ? 0 : 1)
    .run();
  return c.json({ id }, 201);
});

shopAdminRouter.put("/categories/:id", zValidator("json", categorySchema), async (c) => {
  const body = c.req.valid("json");
  const result = await c.env.DB.prepare(
    `UPDATE shop_categories SET name = ?, position = COALESCE(?, position), is_active = COALESCE(?, is_active) WHERE id = ?`
  )
    .bind(body.name, body.position ?? null, body.isActive === undefined ? null : body.isActive ? 1 : 0, c.req.param("id"))
    .run();
  if (!result.meta.changes) return c.json({ error: "Catégorie introuvable." }, 404);
  return c.json({ success: true });
});

shopAdminRouter.delete("/categories/:id", async (c) => {
  // Les articles de la catégorie restent en vente, sans catégorie.
  await c.env.DB.prepare(`DELETE FROM shop_categories WHERE id = ?`).bind(c.req.param("id")).run();
  return c.json({ success: true });
});

// ---------- Articles et stock ----------

const productSchema = z
  .object({
    name: z.string().trim().min(1, "Nom requis").max(120),
    description: z.string().trim().max(4000).default(""),
    categoryId: z.string().max(80).nullable().default(null),
    priceFcfa: z.number().int().min(0).max(100_000_000),
    promoPriceFcfa: z.number().int().min(0).max(100_000_000).nullable().default(null),
    promoEndsAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin de promotion invalide")
      .nullable()
      .default(null),
    originCountry: z.string().trim().min(2).max(60).default("Côte d'Ivoire"),
    weightKg: z.number().min(0).max(1000).nullable().default(null),
    isActive: z.boolean().default(true),
    position: z.number().int().min(0).max(100_000).default(0),
    variants: z
      .array(
        z.object({
          color: z.string().trim().max(40).default(""),
          size: z.string().trim().max(20).default(""),
          stock: z.number().int().min(0).max(1_000_000),
        })
      )
      .max(400)
      .default([]),
  })
  .refine((p) => p.promoPriceFcfa === null || p.promoPriceFcfa < p.priceFcfa, {
    message: "Le prix promo doit être plus bas que le prix normal.",
    path: ["promoPriceFcfa"],
  })
  .refine(
    (p) => new Set(p.variants.map((v) => `${v.color.toLowerCase()}|${v.size.toLowerCase()}`)).size === p.variants.length,
    { message: "Une même taille et couleur apparaît deux fois.", path: ["variants"] }
  );

type ProductInput = z.infer<typeof productSchema>;

/** Remplace les tailles et couleurs d'un article : les absentes disparaissent, les autres gardent leur identifiant. */
function variantStatements(db: D1Database, productId: string, input: ProductInput): D1PreparedStatement[] {
  const variants = input.variants.length > 0 ? input.variants : [{ color: "", size: "", stock: 0 }];
  const statements = variants.map((v) =>
    db
      .prepare(
        `INSERT INTO shop_variants (id, product_id, color, size, stock) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(product_id, color, size) DO UPDATE SET stock = excluded.stock`
      )
      .bind(crypto.randomUUID(), productId, v.color, v.size, v.stock)
  );
  const keys = variants.map((v) => `${v.color}|${v.size}`);
  statements.push(
    db
      .prepare(
        `DELETE FROM shop_variants WHERE product_id = ? AND (color || '|' || size) NOT IN (${placeholders(keys.length)})`
      )
      .bind(productId, ...keys)
  );
  return statements;
}

shopAdminRouter.post("/products", zValidator("json", productSchema), async (c) => {
  const body = c.req.valid("json");
  const id = crypto.randomUUID();
  const db = c.env.DB;
  await db.batch([
    db
      .prepare(
        `INSERT INTO shop_products (id, category_id, name, description, price_fcfa, promo_price_fcfa, promo_ends_at,
           origin_country, weight_kg, is_active, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.categoryId,
        body.name,
        body.description,
        body.priceFcfa,
        body.promoPriceFcfa,
        body.promoEndsAt,
        body.originCountry,
        body.weightKg,
        body.isActive ? 1 : 0,
        body.position
      ),
    ...variantStatements(db, id, body),
  ]);
  return c.json({ id }, 201);
});

shopAdminRouter.put("/products/:id", zValidator("json", productSchema), async (c) => {
  const body = c.req.valid("json");
  const id = c.req.param("id");
  const db = c.env.DB;
  const exists = await db.prepare(`SELECT id FROM shop_products WHERE id = ?`).bind(id).first();
  if (!exists) return c.json({ error: "Article introuvable." }, 404);
  await db.batch([
    db
      .prepare(
        `UPDATE shop_products SET category_id = ?, name = ?, description = ?, price_fcfa = ?, promo_price_fcfa = ?,
           promo_ends_at = ?, origin_country = ?, weight_kg = ?, is_active = ?, position = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        body.categoryId,
        body.name,
        body.description,
        body.priceFcfa,
        body.promoPriceFcfa,
        body.promoEndsAt,
        body.originCountry,
        body.weightKg,
        body.isActive ? 1 : 0,
        body.position,
        id
      ),
    ...variantStatements(db, id, body),
  ]);
  return c.json({ success: true });
});

shopAdminRouter.delete("/products/:id", async (c) => {
  // Les commandes gardent le nom et le prix de l'article : la suppression ne les touche pas.
  await c.env.DB.prepare(`DELETE FROM shop_products WHERE id = ?`).bind(c.req.param("id")).run();
  return c.json({ success: true });
});

const imageSchema = z.object({
  dataUrl: z.string().max(MAX_IMAGE_CHARS, "Photo trop lourde").regex(IMAGE_DATA_URL, "Photo invalide"),
});

shopAdminRouter.post("/products/:id/images", zValidator("json", imageSchema), async (c) => {
  const productId = c.req.param("id");
  const db = c.env.DB;
  const info = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM shop_product_images WHERE product_id = ?) AS count,
              (SELECT COALESCE(MAX(position), -1) FROM shop_product_images WHERE product_id = ?) AS last,
              (SELECT COUNT(*) FROM shop_products WHERE id = ?) AS product`
    )
    .bind(productId, productId, productId)
    .first<{ count: number; last: number; product: number }>();
  if (!info?.product) return c.json({ error: "Article introuvable." }, 404);
  if (info.count >= MAX_IMAGES_PER_PRODUCT) {
    return c.json({ error: `${MAX_IMAGES_PER_PRODUCT} photos au maximum par article.` }, 400);
  }
  const { dataUrl } = c.req.valid("json");
  const id = crypto.randomUUID();
  await db
    .prepare(`INSERT INTO shop_product_images (id, product_id, mime_type, data, position) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, productId, dataUrl.slice(5, dataUrl.indexOf(";")), dataUrl.slice(dataUrl.indexOf(",") + 1), info.last + 1)
    .run();
  return c.json({ id }, 201);
});

shopAdminRouter.post("/products/:id/images/:imageId/cover", async (c) => {
  const productId = c.req.param("id");
  const result = await c.env.DB.prepare(
    `UPDATE shop_product_images
     SET position = (SELECT COALESCE(MIN(position), 0) - 1 FROM shop_product_images WHERE product_id = ?)
     WHERE id = ? AND product_id = ?`
  )
    .bind(productId, c.req.param("imageId"), productId)
    .run();
  if (!result.meta.changes) return c.json({ error: "Photo introuvable." }, 404);
  // La photo de couverture change l'ordre : on prévient les pages client.
  await c.env.DB.prepare(`UPDATE shop_products SET updated_at = datetime('now') WHERE id = ?`).bind(productId).run();
  return c.json({ success: true });
});

shopAdminRouter.delete("/products/:id/images/:imageId", async (c) => {
  await c.env.DB.prepare(`DELETE FROM shop_product_images WHERE id = ? AND product_id = ?`)
    .bind(c.req.param("imageId"), c.req.param("id"))
    .run();
  return c.json({ success: true });
});

// ---------- Zones de livraison ----------

const zoneSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  country: z.string().trim().min(2, "Pays requis").max(60),
  priceFcfa: z.number().int().min(0).max(10_000_000),
  delay: z.string().trim().max(60).default(""),
  position: z.number().int().min(0).max(10_000).default(0),
  isActive: z.boolean().default(true),
});

shopAdminRouter.post("/zones", zValidator("json", zoneSchema), async (c) => {
  const z = c.req.valid("json");
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO shop_delivery_zones (id, name, country, price_fcfa, delay_text, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, z.name, z.country, z.priceFcfa, z.delay, z.position, z.isActive ? 1 : 0)
    .run();
  return c.json({ id }, 201);
});

shopAdminRouter.put("/zones/:id", zValidator("json", zoneSchema), async (c) => {
  const z = c.req.valid("json");
  const result = await c.env.DB.prepare(
    `UPDATE shop_delivery_zones SET name = ?, country = ?, price_fcfa = ?, delay_text = ?, position = ?, is_active = ? WHERE id = ?`
  )
    .bind(z.name, z.country, z.priceFcfa, z.delay, z.position, z.isActive ? 1 : 0, c.req.param("id"))
    .run();
  if (!result.meta.changes) return c.json({ error: "Zone introuvable." }, 404);
  return c.json({ success: true });
});

shopAdminRouter.delete("/zones/:id", async (c) => {
  await c.env.DB.prepare(`DELETE FROM shop_delivery_zones WHERE id = ?`).bind(c.req.param("id")).run();
  return c.json({ success: true });
});

// ---------- Commandes ----------

shopAdminRouter.get("/orders", async (c) => {
  const status = c.req.query("status");
  const filter = status && (SHOP_ORDER_STATUSES as readonly string[]).includes(status) ? status : null;
  const { results: orders } = await c.env.DB.prepare(
    `SELECT ${ORDER_COLUMNS} FROM shop_orders ${filter ? "WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 300`
  )
    .bind(...(filter ? [filter] : []))
    .all<OrderRow>();

  const ids = orders.map((o) => o.id);
  const itemsByOrder = new Map<string, any[]>();
  if (ids.length > 0) {
    const { results: items } = await c.env.DB.prepare(
      `SELECT * FROM shop_order_items WHERE order_id IN (${placeholders(ids.length)}) ORDER BY rowid`
    )
      .bind(...ids)
      .all<any>();
    for (const item of items) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) || []), item]);
  }

  const { results: counts } = await c.env.DB.prepare(
    `SELECT status, COUNT(*) AS count, SUM(total_fcfa) AS total FROM shop_orders GROUP BY status`
  ).all<{ status: OrderStatus; count: number; total: number }>();

  c.header("Cache-Control", "no-store");
  return c.json({
    // La clé permet à la gérante d'envoyer au client le lien de sa commande.
    orders: orders.map((o) => ({
      id: o.id,
      ...toPublicOrder(o, itemsByOrder.get(o.id) || []),
      accessKey: o.access_key,
      proofMime: o.proof_mime,
    })),
    counts: Object.fromEntries(counts.map((r) => [r.status, r.count])),
    revenueFcfa: counts
      .filter((r) => r.status === "CONFIRMED" || r.status === "SHIPPED" || r.status === "DELIVERED")
      .reduce((sum, r) => sum + (r.total || 0), 0),
  });
});

shopAdminRouter.get("/orders/:id/proof", async (c) => {
  const proof = await c.env.DB.prepare(`SELECT proof_mime, proof_data FROM shop_orders WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<{ proof_mime: string | null; proof_data: string | null }>();
  if (!proof?.proof_mime || !proof.proof_data) return c.json({ error: "Aucune preuve de paiement." }, 404);
  const bytes = Uint8Array.from(atob(proof.proof_data), (char) => char.charCodeAt(0));
  return c.body(bytes, 200, {
    "Content-Type": proof.proof_mime,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
});

const statusSchema = z.object({
  status: z.enum(SHOP_ORDER_STATUSES),
  trackingNumber: z.string().trim().max(60).optional(),
  reason: z.string().trim().max(300).optional(),
});

shopAdminRouter.post("/orders/:id/status", zValidator("json", statusSchema), async (c) => {
  const { status, trackingNumber, reason } = c.req.valid("json");
  const db = c.env.DB;
  const id = c.req.param("id");
  const order = await db.prepare(`SELECT ${ORDER_COLUMNS} FROM shop_orders WHERE id = ?`).bind(id).first<OrderRow>();
  if (!order) return c.json({ error: "Commande introuvable." }, 404);
  if (!NEXT_STATUSES[order.status].includes(status)) {
    return c.json(
      { error: `Impossible de passer de « ${STATUS_LABELS[order.status]} » à « ${STATUS_LABELS[status]} ».` },
      409
    );
  }

  // Marque unique : le stock n'est rendu que si cette annulation-ci a bien été enregistrée.
  const stamp = `${new Date().toISOString()}#${crypto.randomUUID().slice(0, 8)}`;
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE shop_orders SET status = ?, updated_at = ?,
           tracking_number = COALESCE(?, tracking_number),
           cancel_reason = CASE WHEN ? = 'CANCELLED' THEN ? ELSE cancel_reason END
         WHERE id = ? AND status = ?`
      )
      .bind(status, stamp, trackingNumber || null, status, reason || null, id, order.status),
  ];

  if (status === "CANCELLED") {
    const { results: items } = await db
      .prepare(`SELECT variant_id, quantity FROM shop_order_items WHERE order_id = ? AND variant_id IS NOT NULL`)
      .bind(id)
      .all<{ variant_id: string; quantity: number }>();
    for (const item of items) {
      statements.push(
        db
          .prepare(
            `UPDATE shop_variants SET stock = stock + ?
             WHERE id = ? AND EXISTS (SELECT 1 FROM shop_orders WHERE id = ? AND updated_at = ?)`
          )
          .bind(item.quantity, item.variant_id, id, stamp)
      );
    }
  }

  const results = await db.batch(statements);
  if (!results[0].meta.changes) {
    return c.json({ error: "La commande vient de changer : rechargez la page." }, 409);
  }
  return c.json({ success: true, status, statusLabel: STATUS_LABELS[status] });
});
