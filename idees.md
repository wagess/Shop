# Idées

Pistes à explorer, décisions à prendre, fonctionnalités futures. Ces éléments ne sont pas encore planifiés — ils attendent d'être évalués, priorisés ou abandonnés.

---

## Orientation stratégique : le nouveau front-end absorbe photographie.stephanewagner.com, WordPress devient le backend éditorial

**Contexte :** Deux plateformes distinctes coexistent aujourd'hui — photographie.stephanewagner.com (WordPress, éditorial : séries, carnets, expositions) et Shop (boutique + photothèque, en cours de migration Sigma).

**Modèle retenu (clarifié le 2026-09-13, remplace la formulation initiale du 2026-09-08 ci-dessous) :** ce n'est pas une fusion symétrique de deux sites. Il n'y aura qu'un seul domaine public à terme : `photographie.stephanewagner.com` (`www.stephanewagner.com` reste un site à part, le portfolio pro Product Designer, hors périmètre). Le nouveau front-end actuellement en chantier (le code de ce projet, aujourd'hui appelé « Shop ») absorbe progressivement le contenu éditorial de photographie.stephanewagner.com. Une fois ce contenu repris dans le nouveau design, l'actuel thème WordPress public de photographie.stephanewagner.com est mis de côté/retiré — le nom de domaine reste, mais ce qu'il sert change entièrement.

WordPress ne disparaît pas : son rôle s'élargit plutôt que de se réduire. Il reste le backend qui synchronise la photothèque brute (WP/LR Sync, comme aujourd'hui) **et** devient aussi le lieu de rédaction de tous les contenus éditoriaux (articles, stories, etc.) — le « cerveau éditorial », 100 % headless, jamais affiché directement au visiteur. Un contenu rédigé dans WordPress (ex. une story) s'affiche sur le nouveau front-end (ex. `/stories/`), jamais sur une page WordPress rendue.

Cohérent avec le principe déjà posé dans `PROJECT.md` §3 (« La boutique sera l'UNIQUE source d'images ») — cette orientation étend le principe à l'ensemble de la plateforme éditoriale, pas seulement aux images.

**Dépendance au plugin WP/LR Sync — décision prise (2026-09-13) :**

WP/LR Sync (Lightroom → WordPress) n'est pas qu'un outil éditorial — c'est la couche de données de toute la photothèque actuelle :
- `js/api.js:7-8` → `wp-json/wplr/v1/hierarchy` et `wplr/v1/gallery/{id}` viennent du plugin WP/LR Sync
- `wplr-iptc-keywords.php` (voir `backlog.md`) est un plugin WordPress custom pour les mots-clés IPTC
- `proxy.php` relaie tout ça depuis `photographie.stephanewagner.com`

Trois options avaient été identifiées le 2026-09-08 :
- **A. WP headless invisible** — WP/LR Sync + plugin IPTC continuent de tourner sur l'unique install WordPress, qui devient un « fantôme » en arrière-plan : plus aucune page publique, uniquement une API headless (`wp-json/wplr/v1/*`) consommée par le nouveau front-end. Une seule install à maintenir, WP/LR Sync continue exactement comme aujourd'hui, aucune donnée à reconstruire.
- **B. Remplacer WP/LR Sync** — Lightroom Publish Service natif ou plugin SDK custom écrivant directement dans le format de données du Shop.
- **C. Migration progressive** — garder WP/LR Sync pendant la transition, exporter périodiquement vers le format natif du Shop, couper WordPress une fois stabilisé.

**→ Option A retenue**, B et C écartées. WordPress reste la source de données unique, en arrière-plan.

**Idée à la volée, non tranchée :** renommer « Stories » en « Sagas », en écho à une section qui existe déjà sous ce nom sur photographie.stephanewagner.com. Piste à évaluer, pas une décision.

**Point technique identifié, secondaire pour l'instant :** au moment du déploiement, WordPress (wp-admin, wp-json, wp-content) et les fichiers du nouveau front-end devront cohabiter sous le même domaine public. Deux approches possibles, à trancher au moment venu :
- **Même docroot avec règles `.htaccess`** — `/wp-admin`, `/wp-json`, `/wp-content` routés vers WordPress, tout le reste vers le front-end. Aucune URL codée en dur à changer dans le code actuel.
- **WordPress sur un hostname technique interne**, jamais montré au public — oblige à mettre à jour l'URL WordPress codée en dur dans ~9 fichiers (`js/api.js`, `js/triptyque.js`, `js/images.js`, `stories/stories.js`, `admin.html`, `scripts/build-preview.js`, `scripts/send-newsletter.js`, `rejoindre/index.html`, previews infolettre).

Actuellement en prod : Shop est déployé sur `shop.stephanewagner.com` (`.github/workflows/deploy.yml:24`, docroot `/home/wagess/shop.stephanewagner.com`), WordPress sur `photographie.stephanewagner.com` — ces deux configurations devront converger.

**À clarifier avant de prioriser :**
- Quel contenu de photographie.stephanewagner.com doit migrer vers le nouveau front-end (séries, carnets, expositions) et selon quel séquençage ?
- Impact SEO / redirections sur les URLs existantes de photographie.stephanewagner.com (probablement indexées, avec des backlinks — vrai risque si coupées sans redirections 301 mappées page par page).
- Approche de cohabitation WordPress/front-end au déploiement (voir ci-dessus).
- Est-ce compatible avec la priorité actuelle (migration Sigma + stabilité de la vente, voir `PROJECT.md` §9) ou est-ce une phase suivante ?

Complexité estimée : élevée (décision stratégique, architecture multi-plateforme). Ne pas prioriser avant d'avoir clarifié le séquençage et le SEO — voir CLAUDE.md §4.

---

## Recherche par mots-clés IPTC

La recherche filtre actuellement sur `name`, `path`, `id` des albums/collections uniquement.

**Idée :** permettre de trouver des galeries contenant des photos avec un mot-clé IPTC donné.

Approche possible :
- Nouvel endpoint PHP `/search-by-keyword?q=...` dans `wplr-iptc-keywords.php`
- Jointure WordPress (photos → galeries) côté serveur
- Adapter `search.js` pour interroger ce nouvel endpoint

Complexité estimée : moyenne.

---

## Protection de la propriété intellectuelle

Décisions à prendre sur la protection des images servies :

- [ ] Vérifier si les previews sont en basse résolution (haute def jamais exposée ?)
- [ ] Watermark visible ou invisible sur les images servies
- [ ] Notice © + conditions d'utilisation
- [ ] Remplacer les formulaires maison (`scripts/subscribe.php`, `rejoindre/`) par l'embed Mailchimp natif

---

## Formulaires d'acquisition

Remplacer les formulaires maison par l'embed Mailchimp natif — décision prise, pas encore implémenté.

---

## Tableau de bord Shutterstock

Une fois l'accès à l'API Contributeur débloqué :
- Statistiques de ventes et de vues
- Graphiques d'évolution

---

## Page série (détail) + section accueil dynamique

**État actuel (vérifié dans le code, 2026-09-07) :**
- Le flag « Série » (admin.html → `collections-visibility.json` champ `series`) et son contenu (`series-content.md` : Format/Période/Description) ne sont lus **nulle part côté front-end public**. Ils n'existent que dans `admin.html`.
- La visibilité générale sur `index.html` suit le toggle de visibilité classique (`js/app.js` → `collections-visibility.json` → `collections`/`folders`), indépendant du flag Série.
- La section « Séries & Collections » de l'accueil (`#seriesCardsGrid`) est peuplée par `js/home-sections.js` à partir d'une liste **codée en dur** : `FEATURED_SERIES = ['Scènes de vie', 'Paysages', 'Urbanisme']` — aucun lien avec l'admin.

**Idées à concrétiser plus tard :**
1. Brancher `FEATURED_SERIES` sur le flag Série de l'admin (au lieu de la liste codée en dur), pour que les collections marquées série dans l'admin apparaissent automatiquement sur l'accueil.
2. Une future page dédiée par série, qui raconte la série visuelle en détail — utiliserait le contenu Format/Période/Description déjà capturable depuis l'admin.

Design pas encore décidé pour l'un ou l'autre — à concevoir quand cette piste sera priorisée.

---

## Fonctionnalité musicale (Spotify) — retirée le 2026-09-13

**Contexte :** l'accueil avait un bouton dans la nav (icône musique) ouvrant une modale avec un iframe Spotify embarquant une playlist (`js/spotify-modal.js`, `assets/styles/musique.css`, modale `#spotifyModal` dans `index.html`). Le bouton bascule play/stop et remplace l'iframe par une iframe vide à l'arrêt.

**Pourquoi retirée :** demande explicite de simplification — supprimée du produit, pas seulement cachée. Le code a été supprimé entièrement (fichiers, styles, markup, lien nav) plutôt que désactivé, pour éviter du code mort.

**Piste pour plus tard, si l'idée revient :** une expérience d'écoute pendant la navigation reste une idée valable pour l'ambiance éditoriale (cohérent avec ART → STORY → DISCOVERY de CLAUDE.md §6), mais mériterait d'être repensée comme composant à part entière (pas un bouton isolé dans la nav) — par exemple intégrée à l'expérience Stories/Sagas plutôt qu'à l'accueil. À reconcevoir (Problem → UX → Design) plutôt qu'à réimporter tel quel.

---

## Autres pistes

- Proposer un profilage de l'utilisateur à son arrivée sur la page en même temps que l'inscription à l'infolettre

---

## Modale boutique unifiée (Shop + Commander + impression) — wireframe démarré le 2026-09-24

**Contexte :** avant cette décision, 3 parcours d'achat coexistaient sans lien entre eux : le bouton "Shop" de la nav ouvrait le panier triptyque (3 photos, `js/triptyque.js`), le bouton "Commander" des Heroes pointait vers la section `#shop` de l'accueil (catalogue, prix "à définir"), et le bouton "Commander une impression" sur chaque photo ouvrait un vrai formulaire de commande par photo (`js/modal.js` → `orderPrint`, connecté à l'API WordPress). Trois entrées, trois destinations différentes, aucune vue d'ensemble. Reprend et précise l'idée notée précédemment ici ("le Tryptique devient un panier d'achat... focus modèle UX Airbnb").

**Décision (PO, 2026-09-24) :** Shop (nav) et Commander (Heroes) doivent ouvrir **la même modale**, qui deviendra la porte d'entrée unique de la boutique — regroupant navigation boutique, panier d'achat et impression (à l'unité ou en lot). Le design précis n'est pas encore tranché ("modale à designer plus précisément") — la demande était de documenter la direction et de démarrer un module en **mode wireframe**.

**Wireframe construit (2026-09-24) :** `window.openShopModal()` dans `js/triptyque.js` (+ styles `.shub__*` dans `assets/styles/components/triptyque.css`), ouvert par le bouton Shop de la nav (`js/components/nav.js`) et par le bouton "Commander" des Heroes (`index.html`, `serie.html`, classe `.btn-commander` — voir aussi [[project_content_model]]/mémoire pour ce bouton). Réutilise le shell `.tmodal` existant (pas un nouveau système de modale), en plus large pour un layout à 2 colonnes (inspiré d'une référence Mailchimp fournie par le PO — contenu/actions à gauche, panneau illustratif à droite). Contenu actuel, volontairement à l'état de wireframe :
- **Impression unique** → renvoie vers `/phototheque.html` (choisir une photo précise, puis passer par le vrai formulaire `orderPrint` existant — pas dupliqué).
- **Impression en lot (triptyque)** → bouton "Voir mon panier", ouvre le panier triptyque existant tel quel (`triptyqueOpenModal()`, aucune logique changée).
- **Voir toute la boutique** → lien vers `/#shop`.
- Panneau de droite : bloc pointillé "[Illustration à définir]" — pas de direction visuelle inventée, même convention que les "[prix]" placeholders ailleurs sur le site.

**Extension (PO, 2026-09-24, même jour) :** tous les boutons "Commander" associés à une photo précise doivent aussi ouvrir cette modale, mais directement en **mode impression unique** (pas le hub générique) — et 2 nouveaux points d'entrée ajoutés : le bouton "Commander une impression" par-photo de la photothèque (qui sautait directement dans le vrai formulaire) passe désormais par ce mode ; un bouton "Commander cette photo" est ajouté sur la photo aléatoire du Hero accueil (`#randomImageOrderBtn`, mécanique déjà présente dans `js/images.js` mais sans élément HTML jusqu'ici — retrouvée et raccordée plutôt que recréée) ; dans la page série, le bouton "Voir en grand" de la photo spotlight est remplacé par "Commander" (la photo reste zoomable en cliquant l'image elle-même, comme les autres photos de la grille).

`window.openShopModal({ mode: 'unique', photo: {id, title, url} })` : même shell `.tmodal.shub` à 2 colonnes que le hub, mais contextualisé — titre/nom de la photo, la vraie image en aperçu à droite (bordure pleine, pas de placeholder pointillé puisque le contenu est réel), et un seul CTA "Commander cette impression" qui appelle `window.orderPrint()` tel quel (aucun changement au vrai formulaire de commande existant). 4 points d'entrée branchés : Hero accueil (photo aléatoire), page série (photo spotlight), grille photothèque (`js/modal.js`), et en toile de fond le mode "hub" (générique, Shop/Commander) reste inchangé.

**Pas encore tranché / à designer plus précisément :**
- Le panier reste capé à exactement 3 photos ("Triptyque") — est-ce que "panier d'achat" doit devenir un panier de taille libre (au-delà de 3), avec "triptyque" comme un cas particulier (lot de 3) parmi d'autres formats de lot ?
- Le nom "Triptyque" survit-il à la fusion, ou le panier devient-il générique ("Panier") avec le triptyque comme une option d'assemblage ?
- Contenu réel du panneau illustratif de droite (mode hub — le mode "unique" affiche maintenant la vraie photo, donc déjà réglé pour ce mode-là).

**Fichiers :** `js/triptyque.js`, `assets/styles/components/triptyque.css`, `js/components/nav.js`, `js/images.js`, `js/modal.js`, `js/serie-page.js`, `index.html`, `serie.html`. Voir aussi `docs/audit-design.md` (audit du parcours d'achat, question ouverte sur le modèle commercial) et `backlog.md` (section Triptyque narratif — obsolète, remplacée).

**Précision des niveaux d'entrée + nouvelle offre numérique (PO, 2026-09-28) :** confirmation que `Commander` et `Shop` ouvrent bien une seule et même modale (le hub `window.openShopModal()` ci-dessus), avec plusieurs niveaux d'entrée selon le bouton :
- **Shop** (générique) → ouvre le hub, sans contexte pré-rempli.
- **Commander cette photo** → ouvre directement le mode `unique` (déjà implémenté ci-dessus, demande d'impression pour cette photo précise).
- **Ajouter la série** → nouveau niveau, pas encore construit : ouvre le shop pré-rempli avec la séquence de photos de la série consultée (par analogie avec le mode `unique`, mais pour un ensemble de photos plutôt qu'une seule — distinct du panier triptyque qui est capé à 3 photos sans lien avec une série).

Autre précision : le **hub générique** (mode `Shop`) doit proposer deux offres, pas seulement l'impression :
1. commande d'impression (existant — unique ou en lot) ;
2. **demande d'acquisition de la série en version numérique** (licence/téléchargement, sans impression) — offre pas encore construite, ni dans le hub ni ailleurs.

**Pas encore tranché / à designer plus précisément (ajout du 2026-09-28, matin) :**
- Le mode "Ajouter la série" doit-il réutiliser le panier triptyque (capé à 3), ou est-ce un 3e mode de `openShopModal` distinct pour une série entière (nombre de photos variable) ?
- Quel est le produit exact de l'acquisition numérique (licence perso vs. commerciale ? fichiers HD téléchargeables ? tarif par série ou par photo ?) — question à traiter en Problem → Hypothesis avant design (CLAUDE.md §5.1).

---

### Refonte finale du parcours d'achat — panier unique, Triptyque supprimé (PO, 2026-09-28, après-midi)

Cette décision **remplace** le modèle par "niveaux" (`unique` / hub / série envisagée) décrit ci-dessus par un modèle plus simple : un seul panier d'achat, rempli progressivement, peu importe le point d'entrée. Répond aussi aux deux questions laissées ouvertes juste au-dessus.

**Scénarios (2 seulement) :**
1. Commander une ou plusieurs impressions.
2. Acheter une ou plusieurs images au format numérique.

Dans les deux cas, la commande **envoie un courriel** (aucun vrai checkout/paiement — comme le formulaire `orderPrint` existant aujourd'hui, `js/modal.js` → `sendOrderEmail` → `wplr-iptc-keywords.php`).

**Remplissage du panier :** boutons "Ajouter…" (sur une photo, une série, etc.) **et** l'icône cœur dans les albums — **fusionnés en un seul mécanisme**. Plus de distinction entre "sélection narrative" et "sélection d'achat".

**❌ Triptyque narratif — supprimé entièrement**, pas juste fusionné :
- Le plafond de 3 photos disparaît (le panier est de taille libre).
- Toute la mécanique narrative (micro-histoire, modale "Votre triptyque", `tmodal__story-*`) est retirée, pas seulement désactivée — même traitement que la suppression de la fonctionnalité Spotify plus haut dans ce fichier (code mort supprimé, pas caché).
- Fichiers concernés : `js/triptyque.js` (à renommer/refondre en logique de panier générique), styles `.tmodal__story-*` et `.triptyque-*` dans `assets/styles/components/triptyque.css`, le bandeau `#triptyque-page-bar`, le badge `#triptyque-badge` (`js/components/nav.js:50`).
- Si l'idée de "raconter une histoire à partir d'une sélection" revient un jour, elle devra être reconçue comme composant à part (cohérent avec la piste Spotify ci-dessus) — pas réintégrée dans le panier d'achat.

**Étapes de la modale (unique, quel que soit le point d'entrée) :**
1. Affiche le shop avec la sélection courante.
2. L'utilisateur choisit le mode d'achat — **numérique ou imprimé, un seul mode par commande** (pas de mélange dans une même commande ; pour l'autre mode, une commande séparée).
3. Il choisit le format — **global pour toute la commande** (un seul format/papier appliqué à toutes les photos sélectionnées, pas par photo).
4. Il remplit le formulaire de coordonnées (réutilise le formulaire existant, étape 2/3 de `showOrderForm` dans `js/modal.js`).

**Bandeau du bas :** devient un résumé transitoire du contenu du panier (pas un panier narratif) — apparaît à chaque ajout, affiche le compte, **disparaît automatiquement après quelques secondes**. L'accès permanent au panier reste le badge sur le bouton **Shop** de la nav (compte d'items, toujours visible), qui ouvre la modale à l'étape 1 avec la sélection courante.

**Toujours ouvert :** le produit exact de l'acquisition numérique (licence perso/commerciale, fichiers HD, tarif par photo ou par lot) — pas traité par cette décision, à clarifier avant de designer l'étape 3 en mode numérique.

**Fichiers impactés (mise à jour) :** `js/triptyque.js` (refonte majeure), `assets/styles/components/triptyque.css`, `js/components/nav.js` (badge), `js/modal.js` (formulaire à généraliser pour panier multi-photos + mode numérique), `js/images.js`, `js/serie-page.js`, `index.html`, `serie.html`.