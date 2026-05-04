# Décisions

Format ADR léger :

- Statut : accepté, proposé, à confirmer.
- Contexte : pourquoi la décision existe.
- Décision : choix retenu ou envisagé.
- Conséquences : impact pratique.

## ADR-001 : Next.js App Router

- Statut : accepté.
- Contexte : le projet est une application web SaaS avec pages publiques, onboarding et dashboards.
- Décision : utiliser Next.js App Router.
- Conséquences : les routes vivent dans `app/`, avec une préférence pour les données sensibles récupérées côté serveur.

## ADR-002 : TypeScript strict

- Statut : accepté.
- Contexte : les workflows métier touchent permissions, argent et données personnelles.
- Décision : garder TypeScript strict.
- Conséquences : les futures fonctionnalités doivent conserver des types explicites et éviter les raccourcis non sûrs.

## ADR-003 : Prisma et PostgreSQL

- Statut : accepté.
- Contexte : le domaine nécessite des relations fortes entre utilisateurs, logements, contrats, paiements et quittances.
- Décision : utiliser Prisma avec PostgreSQL.
- Conséquences : les changements de modèle doivent passer par migrations Prisma et préserver les invariants métier.

## ADR-004 : Clerk pour l'authentification

- Statut : accepté.
- Contexte : le repo contient des pages Clerk et une table interne `User`.
- Décision : Clerk gère la session ; RentFlow garde le rôle applicatif en base.
- Conséquences : la synchronisation Clerk complète par webhook reste à confirmer.

## ADR-005 : Providers mock par défaut

- Statut : accepté.
- Contexte : paiements, KYC, email et stockage doivent être développés sans dépendre d'intégrations réelles.
- Décision : garder ces services derrière interfaces avec implémentations mock.
- Conséquences : aucune intégration réelle ne doit être ajoutée sans validation explicite.

## ADR-006 : Argent en centimes entiers

- Statut : accepté.
- Contexte : les erreurs d'arrondi sont critiques sur les loyers, charges, dépôts et commissions.
- Décision : stocker les montants en centimes entiers.
- Conséquences : ne pas utiliser de floats pour les montants ; valider avec les helpers et schémas existants.

## ADR-007 : France d'abord

- Statut : accepté.
- Contexte : le premier lancement cible la France.
- Décision : valeurs par défaut `FR`, `EUR`, `fr-FR` et `SEPA_DEBIT`.
- Conséquences : l'internationalisation reste possible mais son périmètre est à confirmer.

## Décisions à clarifier

- Périmètre exact du MVP Phase 1.
- Provider paiement réel éventuel : Stripe Connect, GoCardless, autre ou mock durable.
- Règles de commission plateforme.
- Règles produit détaillées pour colocation liée et baux indépendants.
- Contenu légal attendu des quittances.
- Stratégie de stockage réel des documents.
- Stratégie de création et gestion des comptes admin.
- Synchronisation Clerk par webhook.
- Politique de suspension, résiliation, révocation de mandat et consentements.
- Environnements de déploiement et observabilité.
