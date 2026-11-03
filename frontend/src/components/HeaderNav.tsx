"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Calculator,
  MapPin,
  Search,
  Menu,
  X,
  Phone,
  ArrowRight,
} from "lucide-react";

export function HeaderNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Accueil", href: "/", icon: Home, isActive: pathname === "/" },
    { label: "Services", href: "/services", icon: Layers, isActive: pathname.startsWith("/services") },
    { label: "Simulateur", href: "/tariffs", icon: Calculator, isActive: pathname.startsWith("/tariffs") },
    { label: "Entrepôts", href: "/warehouses", icon: MapPin, isActive: pathname.startsWith("/warehouses") },
    { label: "Suivi Colis", href: "/tracking", icon: Search, isActive: pathname.startsWith("/tracking") },
  ];

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          backgroundColor: "rgba(250, 245, 240, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(28, 25, 23, 0.08)",
          transition: "background-color 0.2s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* Logo officiel ROUM TRANSIT */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
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
                height: "38px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>

          {/* Navigation Desktop intégrée au header */}
          <nav
            className="desktop-header-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 13px",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: link.isActive ? 700 : 500,
                    textDecoration: "none",
                    color: link.isActive ? "#FFFFFF" : "#4A3E39",
                    backgroundColor: link.isActive ? "#140D09" : "transparent",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!link.isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(20, 13, 9, 0.06)";
                      e.currentTarget.style.color = "#140D09";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!link.isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#4A3E39";
                    }
                  }}
                >
                  <Icon size={14} strokeWidth={link.isActive ? 2.4 : 1.8} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Bouton de contact direct */}
            <a
              href="https://wa.me/2250153638569"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginLeft: "8px",
                padding: "7px 14px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(28, 25, 23, 0.12)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#140D09",
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(28, 25, 23, 0.28)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(28, 25, 23, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Phone size={13} color="#22C55E" />
              <span>+225 01 53 638 569</span>
            </a>
          </nav>

          {/* Bouton Menu Hamburger sur Mobile */}
          <div className="mobile-header-toggle">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid rgba(28, 25, 23, 0.12)",
                backgroundColor: "#FFFFFF",
                color: "#140D09",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile élégant sous le header */}
        {mobileMenuOpen && (
          <div
            className="mobile-dropdown-menu"
            style={{
              backgroundColor: "#FAF5F0",
              borderTop: "1px solid rgba(28, 25, 23, 0.08)",
              padding: "12px 18px 20px 18px",
              boxShadow: "0 12px 24px -6px rgba(28, 25, 23, 0.1)",
              animation: "mobileMenuSlide 0.25s ease-out forwards",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 14px",
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                      fontWeight: link.isActive ? 700 : 500,
                      textDecoration: "none",
                      color: link.isActive ? "#FFFFFF" : "#140D09",
                      backgroundColor: link.isActive ? "#140D09" : "#FFFFFF",
                      border: "1px solid rgba(28, 25, 23, 0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon size={16} strokeWidth={link.isActive ? 2.4 : 1.8} />
                      <span>{link.label}</span>
                    </div>
                    <ArrowRight size={14} opacity={link.isActive ? 0.9 : 0.4} />
                  </Link>
                );
              })}

              {/* Ligne Contact WhatsApp dans le menu mobile */}
              <a
                href="https://wa.me/2250153638569?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "8px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#22C55E",
                  color: "#FFFFFF",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <Phone size={15} />
                <span>Nous contacter sur WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <style jsx>{`
        .desktop-header-nav {
          display: flex;
        }

        .mobile-header-toggle {
          display: none;
        }

        @keyframes mobileMenuSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 860px) {
          .desktop-header-nav {
            display: none !important;
          }

          .mobile-header-toggle {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

export default HeaderNav;

