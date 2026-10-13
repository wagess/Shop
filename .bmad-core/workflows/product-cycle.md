---
workflow:
  id: product-cycle
  name: Cycle produit PHOTO PRODUCT
  source: CLAUDE.md §7
---

# Workflow : cycle produit

Séquence non strictement linéaire — un apprentissage peut ramener le cycle à une étape précédente (CLAUDE.md §7).

| Étape | Agent(s) principal(aux) | Sortie attendue |
|---|---|---|
| VISION | product-strategist | pourquoi le produit existe, valeur, direction, objectifs, contraintes |
| PRODUCT | product-strategist | utilisateurs, besoins, proposition de valeur, fonctionnalités, priorités, roadmap |
| UX | ux-researcher | parcours, architecture de l'information, problèmes, opportunités, hypothèses |
| DESIGN | product-designer, design-critic | architecture, flows, wireframes, UI, composants, prototypes |
| BUILD | technical-assistant | stories, spécifications, code, intégrations, automatisations |
| MEASURE | product-strategist | comportement, conversion, engagement, acquisition, ventes, retours |
| LEARN | product-strategist, ux-researcher | ce qui fonctionne, ce qui ne fonctionne pas, ce qui doit changer |
| ITERATE | — | réinjecte les apprentissages dans VISION ou toute étape antérieure |

Règle de proportionnalité (CLAUDE.md §11) : ce workflow complet s'applique aux fonctionnalités importantes et décisions stratégiques, pas aux petites modifications (`Problem → Solution → Implement` suffit alors).
