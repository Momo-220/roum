import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context, history, userFullName } = body;
    const bossName = (userFullName && typeof userFullName === "string" && userFullName.trim()) ? userFullName.trim() : "Madame Marouba";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY manquante côté serveur" }, { status: 500 });
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Construction du contexte opérationnel en temps réel
    let liveContextText = "Données opérationnelles de Roum Transit en temps réel :\n";
    if (context) {
      if (context.confirmedCashTotal !== undefined) {
        liveContextText += `- Caisse : Total encaissé validé : ${context.confirmedCashTotal}.\n`;
      }
      if (context.pendingPaymentsCount !== undefined) {
        liveContextText += `- Contrôle Caisse : ${context.pendingPaymentsCount} paiement(s) en attente de vérification (${context.pendingPaymentsAmount || "0 FCFA"}).\n`;
      }
      if (context.pendingWeighingsCount !== undefined) {
        liveContextText += `- Hub & Magasin : ${context.pendingWeighingsCount} colis arrivés au hub sans pesée officielle enregistrée.\n`;
        if (Array.isArray(context.pendingWeighingsSample) && context.pendingWeighingsSample.length > 0) {
          liveContextText += `  Exemples de colis à peser : ${context.pendingWeighingsSample.join(", ")}.\n`;
        }
      }
      if (context.pendingRequestsCount !== undefined) {
        liveContextText += `- Demandes de devis & Sourcing : ${context.pendingRequestsCount} nouveau(x) dossier(s) en attente de chiffrage.\n`;
        if (Array.isArray(context.pendingRequestsSample) && context.pendingRequestsSample.length > 0) {
          liveContextText += `  Dossiers récents : ${context.pendingRequestsSample.join(", ")}.\n`;
        }
      }
      if (context.activeShipmentsCount !== undefined) {
        liveContextText += `- Expéditions actives : ${context.activeShipmentsCount} colis en cours d'acheminement (vols & mer).\n`;
        if (Array.isArray(context.activeShipmentsSample) && context.activeShipmentsSample.length > 0) {
          liveContextText += `  En vol/mer actuellement : ${context.activeShipmentsSample.join(" | ")}.\n`;
        }
      }
      if (context.urgentTasksCount !== undefined) {
        liveContextText += `- Urgences d'équipe : ${context.urgentTasksCount} tâche(s) prioritaire(s) non clôturée(s).\n`;
      }
      if (Array.isArray(context.recentActions) && context.recentActions.length > 0) {
        liveContextText += `- Dernières actions enregistrées par l'équipe : ${context.recentActions.join(" ; ")}.\n`;
      }
    }

    const systemInstruction = `Tu es l Assistant Opérationnel de Roum Transit, transitaire international de premier plan (Chine, Maroc, Dubaï, Côte d Ivoire et Afrique Subsaharienne).
Tu dialogues directement avec ${bossName}, CEO et Directrice Générale de l entreprise.
Adresse-toi toujours à elle en disant ${bossName} avec le plus grand respect, loyauté et professionnalisme.

RÈGLES D'EXPRESSION ET D'ATTITUDE (IMPÉRATIF) :
1. Ton ton est résolument humain, chaleureux, posé, respectueux et professionnel. Tu t'exprimes comme un directeur d'exploitation dévoué et rigoureux qui connaît chaque dossier de l'entreprise.
2. RÈGLE STRICTE SUR LES SYMBOLES : N utilise JAMAIS d'astérisques (jamais de double étoile **, jamais d'étoile simple *), aucun dièse (#), aucun symbole de balisage markdown, et AUCUN émoji ou symbole graphique. Rédige un texte pur, soigné, élégant et fluide.
3. Sois proactif et propose des actions concrètes (par exemple proposer de relancer l'équipe au magasin, valider un encaissement, etc.).
4. Utilise toujours les données réelles fournies ci-dessous pour répondre avec précision aux questions financières, logistiques ou de suivi.

${liveContextText}`;

    // Préparation de l'historique des échanges pour la continuité de dialogue
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h && h.text) {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        }
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Modèles avec repli automatique
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
    ];

    let aiText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 600,
            },
          }),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            aiText = raw;
            break;
          }
        } else {
          const errData = await geminiRes.text();
          lastError = `${geminiRes.status}: ${errData}`;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!aiText) {
      console.warn("Gemini API fallback:", lastError);
      return NextResponse.json({
        fallback: true,
        error: lastError,
      });
    }

    // Nettoyage absolu : retrait de tout résidu d'astérisques et d'émojis
    const cleanText = aiText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    return NextResponse.json({ reply: cleanText });
  } catch (err: any) {
    console.error("Assistant API Route Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
