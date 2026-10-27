-- Migration 0003 : Tables et structure complètes pour les modules d'administration
-- Conformément au document de cadrage v0.3 (Demandes, Achats Alibaba, Paiements, Tâches, Paramètres)

-- 1. Table des demandes clients complètes (Alibaba, Transit Fournisseur, Expédition Colis, etc.)
CREATE TABLE IF NOT EXISTS customer_requests (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    request_type TEXT NOT NULL CHECK(request_type IN ('ALIBABA', 'SUPPLIER_TRANSIT', 'PARCEL_SHIPPING', 'TRACKING_HELP', 'CONTACT')),
    origin_country TEXT,
    origin_city TEXT,
    destination_country TEXT,
    destination_city TEXT,
    shipping_mode_id TEXT REFERENCES shipping_modes(id),
    description TEXT,
    estimated_weight_kg REAL,
    estimated_cbm REAL,
    supplier_name TEXT,
    supplier_contact TEXT,
    shipping_mark TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'IN_REVIEW', 'QUOTE_SENT', 'CONVERTED', 'CLOSED', 'CANCELLED')),
    assigned_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cust_req_ref ON customer_requests(reference);
CREATE INDEX IF NOT EXISTS idx_cust_req_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_cust_req_type ON customer_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_cust_req_client ON customer_requests(client_id);

-- 2. Produits d'une demande d'achat Alibaba multi-produits
CREATE TABLE IF NOT EXISTS request_items (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
    item_index INTEGER NOT NULL DEFAULT 1,
    product_name TEXT NOT NULL,
    product_url TEXT,
    supplier_name TEXT,
    unit_price_minor INTEGER,
    currency TEXT NOT NULL DEFAULT 'USD',
    quantity INTEGER NOT NULL DEFAULT 1,
    variants_description TEXT,
    supplier_shipping_cost_minor INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_req_items_request ON request_items(request_id);

-- 3. Paiements financiers consignés (Acomptes, Soldes, Virement, Wave, Orange Money)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    shipment_id TEXT REFERENCES shipments(id) ON DELETE RESTRICT,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'BANK_TRANSFER', 'WAVE', 'ORANGE_MONEY', 'OTHER')),
    payment_type TEXT NOT NULL DEFAULT 'ADVANCE' CHECK(payment_type IN ('ADVANCE', 'BALANCE', 'FULL', 'REFUND')),
    reference_code TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED', 'PENDING', 'CANCELLED')),
    receipt_notes TEXT,
    recorded_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_shipment ON payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_at ON payments(recorded_at);

-- 4. Tâches d'équipe et suivi des informations manquantes
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'GENERAL' CHECK(category IN ('GENERAL', 'MISSING_INFO', 'QUOTE_PREP', 'PAYMENT_CHECK', 'WAREHOUSE_CHECK')),
    request_id TEXT REFERENCES customer_requests(id) ON DELETE SET NULL,
    shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
    assigned_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status TEXT NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    due_date TEXT,
    created_by_user_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 5. Paramètres généraux et configuration opérationnelle (adresses d'entrepôt, WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS business_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by_user_id TEXT REFERENCES users(id),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed des paramètres de base
INSERT OR IGNORE INTO business_settings (key, value) VALUES 
('company_name', 'ROUM TRANSIT'),
('company_tagline', 'WHOLESALE & BOUTIQUE'),
('whatsapp_official_number', '+22370000000'),
('warehouse_china_address', 'Entrepôt Guangzhou : District Baiyun, Route Shisanhang, Bâtiment B, Porte 04, Guangzhou, Chine'),
('warehouse_china_shipping_mark', 'ROUM-TRANSIT-[NOM_CLIENT]-[DESTINATION]'),
('warehouse_china_contact', '+86 138 0000 0000'),
('default_currency', 'USD');
