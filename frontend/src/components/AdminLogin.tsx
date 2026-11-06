"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

interface AdminLoginProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

/** Écran de connexion de l'équipe : une photo d'un côté, le formulaire sur fond crème de l'autre. */
export function AdminLogin({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [missing, setMissing] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setMissing("Indiquez votre email.");
      return;
    }
    if (!password) {
      setMissing("Indiquez votre mot de passe.");
      return;
    }
    setMissing("");
    onSubmit(event);
  };

  const message = missing || error;

  return (
    <div className="al-root">
      <aside className="al-photo">
        <img src="/images/services/achat.jpg" alt="" className="al-photo-image" />
        <div className="al-photo-fade" />
        <span className="al-logo-pill">
          <img src="/images/roum-logo-transparent.png" alt="Roum Transit" />
        </span>
        <div className="al-photo-text">
          <strong>ROUM TRANSIT INTERNATIONAL</strong>
          <span>Abidjan · Guangzhou · Yiwu · Dubaï · Casablanca</span>
        </div>
      </aside>

      <main className="al-panel">
        <div className="al-form-wrap">
          <h1>Espace de Gestion</h1>
          <p className="al-intro">Supervision globale des expéditions &amp; trésorerie</p>

          {message && (
            <p className="al-error" role="alert">
              <AlertCircle size={16} />
              <span>{message}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="al-field">
              <span>Email</span>
              <div className="al-input">
                <Mail size={17} />
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                />
              </div>
            </label>

            <label className="al-field">
              <span>Mot de passe</span>
              <div className="al-input">
                <Lock size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                />
                <button
                  type="button"
                  className="al-eye"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button type="submit" className="al-submit" disabled={loading}>
              <span>{loading ? "Connexion en cours..." : "Se connecter"}</span>
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="al-note">Accès réservé à l&apos;équipe ROUM TRANSIT.</p>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .al-root {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          min-height: 100vh;
          background: #FFFBF4;
          color: #3A2A21;
        }

        .al-photo {
          position: relative;
          overflow: hidden;
          background: #3A2A21;
        }

        .al-photo-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .al-photo-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(32, 22, 15, 0.72) 0%, rgba(32, 22, 15, 0.12) 46%, rgba(32, 22, 15, 0.05) 100%);
        }

        .al-logo-pill {
          position: absolute;
          top: 28px;
          left: 28px;
          display: inline-flex;
          padding: 10px 22px;
          border-radius: 9999px;
          background: #FFFBF4;
          box-shadow: 0 12px 26px -14px rgba(32, 22, 15, 0.7);
        }

        .al-logo-pill img {
          display: block;
          width: auto;
          height: 52px;
        }

        .al-photo-text {
          position: absolute;
          left: 32px;
          right: 32px;
          bottom: 30px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: #FFFBF4;
        }

        .al-photo-text strong {
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .al-photo-text span {
          color: #EADDCB;
          font-size: 0.92rem;
        }

        .al-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 28px;
        }

        .al-form-wrap {
          width: 100%;
          max-width: 390px;
        }

        .al-form-wrap h1 {
          margin: 0 0 8px;
          color: #3A2A21;
          font-size: clamp(2rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.08;
        }

        .al-intro {
          margin: 0 0 30px;
          color: #6B5E55;
          font-size: 1rem;
          line-height: 1.45;
        }

        .al-error {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 18px;
          padding: 12px 18px;
          border-radius: 9999px;
          background: #FBEAEA;
          color: #A12B2B;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .al-error svg {
          flex-shrink: 0;
        }

        .al-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .al-field > span {
          font-size: 0.93rem;
          font-weight: 700;
        }

        .al-input {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 54px;
          padding: 0 20px;
          border: 1px solid #E3D8CA;
          border-radius: 9999px;
          background: #FFFFFF;
          color: #8C7D75;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .al-input:focus-within {
          border-color: #A8957C;
          box-shadow: 0 0 0 4px rgba(168, 149, 124, 0.16);
        }

        .al-input input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #3A2A21;
          font-family: inherit;
          font-size: 16px;
        }

        .al-input input::placeholder {
          color: #A99A90;
        }

        .al-eye {
          display: inline-flex;
          margin-right: -8px;
          padding: 8px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #8C7D75;
          cursor: pointer;
        }

        .al-eye:hover {
          background: #F3EBDF;
          color: #3A2A21;
        }

        .al-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 56px;
          margin-top: 10px;
          border: 0;
          border-radius: 9999px;
          background: #EADDCB;
          color: #3A2A21;
          font-family: inherit;
          font-size: 1.02rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .al-submit:hover {
          background: #E0D1BB;
          transform: translateY(-1px);
        }

        .al-submit:active {
          transform: scale(0.98);
        }

        .al-submit:disabled {
          opacity: 0.65;
          cursor: wait;
          transform: none;
        }

        .al-note {
          margin: 22px 0 0;
          color: #8C7D75;
          font-size: 0.88rem;
          text-align: center;
        }

        @media (max-width: 860px) {
          .al-root {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: 230px minmax(0, 1fr);
          }

          .al-logo-pill {
            top: 20px;
            left: 20px;
            padding: 8px 18px;
          }

          .al-logo-pill img {
            height: 44px;
          }

          .al-photo-text {
            left: 22px;
            right: 22px;
            bottom: 18px;
          }

          .al-panel {
            align-items: flex-start;
            padding: 30px 20px 40px;
          }
        }
      `,
        }}
      />
    </div>
  );
}
