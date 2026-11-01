"use client";

import Link from "next/link";
import { Plane, Ship, PackageCheck, ShieldCheck, ArrowRight, MessageCircle } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function ServicesPage() {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111827",
        minHeight: "calc(100vh - 110px)",
        padding: "48px 20px 64px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "#F3F4F6",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
              }}
            >
              Ce que nous faisons
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#111827",
                margin: "0 0 12px 0",
              }}
            >
              Nos Services de Fret
            </h1>

            <p style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "600px", margin: "0 auto", lineHeight: 1.55 }}>
              Des solutions simples pour faire voyager vos marchandises en toute tranquillité, sans aucun frais caché.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Service 1 : Avion */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <Plane size={24} color="#FFFFFF" />
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Fret Aérien Express (Avion)
                </h2>

                <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                  Le moyen le plus rapide pour vos téléphones, ordinateurs, vêtements et petits colis personnels.
                </p>

                <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 700, marginBottom: "22px" }}>
                  Délai : 4 à 5 jours seulement
                </div>
              </div>

              <Link
                href="/tariffs"
                className="roum-btn-primary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem" }}
              >
                <span>Calculer le tarif avion</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Service 2 : Bateau */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <Ship size={24} color="#FFFFFF" />
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Fret Maritime (Bateau)
                </h2>

                <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                  Le choix le plus économique pour les gros cartons, meubles, machines et marchandises au mètre cube (CBM).
                </p>

                <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 700, marginBottom: "22px" }}>
                  Délai : 35 à 45 jours par conteneur
                </div>
              </div>

              <Link
                href="/tariffs"
                className="roum-btn-secondary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem" }}
              >
                <span>Calculer le tarif bateau</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Service 3 : Réception Fournisseur */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <PackageCheck size={24} color="#FFFFFF" />
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Réception Magasin & Contrôle
                </h2>

                <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                  Nos entrepôts reçoivent vos commandes de 1688, Taobao ou usines, vérifient les colis et les pèsent directement.
                </p>

                <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 700, marginBottom: "22px" }}>
                  Pesée certifiée au gramme près
                </div>
              </div>

              <Link
                href="/warehouses"
                className="roum-btn-secondary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem" }}
              >
                <span>Voir les adresses magasins</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Service 4 : Dédouanement */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <ShieldCheck size={24} color="#FFFFFF" />
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
                  Douane Incluse & Retrait Agence
                </h2>

                <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                  Zéro mauvaise surprise à l&apos;arrivée. Vous venez simplement retirer vos colis à notre agence de Bingerville.
                </p>

                <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 700, marginBottom: "22px" }}>
                  Dédouanement 100% géré par nos soins
                </div>
              </div>

              <a
                href="https://wa.me/2250153638569?text=Bonjour%20Roum%20Transit,%20je%20souhaite%20des%20informations%20sur%20vos%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="roum-btn-secondary"
                style={{ width: "100%", boxSizing: "border-box", fontSize: "0.86rem" }}
              >
                <MessageCircle size={15} />
                <span>Poser une question</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
