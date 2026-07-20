# Skills — Projet Librairie Photo Stéphane Wagner

> Contexte projet pour Claude Code — branche `refactoring-sigma`

---

## Stack

- **Frontend** : Vanilla HTML, CSS, JavaScript (ES6+)
- **Backend** : PHP (admin, abonnements, triptyque API)
- **Scripts** : Node.js (build infolettre, watch, envoi newsletter)
- **AI** : Claude API (triptyque narratif)
- **Email** : Mailchimp API
- **CI/CD** : GitHub Actions (`deploy.yml`)

---

## Architecture réelle

```
/
├── index.html                    # Photothèque (page principale)
├── phototheque.html              # Photothèque (variante)
├── admin.html                    # Interface admin
├── admin-save.php                # Backend admin
├── collections-visibility.json   # Config visibilité collections
├── wplr-iptc-keywords.php        # Mots-clés IPTC
│
├── rejoindre/
│   └── index.html                # Page inscription
│
├── shutterstock/
│   └── index.html                # Dashboard stats Shutterstock
├── shutterstock-callback/
│   └── index.php                 # OAuth callback Shutterstock
│
├── stories/
│   ├── index.html
│   ├── stories.js
│   └── stories.css
│
├── infolettre/
│   ├── index.html                # Template email principal
│   ├── index-previews.html       # Index des previews
│   ├── preview.html              # Preview générique
│   ├── preview-01..10.html       # Previews générées (build)
│   └── contenu-01..10.md         # Contenu éditorial des numéros
│
├── scripts/
│   ├── build-preview.js          # Génère les preview-XX.html
│   ├── watch.js                  # Watcher développement
│   ├── send-newsletter.js        # Envoi Mailchimp
│   ├── subscribe.php             # API abonnement
│   └── triptyque-story.php       # API Claude → histoire triptyque
│
├── js/
│   ├── app.js                    # Entry point
│   ├── api.js                    # Appels API (+ proxy CORS localhost)
│   ├── acquisition.js            # Acquisition photos
│   ├── gallery.js                # Galerie principale
│   ├── images.js                 # Gestion images
│   ├── modal.js                  # Modal générique
│   ├── search.js                 # Recherche + autocomplete → Dropdown
│   ├── spotify-modal.js          # Intégration Spotify
│   ├── thumbnails.js             # Vignettes
│   ├── triptyque.js              # Sélection triptyque
│   ├── utils.js                  # Helpers
│   └── components/               # Sigma Design System — factories JS
│       ├── button.js             # createButton()
│       ├── header.js             # createHeader()
│       ├── footer.js             # createFooter()
│       ├── dropdown.js           # createDropdown()
│       ├── toggle.js             # createToggle()
│       ├── bottom-action-bar.js  # createBottomActionBar()
│       ├── image-card.js         # createImageCard()
│       └── masonry-grid.js       # createMasonryGrid()
│
├── assets/
│   ├── sounds/shutter.wav
│   ├── svg/                      # Logos
│   └── styles/
│       ├── styles.css            # Import principal
│       ├── variables.css         # Variables CSS actuelles (à migrer → tokens)
│       ├── reset.css
│       ├── layout.css
│       ├── typography.css
│       ├── utilities.css
│       ├── musique.css
│       └── components/
│           ├── bottom-action-bar.css
│           ├── buttons.css
│           ├── dropdown.css
│           ├── footer.css
│           ├── gallery.css
│           ├── header.css
│           ├── keywords.css
│           ├── lightbox.css
│           ├── modal.css
│           ├── search.css
│           ├── toggle.css
│           ├── triptyque.css
│           └── masonry-grid.css
│
└── docs/
    ├── skills.md                 # Ce fichier
    ├── tokens.css                # Design tokens Sigma (source de vérité)
    └── tokens.md                 # Documentation tokens
```

---

## Design System — Sigma (tokens réels)

Source : `docs/tokens.css` — extrait du Figma officiel.

> **Dark / Light Mode :** le design system Sigma inclut bien les deux modes. Les tokens sémantiques (texte, fond, bordure, hover) ont des valeurs distinctes. Activation via `@media (prefers-color-scheme: dark)` ou `[data-theme="dark"]` sur `<html>`. Seul `--color-core-secondary-green` diffère dans les Core (`#39bf87` light → `#0dd6a4` dark).

### Couleurs principales

```css
/* Texte */
--color-text-primary:    #1f1f1f;
--color-text-secondary:  #3d3d3d;
--color-text-tertiary:   #7a7a7a;
--color-text-disabled:   #b8b8b8;
--color-text-primary-b:  #ffffff;

/* Fonds */
--color-bg-primary:      #ffffff;
--color-bg-secondary:    #f5f5f5;
--color-bg-tertiary:     #b6b6b6;
--color-bg-active:       #e0e0e0;
--color-bg-disabled:     #f5f5f5;

/* Bordures */
--color-border-primary:  #1f1f1f;
--color-border-secondary:#b8b8b8;
--color-border-tertiary: #e0e0e0;

/* Hover */
--color-hover-primary:   #e2e2e2;

/* Core */
--color-core-primary-a:  #1f1f1f;
--color-core-primary-b:  #ffffff;
--color-core-primary-blue:#0d77d3;
```

### Typographie

- **Font** : `General Sans Variable`
- **Styles** : Title M (32px/500), Headline (20px/500|450), Headline Body (16px/500), Caption (14px/450)
- **Letter-spacing** : `-0.02em` sur tous les niveaux

### Border Radius

```css
--radius-firm:      12px;   /* cartes, boutons */
--radius-circular:  200px;  /* pills, avatars */
```

---

## Composants Sigma créés (branche `refactoring-sigma`)

Chaque composant = un fichier JS factory + un fichier CSS découplé.

| Composant | JS factory | CSS | Figma node | Utilisé dans |
|---|---|---|---|---|
| **Button** | `js/components/button.js` | `assets/styles/components/buttons.css` | `1585-15045` | `modal.js` — commande impression + wishlist cœur |
| **SearchField** | — (HTML statique) | `assets/styles/components/search.css` | `1585-17155` | `index.html`, `phototheque.html` |
| **Header** | `js/components/header.js` | `assets/styles/components/header.css` | `1585-17014` | `app.js` (mount `#site-header-mount`) |
| **Footer** | `js/components/footer.js` | `assets/styles/components/footer.css` | — | `app.js` (mount `#site-footer-mount`) |
| **Dropdown** | `js/components/dropdown.js` | `assets/styles/components/dropdown.css` | `1585-16584` | `search.js` (autocomplete suggestions) |
| **Toggle** | `js/components/toggle.js` | `assets/styles/components/toggle.css` | `1585-15559` | `admin.html` (visibilité collections) |
| **BottomActionBar** | `js/components/bottom-action-bar.js` | `assets/styles/components/bottom-action-bar.css` | `1585-15444` | `modal.js` (commande), `triptyque.js` (barre de page) |
| **ImageCard** | `js/components/image-card.js` | `assets/styles/components/masonry-grid.css` | — | `masonry-grid.js` |
| **MasonryGrid** | `js/components/masonry-grid.js` | `assets/styles/components/masonry-grid.css` | — | `app.js` (featured index.html) |


## Composants à refactorer

| Fichier | Statut |
|---|---|
| `assets/styles/components/buttons.css` | ✅ Sigma |
| `assets/styles/components/search.css` | ✅ Sigma |
| `assets/styles/components/header.css` | ✅ Sigma |
| `assets/styles/components/dropdown.css` | ✅ Sigma |
| `assets/styles/components/footer.css` | ✅ Sigma |
| `assets/styles/components/toggle.css` | ✅ Sigma |
| `assets/styles/components/bottom-action-bar.css` | ✅ Sigma |
| `assets/styles/components/masonry-grid.css` | ✅ Sigma |
| `assets/styles/components/modal.css` | 🔶 partiel (cards orientation → tokens, reste ⏳) |
| `assets/styles/components/triptyque.css` | 🔶 partiel (bouton wishlist nettoyé, reste ⏳) |
| `assets/styles/variables.css` | ⏳ migrer vers `docs/tokens.css` |
| `assets/styles/typography.css` | ⏳ |
| `assets/styles/components/gallery.css` | ⏳ |
| `assets/styles/components/lightbox.css` | ⏳ |
| `assets/styles/components/keywords.css` | ⏳ |
| `assets/styles/layout.css` | ⏳ |
| `assets/styles/utilities.css` | ⏳ |

---

## Règles de refactoring

1. Importer `docs/tokens.css` en premier dans la cascade
2. Remplacer toutes les valeurs hardcodées par `var(--color-*)`, `var(--font-*)`, `var(--radius-*)`
3. Un fichier à la fois → vérifier dans le navigateur → commiter
4. Jamais de styles inline
5. Mettre à jour le statut dans ce fichier après chaque composant

---

## Workflow session

```
1. Choisir le composant suivant dans le tableau ci-dessus
2. Lire le fichier actuel
3. Remplacer hardcoded → tokens
4. Vérifier visuellement
5. Commiter : "refactor: [composant] → tokens Sigma"
6. Passer ⏳ → ✅ dans skills.md
```

---

## Workflow haut niveau

```
1. Pousser la vente d'impression
2. Permettre au utilisateurs de jouer avec les images
3. Construire de micro récits
4. Archiver et inventorier un language visuel
```

---

## Ressources

- [Tokens CSS](./tokens.css)
- [Documentation tokens](./tokens.md)
- [Figma Design System](https://www.figma.com/design/QgM6d52yaLh6vkJCnTRsMa/)
