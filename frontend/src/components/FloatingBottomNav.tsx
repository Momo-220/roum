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
    { id: "home", label: "Accueil", shortLabel: "Accueil", icon: Home, href: "/", isActive: pathname === "/" },
    { id: "services", label: "Services", shortLabel: "Services", icon: Layers, href: "/services", isActive: pathname.startsWith("/services") },
    { id: "tracking", label: "Suivi", shortLabel: "Suivi", icon: Search, href: "/tracking", isActive: pathname.startsWith("/tracking") },
    { id: "tariffs", label: "Tarifs", shortLabel: "Tarifs", icon: Calculator, href: "/tariffs", isActive: pathname.startsWith("/tariffs") },
    { id: "warehouses", label: "Entrepôts", shortLabel: "Dépôts", icon: MapPin, href: "/warehouses", isActive: pathname.startsWith("/warehouses") },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100vw - 20px)",
        maxWidth: "460px",
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
          justifyContent: "space-between",
          width: "100%",
          gap: "2px",
          padding: "3px",
          height: "42px",
          backgroundColor: "#140D09",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`roum-nav-pill ${item.isActive ? "active" : ""}`}
              style={{
                flex: "1 1 0px",
                minWidth: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                height: "36px",
                padding: "0 4px",
                borderRadius: "9999px",
                fontSize: "0.72rem",
                fontWeight: item.isActive ? 700 : 500,
                letterSpacing: "0.01em",
                textDecoration: "none",
                color: item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.85)",
                backgroundColor: item.isActive ? "#FFFFFF" : "transparent",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              title={item.label}
            >
              <Icon
                size={14}
                strokeWidth={item.isActive ? 2.5 : 1.9}
                color={item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.88)"}
                className="roum-nav-icon"
                style={{ flexShrink: 0 }}
              />
              <span className="roum-nav-label-full">{item.label}</span>
              <span className="roum-nav-label-short">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .roum-nav-label-short {
          display: none;
        }
        .roum-nav-label-full {
          display: inline;
          white-space: nowrap;
          line-height: 1;
        }

        @media (max-width: 520px) {
          nav {
            height: 38px !important;
            padding: 2.5px !important;
            gap: 2px !important;
          }
          .roum-nav-label-full {
            display: none;
          }
          .roum-nav-label-short {
            display: inline;
            white-space: nowrap;
            line-height: 1;
          }
          .roum-nav-pill {
            height: 33px !important;
            padding: 0 2px !important;
            font-size: 0.67rem !important;
            gap: 3.5px !important;
          }
          :global(.roum-nav-icon) {
            width: 13px !important;
            height: 13px !important;
          }
        }

        @media (max-width: 380px) {
          nav {
            height: 36px !important;
            padding: 2px !important;
            gap: 1.5px !important;
          }
          .roum-nav-pill {
            height: 32px !important;
            padding: 0 1px !important;
            font-size: 0.62rem !important;
            gap: 2.5px !important;
          }
          :global(.roum-nav-icon) {
            width: 12px !important;
            height: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
