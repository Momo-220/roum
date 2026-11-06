import { generateReferenceSuffix } from "./shared";

/**
 * Représentation d'un dossier client, partagée par les routes publiques et admin.
 *
 * `customer_requests` est la seule source de vérité. Les informations commerciales qui n'ont pas de
 * colonne dédiée vivent dans `metadata_json`, jamais dans `admin_notes` (texte libre de la gestion).
 */

type Row = Record<string, any>;

/** Champs que le client peut renseigner lui-même. Aucun montant ni statut n'y figure. */
export const CLIENT_METADATA_KEYS = [
  "option_type",
  "product_name",
  "product_image",
  "product_url",
  "product_quantity",
  "shipping_mode_name",
  "shipping_mode_type",
  "supplier_contact",
  "paid_to_supplier",
  "rmb_amount",
  "unit_price",
  "unit_price_currency",
  "destination_city",
  "origin_city",
  "items_count",
] as const;

export function parseMeta(row: Row | null | undefined): Row {
  const raw = row?.metadata_json;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function pickClientMetadata(input: Row | undefined): Row {
  const out: Row = { __roum_meta: true };
  if (!input) return out;
  for (const key of CLIENT_METADATA_KEYS) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") out[key] = value;
  }
  return out;
}

function sharedFields(row: Row, meta: Row, items: Row[]) {
  const firstItem = items[0] || {};
  return {
    reference: row.reference,
    client_name: row.client_name,
    client_phone: row.client_phone,
    origin_country: row.origin_country,
    destination_country: row.destination_country,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    row_version: row.row_version,
    tracking_number: row.tracking_number || null,
    estimated_weight_kg: row.estimated_weight_kg ?? null,
    estimated_cbm: row.estimated_cbm ?? null,
    shipping_mark: row.shipping_mark || null,
    option_type: meta.option_type || null,
    product_name: meta.product_name || firstItem.product_name || null,
    product_url: meta.product_url || firstItem.product_url || "",
    product_quantity: meta.product_quantity || (firstItem.quantity ? String(firstItem.quantity) : "1"),
    product_image: meta.product_image || null,
    shipping_mode_name: meta.shipping_mode_name || null,
    shipping_mode_type: meta.shipping_mode_type || null,
    total_goods_fcfa: Number(meta.total_goods_fcfa) || 0,
    shipping_fee_fcfa: Number(meta.shipping_fee_fcfa) || 0,
    total_amount_fcfa: Number(meta.total_amount_fcfa) || 0,
    payment_method_selected: meta.payment_method_selected || null,
    payment_submitted_at: meta.payment_submitted_at || null,
  };
}

/** Vue complète réservée à l'administration. */
export function toAdminRequest(row: Row, items: Row[] = [], proof?: { has_proof?: boolean; name?: string | null; mime?: string | null }) {
  const meta = parseMeta(row);
  const { metadata_json: _omit, idempotency_key: _idem, ...columns } = row;
  const fields = sharedFields(row, meta, items);
  return {
    ...meta,
    ...columns,
    ...fields,
    product_quantity: fields.product_quantity,
    items: items.length > 0 ? items : [],
    has_payment_proof: Boolean(proof?.has_proof || meta.payment_receipt_url),
    payment_receipt_name: proof?.name || meta.payment_receipt_name || null,
    payment_receipt_mime: proof?.mime || null,
    payment_receipt_url: meta.payment_receipt_url || null,
  };
}

/** Vue envoyée au client : liste blanche, sans notes internes. */
export function toPublicDossier(row: Row, items: Row[] = []) {
  const meta = parseMeta(row);
  return {
    ...sharedFields(row, meta, items),
    items: items.map((item) => ({
      product_name: item.product_name,
      product_url: item.product_url,
      quantity: item.quantity,
    })),
  };
}

export function requestPrefix(serviceType: string, optionType?: string | null): string {
  if (serviceType === "ALIBABA") return optionType === "AVEC_FOURNISSEUR" ? "RMB" : "ALI";
  if (serviceType === "DUBAI") return "DUB";
  if (serviceType === "MAROC") return "MAR";
  if (serviceType === "FRANCE") return "FRA";
  return "FWD";
}

export function newRequestReference(prefix: string): string {
  return `RM-${prefix}-${generateReferenceSuffix()}`;
}

export function newAccessKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sépare "Côte d'Ivoire — Abidjan" ou "Côte d'Ivoire (Abidjan)" en pays et ville. */
export function parseDestination(raw: string | null | undefined): { country: string; city: string | null } {
  const value = String(raw || "").trim();
  const dash = value.split(/\s+[—–-]\s+/);
  if (dash.length >= 2) return { country: dash[0]!.trim(), city: dash[1]!.trim() || null };
  const paren = /^(.+?)\s*\((.+)\)$/.exec(value);
  if (paren) return { country: paren[1]!.trim(), city: paren[2]!.trim() };
  return { country: value, city: null };
}

/** Retrouve la liaison exacte, ou la crée : un colis ne doit jamais partir sur la route d'un autre pays. */
export async function findOrCreateRoute(
  db: D1Database,
  input: { originCountry: string; originCity?: string | null; destinationCountry: string; destinationCity?: string | null },
): Promise<string> {
  const { results } = await db.prepare(`
    SELECT id, origin_city, destination_city FROM routes
    WHERE LOWER(origin_country) = LOWER(?) AND LOWER(destination_country) = LOWER(?)
  `).bind(input.originCountry, input.destinationCountry).all<{ id: string; origin_city: string | null; destination_city: string | null }>();

  const sameCity = (a?: string | null, b?: string | null) => !b || (a || "").toLowerCase() === b.toLowerCase();
  const exact = results.find((r) => sameCity(r.origin_city, input.originCity) && sameCity(r.destination_city, input.destinationCity));
  if (exact) return exact.id;
  if (results[0] && !input.destinationCity) return results[0].id;

  const routeId = `route-${crypto.randomUUID().slice(0, 8)}`;
  await db.prepare(`
    INSERT INTO routes (id, origin_country, origin_city, destination_country, destination_city, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).bind(routeId, input.originCountry, input.originCity || null, input.destinationCountry, input.destinationCity || null).run();
  return routeId;
}

export function paymentMethodFromSelection(selected: unknown): "WAVE" | "ORANGE_MONEY" | "BANK_TRANSFER" | "CASH" | "OTHER" {
  const value = String(selected || "").toLowerCase();
  if (value.includes("wave")) return "WAVE";
  if (value.includes("orange")) return "ORANGE_MONEY";
  if (value.includes("maroc") || value.includes("morocco") || value.includes("bank") || value.includes("rib")) return "BANK_TRANSFER";
  if (value.includes("cash") || value.includes("espece") || value.includes("espèce")) return "CASH";
  return "OTHER";
}

/** Recalcule l'état de paiement d'une expédition depuis les paiements réellement confirmés. */
export function paymentStatusStatement(db: D1Database, shipmentId: string): D1PreparedStatement {
  return db.prepare(`
    UPDATE shipments
    SET payment_status = (
          SELECT CASE
            WHEN price.value > 0 AND paid.total >= price.value THEN 'PAID'
            WHEN price.value > 0 AND paid.total > 0 THEN 'PARTIAL'
            WHEN price.value = 0 AND paid.has_full > 0 THEN 'PAID'
            WHEN paid.total > 0 THEN 'PARTIAL'
            ELSE 'PENDING'
          END
          FROM (
            SELECT
              COALESCE(SUM(CASE WHEN payment_type = 'REFUND' THEN -amount_minor ELSE amount_minor END), 0) AS total,
              COALESCE(SUM(CASE WHEN payment_type = 'FULL' THEN 1 ELSE 0 END), 0) AS has_full
            FROM payments
            WHERE shipment_id = ?1 AND status = 'CONFIRMED'
          ) AS paid,
          (SELECT COALESCE(NULLIF(shipments.final_price_minor, 0), shipments.estimated_price_minor, 0) AS value) AS price
        ),
        updated_at = datetime('now')
    WHERE id = ?1 AND payment_status != 'ON_DELIVERY'
  `).bind(shipmentId);
}

/** Un colis unique porte le poids de son expédition : le client voit partout le même chiffre. */
export function singleParcelWeightStatement(db: D1Database, shipmentId: string, weightKg: number): D1PreparedStatement {
  return db.prepare(`
    UPDATE parcels SET weight_kg = ?1
    WHERE shipment_id = ?2 AND (SELECT COUNT(*) FROM parcels WHERE shipment_id = ?2) = 1
  `).bind(weightKg, shipmentId);
}

/** Répercute sur le dossier client ce qui a changé sur son expédition. */
export function mirrorShipmentToRequest(
  db: D1Database,
  shipmentId: string,
  fields: {
    weightKg?: number | null;
    volumeCbm?: number | null;
    clientName?: string | null;
    clientPhone?: string | null;
    destination?: string | null;
    totalFcfa?: number | null;
  },
): D1PreparedStatement {
  return db.prepare(`
    UPDATE customer_requests
    SET estimated_weight_kg = COALESCE(?1, estimated_weight_kg),
        estimated_cbm = COALESCE(?2, estimated_cbm),
        client_name = COALESCE(?3, client_name),
        client_phone = COALESCE(?4, client_phone),
        destination_country = COALESCE(?5, destination_country),
        metadata_json = CASE
          WHEN ?6 IS NULL THEN metadata_json
          ELSE json_set(COALESCE(metadata_json, '{}'), '$.total_amount_fcfa', ?6)
        END,
        updated_at = datetime('now')
    WHERE shipment_id = ?7
  `).bind(
    fields.weightKg ?? null,
    fields.volumeCbm ?? null,
    fields.clientName ?? null,
    fields.clientPhone ?? null,
    fields.destination ?? null,
    fields.totalFcfa ?? null,
    shipmentId,
  );
}

export function mirrorClientToRequests(
  db: D1Database,
  clientId: string,
  name?: string | null,
  phone?: string | null,
): D1PreparedStatement {
  return db.prepare(`
    UPDATE customer_requests
    SET client_name = COALESCE(?1, client_name),
        client_phone = COALESCE(?2, client_phone),
        updated_at = datetime('now')
    WHERE client_id = ?3
  `).bind(name ?? null, phone ?? null, clientId);
}

export function cancelRequestOfShipment(db: D1Database, shipmentId: string): D1PreparedStatement {
  return db.prepare(`
    UPDATE customer_requests SET status = 'CANCELLED', updated_at = datetime('now')
    WHERE shipment_id = ? AND status != 'CANCELLED'
  `).bind(shipmentId);
}

/** Annule l'expédition d'un dossier annulé, sauf si le colis est déjà livré, et le trace dans le suivi. */
export function cancelShipmentOfRequest(
  db: D1Database,
  shipmentId: string,
  userId: string,
  location: string,
): D1PreparedStatement[] {
  return [
    db.prepare(`
      INSERT INTO tracking_events (id, shipment_id, status, location, comment, recorded_by_user_id)
      SELECT ?, id, 'CANCELLED', ?, 'Dossier annulé par ROUM TRANSIT', ?
      FROM shipments WHERE id = ? AND current_status NOT IN ('DELIVERED', 'CANCELLED')
    `).bind(crypto.randomUUID(), location, userId, shipmentId),
    db.prepare(`
      UPDATE shipments SET current_status = 'CANCELLED', updated_at = datetime('now')
      WHERE id = ? AND current_status NOT IN ('DELIVERED', 'CANCELLED')
    `).bind(shipmentId),
  ];
}
