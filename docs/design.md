# Design — PHOTO PRODUCT

Gouvernance design du projet. Ce document définit les principes, les décisions et les conventions qui guident l'ensemble des choix visuels et d'interaction.

> Source d'inspiration principale : [Sigma Design System](https://www.thesigma.co/) — *"Simple by nature. Stunning by design."*

---

## 1. Principes

### Simple et intentionnel

Chaque élément présent dans l'interface doit avoir une raison d'être. Rien n'est décoratif sans but. La simplicité n'est pas un manque — c'est une décision.

### Harmonie

Les éléments ne doivent pas seulement suivre un style guide. Ils doivent entretenir une **relation consciente entre eux** — typographie, espace, couleur, image.

### Attention au détail

Aucun raccourci visuel. La qualité doit être **perceptible sans être expliquée**. Le design doit sembler *évidemment meilleur*.

### Consistance

Des conventions uniformes à travers tout le produit. Un utilisateur ne doit jamais se demander s'il est sur le même site.

### La photo d'abord

Le design est au service de l'image photographique. L'interface recule pour laisser l'œuvre occuper l'espace.

---

## 2. Tokens

Les décisions de base du design system. Toute valeur utilisée dans l'interface doit être définie ici avant d'être appliquée.

→ Référence technique : `docs/tokens.md` / `docs/tokens.css`

### Typographie

* Hiérarchie basée sur le **rythme**, pas uniquement sur la taille
* Graisse et interlignage ajustés pour la fluidité de lecture
* Une à deux familles maximum

### Couleurs

* Palette construite autour du **comportement de la lumière**
* Suffisamment flexible pour coexister avec des images contrastées ou sombres
* Mode clair à privilégier

### Espacement

* Système à définir (base 4 ou 8 px)
* L'espace est un élément de design au même titre que la couleur

### Iconographie

* Minimaliste
* Cohérente avec la typographie en termes de graisse visuelle

---

## 3. Composants

À définir au fur et à mesure des besoins réels. Ne pas créer un composant avant qu'il soit nécessaire.

Familles anticipées :

* Navigation
* Grilles photo / galeries
* Cards (série, produit, histoire)
* Modale
* Formulaires (newsletter, achat)
* Badge / tag
* Boutons et actions

---

## 4. Psychologie UX

Principes comportementaux à appliquer aux choix de design. Inspiré de la bibliothèque *User Psychology 3* de Sigma.

| Principe | Application au projet |
|---|---|
| **Halo Effect** | La qualité visuelle de l'interface renforce la perception de la qualité des photos |
| **Cognitive Load** | Ne pas surcharger les pages — laisser respirer, un focus à la fois |
| **Visual Hierarchy** | Guider l'attention : photo → titre → action |
| **Social Proof** | Témoignages, éditions limitées, mentions presse |
| **Loss Aversion** | Éditions limitées, numérotation des tirages |
| **Anchoring** | Le premier prix ou format vu ancre la perception de valeur |
| **Fitts's Law** | Les zones d'action (acheter, contacter) doivent être accessibles et dimensionnées |
| **Juxtaposition** | Le contraste entre images et espaces vides renforce l'impact visuel |

---

## 5. Références et inspirations

* [Sigma Design System](https://www.thesigma.co/) — principes, tokens, composants
* [1x.com](https://1x.com/) — expérience éditoriale photographique (voir `PROJECT.md`)
* Apple Human Interface Guidelines — référence de simplicité et d'attention au détail

---

## 6. Décisions

Les décisions design importantes sont documentées ici avec leur contexte.

Format :

```
### [Titre de la décision]
Date :
Contexte :
Problème :
Options considérées :
Décision :
Raison :
Conséquences :
```

### Mode clair pour le site public

```
Date : 2026-08-28
Contexte : Le site était en mode sombre, conçu initialement comme une photothèque.
Problème : Le mode sombre crée une ambiance "app tech" incompatible avec une galerie d'art et un parcours d'achat de tirages.
Options considérées :
  A. Garder le mode sombre (photothèque)
  B. Passer en mode clair pour tout le site
  C. Mode clair pour le site public, mode sombre pour l'admin
Décision : Option C
Raison : La galerie et la boutique bénéficient d'un fond clair (confiance, lisibilité, qualité perçue). L'admin reste en mode sombre — usage interne, ambiance photothèque conservée.
Conséquences : Refonte des tokens couleurs du site public. admin.html conserve le thème sombre actuel.
```

---

## 7. À faire

* Définir la typographie principale
* Définir la palette de couleurs (light mode)
* Refondre les tokens couleurs du site public (`docs/tokens.css`)
* Vérifier le contraste sur tous les composants (modale, chips, formulaires)
* Conserver le thème sombre dans `admin.html`
* Auditer l'interface existante (`index.html`, `phototheque.html`)
* Identifier les premiers composants à formaliser
