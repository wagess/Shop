# Idées

Pistes à explorer, décisions à prendre, fonctionnalités futures. Ces éléments ne sont pas encore planifiés — ils attendent d'être évalués, priorisés ou abandonnés.

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

## Autres pistes

- le Tryptique devient un panier d'achat sous la forme d'une collection personnalisée
- Proposer un profilage de l'utilisateur à son arrivée sur la page en même temps que l'inscription à l'infolettre
