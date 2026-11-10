-- Roum Boutique : catégories, articles, stock par taille et couleur, zones de livraison et commandes.

CREATE TABLE IF NOT EXISTS shop_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shop_products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES shop_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_fcfa INTEGER NOT NULL CHECK (price_fcfa >= 0),
    promo_price_fcfa INTEGER CHECK (promo_price_fcfa IS NULL OR promo_price_fcfa >= 0),
    promo_ends_at TEXT,
    -- Pays d'où part l'article : sert au calcul de la livraison par Roum Transit.
    origin_country TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    weight_kg REAL,
    is_active INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);

CREATE TABLE IF NOT EXISTS shop_product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    mime_type TEXT NOT NULL,
    data TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shop_images_product ON shop_product_images(product_id, position);

-- Une ligne par taille et couleur : c'est elle qui porte le stock.
CREATE TABLE IF NOT EXISTS shop_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    color TEXT NOT NULL DEFAULT '',
    size TEXT NOT NULL DEFAULT '',
    stock INTEGER NOT NULL DEFAULT 0,
    UNIQUE (product_id, color, size)
);

-- Le stock ne descend jamais sous zéro : toute la commande est alors refusée.
CREATE TRIGGER IF NOT EXISTS trg_shop_variants_stock_guard BEFORE UPDATE OF stock ON shop_variants
WHEN NEW.stock < 0
BEGIN
    SELECT RAISE(ABORT, 'STOCK_INSUFFISANT');
END;

-- Livraisons au prix fixé par la boutique (une ville ou une région).
CREATE TABLE IF NOT EXISTS shop_delivery_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    price_fcfa INTEGER NOT NULL CHECK (price_fcfa >= 0),
    delay_text TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    access_key TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('BOUTIQUE', 'TRANSIT')),
    delivery_label TEXT NOT NULL,
    delivery_fcfa INTEGER NOT NULL,
    items_fcfa INTEGER NOT NULL,
    total_fcfa INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT'
        CHECK (status IN ('AWAITING_PAYMENT', 'PROOF_SENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    payment_method TEXT,
    proof_mime TEXT,
    proof_data TEXT,
    proof_sent_at TEXT,
    tracking_number TEXT,
    cancel_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status, created_at);

CREATE TABLE IF NOT EXISTS shop_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id TEXT,
    variant_id TEXT,
    product_name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    size TEXT NOT NULL DEFAULT '',
    unit_price_fcfa INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_fcfa INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);

-- Synchronisation : le catalogue suit en direct chez les clients, les commandes chez la gérante.
INSERT OR IGNORE INTO sync_versions (scope, version) VALUES ('shop_catalog', 1), ('shop_orders', 1);

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_categories_insert AFTER INSERT ON shop_categories
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_categories_update AFTER UPDATE ON shop_categories
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_categories_delete AFTER DELETE ON shop_categories
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_products_insert AFTER INSERT ON shop_products
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_products_update AFTER UPDATE ON shop_products
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_products_delete AFTER DELETE ON shop_products
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_images_insert AFTER INSERT ON shop_product_images
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_images_delete AFTER DELETE ON shop_product_images
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_variants_insert AFTER INSERT ON shop_variants
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_variants_update AFTER UPDATE ON shop_variants
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_variants_delete AFTER DELETE ON shop_variants
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_zones_insert AFTER INSERT ON shop_delivery_zones
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_zones_update AFTER UPDATE ON shop_delivery_zones
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_zones_delete AFTER DELETE ON shop_delivery_zones
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_catalog'; END;

CREATE TRIGGER IF NOT EXISTS trg_sync_shop_orders_insert AFTER INSERT ON shop_orders
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_orders'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_orders_update AFTER UPDATE ON shop_orders
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_orders'; END;
CREATE TRIGGER IF NOT EXISTS trg_sync_shop_orders_delete AFTER DELETE ON shop_orders
BEGIN UPDATE sync_versions SET version = version + 1 WHERE scope = 'shop_orders'; END;
