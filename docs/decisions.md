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

## ADR-008 : Archivage logique des logements

- Statut : accepte.
- Contexte : le CRUD logement proprietaire doit conserver l'historique locatif et eviter toute suppression definitive.
- Decision : archiver un logement en passant son statut a `ARCHIVED`. Bloquer l'archivage si un contrat rattache est `ACTIVE`, `SUSPENSION_REQUESTED` ou `SUSPENDED`.
- Consequences : le proprietaire doit traiter les contrats bloquants avant archivage. Depuis ADR-028, une suppression definitive separee existe pour les logements ajoutes par erreur ou a retirer completement.

## ADR-009 : Mutations logement reservees aux OWNER en Phase 1

- Statut : accepte.
- Contexte : l'espace admin peut consulter les donnees globales, mais ne doit pas agir comme proprietaire dans le CRUD logement Phase 1.
- Decision : les mutations de logement sont reservees aux utilisateurs `OWNER`. `ADMIN` ne peut pas creer, modifier ou archiver un logement comme s'il etait proprietaire.
- Consequences : les actions serveur logement utilisent `requireRole(["OWNER"])`. Un eventuel mode admin-as-owner devra etre decide separement.

## ADR-010 : Pas d'activation contrat sans locataire rattache

- Statut : accepte.
- Contexte : un contrat actif sans locataire rattache creerait une ambiguite produit et juridique dans le MVP.
- Decision : les contrats individuels commencent en `DRAFT`. L'activation sans locataire rattache n'est pas autorisee en Phase 1.
- Consequences : `ContractTenant`, invitation locataire et activation seront traites dans une sequence separee.

## ADR-011 : Edition contrat limitee aux brouillons

- Statut : accepte.
- Contexte : modifier un contrat actif ou suspendu peut avoir des impacts juridiques et financiers qui ne sont pas encore cadres dans le MVP.
- Decision : en Phase 1, l'edition simple d'un contrat individuel est autorisee uniquement si son statut est `DRAFT`.
- Consequences : les contrats non brouillon restent consultables mais non modifiables. Toute evolution vers modification d'un contrat actif devra etre decidee separement.

## ADR-012 : Invitation locataire individuelle reservee et unique

- Statut : accepte.
- Contexte : un contrat individuel ne doit pas reserver plusieurs places locataires en parallele dans le MVP.
- Decision : l'invitation locataire sur contrat individuel est autorisee uniquement sur un contrat `DRAFT`. Une seule invitation active doit exister a la fois pour ce contrat, et elle reserve un `ContractTenant` au statut `INVITED`.
- Consequences : l'acceptation, l'annulation et l'expiration devront respecter cette unicite avant toute activation de contrat.

## ADR-013 : Acceptation d'invitation locataire par token

- Statut : accepte.
- Contexte : un locataire invite doit pouvoir rejoindre un contrat individuel sans exposer de donnees sensibles depuis un lien public.
- Decision : le token brut n'est jamais stocke. L'acceptation se fera avec un utilisateur connecte `TENANT` dont l'email normalise correspond a `Invitation.tenantEmail`. Les roles `OWNER` et `ADMIN` ne peuvent pas accepter une invitation locataire.
- Consequences : une invitation acceptable doit etre `SENT` et non expiree. A l'acceptation future, `Invitation` passera a `ACCEPTED`, `ContractTenant` passera a `ACTIVE`, et `RentalContract` restera `DRAFT` tant que mandat, paiement et activation ne sont pas traites.

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

## ADR-014 : Mandats locataire mock en Phase 1

- Statut : accepte.
- Contexte : le MVP doit preparer le parcours mandat sans integration bancaire reelle ni manipulation de fonds.
- Decision : les mandats Phase 1 utilisent uniquement le provider `MOCK`, ne stockent aucun IBAN complet et ne declenchent aucun prelevement ni paiement.
- Consequences : seul `ibanLast4` fictif peut etre stocke pour la demo. Le branchement d'un prestataire reel devra etre decide et valide separement.

## ADR-015 : Paiements externes et paiements RentFlow optionnels

- Statut : accepte.
- Contexte : un locataire doit pouvoir utiliser RentFlow meme s'il paie son loyer par virement classique hors application.
- Decision : en Phase 1, `Payment.provider = null` represente un paiement externe suivi dans RentFlow, tandis que `Payment.provider = MOCK` represente un paiement simule via RentFlow. Un paiement `RENT` represente loyer + charges.
- Consequences : aucune commission plateforme n'est due sur les paiements externes. Une commission peut etre creee uniquement pour un paiement `RENT` reussi avec `provider = MOCK`.

## ADR-016 : Paiement mock locataire sur paiement attendu existant

- Statut : accepte.
- Contexte : le paiement via RentFlow doit rester optionnel et ne doit pas creer de doublon d'echeance pour un meme loyer.
- Decision : en Phase 1, le paiement mock locataire reutilise un `Payment` attendu existant. Si le locataire choisit volontairement de payer via RentFlow mock, le paiement passe a `provider = MOCK`, `status = SUCCEEDED` et conserve son rattachement initial.
- Consequences : aucun vrai prestataire bancaire n'est appele. Une commission plateforme peut etre creee uniquement pour ce paiement `RENT` reussi via `MOCK`.

## ADR-017 : Quittances generees depuis paiements confirmes

- Statut : accepte.
- Contexte : une quittance complete ne doit etre generee que lorsque le loyer et les charges sont confirmes comme recus.
- Decision : en Phase 1, la generation de quittance est manuelle cote proprietaire et part d'un `Payment` `RENT` en `SUCCEEDED`. La quittance initiale est `GENERATED`, sans PDF legal final, email reel ni stockage reel. Le lien avec le paiement reste logique via locataire, contrat, rattachement et periode, sans `paymentId` direct.
- Consequences : les doublons seront evites par recherche applicative. Un champ `paymentId` sur `Receipt` pourra etre reconsidere plus tard si la tracabilite doit etre renforcee.

## ADR-018 : Demande locataire de quittance sans generation immediate

- Statut : accepte.
- Contexte : un locataire doit pouvoir demander une quittance quand un paiement complet est confirme, sans declencher automatiquement de PDF ni d'envoi.
- Decision : en Phase 1, une demande locataire part uniquement d'un `Payment` `RENT` en `SUCCEEDED` couvrant loyer et charges. Elle preparera une `Receipt` `RENT_RECEIPT` en `REQUESTED`, sans PDF, email, notification ni stockage reel. Les statuts `REQUESTED`, `GENERATED` et `SENT` bloquent une nouvelle demande pour la meme periode, tandis que `CANCELED` ne bloque pas.
- Consequences : le proprietaire devra transformer la demande en `GENERATED` dans une etape separee. Les doublons restent bloques par recherche applicative, sans migration ni contrainte unique DB pour l'instant.

## ADR-019 : Acces admin support en lecture seule

- Statut : accepte.
- Contexte : l'admin doit pouvoir diagnostiquer les problemes rencontres par un proprietaire ou un locataire sans agir a leur place.
- Decision : l'admin aura des pages dediees sous `/admin`, en lecture seule dans le MVP. Les routes `/owner` et `/tenant` restent reservees aux utilisateurs finaux, et l'admin ne doit pas les utiliser comme s'il etait le proprietaire ou le locataire.
- Consequences : les mutations metier restent interdites a l'admin pour l'instant, sauf decision future explicite. Les futures actions admin devront etre cadrees, tracees et auditees.

## ADR-020 : Finances proprietaire V1 en lecture seule

- Statut : accepte.
- Contexte : le proprietaire doit comprendre simplement les entrees, sorties et reste a encaisser de ses biens sans attendre un module comptable complet.
- Decision : `/owner/finances` est une page owner en lecture seule dans la V1. La periode V1 est le mois courant. Les loyers attendus sont calcules avec `Payment.dueDate`. Les loyers encaisses sont calcules avec `Payment.paidAt` et `status = SUCCEEDED`. Le reste a encaisser utilise les paiements `RENT` dus sur la periode et non encaisses. Les sorties V1 incluent les frais RentFlow charges et les depenses enregistrees du mois. Le cash-flow V1 est un cash-flow estime.
- Consequences : les `Expense` peuvent representer des sorties prevues, en attente ou payees. Les emprunts immobiliers seront traites comme des sorties declaratives saisies par le proprietaire. RentFlow ne calcule pas automatiquement les mensualites, interets ou tableaux d'amortissement bancaire. La V1 n'inclut pas fiscalite, rentabilite avancee, provider reel, connexion bancaire ni agregateur bancaire.

## ADR-021 : Emprunts immobiliers comme sorties declaratives

- Statut : accepte.
- Contexte : le module Finances doit aider le proprietaire a suivre son cash-flow immobilier sans devenir un outil bancaire ou comptable lourd.
- Decision : dans l'UX Finances, les emprunts immobiliers sont des sorties d'argent et ne doivent pas etre presentes comme un module separe visible pour le proprietaire. En MVP, RentFlow ne calcule pas automatiquement les mensualites, les interets, l'assurance emprunteur ni le tableau d'amortissement. Le proprietaire saisit les montants reels ou prevus issus de sa banque, et ces montants sont integres au suivi des sorties et au cash-flow estime.
- Consequences : cette approche reduit le risque d'erreur de calcul et garde RentFlow simple. Une future evolution pourra ajouter des champs indicatifs comme duree, date de debut, date de fin, part d'interets ou assurance, sans calcul bancaire automatique par defaut.

## ADR-022 : Categories simples de depenses proprietaire

- Statut : accepte.
- Contexte : les sorties declaratives doivent rester simples tout en permettant au proprietaire de comprendre les grands postes de depenses dans Finances.
- Decision : les depenses proprietaire auront une categorie simple et controlee. Les categories MVP retenues sont `LOAN_REPAYMENT` pour remboursement d'emprunt, `INSURANCE` pour assurance, `CONDO_FEES` pour charges de copropriete, `PROPERTY_TAX` pour taxe fonciere, `WORKS` pour travaux et `OTHER` pour autre. La categorie par defaut sera `OTHER`, et les depenses existantes devront etre classees en `OTHER` lors de la migration.
- Consequences : les frais RentFlow ne sont pas une categorie de depense saisie, car ils viennent de `PlatformCommission` et restent affiches separement dans Finances. Les emprunts restent declaratifs, sans calcul automatique de mensualite, interets ou amortissement. La modelisation recommandee est un enum Prisma `ExpenseCategory` plutot qu'une string libre ou une table dediee ; la table dediee reste hors scope MVP.

## ADR-023 : Depenses recurrentes proprietaire

- Statut : accepte.
- Contexte : les proprietaires doivent pouvoir eviter de ressaisir chaque mois les memes sorties liees a un bien, tout en gardant Finances simple et declaratif.
- Decision : le MVP supportera uniquement des depenses recurrentes mensuelles. Les emprunts, assurances, charges de copropriete, taxes mensualisees, travaux reguliers et frais divers pourront etre saisis comme sorties recurrentes declaratives. RentFlow ne calculera pas automatiquement les mensualites d'emprunt, interets, assurance emprunteur ou amortissement. L'option retenue est une table dediee `RecurringExpenseRule`. Les occurrences mensuelles seront generees comme de vraies `Expense`, avec `status = PLANNED` par defaut. La generation sera explicite cote owner, pas automatique a l'ouverture de `/owner/finances`, et concernera uniquement le mois selectionne en V1.
- Consequences : une occurrence generee pourra etre modifiee ou annulee via le workflow `Expense` existant. Modifier ou annuler une occurrence ne modifiera pas la regle recurrente. Une regle desactivee ne generera plus de nouvelles occurrences, tandis que les anciennes occurrences resteront conservees. Les doublons devront etre evites par une reference a la regle et une periode d'occurrence, idealement avec une contrainte unique DB. Si le jour choisi n'existe pas dans un mois, l'occurrence sera placee au dernier jour du mois. Les frais RentFlow restent separes via `PlatformCommission` et ne sont pas des depenses recurrentes saisies.

## ADR-024 : Demo publique et abonnements proprietaire

- Statut : accepte.
- Contexte : RentFlow doit pouvoir etre compris par un visiteur non connecte sans exposer les espaces metier reels ni declencher d'action sensible. Le modele economique doit aussi etre clarifie avant de preparer les limites produit.
- Decision : les routes metier `/owner` et `/tenant` restent protegees. Une demo publique separee, par exemple sous `/demo`, pourra montrer une experience proche de la vraie app avec des donnees fictives realistes, des CTA visibles "Creer un compte" et "Se connecter", aucune donnee reelle et aucune mutation metier. RentFlow adopte un modele SaaS par abonnement proprietaire : le compte locataire reste gratuit, le proprietaire paie, et les plans sont `FREE`, `PRO` et `SCALE`. Le modele precedent de paiement par logement n'est plus retenu.
- Consequences : `FREE` donne acces aux fonctionnalites coeur, finances, depenses ponctuelles, depenses recurrentes, quittances illimitees et suivi des paiements externes, avec 1 logement maximum et sans prelevement automatique via RentFlow. `PRO` couvre jusqu'a 15 logements avec les memes fonctionnalites coeur et le prelevement automatique via RentFlow quand un provider reel sera disponible. `SCALE` couvre des logements illimites avec les memes fonctionnalites que `PRO`, pour les proprietaires avec un portefeuille plus important. Le billing reel de l'abonnement reste hors scope immediat : aucun provider comme Stripe Billing, ni vrais prelevements de loyer, ne doit etre branche sans validation explicite. Les feature gates peuvent etre prepares avant les providers reels.

## ADR-025 : Prelevement automatique via RentFlow optionnel

- Statut : accepte.
- Contexte : les plans `PRO` et `SCALE` pourront proposer le prelevement automatique via RentFlow quand un provider reel sera valide, tandis que `FREE` garde le suivi des paiements externes sans cette option.
- Decision : le prelevement automatique via RentFlow est une option, jamais une obligation. `FREE` ne permet pas cette option ; `PRO` et `SCALE` la rendent disponible seulement quand un provider reel sera branche. Meme en `PRO` ou `SCALE`, le proprietaire peut continuer a suivre des paiements externes. L'activation du prelevement automatique exige l'accord explicite du proprietaire et du locataire, avec mandat/consentement locataire explicite.
- Consequences : RentFlow ne doit jamais forcer le paiement via l'app. Le paiement externe reste toujours supporte. Aucun provider reel ni workflow de prelevement reel ne doit etre branche sans validation explicite.

## ADR-026 : Billing reel des abonnements proprietaire

- Statut : accepte pour cadrage futur.
- Contexte : RentFlow adopte un modele SaaS par abonnement proprietaire avec les plans `FREE`, `PRO` et `SCALE`. `OwnerProfile.plan` existe deja, sert aux gates simples, et le premier gate branche limite la creation de logements.
- Decision : le billing reel concernera uniquement l'abonnement SaaS proprietaire RentFlow. Il ne concernera pas les loyers, mandats locataires, prelevements SEPA ou flux bancaires de location ; les paiements de loyers reels resteront un sujet separe avec provider agree a valider plus tard. Le compte locataire reste gratuit. Les limites restent `FREE` = 1 logement, `PRO` = jusqu'a 15 logements, `SCALE` = logements illimites.
- Decision : aucun provider reel n'est branche pour l'instant. Les options a comparer plus tard incluent Stripe Billing, Paddle ou autre, selon webhooks fiables, TVA/facturation Europe-France, gestion des abonnements, portail client et simplicite SaaS.
- Decision : aujourd'hui, `OwnerProfile.plan` suffit pour les gates simples. Quand le billing reel existera, les gates devront probablement dependre de `plan` + `subscriptionStatus`. Une table future `OwnerSubscription` est preferable a une surcharge de `OwnerProfile` et pourra stocker provider, customerId, subscriptionId, statut, periode courante et dernier evenement traite. Cette table n'est pas creee maintenant.
- Decision : le client ne doit jamais modifier directement son plan effectif, et les retours checkout ne doivent pas etre source de verite. Les mises a jour de plan/statut devront passer par des webhooks provider verifies, idempotents, idealement stockes, avec `AuditLog` pour upgrade, downgrade, annulation, paiement echoue et reactivation.
- Consequences : un downgrade ne supprime jamais les donnees existantes. Un owner qui depasse la limite de son nouveau plan garde l'acces a ses donnees, mais les nouvelles creations depassant la limite sont bloquees. `FREE` avec plus d'un logement ou `SCALE` vers `PRO` avec plus de 15 logements conserve l'acces existant mais bloque les nouvelles creations. Les logements archives continuent de compter tant que la decision actuelle n'est pas changee. Restent a cadrer : provider exact, prix `PRO`/`SCALE`, effet immediat ou fin de periode pour le downgrade, delai de grace en cas de paiement echoue, traitement long terme des logements archives et periode d'essai eventuelle.

## ADR-027 : Suivi declaratif des paiements externes

- Statut : accepte pour cadrage futur.
- Contexte : RentFlow supporte toujours les paiements externes, par exemple par virement bancaire, et le paiement via RentFlow reste optionnel. Pour un paiement externe, l'app ne peut pas savoir automatiquement si l'argent est arrive. Le locataire doit pouvoir signaler qu'il a paye, mais le proprietaire reste seul a confirmer la reception reelle.
- Decision : une future table dediee `PaymentDeclaration` historisera les declarations locataire. Aucun champ declaratif ne sera ajoute directement sur `Payment`, et `Notification`/`AuditLog` ne seront pas utilises comme etat metier principal. `Payment` reste la source de verite du paiement confirme ; `PaymentDeclaration` represente uniquement une declaration locataire.
- Decision : la V1 proposera uniquement la declaration "J'ai paye par virement". Elle n'ajoutera pas "Pas encore", pas de message optionnel, pas de notification interne, pas d'email, pas de SMS et pas de push. Plusieurs declarations pourront etre historisees tant que le paiement n'est pas confirme, avec affichage principal de la derniere declaration utile cote tenant et cote owner detail contrat. Aucun affichage dans `/owner/finances` en V1.
- Decision : un paiement eligible devra avoir `provider = null`, `providerPaymentId = null`, `type = RENT` et `status` `PLANNED` ou `PENDING`. Aucune declaration ne sera autorisee sur un paiement `SUCCEEDED`, `CANCELED`, `REFUNDED` ou `DISPUTED`. Une declaration locataire ne modifie jamais `Payment.status` et ne passe jamais le paiement a `SUCCEEDED`; la confirmation reelle reste le workflow owner existant "marquer comme recu".
- Consequences : la table `PaymentDeclaration` sera ajoutee dans une migration ulterieure. Les mutations devront rester serveur, validees avec Zod, limitees au `TENANT` pour ses propres paiements, et les vues `OWNER` devront rester filtrees a ses paiements. `ADMIN` reste en lecture seule et hors action. Aucun provider reel, flux bancaire, IBAN ou upload de preuve bancaire sensible n'est ajoute en V1. Les notifications, "Pas encore", messages optionnels et relances restent hors scope V1.

## ADR-028 : Suppression definitive d'un logement owner

- Statut : accepte.
- Contexte : l'archivage reste l'option recommandee pour conserver l'historique, mais un proprietaire peut aussi vouloir effacer un logement ajoute par erreur.
- Decision : ajouter une action separee "Supprimer definitivement" reservee au role `OWNER`, filtree par `ownerProfileId`, avec confirmation textuelle exacte `SUPPRIMER`.
- Consequences : la suppression est transactionnelle et supprime manuellement les donnees liees necessaires avant le logement, sans changer les `onDelete` Prisma. Un `AuditLog` `property.deleted` conserve le resume des donnees supprimees.

## ADR-029 : Parcours locataire rapide sans demo dediee

- Statut : accepte.
- Contexte : la demo publique riche sert surtout a convaincre le proprietaire, qui paie l'abonnement et pilote la gestion. Le locataire doit plutot acceder rapidement a son vrai espace, gratuit, rassurant et limite a ses donnees.
- Decision : ne pas creer de demo locataire dediee pour l'instant. Depuis la future landing, le bouton "Voir le site" menera a un choix de profil `Proprietaire` / `Locataire`. Le choix `Locataire` lancera une creation de compte rapide avec les champs UX minimum `email`, `mot de passe` et `nom` ou `nom d'utilisateur`, puis role cible `TENANT`, onboarding minimal si necessaire, creation ou recuperation du `TenantProfile` et redirection directe vers `/tenant`.
- Decision : si une invitation locataire est en cours, le mecanisme `returnTo` / acceptation d'invitation reste prioritaire. Sans logement rattache, `/tenant` doit afficher un etat vide rassurant : "Votre espace locataire est pret. Vous pourrez voir votre logement des qu'un proprietaire vous aura invite ou rattache a un contrat."
- Consequences : le dashboard locataire doit rassurer, pas devenir un dashboard proprietaire bis. Il doit prioriser logement, loyer, prochaine echeance, declaration "Loyer paye" / "Pas encore" si eligible, quittances, documents et aide/support. La securite reste stricte : filtrage serveur par `tenantProfileId`, aucune donnee owner hors contexte autorise, aucun provider reel et aucun flux bancaire.

## ADR-030 : Comptes multi-roles par profils

- Statut : accepte pour cadrage progressif.
- Contexte : une meme personne peut etre a la fois proprietaire d'un bien, locataire d'un autre logement et eventuellement admin interne plus tard. Aujourd'hui, `User.role` est un enum unique `OWNER` / `TENANT` / `ADMIN`, alors que le schema permet deja a un `User` d'avoir un `OwnerProfile` et un `TenantProfile`. Les guards utilisent encore principalement `User.role`, ce qui bloque les comptes multi-usages avec le meme email et le meme mot de passe.
- Decision : ne pas creer immediatement de table `UserRoleMembership`. Conserver `User.role` comme role initial ou principal pour compatibilite, mais faire evoluer progressivement l'autorisation vers les profils : l'acces owner dependra de l'existence de `OwnerProfile`, et l'acces tenant dependra de l'existence de `TenantProfile`. `ADMIN` reste un role interne separe et exclusif pour l'instant.
- Decision : un utilisateur pourra avoir a la fois `OwnerProfile` et `TenantProfile`. Le changement d'espace se fera depuis "Mon compte". Pour le MVP, le dernier espace utilise pourra etre gere par cookie plutot que par migration. Le client ne doit jamais decider seul de son role effectif.
- Decision : l'acceptation d'une invitation locataire par un owner deja connecte devra pouvoir creer ou recuperer le `TenantProfile` si l'email du compte correspond a l'invitation. Le mecanisme d'invitation reste verifie cote serveur par email et par token.
- Consequences : les futures permissions devront rester filtrees cote serveur par `ownerProfileId` ou `tenantProfileId`. Les layouts, `/dashboard`, l'onboarding et l'acceptation d'invitation devront etre adaptes par petites etapes. `UserRoleMembership` reste une option future si les besoins de roles deviennent plus complexes.
