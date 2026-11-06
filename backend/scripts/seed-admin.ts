import { hashPassword } from "../src/crypto";

/**
 * Script utilitaire pour générer le hash d'un mot de passe administrateur.
 * Usage: npx tsx scripts/seed-admin.ts "MotDePasse"
 */
async function main() {
  const password = process.argv[2];
  if (!password || password.length < 12) {
    console.error('Indiquez un mot de passe de 12 caractères minimum : npx tsx scripts/seed-admin.ts "MotDePasse"');
    process.exit(1);
  }
  const hash = await hashPassword(password);
  console.log("\n========================================================");
  console.log("  Générateur de mot de passe administrateur ROUM TRANSIT");
  console.log("========================================================");
  console.log("Hash PBKDF2 généré    :", hash);
  console.log("========================================================\n");
}

main().catch(console.error);
