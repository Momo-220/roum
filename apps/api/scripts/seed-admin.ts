import { hashPassword } from "../src/crypto";

/**
 * Script utilitaire pour générer le hash d'un mot de passe administrateur.
 * Usage: npx tsx scripts/seed-admin.ts "MotDePasse"
 */
async function main() {
  const password = process.argv[2] || "AdminRoum2026!";
  const hash = await hashPassword(password);
  console.log("\n========================================================");
  console.log("  Générateur de mot de passe administrateur ROUM TRANSIT");
  console.log("========================================================");
  console.log("Mot de passe en clair :", password);
  console.log("Hash PBKDF2 généré    :", hash);
  console.log("========================================================\n");
}

main().catch(console.error);
