# Audit design — Visuel & UX parcours d'achat

**Date :** 2026-08-28
**Périmètre :** Design visuel + UX parcours d'achat
**Phase produit :** Exploration / cadrage

---

## 1. Système visuel existant

### Ce qui est en place

* Design system Sigma appliqué via `docs/tokens.css` — source de vérité
* Police : **General Sans Variable** (corps) + Rock Salt (titres décoratifs) + Georgia (histoires)
* Couleur accent : **#57ad9d** (vert teal) — utilisée systématiquement : boutons, badges, sélection, feedback
* Tailles de boutons standardisées : 56px (primaire), 48px, 40px
* Espacements : base 15px, système 5 / 15 / 20 / 40px
* Transitions cohérentes : 0.2s–0.3s ease sur tous les composants
* Mode sombre omniprésent (fond #1a1a1a / #1f1f1f)

### Ce qui manque

* Aucune définition formelle de la typographie (échelle, graisse, rythme)
* Palette de couleurs incomplète — accent défini, mais couleurs secondaires implicites
* Pas de grille documentée
* Aucun composant photographique défini (ratio images, traitement bords, ombre)

---

## 2. Parcours d'achat — état actuel

### Points d'entrée

* Bouton **"Commander un tirage"** sur chaque vignette en grille
* Bouton **"Commander un tirage"** sur l'image aléatoire en accueil — caché par défaut, affiché par JS après chargement

### Flux actuel (3 étapes dans une modale)

```
Découverte photo
    ↓
[Commander un tirage]
    ↓
Modale — Étape 1 : Format & finition
    Orientation (Paysage / Portrait)
    Taille (Petit 20×30 / Moyen 40×60 / Grand 60×90)
    Finition (Brillant / Mat / Fine Art)
    ↓
Modale — Étape 2 : Formulaire
    Nom* / Email* / Téléphone / Message
    ↓
Modale — Étape 3 : Confirmation
    "Commande envoyée !" + nom client
```

### Ce qui fonctionne

* Progression visuelle (dots + panels) — claire et fluide
* Sélections par défaut cohérentes (Paysage / Moyen / Mat)
* Bottom action bar sticky — bien positionnée, labels lisibles
* Aperçu de la photo (60×60px) visible pendant toute la commande
* Feedback succès / erreur avec couleurs appropriées
* Animations de transition entre étapes fluides

---

## 3. Problèmes identifiés

### Visuels

| Observation | Type | Localisation |
|---|---|---|
| Header inline dans `phototheque.html` vs composant dynamique dans `index.html` | Incohérence | `phototheque.html` |
| Footer newsletter en styles inline dans `index.html` | Incohérence | `index.html:109-128` |
| Terminologie inconsistante : "Courriel" vs "Email" | Incohérence UX Writing | Formulaires newsletter |
| Tonalités différentes : "Avant de partir" (popup) vs "Recevez mes photos" (footer) | Incohérence éditoriale | Acquisition newsletter |
| Admin.html visuellement déconnecté du reste | Incohérence | `admin.html` |

### UX parcours d'achat

| Observation | Type | Impact |
|---|---|---|
| Aucune validation côté client sur le formulaire (email, nom) | Manque | Risque d'envoi de données incorrectes |
| Bouton "Commander" caché sur l'image d'accueil — non visible au premier regard | Découvrabilité | Faible exposition du CTA principal |
| Pas d'indication de prix à aucune étape du parcours | Manque critique | Friction à l'achat |
| Aucun récapitulatif de la commande avant envoi | Manque | Risque d'erreur non corrigeable |
| Étape 3 (confirmation) : pas de suite proposée (continuer à explorer, partager…) | Fin de parcours orpheline | Perte d'opportunité |
| Format et finition : aucun guide visuel (exemple de rendu Brillant vs Mat) | Aide à la décision absente | Friction |

### Expérience globale

| Observation | Type |
|---|---|
| Triptyque localStorage réinitialisé à chaque chargement de page | Comportement potentiellement involontaire |
| Pas de skeleton loader pendant le fetch des collections | Expérience de chargement non traitée |
| Navigation mobile : burger menu affiché mais comportement non audité | À vérifier |
| Z-index croissants (1000 / 2000 / 3000) — pas de problème actuel mais fragile | Dette technique légère |

---

## 4. Hypothèses à valider

Ces observations sont des **hypothèses**, pas des conclusions établies.

* Le manque de prix visible est peut-être intentionnel (modèle sur-mesure / devis) — à clarifier
* La réinitialisation du triptyque au chargement peut être un choix délibéré — à confirmer
* L'absence de validation front peut être compensée côté serveur — à vérifier

---

## 5. Opportunités

Listées ici comme pistes, pas comme décisions.

* Afficher une **indication de prix** dès l'étape 1 (ou une fourchette)
* Ajouter un **récapitulatif** avant envoi de la commande (étape 2.5 ou résumé dans l'étape 2)
* Proposer une **suite** après confirmation : "Continuer à explorer", "Partager"
* Ajouter des **exemples visuels** de finitions (petite vignette Brillant / Mat / Fine Art)
* Unifier le header et le footer en composants partagés sur toutes les pages
* Définir une **proposition de valeur** visible avant le CTA (pourquoi acheter un tirage ici)

---

## 6. Prochaine étape suggérée

Avant de modifier quoi que ce soit :

> **Clarifier le modèle commercial.** Le parcours d'achat actuel est un formulaire de contact déguisé. Il manque : prix, délais, conditions. Ces éléments doivent être définis avant de repenser l'UX.

Question clé : *Quel est le vrai produit — une commande en ligne ou une prise de contact pour une commande sur-mesure ?*
