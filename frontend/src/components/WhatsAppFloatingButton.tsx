"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/2250153638569?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Roum Transit sur WhatsApp"
      style={{
        position: "fixed",
        bottom: "84px",
        right: "20px",
        zIndex: 90,
        width: "48px",
        height: "48px",
        borderRadius: "9999px",
        backgroundColor: "#25D366",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
        textDecoration: "none",
        transition: "transform 0.15s ease",
      }}
    >
      <MessageCircle size={26} />
    </a>
  );
}

