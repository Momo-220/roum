"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Search,
  Calculator,
  MapPin,
} from "lucide-react";

export function FloatingBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Accueil", icon: Home, href: "/", isActive: pathname === "/" },
    { id: "services", label: "Services", icon: Layers, href: "/services", isActive: pathname.startsWith("/services") },
    { id: "tracking", label: "Suivi", icon: Search, href: "/tracking", isActive: pathname.startsWith("/tracking") },
    { id: "tariffs", label: "Tarifs", icon: Calculator, href: "/tariffs", isActive: pathname.startsWith("/tariffs") },
    { id: "warehouses", label: "Dépôts", icon: MapPin, href: "/warehouses", isActive: pathname.startsWith("/warehouses") },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(14px, env(safe-area-inset-bottom, 14px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "max-content",
        maxWidth: "calc(100vw - 20px)",
        pointerEvents: "auto",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <nav
        aria-label="Navigation principale"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "3px",
          padding: "4px 6px",
          height: "44px",
          backgroundColor: "#140D09",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`roum-nav-pill ${item.isActive ? "active" : ""}`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon
                size={15}
                strokeWidth={item.isActive ? 2.5 : 1.9}
                style={{ flexShrink: 0 }}
              />
              <span className="roum-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        :global(.roum-nav-pill) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 36px;
          padding: 0 13px;
          border-radius: 9999px;
          font-size: 0.74rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.78);
          background-color: transparent;
          box-shadow: none;
          white-space: nowrap;
          flex-shrink: 0;
          box-sizing: border-box;
          transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.15s ease;
        }

        :global(.roum-nav-pill:hover) {
          color: #FFFFFF;
        }

        :global(.roum-nav-pill.active) {
          background-color: #FFFFFF !important;
          color: #140D09 !important;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }

        :global(.roum-nav-label) {
          line-height: 1;
          white-space: nowrap;
        }

        /* MOBILE (< 640px) : ULTRA-ÉPURÉ, ZÉRO DÉBORDEMENT, SÉLECTEUR AJUSTÉ */
        @media (max-width: 640px) {
          nav {
            height: 42px !important;
            padding: 3.5px 5px !important;
            gap: 2.5px !important;
          }

          /* Inactif : icône seule, carré arrondi compact */
          :global(.roum-nav-pill) {
            height: 35px !important;
            width: 36px !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          :global(.roum-nav-pill .roum-nav-label) {
            display: none !important;
          }

          /* Actif : pilule blanche complète icône + texte parfaitement contenue */
          :global(.roum-nav-pill.active) {
            width: auto !important;
            padding: 0 12px !important;
            gap: 5px !important;
            font-size: 0.71rem !important;
          }

          :global(.roum-nav-pill.active .roum-nav-label) {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}
