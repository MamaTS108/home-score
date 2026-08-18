# HOME SCORE

AI Renovation Planner — *Imagine it. Plan it. Budget it.*

Prenez une photo d'une pièce, décrivez ce que vous voulez, et obtenez :

1. une visualisation IA avant/après
2. une liste des travaux à réaliser
3. une liste des matériaux nécessaires
4. une estimation du coût des produits
5. un budget global estimatif
6. la possibilité d'itérer avec l'IA

Ce n'est **pas** un générateur d'images : c'est un assistant de rénovation qui transforme
"je voudrais refaire mon appartement" en "voici à quoi ça pourrait ressembler, voici ce
qu'il faut acheter, et voici combien ça pourrait coûter." Le MVP donne uniquement des
**estimations**, jamais un devis professionnel.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** (Postgres + Auth + Storage) pour la persistance
- **Anthropic Claude** pour la vision, la planification de travaux et l'assistant conversationnel
- **Vitest** pour les tests unitaires (budget engine, product provider, home score)

## Architecture

```
src/lib/
  types.ts                       # contrat de domaine partagé
  ai/
    vision/analyzeRoom.ts        # UNDERSTAND — analyse de la photo
    renovation/generatePlan.ts   # PLAN — travaux + catégories de matériaux
    design/generateRenovationPrompt.ts
    design/generateDesign.ts     # IMAGINE — interface DesignProvider (stub MVP)
    assistant/renovationAssistant.ts  # itération conversationnelle
    client.ts                    # client Anthropic centralisé
  budget/
    budgetEngine.ts              # MATERIALS -> BUDGET (jamais de prix côté LLM)
  products/
    ProductProvider.ts           # interface (searchProducts/getProduct/estimatePrice)
    MockProductProvider.ts       # implémentation MVP, catalogue indicatif
    catalog.ts
  repositories/projectRepository.ts  # toute la persistance Supabase
  services/generateProject.ts    # orchestre analyse -> plan -> budget -> design
  supabase/{client,server,admin,storage}.ts
```

L'IA ne produit **jamais** de prix : elle produit des types de matériaux et des quantités
approximatives. C'est le `budgetEngine` + `ProductProvider` qui calculent les prix, côté
backend. `MockProductProvider` peut être remplacé demain par `LeroyMerlinProvider`,
`CastoramaProvider`, etc. sans toucher au reste de l'app.

## Démarrage en local

### 1. Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com) (gratuit)
- Une clé API [Anthropic](https://console.anthropic.com/settings/keys)

### 2. Installation

```bash
npm install
cp .env.example .env.local
```

Remplissez `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

(Project Settings > API dans votre dashboard Supabase.)

### 3. Base de données

Dans l'éditeur SQL de Supabase, exécutez dans l'ordre :

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_seed_products.sql
```

Cela crée les tables (`renovation_projects`, `room_analyses`, `renovation_plans`,
`renovation_tasks`, `products`, `project_products`, `budget_estimates`,
`design_generations`, `ai_messages`, `profiles`), les policies RLS, le bucket de storage
`room-photos`, et seed le catalogue produits indicatif.

### 4. Lancer l'app

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

Le parcours principal (`/renovate`) fonctionne **sans connexion** — les projets anonymes
sont créés avec `user_id = null` et accessibles via leur URL, exactement comme demandé
dans le cahier des charges ("auth + dashboard" vient après le parcours principal).
Connectez-vous ensuite (`/login`, `/signup`) pour retrouver vos projets dans `/app`.

### 5. Tests

```bash
npm run test        # vitest run, une fois
npm run test:watch  # mode watch
```

17 tests couvrent : `budgetEngine` (calcul, dépassement de budget, optimisation),
`MockProductProvider` (recherche, estimation de prix), et `homeScore`.

## Notes importantes / limitations volontaires du MVP

- **`DesignProvider` est un stub** (`src/lib/ai/design/generateDesign.ts`). Aucun
  générateur d'image n'est branché : la page "Visualisation" affiche la photo originale
  en attendant qu'un vrai backend d'image (Gemini image, fal.ai, Replicate...) soit choisi
  et branché derrière la même interface. Tout le reste de la chaîne (travaux, matériaux,
  budget, itération) fonctionne réellement avec Claude.
- **Le service role Supabase est utilisé côté API routes** pour que le parcours
  fonctionne avant l'authentification (voir le commentaire dans
  `src/lib/supabase/admin.ts`). À review avant une mise en prod avec de vrais comptes.
- **Aucune intégration Leroy Merlin** n'existe ni n'est simulée comme réelle — uniquement
  l'abstraction `ProductProvider` + `MockProductProvider` avec un catalogue indicatif.
- Toutes les quantités et prix affichés sont des **estimations**, jamais un devis.

## Roadmap (non implémenté dans ce MVP)

- V2 : vrais catalogues produits (Leroy Merlin si autorisé, Castorama, ManoMano...),
  comparaison de prix, disponibilité temps réel
- V3 : artisans, devis, géolocalisation, matching
- V4 : marketplace travaux, affiliation, commission
- V5 : financement travaux, B2B immobilier
