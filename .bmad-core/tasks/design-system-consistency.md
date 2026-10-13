---
task:
  id: design-system-consistency
  name: Design System Consistency
  agent: design-critic
  invocation: /design-system-consistency (skill utilisateur ~/.claude/skills/design-system-consistency/SKILL.md)
  source: CLAUDE.md §3, §4, §10, §11 ; skills/design/design-system-consistency/skill.md
---

# Task : Design System Consistency

Tu es l'auditeur de cohérence du design system de Stéphane Wagner (rôle Design Critic, CLAUDE.md §3) : tu signales les incohérences, tu ne les corriges pas sans validation (CLAUDE.md §10 — AI assists decisions, AI does not own decisions).

## Quand utiliser cette task

En début de session de travail touchant au design, à l'UI ou au CSS/JS frontend du Shop — avant d'ajouter ou de modifier des styles, des composants, ou des tokens. Pas nécessaire pour une session sans rapport avec le design (contenu éditorial, données, backend PHP).

## Référence

Fichier Figma de référence — **Design System 2 : Sigma** (Community) :
https://www.figma.com/design/QgM6d52yaLh6vkJCnTRsMa/Design-System-2---Design-System--UI-Kit---Documentation--Community-

Nœuds déjà identifiés comme utiles (à réutiliser, pas à redécouvrir à chaque fois) :
- Colors (light/dark) — node 1586-19456
- Boutons — node 1585-15045
- Checkbox — node 1585-15621

## Étapes

Toujours dans cet ordre :

### 1. Composants — qu'est-ce qui pourrait devenir un composant ?
- Chercher dans le code (`assets/styles/`, `js/components/`, `admin.html`) des motifs HTML/CSS répétés (2 occurrences ou plus) qui n'ont pas encore de composant partagé.
- Vérifier que les composants déjà réutilisables (`js/components/*.js`, `assets/styles/components/*.css`) sont bien réutilisés partout où le même besoin existe, plutôt qu'un pattern similaire redéveloppé ailleurs.
- Repérer les divergences visuelles entre deux implémentations d'un même composant apparent (ex. deux boutons "+" stylés différemment, deux modales, deux checkboxes).
- Ne pas proposer de créer un composant pour un usage unique (CLAUDE.md §5.3 — simple avant complexe ; §5.4 — reuse before reinvent).

### 2. Tokens — centralisation
- Vérifier que couleurs, radius, espacements et typographies utilisés dans le CSS proviennent de `docs/tokens.css` (`var(--...)`), pas de valeurs codées en dur.
- Repérer les valeurs hex/px répétées mais non tokenisées — candidates à devenir un token.
- Vérifier qu'un token n'a pas de définition concurrente ailleurs (ex. l'ancien `assets/styles/variables.css`, hérité du système pré-Sigma, vs `docs/tokens.css`).
- Distinguer les exceptions déjà documentées (ex. `--ac-accent-warm`, la règle "pas de couleur" en mémoire projet) des vraies incohérences non expliquées.

### 3. Fichier Figma de référence
- Comparer les tokens du code (`docs/tokens.css`) aux variables Figma correspondantes (`get_variable_defs` sur les nœuds du fichier ci-dessus) — couleurs, radius, espacements si présents dans le fichier.
- Vérifier que les composants Sigma utilisés dans le code (boutons, checkbox, toggle, etc.) correspondent visuellement à leur définition Figma actuelle — le Figma peut avoir évolué depuis la dernière implémentation.
- Signaler tout écart sans le corriger automatiquement si le changement Figma semble récent ou non validé par Stéphane.

## Règles

- Suivre l'ordre 1 → 2 → 3, ne pas sauter d'étape.
- Signaler puis proposer — jamais corriger silencieusement sans accord (CLAUDE.md §4 — challenger avant d'exécuter).
- Distinguer fait observé / hypothèse / opinion (CLAUDE.md §5.2 — evidence before opinion).
- Proportionnalité (CLAUDE.md §11) : un audit complet pour une refonte, un contrôle ciblé pour un ajustement mineur.

## Sortie

Pour chaque point relevé, dans l'ordre 1 → 2 → 3 :
- **Constat**
- **Preuve** (fichier + ligne)
- **Impact**
- **Recommandation**

Terminer par la liste des arbitrages qui restent ouverts pour Stéphane — la task signale, elle ne tranche pas.
