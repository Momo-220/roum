import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: "32px 20px",
        background: "#FAF5F0",
        color: "#3A2A21",
        textAlign: "center",
      }}
    >
      <img src="/images/roum-logo-transparent.png" alt="Roum Transit" style={{ height: "74px", width: "auto" }} />
      <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.7rem, 5vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
        Cette page n&apos;existe pas.
      </h1>
      <p style={{ margin: 0, color: "#5C4F48", fontSize: "1.02rem" }}>Le lien est peut-être incomplet.</p>
      <Link
        href="/"
        style={{
          marginTop: "10px",
          padding: "13px 24px",
          border: "1px solid #DCCDB6",
          borderRadius: "9999px",
          background: "#FFFBF4",
          color: "#3A2A21",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
