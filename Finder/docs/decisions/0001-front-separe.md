# 0001 - Séparer le front React de l'API Express

Date : 2026-11-02 Statut : acceptée

## Contexte

Finder doit proposer une interface React sans mêler ses dépendances et son cycle de développement à ceux de l'API Express.
Le front et l'API doivent pouvoir évoluer et être démarrés indépendamment.

## Décision

Créer `front/` comme projet React/Vite indépendant de `api/`, avec sa propre configuration et ses propres dépendances.

## Alternatives écartées

Servir le front depuis `api/` : cela couplerait les versions et le déploiement des deux applications.
Intégrer React dans le projet API : cela mélangerait les responsabilités et compliquerait le développement séparé.

## Conséquences

Le front se lance depuis `front/` sur le port Vite 5173 ; il faudra configurer son URL d'API et gérer leur communication entre origines.
Les étapes suivantes doivent valider le parcours utilisateur du navigateur jusqu'aux routes existantes de l'API.
