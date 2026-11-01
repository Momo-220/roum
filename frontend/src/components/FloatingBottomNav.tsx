"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Calculator,
  MapPin,
  Search,
} from "lucide-react";

export function FloatingBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Accueil", icon: Home, href: "/", isActive: pathname === "/" },
    { id: "services", label: "Services", icon: Layers, href: "/services", isActive: pathname.startsWith("/services") },
    { id: "tariffs", label: "Simulateur", icon: Calculator, href: "/tariffs", isActive: pathname.startsWith("/tariffs") },
    { id: "warehouses", label: "Entrepôts", icon: MapPin, href: "/warehouses", isActive: pathname.startsWith("/warehouses") },
    { id: "tracking", label: "Suivi", icon: Search, href: "/tracking", isActive: pathname.startsWith("/tracking") },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        maxWidth: "94vw",
      }}
    >
      <nav
        aria-label="Navigation principale"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "5px 6px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "9999px",
          border: "1px solid rgba(28, 25, 23, 0.12)",
          boxShadow: "0 10px 28px -4px rgba(28, 25, 23, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 13px",
                borderRadius: "9999px",
                fontSize: "0.74rem",
                fontWeight: item.isActive ? 700 : 600,
                letterSpacing: "0.01em",
                textDecoration: "none",
                transition: "all 0.16s ease",
                backgroundColor: item.isActive ? "#140D09" : "transparent",
                color: item.isActive ? "#FFFFFF" : "#57534E",
                whiteSpace: "nowrap",
                touchAction: "manipulation",
                userSelect: "none",
              }}
              title={item.label}
            >
              <Icon size={14} strokeWidth={item.isActive ? 2.4 : 1.9} color={item.isActive ? "#FFFFFF" : "#57534E"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default FloatingBottomNav;
