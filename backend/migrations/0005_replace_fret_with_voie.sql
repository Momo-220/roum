-- Migration 0005 : Remplacement officiel de "Fret" par "Voie" selon la charte ROUM TRANSIT
-- Voie Aérienne, Voie Maritime, Voie Terrestre

UPDATE shipping_modes SET name = 'Voie Aérienne Express' WHERE id = 'AIR_EXPRESS';
UPDATE shipping_modes SET name = 'Voie Aérienne Standard' WHERE id = 'AIR_STANDARD';
UPDATE shipping_modes SET name = 'Voie Maritime (Bateau / CBM)' WHERE id = 'SEA_LCL';
UPDATE shipping_modes SET name = 'Voie Terrestre Transfrontalière' WHERE id = 'ROAD_STANDARD';

UPDATE business_settings SET value = 'Zone Logistique Aéroport Mohammed V, Casablanca, Maroc' WHERE key = 'hub_casablanca_address';
UPDATE business_settings SET value = 'Zone Logistique Roissy CDG / Paris Nord, France' WHERE key = 'hub_paris_address';
