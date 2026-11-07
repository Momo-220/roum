# ROUM TRANSIT

Plateforme de gestion de transit et de fret international (Chine & Dubaï, Maroc, Paris ↔ Abidjan vers l'Afrique) : portail client avec suivi de colis, et espace d'administration complet.

## Fonctionnalités

- **Tableau de bord adaptatif** : grille fluide qui s'adapte du mobile à l'écran 4K.
- **Globe 3D des routes** : zoom molette, trackpad et pincement tactile.
- **Expéditions & suivi** : fiche colis en direct, progression en 5 étapes, WhatsApp client en un clic.
- **Grilles tarifaires** : offres par couloir, filtres par mode (aérien, bateau, terrestre) et par devise.
- **Paiements & caisse** : saisie manuelle, contrôle de vérification, références de reçu.
- **Tâches opérationnelles** : tableau de cartes avec priorités.
- **Paramètres** : identité légale de l'entreprise et comptes de paiement (Wave, Orange Money, compte Maroc, caisses).
- **Assistant IA (Gemini)** : réponses basées sur les données opérationnelles.

## Architecture

| Dossier | Contenu |
| --- | --- |
| `frontend/` | Next.js 16 + React 19 (portail public et `/admin`) |
| `backend/` | API Cloudflare Workers + Hono + D1 (SQLite) + Zod |

## Prérequis

- Node.js >= 22 (Next.js 16 demande au moins Node 20.9)
- npm >= 10

## Installation

```bash
npm install
```

## Configuration

Créez `frontend/.env.local` (non versionné) :

```env
GEMINI_API_KEY=votre_cle_gemini
```

Sans cette variable, l'assistant répond avec ses réponses de secours.

Créez aussi `backend/.dev.vars` (non versionné) à partir de `backend/.dev.vars.example`. Sans ce fichier, l'API démarre en mode production et exige `JWT_SECRET`.

## Développement

```bash
# Base D1 locale
npm --prefix backend run d1:local:migrate

# Données de démonstration (facultatif, jamais en production)
npm --prefix backend run d1:local:seed

# API (Wrangler)
npm run dev:backend

# Frontend sur http://localhost:3000
npm run dev:frontend
```

## Scripts utiles

```bash
npm run typecheck      # backend + frontend
npm run build:frontend # build de production
npm run test:backend   # tests Vitest

# Parcours complet Client -> Base -> Admin, contre une API lancée sur une base jetable
API_URL=http://127.0.0.1:8799 node backend/scripts/e2e-sync.mjs
```

## Synchronisation

La base D1 est la seule source de vérité : le navigateur ne conserve aucune donnée métier.

- **Écriture** : une action n'est affichée comme réussie qu'après confirmation du serveur (`frontend/src/shared/api.ts`). Sinon l'erreur réelle est affichée.
- **Lecture** : chaque écran lit des compteurs `sync_versions`, incrémentés par des triggers SQL, et ne recharge que ce qui a changé (`frontend/src/shared/useLiveSync.ts`).
- **Fiabilité** : créations rejouables sans doublon (`idempotency_key`), confirmation d'encaissement atomique et rejouable, conflits détectés par `row_version`.
- **Accès client** : un dossier ne se lit qu'avec sa clé secrète, incluse dans le lien de paiement.

## Mise en production

```bash
# Secret obligatoire pour l'API (32 caractères minimum)
npx wrangler secret put JWT_SECRET

# Migrations de la base distante
npx wrangler d1 migrations apply roum-db --remote
```

Le compte `user-superadmin-01` créé par les migrations n'a aucun mot de passe utilisable. Générez un hash avec `backend/scripts/seed-admin.ts`, puis renseignez-le dans `users.password_hash`.

## Accès à l'espace de gestion

`/admin` n'existe pas pour le public : sans le cookie déposé par le lien secret, il répond 404 comme n'importe quelle adresse inconnue (`frontend/src/proxy.ts`).

- Définissez `ADMIN_ACCESS_KEY` (32 caractères minimum) dans `frontend/.env.local` et chez l'hébergeur du site. Sans cette clé, l'espace reste fermé pour tout le monde.
- Le gérant ouvre une fois `/acces/<clé>` sur chaque appareil, puis se connecte avec son compte.
- Il change son e-mail de connexion et son mot de passe dans Paramètres, avec son mot de passe actuel.
- Cette porte cache l'interface. Les données restent protégées par l'API, qui exige le compte du gérant à chaque requête.

## Sécurité

Ne commitez jamais de clés ou de fichiers `.env*` : ils sont déjà exclus par `.gitignore`.
