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

## Mur virtuel de photos encadrées — prototype construit le 2026-10-03

**Idée :** une page présentant la photothèque comme un mur de cadres accrochés (façon salon, cadres de tailles et inclinaisons variées), plutôt que la grille habituelle de `phototheque.html`. Piste exploratoire, cohérente avec ART → STORY → DISCOVERY (CLAUDE.md §6) — pas encore évaluée comme fonctionnalité à part entière.

**Prototype construit, non listé dans le site :** `/mur.html`. Accessible uniquement via un lien dans le footer (« Mur (prototype) »), absent de la nav principale et marqué `noindex`. Charge un échantillon aléatoire de vraies photos depuis l'API existante (`js/api.js`), affichées en cadres avec marie-louise, légère rotation et tailles variées ; clic = visionneuse plein écran.

**Pas encore tranché :**
- Est-ce que ce concept remplace, complète ou n'a aucun rapport avec `phototheque.html` ?
- Sélection des photos : aléatoire (comme aujourd'hui) vs. curatée (une série, les coups de cœur) ?
- Vaut-il la peine d'être développé plus loin, ou reste-t-il une expérimentation visuelle à usage unique ?

**Fichiers :** `mur.html`, `js/mur-page.js`, `assets/styles/pages/mur.css`, lien ajouté dans `js/app.js` (`mountFooter`).

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

---

**Nouveau shell de modale depuis Figma — prototype construit le 2026-10-04 :** le PO a fourni un modèle d'affichage pour la modale shop directement depuis Figma (`vDYe0oWfzs4InGstvpCxBk`, node 69:632 — instance du composant Sigma "Modal", fichier `QgM6d52yaLh6vkJCnTRsMa` node 1585:16501, intégrité du composant vérifiée avant implémentation). Forme très différente de l'actuel `.tmodal` (boîte centrée) : un tiroir plein écran ancré en bas, coins arrondis en haut seulement, handle de glisser, entête retour/titre/fermer.

Construit en **shell seul**, sans contenu et sans être branché nulle part (demande explicite du PO) : `js/components/shop-sheet.js` (`createShopSheet()`, `openShopSheet()`, `closeShopSheet()`) + `assets/styles/components/shop-sheet.css`. Aucun fichier existant modifié pour l'intégrer — pas de `<link>` dans `styles.css`, pas d'appel depuis `triptyque.js` ou `nav.js`. Testé en isolation (injection runtime dans le navigateur, retirée après vérification) : rendu conforme à la capture Figma, bouton fermer fonctionnel, options `leftAction`/`rightAction`/`showHandle`/`showTitle` robustes.

**Adopté comme modèle pour toutes les modales — migration 2026-10-04 (même jour) :** suite à validation du prototype, demande du PO ("utiliser ce layout comme modèle pour toutes les modales"). Périmètre clarifié par question de cadrage : panier/shop (`.tmodal`) et formulaire de commande (`.order-modal`, l'outil de vente actif) migrés ; popups légers (`<popup-panel>` — Impression, Infolettre) et visionneuse photo plein écran (`.photos-modal`/lightbox) **exclus** — contenu trop léger ou pas un vrai "dialogue", le tiroir 84vh aurait été surdimensionné.

Migration effectuée :
- `js/triptyque.js` converti en module ES (import `shop-sheet.js`) — les 9 pages qui le chargent passent en `<script type="module">`. Les 4 écrans (hub, impression unique, panier triptyque, confirmation) rendent leur contenu dans `.shop-sheet__body` ; `.tmodal-overlay`/`.tmodal`/`.tmodal__close`/`.tmodal__label` supprimés de `triptyque.css` (morts). Amélioration permise par le nouveau header : la confirmation triptyque a maintenant un vrai bouton retour vers le panier (absent avant).
- `js/modal.js` → `showOrderForm` (formulaire de commande 3 étapes) migré de la même façon : `.order-overlay`/`.order-modal`/`.order-modal__header`/`.order-modal__back`/`.order-modal__close` supprimés de `modal.css` (morts) ; étapes, transitions, sélection format/papier et soumission (`sendOrderEmail`) **inchangées**, seul le chrome change. Les pastilles d'étape restent dans le corps (le shell n'a qu'un slot de titre texte).
- `shop-sheet.js` : nouvelle fonction `setShopSheetHeader()` pour changer titre/bouton retour d'une sheet déjà ouverte sans la refermer (transition panier ↔ confirmation).
- `shop-sheet.css` globalisé dans `styles.css` (comme `modal.css`) plutôt que lié page par page — le formulaire de commande peut s'ouvrir depuis n'importe quelle page.
- Testé en direct dans le navigateur (pas seulement en isolation) : accueil, photothèque, séries — hub, panier (ajout/retrait/réinitialisation), confirmation + retour, impression unique → vrai formulaire de commande (3 étapes, retour, focus auto) ; soumission réelle non testée (appellerait l'API de production/enverrait un vrai courriel).

**Ajustement — la modale recouvre le hero en gardant l'allure d'un onglet (2026-10-04, même jour, affiné en 4 passes) :**
1. Overlay aligné sous la nav, mais gardait un voile noir + carte flottante centrée (min(1327px,92vw), coins arrondis 20px, ombre).
2. PO : zéro voile, même taille que le hero → `.shop-sheet-overlay` sans fond, `.shop-sheet` passé en `width:100%`/`height:100%`, coins arrondis et ombre retirés.
3. PO : trop plat — garder l'allure "onglet" (coins arrondis + ombre) tout en couvrant la même zone que le hero → coins arrondis (20px) et ombre remis, taille/position de l'étape 2 conservées (plein écran, pas de voile).
4. PO fournit la maquette Figma manquante — node **73:674** ("Layout Modale shop ouvert", le hero AVEC la modale par-dessus, pas seulement le shell vide de 69:260 regardé au premier tour). Elle montre que la modale reste une carte "onglet" avec marges (1331/1440 ≈ 92% large, 865/1024 ≈ 84.5% haut, coins arrondis **34px** — valeur différente du shell vide), et que l'effet "recouvre le hero" vient d'ailleurs : un voile léger sur tout le cadre nav comprise (`rgba(0,0,0,0.14)`, pas 0.25) **et** le hero qui s'estompe derrière (image à 80% d'opacité + fond blanc à 70%).

État final (fidèle à 73:674) : `.shop-sheet-overlay` = voile `rgba(0,0,0,0.14)` plein écran (nav comprise, overlay simple `inset:0`, plus d'alignement JS sur la nav — abandonné, l'estompage fait le travail). `.shop-sheet` = carte `min(1331px,92.4vw)` × `min(865px,84.5vh)`, coins 34px (20px en mobile <700px), ombre inchangée. Nouvelle classe `body.shop-sheet-open` (posée/retirée par `openShopSheet()`/`closeShopSheet()`) qui estompe `.ac-hero`/`.ac-hero__frame` (`pages/accueil.css`) quand la page en a un — no-op sur les pages sans hero. Scroll du body verrouillé pendant que la modale est ouverte. Testé : hub, formulaire de commande — dimensions/rayon confirmés par `getComputedStyle`, classe `shop-sheet-open` et scroll correctement retirés à la fermeture.

**Pas encore tranché :**
- Largeur/hauteur mobile (100% de largeur) et rayon 20px posés par interprétation du desktop Figma (aucune maquette mobile fournie) — à valider.
- Popups légers (`<popup-panel>`) et lightbox restent sur leur shell actuel — à reconsidérer séparément si besoin, pas dans ce tour.

**Bandeau triptyque en bas de page — supprimé (2026-10-04, même jour) :** demande du PO. `triptyqueUpdateBar()` (`js/triptyque.js`), son appel dans `triptyqueSave()`/`DOMContentLoaded`, le pont `window.triptyqueUpdateBar`, l'appel depuis `js/app.js` (`mountHeader()`) et le CSS mort (`#triptyque-page-bar*`, `triptyque.css`) retirés entièrement — pas juste caché. L'accès au panier reste uniquement le badge du bouton Shop (nav), qui continue de se synchroniser normalement. Testé : ajout d'une photo (via `toggleTriptyquePhoto`, le vrai flux) — badge mis à jour, aucun bandeau n'apparaît.

**CTA "Commander un tirage" (section boutique) raccordé à la modale shop (2026-10-04, même jour) :** incohérence relevée par le PO — ce bouton (3 `<shop-card>` sur `index.html`) ouvrait encore l'ancienne modale "Impression" (`<popup-panel id="printSeriesModal">`, via l'attribut `print-btn`), partagée avec "Imprimer une série" (spotlight) — pas la nouvelle modale shop comme les autres CTA "Commander" du site. Nouvel attribut `shop-modal-btn` sur `<shop-card>` (`js/components/shop-card.js`) qui ouvre `window.openShopModal()` au clic, remplace `print-btn` sur les 3 cartes boutique (`index.html`). "Imprimer une série" (spotlight) n'est pas touché, continue d'utiliser `data-role="print-btn"` → `printSeriesModal`. Testé : clic sur "Commander un tirage" → modale shop (hub) ; clic sur "Imprimer une série" → toujours le popup Impression.

---

## Panier triptyque retiré — simplification MVP (2026-10-05)

**Decision :** simplifier le shop au maximum pour un MVP — un visiteur peut demander l'impression d'une photo par courriel, le reste est mis de côté pour l'instant.

**Context :** le panier triptyque (3 photos, cœur, badge "Shop" de la nav) et le hub boutique ("Modale boutique unifiée" ci-dessus, 2026-09-24/2026-10-04) étaient une impasse — l'écran final du panier disait littéralement "formats et tarifs à venir, revenez bientôt", aucune commande n'y était réellement envoyée.

**Problem :** demander à un visiteur de constituer un panier de 3 photos, puis lui dire que rien n'est encore vendable, ajoute de la friction et de la confusion sans bénéfice — alors qu'un vrai parcours de commande par photo existait déjà et fonctionnait (formulaire 3 étapes → courriel via l'API WordPress, `js/modal.js:orderPrint`/`sendOrderEmail`).

**Options considered :**
1. Réduire aussi le formulaire de commande existant (3 étapes format/papier/coordonnées) à un simple champ message.
2. Garder le formulaire tel quel, retirer seulement le panier/hub et rebrancher tous les CTA "Commander" dessus directement.

**Decision :** option 2 — question de cadrage au PO, confirmée.

**Reason :** le formulaire 3 étapes fonctionne déjà et transmet une information utile (format, papier) au photographe ; la friction venait du panier/hub, pas du formulaire.

**Consequences :**
- Retirés entièrement : `js/triptyque.js` (panier, hub, mode "unique" intermédiaire), le bouton cœur/wishlist et `toggleTriptyquePhoto` (`js/modal.js`), le badge `#triptyque-badge` et le bouton Shop (`js/components/nav.js`), `assets/styles/components/triptyque.css`.
- Chaque CTA "Commander" (photothèque, hero accueil, spotlight série, cartes boutique `#shop`) appelle désormais directement `window.orderPrint(title, url, photoId)` — plus d'étape intermédiaire "hub"/"impression unique". `window.openShopModal()` n'existe plus.
- CTA génériques sans photo précise restants (aucun après ce changement — même les cartes `#shop`, qui affichent une vraie photo de collection via `home-sections.js:renderShopMedia`, sont maintenant contextualisées).
- `.shop-sheet` (shell de modale, voir section précédente) ne sert plus que le formulaire de commande.
- Testé en direct dans le navigateur avec données réelles (photothèque, hero accueil, cartes boutique) : flux complet jusqu'à soumission réelle validée (courriel reçu via l'endpoint WordPress de production).