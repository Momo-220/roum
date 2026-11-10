/**
 * Logo « Roum boutique » : le « Roum » et son coup de pinceau viennent du logo d'origine,
 * « boutique » est écrit dans une écriture pinceau proche de « transit ».
 */
export function RoumBoutiqueLogo({ width = 120 }: { width?: number }) {
  return (
    <span className="rb-logo" style={{ width }} role="img" aria-label="Roum boutique">
      <span className="rb-logo-top">
        <img src="/images/roum-logo-transparent.png" alt="" aria-hidden="true" />
      </span>
      <span className="rb-logo-word" aria-hidden="true" style={{ fontSize: width * 0.25 }}>
        boutique
      </span>
    </span>
  );
}
