"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Layers,
  Calculator,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export function FloatingBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Accueil", icon: Home, href: "/", isActive: pathname === "/" },
    { id: "services", label: "Services", icon: Layers, href: "/services", isActive: pathname === "/services" },
    { id: "tracking", label: "Suivi", icon: Search, href: "/tracking", isActive: pathname.startsWith("/tracking") },
    { id: "tariffs", label: "Tarifs", icon: Calculator, href: "/tariffs", isActive: pathname === "/tariffs" },
    { id: "warehouses", label: "Entrepôts", icon: MapPin, href: "/warehouses", isActive: pathname === "/warehouses" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "22px",
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
          padding: "6px 8px",
          backgroundColor: "rgba(17, 24, 39, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15)",
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
                padding: "8px 14px",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                backgroundColor: item.isActive ? "#FFFFFF" : "transparent",
                color: item.isActive ? "#111827" : "#D1D5DB",
                whiteSpace: "nowrap",
                touchAction: "manipulation",
                userSelect: "none",
              }}
              title={item.label}
            >
              <Icon size={15} strokeWidth={item.isActive ? 2.5 : 2} color={item.isActive ? "#111827" : "#D1D5DB"} />
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}

        {/* Séparateur discret */}
        <div
          style={{
            width: "1px",
            height: "18px",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            margin: "0 4px",
          }}
        />

        {/* Bouton Direction discret */}
        <Link
          href="/admin"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 12px",
            borderRadius: "9999px",
            fontSize: "0.8rem",
            fontWeight: 700,
            textDecoration: "none",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            color: "#9CA3AF",
            whiteSpace: "nowrap",
            transition: "all 0.18s ease",
          }}
          title="Accès réservé Direction & Gestion"
        >
          <ShieldCheck size={14} color="#9CA3AF" />
          <span className="bottom-nav-label">Direction</span>
        </Link>
      </nav>
    </div>
  );
}

export default FloatingBottomNav;
