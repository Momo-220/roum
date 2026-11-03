"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", padding: "40px", textAlign: "center" }}>
        <h2>Une erreur imprévue est survenue</h2>
        <p style={{ color: "#666" }}>L&apos;application a rencontré une anomalie temporaire.</p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "16px",
            padding: "10px 18px",
            background: "#111827",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Recharger l&apos;application
        </button>
      </body>
    </html>
  );
}

