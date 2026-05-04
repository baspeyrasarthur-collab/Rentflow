# RentFlow

RentFlow est un MVP SaaS de gestion locative entre particuliers. Ce depot contient le socle technique initial de l'application.

## Description courte

L'objectif est de construire progressivement une application web securisee, maintenable et extensible pour gerer logements, locataires, paiements simules, quittances et administration interne.

## Pile technique

- Next.js avec App Router
- TypeScript strict
- Tailwind CSS et shadcn/ui
- Prisma avec PostgreSQL
- Clerk pour l'authentification
- Fournisseurs simules pour les paiements, la verification d'identite, les emails et le stockage

## Demarrage local

- Lancer PostgreSQL local avec Docker Compose : docker compose up -d.
- Installer les dependances avec npm install.
- Generer le client Prisma avec npm run db:generate.
- Lancer le serveur de developpement avec npm run dev.

## PostgreSQL local

Le fichier docker-compose.yml lance une base PostgreSQL locale pour le developpement :

- service : postgres
- image : postgres:16
- base : rentflow
- utilisateur : postgres
- mot de passe : postgres
- port local : 5432

Commande :

```bash
docker compose up -d
```

La variable DATABASE_URL doit rester :

```bash
postgresql://postgres:postgres@localhost:5432/rentflow?schema=public
```

## Verifications

Avant de valider une etape, executer :

- npm run format
- npm run lint
- npm run typecheck
- npm run test
- npm run build

## Variables d'environnement

Copier .env.example vers .env pour le developpement local. Tant que Clerk reel
n'est pas configure, garder SKIP_ENV_VALIDATION="true" dans .env pour permettre
les builds locaux avec les providers mock.

Les cles Clerk reelles seront obligatoires lorsque l'integration Clerk sera
activee. Les secrets reels ne doivent jamais etre commites.

## Authentification Clerk

Les pages Clerk minimales existent sur /sign-in et /sign-up. Apres connexion ou
inscription, Clerk redirige vers /dashboard, qui route vers /owner, /tenant ou
/admin selon le role stocke dans la table User interne.

/onboarding cree le User interne RentFlow apres une inscription Clerk et limite
le choix public aux roles OWNER et TENANT. Le role ADMIN reste cree manuellement
ou via le seed de developpement.

Pour tester Clerk localement, renseigner NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY et
CLERK_SECRET_KEY dans .env avec des cles de test Clerk. Ne jamais commiter de
vraies cles.

Un webhook Clerk complet pourra etre ajoute dans une etape validee pour renforcer
la synchronisation et reparer les ecarts entre Clerk et la table User interne.

## Regles importantes

- Ne jamais stocker directement de donnees bancaires sensibles.
- Garder les integrations paiement, KYC, email et stockage derriere des abstractions.
- Developper les fonctionnalites par etapes validees.
