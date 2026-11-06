-- Photos et pesée visibles dans le suivi, taux de change réglables.
--
-- Les photos arrivent déjà réduites par le navigateur (moins de 1,1 Mo), ce qui tient dans une
-- ligne D1. Chaque ajout ou retrait passe par un trigger : le suivi du client se met à jour seul.

CREATE TABLE IF NOT EXISTS shipment_photos (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_photos_shipment ON shipment_photos(shipment_id, created_at);

CREATE TRIGGER IF NOT EXISTS trg_sync_shipment_photos_insert AFTER INSERT ON shipment_photos
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shipment_photos_delete AFTER DELETE ON shipment_photos
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'shipments';
END;

-- Date de la pesée réelle : c'est elle qui rend la pesée visible au client.
ALTER TABLE shipments ADD COLUMN weighed_at TEXT;

UPDATE shipments
SET weighed_at = (
    SELECT MIN(te.event_timestamp) FROM tracking_events te
    WHERE te.shipment_id = shipments.id AND te.status = 'RECEIVED_AT_HUB'
);

-- Mêmes valeurs que celles écrites jusqu'ici dans le code : rien ne change tant qu'on ne les modifie pas.
INSERT OR IGNORE INTO business_settings (key, value) VALUES
    ('exchange_rate_rmb', '88'),
    ('exchange_rate_usd', '610'),
    ('exchange_rate_eur', '656');
