# Backlog

Tâches concrètes et actionnables — bugs, correctifs, développements à réaliser.

---

## Bugs — Haute priorité

**Token API exposé**
- Fichier : `js/api.js:4`
- `BEARER_TOKEN = 'EDNusnA0Q8TW'` visible côté client
- Action : restreindre les permissions à la lecture seule côté WordPress

**Code de test en production**
- Fichier : `js/app.js:121-123`
- `setTimeout(() => updateImageInfo("Scènes de vie", "Test Image"), 1000)` à supprimer
- Nombreux `console.log` de debug aux lignes 80, 94, 117, 159... à nettoyer

---

## Bugs — Priorité moyenne

**`musique.css` chargé deux fois**
- `index.html:8` via `<link rel="stylesheet">`
- `assets/styles/styles.css:21` via `@import`
- Action : supprimer le `<link>` (garder l'`@import`)

**`styles.css` mélange imports et règles**
- Fichier : `assets/styles/styles.css:24-109`
- Les règles `.search-input-wrapper` sont écrites directement dans le fichier d'import
- Action : déplacer dans `assets/styles/components/search.css`

**Dossier `/styles/` dupliqué à la racine**
- `/styles/stories.css` semble être un doublon de `/stories/stories.css`
- Action : vérifier et supprimer le dossier `/styles/`

---

## Bugs — Priorité basse

**Stories déconnectées de l'API**
- Fichier : `stories/stories.js`
- Données hardcodées avec URLs Unsplash, captions génériques
- Action : connecter à l'API WPLR ou documenter comme WIP

**`wplr-iptc-keywords.php` à la racine**
- Plugin WordPress — appartient à `wp-content/plugins/`
- Action : déplacer vers l'installation WordPress ; garder une copie dans `_wp-plugin/`

---

## Triptyque narratif — Phase 3

- [ ] Endpoint PHP côté serveur (`scripts/generate-story.php`) → appel API Anthropic
- [ ] Génération narrative dans la modale (claude-haiku ou sonnet)
- [ ] Affichage de l'histoire générée + bouton partager
- [ ] Partage Web Share API (copie + natif mobile)
- [ ] Code promo -20% généré côté serveur, lié à l'histoire, envoyé par email

---

## Infolettre Mailchimp

- [ ] Modifier le template `infolettre/index.html` (texte, photo, mise en page)
- [ ] Choisir la photo définitive pour la première vraie infolettre
- [ ] Tester l'envoi final à wagess@gmail.com avant d'envoyer aux 469 abonnés
- [ ] Envoyer à la liste "Photographisme" via `/infolettre`
- [ ] Intégrer `npm install` (dotenv) pour activer le script `scripts/send-newsletter.js`

---

## Shutterstock Contributor API — Bloqué

L'app créée n'a accès qu'aux APIs "Free Images / Computer Vision", pas à l'API Contributeur (earnings, downloads).

**Prochaines actions :**
- [ ] Chercher "Edit permissions" dans la console pour ajouter l'accès contributeur
- [ ] Contacter le support développeur Shutterstock
- [ ] Alternative : importer les rapports CSV mensuels envoyés par email

**Credentials configurés dans `.env` :**
- `client_id` : VF8VbjuPb0ebd7G7PTAwY6vDvci9GAZq
- Callback : `shop.stephanewagner.com/shutterstock-callback`
- Fichiers : `shutterstock/index.html`, `shutterstock-callback/index.php`
