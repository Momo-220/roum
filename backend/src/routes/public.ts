import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  normalizeTrackingNumber,
  buildWhatsAppUrl,
  generateQuoteReference,
  phoneSchema,
} from "../shared";
import { checkRateLimit } from "../crypto";
import type { Env } from "../types";

export const publicRouter = new Hono<{ Bindings: Env }>();

/**
 * 1. Suivi public d'une expédition par son numéro de suivi (tracking number)
 * Accès direct et public sans mot de passe requis (avec anti-énumération et sans PII client).
 */
publicRouter.get("/tracking/:trackingNumber", async (c) => {
  const clientIp =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "local-ip";
  const rateCheck = checkRateLimit(`tracking:${clientIp}`, 30, 60 * 1000);
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
    return c.json({ error: "Aucun colis trouvé pour ce numéro de suivi." }, 404);
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
  // Numéro de support ROUM TRANSIT (par exemple WhatsApp officiel)
  const supportPhone = "+22370000000"; // Modifiable ou lu depuis env/config
  const waMessage = `Bonjour ROUM TRANSIT, je souhaite des informations sur mon colis n° ${normalized} (${shipment.origin_country} -> ${shipment.destination_country}).`;
  const whatsappUrl = buildWhatsAppUrl(supportPhone, waMessage);

  return c.json({
    tracking_number: shipment.tracking_number,
    status: {
      code: shipment.current_status,
      label: shipment.status_label,
      description: shipment.status_description,
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
      t.currency,
      t.price_per_unit_minor,
      t.minimum_charge_minor,
      t.estimated_days_min,
      t.estimated_days_max,
      t.category_tag,
      t.note,
      sm.id as mode_id,
      sm.name as mode_name,
      sm.type as mode_type,
      sm.pricing_basis
    FROM routes r
    JOIN tariffs t ON r.id = t.route_id
    JOIN shipping_modes sm ON t.shipping_mode_id = sm.id
    WHERE r.is_active = 1 AND t.is_active = 1 AND sm.is_active = 1
    ORDER BY r.origin_country, r.destination_country, sm.sort_order
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
    "warehouse_dubai_address",
    "warehouse_dubai_contact",
    "agency_paris_address",
    "agency_paris_contact",
  ]);

  for (const s of (settings as any[]) || []) {
    if (allowedKeys.has(s.key)) {
      publicMap[s.key] = s.value;
    }
  }

  return c.json({ settings: publicMap });
});

const quoteRequestSchema = z.object({
  service_type: z.enum(["ALIBABA", "FORWARDING", "GENERAL"]).optional().default("GENERAL"),
  client_name: z.string().min(2, "Le nom est requis").max(120),
  client_phone: phoneSchema,
  client_email: z.string().email("Email invalide").max(160).optional().or(z.literal("")),
  origin_country: z.string().min(2, "Pays d'origine requis").max(80),
  destination_country: z.string().min(2, "Pays de destination requis").max(80),
  shipping_mode_id: z.string().max(64).optional(),
  estimated_weight_kg: z.number().positive().max(1_000_000).optional(),
  estimated_cbm: z.number().positive().max(10_000).optional(),
  cargo_type: z.string().max(1000).optional(),
  product_url: z.string().max(1000).optional(),
  product_quantity: z.string().max(200).optional(),
  product_specs: z.string().max(1000).optional(),
  supplier_info: z.string().max(1000).optional(),
});

/**
 * 3. Enregistrement d'une demande client (Commande Alibaba ou Fret Transitaire)
 */
publicRouter.post(
  "/quotes",
  zValidator("json", quoteRequestSchema),
  async (c) => {
    const clientIp =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "local-ip";
    const rateCheck = checkRateLimit(`quotes:${clientIp}`, 15, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      c.header("Retry-After", String(rateCheck.retryAfterSec));
      return c.json(
        { error: "Trop de demandes envoyées récemment. Veuillez patienter quelques minutes." },
        429
      );
    }

    const data = c.req.valid("json");
    
    // Génération d'une référence explicite selon le service
    let quoteRef = generateQuoteReference();
    if (data.service_type === "ALIBABA") {
      quoteRef = `RM-ALI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    } else if (data.service_type === "FORWARDING") {
      quoteRef = `RM-FWD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // Formatage descriptif complet dans cargo_type
    let formattedCargo = data.cargo_type || "";
    if (data.service_type === "ALIBABA") {
      formattedCargo = `[COMMANDE ALIBABA] Qté: ${data.product_quantity || "1"} | Spécifications: ${data.product_specs || "N/A"} | Lien: ${data.product_url || "Non fourni"}`;
    } else if (data.service_type === "FORWARDING") {
      formattedCargo = `[FRET TRANSITAIRE] Marchandises: ${data.cargo_type || "Colis divers"} | Fournisseur: ${data.supplier_info || "Non précisé"}`;
    }

    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO quote_requests (
        id, quote_reference, client_name, client_phone, client_email,
        origin_country, destination_country, shipping_mode_id,
        estimated_weight_kg, estimated_cbm, cargo_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    `).bind(
      id,
      quoteRef,
      data.client_name,
      data.client_phone,
      data.client_email || null,
      data.origin_country,
      data.destination_country,
      data.shipping_mode_id || null,
      data.estimated_weight_kg || null,
      data.estimated_cbm || null,
      formattedCargo
    ).run();

    // Synchronisation vers customer_requests (table d'administration métier)
    const reqType = data.service_type === "ALIBABA"
      ? "ALIBABA"
      : data.service_type === "FORWARDING"
        ? "SUPPLIER_TRANSIT"
        : "PARCEL_SHIPPING";
    const shippingMark = `ROUM / ${quoteRef} / ${data.client_name.toUpperCase()}`;

    try {
      await c.env.DB.prepare(`
        INSERT INTO customer_requests (
          id, reference, client_name, client_phone, client_email,
          request_type, origin_country, destination_country, shipping_mode_id,
          description, estimated_weight_kg, estimated_cbm, supplier_name,
          shipping_mark, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
      `).bind(
        id,
        quoteRef,
        data.client_name,
        data.client_phone,
        data.client_email || null,
        reqType,
        data.origin_country,
        data.destination_country,
        data.shipping_mode_id || null,
        formattedCargo,
        data.estimated_weight_kg || null,
        data.estimated_cbm || null,
        data.supplier_info || null,
        shippingMark
      ).run();

      if (data.service_type === "ALIBABA" && (data.product_url || data.product_specs)) {
        await c.env.DB.prepare(`
          INSERT INTO request_items (
            id, request_id, item_index, product_name, product_url,
            quantity, variants_description
          ) VALUES (?, ?, 1, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          id,
          data.product_specs || "Article Alibaba",
          data.product_url || null,
          parseInt(data.product_quantity || "1", 10) || 1,
          data.product_specs || null
        ).run();
      }
    } catch (err) {
      console.error("Erreur synchronisation customer_requests:", err);
    }

    // Lien WhatsApp d'assistance pré-rempli pour le client
    const supportPhone = "+2250153638569";
    let waText = "";
    if (data.service_type === "ALIBABA") {
      waText = `Bonjour ROUM TRANSIT, j'ai soumis une demande de commande Alibaba n° ${quoteRef} (${data.origin_country} -> ${data.destination_country}). Pouvez-vous préparer mon devis d'achat et de transport ?`;
    } else if (data.service_type === "FORWARDING") {
      waText = `Bonjour ROUM TRANSIT, j'ai enregistré mon expédition n° ${quoteRef} (${data.origin_country} -> ${data.destination_country}). J'ai déjà mon fournisseur et je souhaite obtenir les instructions d'entrepôt.`;
    } else {
      waText = `Bonjour ROUM TRANSIT, je viens de faire une demande de devis n° ${quoteRef} (${data.origin_country} -> ${data.destination_country}).`;
    }
    const whatsappUrl = buildWhatsAppUrl(supportPhone, waText);

    return c.json(
      {
        success: true,
        quote_reference: quoteRef,
        service_type: data.service_type,
        message: data.service_type === "ALIBABA"
          ? "Votre demande de commande Alibaba a été reçue. Notre équipe prépare votre devis."
          : "Votre demande de transport a été enregistrée. Voici les instructions pour votre fournisseur.",
        whatsapp_url: whatsappUrl,
        warehouse_china: {
          address: "Guangzhou Baiyun Logistics Center, District de Baiyun, Guangzhou, Guangdong, Chine",
          contact_phone: "+86 138 0000 0000",
          shipping_mark: `ROUM / ${quoteRef} / ${data.client_name.toUpperCase()}`,
        },
      },
      201
    );
  }
);
