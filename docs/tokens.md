# Sigma Design System — Tokens

Source : [Figma](https://www.figma.com/design/QgM6d52yaLh6vkJCnTRsMa/)  
Fichier CSS : `docs/tokens.css`

> **Dark / Light Mode** : les tokens sémantiques (texte, fond, bordure, hover) changent selon le mode. Les couleurs Core sont fixes sauf `--color-core-secondary-green` (`#39bf87` en light → `#0dd6a4` en dark). Le dark mode se déclenche via `@media (prefers-color-scheme: dark)` ou l'attribut `[data-theme="dark"]` sur `<html>`.

---

## Couleurs — Core

| Token CSS | Valeur |
|---|---|
| `--color-core-primary-a` | `#1f1f1f` |
| `--color-core-primary-b` | `#ffffff` |
| `--color-core-primary-blue` | `#0d77d3` |
| `--color-core-secondary-blue` | `#61aaf2` |
| `--color-core-primary-red` | `#cf3030` |
| `--color-core-secondary-red` | `#f26161` |
| `--color-core-primary-green` | `#288556` |
| `--color-core-secondary-green` | `#39bf87` |
| `--color-core-primary-yellow` | `#ce8508` |
| `--color-core-secondary-yellow` | `#facd64` |
| `--color-core-primary-orange` | `#c2410b` |
| `--color-core-secondary-orange` | `#ff9966` |
| `--color-core-primary-purple` | `#7e24b2` |
| `--color-core-secondary-purple` | `#a985f2` |
| `--color-core-primary-pink` | `#d941bf` |
| `--color-core-secondary-pink` | `#f285c5` |

---

## Couleurs — Texte

| Token CSS | Light | Dark | Usage |
|---|---|---|---|
| `--color-text-primary` | `#1f1f1f` | `#ffffff` | Texte principal |
| `--color-text-secondary` | `#3d3d3d` | `#b8b8b8` | Texte secondaire |
| `--color-text-tertiary` | `#7a7a7a` | `#7a7a7a` | Texte tertiaire / placeholder |
| `--color-text-disabled` | `#b8b8b8` | `#3d3d3d` | Désactivé |
| `--color-text-primary-b` | `#ffffff` | `#1f1f1f` | Texte inversé |

---

## Couleurs — Fond

| Token CSS | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg-primary` | `#ffffff` | `#141414` | Fond principal |
| `--color-bg-secondary` | `#f5f5f5` | `#1f1f1f` | Fond secondaire / carte |
| `--color-bg-tertiary` | `#b6b6b6` | `#7a7a7a` | Fond tertiaire |
| `--color-bg-active` | `#e0e0e0` | `#3d3d3d` | État actif |
| `--color-bg-disabled` | `#f5f5f5` | `#1f1f1f` | Désactivé |

---

## Couleurs — Bordure

| Token CSS | Light | Dark |
|---|---|---|
| `--color-border-primary` | `#1f1f1f` | `#7a7a7a` |
| `--color-border-secondary` | `#b8b8b8` | `#3d3d3d` |
| `--color-border-tertiary` | `#e0e0e0` | `#1f1f1f` |

---

## Couleurs — Hover

| Token CSS | Light | Dark |
|---|---|---|
| `--color-hover-primary` | `#e2e2e2` | `#4c4c4c` |

---

## Typographie

**Font family** : `General Sans Variable`

| Rôle | Taille | Poids | Line-height | Letter-spacing |
|---|---|---|---|---|
| Title M / Medium | 32px | 500 | 40px | -0.02em |
| Headline / Medium | 20px | 500 | 24px | -0.02em |
| Headline / Regular | 20px | 450 | 24px | -0.02em |
| Headline Body / Medium | 16px | 500 | 20px | -0.02em |
| Body Caption / Regular | 14px | 450 | 18px | -0.02em |

---

## Border Radius

| Token CSS | Valeur | Usage |
|---|---|---|
| `--radius-firm` | `12px` | Cartes, boutons |
| `--radius-circular` | `200px` | Pills, avatars |
