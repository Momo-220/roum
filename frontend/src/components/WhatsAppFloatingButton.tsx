"use client";

export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/2250153638569?text=Bonjour%20ROUM%20TRANSIT%2C%20je%20souhaite%20des%20informations."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Roum Transit sur WhatsApp"
      className="whatsapp-floating-btn"
      title="Discuter sur WhatsApp"
    >
      <svg
        width="54"
        height="54"
        viewBox="0 0 360 362"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="whatsapp-icon-svg"
      >
        {/* Bulle verte officielle WhatsApp avec pointe */}
        <path
          d="M307.546 52.5655C273.709 18.685 228.706 0.0171895 180.756 0C81.951 0 1.53846 80.404 1.50408 179.235C1.48689 210.829 9.74646 241.667 25.4319 268.844L0 361.736L95.0236 336.811C121.203 351.096 150.683 358.616 180.679 358.625H180.756C279.544 358.625 359.966 278.212 360 179.381C360.017 131.483 341.392 86.4547 307.546 52.5741V52.5655Z"
          fill="#25D366"
        />
        {/* Combiné téléphonique blanc officiel WhatsApp */}
        <path
          d="M262.475 216.777C257.997 214.534 235.978 203.704 231.869 202.209C227.761 200.713 224.779 199.966 221.796 204.452C218.814 208.939 210.228 219.029 207.615 222.011C205.002 225.002 202.389 225.372 197.911 223.128C193.434 220.885 179.003 216.158 161.891 200.902C148.578 189.024 139.587 174.362 136.975 169.875C134.362 165.389 136.7 162.965 138.934 160.739C140.945 158.728 143.412 155.505 145.655 152.892C147.899 150.279 148.638 148.406 150.133 145.423C151.629 142.432 150.881 139.82 149.764 137.576C148.646 135.333 139.691 113.287 135.952 104.323C132.316 95.5909 128.621 96.777 125.879 96.6309C123.266 96.5019 120.284 96.4762 117.293 96.4762C114.302 96.4762 109.454 97.5935 105.346 102.08C101.238 106.566 89.6691 117.404 89.6691 139.441C89.6691 161.478 105.716 182.785 107.959 185.776C110.202 188.767 139.544 234.001 184.469 253.408C195.153 258.023 203.498 260.782 210.004 262.845C220.731 266.257 230.494 265.776 238.212 264.624C246.816 263.335 264.71 253.786 268.44 243.326C272.17 232.866 272.17 223.893 271.053 222.028C269.936 220.163 266.945 219.037 262.467 216.794L262.475 216.777Z"
          fill="#FFFFFF"
        />
      </svg>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .whatsapp-floating-btn {
          position: fixed;
          bottom: max(72px, calc(env(safe-area-inset-bottom, 14px) + 58px));
          right: 18px;
          z-index: 900;
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          outline: none;
          text-decoration: none;
          filter: drop-shadow(0 6px 16px rgba(37, 211, 102, 0.45));
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
        }

        .whatsapp-icon-svg {
          width: 54px;
          height: 54px;
          display: block;
        }

        .whatsapp-floating-btn:hover {
          transform: scale(1.1);
          filter: drop-shadow(0 8px 22px rgba(37, 211, 102, 0.6));
        }

        @media (max-width: 480px) {
          .whatsapp-floating-btn {
            width: 48px;
            height: 48px;
            right: 14px;
            bottom: max(68px, calc(env(safe-area-inset-bottom, 12px) + 54px));
          }
          .whatsapp-icon-svg {
            width: 48px;
            height: 48px;
          }
        }
      `,
        }}
      />
    </a>
  );
}
