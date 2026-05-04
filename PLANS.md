# PLANS.md

## Vision courte du projet

RentFlow est un MVP SaaS de gestion locative entre propriétaires privés et locataires, ciblant d'abord la France, avec une architecture prévue pour rester extensible. Le socle actuel combine Next.js App Router, TypeScript strict, Prisma/PostgreSQL, Clerk et des providers mock pour les paiements, la vérification d'identité, l'email et le stockage.

## Phases du projet

| Phase                     | Objectif                                                                                                                                            | Statut                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Phase 0 : socle technique | Initialiser l'application, la configuration, le schéma de données, les providers mock, les règles de validation et les premiers tests.              | en cours, avancée ; à finaliser avec check global, docs et CI minimale |
| Phase 1 : MVP             | Construire les parcours exploitables propriétaire, locataire et admin autour des logements, contrats, invitations, paiements simulés et quittances. | en cours                                                               |
| Phase 2 : stabilisation   | Renforcer les permissions, les tests, les erreurs, l'audit, les webhooks et la robustesse des workflows.                                            | à faire                                                                |
| Phase 3 : production      | Préparer le déploiement, les environnements, les providers réels validés, l'observabilité et les procédures d'exploitation.                         | à faire                                                                |

## Règles de priorité

- Terminer le socle Phase 0 avant d'élargir fortement le MVP : check global, documentation minimale et CI.
- Avancer par petites tâches validées, sans démarrer une phase majeure sans accord utilisateur.
- Prioriser les workflows serveur sécurisés avant les interfaces riches.
- Garder les providers réels hors scope tant qu'ils ne sont pas explicitement validés.
- Préférer les actions métier auditables, testées et limitées au périmètre approuvé.

## Fonctionnalités déjà implémentées

- Application Next.js App Router avec TypeScript, Tailwind CSS et configuration shadcn/ui.
- Pages publiques minimales : accueil, connexion Clerk, inscription Clerk.
- Routage `/dashboard` vers `/owner`, `/tenant` ou `/admin` selon le rôle interne.
- Onboarding authentifié permettant de créer un utilisateur interne OWNER ou TENANT depuis une session Clerk.
- Contrôle d'accès serveur par rôle et helpers d'accès aux ressources owner/tenant.
- Layouts et tableaux de bord en lecture seule pour propriétaire, locataire et admin.
- Schéma Prisma couvrant utilisateurs, profils, logements, contrats, colocations, invitations, mandats, paiements, dépenses, quittances, commissions, notifications, KYC, consentements, webhooks, paramètres plateforme et audit logs.
- Migration Prisma initiale et client Prisma généré.
- Seed de développement avec admin, propriétaire, locataires, logement individuel, colocations, invitations, mandats, paiements, quittance, commission, notification, webhook et audit log fictifs.
- Providers mock derrière interfaces pour paiement, KYC, email et stockage.
- Validation Zod pour l'onboarding et des schémas communs.
- Helpers monétaires en centimes entiers avec formatage EUR/fr-FR.
- Tests unitaires pour argent, validation, providers mock, erreurs applicatives et contrôle d'accès.
- Scripts npm pour dev, build, lint, typecheck, format, tests, Prisma generate/migrate/seed/studio.

## Fonctionnalités à venir

- CRUD propriétaire pour créer et modifier logements.
- Création et activation de contrats de location individuels.
- Gestion complète des colocations liées et indépendantes.
- Création, envoi, expiration et acceptation des invitations locataires.
- Parcours locataire pour rejoindre une location.
- Création et acceptation de mandats de paiement simulés depuis l'interface.
- Planification, déclenchement et suivi des paiements simulés.
- Génération, stockage et consultation des quittances.
- Gestion des dépenses ponctuelles.
- Notifications consultables et marquables comme lues.
- Actions admin au-delà de la lecture seule : supervision, désactivation utilisateur, revue KYC, suivi webhooks, à confirmer.
- Webhooks providers mock avec vérification de signature et idempotence.
- Synchronisation Clerk renforcée par webhook, à confirmer.
- Intégrations réelles de paiement, KYC, email et stockage après validation utilisateur.
- Internationalisation au-delà de France/EUR/fr-FR, à confirmer.

## Décisions à clarifier

- Périmètre exact du MVP fonctionnel à livrer en Phase 1.
- Ordre prioritaire des workflows métier : logements, contrats, invitations, paiements, quittances, admin.
- Provider de paiement réel cible éventuel : Stripe Connect, GoCardless, autre, ou maintien mock, à confirmer.
- Règles détaillées de commission plateforme.
- Règles produit pour colocation liée vs baux indépendants.
- Statut légal et contenu attendu des quittances générées, à confirmer.
- Stratégie de stockage des documents de quittance et pièces justificatives, à confirmer.
- Stratégie de création des comptes ADMIN.
- Niveau d'automatisation attendu pour la synchronisation Clerk.
- Politique de suspension, résiliation, révocation de mandat et consentements associés.
- Environnements cibles de déploiement et contraintes d'hébergement, à confirmer.

## Risques techniques

- Les tableaux de bord sont en lecture seule : les workflows métier ne sont pas encore utilisables de bout en bout.
- Le modèle Prisma est large dès le départ ; les invariants métier devront être verrouillés au fur et à mesure des actions serveur.
- Les helpers de permission existent, mais chaque nouveau workflow devra vérifier explicitement les accès côté serveur.
- Les providers paiement, KYC, email et stockage sont mockés ; les écarts avec de vrais providers restent à confirmer.
- Les webhooks sont modélisés mais aucun traitement complet n'est visible dans le code existant.
- La synchronisation Clerk dépend surtout de l'onboarding ; un webhook Clerk complet reste à confirmer.
- Les tests actuels semblent surtout unitaires ; la couverture intégration/E2E des parcours Next.js reste à confirmer.
- Les commandes de vérification complètes doivent être exécutées régulièrement ; dernier état exact à confirmer.
- Les données bancaires sensibles ne doivent jamais être stockées ; le respect devra être surveillé lors des futurs workflows de mandat.

## Definition of Done pour toute nouvelle fonctionnalité

- Le périmètre approuvé est implémenté sans fonctionnalité non demandée.
- Les permissions serveur sont vérifiées pour toute donnée propriétaire, locataire ou admin.
- Les entrées utilisateur sont validées avec Zod quand applicable.
- Les montants restent stockés en centimes entiers.
- Les providers restent derrière interfaces et mockés sauf validation explicite.
- Les actions sensibles sont prêtes à être tracées dans `AuditLog` quand applicable.
- `npm run check` passe dès que le script existe ; sinon lancer format, lint, typecheck, test et build séparément.

## Prochaines tâches recommandées pour Codex

1. Créer un dossier `docs/` avec une documentation courte du socle, du modèle métier et des commandes projet.
2. Ajouter un script `npm run check` qui regroupe format check, lint, typecheck, test et build.
3. Ajouter une CI minimale qui exécute `npm run check`.
4. Clarifier et documenter le périmètre exact de la Phase 1 MVP avant d'ajouter de nouveaux workflows.
5. Vérifier l'état complet du socle avec le check global.
6. Implémenter le premier CRUD propriétaire pour les logements avec validation Zod et contrôle d'accès serveur.
7. Ajouter les tests serveur associés au CRUD logement.
8. Implémenter ensuite la création de contrat individuel rattaché à un logement propriétaire.
9. Ajouter le workflow d'invitation locataire en mock email.
10. Ajouter le parcours locataire d'acceptation d'invitation.
11. Construire les actions mock de mandat, paiement et quittance seulement après validation du flux logement/contrat/invitation.
12. Renforcer l'audit log sur les actions sensibles dès que les premières mutations métier sont ajoutées.

## Points à surveiller / à traiter plus tard

- Réévaluer l'erreur locale Vitest/Vite `spawn EPERM` après exécution de la CI.
- Vérifier le résultat réel de la CI GitHub Actions après push.
- Ajouter un service PostgreSQL en CI quand des tests d'intégration Prisma nécessiteront une vraie base.
- Clarifier l'usage de `SKIP_ENV_VALIDATION` entre local, CI et production.
- Décider le mécanisme d'acceptation d'invitation locataire : token, email connecté ou autre.
- Clarifier le contenu légal exact des quittances.
- Définir le niveau fonctionnel attendu pour la génération de quittance mock.
- Définir les règles détaillées de commission plateforme.
- Confirmer si le périmètre colocation est inclus en Phase 1 ou repoussé hors Phase 1.
- Définir la synchronisation Clerk par webhook.
- Définir la stratégie de création et gestion des comptes `ADMIN`.
- Clarifier la politique de suspension, résiliation et révocation de mandat.
- Ajouter des tests d'intégration lorsque les premiers workflows métier seront codés.
- Ajouter des tests E2E ou smoke tests sur les routes critiques.
- Définir plus tard un coverage ou seuil minimal.
- Ajouter un PR template, un issue template et un changelog léger.
- Définir l'observabilité, les logs, les alertes et la stratégie de déploiement production.
