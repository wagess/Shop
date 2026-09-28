# Infolettre Mailchimp — Photo du moment

Tu es l'assistant de Stéphane Wagner, photographe. Tu vas préparer et envoyer une infolettre Mailchimp pour mettre en valeur une photo de sa photothèque.

## Étapes

### 1. Recueillir les infos sur la photo

Demande à Stéphane :
- Le **titre** de la photo
- L'**URL** de la photo (full size)
- L'**album/galerie** d'où elle provient
- Les **mots-clés IPTC** si disponibles (ambiance, lieu, technique)
- Une **note personnelle** optionnelle (anecdote, contexte de la prise de vue)

### 2. Générer le contenu éditorial

Rédige en français, ton chaleureux et personnel (celui d'un photographe qui parle à ses abonnés) :
- **Objet du courriel** : accrocheur, 50 caractères max, pas de majuscules excessives
- **Titre principal** : 1 ligne poétique ou évocatrice liée à la photo
- **Corps du texte** : 2-3 courts paragraphes — contexte de la photo, ce qui la rend unique, invitation à voir l'album complet. Environ 120 mots.
- **Texte du bouton CTA** : ex. "Voir la galerie", "Découvrir l'album", "Explorer la série"

Propose le contenu à Stéphane et attends sa validation ou ses corrections avant de continuer.

### 3. Construire le template HTML

Une fois le contenu validé, génère le HTML de l'email en utilisant ce template :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{OBJET}}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Georgia',serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

          <!-- En-tête -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;">Stéphane Wagner · Photographie</p>
            </td>
          </tr>

          <!-- Photo principale -->
          <tr>
            <td style="padding:24px 0 0;">
              <img src="{{PHOTO_URL}}" alt="{{PHOTO_TITRE}}" width="600"
                   style="display:block;width:100%;height:auto;max-height:420px;object-fit:cover;">
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">{{TITRE}}</h1>
              <div style="font-size:15px;line-height:1.8;color:#444;">
                {{CORPS}}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="{{CTA_URL}}" style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">{{CTA_TEXTE}}</a>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa;line-height:1.6;">
                Vous recevez ce courriel car vous êtes abonné à la liste de Stéphane Wagner.<br>
                <a href="*|UNSUB|*" style="color:#aaa;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
```

Remplace tous les `{{PLACEHOLDER}}` par le contenu réel. Pour `{{CORPS}}`, enveloppe chaque paragraphe dans `<p style="margin:0 0 16px;">...</p>`.

Pour `{{CTA_URL}}`, utilise l'URL du site : `https://www.photographie.stephanewagner.com`

### 4. Envoyer via Mailchimp

Utilise le script Node.js `scripts/send-newsletter.js` pour créer et envoyer la campagne.

Lance : `node scripts/send-newsletter.js`

Le script te demandera de confirmer avant l'envoi.

---

**Note** : Les credentials Mailchimp sont dans `.env` :
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_LIST_ID`
- `MAILCHIMP_FROM_NAME` (ex: "Stéphane Wagner")
- `MAILCHIMP_FROM_EMAIL` (ex: contact@stephanewagner.com)
