# Etat courant RentFlow

## 1. Vision produit actuelle

- RentFlow est un MVP SaaS de gestion locative entre particuliers.
- Le paiement via RentFlow reste optionnel.
- Le paiement externe, par exemple virement bancaire classique, reste supporte.
- RentFlow ne touche pas directement les loyers et ne detient pas les fonds.
- Les providers reels restent hors scope sans validation explicite.
- Aucun provider d'abonnement reel n'est branche.
- Le compte locataire reste gratuit et le parcours cible locataire doit etre rapide : landing publique, demo, choix `Locataire`, creation de compte minimale, puis acces au vrai dashboard `/tenant`.
- La demo publique permet maintenant de basculer entre un mode proprietaire et un mode locataire, avec donnees fictives uniquement.

## 2. Stack technique figee

- Next.js App Router.
- TypeScript strict.
- Prisma.
- PostgreSQL.
- Clerk.
- Zod.
- Tailwind CSS.
- shadcn/ui.
- Vitest.
- Providers mock pour paiement, email, stockage et identite.
- CI GitHub minimale.

## 3. Regles permanentes

- Les mutations metier restent cote serveur.
- Les permissions owner, tenant et admin sont verifiees cote serveur.
- Les entrees utilisateur sont validees avec Zod.
- Les montants sont stockes en centimes entiers.
- Aucun IBAN complet ne doit etre stocke.
- Aucun provider reel ne doit etre branche sans validation explicite.
- L'admin reste en lecture seule pour l'instant.
- Les logements peuvent etre archives logiquement, option recommandee pour conserver l'historique.
- Une suppression definitive owner existe aussi pour retirer un logement ajoute par erreur, avec confirmation forte `SUPPRIMER`, suppression transactionnelle des donnees liees et audit log.
- Finances : les emprunts sont des sorties declaratives ; RentFlow ne calcule pas automatiquement mensualites, interets ou amortissement.
- Finances : les frais RentFlow viennent de `PlatformCommission` et ne sont pas saisis comme `Expense`.
- Finances : un OWNER ne voit que ses propres biens, paiements, depenses, commissions et syntheses.
- Plans : `FREE` ne permet pas le prelevement automatique via RentFlow ; `PRO` et `SCALE` pourront l'utiliser quand un provider reel sera disponible.
- Les decisions structurantes vont dans `docs/decisions.md`.
- Les points futurs ou non bloquants vont dans `PLANS.md`.

## 4. Modules termines

- Authentification Clerk et onboarding owner/tenant.
- Redirection `/dashboard` selon le role interne.
- Dashboards owner, tenant et admin.
- CRUD logements owner : liste, creation, detail, edition, archivage logique et suppression definitive confirmee.
- Images logement V1 : chaque bien peut avoir une photo optionnelle unique, stockee en local/mock dev dans `public/uploads/properties` et referencee par `Property.imageUrl` / `Property.imageStorageKey`. Aucun provider reel de stockage n'est branche ; un stockage production devra remplacer cette V1 plus tard.
- Photo de profil V1 : chaque `User` peut avoir une photo optionnelle unique, commune aux espaces owner et tenant, stockee en local/mock dev dans `public/uploads/profiles` et referencee par `User.profileImageUrl` / `User.profileImageStorageKey`. Aucun provider reel de stockage n'est branche.
- Informations personnelles V1 : `User` porte des informations facultatives simples (nom, telephone, adresse personnelle et pays de residence fiscale). Elles peuvent aider la preparation fiscale dans `/owner/declarations` quand elles manquent, sans rendre la fiscalite bloquante ni creer d'action dashboard.
- Upload images V1 : les photos logement/profil restent limitees a 5 Mo cote application. La limite Next.js des Server Actions est configuree a `6mb` pour laisser passer la requete avant validation RentFlow, sans stockage externe ni provider reel.
- Refonte UI / DA : fondations visuelles globales posees dans `app/globals.css`, mode sombre par defaut, fond sombre tres profond, palette RentFlow dark/light, tokens globaux et typographie orientee Plus Jakarta Sans avec fallback systeme.
- Refonte UI / DA : vrai logo RentFlow integre dans `AppShell` et `DemoLayout`.
- Refonte UI / DA : `AppShell` connecte avec sidebar desktop reductible, sidebar reduite avec icones cliquables, bouton vertical pour ouvrir/reduire, bouton theme sombre/clair discret en haut a droite et navigation mobile simple conservee.
- Composants UI RentFlow communs crees : `PageHeader`, `SectionHeader`, `StatCard`, `ActionCard`, `StatusBadge`, `EmptyState` et `InfoAlert`.
- Composants UI : `ActionCard`, `StatCard` et `StatusBadge` ont des accents plus visibles et servent de base a la refonte progressive.
- Landing publique V1 : `/` presente RentFlow comme un copilote de gestion locative guidee, avec CTA principal `Voir le site` vers `/demo`, CTA de creation de compte et lien de connexion.
- Parcours public cible : landing -> demo -> creation/connexion -> onboarding role -> plan proprietaire si applicable -> dashboard ; `/dashboard` continue de rediriger les utilisateurs connectes vers leur espace reel.
- Demo publique V2 : `/demo` simule les vraies pages avec query params `mode=owner|tenant` et `page=...` au lieu de pousser le visiteur vers les routes protegees.
- Demo publique V2 : pages owner simulees dans `/demo` : dashboard, biens, detail logement, contrats, paiements, quittances, finances, declarations et locataires.
- Demo publique V2 : pages tenant simulees dans `/demo` : dashboard, detail contrat, demandes au proprietaire et compte.
- Demo publique V2 : donnees fictives centralisees dans `app/demo/demo-data.ts`, aucune donnee reelle, aucun Prisma, aucun `requireRole`, aucun Clerk obligatoire, aucune server action, aucune mutation metier et aucun provider.
- Demo publique V2 : navigation dediee dans `app/demo/layout.tsx`, avec sidebar type app, navigation owner/tenant selon le mode, vrai logo RentFlow, toggle dark/light, toggle effets lumineux, CTA vers `/sign-up` et `/sign-in`, et bascule visible entre espace proprietaire et espace locataire.
- Demo publique V2 : images locales fictives de biens dans `public/demo/properties`, cards cliquables, animations hover, spotlight des composants RentFlow sauf sur les cards logements avec images, et actions sensibles redirigees vers `/sign-up` comme actions simulees.
- Pages connectees refondues en V1 UI : dashboard owner `/owner`, finances owner `/owner/finances`, liste logements `/owner/properties`, detail logement `/owner/properties/[id]`, detail contrat owner `/owner/properties/[id]/contracts/[contractId]` et dashboard tenant `/tenant`.
- Refontes UI V1 : uniquement presentation et lisibilite ; aucun workflow metier, server action ou permission n'a ete modifie par ces refontes.
- Modele SaaS proprietaire `FREE` / `PRO` / `SCALE` : `OwnerProfile.plan` existe avec `FREE` par defaut, le compte locataire reste gratuit, et le billing reel reste hors scope immediat.
- Feature gates proprietaire centralises dans `server/billing/plans.ts` : `FREE` limite a 1 logement, `PRO` a 15 logements, `SCALE` a des logements illimites.
- Feature gate de prelevement automatique prepare : `canUseInAppPayments` existe, vaut `false` pour `FREE` et `true` pour `PRO` / `SCALE`, mais n'est pas encore branche aux workflows paiement.
- Premier feature gate branche : creation de logement limitee selon le plan proprietaire, avec comptage de tous les logements du owner, y compris archives.
- Contrats individuels crees en DRAFT et editables uniquement en DRAFT.
- Invitation locataire par email mock avec token hash en base.
- Acceptation d'invitation par locataire connecte avec email correspondant.
- Mandat mock locataire sans IBAN complet ni prelevement reel.
- Paiement externe suivi dans RentFlow avec `provider = null`.
- Paiement mock volontaire cote locataire avec `provider = MOCK`.
- Paiements MVP : les paiements mock restent utilisables pour le MVP/dev, et les paiements externes restent disponibles, y compris pour `FREE`.
- Suivi declaratif des paiements externes V1 : table `PaymentDeclaration` avec types `PAID_EXTERNALLY` et `NOT_PAID_YET`.
- Suivi declaratif V1 : le locataire peut declarer "Loyer paye" ou "Pas encore" ; les declarations sont historisees.
- Suivi declaratif V1 : eligible uniquement pour un paiement externe `RENT` avec `provider = null`, `providerPaymentId = null`, et `status` `PLANNED` ou `PENDING`.
- Suivi declaratif V1 : la declaration ne modifie jamais `Payment.status`, ne confirme pas la reception reelle, et la confirmation reste le workflow owner "Marquer comme recu".
- Suivi declaratif V1 : derniere declaration affichee cote tenant et cote owner dans le detail contrat.
- Suivi declaratif V1 : une `Notification` interne owner est creee quand le locataire fait une declaration ; elle utilise pour l'instant le type existant `PAYMENT_PLANNED`.
- Suivi declaratif V1 : `PaymentDeclaration`, `Notification` et `AuditLog` `payment_declaration.created` sont crees dans la meme transaction.
- Suivi declaratif V1 : aucun provider reel, aucun flux bancaire, aucun IBAN, aucun email/SMS/push et aucun upload de preuve bancaire.
- Commissions mock uniquement sur paiement RENT reussi via MOCK.
- Quittances MVP : demande locataire, generation proprietaire, blocage doublons.
- PDF de quittance minimal genere a la demande, sans stockage reel.
- Finances proprietaire V1 : page `/owner/finances` en lecture seule, OWNER uniquement, avec filtre mensuel `month=YYYY-MM`.
- Finances proprietaire V1 : resume global avec loyers attendus, loyers encaisses, reste a encaisser, sorties prevues/enregistrees et cash-flow estime.
- Finances proprietaire V1 : vue par bien, paiements a surveiller, frais RentFlow separes, depenses proprietaire et sorties groupees par categorie.
- Depenses proprietaire ponctuelles : creation, edition et annulation logique `CANCELED`, rattachement a un bien du owner, montants en centimes.
- Categories de depenses proprietaire : remboursement d'emprunt, assurance, charges de copropriete, taxe fonciere, travaux et autre.
- Depenses recurrentes proprietaire : creation de regle mensuelle, liste des regles, desactivation logique, et generation explicite des occurrences du mois selectionne depuis `/owner/finances`.
- Occurrences recurrentes : generees comme de vraies `Expense` en `PLANNED`, sans generation automatique a l'affichage, avec retour UX apres generation et idempotence via `recurringRuleId` + `occurrenceMonth`.

## 5. Modules non termines ou hors scope actuel

- Activation contrat.
- Colocation avancee.
- Providers reels.
- Provider reel d'abonnement.
- Vrais prelevements.
- Branchement effectif du gate de prelevement automatique sur les vrais paiements via RentFlow.
- Stockage PDF reel.
- Emails reels.
- Centre de notifications consultable et marquage lu/non lu.
- Suivi declaratif avance des paiements externes : message optionnel locataire, relances avancees, email reel, SMS, push, type `NotificationType` dedie plus precis comme `PAYMENT_DECLARATION_CREATED`, affichage eventuel dans `/owner/finances` et preuve bancaire uploadee.
- Generation automatique planifiee des depenses recurrentes.
- Recurrences hebdomadaires, trimestrielles ou annuelles.
- Modification avancee des series recurrentes.
- Reactivation de regle recurrente.
- Champs indicatifs specifiques aux emprunts.
- Rentabilite avancee.
- Fiscalite.
- Exports.
- Connexion bancaire.
- Agregateur bancaire.
- Calcul automatique d'amortissement d'emprunt.
- Charges avancees.
- UI : les vraies pages connectees doivent maintenant etre realignees avec le niveau de polish final de la demo publique.
- UI : certaines pages refondues doivent encore recevoir le rendu final de la demo, avec couleurs plus visibles, micro-interactions coherentes et cards plus premium.
- UI : polish typographique global encore a faire.
- UI : vraie navigation mobile ou bottom nav non finalisee.
- UI : animations et micro-interactions globales a stabiliser hors demo.
- Module fiscalite / declarations pas encore code.
- Page Mes locataires pas encore codee.
- Parcours locataire rapide a finaliser : sign-up avec role cible, onboarding tenant simplifie et etat vide rassurant sur `/tenant`.
- Vraie page locataire finale a reprendre plus tard.
- TODO demo : ajouter plus tard une entree Support dans la demo publique,
  inspiree de `/support`, sans donnees reelles.

## 6. Prochaine logique produit

- Priorite actuelle : appliquer le style valide de la demo publique aux vraies pages connectees, sans modifier les workflows metier.
- Ensuite : preparer le module fiscalite / declarations, puis la page Mes locataires et le parcours locataire rapide vers le vrai dashboard `/tenant`.
- Garder les prochaines taches petites, independantes et reviewables.

## 7. Commandes de validation habituelles

```bash
npm run db:validate
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:seed
```
