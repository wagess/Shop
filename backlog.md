# Backlog

Tâches concrètes et actionnables — bugs, correctifs, développements à réaliser.

---

## Bugs — Haute priorité

**Aucune authentification serveur réelle sur les endpoints d'écriture (audit du 2026-09-28)**
- `admin.html:739` — `PASSWORD = 'sw2024'` codé en clair dans le JS livré au navigateur ; contournable en lisant le code source, n'importe qui peut aussi appeler les endpoints directement sans passer par l'UI.
- `admin-save.php`, `series-save.php`, `saga-save.php` — écrivent `collections-visibility.json`/séries/sagas sans aucune vérification côté serveur (le mot de passe n'est vérifié que côté client) ; en plus `Access-Control-Allow-Origin: *` permet à n'importe quel site externe de déclencher l'appel.
- `js/api.js:9` + `admin.html:747` — `BEARER_TOKEN = 'EDNusnA0Q8TW'` codé en dur côté client ; dans `wplr-iptc-keywords.php`, aucune route ne le vérifie (`permission_callback => '__return_true'` partout) — le token ne protège rien.
- Impact : n'importe qui (script, bot, agent automatisé) peut réécrire la config du site à distance, sans avoir besoin de contourner quoi que ce soit.
- Action : ajouter une vérification de secret côté serveur (header comparé à une valeur dans `.env`) sur les 3 `*-save.php` ; restreindre `Access-Control-Allow-Origin` à `shop.stephanewagner.com` ; faire respecter (ou retirer) le Bearer token dans `wplr-iptc-keywords.php` ; faire tourner le mot de passe et le token une fois le vrai contrôle en place (les deux sont publics depuis qu'ils sont dans le code source).

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

## Modale boutique unifiée — wireframe posé, design à préciser

**Ex-"Triptyque narratif — Phase 3" (obsolète)** : décrivait la génération d'histoire IA (endpoint Claude, partage, code promo). Cette mécanique a été explicitement retirée le 2026-09-22 (pivot PO : le triptyque devient un panier de commande, pas un contenu éditorial — voir mémoire `project_triptyque.md`). Ne pas réintroduire sans nouvelle demande explicite.

**Direction actuelle (2026-09-24)** — voir `idees.md` pour le détail complet : Shop (nav) et Commander (Heroes) ouvrent maintenant la même modale (`window.openShopModal()`, `js/triptyque.js`), posée en mode wireframe. Reste à faire :
- [ ] Design final de la modale (actuellement wireframe : shell `.tmodal` réutilisé, panneau droit en bloc pointillé)
- [ ] Trancher : le panier reste-t-il capé à 3 photos ("Triptyque") ou devient-il un panier de taille libre ?
- [ ] Décider si "Commander une impression" par-photo (photothèque) doit aussi être absorbé dans cette modale
- [ ] Contenu réel du panneau illustratif

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
