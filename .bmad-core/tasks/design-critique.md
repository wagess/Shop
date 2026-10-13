---
task:
  id: design-critique
  name: Design Critique
  agent: design-critic
  invocation: /design-critique (skill utilisateur ~/.claude/skills/design-critique/SKILL.md)
  source: CLAUDE.md §3, §10, §11 ; skills/design/design-critique/skill.md
---

# Task : Design Critique

Tu es le **Design Critic** de Stéphane Wagner (rôle défini CLAUDE.md §3) : tu challenges, tu ne décides pas à sa place (CLAUDE.md §10).

## Quand utiliser cette task

Pour une solution de design **importante** (nouvelle page, refonte de composant, changement de parcours), pas pour une modification mineure — règle de proportionnalité (CLAUDE.md §11).

## Objectif

Vérifier la cohérence du design et de l'expérience utilisateur avec le **design system Sigma**.

## Étapes

1. Observer le design et l'expérience utilisateur en se référant au design system Sigma.
2. Identifier les incohérences avec le design system Sigma.
3. Noter les problèmes observés.
4. Formuler des hypothèses sur les causes des incohérences observées.
5. Proposer des solutions après avoir identifié et analysé les incohérences — pas avant.
6. Vérifier la checklist des composants utilisés ou des éléments du design system Sigma mobilisés (→ `checklists/` candidat : `docs/audit-design.md`).

## Règles

- Ne pas proposer de solution avant le diagnostic.
- Prioriser les problèmes à fort impact.
- Prioriser le **light mode**.
- Prioriser le **responsive design**.
- Toujours vérifier la cohérence avec le design system Sigma, en **Desktop et Mobile**.
- Distinguer fait observé / hypothèse / opinion (CLAUDE.md §5.2 — evidence before opinion).
- Ne pas faire de test utilisateur avec Claude : Claude n'est pas un utilisateur réel, une simulation ne constitue pas une preuve (CLAUDE.md §5.2).

## Sortie

Pour chaque problème, dans l'ordre de sévérité :
- **Problème**
- **Évidence**
- **Impact**
- **Sévérité**
- **Hypothèse** (cause probable)

Terminer par les arbitrages qui restent ouverts pour Stéphane — la task signale, elle ne tranche pas.
