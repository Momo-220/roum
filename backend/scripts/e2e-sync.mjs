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

const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

await check("une pesée et une photo ajoutées par l'admin apparaissent dans le suivi du client", async () => {
  const quote = await call("POST", "/api/public/quotes", { body: orderBody(randomUUID()) });
  assert.equal(quote.status, 201, JSON.stringify(quote.data));
  const photoRef = quote.data.quote_reference;
  await call("PATCH", `/api/admin/requests/${photoRef}/quote`, { headers: ADMIN, body: { totalAmountFcfa: 100000 } });
  const confirmed = await call("POST", `/api/admin/requests/${photoRef}/confirm-tracking`, { headers: ADMIN, body: {} });
  const photoTracking = confirmed.data.tracking_number;
  assert.ok(photoTracking, JSON.stringify(confirmed.data));

  const before = await call("GET", `/api/v1/public/tracking/${photoTracking}`);
  assert.deepEqual(before.data.photos, []);
  assert.equal(before.data.reception, null);

  const shipmentId = (await call("GET", `/api/admin/shipments/${photoTracking}/photos`, { headers: ADMIN })).data.tracking_number;
  assert.equal(shipmentId, photoTracking);

  const versionBefore = (await call("GET", "/api/public/sync")).data.versions.shipments;
  const photoId = randomUUID();
  const added = await call("POST", `/api/admin/shipments/${photoTracking}/photos`, {
    headers: ADMIN,
    body: { id: photoId, data_url: PIXEL },
  });
  assert.equal(added.status, 201, JSON.stringify(added.data));
  // Le même envoi rejoué après une coupure ne crée pas de doublon.
  await call("POST", `/api/admin/shipments/${photoTracking}/photos`, { headers: ADMIN, body: { id: photoId, data_url: PIXEL } });

  const after = await call("GET", `/api/v1/public/tracking/${photoTracking}`);
  assert.equal(after.data.photos.length, 1);
  assert.ok((await call("GET", "/api/public/sync")).data.versions.shipments > versionBefore, "le suivi doit se rafraîchir");

  const image = await fetch(`${API}${after.data.photos[0].url}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.equal((await fetch(`${API}/api/v1/public/tracking/RM-AIR-2610-XXXXXX/photos/${photoId}`)).status, 404);

  const refused = await call("POST", `/api/admin/shipments/${photoTracking}/photos`, {
    headers: ADMIN,
    body: { id: randomUUID(), data_url: "data:image/svg+xml;base64,PHN2Zz4=" },
  });
  assert.equal(refused.status, 400);
  assert.equal((await call("POST", `/api/admin/shipments/${photoTracking}/photos`, { body: { id: randomUUID(), data_url: PIXEL } })).status, 401);

  const intake = await call("PATCH", `/api/admin/shipments/${(await shipmentRow(photoTracking)).id}/intake`, {
    headers: ADMIN,
    body: { total_weight_kg: 12.5, total_volume_cbm: 0.4, hub_location: "Dépôt Guangzhou" },
  });
  assert.ok(intake.status < 300, JSON.stringify(intake.data));
  const weighed = await call("GET", `/api/v1/public/tracking/${photoTracking}`);
  assert.equal(weighed.data.reception.weight_kg, 12.5);
  assert.equal(weighed.data.reception.location, "Dépôt Guangzhou");

  await call("DELETE", `/api/admin/shipments/${photoTracking}/photos/${photoId}`, { headers: ADMIN });
  assert.deepEqual((await call("GET", `/api/v1/public/tracking/${photoTracking}`)).data.photos, []);
  assert.equal((await fetch(`${API}${after.data.photos[0].url}`)).status, 404);
});

await check("un taux de change modifié par l'admin arrive chez le client, un taux invalide est refusé", async () => {
  const before = (await call("GET", "/api/public/sync")).data.versions.settings;
  const saved = await call("PUT", "/api/admin/settings", { headers: ADMIN, body: { exchange_rate_rmb: "92.5" } });
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal((await call("GET", "/api/public/settings")).data.settings.exchange_rate_rmb, "92.5");
  assert.ok((await call("GET", "/api/public/sync")).data.versions.settings > before);

  for (const value of ["", "0", "-4", "abc"]) {
    const refused = await call("PUT", "/api/admin/settings", { headers: ADMIN, body: { exchange_rate_rmb: value } });
    assert.equal(refused.status, 400, `le taux « ${value} » doit être refusé`);
  }
  assert.equal((await call("GET", "/api/public/settings")).data.settings.exchange_rate_rmb, "92.5");
});

await check("le gérant change son e-mail : protections, connexion et synchronisation", async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = `Essai-${randomUUID()}`;
  const email = `gerant-${suffix}@example.com`;
  const otherEmail = `autre-${suffix}@example.com`;
  const newEmail = `nouveau-${suffix}@example.com`;

  const { roles } = (await call("GET", "/api/admin/roles", { headers: ADMIN })).data;
  const account = { password, full_name: "Gérant Test", role_id: roles[0].id };
  for (const address of [email, otherEmail]) {
    const created = await call("POST", "/api/admin/users", { headers: ADMIN, body: { ...account, email: address } });
    assert.ok(created.status < 300, JSON.stringify(created.data));
  }

  const login = (address, secret = password) =>
    call("POST", "/api/auth/login", { body: { email: address, password: secret } });
  const { token } = (await login(email)).data;
  assert.ok(token);
  const session = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const change = (body, headers = session) => call("POST", "/api/auth/change-email", { headers, body });

  assert.equal((await change({ newEmail, currentPassword: password }, JSON_HEADERS)).status, 401);
  assert.equal((await change({ newEmail, currentPassword: "mauvais" })).status, 400);
  assert.equal((await change({ newEmail: "pas-un-email", currentPassword: password })).status, 400);
  assert.equal((await change({ newEmail: email.toUpperCase(), currentPassword: password })).status, 400);
  assert.equal((await change({ newEmail: otherEmail.toUpperCase(), currentPassword: password })).status, 409);
  assert.equal((await call("GET", "/api/auth/me", { headers: session })).data.user.email, email);

  const before = (await versions("/api/admin/sync")).account;
  const changed = await change({ newEmail: `  ${newEmail.toUpperCase()} `, currentPassword: password });
  assert.equal(changed.status, 200, JSON.stringify(changed.data));
  assert.equal(changed.data.email, newEmail);

  assert.equal((await call("GET", "/api/auth/me", { headers: session })).data.user.email, newEmail);
  assert.equal((await versions("/api/admin/sync")).account, before + 1);
  assert.equal((await call("GET", "/api/public/sync")).data.versions.account, undefined);

  assert.equal((await login(email)).status, 401);
  assert.equal((await login(newEmail)).status, 200);

  const { logs } = (await call("GET", "/api/admin/audit-logs", { headers: ADMIN })).data;
  assert.ok(logs.some((log) => log.action === "auth.change_email"));
});

await check("la connexion bloque les essais répétés et repart à zéro après un succès", async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = `Essai-${randomUUID()}`;
  const { roles } = (await call("GET", "/api/admin/roles", { headers: ADMIN })).data;
  const create = (email) =>
    call("POST", "/api/admin/users", {
      headers: ADMIN,
      body: { email, password, full_name: "Gérant Test", role_id: roles[0].id },
    });
  const login = (email, secret) => call("POST", "/api/auth/login", { body: { email, password: secret } });

  const blocked = `bloque-${suffix}@example.com`;
  assert.ok((await create(blocked)).status < 300);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await login(blocked, "mauvais")).status, 401);
  }
  assert.equal((await login(blocked, "mauvais")).status, 429);
  assert.equal((await login(blocked, password)).status, 429, "même le bon mot de passe attend la fin du blocage");

  const forgiven = `pardonne-${suffix}@example.com`;
  assert.ok((await create(forgiven)).status < 300);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal((await login(forgiven, "mauvais")).status, 401);
  }
  assert.equal((await login(forgiven, password)).status, 200);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await login(forgiven, "mauvais")).status, 401, "le succès a remis le compteur à zéro");
  }
});

await check("la photo de profil est gardée en base et suit le compte sur chaque appareil", async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = `Essai-${randomUUID()}`;
  const email = `photo-${suffix}@example.com`;
  const { roles } = (await call("GET", "/api/admin/roles", { headers: ADMIN })).data;
  const created = await call("POST", "/api/admin/users", {
    headers: ADMIN,
    body: { email, password, full_name: "Gérant Photo", role_id: roles[0].id },
  });
  assert.ok(created.status < 300, JSON.stringify(created.data));

  const login = await call("POST", "/api/auth/login", { body: { email, password } });
  assert.equal(login.data.user.avatarUrl, null);
  const session = { Authorization: `Bearer ${login.data.token}`, "Content-Type": "application/json" };
  const put = (avatar, headers = session) => call("PUT", "/api/auth/avatar", { headers, body: { avatar } });
  const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  assert.equal((await put(photo, JSON_HEADERS)).status, 401);
  assert.equal((await put("data:text/html;base64,PHNjcmlwdD4=")).status, 400);
  assert.equal((await put("pas-une-photo")).status, 400);

  const before = (await versions("/api/admin/sync")).account;
  assert.equal((await put(photo)).status, 200);
  assert.ok((await versions("/api/admin/sync")).account > before, "les autres appareils sont prévenus");

  // Un autre appareil : nouvelle connexion, même photo.
  const other = await call("POST", "/api/auth/login", { body: { email, password } });
  assert.equal(other.data.user.avatarUrl, photo);
  assert.equal((await call("GET", "/api/auth/me", { headers: session })).data.user.avatarUrl, photo);

  assert.equal((await put(null)).status, 200);
  assert.equal((await call("GET", "/api/auth/me", { headers: session })).data.user.avatarUrl, null);
});

await check("les textes et images du site modifiés par l'admin arrivent chez le client", async () => {
  const before = (await call("GET", "/api/public/sync")).data.versions.settings;
  const title = `Titre d'essai ${randomUUID().slice(0, 6)}`;
  const saved = await call("PUT", "/api/admin/settings", { headers: ADMIN, body: { site_home_title_1: title } });
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal((await call("GET", "/api/public/settings")).data.settings.site_home_title_1, title);
  assert.ok((await call("GET", "/api/public/sync")).data.versions.settings > before);

  const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  assert.equal((await call("PUT", "/api/admin/site-images/achat", { body: { dataUrl: photo } })).status, 401);
  assert.equal(
    (await call("PUT", "/api/admin/site-images/achat", { headers: ADMIN, body: { dataUrl: "data:text/html;base64,PHA+" } })).status,
    400
  );
  assert.equal((await call("PUT", "/api/admin/site-images/../x", { headers: ADMIN, body: { dataUrl: photo } })).status >= 400, true);

  const uploaded = await call("PUT", "/api/admin/site-images/achat", { headers: ADMIN, body: { dataUrl: photo } });
  assert.equal(uploaded.status, 200, JSON.stringify(uploaded.data));
  const version = (await call("GET", "/api/public/settings")).data.settings.site_image_achat;
  assert.equal(version, uploaded.data.version);

  const image = await fetch(`${API}/api/public/site-images/achat?v=${version}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.ok(image.headers.get("cache-control").includes("immutable"));
  assert.equal((await image.arrayBuffer()).byteLength, 70);

  assert.equal((await call("DELETE", "/api/admin/site-images/achat", { headers: ADMIN })).status, 200);
  assert.equal((await call("GET", "/api/public/settings")).data.settings.site_image_achat, undefined);
  assert.equal((await fetch(`${API}/api/public/site-images/achat`)).status, 404);

  await call("PUT", "/api/admin/settings", { headers: ADMIN, body: { site_home_title_1: "" } });
});

await check("Roum Boutique : article, stock par taille, commande, preuve, confirmation et annulation", async () => {
  const shop = (path, init = {}) => call(init.method || "GET", `/api/admin/shop${path}`, { headers: ADMIN, body: init.body });
  const suffix = randomUUID().slice(0, 6);
  const syncBefore = (await call("GET", "/api/public/sync")).data.versions.shop_catalog;

  // La gérante crée une catégorie, une zone de livraison et une paire de chaussures en 38 et 39.
  const category = await shop("/categories", { method: "POST", body: { name: `Chaussures ${suffix}` } });
  assert.equal(category.status, 201, JSON.stringify(category.data));
  const zone = await shop("/zones", {
    method: "POST",
    body: { name: "Abidjan", country: "Côte d'Ivoire", priceFcfa: 2000, delay: "24 h" },
  });
  assert.equal(zone.status, 201, JSON.stringify(zone.data));

  const productBody = {
    name: `Escarpin ${suffix}`,
    description: "Cuir verni",
    categoryId: category.data.id,
    priceFcfa: 25000,
    promoPriceFcfa: 20000,
    originCountry: "Chine",
    weightKg: 1.5,
    variants: [
      { color: "Noir", size: "38", stock: 2 },
      { color: "Noir", size: "39", stock: 0 },
    ],
  };
  assert.equal((await shop("/products", { method: "POST", body: { ...productBody, promoPriceFcfa: 30000 } })).status, 400);
  const product = await shop("/products", { method: "POST", body: productBody });
  assert.equal(product.status, 201, JSON.stringify(product.data));
  const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const image = await shop(`/products/${product.data.id}/images`, { method: "POST", body: { dataUrl: photo } });
  assert.equal(image.status, 201, JSON.stringify(image.data));

  // Le client voit l'article, son prix promo, ses pointures et le stock.
  assert.ok((await call("GET", "/api/public/sync")).data.versions.shop_catalog > syncBefore);
  const catalog = (await call("GET", "/api/public/shop/catalog")).data;
  const listed = catalog.products.find((p) => p.id === product.data.id);
  assert.ok(listed, "l'article est en vente");
  assert.equal(listed.promoPriceFcfa, 20000);
  assert.ok(catalog.countries.includes("Côte d'Ivoire"));
  const size38 = listed.variants.find((v) => v.size === "38");
  const size39 = listed.variants.find((v) => v.size === "39");
  assert.equal(size38.stock, 2);
  assert.equal((await fetch(`${API}/api/public/shop/images/${listed.images[0]}`)).status, 200);

  // Masquer puis remettre en vente un article ne touche pas à son stock.
  assert.equal((await shop(`/products/${product.data.id}/visibility`, { method: "POST", body: { isActive: false } })).status, 200);
  assert.ok(
    !(await call("GET", "/api/public/shop/catalog")).data.products.some((p) => p.id === product.data.id),
    "un article masqué n'est plus en vente"
  );
  assert.equal((await shop(`/products/${product.data.id}/visibility`, { method: "POST", body: { isActive: true } })).status, 200);
  const shownAgain = (await call("GET", "/api/public/shop/catalog")).data.products.find((p) => p.id === product.data.id);
  assert.equal(shownAgain?.variants.find((v) => v.size === "38")?.stock, 2, "le stock est intact");

  // Livraison : la zone de la boutique, puis Roum Transit si la grille dessert le trajet.
  const options = (
    await call("POST", "/api/public/shop/delivery-options", {
      body: { items: [{ variantId: size38.id, quantity: 1 }], country: "Côte d'Ivoire", city: "Abidjan" },
    })
  ).data.options;
  const boutique = options.find((o) => o.method === "BOUTIQUE");
  assert.equal(boutique.priceFcfa, 2000);
  const transit = options.find((o) => o.method === "TRANSIT");
  if (transit) assert.ok(transit.priceFcfa > 0, "Roum Transit calcule un prix au poids");

  const order = (overrides = {}) => ({
    idempotencyKey: `shop-${randomUUID()}`,
    customer: { name: "Cliente Test", phone: "+225 07 00 00 00 00", country: "Côte d'Ivoire", city: "Abidjan" },
    items: [{ variantId: size38.id, quantity: 1 }],
    deliveryOptionId: boutique.id,
    ...overrides,
  });

  // Une pointure en rupture est refusée, sans rien retirer du stock.
  assert.equal(
    (await call("POST", "/api/public/shop/orders", { body: order({ items: [{ variantId: size39.id, quantity: 1 }] }) })).status,
    409
  );
  assert.equal(
    (await call("POST", "/api/public/shop/orders", { body: order({ items: [{ variantId: size38.id, quantity: 3 }] }) })).status,
    409
  );

  const body = order();
  const created = await call("POST", "/api/public/shop/orders", { body });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  assert.equal(created.data.totalFcfa, 22000, "prix promo + livraison");
  const replay = await call("POST", "/api/public/shop/orders", { body });
  assert.equal(replay.data.reference, created.data.reference, "renvoyer la même commande ne la double pas");

  const stockAfter = (await call("GET", "/api/public/shop/catalog")).data.products
    .find((p) => p.id === product.data.id).variants.find((v) => v.id === size38.id).stock;
  assert.equal(stockAfter, 1, "le stock baisse à la commande");

  const { reference, accessKey } = created.data;
  assert.equal((await call("GET", `/api/public/shop/orders/${reference}`)).status, 404, "sans clé, la commande reste privée");
  const view = (await call("GET", `/api/public/shop/orders/${reference}?key=${accessKey}`)).data.order;
  assert.equal(view.status, "AWAITING_PAYMENT");
  assert.equal(view.items[0].size, "38");

  // Le client envoie sa preuve, la gérante la voit et confirme.
  const proof = await call("POST", `/api/public/shop/orders/${reference}/proof`, {
    body: { key: accessKey, paymentMethod: "wave", dataUrl: photo },
  });
  assert.equal(proof.status, 200, JSON.stringify(proof.data));
  const orders = (await shop("/orders")).data.orders;
  const adminOrder = orders.find((o) => o.reference === reference);
  assert.ok(adminOrder.proofSentAt, "l'admin voit quand la preuve est arrivée");
  assert.equal(adminOrder.status, "PROOF_SENT");
  assert.equal((await fetch(`${API}/api/admin/shop/orders/${adminOrder.id}/proof`, { headers: ADMIN })).status, 200);

  assert.equal((await shop(`/orders/${adminOrder.id}/status`, { method: "POST", body: { status: "DELIVERED" } })).status, 409);
  assert.equal((await shop(`/orders/${adminOrder.id}/status`, { method: "POST", body: { status: "CONFIRMED" } })).status, 200);
  assert.equal(
    (await shop(`/orders/${adminOrder.id}/status`, { method: "POST", body: { status: "SHIPPED", trackingNumber: "RB-TEST-1" } })).status,
    200
  );
  const shipped = (await call("GET", `/api/public/shop/orders/${reference}?key=${accessKey}`)).data.order;
  assert.equal(shipped.status, "SHIPPED");
  assert.equal(shipped.trackingNumber, "RB-TEST-1");

  // La page Suivi lit la commande avec son seul numéro, sans aucune donnée personnelle.
  const tracked = await call("GET", `/api/v1/public/shop/track/${reference.toLowerCase()}`);
  assert.equal(tracked.status, 200);
  assert.equal(tracked.data.order.reference, reference);
  assert.equal(tracked.data.order.status, "SHIPPED");
  assert.equal(tracked.data.order.trackingNumber, "RB-TEST-1");
  assert.equal(tracked.data.order.items[0].quantity, 1);
  for (const secret of ["customer", "accessKey", "access_key", "totalFcfa", "itemsFcfa", "cancelReason"]) {
    assert.equal(secret in tracked.data.order, false, `le suivi public ne montre pas ${secret}`);
  }
  assert.equal(JSON.stringify(tracked.data).includes(accessKey), false);
  assert.equal((await call("GET", "/api/v1/public/shop/track/RB-0000-ZZZZZZ")).status, 404);
  assert.equal((await call("GET", "/api/v1/public/shop/track/n-importe-quoi")).status, 404);

  // Une autre commande annulée rend son article au stock.
  const second = await call("POST", "/api/public/shop/orders", { body: order() });
  assert.equal(second.status, 201, JSON.stringify(second.data));
  const secondId = (await shop("/orders")).data.orders.find((o) => o.reference === second.data.reference).id;
  const stockOf = async () =>
    (await call("GET", "/api/public/shop/catalog")).data.products
      .find((p) => p.id === product.data.id).variants.find((v) => v.id === size38.id).stock;
  assert.equal(await stockOf(), 0);
  assert.equal((await shop(`/orders/${secondId}/status`, { method: "POST", body: { status: "CANCELLED", reason: "Essai" } })).status, 200);
  assert.equal(await stockOf(), 1, "l'annulation rend le stock");
  assert.equal((await shop(`/orders/${secondId}/status`, { method: "POST", body: { status: "CANCELLED" } })).status, 409);
  assert.equal(await stockOf(), 1, "annuler deux fois ne rend pas le stock deux fois");

  // La gérante change le stock à la main ; la promo arrêtée disparaît chez le client.
  assert.equal((await shop(`/products/${product.data.id}`, { method: "PUT", body: { ...productBody, promoPriceFcfa: null, variants: [{ color: "Noir", size: "38", stock: 7 }] } })).status, 200);
  const updated = (await call("GET", "/api/public/shop/catalog")).data.products.find((p) => p.id === product.data.id);
  assert.equal(updated.promoPriceFcfa, null);
  assert.equal(updated.variants.length, 1, "la pointure 39 retirée n'est plus proposée");
  assert.equal(updated.variants[0].stock, 7);

  // Un client ne peut pas toucher à l'admin de la boutique.
  assert.equal((await call("GET", "/api/admin/shop/orders")).status, 401);

  await shop(`/products/${product.data.id}`, { method: "DELETE" });
  await shop(`/zones/${zone.data.id}`, { method: "DELETE" });
  await shop(`/categories/${category.data.id}`, { method: "DELETE" });
  assert.equal((await call("GET", "/api/public/shop/catalog")).data.products.some((p) => p.id === product.data.id), false);
});

console.log(`\n${passed} vérifications réussies.`);
