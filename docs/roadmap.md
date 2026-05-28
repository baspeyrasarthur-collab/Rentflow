# Roadmap

## MVP

Objectif : rendre utilisables les premiers parcours propriétaire, locataire et admin en gardant les providers mock.

Priorités :

1. Finaliser la Phase 0 : docs, `npm run check`, CI minimale et check global.
2. Clarifier le périmètre exact du MVP Phase 1.
3. Stabiliser le CRUD proprietaire pour les logements.
4. Ajouter la creation de contrat individuel.
5. Ajouter les invitations locataires avec email mock.
6. Ajouter l'acceptation d'invitation côté locataire.
7. Ajouter les mandats, paiements simulés et quittances après validation du flux logement/contrat/invitation.

## Stabilisation

Objectif : rendre les workflows fiables et vérifiables.

- Renforcer les permissions serveur sur chaque mutation.
- Ajouter des tests d'intégration sur les parcours critiques, à confirmer.
- Renforcer l'audit des actions sensibles.
- Ajouter le traitement webhook mock avec signature et idempotence.
- Stabiliser les erreurs applicatives et les états métier.
- Vérifier les invariants argent, contrat, colocation, mandat et quittance.

## Production

Objectif : préparer un déploiement exploitable.

- Définir les environnements et la stratégie d'hébergement, à confirmer.
- Mettre en place secrets, variables d'environnement et procédures de déploiement.
- Ajouter observabilité, logs et alertes, à confirmer.
- Valider ou non les providers réels.
- Durcir Clerk, webhooks et synchronisation utilisateur.
- Documenter les procédures d'exploitation.

## Backlog priorisé

1. `docs/` projet : produit, architecture, roadmap, décisions.
2. Script `npm run check`.
3. CI minimale sur `npm run check`.
4. Spécification courte du MVP Phase 1.
5. Stabilisation CRUD logements proprietaire.
6. Tests du CRUD logements.
7. Contrat individuel.
8. Invitations locataires.
9. Acceptation locataire.
10. Mandats et paiements mock.
11. Quittances.
12. Actions admin avancées, à confirmer.
13. Providers réels, à confirmer.
