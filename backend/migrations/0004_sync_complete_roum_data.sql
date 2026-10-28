-- Migration 0004 : Synchronisation intégrale de la base de données ROUM TRANSIT (D1 SQLite)
-- Intègre l'ensemble des 19 tarifs officiels des 3 flyers, les routes, clients, expéditions et paramètres.

-- 1. Ajout sécurisé des colonnes optionnelles category_tag et note sur la table tariffs
ALTER TABLE tariffs ADD COLUMN category_tag TEXT;
ALTER TABLE tariffs ADD COLUMN note TEXT;

-- 2. Nettoyage sécurisé des anciens enregistrements de test temporaires
DELETE FROM tracking_events WHERE shipment_id = '2e1de0a3-b334-424a-999b-c415fc40602e' OR shipment_id LIKE 'sh-%';
DELETE FROM parcels WHERE shipment_id = '2e1de0a3-b334-424a-999b-c415fc40602e' OR shipment_id LIKE 'sh-%';
DELETE FROM shipments WHERE id = '2e1de0a3-b334-424a-999b-c415fc40602e' OR id LIKE 'sh-%' OR tracking_number LIKE 'RM-%';
DELETE FROM tariffs;

-- 3. Modes de transport officiels complets
INSERT INTO shipping_modes (id, name, type, pricing_basis, is_active, sort_order) VALUES
('AIR_EXPRESS', 'Voie Express (4 jours)', 'AIR', 'PER_KG', 1, 1),
('AIR_STANDARD', 'Voie Normale (2 semaines)', 'AIR', 'PER_KG', 1, 2),
('AIR_SPECIAL', 'Complément alimentaire + Batterie', 'AIR', 'PER_KG', 1, 3),
('AIR_TECH', 'Pièce d''ordinateur & High-Tech', 'AIR', 'FIXED', 1, 4),
('AIR_COSMETIC', 'Cosmétique et liquide', 'AIR', 'PER_KG', 1, 5),
('AIR_DOC', 'Document administratif (pli express)', 'AIR', 'FIXED', 1, 6),
('SEA_LCL', 'Par Bateau (Le CBM)', 'SEA', 'PER_CBM', 1, 7),
('ROAD_STANDARD', 'Voie Terrestre Transfrontalière', 'ROAD', 'PER_KG', 1, 8)
ON CONFLICT(id) DO UPDATE SET 
  name=excluded.name, 
  type=excluded.type, 
  pricing_basis=excluded.pricing_basis, 
  is_active=excluded.is_active, 
  sort_order=excluded.sort_order;

-- 4. Routes opérationnelles de ROUM TRANSIT
INSERT INTO routes (id, origin_country, origin_city, destination_country, destination_city, is_active) VALUES
('route-cn-ci-gz', 'Chine', 'Guangzhou', 'Côte d''Ivoire', 'Abidjan', 1),
('route-cn-ci-yw', 'Chine', 'Yiwu', 'Côte d''Ivoire', 'Abidjan', 1),
('route-cn-ml-gz', 'Chine', 'Guangzhou', 'Mali', 'Bamako', 1),
('route-cn-sn-gz', 'Chine', 'Guangzhou', 'Sénégal', 'Dakar', 1),
('route-cn-gn-gz', 'Chine', 'Guangzhou', 'Guinée', 'Conakry', 1),
('route-cn-tg-yw', 'Chine', 'Yiwu', 'Togo', 'Lomé', 1),
('route-cn-bj-gz', 'Chine', 'Guangzhou', 'Bénin', 'Cotonou', 1),
('route-cn-cm-gz', 'Chine', 'Guangzhou', 'Cameroun', 'Douala', 1),
('route-ae-ci-dxb', 'Émirats Arabes Unis', 'Dubaï', 'Côte d''Ivoire', 'Abidjan', 1),
('route-ae-ml-dxb', 'Émirats Arabes Unis', 'Dubaï', 'Mali', 'Bamako', 1),
('route-ae-sn-dxb', 'Émirats Arabes Unis', 'Dubaï', 'Sénégal', 'Dakar', 1),
('route-ma-ci-casa', 'Maroc', 'Casablanca', 'Côte d''Ivoire', 'Abidjan', 1),
('route-ma-sn-casa', 'Maroc', 'Casablanca', 'Sénégal', 'Dakar', 1),
('route-ma-ml-casa', 'Maroc', 'Casablanca', 'Mali', 'Bamako', 1),
('route-ma-bf-casa', 'Maroc', 'Casablanca', 'Burkina Faso', 'Ouagadougou', 1),
('route-ma-ga-casa', 'Maroc', 'Casablanca', 'Gabon', 'Libreville', 1),
('route-fr-ci-par', 'France', 'Paris', 'Côte d''Ivoire', 'Abidjan', 1),
('route-ci-fr-abj', 'Côte d''Ivoire', 'Abidjan', 'France', 'Paris', 1),
('route-cn-ml', 'Chine', 'Guangzhou', 'Mali', 'Bamako', 1),
('route-cn-gn', 'Chine', 'Guangzhou', 'Guinée', 'Conakry', 1),
('route-ae-ci', 'Émirats Arabes Unis', 'Dubaï', 'Côte d''Ivoire', 'Abidjan', 1),
('route-ma-sn', 'Maroc', 'Casablanca', 'Sénégal', 'Dakar', 1)
ON CONFLICT(id) DO UPDATE SET 
  origin_country=excluded.origin_country, 
  origin_city=excluded.origin_city, 
  destination_country=excluded.destination_country, 
  destination_city=excluded.destination_city, 
  is_active=excluded.is_active;

-- 5. Les 19 Tarifs Officiels extraits directement des 3 Flyers Réels (FCFA & EUR)
INSERT INTO tariffs (
  id, route_id, shipping_mode_id, currency, price_per_unit_minor,
  minimum_charge_minor, estimated_days_min, estimated_days_max,
  category_tag, note, is_active
) VALUES
-- Flyer 1 : Chine & Dubaï ➔ Afrique (Côte d'Ivoire)
('tariff-cn-ci-express', 'route-cn-ci-gz', 'AIR_EXPRESS', 'FCFA', 1200000, 1200000, 4, 5, 'Voie Express ⚡', 'Livraison ultra-rapide en 4 jours', 1),
('tariff-cn-ci-normal', 'route-cn-ci-gz', 'AIR_STANDARD', 'FCFA', 1000000, 1000000, 12, 14, 'Voie Normale ✈️', 'Économique · 2 semaines', 1),
('tariff-cn-ci-special', 'route-cn-ci-gz', 'AIR_SPECIAL', 'FCFA', 1400000, 1400000, 7, 10, 'Batteries & Compléments 🔋', 'Produits sous réglementation spéciale', 1),
('tariff-cn-ci-tech', 'route-cn-ci-gz', 'AIR_TECH', 'FCFA', 5000000, 5000000, 4, 7, 'High-Tech & PC 💻', 'Pièce d''ordinateur & matériel high-tech (unité)', 1),
('tariff-cn-ci-sea', 'route-cn-ci-yw', 'SEA_LCL', 'FCFA', 30000000, 30000000, 35, 45, 'Maritime CBM 🚢', 'Groupage LCL conteneur sécurisé au m³', 1),
('tariff-ae-ci-express', 'route-ae-ci-dxb', 'AIR_EXPRESS', 'FCFA', 1200000, 1200000, 4, 5, 'Voie Express ⚡', 'Dubaï vers Abidjan en 4 jours chrono', 1),
('tariff-ae-ci-normal', 'route-ae-ci-dxb', 'AIR_STANDARD', 'FCFA', 1000000, 1000000, 10, 14, 'Voie Normale ✈️', 'Dubaï régulier 2 semaines', 1),
('tariff-ae-ci-sea', 'route-ae-ci-dxb', 'SEA_LCL', 'FCFA', 30000000, 30000000, 25, 35, 'Maritime CBM 🚢', 'Conteneur sécurisé Dubaï au m³', 1),

-- Flyer 2 : Maroc ➔ 5 Pays Subsahariens (5 jours garantis)
('tariff-ma-ci-sub', 'route-ma-ci-casa', 'AIR_EXPRESS', 'FCFA', 650000, 650000, 5, 5, 'Subsaharien 5j 🇲🇦', 'Délai 5 jours garantis · N°1 Groupage Aérien', 1),
('tariff-ma-sn-sub', 'route-ma-sn-casa', 'AIR_EXPRESS', 'FCFA', 700000, 700000, 5, 5, 'Subsaharien 5j 🇲🇦', 'Délai 5 jours garantis · Casablanca ➔ Dakar', 1),
('tariff-ma-ml-sub', 'route-ma-ml-casa', 'AIR_EXPRESS', 'FCFA', 700000, 700000, 5, 5, 'Subsaharien 5j 🇲🇦', 'Délai 5 jours garantis · Casablanca ➔ Bamako', 1),
('tariff-ma-bf-sub', 'route-ma-bf-casa', 'AIR_EXPRESS', 'FCFA', 750000, 750000, 5, 5, 'Subsaharien 5j 🇲🇦', 'Délai 5 jours garantis · Casablanca ➔ Ouaga', 1),
('tariff-ma-ga-sub', 'route-ma-ga-casa', 'AIR_EXPRESS', 'FCFA', 750000, 750000, 5, 5, 'Subsaharien 5j 🇲🇦', 'Délai 5 jours garantis · Casablanca ➔ Libreville', 1),

-- Flyer 3 : Paris ↔ Abidjan (Bilatéral)
('tariff-fr-ci-divers', 'route-fr-ci-par', 'AIR_STANDARD', 'FCFA', 850000, 850000, 3, 5, 'Paris ➔ Abidjan 🛒', 'Divers articles : 8 500 F / 12 € kg', 1),
('tariff-fr-ci-cosmetic', 'route-fr-ci-par', 'AIR_COSMETIC', 'FCFA', 900000, 900000, 3, 5, 'Paris ➔ Abidjan 🧴', 'Cosmétique et liquide : 9 000 F / 14 € kg', 1),
('tariff-fr-ci-doc', 'route-fr-ci-par', 'AIR_DOC', 'FCFA', 1300000, 1300000, 2, 4, 'Paris ➔ Abidjan 📄', 'Document administratif : 13 000 F / 20 € pli express', 1),
('tariff-ci-fr-divers', 'route-ci-fr-abj', 'AIR_STANDARD', 'FCFA', 850000, 850000, 3, 5, 'Abidjan ➔ Paris 🛒', 'Divers articles : 8 500 F / 12 € kg', 1),
('tariff-ci-fr-cosmetic', 'route-ci-fr-abj', 'AIR_COSMETIC', 'FCFA', 900000, 900000, 3, 5, 'Abidjan ➔ Paris 🧴', 'Cosmétique et liquide : 9 000 F / 14 € kg', 1),
('tariff-ci-fr-doc', 'route-ci-fr-abj', 'AIR_DOC', 'FCFA', 1300000, 1300000, 2, 4, 'Abidjan ➔ Paris 📄', 'Document administratif : 13 000 F / 20 € pli express', 1)
ON CONFLICT(id) DO UPDATE SET 
  route_id=excluded.route_id,
  shipping_mode_id=excluded.shipping_mode_id,
  currency=excluded.currency,
  price_per_unit_minor=excluded.price_per_unit_minor,
  minimum_charge_minor=excluded.minimum_charge_minor,
  estimated_days_min=excluded.estimated_days_min,
  estimated_days_max=excluded.estimated_days_max,
  category_tag=excluded.category_tag,
  note=excluded.note,
  is_active=excluded.is_active;

-- 6. Clients réels
INSERT INTO clients (id, full_name, phone_whatsapp, email, city, country) VALUES
('cli-01', 'Aminata Diallo', '+22376123456', 'aminata.diallo@gmail.com', 'Bamako', 'Mali'),
('cli-02', 'Ibrahim Traoré', '+22507456789', 'ibrahim.traore@yahoo.fr', 'Abidjan', 'Côte d''Ivoire'),
('cli-03', 'Khadija Diop', '+22177890123', 'khadija.diop@orange.sn', 'Dakar', 'Sénégal'),
('cli-04', 'Boubacar Cissé', '+22462112233', 'boubacar.cisse@gmail.com', 'Conakry', 'Guinée'),
('cli-05', 'Oumar Sidibé', '+22366778899', 'oumar.sidibe@gmail.com', 'Bamako', 'Mali'),
('cli-06', 'Fanta Coulibaly', '+22890123456', 'fanta.coulibaly@moov.tg', 'Lomé', 'Togo'),
('cli-07', 'Mamadou Camara', '+22370889900', 'mamadou.camara@malitel.ml', 'Bamako', 'Mali'),
('cli-08', 'Moussa Konaté', '+22365443322', 'moussa.konate@gmail.com', 'Bamako', 'Mali'),
('cli-09', 'Awa Sanogo', '+22379001122', 'awa.sanogo@gmail.com', 'Bamako', 'Mali'),
('cli-10', 'Seydou Keita', '+22505667788', 'seydou.keita@ci.com', 'Abidjan', 'Côte d''Ivoire'),
('cli-11', 'Fatoumata Bamba', '+22170334455', 'fatou.bamba@gmail.com', 'Dakar', 'Sénégal'),
('cli-12', 'Cheick Oumar', '+22466554433', 'cheick.oumar@gn.com', 'Conakry', 'Guinée'),
('cli-13', 'Marie-Claire Kouassi', '+22501223344', 'mc.kouassi@avocat.ci', 'Abidjan', 'Côte d''Ivoire'),
('cli-14', 'Bakary Dembélé', '+22378998877', 'bakary.dembele@sotelma.ml', 'Bamako', 'Mali'),
('cli-15', 'Salif Traoré', '+22507889900', 'salif.traore@boutique.ci', 'Abidjan', 'Côte d''Ivoire')
ON CONFLICT(id) DO UPDATE SET 
  full_name=excluded.full_name,
  phone_whatsapp=excluded.phone_whatsapp,
  email=excluded.email,
  city=excluded.city,
  country=excluded.country;

-- 7. Les 15 Expéditions de Référence synchronisées avec le Globe 3D et le Suivi Public
INSERT INTO shipments (
  id, tracking_number, client_id, route_id, shipping_mode_id, current_status,
  total_parcels_count, total_weight_kg, total_volume_cbm, estimated_price_minor,
  final_price_minor, currency, payment_status, created_at, updated_at
) VALUES
('sh-01', 'RM-AIR-2610-K8P9Q2', 'cli-01', 'route-cn-ml-gz', 'AIR_EXPRESS', 'IN_TRANSIT', 1, 18.5, 0.12, 22200000, 22200000, 'FCFA', 'PAID', datetime('now', '-3 days'), datetime('now', '-4 hours')),
('sh-02', 'RM-SEA-2610-M4V7W1', 'cli-02', 'route-cn-ci-yw', 'SEA_LCL', 'IN_TRANSIT', 6, 420.0, 2.80, 84000000, 84000000, 'FCFA', 'PAID', datetime('now', '-14 days'), datetime('now', '-1 day')),
('sh-03', 'RM-AIR-2610-R3T9Y5', 'cli-03', 'route-ae-sn-dxb', 'AIR_EXPRESS', 'IN_TRANSIT', 2, 34.0, 0.25, 40800000, 40800000, 'FCFA', 'PAID', datetime('now', '-2 days'), datetime('now', '-6 hours')),
('sh-04', 'RM-AIR-2610-P7L2M8', 'cli-04', 'route-ma-ci-casa', 'AIR_EXPRESS', 'IN_TRANSIT', 1, 28.0, 0.18, 18200000, 18200000, 'FCFA', 'PAID', datetime('now', '-1 day'), datetime('now', '-3 hours')),
('sh-05', 'RM-AIR-2610-Q9HLSS', 'cli-05', 'route-cn-ml-gz', 'AIR_STANDARD', 'IN_TRANSIT', 1, 14.5, 0.09, 14500000, 14500000, 'FCFA', 'PAID', datetime('now', '-6 days'), datetime('now', '-1 day')),
('sh-06', 'RM-SEA-2610-C5D6E7', 'cli-06', 'route-cn-tg-yw', 'SEA_LCL', 'IN_TRANSIT', 4, 310.0, 2.10, 63000000, 63000000, 'FCFA', 'PAID', datetime('now', '-18 days'), datetime('now', '-2 days')),
('sh-07', 'RM-AIR-2610-W2X3Y4', 'cli-07', 'route-ae-ml-dxb', 'AIR_STANDARD', 'IN_TRANSIT', 1, 25.0, 0.16, 25000000, 25000000, 'FCFA', 'PAID', datetime('now', '-5 days'), datetime('now', '-8 hours')),
('sh-08', 'RM-AIR-2610-B1C2D3', 'cli-08', 'route-cn-ml-gz', 'AIR_EXPRESS', 'DELIVERED', 1, 22.0, 0.15, 26400000, 26400000, 'FCFA', 'PAID', datetime('now', '-8 days'), datetime('now', '-1 day')),
('sh-09', 'RM-SEA-2610-E5F6G7', 'cli-09', 'route-ma-ml-casa', 'SEA_LCL', 'DELIVERED', 2, 180.0, 1.40, 42000000, 42000000, 'FCFA', 'PAID', datetime('now', '-22 days'), datetime('now', '-2 days')),
('sh-10', 'RM-AIR-2610-Y9Z1A2', 'cli-10', 'route-ae-ci-dxb', 'AIR_EXPRESS', 'DELIVERED', 1, 19.0, 0.11, 22800000, 22800000, 'FCFA', 'PAID', datetime('now', '-7 days'), datetime('now', '-1 day')),
('sh-11', 'RM-AIR-2610-J4K5L6', 'cli-11', 'route-ma-sn-casa', 'AIR_EXPRESS', 'DELIVERED', 1, 16.5, 0.10, 11550000, 11550000, 'FCFA', 'PAID', datetime('now', '-9 days'), datetime('now', '-3 days')),
('sh-12', 'RM-SEA-2610-N7P8Q9', 'cli-12', 'route-cn-gn-gz', 'SEA_LCL', 'DELIVERED', 3, 290.0, 1.95, 58500000, 58500000, 'FCFA', 'PAID', datetime('now', '-30 days'), datetime('now', '-4 days')),
('sh-13', 'RM-AIR-2610-U1V2W3', 'cli-13', 'route-fr-ci-par', 'AIR_EXPRESS', 'IN_TRANSIT', 1, 8.0, 0.05, 6800000, 6800000, 'FCFA', 'PAID', datetime('now', '-1 day'), datetime('now', '-2 hours')),
('sh-14', 'RM-AIR-2610-D8E9F1', 'cli-14', 'route-cn-ml-gz', 'AIR_EXPRESS', 'RECEIVED_AT_HUB', 1, 12.0, 0.08, 14400000, 14400000, 'FCFA', 'PENDING', datetime('now', '-4 hours'), datetime('now', '-1 hour')),
('sh-15', 'RM-SEA-2610-S4T5U6', 'cli-15', 'route-cn-ci-yw', 'SEA_LCL', 'RECEIVED_AT_HUB', 5, 250.0, 1.80, 54000000, 54000000, 'FCFA', 'PENDING', datetime('now', '-6 hours'), datetime('now', '-2 hours'))
ON CONFLICT(id) DO UPDATE SET 
  tracking_number=excluded.tracking_number,
  client_id=excluded.client_id,
  route_id=excluded.route_id,
  shipping_mode_id=excluded.shipping_mode_id,
  current_status=excluded.current_status,
  total_parcels_count=excluded.total_parcels_count,
  total_weight_kg=excluded.total_weight_kg,
  total_volume_cbm=excluded.total_volume_cbm,
  estimated_price_minor=excluded.estimated_price_minor,
  final_price_minor=excluded.final_price_minor,
  currency=excluded.currency,
  payment_status=excluded.payment_status,
  updated_at=excluded.updated_at;

-- 8. Événements de suivi pour les expéditions
INSERT INTO tracking_events (id, shipment_id, status, location, comment, event_timestamp) VALUES
('ev-01a', 'sh-01', 'RECEIVED_AT_HUB', 'Guangzhou, Chine', 'Colis réceptionné, pesé (18.5 kg) et étiqueté au Hub de Guangzhou', datetime('now', '-3 days')),
('ev-01b', 'sh-01', 'PACKED_READY', 'Guangzhou, Chine', 'Groupage terminé, mis sur palette cargo', datetime('now', '-2 days')),
('ev-01c', 'sh-01', 'IN_TRANSIT', 'Aéroport Guangzhou Baiyun (CAN)', 'En vol vers Bamako via vol régulier cargo', datetime('now', '-4 hours')),

('ev-02a', 'sh-02', 'RECEIVED_AT_HUB', 'Yiwu, Chine', 'Réception magasin Yiwu (420 kg, 2.8 CBM)', datetime('now', '-14 days')),
('ev-02b', 'sh-02', 'IN_TRANSIT', 'Port de Ningbo-Zhoushan', 'Conteneur scellé à bord du navire en mer', datetime('now', '-10 days')),

('ev-13a', 'sh-13', 'RECEIVED_AT_HUB', 'Paris, France', 'Colis réceptionné agence Paris Nord (8 kg)', datetime('now', '-1 day')),
('ev-13b', 'sh-13', 'IN_TRANSIT', 'Aéroport Paris Charles de Gaulle (CDG)', 'En vol vers Abidjan FHB', datetime('now', '-2 hours')),

('ev-14a', 'sh-14', 'RECEIVED_AT_HUB', 'Guangzhou, Chine', 'Colis réceptionné et en cours de pesée au hub de départ', datetime('now', '-4 hours')),

('ev-15a', 'sh-15', 'RECEIVED_AT_HUB', 'Yiwu, Chine', 'Marchandises réceptionnées à l''entrepôt de Yiwu pour empotage conteneur', datetime('now', '-6 hours'))
ON CONFLICT(id) DO UPDATE SET 
  status=excluded.status,
  location=excluded.location,
  comment=excluded.comment,
  event_timestamp=excluded.event_timestamp;

-- 9. Colis individuels
INSERT INTO parcels (id, shipment_id, parcel_index, package_label, weight_kg, description) VALUES
('pcl-01', 'sh-01', 1, 'Colis 1/1', 18.5, 'Vêtements de prêt-à-porter et accessoires pour boutique Bamako'),
('pcl-02', 'sh-02', 1, 'Palette 1/2', 210.0, 'Chaussures et maroquinerie de gros'),
('pcl-02b', 'sh-02', 2, 'Palette 2/2', 210.0, 'Articles de bazar et cosmétiques'),
('pcl-13', 'sh-13', 1, 'Carton 1/1', 8.0, 'Effets personnels et parfumerie Paris ➔ Abidjan'),
('pcl-14', 'sh-14', 1, 'Carton 1/1', 12.0, 'Échantillons textiles en préparation pour expédition aérienne express'),
('pcl-15', 'sh-15', 1, 'Lot 1/5', 250.0, 'Quincaillerie et outillage en cours d''empotage')
ON CONFLICT(id) DO UPDATE SET 
  package_label=excluded.package_label,
  weight_kg=excluded.weight_kg,
  description=excluded.description;

-- 10. Paramètres de l'entreprise officiels
INSERT INTO business_settings (key, value) VALUES
('whatsapp_support', '+2250153638569'),
('whatsapp_contact_secondary', '+2250153638569'),
('official_agency_address', 'Abidjan Bingerville, Côte d''Ivoire'),
('hub_guangzhou_address', 'Guangzhou Baiyun Logistics Center, Guangdong, Chine'),
('hub_dubai_address', 'Deira Al Ras Cargo Hub, Dubaï, UAE'),
('hub_casablanca_address', 'Zone Logistique Aéroport Mohammed V, Casablanca, Maroc'),
('hub_paris_address', 'Zone Cargo Roissy CDG / Paris Nord, France'),
('social_instagram', '@roum_transittt'),
('social_tiktok', '@roum_transit'),
('service_commitment_morocco', 'Délai garanti 5 jours ouvrés'),
('service_commitment_china_express', 'Voie Express 4 jours ouvrés')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;
