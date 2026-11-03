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
        bottom: "max(14px, env(safe-area-inset-bottom, 14px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "max-content",
        maxWidth: "calc(100vw - 16px)",
        pointerEvents: "auto",
        boxSizing: "border-box",
      }}
    >
      <nav
        aria-label="Navigation principale"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          padding: "4px 5px",
          height: "44px",
          backgroundColor: "rgba(20, 13, 9, 0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 14px 34px -4px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.2)",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          maxWidth: "100%",
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: "5px",
                height: "34px",
                padding: "0 11px",
                borderRadius: "9999px",
                fontSize: "0.72rem",
                fontWeight: item.isActive ? 700 : 500,
                letterSpacing: "0.01em",
                textDecoration: "none",
                color: item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.82)",
                backgroundColor: item.isActive ? "#FFFFFF" : "transparent",
                whiteSpace: "nowrap",
                flexShrink: 0,
                touchAction: "manipulation",
                userSelect: "none",
                boxSizing: "border-box",
                transition: "background-color 0.16s ease, color 0.16s ease, transform 0.12s ease",
              }}
              title={item.label}
            >
              <Icon
                size={14}
                strokeWidth={item.isActive ? 2.5 : 1.9}
                color={item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.85)"}
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

        @media (max-width: 540px) {
          nav {
            height: 40px !important;
            padding: 3px 4px !important;
            gap: 3px !important;
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
            height: 32px !important;
            padding: 0 8.5px !important;
            font-size: 0.69rem !important;
            gap: 4px !important;
          }
        }

        @media (max-width: 400px) {
          nav {
            height: 38px !important;
            padding: 3px !important;
            gap: 2.5px !important;
          }
          .roum-nav-pill {
            height: 30px !important;
            padding: 0 7px !important;
            font-size: 0.65rem !important;
            gap: 3px !important;
          }
          :global(.roum-nav-icon) {
            width: 13px !important;
            height: 13px !important;
          }
        }

        @media (max-width: 360px) {
          nav {
            height: 36px !important;
            padding: 2.5px !important;
            gap: 2px !important;
          }
          .roum-nav-pill {
            height: 29px !important;
            padding: 0 5.5px !important;
            font-size: 0.61rem !important;
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
