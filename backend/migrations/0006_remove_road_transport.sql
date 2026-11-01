-- Migration 0006 : Suppression définitive de tout service terrestre (ROAD / routier)
-- Roum Transit opère exclusivement en Voie Aérienne (Avion) et Voie Maritime (Bateau).

-- 1. Réassigner d'éventuelles expéditions de test routières vers la Voie Express Aérienne
UPDATE shipments 
SET shipping_mode_id = 'AIR_EXPRESS', updated_at = datetime('now')
WHERE shipping_mode_id = 'ROAD_STANDARD';

-- 2. Supprimer les tarifs terrestres
DELETE FROM tariffs WHERE shipping_mode_id = 'ROAD_STANDARD' OR id = 'tariff-ma-sn-road';

-- 3. Supprimer le mode de transport terrestre
DELETE FROM shipping_modes WHERE id = 'ROAD_STANDARD' OR type = 'ROAD';

-- 4. S'assurer que les 9 statuts du cycle client officiel sont bien présents et actifs
INSERT OR IGNORE INTO shipment_statuses (code, label_public, description, sort_order, is_final, is_system, is_active) VALUES
('DRAFT', 'Demande reçue', 'La commande ou la demande de transport est enregistrée dans le système', 10, 0, 1, 1),
('QUOTE_SENT', 'Devis envoyé', 'Le montant détaillé des marchandises et du transport est communiqué au client', 15, 0, 0, 1),
('PAYMENT_CONFIRMED', 'Paiement confirmé', 'Le règlement est validé et les fonds sont alloués aux opérations', 20, 0, 0, 1),
('ORDER_PLACED', 'Commande effectuée', 'L''équipe ROUM achète les articles auprès du fournisseur en Chine', 25, 0, 0, 1),
('RECEIVED_AT_HUB', 'Marchandises reçues en Chine', 'Les colis sont réceptionnés au magasin, pesés et identifiés', 30, 0, 0, 1),
('IN_TRANSIT', 'Colis expédié', 'La marchandise est scellée et en vol aérien ou à bord du navire cargo', 40, 0, 0, 1),
('ARRIVED_DESTINATION', 'Colis arrivé à destination', 'Arrivée sur le sol de destination et formalités de dédouanement', 60, 0, 0, 1),
('READY_FOR_PICKUP', 'Colis disponible pour retrait', 'Le colis est prêt en agence à Bingerville ou au hub local', 70, 0, 0, 1),
('DELIVERED', 'Colis livré', 'Remise officielle en main propre au client destinataire', 90, 1, 0, 1);
