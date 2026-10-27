-- Migration 0002 : Données initiales (Seed) pour ROUM_TRANSIT
-- Date: 2026-10-27

-- 1. Rôle système SUPER_ADMIN
INSERT OR IGNORE INTO roles (id, name, description, is_system, is_active)
VALUES ('SUPER_ADMIN', 'Super Administrateur', 'Accès complet au système, gestion des rôles et des utilisateurs', 1, 1);

-- 2. Statuts d'expédition initiaux
INSERT OR IGNORE INTO shipment_statuses (code, label_public, description, sort_order, is_final, is_system, is_active) VALUES
('DRAFT', 'Dossier créé', 'Demande enregistrée, en attente des colis physiques', 10, 0, 1, 1),
('RECEIVED_AT_HUB', 'Reçu à l''entrepôt', 'Marchandise réceptionnée, pesée et mesurée au hub de départ', 20, 0, 0, 1),
('PACKED_READY', 'Prêt pour expédition', 'Colis reconditionné et groupé pour le départ', 30, 0, 0, 1),
('IN_TRANSIT', 'En cours d''acheminement', 'En vol aérien, en mer ou en convoi routier', 40, 0, 0, 1),
('CUSTOMS_HOLD', 'Dédouanement en cours', 'Formalités et inspection douanière à destination', 50, 0, 0, 1),
('ARRIVED_DESTINATION', 'Arrivé à destination', 'Déchargé et réceptionné à l''agence locale', 60, 0, 0, 1),
('READY_FOR_PICKUP', 'Disponible au retrait', 'Colis prêt à être retiré par le client en agence', 70, 0, 0, 1),
('OUT_FOR_DELIVERY', 'En cours de livraison', 'Livreur en route vers l''adresse du destinataire', 80, 0, 0, 1),
('DELIVERED', 'Livré', 'Marchandise remise au destinataire', 90, 1, 0, 1),
('INCIDENT', 'Attention requise', 'Retard météo, inspection douanière ou anomalie signalée', 95, 0, 0, 1),
('CANCELLED', 'Annulé', 'Dossier d''expédition annulé', 100, 1, 1, 1);

-- 3. Modes de transport initiaux
INSERT OR IGNORE INTO shipping_modes (id, name, type, pricing_basis, is_active, sort_order) VALUES
('AIR_EXPRESS', 'Fret Aérien Express (3-5 jours)', 'AIR', 'PER_KG', 1, 1),
('AIR_STANDARD', 'Fret Aérien Standard (7-10 jours)', 'AIR', 'PER_KG', 1, 2),
('SEA_LCL', 'Fret Maritime Groupage (LCL)', 'SEA', 'PER_CBM', 1, 3),
('ROAD_STANDARD', 'Fret Terrestre Transfrontalier', 'ROAD', 'PER_KG', 1, 4);

-- 4. Routes initiales configurables
INSERT OR IGNORE INTO routes (id, origin_country, origin_city, destination_country, destination_city, is_active) VALUES
('route-cn-ml', 'Chine', 'Guangzhou', 'Mali', 'Bamako', 1),
('route-ae-ci', 'Émirats Arabes Unis', 'Dubaï', 'Côte d''Ivoire', 'Abidjan', 1),
('route-ma-sn', 'Maroc', 'Casablanca', 'Sénégal', 'Dakar', 1),
('route-cn-gn', 'Chine', 'Guangzhou', 'Guinée', 'Conakry', 1);

-- 5. Tarifs indicatifs initiaux (modifiables à tout moment depuis l'admin)
-- 12.50 USD/kg = 1250 minor units ; 250 USD/CBM = 25000 minor units
INSERT OR IGNORE INTO tariffs (id, route_id, shipping_mode_id, currency, price_per_unit_minor, minimum_charge_minor, estimated_days_min, estimated_days_max, is_active) VALUES
('tariff-cn-ml-air-exp', 'route-cn-ml', 'AIR_EXPRESS', 'USD', 1400, 2800, 3, 5, 1),
('tariff-cn-ml-air-std', 'route-cn-ml', 'AIR_STANDARD', 'USD', 1050, 2100, 7, 10, 1),
('tariff-cn-ml-sea', 'route-cn-ml', 'SEA_LCL', 'USD', 28000, 15000, 35, 45, 1),
('tariff-ae-ci-air-exp', 'route-ae-ci', 'AIR_EXPRESS', 'USD', 1300, 2600, 3, 6, 1),
('tariff-ma-sn-road', 'route-ma-sn', 'ROAD_STANDARD', 'USD', 450, 1500, 10, 15, 1);
