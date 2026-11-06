-- Migration 0008 : compléments pour que toute modification admin atteigne le client.

-- L'expéditeur saisi dans la fiche d'expédition n'avait aucune colonne : il était perdu à l'enregistrement.
ALTER TABLE shipments ADD COLUMN sender_name TEXT;
ALTER TABLE shipments ADD COLUMN sender_phone TEXT;

-- Le numéro modifiable dans l'admin contenait encore une valeur de remplacement.
UPDATE business_settings
SET value = COALESCE((SELECT value FROM business_settings WHERE key = 'whatsapp_support' AND value != ''), value)
WHERE key = 'whatsapp_official_number' AND value = '+22370000000';
