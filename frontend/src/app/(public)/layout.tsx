import Link from "next/link";
import { FloatingBottomNav } from "@/components/FloatingBottomNav";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="client-portal" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ========================================================
          HEADER ROUM TRANSIT : LOGO SOBRE ET PRESTIGIEUX
          (Fond lin naturel, zéro fioriture, le logo respire en toute pureté)
         ======================================================== */}
      <header
        style={{
          backgroundColor: "transparent",
          padding: "18px 24px 10px 24px",
          position: "relative",
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
            title="ROUM TRANSIT INTERNATIONAL"
          >
            <img
              src="/images/roum-logo-transparent.png"
              alt="Roum Transit"
              style={{
                height: "44px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>
        </div>
      </header>

      {/* Contenu principal : Marge basse de 110px pour que rien ne soit jamais masqué par la barre flottante */}
      <main style={{ flex: 1, paddingBottom: "110px" }}>{children}</main>

      {/* Navigation Flottante en Bas pour mobile et desktop */}
      <FloatingBottomNav />

      {/* Vrai bouton WhatsApp flottant en bas à droite (au-dessus de la nav) */}
      <WhatsAppFloatingButton />

      {/* Pied de page sobre */}
      <footer
        style={{
          borderTop: "1px solid rgba(28, 25, 23, 0.08)",
          backgroundColor: "#F7F5F0",
          padding: "36px 24px 28px 24px",
        }}
      >
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src="/images/roum-logo-transparent.png"
                alt="Roum Transit"
                style={{ height: "34px", width: "auto" }}
              />
              <span style={{ fontSize: "0.82rem", color: "#57534E" }}>
                Expéditions directes vers l&apos;Afrique &amp; International
              </span>
            </div>

            <div style={{ display: "flex", gap: "18px", fontSize: "0.82rem", color: "#57534E" }}>
              <Link href="/services" style={{ textDecoration: "none", color: "inherit" }}>
                Services
              </Link>
              <Link href="/tariffs" style={{ textDecoration: "none", color: "inherit" }}>
                Tarifs
              </Link>
              <Link href="/warehouses" style={{ textDecoration: "none", color: "inherit" }}>
                Entrepôts
              </Link>
              <Link href="/tracking" style={{ textDecoration: "none", color: "inherit" }}>
                Suivi Colis
              </Link>
            </div>
          </div>

          <div
            style={{
              paddingTop: "14px",
              borderTop: "1px solid rgba(28, 25, 23, 0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "0.72rem",
              color: "#78716C",
              fontFamily: "var(--c-font-mono)",
            }}
          >
            <div>© 2026 ROUM TRANSIT INTERNATIONAL</div>
            <div>DÉDOUANEMENT COMPRIS · PESÉE CERTIFIÉE · LIVRAISON JUSQU&apos;À DESTINATION</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
