# tasks/

Une **task** décrit une procédure pas-à-pas qu'un agent exécute (contrairement à l'agent, qui définit *qui* agit, ou au template, qui définit *ce que produit* la tâche).

## Migrées

- `design-critique.md` — migrée le 2026-10-12 depuis le skill utilisateur `~/.claude/skills/design-critique/SKILL.md` (invocation `/design-critique` inchangée). Référencée par l'agent `design-critic`.
- `design-system-consistency.md` — migrée le 2026-10-12 depuis le skill utilisateur `~/.claude/skills/design-system-consistency/SKILL.md` (invocation `/design-system-consistency` inchangée). Référencée par l'agent `design-critic`.
- `ux-audit.md` — migrée le 2026-10-12, rédigée directement dans l'architecture BMAD (pas de skill utilisateur source, proposition validée par Stéphane avant écriture). Référencée par l'agent `ux-researcher`.

## Candidats restants (non migrés, cf. `.bmad-core/README.md`)

Les autres `skills/*/skill.md` du projet sont encore des stubs vides (`> À documenter.`) — rien à migrer tant qu'ils ne sont pas rédigés.
- `skills/ux/user-journey/skill.md` — stub vide
- `skills/ux/content-architecture/skill.md` — stub vide
- `skills/product/product-discovery/skill.md` — stub vide
- `skills/product/prioritization/skill.md` — stub vide
- `skills/design/ux-writing/skill.md` — stub vide
- `skills/experimentation/experiment-design/skill.md` — stub vide
- `skills/ai/ai-workflow-design/skill.md` — stub vide
- `skills/business/photo-platform-analysis/skill.md` — stub vide

Ne migrer une task que lorsqu'elle est effectivement écrite et invoquée par un agent (CLAUDE.md §9).
