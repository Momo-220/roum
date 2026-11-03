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
    <div className="floating-bottom-nav-container">
      <nav aria-label="Navigation principale" className="floating-bottom-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`nav-pill-item ${item.isActive ? "is-active" : ""}`}
              title={item.label}
            >
              <Icon
                size={15}
                strokeWidth={item.isActive ? 2.4 : 1.9}
                className="nav-pill-icon"
              />
              <span className="nav-pill-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .floating-bottom-nav-container {
          position: fixed;
          bottom: max(14px, env(safe-area-inset-bottom, 14px));
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          width: auto;
          max-width: calc(100vw - 20px);
          pointer-events: auto;
        }

        .floating-bottom-nav-bar {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px 5px;
          background-color: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 9999px;
          border: 1px solid rgba(28, 25, 23, 0.12);
          box-shadow: 0 10px 28px -4px rgba(28, 25, 23, 0.14),
                      0 2px 6px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
          max-width: 100%;
        }

        .nav-pill-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 11px;
          border-radius: 9999px;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-decoration: none;
          color: #57534E;
          background-color: transparent;
          white-space: nowrap;
          touch-action: manipulation;
          user-select: none;
          transition: background-color 0.16s ease, color 0.16s ease, transform 0.15s ease;
        }

        .nav-pill-item:hover {
          color: #140D09;
        }

        .nav-pill-item.is-active {
          background-color: #140D09;
          color: #FFFFFF;
          font-weight: 700;
        }

        /* Adaptation intelligente pour les petits écrans mobiles (< 400px) */
        @media (max-width: 420px) {
          .floating-bottom-nav-bar {
            gap: 2px;
            padding: 4px;
          }

          .nav-pill-item {
            padding: 6px 8px;
            font-size: 0.68rem;
            gap: 4px;
          }
        }

        /* Sur les écrans ultra-compacts (ex : iPhone SE / 360px), labels subtils */
        @media (max-width: 360px) {
          .nav-pill-item {
            padding: 6px 7px;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingBottomNav;
