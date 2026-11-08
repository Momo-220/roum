-- Essais de connexion ratés, gardés en base : tous les serveurs de l'API lisent le même compteur.
-- reset_at est en millisecondes ; une ligne expirée est remise à zéro au prochain échec.
CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 0,
    reset_at INTEGER NOT NULL
);
