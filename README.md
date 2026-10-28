# ROUM TRANSIT

Plateforme de gestion de transit et de fret international (Chine & Dubaï, Maroc, Paris ↔ Abidjan vers l'Afrique) : portail client avec suivi de colis, et espace d'administration complet.

## Fonctionnalités

- **Tableau de bord adaptatif** : grille fluide qui s'adapte du mobile à l'écran 4K.
- **Globe 3D des routes** : zoom molette, trackpad et pincement tactile.
- **Expéditions & suivi** : fiche colis en direct, progression en 5 étapes, WhatsApp client en un clic.
- **Grilles tarifaires** : offres par couloir, filtres par mode (aérien, bateau, terrestre) et par devise.
- **Paiements & caisse** : saisie manuelle, contrôle de vérification, références de reçu.
- **Tâches opérationnelles** : tableau de cartes avec priorités.
- **Paramètres** : identité légale de l'entreprise et comptes de paiement (Wave, Orange Money, MTN MoMo, Moov, virements bancaires, SEPA, Alipay/WeChat, caisses).
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

Sans cette variable, la route `/api/assistant` renvoie une erreur 500.

## Développement

```bash
# Base D1 locale
npm --prefix backend run d1:local:migrate

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
```

## Sécurité

Ne commitez jamais de clés ou de fichiers `.env*` : ils sont déjà exclus par `.gitignore`.
