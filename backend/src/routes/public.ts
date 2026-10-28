import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  normalizeTrackingNumber,
  buildWhatsAppUrl,
  generateQuoteReference,
  phoneSchema,
} from "../shared";
import type { Env } from "../types";

export const publicRouter = new Hono<{ Bindings: Env }>();

/**
 * 1. Suivi public d'une expédition par son numéro de suivi (tracking number)
 * Accès direct et public sans mot de passe requis.
 */
publicRouter.get("/tracking/:trackingNumber", async (c) => {
  const rawNumber = c.req.param("trackingNumber");
  const normalized = normalizeTrackingNumber(rawNumber);

  if (!normalized) {
    return c.json(
      { error: "Numéro de suivi invalide. Format attendu : RM-[MODE]-[AAMM]-[SUFFIXE]." },
      400
    );
  }

  // Requête du dossier d'expédition
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
      sm.type as shipping_mode_type,
      c.full_name as client_name,
      c.phone_whatsapp as client_phone
    FROM shipments s
    JOIN shipment_statuses st ON s.current_status = st.code
    JOIN routes r ON s.route_id = r.id
    JOIN shipping_modes sm ON s.shipping_mode_id = sm.id
    JOIN clients c ON s.client_id = c.id
    WHERE s.tracking_number = ?
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

const quoteRequestSchema = z.object({
  client_name: z.string().min(2, "Le nom est requis"),
  client_phone: phoneSchema,
  client_email: z.string().email("Email invalide").optional().or(z.literal("")),
  origin_country: z.string().min(2, "Pays d'origine requis"),
  destination_country: z.string().min(2, "Pays de destination requis"),
  shipping_mode_id: z.string().optional(),
  estimated_weight_kg: z.number().positive().optional(),
  estimated_cbm: z.number().positive().optional(),
  cargo_type: z.string().optional(),
});

/**
 * 3. Enregistrement d'une demande de devis client
 */
publicRouter.post(
  "/quotes",
  zValidator("json", quoteRequestSchema),
  async (c) => {
    const data = c.req.valid("json");
    const quoteRef = generateQuoteReference();
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
      data.cargo_type || null
    ).run();

    // Lien WhatsApp d'information pour le client avec la référence du devis
    const supportPhone = "+22370000000";
    const waText = `Bonjour ROUM TRANSIT, je viens de faire une demande de devis n° ${quoteRef} (${data.origin_country} -> ${data.destination_country}).`;
    const whatsappUrl = buildWhatsAppUrl(supportPhone, waText);

    return c.json(
      {
        success: true,
        quote_reference: quoteRef,
        message: "Votre demande de devis a été enregistrée avec succès.",
        whatsapp_url: whatsappUrl,
      },
      201
    );
  }
);
