"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plane,
  Ship,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Calculator,
  MessageCircle,
} from "lucide-react";
import { normalizeTrackingNumber, buildWhatsAppUrl } from "@/shared";

export default function HomePage() {
  const router = useRouter();

  // État du formulaire de suivi
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");

  // État du simulateur de devis
  const [simOrigin, setSimOrigin] = useState("Chine");
  const [simDest, setSimDest] = useState("Mali");
  const [simMode, setSimMode] = useState<"AIR" | "SEA">("AIR");
  const [simWeight, setSimWeight] = useState(15);
  const [simCbm, setSimCbm] = useState(0.5);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");

    const normalized = normalizeTrackingNumber(trackingInput);
    if (!normalized) {
      setTrackingError(
        "Numéro de suivi invalide. Format attendu : RM-AIR-2610-XXXXXX ou RM-SEA-2610-XXXXXX."
      );
      return;
    }

    router.push(`/tracking/${normalized}`);
  };

  // Calcul d'estimation dynamique indicatif
  const estimateCost = () => {
    if (simMode === "AIR") {
      const pricePerKg = simOrigin === "Chine" ? 12.5 : simOrigin === "Dubaï" ? 11.0 : 9.5;
      const total = Math.max(simWeight * pricePerKg, 25);
      return {
        amount: Math.round(total),
        currency: "USD",
        duration: "3 à 7 jours",
        unit: `${pricePerKg}$ / kg`,
      };
    } else {
      const pricePerCbm = simOrigin === "Chine" ? 280 : 250;
      const total = Math.max(simCbm * pricePerCbm, 150);
      return {
        amount: Math.round(total),
        currency: "USD",
        duration: "35 à 45 jours",
        unit: `${pricePerCbm}$ / m³ (CBM)`,
      };
    }
  };

  const estimate = estimateCost();

  const getSimulatorWaUrl = () => {
    const text = `Bonjour ROUM TRANSIT, je souhaite un devis pour une expédition :\n- Départ : ${simOrigin}\n- Destination : ${simDest}\n- Mode : ${simMode === "AIR" ? "Fret Aérien" : "Fret Maritime"}\n- Quantité : ${simMode === "AIR" ? simWeight + " kg" : simCbm + " m³"}\nEstimation indicative : ~${estimate.amount} ${estimate.currency}`;
    return buildWhatsAppUrl("+22370000000", text);
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          padding: "80px 0 60px 0",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="container" style={{ maxWidth: "900px" }}>
          {/* Badge Top */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "rgba(245, 166, 35, 0.12)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              color: "var(--gold)",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginBottom: "24px",
            }}
          >
            <ShieldCheck size={16} />
            Transport International & Sourcing Sécurisé
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: "1.1",
              marginBottom: "24px",
              background: "linear-gradient(180deg, #FFFFFF 30%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Expédiez depuis la Chine, Dubaï et le Maroc vers l&apos;Afrique
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              color: "var(--text-muted)",
              lineHeight: "1.6",
              marginBottom: "40px",
              maxWidth: "700px",
              margin: "0 auto 40px auto",
            }}
          >
            Suivi transparent de vos colis en temps réel, tarifs négociés au kilo ou au m³,
            et assistance continue sur WhatsApp de l&apos;enlèvement à la livraison.
          </p>

          {/* Formulaire de Suivi Direct (Tracking) */}
          <div
            id="tracking"
            className="glass-card pulse-glow"
            style={{
              padding: "24px",
              maxWidth: "680px",
              margin: "0 auto",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: "700",
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={18} />
              Suivre un Colis en Direct
            </div>

            <form
              onSubmit={handleTrackingSubmit}
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                className="input-field"
                placeholder="Ex : RM-AIR-2610-K8P9Q2 ou numéro reçu par SMS/WhatsApp"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                style={{
                  flex: "1 1 300px",
                  fontSize: "1.05rem",
                  letterSpacing: "0.02em",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: "0 0 auto" }}
              >
                Localiser mon Colis
                <ArrowRight size={18} />
              </button>
            </form>

            {trackingError && (
              <div
                style={{
                  marginTop: "12px",
                  color: "var(--rose)",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                }}
              >
                {trackingError}
              </div>
            )}

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                fontSize: "0.82rem",
                color: "var(--text-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>Accès direct sans mot de passe requis.</span>
              <span style={{ color: "var(--text-muted)" }}>
                Exemples de test :{" "}
                <button
                  type="button"
                  onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--caramel)",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Aérien Express
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <div
              style={{
                color: "var(--gold)",
                fontWeight: "700",
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "8px",
              }}
            >
              Nos Solutions Logistiques
            </div>
            <h2 style={{ fontSize: "2.2rem" }}>
              Du petit colis e-commerce au conteneur complet
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Service 1 : Aérien */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(166, 124, 82, 0.2)",
                  color: "var(--light-brown)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <Plane size={28} />
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>
                Fret Aérien Express & Standard
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
                Vols réguliers au départ de Guangzhou, Yiwu et Dubaï. Idéal pour les échantillons,
                l&apos;électronique, les vêtements urgents et pièces détachées.
              </p>
              <div style={{ color: "var(--gold)", fontWeight: "600", fontSize: "0.9rem" }}>
                ⚡ Délais : 3 à 7 jours ouvrés
              </div>
            </div>

            {/* Service 2 : Maritime */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(245, 166, 35, 0.15)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <Ship size={28} />
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>
                Maritime Groupage (LCL) & FCL
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
                Optimisez vos coûts pour les gros volumes. Vous ne payez que le volume (CBM) réellement
                occupé dans nos conteneurs sécurisés avec dédouanement inclus.
              </p>
              <div style={{ color: "var(--caramel)", fontWeight: "600", fontSize: "0.9rem" }}>
                🚢 Tarification avantageuse au m³ (CBM)
              </div>
            </div>

            {/* Service 3 : Achat & Sourcing */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "var(--emerald)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>
                Achats & Sourcing Usines
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
                Accompagnement sur les marchés de gros (1688, Taobao, marchés de Dubaï). Nous réglons
                vos fournisseurs en devises locales et inspectons la marchandise avant expédition.
              </p>
              <div style={{ color: "var(--emerald)", fontWeight: "600", fontSize: "0.9rem" }}>
                🤝 Zéro arnaque fournisseur
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIMULATEUR DE DEVIS INTERACTIF */}
      <section
        id="tariffs"
        style={{
          padding: "80px 0",
          background: "linear-gradient(180deg, transparent 0%, rgba(13, 22, 41, 0.6) 100%)",
        }}
      >
        <div className="container">
          <div
            className="glass-card"
            style={{
              padding: "48px 36px",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "40px",
                alignItems: "center",
              }}
            >
              {/* Formulaire simulateur */}
              <div>
                <div
                  style={{
                    color: "var(--gold)",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calculator size={18} />
                  Simulateur Tarifaire Gratuit
                </div>
                <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>
                  Estimez le coût de votre expédition en 3 clics
                </h2>

                <div style={{ display: "grid", gap: "18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                        Pays d&apos;Origine
                      </label>
                      <select
                        className="input-field"
                        value={simOrigin}
                        onChange={(e) => setSimOrigin(e.target.value)}
                      >
                        <option value="Chine">🇨🇳 Chine (Guangzhou/Yiwu)</option>
                        <option value="Dubaï">🇦🇪 Dubaï</option>
                        <option value="Maroc">🇲🇦 Maroc (Casablanca)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                        Destination (Afrique)
                      </label>
                      <select
                        className="input-field"
                        value={simDest}
                        onChange={(e) => setSimDest(e.target.value)}
                      >
                        <option value="Mali">🇲🇱 Mali (Bamako)</option>
                        <option value="Côte d'Ivoire">🇨🇮 Côte d&apos;Ivoire (Abidjan)</option>
                        <option value="Sénégal">🇸🇳 Sénégal (Dakar)</option>
                        <option value="Guinée">🇬🇳 Guinée (Conakry)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Mode de Transport
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setSimMode("AIR")}
                        className="btn"
                        style={{
                          flex: 1,
                          background: simMode === "AIR" ? "var(--caramel)" : "var(--bg-glass)",
                          color: simMode === "AIR" ? "#171412" : "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Plane size={18} />
                        Fret Aérien (kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimMode("SEA")}
                        className="btn"
                        style={{
                          flex: 1,
                          background: simMode === "SEA" ? "var(--gold)" : "var(--bg-glass)",
                          color: simMode === "SEA" ? "#000" : "var(--text-main)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Ship size={18} />
                        Maritime LCL (m³)
                      </button>
                    </div>
                  </div>

                  {simMode === "AIR" ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Poids estimé (kg)</span>
                        <strong style={{ color: "var(--caramel)" }}>{simWeight} kg</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={simWeight}
                        onChange={(e) => setSimWeight(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--caramel)", cursor: "pointer" }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Volume estimé (m³ / CBM)</span>
                        <strong style={{ color: "var(--gold)" }}>{simCbm} m³</strong>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="15"
                        step="0.1"
                        value={simCbm}
                        onChange={(e) => setSimCbm(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--gold)", cursor: "pointer" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Résultat visuel & Action WhatsApp */}
              <div
                style={{
                  background: "rgba(7, 12, 24, 0.95)",
                  padding: "36px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px" }}>
                  Coût estimé indicatif
                </div>
                <div
                  style={{
                    fontSize: "3.2rem",
                    fontWeight: "800",
                    color: "var(--gold)",
                    lineHeight: "1",
                    marginBottom: "8px",
                  }}
                >
                  ~{estimate.amount}{" "}
                  <span style={{ fontSize: "1.5rem", color: "var(--text-main)" }}>{estimate.currency}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "20px" }}>
                  Base tarifaire : {estimate.unit} • Délai indicatif : {estimate.duration}
                </div>

                <div
                  style={{
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    marginBottom: "24px",
                    lineHeight: "1.4",
                  }}
                >
                  ℹ️ Les tarifs finaux dépendent de la nature exacte de la marchandise et sont confirmés
                  après pesée en agence.
                </div>

                <a
                  href={getSimulatorWaUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "100%", padding: "14px" }}
                >
                  <MessageCircle size={20} />
                  Valider ce Devis sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NOTRE PARCOURS EN 4 ÉTAPES */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "12px" }}>
              Comment fonctionne votre expédition ?
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              Un processus simple, tracé et sécurisé de bout en bout.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                step: "01",
                title: "Dépôt au Hub",
                desc: "Votre colis est réceptionné à notre entrepôt (Guangzhou, Dubaï ou Casablanca), pesé, mesuré et étiqueté.",
              },
              {
                step: "02",
                title: "Code Unique & Suivi",
                desc: "Vous recevez votre référence unique (ex: RM-AIR-2610-XXXXXX) pour suivre chaque étape en ligne.",
              },
              {
                step: "03",
                title: "Transit & Douane",
                desc: "Acheminement direct et prise en charge intégrale des formalités de douane par nos déclarants.",
              },
              {
                step: "04",
                title: "Livraison Locale",
                desc: "Retrait dans nos agences locales en Afrique ou livraison directe à votre boutique ou domicile.",
              },
            ].map((s) => (
              <div key={s.step} className="glass-card" style={{ padding: "28px" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "800",
                    color: "var(--gold)",
                    opacity: 0.6,
                    marginBottom: "12px",
                  }}
                >
                  {s.step}
                </div>
                <h4 style={{ fontSize: "1.15rem", marginBottom: "8px" }}>{s.title}</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
