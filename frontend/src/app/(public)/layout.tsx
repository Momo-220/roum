import Link from "next/link";
import { Phone } from "lucide-react";

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
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--brown-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FAF8F5",
                fontWeight: "800",
                fontSize: "1.15rem",
              }}
            >
              RT
            </div>
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
              <h4 style={{ color: "var(--text-main)", marginBottom: "14px", fontSize: "1.05rem" }}>
                ROUM TRANSIT
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Spécialiste du transport de fret maritime, aérien et de l&apos;approvisionnement international
                au départ de la Chine, Dubaï et du Maroc vers l&apos;Afrique de l&apos;Ouest et Centrale.
              </p>
            </div>

            <div>
              <h4 style={{ color: "var(--text-main)", marginBottom: "14px", fontSize: "1.05rem" }}>
                Liaisons Principales
              </h4>
              <ul style={{ listStyle: "none", color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "2" }}>
                <li>🇨🇳 Guangzhou / Yiwu → 🇲🇱 Bamako, 🇬🇳 Conakry</li>
                <li>🇦🇪 Dubaï → 🇨🇮 Abidjan, 🇸🇳 Dakar</li>
                <li>🇲🇦 Casablanca → 🇸🇳 Dakar, 🇲🇱 Bamako</li>
                <li>Fret Maritime Groupage (LCL) & Aérien Express</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: "var(--text-main)", marginBottom: "14px", fontSize: "1.05rem" }}>
                Contact & Assistance
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "14px" }}>
                Assistance directe par WhatsApp 7j/7 pour vos demandes et expéditions.
              </p>
              <a
                href="https://wa.me/22370000000"
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
