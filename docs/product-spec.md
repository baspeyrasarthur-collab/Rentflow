# Product Spec

## Objectif du produit

RentFlow est un MVP SaaS de gestion locative entre propriétaires privés et locataires. Le premier lancement cible la France, avec une base technique pensée pour rester extensible.

Le produit doit permettre de gérer progressivement logements, locataires, contrats, paiements simulés, quittances et administration interne.

## Utilisateurs cibles

- Propriétaires particuliers qui gèrent un ou plusieurs logements.
- Locataires rattachés à une location.
- Administrateurs internes RentFlow.

## Rôles

- `OWNER` : accède à ses logements, contrats, paiements, commissions et quittances.
- `TENANT` : accède à ses locations, mandats, paiements et quittances.
- `ADMIN` : accède aux vues globales et aux données de supervision.

## Fonctionnalités existantes

- Accueil, connexion et inscription via Clerk.
- Onboarding pour créer un utilisateur interne `OWNER` ou `TENANT`.
- Redirection `/dashboard` selon le rôle interne.
- Tableaux de bord pour proprietaire, locataire et admin ; locataire et admin restent en lecture seule.
- CRUD proprietaire pour lister, creer, consulter, modifier et archiver logiquement ses logements.
- Modèle de données Prisma pour utilisateurs, profils, logements, contrats, colocations, invitations, paiements, mandats, quittances, dépenses, commissions, notifications, KYC, consentements, webhooks et audit logs.
- Seed de développement avec données fictives.
- Providers mock pour paiement, KYC, email et stockage.
- Tests unitaires sur argent, validation, providers, erreurs et contrôle d'accès.

## Fonctionnalités prévues

- Création de contrats individuels et colocations.
- Invitations locataires et acceptation côté locataire.
- Mandats de paiement simulés.
- Planification et suivi des paiements simulés.
- Génération, stockage et consultation des quittances.
- Gestion des dépenses ponctuelles.
- Notifications consultables.
- Actions admin de supervision au-delà de la lecture seule, à confirmer.
- Webhooks mock idempotents et signés, à confirmer.
- Providers réels après validation explicite.

## MVP Phase 1

### Fonctionnalités incluses

- Finalisation du socle projet : documentation, `npm run check`, CI minimale et check global.
- CRUD propriétaire pour créer, consulter, modifier et lister ses logements.
- Création d'un contrat individuel rattaché à un logement propriétaire.
- Invitation d'un locataire sur un contrat via provider email mock.
- Acceptation d'invitation par un locataire authentifié.
- Consultation propriétaire des logements, contrats, invitations et paiements simulés liés.
- Consultation locataire des locations rattachées, paiements simulés, mandats et quittances disponibles.
- Création et acceptation de mandats de paiement mock.
- Planification et suivi de paiements mock.
- Génération ou mise à disposition de quittances mock, à confirmer.
- Tableau admin de supervision en lecture seule.

### Fonctionnalités explicitement exclues

- Intégrations réelles Stripe, GoCardless, Resend, KYC ou stockage.
- Encaissement réel, détention de fonds ou virement réel.
- Stockage d'IBAN complet ou de données bancaires sensibles.
- Gestion complète des colocations liées et baux indépendants, à confirmer.
- Webhooks providers réels.
- Application mobile native.
- Internationalisation hors France/EUR/fr-FR.
- Workflows complets de suspension, résiliation et litiges.
- Actions admin avancées comme arbitrage, support opérationnel ou modification manuelle de données, à confirmer.

### Parcours utilisateur propriétaire

1. Le propriétaire s'inscrit ou se connecte avec Clerk.
2. Il crée son compte interne via l'onboarding `OWNER`.
3. Il accède au dashboard propriétaire.
4. Il crée un logement avec adresse, type, statut et informations principales.
5. Il crée un contrat individuel sur ce logement.
6. Il invite un locataire par email mock.
7. Il suit le statut de l'invitation, du contrat, des paiements simulés et des quittances.

### Parcours utilisateur locataire

1. Le locataire s'inscrit ou se connecte avec Clerk.
2. Il crée son compte interne via l'onboarding `TENANT`.
3. Il accepte une invitation liée à son email, à confirmer.
4. Il accède au dashboard locataire.
5. Il consulte sa location, son mandat mock, ses paiements simulés et ses quittances disponibles.
6. Il accepte ou visualise un mandat de paiement mock, à confirmer.

### Parcours utilisateur admin

1. L'admin se connecte avec un compte `ADMIN` créé via seed ou procédure manuelle.
2. Il accède au dashboard admin.
3. Il consulte les utilisateurs, logements, paiements, webhooks et vérifications KYC.
4. Il identifie les éléments à surveiller sans action de correction avancée dans le MVP.

### Critères d'acceptation globaux

- Les parcours inclus fonctionnent avec providers mock uniquement.
- Les accès owner, tenant et admin sont protégés côté serveur.
- Les données affichées sont filtrées selon le rôle et le propriétaire réel des ressources.
- Les entrées utilisateur sont validées avec Zod.
- Les montants sont stockés et manipulés en centimes entiers.
- Les actions sensibles sont prêtes à être auditées via `AuditLog` quand applicable.
- La CI exécute installation, validation Prisma, format, lint, typecheck, tests et build.
- Aucun secret réel n'est nécessaire pour lancer le MVP en local ou en CI.

### Hypothèses produit

- Le MVP cible uniquement la France.
- La devise unique est `EUR`.
- Le mode de paiement de référence est `SEPA_DEBIT`, mocké.
- Les emails sont simulés et non envoyés réellement.
- Le stockage de quittance est mocké.
- Les données seed servent de support de démonstration et de développement.
- Les comptes admin ne sont pas créés publiquement.

### Risques ou décisions à confirmer

- Contenu légal exact des quittances.
- Niveau fonctionnel attendu pour la génération de quittance mock.
- Acceptation d'invitation par token, par email connecté ou autre mécanisme.
- Règles détaillées de commission plateforme.
- Périmètre colocation dans ou hors MVP Phase 1.
- Stratégie de synchronisation Clerk par webhook.
- Politique de suspension, résiliation et révocation de mandat.
- Couverture minimale de tests d'intégration attendue.

## Règles métier connues

- Les montants doivent être stockés en centimes entiers.
- La devise par défaut est `EUR`, le pays par défaut `FR`, la locale `fr-FR`.
- Un propriétaire ne doit accéder qu'à ses propres ressources.
- Un locataire ne doit accéder qu'à ses propres locations, paiements, mandats et quittances.
- L'accès admin doit être protégé par rôle.
- L'application ne doit jamais stocker d'IBAN complet ni de données bancaires sensibles.
- Les providers externes doivent rester derrière des interfaces.
- Les actions sensibles doivent être auditables quand le schéma le permet.
- Les consentements doivent rester explicites pour mandats, CGU, autorisations de paiement, suspension et résiliation.
