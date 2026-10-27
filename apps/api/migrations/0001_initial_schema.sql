-- Migration 0001 : Schéma initial de base de données pour ROUM_TRANSIT (D1 SQLite)
-- Date: 2026-10-27

-- 1. Table des Rôles dynamiques (créés par le Super Admin)
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Permissions accordées à chaque rôle
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_code TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_code)
);

-- 3. Statuts d'expédition (configurables par l'admin avec statuts système protégés)
CREATE TABLE IF NOT EXISTS shipment_statuses (
    code TEXT PRIMARY KEY,
    label_public TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_final INTEGER NOT NULL DEFAULT 0,
    is_system INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 4. Statuts autorisés par rôle
CREATE TABLE IF NOT EXISTS role_allowed_statuses (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    status_code TEXT NOT NULL REFERENCES shipment_statuses(code) ON DELETE CASCADE,
    PRIMARY KEY (role_id, status_code)
);

-- 5. Utilisateurs internes (Administrateurs & Opérateurs)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    hub_location TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. Clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_whatsapp TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone_whatsapp);

-- 7. Modes de Transport
CREATE TABLE IF NOT EXISTS shipping_modes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('AIR', 'SEA', 'ROAD')),
    pricing_basis TEXT NOT NULL CHECK(pricing_basis IN ('PER_KG', 'PER_CBM', 'FIXED')),
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 8. Routes
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    origin_country TEXT NOT NULL,
    origin_city TEXT,
    destination_country TEXT NOT NULL,
    destination_city TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 9. Tarifs (stockés en unités mineures entières pour éviter tout bug d'arrondi)
CREATE TABLE IF NOT EXISTS tariffs (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    shipping_mode_id TEXT NOT NULL REFERENCES shipping_modes(id) ON DELETE RESTRICT,
    currency TEXT NOT NULL DEFAULT 'USD',
    price_per_unit_minor INTEGER NOT NULL,
    minimum_charge_minor INTEGER DEFAULT 0,
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tariffs_route_mode ON tariffs(route_id, shipping_mode_id);

-- 10. Dossiers d'Expédition (Shipments)
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    tracking_number TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    shipping_mode_id TEXT NOT NULL REFERENCES shipping_modes(id) ON DELETE RESTRICT,
    current_status TEXT NOT NULL DEFAULT 'DRAFT' REFERENCES shipment_statuses(code) ON DELETE RESTRICT,
    
    total_parcels_count INTEGER NOT NULL DEFAULT 1,
    total_weight_kg REAL NOT NULL DEFAULT 0.0,
    total_volume_cbm REAL NOT NULL DEFAULT 0.0,
    
    estimated_price_minor INTEGER,
    final_price_minor INTEGER,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'ON_DELIVERY')),
    
    created_by_user_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_client ON shipments(client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);

-- 11. Colis Physiques Individuels (Parcels)
CREATE TABLE IF NOT EXISTS parcels (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    parcel_index INTEGER NOT NULL DEFAULT 1,
    package_label TEXT,
    weight_kg REAL NOT NULL DEFAULT 0.0,
    length_cm REAL,
    width_cm REAL,
    height_cm REAL,
    volume_cbm REAL GENERATED ALWAYS AS (
        ROUND((COALESCE(length_cm, 0) * COALESCE(width_cm, 0) * COALESCE(height_cm, 0)) / 1000000.0, 4)
    ) STORED,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_parcels_shipment ON parcels(shipment_id);

-- 12. Événements de Suivi (Audit Log & Tracking Timeline)
CREATE TABLE IF NOT EXISTS tracking_events (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL REFERENCES shipment_statuses(code) ON DELETE RESTRICT,
    location TEXT NOT NULL,
    comment TEXT,
    recorded_by_user_id TEXT REFERENCES users(id),
    event_timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_shipment ON tracking_events(shipment_id, event_timestamp);

-- 13. Demandes de Devis (Quotes)
CREATE TABLE IF NOT EXISTS quote_requests (
    id TEXT PRIMARY KEY,
    quote_reference TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    origin_country TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    shipping_mode_id TEXT REFERENCES shipping_modes(id),
    estimated_weight_kg REAL,
    estimated_cbm REAL,
    cargo_type TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED')),
    notes_admin TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quotes_ref ON quote_requests(quote_reference);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quote_requests(status);

-- 14. Journal d'Audit (qui a fait quoi)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- 15. Triggers de protection (anti-suppression accidentelle d'éléments système)
CREATE TRIGGER IF NOT EXISTS trg_protect_system_roles_delete
BEFORE DELETE ON roles
WHEN OLD.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Le rôle système ne peut pas être supprimé.');
END;

CREATE TRIGGER IF NOT EXISTS trg_protect_system_statuses_delete
BEFORE DELETE ON shipment_statuses
WHEN OLD.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Les statuts système fondamentaux ne peuvent pas être supprimés.');
END;
