-- Migration 0009 : le transport routier n'existe plus, le suivi client ne doit plus l'évoquer.
UPDATE shipment_statuses
SET description = 'Votre colis voyage en avion ou en bateau vers sa destination.'
WHERE code = 'IN_TRANSIT';
