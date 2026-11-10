-- Photo de profil de la direction, gardée en base pour la retrouver sur chaque appareil.
ALTER TABLE users ADD COLUMN avatar_data TEXT;

-- Les autres appareils connectés voient la nouvelle photo sans recharger la page.
CREATE TRIGGER IF NOT EXISTS trg_sync_users_avatar AFTER UPDATE OF avatar_data ON users
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'account';
END;
