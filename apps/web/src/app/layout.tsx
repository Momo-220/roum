import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Phone, ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROUM TRANSIT — Fret Maritime, Aérien & Sourcing International",
  description: "Plateforme officielle de ROUM TRANSIT (Wholesale & Boutique) : suivi de colis en temps réel, fret maritime et aérien Chine, Dubaï, Maroc vers l'Afrique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="anti-extension-sanitizer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function sanitize(el) {
                    if (!el || el.nodeType !== 1) return;
                    var attrs = el.attributes;
                    if (!attrs) return;
                    for (var i = attrs.length - 1; i >= 0; i--) {
                      var n = attrs[i].name;
                      if (
                        n === 'bis_skin_checked' ||
                        n === 'bis_register' ||
                        n === 'cz-shortcut-listen' ||
                        n.indexOf('bis_') === 0 ||
                        n.indexOf('__processed_') === 0
                      ) {
                        el.removeAttribute(n);
                      }
                    }
                  }

                  var origSet = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (
                      name === 'bis_skin_checked' ||
                      name === 'bis_register' ||
                      name === 'cz-shortcut-listen' ||
                      (typeof name === 'string' && (name.indexOf('bis_') === 0 || name.indexOf('__processed_') === 0))
                    ) {
                      return;
                    }
                    return origSet.apply(this, arguments);
                  };

                  if (typeof MutationObserver !== 'undefined') {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes') {
                          sanitize(m.target);
                        } else if (m.type === 'childList') {
                          for (var j = 0; j < m.addedNodes.length; j++) {
                            sanitize(m.addedNodes[j]);
                          }
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      childList: true,
                      subtree: true,
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Navigation Bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(7, 12, 24, 0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
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
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f5a623 0%, #00b4d8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontWeight: "800",
                  fontSize: "1.2rem",
                  boxShadow: "0 4px 15px rgba(245, 166, 35, 0.3)",
                }}
              >
                RT
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.25rem",
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
                    color: "var(--gold)",
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
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "var(--text-muted)",
                }}
              >
                Suivi de Colis
              </Link>
              <Link
                href="/#tariffs"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "var(--text-muted)",
                }}
              >
                Tarifs & Simulateur
              </Link>
              <Link
                href="/#services"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "var(--text-muted)",
                }}
              >
                Nos Services
              </Link>
              <Link
                href="/admin"
                className="btn btn-secondary"
                style={{
                  padding: "8px 18px",
                  fontSize: "0.85rem",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={16} color="var(--gold)" />
                Espace Pro
              </Link>
            </nav>
          </div>
        </header>

        {/* Contenu Principal */}
        <main>{children}</main>

        {/* Footer */}
        <footer
          style={{
            marginTop: "100px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
            padding: "60px 0 30px 0",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "40px",
                marginBottom: "40px",
              }}
            >
              <div>
                <h4 style={{ color: "var(--text-main)", marginBottom: "16px", fontSize: "1.1rem" }}>
                  ROUM TRANSIT
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
                  Spécialiste du transport de fret maritime, aérien et de l'approvisionnement international
                  au départ de la Chine, Dubaï et du Maroc vers l'Afrique de l'Ouest et Centrale.
                </p>
              </div>

              <div>
                <h4 style={{ color: "var(--text-main)", marginBottom: "16px", fontSize: "1.1rem" }}>
                  Liaisons Principales
                </h4>
                <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "2" }}>
                  <li>🇨🇳 Guangzhou / Yiwu → 🇲🇱 Bamako, 🇬🇳 Conakry</li>
                  <li>🇦🇪 Dubaï → 🇨🇮 Abidjan, 🇸🇳 Dakar</li>
                  <li>🇲🇦 Casablanca → 🇸🇳 Dakar, 🇲🇱 Bamako</li>
                  <li>Fret Maritime Groupage (LCL) & Aérien Express</li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: "var(--text-main)", marginBottom: "16px", fontSize: "1.1rem" }}>
                  Contact & Assistance
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
                  Assistance directe par WhatsApp 7j/7 pour vos demandes et expéditions.
                </p>
                <a
                  href="https://wa.me/22370000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "fit-content", padding: "10px 20px" }}
                >
                  <Phone size={18} />
                  Contacter sur WhatsApp
                </a>
              </div>
            </div>

            <div
              style={{
                paddingTop: "24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                fontSize: "0.85rem",
                color: "var(--text-dim)",
              }}
            >
              <div>© 2026 ROUM TRANSIT — Tous droits réservés.</div>
              <div>Conçu pour une transparence totale et zéro perte de colis.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
