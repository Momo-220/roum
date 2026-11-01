"use client";

import Link from "next/link";
import {
  Plane,
  Clock,
  Ship,
  BatteryCharging,
  Laptop,
  Sparkles,
  FileText,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

interface ServiceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  delay: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  actionLabel: string;
  actionHref: string;
  isExternal?: boolean;
  highlight?: boolean;
}

const ALL_SERVICES: ServiceItem[] = [
  {
    id: "air-express",
    category: "Fret Aérien",
    title: "Voie Express Aérienne",
    description:
      "Le moyen le plus rapide pour vos téléphones, ordinateurs, vêtements et petits colis personnels. Départs réguliers depuis la Chine, Dubaï, le Maroc et la France.",
    delay: "4 à 5 jours seulement",
    icon: Plane,
    actionLabel: "Calculer le tarif express",
    actionHref: "/tariffs",
    highlight: true,
  },
  {
    id: "air-standard",
    category: "Fret Aérien",
    title: "Voie Normale Économique",
    description:
      "La formule avion la plus avantageuse pour vos réapprovisionnements de marchandises régulières. Vous profitez d'un tarif au kilo réduit sans compromis sur la sécurité.",
    delay: "10 à 14 jours ouvrés",
    icon: Clock,
    actionLabel: "Voir les tarifs normaux",
    actionHref: "/tariffs",
  },
  {
    id: "sea-cbm",
    category: "Fret Maritime",
    title: "Maritime au Mètre Cube (CBM)",
    description:
      "Le choix économique idéal pour les gros volumes, cartons encombrants, meubles, machines et quincaillerie lourde. Groupage LCL sécurisé en conteneur scellé.",
    delay: "35 à 45 jours par conteneur",
    icon: Ship,
    actionLabel: "Estimer au mètre cube",
    actionHref: "/tariffs",
  },
  {
    id: "air-special",
    category: "Fret Spécialisé",
    title: "Batteries & Compléments Alimentaires",
    description:
      "Ligne cargo spéciale pour les articles sensibles ou sous réglementation stricte : batteries lithium, banques de charge (powerbanks), gélules et compléments alimentaires.",
    delay: "7 à 10 jours de transport",
    icon: BatteryCharging,
    actionLabel: "Voir les conditions spéciales",
    actionHref: "/tariffs",
  },
  {
    id: "air-tech",
    category: "High-Tech & Informatique",
    title: "Pièces d'Ordinateur & High-Tech",
    description:
      "Tarification forfaitaire par pièce pour les cartes mères, processeurs, composants informatiques, laptops et cartes graphiques manipulés avec soin maximal.",
    delay: "4 à 7 jours sécurisés",
    icon: Laptop,
    actionLabel: "Consulter le forfait high-tech",
    actionHref: "/tariffs",
  },
  {
    id: "air-cosmetic",
    category: "Cosmétiques & Parfumerie",
    title: "Cosmétiques, Parfumerie & Liquides",
    description:
      "Acheminement conforme et sécurisé pour vos crèmes pour le corps, lotions capillaires, sérums de beauté, shampoings et parfums fins de Dubaï ou Paris.",
    delay: "3 à 5 jours ouvrés",
    icon: Sparkles,
    actionLabel: "Voir les tarifs cosmétiques",
    actionHref: "/tariffs",
  },
  {
    id: "air-doc",
    category: "Documents & Plis",
    title: "Plis Administratifs & Documents Urgents",
    description:
      "Pochette scellée express pour l'envoi de documents légaux, contrats commerciaux, passeports, certificats et diplômes entre Paris, le Maroc et Abidjan.",
    delay: "2 à 4 jours de remise en main",
    icon: FileText,
    actionLabel: "Expédier un document",
    actionHref: "/tariffs",
  },
  {
    id: "sourcing-payment",
    category: "Commerce & Achats",
    title: "Paiement Fournisseurs (RMB & AED)",
    description:
      "Vous voulez acheter sur 1688, Taobao ou auprès d'usines en Chine et à Dubaï ? Roum règle directement vos fournisseurs en Yuans (RMB) ou Dirhams (AED) sans tracasserie de change.",
    delay: "Règlement effectué sous 24h",
    icon: CreditCard,
    actionLabel: "Demander une aide à l'achat",
    actionHref: "https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20je%20souhaite%20payer%20un%20fournisseur%20en%20Chine/Dubaï.",
    isExternal: true,
  },
  {
    id: "warehouse-reception",
    category: "Entrepôt & Pesée",
    title: "Réception Magasin & Pesée Certifiée",
    description:
      "Vos fournisseurs déposent vos colis dans nos entrepôts de Guangzhou, Yiwu, Dubaï, Casablanca ou Paris. Nous contrôlons l'état du carton et pesons chaque colis au gramme près.",
    delay: "Notification immédiate après pesée",
    icon: PackageCheck,
    actionLabel: "Voir les adresses magasins",
    actionHref: "/warehouses",
  },
  {
    id: "customs-clearance",
    category: "Dédouanement & Retrait",
    title: "Dédouanement Inclus & Retrait Agence",
    description:
      "Zéro formalité compliquée et aucun frais surprise à l'arrivée. Le dédouanement est 100% pris en charge par Roum Transit. Vos colis vous attendent à Bingerville Carrefour Safari.",
    delay: "Retrait direct du lundi au samedi",
    icon: ShieldCheck,
    actionLabel: "Emplacement agence Bingerville",
    actionHref: "/warehouses",
  },
];

export default function ServicesPage() {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "48px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        <ScrollReveal>
          {/* En-tête de la page */}
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "14px",
              }}
            >
              Catalogue Complet des Services
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "#111827",
                margin: "0 auto 14px auto",
                maxWidth: "760px",
                textWrap: "balance",
              }}
            >
              Tout ce que nous faisons pour transporter et sécuriser vos marchandises
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                color: "#4B5563",
                maxWidth: "640px",
                margin: "0 auto",
                lineHeight: 1.6,
                textWrap: "pretty",
              }}
            >
              Du petit colis express de 4 jours au conteneur maritime complet, en passant par le paiement de vos fournisseurs et le dédouanement garanti.
            </p>
          </div>

          {/* Grille complète des 10 services */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {ALL_SERVICES.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: srv.highlight ? "2px solid #111827" : "1px solid #E5E7EB",
                    borderRadius: "14px",
                    padding: "26px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: srv.highlight
                      ? "0 8px 24px -4px rgba(17, 24, 39, 0.08)"
                      : "0 2px 8px rgba(0, 0, 0, 0.03)",
                    position: "relative",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "18px",
                      }}
                    >
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "10px",
                          backgroundColor: "#111827",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={22} color="#FFFFFF" strokeWidth={2.2} />
                      </div>

                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#6B7280",
                          backgroundColor: "#F9FAFB",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          border: "1px solid #E5E7EB",
                        }}
                      >
                        {srv.category}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "#111827",
                        letterSpacing: "-0.01em",
                        margin: "0 0 10px 0",
                      }}
                    >
                      {srv.title}
                    </h2>

                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "#4B5563",
                        lineHeight: 1.55,
                        margin: "0 0 16px 0",
                      }}
                    >
                      {srv.description}
                    </p>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#111827",
                        backgroundColor: "#F3F4F6",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        display: "inline-block",
                        marginBottom: "22px",
                      }}
                    >
                      Délai : {srv.delay}
                    </div>
                  </div>

                  <div>
                    {srv.isExternal ? (
                      <a
                        href={srv.actionHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="roum-btn-secondary"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          fontSize: "0.86rem",
                        }}
                      >
                        <span>{srv.actionLabel}</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <Link
                        href={srv.actionHref}
                        className={srv.highlight ? "roum-btn-primary" : "roum-btn-secondary"}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          fontSize: "0.86rem",
                        }}
                      >
                        <span>{srv.actionLabel}</span>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
