import Link from "next/link";
import { MapPin, Phone, ArrowUpRight, Shield } from "lucide-react";
import { CircularFlag } from "@/components/CircularFlag";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF" }}>
      {/* Navigation Header Épurée & Grand Format */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(28, 25, 23, 0.07)",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Logo Officiel avec breathing room */}
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
              src="/images/roum-logo-tight.png"
              alt="Roum Transit International"
              style={{
                height: "54px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>

          {/* Navigation Centrale sobre (desktop) */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
            className="public-nav-links"
          >
            <Link
              href="/#tracking"
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#374151",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              Suivi Colis
            </Link>
            <Link
              href="/#corridors"
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#374151",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              Couloirs
            </Link>
            <Link
              href="/#tariffs"
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#374151",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              Simulateur
            </Link>
            <Link
              href="/#warehouses"
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#374151",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              Entrepôts
            </Link>
            <Link
              href="/#exigence"
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#374151",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              Démarche
            </Link>
          </nav>

          {/* Actions Droite : WhatsApp Direct + Accès Direction */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/admin"
              className="roum-btn-secondary"
              style={{
                fontSize: "0.78rem",
                padding: "8px 14px",
                borderRadius: "8px",
              }}
              title="Portail de direction et gestion interne"
            >
              <span>Accès Direction</span>
            </Link>

            <a
              href="https://wa.me/2250153638569"
              target="_blank"
              rel="noopener noreferrer"
              className="roum-btn-primary"
              style={{
                fontSize: "0.82rem",
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              <span>WhatsApp : +225 01 53 638 569</span>
            </a>
          </div>
        </div>
      </header>

      {/* Contenu de la page avec mise en page grandeur nature */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer Minimaliste & Architectural Grand Format */}
      <footer
        style={{
          borderTop: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#FAF9F6",
          padding: "72px 24px 40px 24px",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "48px 32px",
              marginBottom: "56px",
            }}
          >
            {/* Colonne 1 : Identité & Vocation */}
            <div>
              <img
                src="/images/roum-logo-tight.png"
                alt="Logo Roum Transit"
                style={{
                  height: "56px",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "16px",
                  display: "block",
                }}
              />
              <p style={{ color: "#4B5563", fontSize: "0.88rem", lineHeight: 1.65, margin: "0 0 16px 0", maxWidth: "340px" }}>
                Roum Transit International — Spécialiste du fret aérien express, groupage maritime et approvisionnement direct entre l&apos;Asie, les Émirats, l&apos;Europe et l&apos;Afrique de l&apos;Ouest.
              </p>
            </div>

            {/* Colonne 2 : Couloirs Stratégiques */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", marginBottom: "16px" }}>
                01 / COULOIRS ACTIFS
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#374151", fontSize: "0.85rem", display: "grid", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CircularFlag countryCode="CN" size={17} />
                  <span>Chine (Guangzhou / Yiwu) ➔ Afrique</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CircularFlag countryCode="AE" size={17} />
                  <span>Dubaï (Émirats) ➔ Afrique (4 - 5j)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CircularFlag countryCode="MA" size={17} />
                  <span>Maroc (Casablanca) ➔ 5 Pays (5j)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CircularFlag countryCode="FR" size={17} />
                  <span>France (Paris) ↔ Côte d&apos;Ivoire</span>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Entrepôts & Hubs */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", marginBottom: "16px" }}>
                02 / PLATEFORMES PHYSIQUES
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#4B5563", fontSize: "0.85rem", display: "grid", gap: "10px" }}>
                <li>
                  <strong style={{ color: "#18181B" }}>Guangzhou (Chine) :</strong> Magasin de consolidation & pesée
                </li>
                <li>
                  <strong style={{ color: "#18181B" }}>Dubaï (Émirats) :</strong> Entrepôt fret & parfumerie
                </li>
                <li>
                  <strong style={{ color: "#18181B" }}>Casablanca (Maroc) :</strong> Hub groupage subsaharien
                </li>
                <li>
                  <strong style={{ color: "#18181B" }}>Abidjan (CI) :</strong> Agence principale Bingerville Carrefour Safari
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Permanence & Ligne Directe */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", marginBottom: "16px" }}>
                03 / CONTACT & PERMANENCE
              </div>
              <p style={{ color: "#4B5563", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 10px 0" }}>
                <MapPin size={15} color="#18181B" style={{ flexShrink: 0 }} />
                <span>Abidjan, Bingerville Carrefour Safari</span>
              </p>
              <p style={{ color: "#4B5563", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0" }}>
                <Phone size={15} color="#18181B" style={{ flexShrink: 0 }} />
                <span>Ligne directe : <strong style={{ color: "#18181B" }}>+225 01 53 638 569</strong></span>
              </p>
              <a
                href="https://wa.me/2250153638569"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#18181B",
                  textDecoration: "underline",
                }}
              >
                <span>Échanger avec un conseiller sur WhatsApp</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>

          {/* Mentions Bas de Page */}
          <div
            style={{
              paddingTop: "24px",
              borderTop: "1px solid rgba(28, 25, 23, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              fontSize: "0.78rem",
              color: "#9CA3AF",
            }}
          >
            <div>
              © 2026 ROUM TRANSIT INTERNATIONAL. Tous droits réservés.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span>Traçabilité certifiée</span>
              <span>·</span>
              <span>Dédouanement garanti</span>
              <span>·</span>
              <Link href="/admin" style={{ color: "#9CA3AF", textDecoration: "none" }}>
                Accès Personnel
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

