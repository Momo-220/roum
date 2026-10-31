import Link from "next/link";
import { Ship, MapPin } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navigation Header Épurée & Minimaliste */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          padding: "12px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Logo Officiel */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src="/images/roum-logo-tight.png"
              alt="Roum Transit"
              style={{
                height: "52px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>

          {/* Navigation Simple Mobile & Desktop */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <Link
              href="/#tracking"
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#4B5563",
                textDecoration: "none",
              }}
            >
              Suivi
            </Link>
            <Link
              href="/#tariffs"
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#4B5563",
                textDecoration: "none",
              }}
            >
              Tarifs
            </Link>
            <Link
              href="/#warehouses"
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#4B5563",
                textDecoration: "none",
              }}
            >
              Entrepôts
            </Link>
            <a
              href="https://wa.me/2250153638569"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                fontWeight: 700,
                backgroundColor: "#111827",
                color: "#FFFFFF",
                padding: "7px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <span>WhatsApp</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Contenu de la page */}
      <main>{children}</main>

      {/* Footer Minimaliste & Éditorial */}
      <footer
        style={{
          borderTop: "1px solid #E5E7EB",
          backgroundColor: "#FAFAFA",
          padding: "48px 20px 32px 20px",
        }}
      >
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "36px",
              marginBottom: "36px",
            }}
          >
            <div>
              <img
                src="/images/roum-logo-tight.png"
                alt="Logo Roum Transit"
                style={{
                  height: "46px",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "12px",
                  display: "block",
                }}
              />
              <p style={{ color: "#6B7280", fontSize: "0.84rem", lineHeight: 1.6, margin: 0 }}>
                Acheminement de fret maritime, aérien et approvisionnement direct (Chine, Dubaï, Maroc, France ➔ Afrique).
              </p>
            </div>

            <div>
              <h4 style={{ color: "#111827", fontSize: "0.88rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px 0" }}>
                Couloirs Actifs
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#4B5563", fontSize: "0.82rem", display: "grid", gap: "8px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="CN" size={15} />
                  <span>Chine (Guangzhou) ➔ Afrique (4 - 14j)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="AE" size={15} />
                  <span>Dubaï ➔ Afrique (Aérien & Achats)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="MA" size={15} />
                  <span>Maroc ➔ 5 Pays (5j Chrono)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CircularFlag countryCode="FR" size={15} />
                  <span>Paris ↔ Abidjan (Aérien Direct)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: "#111827", fontSize: "0.88rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px 0" }}>
                Agence & Permanence
              </h4>
              <p style={{ color: "#4B5563", fontSize: "0.82rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} color="#111827" />
                <span>Abidjan Bingerville, Côte d&apos;Ivoire</span>
              </p>
              <p style={{ color: "#4B5563", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                Ligne directe : <strong>+225 01 53 638 569</strong>
              </p>
              <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
                Réseaux officiels : @roum_transit
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              fontSize: "0.78rem",
              color: "#9CA3AF",
            }}
          >
            <div>© 2026 ROUM TRANSIT — Direction des Opérations.</div>
            <div>Traçabilité certifiée et engagement de livraison.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
