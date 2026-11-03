"use client";

export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/2250153638569?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Roum Transit sur WhatsApp"
      className="whatsapp-floating-btn"
    >
      <img
        src="/images/whatsapp.png"
        alt="WhatsApp"
        width={30}
        height={30}
        style={{ objectFit: "contain", display: "block" }}
      />
      <style jsx>{`
        .whatsapp-floating-btn {
          position: fixed;
          bottom: max(72px, calc(env(safe-area-inset-bottom, 14px) + 58px));
          right: 18px;
          z-index: 900;
          width: 50px;
          height: 50px;
          border-radius: 9999px;
          background-color: #25D366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.45);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .whatsapp-floating-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.55);
        }

        @media (max-width: 480px) {
          .whatsapp-floating-btn {
            width: 46px;
            height: 46px;
            right: 14px;
            bottom: max(68px, calc(env(safe-area-inset-bottom, 12px) + 54px));
          }
        }
      `}</style>
    </a>
  );
}
