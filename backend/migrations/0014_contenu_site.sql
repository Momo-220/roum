-- Images du site modifiées par la direction (cartes des services, etc.).
-- La version de chaque image est aussi notée dans business_settings (`site_image_<clé>`) :
-- les pages client reçoivent ainsi la nouvelle adresse de l'image par la synchronisation des paramètres.
CREATE TABLE IF NOT EXISTS site_images (
    key TEXT PRIMARY KEY,
    mime_type TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
