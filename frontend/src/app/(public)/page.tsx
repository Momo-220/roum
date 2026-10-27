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
          padding: "70px 0 50px 0",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="container" style={{ maxWidth: "860px" }}>
          {/* Badge Top */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              color: "var(--brown-dark)",
              fontSize: "0.82rem",
              fontWeight: "600",
              marginBottom: "24px",
            }}
          >
            <ShieldCheck size={16} color="var(--brown-light)" />
            Transport International & Sourcing Sécurisé
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              lineHeight: "1.15",
              marginBottom: "20px",
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            Expédiez depuis la Chine, Dubaï et le Maroc vers l&apos;Afrique
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "36px",
              maxWidth: "680px",
              margin: "0 auto 36px auto",
            }}
          >
            Suivi transparent de vos colis en temps réel, tarifs négociés au kilo ou au m³,
            et assistance continue sur WhatsApp de l&apos;enlèvement à la livraison.
          </p>

          {/* Formulaire de Suivi Direct (Tracking) */}
          <div
            id="tracking"
            className="card-clean"
            style={{
              padding: "26px",
              maxWidth: "680px",
              margin: "0 auto",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "var(--brown-dark)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={18} color="var(--brown-light)" />
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
                className="input-clean"
                placeholder="Ex : RM-AIR-2610-K8P9Q2 ou numéro reçu par SMS/WhatsApp"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                style={{
                  flex: "1 1 300px",
                  fontSize: "0.95rem",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: "0 0 auto", padding: "10px 22px" }}
              >
                Localiser mon Colis
                <ArrowRight size={17} />
              </button>
            </form>

            {trackingError && (
              <div
                style={{
                  marginTop: "12px",
                  color: "var(--state-danger-text)",
                  background: "var(--state-danger-bg)",
                  border: "1px solid var(--state-danger-border)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.82rem",
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
                borderTop: "1px solid var(--border-light)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>Accès direct sans mot de passe requis.</span>
              <span>
                Exemple de test :{" "}
                <button
                  type="button"
                  onClick={() => setTrackingInput("RM-AIR-2610-K8P9Q2")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brown-light)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: "600",
                    fontFamily: "inherit",
                  }}
                >
                  RM-AIR-2610-K8P9Q2
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" style={{ padding: "60px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                color: "var(--brown-light)",
                fontWeight: "700",
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Nos Solutions Logistiques
            </div>
            <h2 style={{ fontSize: "2rem", color: "var(--text-main)" }}>
              Du petit colis e-commerce au conteneur complet
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Service 1 : Aérien */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <Plane size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Fret Aérien Express & Standard
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Vols réguliers au départ de Guangzhou, Yiwu et Dubaï. Idéal pour les échantillons,
                l&apos;électronique, les vêtements urgents et pièces détachées.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Délais indicatifs : 3 à 7 jours ouvrés
              </div>
            </div>

            {/* Service 2 : Maritime */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <Ship size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Maritime Groupage (LCL) & FCL
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Optimisez vos coûts pour les gros volumes. Vous ne payez que le volume (CBM) réellement
                occupé dans nos conteneurs sécurisés avec dédouanement inclus.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Tarification avantageuse au m³ (CBM)
              </div>
            </div>

            {/* Service 3 : Achat & Sourcing */}
            <div className="card-clean" style={{ padding: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  color: "var(--brown-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <ShoppingBag size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-main)" }}>
                Achats & Sourcing Usines
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                Accompagnement sur les marchés de gros (1688, Taobao, marchés de Dubaï). Nous réglons
                vos fournisseurs en devises locales et inspectons la marchandise avant expédition.
              </p>
              <div style={{ color: "var(--brown-dark)", fontWeight: "600", fontSize: "0.85rem" }}>
                Paiement sécurisé des fournisseurs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIMULATEUR DE DEVIS INTERACTIF */}
      <section
        id="tariffs"
        style={{
          padding: "60px 0",
        }}
      >
        <div className="container">
          <div
            className="card-clean"
            style={{
              padding: "40px 32px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "36px",
                alignItems: "center",
              }}
            >
              {/* Formulaire simulateur */}
              <div>
                <div
                  style={{
                    color: "var(--brown-light)",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calculator size={17} />
                  Simulateur Tarifaire Gratuit
                </div>
                <h2 style={{ fontSize: "1.8rem", marginBottom: "16px", color: "var(--text-main)" }}>
                  Estimez le coût de votre expédition en 3 clics
                </h2>

                <div style={{ display: "grid", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                        Pays d&apos;Origine
                      </label>
                      <select
                        className="input-clean"
                        value={simOrigin}
                        onChange={(e) => setSimOrigin(e.target.value)}
                      >
                        <option value="Chine">Chine (Guangzhou / Yiwu)</option>
                        <option value="Dubaï">Dubaï (Émirats)</option>
                        <option value="Maroc">Maroc (Casablanca)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                        Destination (Afrique)
                      </label>
                      <select
                        className="input-clean"
                        value={simDest}
                        onChange={(e) => setSimDest(e.target.value)}
                      >
                        <option value="Mali">Mali (Bamako)</option>
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire (Abidjan)</option>
                        <option value="Sénégal">Sénégal (Dakar)</option>
                        <option value="Guinée">Guinée (Conakry)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                      Mode de Transport
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setSimMode("AIR")}
                        className="btn"
                        style={{
                          flex: 1,
                          background: simMode === "AIR" ? "var(--brown-dark)" : "#FFFFFF",
                          color: simMode === "AIR" ? "#FAF8F5" : "var(--text-main)",
                          border: `1px solid ${simMode === "AIR" ? "var(--brown-dark)" : "var(--border-light)"}`,
                        }}
                      >
                        <Plane size={17} />
                        Fret Aérien (kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimMode("SEA")}
                        className="btn"
                        style={{
                          flex: 1,
                          background: simMode === "SEA" ? "var(--brown-dark)" : "#FFFFFF",
                          color: simMode === "SEA" ? "#FAF8F5" : "var(--text-main)",
                          border: `1px solid ${simMode === "SEA" ? "var(--brown-dark)" : "var(--border-light)"}`,
                        }}
                      >
                        <Ship size={17} />
                        Maritime LCL (m³)
                      </button>
                    </div>
                  </div>

                  {simMode === "AIR" ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Poids estimé (kg)</span>
                        <strong style={{ color: "var(--brown-dark)" }}>{simWeight} kg</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={simWeight}
                        onChange={(e) => setSimWeight(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brown-dark)", cursor: "pointer" }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Volume estimé (m³ / CBM)</span>
                        <strong style={{ color: "var(--brown-dark)" }}>{simCbm} m³</strong>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="15"
                        step="0.1"
                        value={simCbm}
                        onChange={(e) => setSimCbm(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brown-dark)", cursor: "pointer" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Résultat visuel & Action WhatsApp */}
              <div
                style={{
                  background: "var(--bg-subtle)",
                  padding: "32px 28px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Coût estimé indicatif
                </div>
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: "800",
                    color: "var(--brown-dark)",
                    lineHeight: "1",
                    marginBottom: "8px",
                  }}
                >
                  ~{estimate.amount}{" "}
                  <span style={{ fontSize: "1.3rem", color: "var(--text-secondary)" }}>{estimate.currency}</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "18px" }}>
                  Base tarifaire : {estimate.unit} • Délai indicatif : {estimate.duration}
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginBottom: "20px",
                    lineHeight: "1.4",
                  }}
                >
                  Les tarifs finaux dépendent de la nature exacte de la marchandise et sont confirmés
                  après pesée en agence.
                </div>

                <a
                  href={getSimulatorWaUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "100%", padding: "12px", fontSize: "0.9rem" }}
                >
                  <MessageCircle size={18} />
                  Valider ce Devis sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NOTRE PARCOURS EN 4 ÉTAPES */}
      <section style={{ padding: "60px 0 80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "10px", color: "var(--text-main)" }}>
              Comment fonctionne votre expédition ?
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Un processus simple, tracé et sécurisé de bout en bout.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
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
              <div key={s.step} className="card-clean" style={{ padding: "24px" }}>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: "var(--brown-light)",
                    marginBottom: "10px",
                  }}
                >
                  {s.step}
                </div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "6px", color: "var(--text-main)" }}>{s.title}</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
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
