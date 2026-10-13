# .bmad-core — squelette d'architecture BMAD

Ce dossier est un **squelette d'apprentissage** : il applique la structure du framework BMAD-METHOD (Breakthrough Method for Agile AI-Driven Development) au projet PHOTO PRODUCT, sans migrer le contenu existant.

**Source de vérité du contenu produit : [`CLAUDE.md`](../CLAUDE.md)** (§8). Ce dossier ne duplique pas CLAUDE.md — il le restructure en couches BMAD pour expérimenter le modèle (objectif d'apprentissage, §12).

## Les 6 couches

| Dossier | Rôle dans BMAD | État actuel |
|---|---|---|
| `agents/` | Qui agit : persona, rôle, dépendances (tasks/templates/checklists autorisées) | 7 agents scaffoldés, dérivés de CLAUDE.md §3 |
| `tasks/` | Comment un agent exécute une procédure donnée, pas à pas | 3 migrées (`design-critique`, `design-system-consistency`, `ux-audit`, 2026-10-12) — les autres `skills/*/skill.md` restent des stubs vides, non migrés |
| `templates/` | Squelette de document structuré produit en sortie | vide — candidats existants : `docs/design.md`, `docs/tokens.md` |
| `checklists/` | Grille de validation qualité appliquée à un livrable | vide — candidat existant : `docs/audit-design.md` |
| `data/` | Base de connaissance / contenu de référence du projet | vide — candidats existants : `series-content.md`, `saga-content.md`, `spotlights-content.md`, `infolettre/contenu-*.md` |
| `workflows/` | Séquence qui enchaîne agents + tasks dans un ordre défini | `product-cycle.md` formalise le cycle VISION→...→ITERATE de CLAUDE.md §7 |

## Principe directeur

Conformément à CLAUDE.md §9 : *« Ne pas créer prématurément des Skills ou des workflows. Créer une abstraction lorsqu'un besoin récurrent est identifié. »*

Donc : les dossiers `tasks/`, `templates/`, `checklists/`, `data/` restent vides tant qu'aucun besoin réel ne justifie d'y déplacer du contenu. Le but de ce scaffold est de comprendre la séparation agent/task/template/checklist/data/workflow — pas de dupliquer immédiatement tout le contenu du projet dans ce format.

## Prochaine étape possible

Quand un skill existant (`skills/*/skill.md`) est rempli et stabilisé, il peut migrer vers `tasks/` (ou rester dans `skills/` — à décider). Ne pas migrer en bloc ; migrer un fichier à la fois, au moment où il devient une task BMAD réellement invoquée par un agent.
