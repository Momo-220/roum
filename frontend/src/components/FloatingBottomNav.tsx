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
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "max-content",
        maxWidth: "calc(100vw - 16px)",
        pointerEvents: "auto",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <nav
        aria-label="Navigation principale"
        className="roum-floating-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          padding: "4px 8px",
          height: "44px",
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                height: "36px",
                padding: "0 clamp(6px, 1.6vw, 12px)",
                borderRadius: "9999px",
                fontSize: "clamp(0.68rem, 1.8vw, 0.73rem)",
                fontWeight: item.isActive ? 700 : 500,
                letterSpacing: "-0.01em",
                textDecoration: "none",
                color: item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.82)",
                backgroundColor: item.isActive ? "#FFFFFF" : "transparent",
                boxShadow: item.isActive ? "0 2px 8px rgba(0, 0, 0, 0.25)" : "none",
                whiteSpace: "nowrap",
                flexShrink: 1,
                boxSizing: "border-box",
                transition: "background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
              }}
              title={item.label}
            >
              <Icon
                size={14}
                strokeWidth={item.isActive ? 2.5 : 1.9}
                color={item.isActive ? "#140D09" : "rgba(255, 255, 255, 0.85)"}
                style={{ flexShrink: 0 }}
              />
              <span style={{ lineHeight: 1, whiteSpace: "nowrap" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 380px) {
          .roum-floating-nav {
            height: 40px !important;
            padding: 3px 6px !important;
            gap: 1.5px !important;
          }
          .roum-nav-pill {
            height: 34px !important;
            padding: 0 5px !important;
            font-size: 0.65rem !important;
            gap: 3px !important;
          }
        }

        @media (max-width: 340px) {
          .roum-floating-nav {
            height: 38px !important;
            padding: 2.5px 4px !important;
            gap: 1px !important;
          }
          .roum-nav-pill {
            height: 32px !important;
            padding: 0 4.5px !important;
            font-size: 0.61rem !important;
            gap: 2.5px !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
