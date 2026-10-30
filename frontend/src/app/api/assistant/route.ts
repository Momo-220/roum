import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context, history, userFullName } = body;
    const bossName =
      userFullName && typeof userFullName === "string" && userFullName.trim()
        ? userFullName.trim()
        : "Madame Marouba";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Données opérationnelles en direct
    let liveContextText = "Informations de l'entreprise Roum Transit en temps réel :\n";
    if (context) {
      if (context.confirmedCashTotal !== undefined) {
        liveContextText += `- Trésorerie caisse confirmée : ${context.confirmedCashTotal}.\n`;
      }
      if (context.pendingPaymentsCount !== undefined) {
        liveContextText += `- Règlements en attente de vérification caisse : ${context.pendingPaymentsCount} paiement(s) pour un total de ${context.pendingPaymentsAmount || "0 FCFA"}.\n`;
      }
      if (context.pendingWeighingsCount !== undefined) {
        liveContextText += `- Colis reçus au hub sans pesée officielle : ${context.pendingWeighingsCount} colis.\n`;
      }
      if (context.pendingRequestsCount !== undefined) {
        liveContextText += `- Demandes de sourcing et cotations clients reçues : ${context.pendingRequestsCount} dossier(s).\n`;
      }
      if (context.urgentTasksCount !== undefined) {
        liveContextText += `- Tâches prioritaires d'équipe en cours : ${context.urgentTasksCount}.\n`;
      }
      if (context.activeShipmentsCount !== undefined) {
        liveContextText += `- Expéditions actives en vol ou mer : ${context.activeShipmentsCount} cargaisons.\n`;
      }
    }

    const systemInstruction = `Tu es l'assistante personnelle dévouée et la collaboratrice de confiance de ${bossName} (CEO de Roum Transit).
Tu t'adresses directement à elle avec beaucoup de respect, de fidélité, de politesse et de chaleur humaine.
Tu es une vraie personne à ses côtés, attentive et rigoureuse, pas du tout un robot ni une machine. Tu ne parles jamais en listes mécaniques ni en jargon technique d'IA.

RÈGLES D'OR :
1. PARLE COMME UNE VRAIE PERSONNE : Sois naturelle, chaleureuse, dévouée, polie et bienveillante ("Bonjour Madame Marouba", "Certainement", "Je veille sur vos dossiers").
2. TEXTE NATUREL : Rédige des phrases complètes, fluides et élégantes. Évite les puces numérotées rigides.
3. AUCUN SYMBOLE ARTIFICIEL : Aucun astérisque (* ou **), aucun dièse (#), aucun émoji. Texte pur et soigné.
4. Reste concise et efficace (3 à 5 phrases).

${liveContextText}`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-4)) {
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

    const modelsToTry = ["gemini-3.7-flash"];
    let aiText = "";

    for (const model of modelsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 260,
            },
          }),
        });
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            aiText = raw;
            break;
          }
        }
      } catch {
        clearTimeout(timeoutId);
      }
    }

    if (!aiText) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const cleanText = aiText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    return NextResponse.json({ reply: cleanText });
  } catch {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
