-- Migration 0007 : socle de synchronisation fiable Client <-> Base <-> Admin
--
-- 1. Les métadonnées d'un dossier quittent `admin_notes` (texte libre, corrompu à chaque conversion)
--    pour une colonne dédiée `metadata_json`.
-- 2. Chaque dossier reçoit une clé d'accès secrète : la référence seule ne donne plus accès aux données.
-- 3. `idempotency_key` empêche les doublons quand le réseau force un nouvel essai.
-- 4. `row_version` détecte deux modifications concurrentes du même dossier.
-- 5. `sync_versions` est incrémentée par des triggers SQL : aucune écriture ne peut l'oublier.
-- 6. Les preuves de paiement sont découpées en morceaux, car D1 limite une ligne à 2 Mo.

-- Compte administrateur requis par les clés étrangères. Le hash "!" ne correspond à aucun mot de
-- passe : personne ne peut s'y connecter tant qu'un vrai mot de passe n'a pas été défini.
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role_id, hub_location, is_active)
VALUES ('user-superadmin-01', 'ceo@roumtransit.com', '!', 'Madame Marouba', 'SUPER_ADMIN', 'Abidjan / Bamako', 1);

ALTER TABLE customer_requests ADD COLUMN metadata_json TEXT;
ALTER TABLE customer_requests ADD COLUMN access_key TEXT;
ALTER TABLE customer_requests ADD COLUMN idempotency_key TEXT;
ALTER TABLE customer_requests ADD COLUMN tracking_number TEXT;
ALTER TABLE customer_requests ADD COLUMN shipment_id TEXT;
ALTER TABLE customer_requests ADD COLUMN row_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE shipments ADD COLUMN source_request_id TEXT;

-- Métadonnées saines
UPDATE customer_requests
SET metadata_json = admin_notes, admin_notes = NULL
WHERE admin_notes IS NOT NULL
  AND json_valid(admin_notes)
  AND json_extract(admin_notes, '$.__roum_meta') IS NOT NULL;

-- Métadonnées corrompues par l'ancienne conversion : "{json} | Converti en expédition RM-..."
UPDATE customer_requests
SET tracking_number = substr(admin_notes, instr(admin_notes, ' | Converti en expédition ') + 26),
    metadata_json = substr(admin_notes, 1, instr(admin_notes, ' | Converti en expédition ') - 1),
    admin_notes = NULL
WHERE admin_notes IS NOT NULL
  AND instr(admin_notes, ' | Converti en expédition ') > 1
  AND json_valid(substr(admin_notes, 1, instr(admin_notes, ' | Converti en expédition ') - 1));

-- Texte libre suivi de la mention de conversion
UPDATE customer_requests
SET tracking_number = substr(admin_notes, instr(admin_notes, 'Converti en expédition ') + 23)
WHERE tracking_number IS NULL
  AND admin_notes IS NOT NULL
  AND instr(admin_notes, 'Converti en expédition ') > 0;

UPDATE customer_requests
SET tracking_number = json_extract(metadata_json, '$.tracking_number')
WHERE tracking_number IS NULL
  AND metadata_json IS NOT NULL
  AND json_valid(metadata_json)
  AND json_extract(metadata_json, '$.tracking_number') IS NOT NULL;

UPDATE customer_requests
SET shipment_id = (SELECT s.id FROM shipments s WHERE UPPER(s.tracking_number) = UPPER(customer_requests.tracking_number) LIMIT 1)
WHERE tracking_number IS NOT NULL;

UPDATE shipments
SET source_request_id = (SELECT r.id FROM customer_requests r WHERE r.shipment_id = shipments.id LIMIT 1)
WHERE id IN (SELECT shipment_id FROM customer_requests WHERE shipment_id IS NOT NULL);

UPDATE customer_requests SET access_key = lower(hex(randomblob(16))) WHERE access_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cust_req_idempotency ON customer_requests(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_source_request ON shipments(source_request_id) WHERE source_request_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_customer_requests_row_version
AFTER UPDATE ON customer_requests
WHEN NEW.row_version = OLD.row_version
BEGIN
    UPDATE customer_requests SET row_version = OLD.row_version + 1 WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS payment_proofs (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL,
    payment_method TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_request ON payment_proofs(request_id, created_at);

CREATE TABLE IF NOT EXISTS payment_proof_chunks (
    proof_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (proof_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS sync_versions (
    scope TEXT PRIMARY KEY,
    version INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO sync_versions (scope, version) VALUES
('clients', 1),
('payments', 1),
('requests', 1),
('settings', 1),
('shipments', 1),
('tariffs', 1),
('tasks', 1);

CREATE TRIGGER IF NOT EXISTS trg_sync_shipments_insert AFTER INSERT ON shipments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipments_update AFTER UPDATE ON shipments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipments_delete AFTER DELETE ON shipments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_parcels_insert AFTER INSERT ON parcels
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_parcels_update AFTER UPDATE ON parcels
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_parcels_delete AFTER DELETE ON parcels
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tracking_events_insert AFTER INSERT ON tracking_events
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tracking_events_update AFTER UPDATE ON tracking_events
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tracking_events_delete AFTER DELETE ON tracking_events
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_customer_requests_insert AFTER INSERT ON customer_requests
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_customer_requests_update AFTER UPDATE ON customer_requests
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_customer_requests_delete AFTER DELETE ON customer_requests
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_request_items_insert AFTER INSERT ON request_items
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_request_items_update AFTER UPDATE ON request_items
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_request_items_delete AFTER DELETE ON request_items
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payment_proofs_insert AFTER INSERT ON payment_proofs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payment_proofs_update AFTER UPDATE ON payment_proofs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payment_proofs_delete AFTER DELETE ON payment_proofs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'requests';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tariffs_insert AFTER INSERT ON tariffs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tariffs_update AFTER UPDATE ON tariffs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tariffs_delete AFTER DELETE ON tariffs
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_routes_insert AFTER INSERT ON routes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_routes_update AFTER UPDATE ON routes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_routes_delete AFTER DELETE ON routes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipping_modes_insert AFTER INSERT ON shipping_modes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipping_modes_update AFTER UPDATE ON shipping_modes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipping_modes_delete AFTER DELETE ON shipping_modes
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tariffs';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_business_settings_insert AFTER INSERT ON business_settings
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'settings';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_business_settings_update AFTER UPDATE ON business_settings
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'settings';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_business_settings_delete AFTER DELETE ON business_settings
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'settings';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_clients_insert AFTER INSERT ON clients
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'clients';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_clients_update AFTER UPDATE ON clients
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'clients';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_clients_delete AFTER DELETE ON clients
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'clients';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payments_insert AFTER INSERT ON payments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'payments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payments_update AFTER UPDATE ON payments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'payments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_payments_delete AFTER DELETE ON payments
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'payments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tasks_insert AFTER INSERT ON tasks
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tasks';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tasks_update AFTER UPDATE ON tasks
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tasks';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_tasks_delete AFTER DELETE ON tasks
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'tasks';
END;

