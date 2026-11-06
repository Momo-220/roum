import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  normalizeTrackingNumber,
  buildWhatsAppUrl,
} from "../shared";
import { checkRateLimit, constantTimeCompare } from "../crypto";
import {
  newAccessKey,
  newRequestReference,
  parseMeta,
  pickClientMetadata,
  requestPrefix,
  toPublicDossier,
} from "../requests";
import type { Env } from "../types";

export const publicRouter = new Hono<{ Bindings: Env }>();

const FALLBACK_SUPPORT_PHONE = "+2250153638569";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Règlement en attente",
  PARTIAL: "Acompte reçu",
  PAID: "Intégralement réglé",
  ON_DELIVERY: "Paiement à la livraison",
};

const DOSSIER_STATUS_VIEWS: Record<string, { code: string; label: string; description: string }> = {
  NEW: { code: "DRAFT", label: "Dossier enregistré chez ROUM TRANSIT", description: "Votre dossier est en cours de traitement par notre équipe." },
  IN_REVIEW: { code: "DRAFT", label: "Dossier en cours de vérification", description: "Notre équipe vérifie votre dossier et votre règlement." },
  QUOTE_SENT: { code: "DRAFT", label: "Devis envoyé", description: "Votre devis est prêt : ouvrez le lien reçu sur WhatsApp pour le régler." },
  CONVERTED: { code: "DRAFT", label: "Dossier validé", description: "Votre dossier est validé par notre équipe." },
  CLOSED: { code: "DRAFT", label: "Dossier clôturé", description: "Ce dossier est clôturé." },
  CANCELLED: { code: "CANCELLED", label: "Dossier annulé", description: "Ce dossier a été annulé." },
};

function clientIpOf(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "local-ip"
  );
}

/** Numéro WhatsApp réellement configuré par l'administration. */
async function resolveSupportPhone(db: D1Database): Promise<string> {
  const row = await db.prepare(`
    SELECT value FROM business_settings
    WHERE key IN ('whatsapp_support', 'whatsapp_official_number') AND value != ''
    ORDER BY CASE key WHEN 'whatsapp_official_number' THEN 0 ELSE 1 END
    LIMIT 1
  `).first<{ value: string }>();
  return row?.value || FALLBACK_SUPPORT_PHONE;
}

function safeWhatsAppUrl(phone: string, message: string): string {
  try {
    return buildWhatsAppUrl(phone, message);
  } catch {
    return buildWhatsAppUrl(FALLBACK_SUPPORT_PHONE, message);
  }
}

/**
 * 0. Compteurs de synchronisation publics.
 * Incrémentés par des triggers SQL : ils changent dès qu'une donnée change, quelle qu'en soit l'origine.
 * Les pages client les interrogent toutes les quelques secondes et ne rechargent que si besoin.
 */
publicRouter.get("/sync", async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT scope, version FROM sync_versions WHERE scope IN ('tariffs', 'settings', 'requests', 'shipments')
  `).all<{ scope: string; version: number }>();

  c.header("Cache-Control", "no-store");
  return c.json({ versions: Object.fromEntries(results.map((r) => [r.scope, r.version])) });
});

/**
 * 1. Suivi public d'une expédition par son numéro de suivi (tracking number)
 * Accès direct et public sans mot de passe requis (avec anti-énumération et sans PII client).
 */
publicRouter.get("/tracking/:trackingNumber", async (c) => {
  const clientIp = clientIpOf(c);
  const rateCheck = checkRateLimit(`tracking:${clientIp}`, 60, 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json(
      { error: "Trop de requêtes de suivi. Veuillez patienter quelques instants." },
      429
    );
  }

  const rawNumber = c.req.param("trackingNumber");
  const normalized = normalizeTrackingNumber(rawNumber);

  if (!normalized) {
    return c.json(
      { error: "Numéro de suivi invalide. Format attendu : RM-[MODE]-[AAMM]-[SUFFIXE]." },
      400
    );
  }

  // Requête du dossier d'expédition (sans exposer ni charger le nom/téléphone du client)
  const shipment = await c.env.DB.prepare(`
    SELECT 
      s.id,
      s.tracking_number,
      s.current_status,
      st.label_public as status_label,
      st.description as status_description,
      s.payment_status,
      s.total_parcels_count,
      s.total_weight_kg,
      s.total_volume_cbm,
      s.created_at,
      s.updated_at,
      r.origin_country,
      r.origin_city,
      r.destination_country,
      r.destination_city,
      sm.name as shipping_mode_name,
      sm.type as shipping_mode_type
    FROM shipments s
    JOIN shipment_statuses st ON s.current_status = st.code
    JOIN routes r ON s.route_id = r.id
    JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
    WHERE UPPER(s.tracking_number) = UPPER(?)
  `).bind(normalized).first();

  if (!shipment) {
    // Une référence de dossier (RM-ALI-...) reçoit un état d'avancement, sans aucune donnée personnelle.
    const dossier = await c.env.DB.prepare(`
      SELECT reference, status, origin_country, destination_country, tracking_number, created_at, updated_at
      FROM customer_requests WHERE UPPER(reference) = UPPER(?) LIMIT 1
    `).bind(normalized).first<any>();

    if (!dossier) {
      return c.json({ error: "Aucun colis trouvé pour ce numéro de suivi." }, 404);
    }
    if (dossier.tracking_number) {
      return c.json({ redirect_tracking_number: dossier.tracking_number });
    }

    const supportPhone = await resolveSupportPhone(c.env.DB);
    return c.json({
      tracking_number: dossier.reference,
      status: DOSSIER_STATUS_VIEWS[String(dossier.status)] || DOSSIER_STATUS_VIEWS.NEW,
      route: { origin: dossier.origin_country || "", destination: dossier.destination_country || "" },
      shipping_mode: "À confirmer",
      summary: {
        total_parcels: 1,
        total_weight_kg: 0,
        total_volume_cbm: 0,
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
      },
      parcels: [],
      timeline: [],
      whatsapp_support_url: safeWhatsAppUrl(
        supportPhone,
        `Bonjour ROUM TRANSIT, je souhaite des informations sur mon dossier n° ${dossier.reference}.`
      ),
    });
  }

  // Historique des étapes de suivi (timeline)
  const { results: timeline } = await c.env.DB.prepare(`
    SELECT 
      te.status,
      st.label_public as status_label,
      te.location,
      te.comment,
      te.event_timestamp
    FROM tracking_events te
    JOIN shipment_statuses st ON te.status = st.code
    WHERE te.shipment_id = ?
    ORDER BY te.event_timestamp ASC
  `).bind(shipment.id).all();

  // Colis individuels
  const { results: parcels } = await c.env.DB.prepare(`
    SELECT 
      parcel_index,
      package_label,
      weight_kg,
      volume_cbm,
      description
    FROM parcels
    WHERE shipment_id = ?
    ORDER BY parcel_index ASC
  `).bind(shipment.id).all();

  // Lien WhatsApp d'assistance pré-rempli pour le client
  const supportPhone = await resolveSupportPhone(c.env.DB);
  const waMessage = `Bonjour ROUM TRANSIT, je souhaite des informations sur mon colis n° ${normalized} (${shipment.origin_country} -> ${shipment.destination_country}).`;
  const whatsappUrl = safeWhatsAppUrl(supportPhone, waMessage);

  return c.json({
    tracking_number: shipment.tracking_number,
    status: {
      code: shipment.current_status,
      label: shipment.status_label,
      description: shipment.status_description,
    },
    payment: {
      status: shipment.payment_status,
      label: PAYMENT_STATUS_LABELS[String(shipment.payment_status)] || "Règlement en attente",
    },
    route: {
      origin: `${shipment.origin_city ? shipment.origin_city + ", " : ""}${shipment.origin_country}`,
      destination: `${shipment.destination_city ? shipment.destination_city + ", " : ""}${shipment.destination_country}`,
    },
    shipping_mode: shipment.shipping_mode_name,
    summary: {
      total_parcels: shipment.total_parcels_count,
      total_weight_kg: shipment.total_weight_kg,
      total_volume_cbm: shipment.total_volume_cbm,
      created_at: shipment.created_at,
      updated_at: shipment.updated_at,
    },
    parcels,
    timeline,
    whatsapp_support_url: whatsappUrl,
  });
});

/**
 * 2. Consultation des tarifs et routes actifs pour le simulateur client
 */
publicRouter.get("/tariffs", async (c) => {
  const { results: routes } = await c.env.DB.prepare(`
    SELECT 
      r.id as route_id,
      r.origin_country,
      r.origin_city,
      r.destination_country,
      r.destination_city,
      t.id as tariff_id,
      t.id as id,
      t.currency,
      t.price_per_unit_minor,
      t.minimum_charge_minor,
      t.estimated_days_min,
      t.estimated_days_max,
      t.category_tag,
      t.note,
      COALESCE(sm.id, t.shipping_mode_id, 'mode-standard') as mode_id,
      COALESCE(t.category_tag, sm.name, 'Transport Standard') as mode_name,
      COALESCE(t.category_tag, sm.name, 'Transport Standard') as shipping_mode_name,
      COALESCE(t.category_tag, sm.name, 'Transport Standard') as service_name,
      COALESCE(sm.type, 'AIR') as mode_type,
      COALESCE(sm.type, 'AIR') as shipping_mode_type,
      COALESCE(sm.pricing_basis, 'PER_KG') as pricing_basis
    FROM routes r
    JOIN tariffs t ON r.id = t.route_id
    LEFT JOIN shipping_modes sm ON t.shipping_mode_id = sm.id
    WHERE r.is_active = 1 AND t.is_active = 1
    ORDER BY r.origin_country, r.destination_country, t.id
  `).all();

  return c.json({ tariffs: routes });
});

/**
 * 2b. Consultation publique des coordonnées de paiement et paramètres de l'entreprise
 * configurés par l'administration dans business_settings
 */
publicRouter.get("/settings", async (c) => {
  const { results: settings } = await c.env.DB.prepare(
    `SELECT key, value FROM business_settings`
  ).all();

  const publicMap: Record<string, string> = {};
  const allowedKeys = new Set([
    "company_name",
    "company_tagline",
    "company_headquarters",
    "company_email",
    "whatsapp_official_number",
    "whatsapp_support",
    "phone_secondary",
    "payment_wave_ci",
    "payment_wave_name",
    "payment_wave_merchant",
    "payment_orange_money_ci",
    "payment_orange_name",
    "payment_morocco_bank",
    "payment_morocco_holder",
    "payment_morocco_rib",
    "payment_morocco_whatsapp",
    "payment_mtn_momo_ci",
    "payment_mtn_name",
    "payment_moov_money",
    "payment_bank_name",
    "payment_bank_account_holder",
    "payment_bank_rib",
    "payment_bank_swift",
    "payment_cash_desks",
    "payment_receipt_terms",
    "warehouse_china_address",
    "warehouse_china_contact",
    "warehouse_china_shipping_mark",
    "warehouse_dubai_address",
    "warehouse_dubai_contact",
    "agency_paris_address",
    "agency_paris_contact",
    "hub_casablanca_address",
    "custom_hubs_json",
  ]);

  for (const s of (settings as any[]) || []) {
    if (allowedKeys.has(s.key)) {
      publicMap[s.key] = s.value;
    }
  }

  return c.json({ settings: publicMap });
});

const MAX_PRODUCT_IMAGE_CHARS = 900_000;
const MAX_PROOF_BYTES = 15 * 1024 * 1024;
const PROOF_CHUNK_CHARS = 900_000;

const quoteRequestSchema = z.object({
  idempotency_key: z.string().uuid("Clé d'envoi invalide"),
  service_type: z.enum(["ALIBABA", "FORWARDING", "DUBAI", "MAROC", "FRANCE", "GENERAL"]).optional().default("GENERAL"),
  client_name: z.string().trim().min(2, "Le nom est requis").max(120),
  client_phone: z.string().trim().min(3, "Numéro WhatsApp requis").max(60),
  client_email: z.string().email("Email invalide").max(160).optional().or(z.literal("")),
  origin_country: z.string().trim().min(2, "Pays d'origine requis").max(80),
  destination_country: z.string().trim().min(2, "Pays de destination requis").max(80),
  shipping_mode_id: z.string().max(64).optional(),
  estimated_weight_kg: z.number().positive().max(1_000_000).optional(),
  estimated_cbm: z.number().positive().max(10_000).optional(),
  cargo_type: z.string().max(2000).optional(),
  product_url: z.string().max(2000).optional(),
  product_quantity: z.string().max(200).optional(),
  product_specs: z.string().max(2000).optional(),
  supplier_info: z.string().max(1000).optional(),
  shipping_mark: z.string().trim().max(200).optional(),
  metadata: z
    .object({ product_image: z.string().max(MAX_PRODUCT_IMAGE_CHARS, "Image trop volumineuse").optional() })
    .catchall(z.unknown())
    .optional(),
});

async function dossierResponse(c: { env: Env }, row: any) {
  const supportPhone = await resolveSupportPhone(c.env.DB);
  return {
    success: true,
    quote_reference: row.reference,
    access_key: row.access_key,
    shipping_mark: row.shipping_mark,
    whatsapp_url: safeWhatsAppUrl(
      supportPhone,
      `Bonjour ROUM TRANSIT, je viens d'enregistrer le dossier n° ${row.reference} (${row.origin_country} -> ${row.destination_country}).`
    ),
  };
}

/**
 * 3. Enregistrement d'une demande client.
 * L'écriture est atomique et rejouable : le même `idempotency_key` renvoie toujours le même dossier,
 * et une réponse de succès garantit que le dossier est bien en base.
 */
publicRouter.post("/quotes", zValidator("json", quoteRequestSchema), async (c) => {
  const rateCheck = checkRateLimit(`quotes:${clientIpOf(c)}`, 30, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json(
      { error: "Trop de demandes envoyées récemment. Veuillez patienter quelques minutes." },
      429
    );
  }

  const data = c.req.valid("json");

  const previous = await c.env.DB.prepare(
    `SELECT * FROM customer_requests WHERE idempotency_key = ? LIMIT 1`
  ).bind(data.idempotency_key).first<any>();
  if (previous) {
    return c.json(await dossierResponse(c, previous));
  }

  const meta = pickClientMetadata({
    ...(data.metadata || {}),
    product_url: data.product_url || data.metadata?.product_url,
    product_quantity: data.product_quantity || data.metadata?.product_quantity,
  });

  const reqType =
    data.service_type === "ALIBABA"
      ? "ALIBABA"
      : data.service_type === "GENERAL"
        ? "PARCEL_SHIPPING"
        : "SUPPLIER_TRANSIT";

  let knownModeId: string | null = null;
  if (data.shipping_mode_id) {
    const mode = await c.env.DB.prepare(`SELECT id FROM shipping_modes WHERE id = ?`)
      .bind(data.shipping_mode_id)
      .first<{ id: string }>();
    knownModeId = mode?.id || null;
  }

  const description =
    data.cargo_type ||
    (data.service_type === "ALIBABA"
      ? `Achat Alibaba | Qté: ${data.product_quantity || "1"} | Spécifications: ${data.product_specs || "Standard"}`
      : `Transit Fournisseur | Fournisseur: ${data.supplier_info || "Non précisé"}`);

  const prefix = requestPrefix(data.service_type, String(meta.option_type || ""));

  // Une collision de référence reste possible : on réessaie plutôt que d'écraser un dossier existant.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID();
    const reference = newRequestReference(prefix);
    const accessKey = newAccessKey();
    const shippingMark = data.shipping_mark || `ROUM / ${reference} / ${data.client_name.toUpperCase()}`;

    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare(`
        INSERT INTO customer_requests (
          id, reference, client_name, client_phone, client_email,
          request_type, origin_country, destination_country, shipping_mode_id,
          description, estimated_weight_kg, estimated_cbm, supplier_name,
          shipping_mark, status, metadata_json, access_key, idempotency_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?)
      `).bind(
        id,
        reference,
        data.client_name,
        data.client_phone,
        data.client_email || null,
        reqType,
        data.origin_country,
        data.destination_country,
        knownModeId,
        description,
        data.estimated_weight_kg || null,
        data.estimated_cbm || null,
        data.supplier_info || null,
        shippingMark,
        JSON.stringify(meta),
        accessKey,
        data.idempotency_key
      ),
    ];

    const productName = typeof meta.product_name === "string" ? meta.product_name : null;
    if (productName || data.product_url || data.product_specs) {
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO request_items (
            id, request_id, item_index, product_name, product_url, quantity, variants_description
          ) VALUES (?, ?, 1, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          id,
          productName || data.product_specs || "Article",
          data.product_url || null,
          parseInt(data.product_quantity || "1", 10) || 1,
          data.product_specs || null
        )
      );
    }

    try {
      await c.env.DB.batch(statements);
      const created = await c.env.DB.prepare(`SELECT * FROM customer_requests WHERE id = ?`).bind(id).first<any>();
      return c.json(await dossierResponse(c, created), 201);
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.includes("idempotency_key")) {
        const winner = await c.env.DB.prepare(
          `SELECT * FROM customer_requests WHERE idempotency_key = ? LIMIT 1`
        ).bind(data.idempotency_key).first<any>();
        if (winner) return c.json(await dossierResponse(c, winner));
      }
      if (!message.includes("customer_requests.reference")) throw err;
    }
  }

  return c.json({ error: "Impossible de créer le dossier. Veuillez réessayer." }, 503);
});

/** Charge un dossier uniquement si la clé d'accès secrète est correcte. */
async function loadAuthorizedDossier(c: any, reference: string, key: string | undefined) {
  const row = await c.env.DB.prepare(
    `SELECT * FROM customer_requests WHERE UPPER(reference) = UPPER(?) LIMIT 1`
  ).bind(reference).first();
  if (!row || !key || !row.access_key || !constantTimeCompare(String(row.access_key), key)) return null;
  return row as any;
}

const DOSSIER_ACCESS_ERROR =
  "Dossier introuvable ou lien incomplet. Demandez à ROUM TRANSIT de vous renvoyer votre lien de paiement.";

/**
 * 4. Consultation d'un dossier par son propriétaire (lien de paiement `?pay=REF&key=...`).
 */
publicRouter.get("/requests/:reference", async (c) => {
  const rateCheck = checkRateLimit(`dossier:${clientIpOf(c)}`, 120, 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop de requêtes. Veuillez patienter quelques instants." }, 429);
  }

  const ref = (c.req.param("reference") || "").trim();
  const row = await loadAuthorizedDossier(c, ref, c.req.query("key"));
  if (!row) return c.json({ error: DOSSIER_ACCESS_ERROR }, 404);

  const { results: items } = await c.env.DB.prepare(
    `SELECT * FROM request_items WHERE request_id = ? ORDER BY item_index ASC`
  ).bind(row.id).all();

  c.header("Cache-Control", "no-store");
  return c.json({ request: toPublicDossier(row, items as any[]) });
});

const paymentProofSchema = z.object({
  proof_id: z.string().uuid("Identifiant d'envoi invalide"),
  access_key: z.string().min(16).max(128),
  payment_method: z.string().trim().min(2).max(40),
  file_name: z.string().trim().min(1).max(200),
  data_url: z.string().regex(/^data:(image|video|application)\/[a-zA-Z0-9.+-]+;base64,/, "Format de fichier non pris en charge"),
});

/**
 * 5. Enregistrement de la preuve de paiement.
 * Seul le propriétaire du dossier peut l'envoyer. Le fichier est écrit morceau par morceau, puis rendu
 * visible d'un seul coup : l'admin ne voit jamais une preuve incomplète. Un nouvel essai est sans effet.
 */
publicRouter.post("/requests/:reference/payment-proof", zValidator("json", paymentProofSchema), async (c) => {
  const rateCheck = checkRateLimit(`proof:${clientIpOf(c)}`, 20, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    c.header("Retry-After", String(rateCheck.retryAfterSec));
    return c.json({ error: "Trop d'envois récents. Veuillez patienter quelques minutes." }, 429);
  }

  const data = c.req.valid("json");
  const ref = (c.req.param("reference") || "").trim();
  const row = await loadAuthorizedDossier(c, ref, data.access_key);
  if (!row) return c.json({ error: DOSSIER_ACCESS_ERROR }, 404);

  const meta = parseMeta(row);
  if (!(Number(meta.total_amount_fcfa) > 0)) {
    return c.json({ error: "Votre devis n'est pas encore prêt. ROUM TRANSIT vous l'enverra sur WhatsApp." }, 409);
  }
  if (row.status === "CANCELLED" || row.status === "CLOSED") {
    return c.json({ error: "Ce dossier est clôturé. Contactez ROUM TRANSIT sur WhatsApp." }, 409);
  }

  const already = await c.env.DB.prepare(`SELECT id FROM payment_proofs WHERE id = ?`).bind(data.proof_id).first();
  if (already) {
    return c.json({ success: true, request: toPublicDossier(row) });
  }

  const separator = data.data_url.indexOf(",");
  const mimeType = data.data_url.slice(5, data.data_url.indexOf(";"));
  const base64 = data.data_url.slice(separator + 1);
  const sizeBytes = Math.floor((base64.length * 3) / 4);
  if (sizeBytes > MAX_PROOF_BYTES) {
    return c.json({ error: "Fichier trop volumineux (maximum 15 Mo)." }, 413);
  }

  const chunkCount = Math.ceil(base64.length / PROOF_CHUNK_CHARS);
  for (let index = 0; index < chunkCount; index += 1) {
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO payment_proof_chunks (proof_id, chunk_index, data) VALUES (?, ?, ?)
    `).bind(
      data.proof_id,
      index,
      base64.slice(index * PROOF_CHUNK_CHARS, (index + 1) * PROOF_CHUNK_CHARS)
    ).run();
  }

  const submittedAt = new Date().toISOString().replace("T", " ").substring(0, 19);
  const nextMeta = { ...meta, payment_method_selected: data.payment_method, payment_submitted_at: submittedAt };
  const nextStatus = row.status === "CONVERTED" ? "CONVERTED" : "IN_REVIEW";

  await c.env.DB.batch([
    c.env.DB.prepare(`
      INSERT INTO payment_proofs (id, request_id, file_name, mime_type, size_bytes, chunk_count, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(data.proof_id, row.id, data.file_name, mimeType, sizeBytes, chunkCount, data.payment_method),
    c.env.DB.prepare(`
      UPDATE customer_requests SET status = ?, metadata_json = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(nextStatus, JSON.stringify(nextMeta), row.id),
  ]);

  const updated = await c.env.DB.prepare(`SELECT * FROM customer_requests WHERE id = ?`).bind(row.id).first<any>();
  return c.json({ success: true, request: toPublicDossier(updated) }, 201);
});
