/**
 * Test de bout en bout du parcours Client -> Base -> Admin -> Client.
 *
 * À lancer contre une API de développement sur une base jetable : ce test écrit de vraies lignes.
 * Usage : API_URL=http://127.0.0.1:8799 node scripts/e2e-sync.mjs
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const API = process.env.API_URL || "http://127.0.0.1:8799";
const ADMIN = { Authorization: "Bearer roum_local_admin_session", "Content-Type": "application/json" };
const JSON_HEADERS = { "Content-Type": "application/json" };

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

async function call(method, path, { body, headers } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers || JSON_HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const versions = async (path) => (await call("GET", path, { headers: ADMIN })).data.versions;

const orderBody = (key, overrides = {}) => ({
  idempotency_key: key,
  service_type: "ALIBABA",
  client_name: "Client Test E2E",
  client_phone: `+225070000${Math.floor(1000 + Math.random() * 8999)}`,
  origin_country: "Chine",
  destination_country: "Gabon — Libreville",
  shipping_mode_id: "AIR_EXPRESS",
  product_url: "https://www.alibaba.com/product/1",
  product_quantity: "3",
  metadata: {
    option_type: "SANS_FOURNISSEUR",
    product_name: "Article test",
    shipping_mode_name: "Voie Express",
    shipping_mode_type: "AIR",
    total_amount_fcfa: 1,
    status: "CONVERTED",
  },
  ...overrides,
});

const key = randomUUID();
const before = await versions("/api/admin/sync");
const order = await call("POST", "/api/public/quotes", { body: orderBody(key) });
const { quote_reference: reference, access_key: accessKey } = order.data;

await check("une commande client est créée en base", () => {
  assert.equal(order.status, 201);
  assert.match(reference, /^RM-ALI-[A-Z0-9]{6}$/);
  assert.ok(accessKey.length >= 32);
});

await check("le compteur de synchronisation change sans code applicatif", async () => {
  const after = await versions("/api/admin/sync");
  assert.ok(after.requests > before.requests);
});

await check("un renvoi réseau ne crée pas de doublon", async () => {
  const replay = await call("POST", "/api/public/quotes", { body: orderBody(key) });
  assert.equal(replay.status, 200);
  assert.equal(replay.data.quote_reference, reference);
});

await check("des envois simultanés ne créent qu'un seul dossier", async () => {
  const concurrentKey = randomUUID();
  const body = orderBody(concurrentKey);
  const results = await Promise.all([1, 2, 3, 4].map(() => call("POST", "/api/public/quotes", { body })));
  assert.ok(results.every((r) => r.status === 200 || r.status === 201), JSON.stringify(results.map((r) => r.status)));
  assert.equal(new Set(results.map((r) => r.data.quote_reference)).size, 1);
});

await check("l'admin voit la commande immédiatement", async () => {
  const { data } = await call("GET", "/api/admin/requests", { headers: ADMIN });
  const found = data.requests.find((r) => r.reference === reference);
  assert.ok(found);
  assert.equal(found.product_name, "Article test");
  assert.equal(found.access_key, accessKey);
});

await check("le client ne peut ni fixer un montant ni un statut", async () => {
  const { data } = await call("GET", `/api/admin/requests/${reference}`, { headers: ADMIN });
  assert.equal(data.request.status, "NEW");
  assert.equal(data.request.total_amount_fcfa, 0);
});

await check("un dossier est illisible sans sa clé secrète", async () => {
  assert.equal((await call("GET", `/api/public/requests/${reference}`)).status, 404);
  assert.equal((await call("GET", `/api/public/requests/${reference}?key=${"0".repeat(32)}`)).status, 404);
});

await check("le propriétaire lit son dossier, sans données internes", async () => {
  const { status, data } = await call("GET", `/api/public/requests/${reference}?key=${accessKey}`);
  assert.equal(status, 200);
  assert.equal(data.request.reference, reference);
  for (const secret of ["admin_notes", "access_key", "metadata_json", "idempotency_key", "client_email"]) {
    assert.ok(!(secret in data.request), `${secret} ne doit pas être public`);
  }
});

await check("aucune preuve n'est acceptée avant le devis", async () => {
  const res = await call("POST", `/api/public/requests/${reference}/payment-proof`, {
    body: {
      proof_id: randomUUID(),
      access_key: accessKey,
      payment_method: "wave",
      file_name: "recu.png",
      data_url: "data:image/png;base64,AAAA",
    },
  });
  assert.equal(res.status, 409);
});

const read = await call("GET", `/api/admin/requests/${reference}`, { headers: ADMIN });
const quoteBody = {
  estimatedWeightKg: 12.5,
  goodsTotalFcfa: 100000,
  shippingFeeFcfa: 150000,
  totalAmountFcfa: 250000,
  shippingModeName: "Voie Express",
  expectedVersion: read.data.request.row_version,
};
const quote = await call("PATCH", `/api/admin/requests/${reference}/quote`, { headers: ADMIN, body: quoteBody });

await check("le devis admin arrive chez le client", async () => {
  assert.equal(quote.status, 200);
  assert.equal(quote.data.request.status, "QUOTE_SENT");
  const { data } = await call("GET", `/api/public/requests/${reference}?key=${accessKey}`);
  assert.equal(data.request.total_amount_fcfa, 250000);
  assert.equal(data.request.estimated_weight_kg, 12.5);
});

await check("deux modifications concurrentes sont détectées", async () => {
  const stale = await call("PATCH", `/api/admin/requests/${reference}/quote`, { headers: ADMIN, body: quoteBody });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.conflict, true);
});

const bigProof = `data:image/png;base64,${"A".repeat(3 * 1024 * 1024)}`;
const proofId = randomUUID();
const proofBody = {
  proof_id: proofId,
  access_key: accessKey,
  payment_method: "wave",
  file_name: "recu.png",
  data_url: bigProof,
};

await check("une preuve de 3 Mo (au-delà de la limite D1) est stockée entière", async () => {
  const res = await call("POST", `/api/public/requests/${reference}/payment-proof`, { body: proofBody });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  const { data } = await call("GET", `/api/admin/requests/${reference}`, { headers: ADMIN });
  assert.equal(data.request.status, "IN_REVIEW");
  assert.equal(data.request.payment_receipt_url, bigProof);
});

await check("renvoyer la même preuve est sans effet", async () => {
  const res = await call("POST", `/api/public/requests/${reference}/payment-proof`, { body: proofBody });
  assert.equal(res.status, 200);
});

await check("la liste admin reste légère et signale la preuve", async () => {
  const { data } = await call("GET", "/api/admin/requests", { headers: ADMIN });
  const found = data.requests.find((r) => r.reference === reference);
  assert.equal(found.has_payment_proof, true);
  assert.equal(found.payment_receipt_url, null);
});

await check("le statut payé est refusé sans passer par l'encaissement", async () => {
  const res = await call("PATCH", `/api/admin/requests/${reference}/status`, { headers: ADMIN, body: { status: "CONVERTED" } });
  assert.equal(res.status, 409);
});

const confirmBody = { weightKg: 12.5, totalAmountFcfa: 250000 };
const confirmations = await Promise.all(
  [1, 2, 3].map(() => call("POST", `/api/admin/requests/${reference}/confirm-tracking`, { headers: ADMIN, body: confirmBody })),
);
const tracking = confirmations[0].data.tracking_number;

await check("un triple clic sur l'encaissement ne crée qu'une expédition", async () => {
  assert.ok(confirmations.every((r) => r.status === 200), JSON.stringify(confirmations.map((r) => r.data)));
  assert.equal(new Set(confirmations.map((r) => r.data.tracking_number)).size, 1);
  const { data } = await call("GET", "/api/admin/shipments", { headers: ADMIN });
  assert.equal(data.shipments.filter((s) => s.tracking_number === tracking).length, 1);
});

await check("un seul paiement entre en caisse, du bon montant", async () => {
  const { data } = await call("GET", "/api/admin/payments", { headers: ADMIN });
  const rows = data.payments.filter((p) => p.tracking_number === tracking);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount_minor, 25000000);
  assert.equal(rows[0].payment_method, "WAVE");
  assert.equal(rows[0].status, "CONFIRMED");
});

await check("le client suit son colis, sur la bonne route et au bon poids", async () => {
  const { status, data } = await call("GET", `/api/public/tracking/${tracking}`);
  assert.equal(status, 200);
  assert.equal(data.summary.total_weight_kg, 12.5);
  assert.match(data.route.destination, /Libreville, Gabon/);
  assert.equal(data.timeline.length, 1);
  assert.ok(!JSON.stringify(data).includes("Client Test E2E"));
});

await check("la référence du dossier redirige vers le suivi", async () => {
  const { data } = await call("GET", `/api/public/tracking/${reference}`);
  assert.equal(data.redirect_tracking_number, tracking);
});

await check("un changement de statut admin apparaît chez le client", async () => {
  const { data: list } = await call("GET", "/api/admin/shipments", { headers: ADMIN });
  const shipment = list.shipments.find((s) => s.tracking_number === tracking);
  const res = await call("PATCH", `/api/admin/shipments/${shipment.id}/status`, {
    headers: ADMIN,
    body: { new_status: "IN_TRANSIT", location: "Aéroport de Guangzhou" },
  });
  assert.equal(res.status, 200);
  const { data } = await call("GET", `/api/public/tracking/${tracking}`);
  assert.equal(data.status.code, "IN_TRANSIT");
  assert.equal(data.timeline.length, 2);
});

await check("une expédition avec paiement ne peut pas être supprimée", async () => {
  const { data: list } = await call("GET", "/api/admin/shipments", { headers: ADMIN });
  const shipment = list.shipments.find((s) => s.tracking_number === tracking);
  const res = await call("DELETE", `/api/admin/shipments/${shipment.id}`, { headers: ADMIN });
  assert.equal(res.status, 409);
});

await check("modifier le prix d'un tarif maritime le garde maritime", async () => {
  const { data } = await call("GET", "/api/admin/tariffs", { headers: ADMIN });
  const sea = data.tariffs.find((t) => t.shipping_mode_type === "SEA");
  const res = await call("PUT", `/api/admin/tariffs/${sea.id}`, {
    headers: ADMIN,
    body: { price_per_unit_minor: 31000000, minimum_charge_minor: 31000000 },
  });
  assert.equal(res.status, 200);
  const { data: pub } = await call("GET", "/api/public/tariffs");
  const updated = pub.tariffs.find((t) => t.id === sea.id);
  assert.equal(updated.shipping_mode_type, "SEA");
  assert.equal(updated.price_per_unit_minor, 31000000);
  assert.equal(updated.currency, sea.currency);
});

await check("les versions publiques suivent les changements de tarifs et de réglages", async () => {
  const start = (await call("GET", "/api/public/sync")).data.versions;
  await call("PUT", "/api/admin/settings", { headers: ADMIN, body: { payment_wave_ci: "+225 01 02 03 04 05" } });
  const end = (await call("GET", "/api/public/sync")).data.versions;
  assert.ok(end.settings > start.settings);
  const { data } = await call("GET", "/api/public/settings");
  assert.equal(data.settings.payment_wave_ci, "+225 01 02 03 04 05");
});

await check("un jeton invalide est refusé proprement", async () => {
  const res = await call("GET", "/api/admin/requests", { headers: { Authorization: "Bearer a.b!.c" } });
  assert.equal(res.status, 401);
});

// --- Chaque modification admin doit être visible côté client ---

const shipmentRow = async (trackingNumber) => {
  const { data } = await call("GET", "/api/admin/shipments", { headers: ADMIN });
  return data.shipments.find((s) => s.tracking_number === trackingNumber);
};
const publicTracking = async (trackingNumber) => (await call("GET", `/api/public/tracking/${trackingNumber}`)).data;
const publicDossier = async () => (await call("GET", `/api/public/requests/${reference}?key=${accessKey}`)).data.request;

await check("le client voit que son paiement est réglé", async () => {
  const data = await publicTracking(tracking);
  assert.equal(data.payment.status, "PAID");
  assert.equal(data.payment.label, "Intégralement réglé");
});

await check("la pesée admin change le poids partout chez le client", async () => {
  const shipment = await shipmentRow(tracking);
  const res = await call("PATCH", `/api/admin/shipments/${shipment.id}/intake`, {
    headers: ADMIN,
    body: { total_weight_kg: 14, hub_location: "Entrepôt Guangzhou", status: "IN_TRANSIT" },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const data = await publicTracking(tracking);
  assert.equal(data.summary.total_weight_kg, 14);
  assert.equal(data.parcels[0].weight_kg, 14);
  assert.equal((await publicDossier()).estimated_weight_kg, 14);
});

await check("modifier l'expédition change route, poids et colis chez le client", async () => {
  const shipment = await shipmentRow(tracking);
  const res = await call("PATCH", `/api/admin/shipments/${shipment.id}`, {
    headers: ADMIN,
    body: { total_weight_kg: 15.5, destination_country: "Sénégal", sender_name: "Usine Test" },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const data = await publicTracking(tracking);
  assert.match(data.route.destination, /Sénégal/);
  assert.equal(data.summary.total_weight_kg, 15.5);
  assert.equal(data.parcels[0].weight_kg, 15.5);
  const dossier = await publicDossier();
  assert.equal(dossier.estimated_weight_kg, 15.5);
  assert.match(dossier.destination_country, /Sénégal/);
});

await check("le statut choisi dans la fiche d'expédition crée une étape de suivi", async () => {
  const shipment = await shipmentRow(tracking);
  const before = (await publicTracking(tracking)).timeline.length;
  await call("PATCH", `/api/admin/shipments/${shipment.id}`, { headers: ADMIN, body: { current_status: "ARRIVED_DESTINATION" } });
  const data = await publicTracking(tracking);
  assert.equal(data.status.code, "ARRIVED_DESTINATION");
  assert.equal(data.timeline.length, before + 1);
});

await check("un devis modifié après paiement met à jour prix et reste à payer", async () => {
  const res = await call("PATCH", `/api/admin/requests/${reference}/quote`, {
    headers: ADMIN,
    body: { estimatedWeightKg: 16, totalAmountFcfa: 300000 },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.request.status, "CONVERTED");
  const data = await publicTracking(tracking);
  assert.equal(data.summary.total_weight_kg, 16);
  assert.equal(data.parcels[0].weight_kg, 16);
  assert.equal(data.payment.status, "PARTIAL");
  assert.equal(data.payment.label, "Acompte reçu");
  assert.equal((await publicDossier()).total_amount_fcfa, 300000);
});

await check("un paiement admin de solde repasse le colis en réglé chez le client", async () => {
  const shipment = await shipmentRow(tracking);
  const res = await call("POST", "/api/admin/payments", {
    headers: ADMIN,
    body: {
      client_id: shipment.client_id,
      shipment_id: shipment.id,
      amount_minor: 5000000,
      payment_method: "WAVE",
      payment_type: "BALANCE",
      status: "CONFIRMED",
    },
  });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal((await publicTracking(tracking)).payment.status, "PAID");
});

await check("le prix modifié sur l'expédition arrive sur le dossier client", async () => {
  const shipment = await shipmentRow(tracking);
  await call("PATCH", `/api/admin/shipments/${shipment.id}`, { headers: ADMIN, body: { final_price_minor: 40000000 } });
  assert.equal((await publicDossier()).total_amount_fcfa, 400000);
  assert.equal((await publicTracking(tracking)).payment.status, "PARTIAL");
});

await check("modifier la fiche client met à jour ses dossiers", async () => {
  const shipment = await shipmentRow(tracking);
  const res = await call("PUT", `/api/admin/clients/${shipment.client_id}`, {
    headers: ADMIN,
    body: { full_name: "Client Renommé", phone: "+2250788776655" },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const dossier = await publicDossier();
  assert.equal(dossier.client_name, "Client Renommé");
  assert.equal(dossier.client_phone, "+2250788776655");
});

await check("modifier le dossier met à jour la fiche client et l'expédition", async () => {
  const res = await call("PATCH", `/api/admin/requests/${reference}`, {
    headers: ADMIN,
    body: { client_name: "Client Dossier", estimated_weight_kg: 17, destination_country: "Mali — Bamako" },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const { data } = await call("GET", "/api/admin/clients", { headers: ADMIN });
  assert.ok(data.clients.some((client) => client.full_name === "Client Dossier"));
  const tracked = await publicTracking(tracking);
  assert.equal(tracked.summary.total_weight_kg, 17);
  assert.match(tracked.route.destination, /Bamako, Mali/);
});

await check("annuler le dossier annule le colis chez le client", async () => {
  const res = await call("PATCH", `/api/admin/requests/${reference}/status`, { headers: ADMIN, body: { status: "CANCELLED" } });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal((await publicDossier()).status, "CANCELLED");
  const data = await publicTracking(tracking);
  assert.equal(data.status.code, "CANCELLED");
  assert.equal(data.timeline.at(-1).status, "CANCELLED");
});

await check("annuler une expédition annule le dossier chez le client", async () => {
  const second = randomUUID();
  const created = await call("POST", "/api/public/quotes", { body: orderBody(second) });
  const ref = created.data.quote_reference;
  await call("PATCH", `/api/admin/requests/${ref}/quote`, { headers: ADMIN, body: { totalAmountFcfa: 100000 } });
  const confirmed = await call("POST", `/api/admin/requests/${ref}/confirm-tracking`, { headers: ADMIN, body: {} });
  const shipment = await shipmentRow(confirmed.data.tracking_number);
  await call("PATCH", `/api/admin/shipments/${shipment.id}/status`, {
    headers: ADMIN,
    body: { new_status: "CANCELLED", location: "Abidjan" },
  });
  const { data } = await call("GET", `/api/public/requests/${ref}?key=${created.data.access_key}`);
  assert.equal(data.request.status, "CANCELLED");
});

await check("le suivi par référence reflète l'état du dossier", async () => {
  const third = await call("POST", "/api/public/quotes", { body: orderBody(randomUUID()) });
  const ref = third.data.quote_reference;
  assert.equal((await publicTracking(ref)).status.label, "Dossier enregistré chez ROUM TRANSIT");
  await call("PATCH", `/api/admin/requests/${ref}/quote`, { headers: ADMIN, body: { totalAmountFcfa: 90000 } });
  assert.equal((await publicTracking(ref)).status.label, "Devis envoyé");
  await call("PATCH", `/api/admin/requests/${ref}/status`, { headers: ADMIN, body: { status: "CANCELLED" } });
  assert.equal((await publicTracking(ref)).status.code, "CANCELLED");
});

await check("entrepôts, numéros et entrepôts ajoutés arrivent chez le client", async () => {
  const hubs = JSON.stringify([{ id: "hub-1", country: "Turquie", city: "Istanbul", address: "Zone cargo" }]);
  const res = await call("PUT", "/api/admin/settings", {
    headers: ADMIN,
    body: {
      warehouse_china_address: "Nouvelle adresse Chine",
      warehouse_china_contact: "+86 111",
      warehouse_china_shipping_mark: "MARK-TEST",
      warehouse_dubai_address: "Nouvelle adresse Dubaï",
      agency_paris_address: "Nouvelle adresse Paris",
      hub_casablanca_address: "Nouvelle adresse Casablanca",
      whatsapp_official_number: "+2250102030405",
      custom_hubs_json: hubs,
    },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const { data } = await call("GET", "/api/public/settings");
  assert.equal(data.settings.warehouse_china_address, "Nouvelle adresse Chine");
  assert.equal(data.settings.warehouse_china_shipping_mark, "MARK-TEST");
  assert.equal(data.settings.hub_casablanca_address, "Nouvelle adresse Casablanca");
  assert.equal(data.settings.custom_hubs_json, hubs);
  const tracked = await publicTracking(tracking);
  assert.match(tracked.whatsapp_support_url, /wa\.me\/2250102030405/);
});

await check("un tarif ajouté, modifié ou supprimé apparaît chez le client", async () => {
  const created = await call("POST", "/api/admin/tariffs", {
    headers: ADMIN,
    body: {
      origin_country: "Chine",
      destination_country: "Togo",
      shipping_mode_id: "AIR_EXPRESS",
      price_per_unit_minor: 1500000,
      minimum_charge_minor: 1500000,
      estimated_days_min: 5,
      estimated_days_max: 6,
      service_name: "Express Togo",
    },
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const id = created.data.tariff_id;
  const find = async () => (await call("GET", "/api/public/tariffs")).data.tariffs.find((t) => t.id === id);
  assert.equal((await find()).service_name, "Express Togo");
  await call("PUT", `/api/admin/tariffs/${id}`, { headers: ADMIN, body: { price_per_unit_minor: 1600000, estimated_days_max: 7 } });
  const edited = await find();
  assert.equal(edited.price_per_unit_minor, 1600000);
  assert.equal(edited.estimated_days_max, 7);
  await call("DELETE", `/api/admin/tariffs/${id}`, { headers: ADMIN });
  assert.equal(await find(), undefined);
});

console.log(`\n${passed} vérifications réussies.`);
