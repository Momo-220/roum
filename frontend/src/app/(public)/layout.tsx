import Link from "next/link";
import { Phone, Ship, MapPin } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navigation Bar Publique */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1px solid var(--border-light)",
          padding: "16px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
            }}
          >
            <img
              src="/images/roum-logo.jpg"
              alt="Logo Officiel Roum Transit"
              style={{
                height: "56px",
                width: "auto",
                borderRadius: "12px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
                display: "block",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  letterSpacing: "-0.01em",
                  color: "var(--text-main)",
                  lineHeight: "1.1",
                }}
              >
                ROUM TRANSIT
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  color: "var(--brown-light)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                WHOLESALE & BOUTIQUE
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <Link
              href="/#tracking"
              style={{
                fontSize: "0.92rem",
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}
            >
              Suivi de Colis
            </Link>
            <Link
              href="/#tariffs"
              style={{
                fontSize: "0.92rem",
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}
            >
              Tarifs & Simulateur
            </Link>
            <Link
              href="/#services"
              style={{
                fontSize: "0.92rem",
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}
            >
              Nos Services
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenu de la page */}
      <main>{children}</main>

      {/* Footer Public */}
      <footer
        style={{
          marginTop: "80px",
          borderTop: "1px solid var(--border-light)",
          background: "#FFFFFF",
          padding: "50px 0 30px 0",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "40px",
              marginBottom: "36px",
            }}
          >
            <div>
              <img
                src="/images/roum-logo.jpg"
                alt="Logo Officiel Roum Transit"
                style={{
                  width: "100%",
                  maxWidth: "200px",
                  height: "auto",
                  borderRadius: "14px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                  marginBottom: "16px",
                  display: "block",
                }}
              />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Spécialiste du transport par voie maritime, aérienne et de l&apos;approvisionnement international
                au départ de la Chine, Dubaï et du Maroc vers l&apos;Afrique de l&apos;Ouest et Centrale.
              </p>
            </div>

            <div>
              <h4 style={{ color: "var(--text-main)", marginBottom: "14px", fontSize: "1.05rem" }}>
                Liaisons Principales
              </h4>
              <ul style={{ listStyle: "none", color: "var(--text-secondary)", fontSize: "0.85rem", display: "grid", gap: "10px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="CN" size={15} />
                  <span>Guangzhou / Yiwu → Abidjan, Dakar, Bamako</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="AE" size={15} />
                  <span>Dubaï → Abidjan, Ouagadougou, Libreville</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="MA" size={15} />
                  <span>Maroc → 5 Pays Subsahariens (5j Chrono)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="FR" size={15} />
                  <span>Paris ↔ Abidjan (Aérien Bilatéral F/€)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Ship size={15} color="#0284c7" />
                  <span>Voie Maritime Groupage (300 000 F / CBM)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: "var(--text-main)", marginBottom: "14px", fontSize: "1.05rem" }}>
                Contact & Agence
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={15} color="var(--brown-dark)" />
                Agence : Abidjan Bingerville, Côte d&apos;Ivoire
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "14px", lineHeight: "1.5" }}>
                WhatsApp : <strong>+225 01 53 638 569</strong><br />
                Instagram : @roum_transittt • TikTok : @roum_transit
              </p>
              <a
                href="https://wa.me/2250153638569"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ width: "fit-content", padding: "10px 18px", fontSize: "0.85rem" }}
              >
                <Phone size={16} />
                Contacter sur WhatsApp
              </a>
            </div>
          </div>

          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            <div>© 2026 ROUM TRANSIT — Tous droits réservés.</div>
            <div>Conçu pour une transparence totale et zéro perte de colis.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
