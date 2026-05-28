# Architecture

## Stack technique

- Next.js App Router avec React.
- TypeScript strict.
- Tailwind CSS et shadcn/ui.
- Prisma avec PostgreSQL.
- Clerk pour l'authentification.
- Zod pour la validation.
- Vitest pour les tests.
- Providers mock pour paiement, KYC, email et stockage.

## Structure du projet

- `app/` : routes Next.js, layouts, pages publiques, onboarding et dashboards.
- `components/` : composants UI et layout partagés.
- `features/` : types et éléments orientés fonctionnalité.
- `server/` : logique serveur, auth, sécurité, providers, validation, accès DB.
- `prisma/` : schéma, migrations et seed.
- `emails/` : emplacement prévu pour les templates email.
- `tests/` : tests unitaires et futurs tests d'intégration.
- `docs/` : documentation produit, architecture, roadmap et décisions.

## Logique frontend/backend

Le frontend actuel expose surtout des pages serveur Next.js, les tableaux de bord et le CRUD proprietaire des logements. Les donnees sensibles sont recuperees cote serveur via `server/*`.

Les futures mutations métier doivent rester côté serveur quand elles touchent permissions, argent, contrats, mandats, paiements ou données personnelles.

## Validation

- Les entrées utilisateur doivent être validées avec Zod.
- Des schémas communs existent pour email, devise, montants en centimes et pagination.
- L'onboarding valide publiquement uniquement les rôles `OWNER` et `TENANT`.

## Auth

- Clerk gère la session.
- La table interne `User` stocke le rôle applicatif.
- `/dashboard` redirige vers `/owner`, `/tenant` ou `/admin`.
- `/onboarding` crée le `User` interne et le profil owner/tenant associé.
- Le rôle `ADMIN` est créé manuellement ou via seed, à confirmer pour la production.
- Un webhook Clerk complet reste à confirmer.

## Prisma et database

PostgreSQL est la base cible. Prisma modélise les principaux agrégats métier :

- utilisateurs et profils owner/tenant ;
- logements, contrats et rattachements locataires ;
- invitations, mandats, paiements, commissions, dépenses et quittances ;
- notifications, KYC, consentements, webhooks, paramètres plateforme et audit logs.

Le client Prisma est généré dans `lib/generated/prisma`.

## Providers

Les providers paiement, KYC, email et stockage sont abstraits derrière interfaces et actuellement mockés.

Les intégrations réelles comme Stripe, GoCardless, Resend, KYC réel ou stockage réel ne doivent pas être ajoutées sans validation explicite.

## Sécurité

- Les permissions doivent être vérifiées côté serveur.
- Les accès owner/tenant doivent être filtrés par propriétaire ou locataire réel.
- Les données bancaires sensibles ne doivent pas être stockées.
- Les webhooks doivent être signés, idempotents et stockés bruts quand le schéma le permet.
- Les actions sensibles doivent être enregistrées dans `AuditLog` quand applicable.
- Les providers ne doivent jamais faire détenir les fonds directement par l'application.
