-- L'e-mail de connexion peut changer : chaque appareil connecté le voit sans recharger la page.
-- Ce compteur reste réservé à l'admin : la synchronisation publique ne lit que ses propres scopes.
INSERT OR IGNORE INTO sync_versions (scope, version) VALUES ('account', 1);

CREATE TRIGGER IF NOT EXISTS trg_sync_users_email AFTER UPDATE OF email ON users
WHEN OLD.email <> NEW.email
BEGIN
    UPDATE sync_versions SET version = version + 1 WHERE scope = 'account';
END;
