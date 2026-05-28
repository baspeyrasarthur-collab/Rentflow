# PLANS.md

Note suivi mandat mock : remplacer plus tard le provider de mandat `MOCK` par un prestataire bancaire sandbox puis reel seulement apres validation produit, juridique et securite. Aucun IBAN complet ne doit etre stocke.

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
- Demo publique V1 sous `/demo`, `/demo/finances` et `/demo/properties`, avec donnees fictives statiques et navigation dediee, sans acces base ni mutation.
- Demo publique V1 devenue modele visuel valide : sidebar sombre, vrai logo RentFlow, dark/light toggle, images locales fictives de biens, cards cliquables, actions rapides compactes et spotlight colore local a la demo.
- Routage `/dashboard` vers `/owner`, `/tenant` ou `/admin` selon le rôle interne.
- Onboarding authentifié permettant de créer un utilisateur interne OWNER ou TENANT depuis une session Clerk.
- Contrôle d'accès serveur par rôle et helpers d'accès aux ressources owner/tenant.
- Layouts et tableaux de bord pour proprietaire, locataire et admin ; les espaces locataire et admin restent en lecture seule.
- CRUD proprietaire des logements : liste, creation en brouillon, detail, edition simple et archivage logique.
- Modele proprietaire `FREE` / `PRO` / `SCALE` persiste sur `OwnerProfile.plan`, avec feature gates centralises dans `server/billing/plans.ts`.
- Premier gate branche : creation de logement limitee par plan (`FREE` 1 logement, `PRO` 15 logements, `SCALE` illimite), en comptant aussi les logements archives.
- Schéma Prisma couvrant utilisateurs, profils, logements, contrats, colocations, invitations, mandats, paiements, dépenses, quittances, commissions, notifications, KYC, consentements, webhooks, paramètres plateforme et audit logs.
- Migration Prisma initiale et client Prisma généré.
- Seed de développement avec admin, propriétaire, locataires, logement individuel, colocations, invitations, mandats, paiements, quittance, commission, notification, webhook et audit log fictifs.
- Providers mock derrière interfaces pour paiement, KYC, email et stockage.
- Validation Zod pour l'onboarding et des schémas communs.
- Helpers monétaires en centimes entiers avec formatage EUR/fr-FR.
- Tests unitaires pour argent, validation, providers mock, erreurs applicatives et contrôle d'accès.
- Scripts npm pour dev, build, lint, typecheck, format, tests, Prisma generate/migrate/seed/studio.

## Fonctionnalités à venir

- Création et activation de contrats de location individuels.
- Gestion complète des colocations liées et indépendantes.
- Création, envoi, expiration et acceptation des invitations locataires.
- Parcours locataire pour rejoindre une location.
- Création et acceptation de mandats de paiement simulés depuis l'interface.
- Planification, déclenchement et suivi des paiements simulés.
- Génération, stockage et consultation des quittances.
- Suivi plus avance des depenses proprietaire et des regles recurrentes.
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

- Les parcours contrats, invitations, paiements et quittances ne sont pas encore utilisables de bout en bout.
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

1. Appliquer le style valide de la demo publique aux vraies pages connectees, en priorite `/owner`, `/owner/finances`, `/owner/properties`, `/owner/properties/[id]` et `/owner/properties/[id]/contracts/[contractId]`, puis `/tenant` plus tard.
2. Preparer le module fiscalite / declarations : page `/owner/declarations`, actions personnalisees selon la situation des biens, montants a declarer a verifier, echeances, conseils personnalises prudents, menus "Comment declarer ?" en second niveau et sources officielles necessaires.
3. Creer la page Mes locataires : locataires actuels, anciens locataires et invitation d'un nouveau locataire.
4. Preparer les comptes multi-roles par profils : creer `requireOwnerAccess()` et `requireTenantAccess()` bases sur `OwnerProfile` / `TenantProfile`, puis adapter progressivement `/owner` et `/tenant` sans migration immediate.
5. Ajouter "Changer d'espace" dans Mon compte : afficher l'espace proprietaire, l'espace locataire, leur disponibilite, et les liens vers `/owner` ou `/tenant`.
6. Adapter `/dashboard` aux utilisateurs ayant plusieurs profils, avec un choix d'espace ou un dernier espace utilise gere par cookie cote MVP.
7. Adapter l'acceptation d'invitation locataire pour qu'un user deja owner puisse creer ou recuperer son `TenantProfile` si l'email correspond.
8. Mettre en place le parcours locataire rapide, sans demo locataire dediee : page choix `Proprietaire` / `Locataire`, sign-up avec parametre de role, onboarding tenant simplifie, puis redirection vers `/tenant`.
9. Ameliorer l'etat vide tenant rassurant : "Votre espace locataire est pret. Vous pourrez voir votre logement des qu'un proprietaire vous aura invite ou rattache a un contrat."
10. Reprendre la vraie page locataire avec le style final : logement, loyer, prochain paiement, declaration "Loyer paye" / "Pas encore" si eligible, quittances, documents et aide/support.
11. Creer la landing page publique ultra premium : future premiere page d'arrivee, inspiration BIM Agency, grandes typographies, animations sobres, CTA demo, plans et creation de compte.
12. Garder les prochaines evolutions petites, reviewables, et separees des workflows metier existants.

## Points à surveiller / à traiter plus tard

- Réévaluer l'erreur locale Vitest/Vite `spawn EPERM` après exécution de la CI.
- Vérifier le résultat réel de la CI GitHub Actions après push.
- Ajouter un service PostgreSQL en CI quand des tests d'intégration Prisma nécessiteront une vraie base.
- Clarifier l'usage de `SKIP_ENV_VALIDATION` entre local, CI et production.
- Décider le mécanisme d'acceptation d'invitation locataire : token, email connecté ou autre.
- Ameliorer plus tard l'UX des erreurs d'acceptation d'invitation au lieu de laisser remonter les erreurs serveur.
- Remplacer plus tard l'envoi email direct apres transaction par un mecanisme outbox/retry.
- Clarifier le contenu légal exact des quittances.
- Définir le niveau fonctionnel attendu pour la génération de quittance mock.
- Faire valider juridiquement le PDF minimal des quittances avant production et ajouter plus tard l'envoi email mock, sans provider reel.
- Generer une quittance apres marquage d'un paiement externe comme recu, apres validation du contenu legal.
- Ajouter plus tard une notification proprietaire quand un locataire demande une quittance.
- Ajouter plus tard un email ou une notification apres generation proprietaire d'une quittance demandee.
- Creer progressivement des vues admin support en lecture seule : liste utilisateurs, detail utilisateur, logements, contrats, invitations, paiements, mandats, quittances et audit logs.
- Ajouter progressivement les prochaines ameliorations Finances proprietaire : polish UX de la page Finances, edition eventuelle des regles recurrentes, reactivation eventuelle de regle, generation planifiee plus tard, filtres periode plus avances si besoin, rentabilite simple puis avancee, exports eventuels plus tard.
- Continuer les depenses recurrentes proprietaire par petites etapes : modification avancee des series, reactivation, generation planifiee, suivi UX des occurrences generees et tests complementaires si le perimetre evolue.
- Utiliser la demo publique V1 comme reference visuelle pour les prochaines refontes connectees, en gardant `/demo` separe des routes metier `/owner` et `/tenant`.
- Ne pas creer de demo locataire dediee pour l'instant ; privilegier un sign-up locataire rapide vers le vrai dashboard `/tenant`.
- Ajouter plus tard une page publique de choix de profil `Proprietaire` / `Locataire`.
- Ajouter plus tard un sign-up avec parametre de role cible, sans donner au client la source de verite finale des permissions.
- Simplifier plus tard l'onboarding tenant pour creer ou recuperer rapidement le `TenantProfile`.
- Garder `User.role` comme role initial/principal pour compatibilite, mais faire evoluer les autorisations owner/tenant vers les profils.
- Ne pas creer `UserRoleMembership` maintenant ; le garder comme option future si les besoins de roles deviennent plus complexes.
- Creer plus tard `requireOwnerAccess()` et `requireTenantAccess()` bases sur `OwnerProfile` et `TenantProfile`.
- Adapter progressivement les layouts `/owner` et `/tenant` pour utiliser ces guards par profil.
- Adapter plus tard `/dashboard` pour les utilisateurs ayant plusieurs profils, avec un dernier espace utilise gere par cookie en MVP.
- Ajouter dans Mon compte une section "Changer d'espace" entre espace proprietaire et espace locataire.
- Adapter l'acceptation d'invitation locataire pour qu'un utilisateur deja owner puisse creer ou recuperer son `TenantProfile` si l'email correspond.
- Polir plus tard le dashboard tenant final sans le transformer en dashboard proprietaire bis.
- Ajouter eventuellement une page `/demo/receipts` plus tard.
- Ajouter eventuellement une page pricing/plans `FREE`, `PRO`, `SCALE`.
- Preparer plus tard les ecrans d'upgrade, sans checkout ni provider reel tant que le billing n'est pas cadre.
- Brancher le billing reel plus tard seulement apres validation explicite du provider d'abonnement.
- Choisir plus tard le provider billing : Stripe Billing, Paddle ou autre.
- Cadrer les prix `PRO` et `SCALE`.
- Cadrer `subscriptionStatus` pour distinguer plan et etat d'abonnement.
- Cadrer une table future `OwnerSubscription` sans surcharger `OwnerProfile`.
- Preparer les webhooks billing verifies, idempotents et idealement stockes.
- Preparer l'etat d'abonnement reel dans `/owner/upgrade`.
- Faire dependre les gates de `plan` + `subscriptionStatus` quand le billing reel sera en place.
- Ajouter les messages UX pour paiement echoue, periode de grace et downgrade.
- Decider plus tard comment gerer les changements de plan, notamment downgrade, logements au-dessus de la limite et historique.
- Cadrer les vrais paiements ou prelevements de loyer via un provider agree avant tout branchement.
- Prevoir un workflow explicite d'activation du prelevement reel par le proprietaire et de consentement/mandat explicite du locataire.
- Prevoir des messages UX rappelant que le paiement externe reste possible, meme quand le prelevement via RentFlow est disponible.
- Ne brancher aucun provider reel de paiement ou prelevement sans decision explicite.
- Brancher `canUseInAppPaymentsForPlan` uniquement au moment du vrai provider de prelevement via RentFlow.
- Afficher plus tard un message d'upgrade si un owner `FREE` tente d'activer le prelevement automatique reel.
- Ne pas bloquer les paiements mock tant qu'ils servent au MVP et au developpement, sauf decision explicite.
- Conserver le suivi des paiements externes pour `FREE`.
- Brancher les vrais paiements ou prelevements de loyer plus tard seulement via un provider valide, apres decision explicite.
- Suivi declaratif des paiements externes V1 en place : `PaymentDeclaration`, declarations tenant "Loyer paye" et "Pas encore", affichage de la derniere declaration cote tenant et cote owner detail contrat, notification interne owner, sans modifier `Payment.status`.
- Creer plus tard un type `NotificationType` dedie aux declarations de paiement si utile, par exemple `PAYMENT_DECLARATION_CREATED`.
- Ajouter eventuellement un message optionnel locataire, apres cadrage produit.
- Ajouter eventuellement email/SMS/push seulement apres provider valide.
- Ajouter eventuellement des relances avancees.
- Afficher eventuellement les declarations dans `/owner/finances` plus tard, sans confondre declaration locataire et paiement confirme.
- Ne jamais transformer une declaration tenant en paiement confirme : la reception reelle reste le workflow owner "Marquer comme recu".
- Reporter a plus tard : preuve bancaire uploadee seulement apres cadrage securite/RGPD.
- Ameliorer les depenses declaratives pour couvrir les emprunts immobiliers avec des champs indicatifs eventuels : montant mensuel, periode, part d'interets indicative et assurance emprunteur indicative, sans calcul automatique d'amortissement.
- Reconsiderer plus tard un lien direct `paymentId` sur `Receipt` si la tracabilite quittance-paiement doit etre renforcee.
- Remplacer le fallback de commission mock `490` par une configuration plateforme explicite avant production.
- Définir les règles détaillées de commission plateforme.
- Confirmer si le périmètre colocation est inclus en Phase 1 ou repoussé hors Phase 1.
- Définir la synchronisation Clerk par webhook.
- Définir la stratégie de création et gestion des comptes `ADMIN`.
- Clarifier la politique de suspension, résiliation et révocation de mandat.
- Remplacer plus tard la saisie temporaire des montants en centimes par une saisie en euros plus lisible.
- Ajouter des tests d'intégration lorsque les premiers workflows métier seront codés.
- Ajouter des tests E2E ou smoke tests sur les routes critiques.
- Définir plus tard un coverage ou seuil minimal.
- Ajouter un PR template, un issue template et un changelog léger.
- Définir l'observabilité, les logs, les alertes et la stratégie de déploiement production.
