/**
 * Popup "Achat rapide 5$" — V0 : lien PayPal manuel (même bouton hébergé pour
 * toutes les photos), livraison du fichier par courriel sous 24-48h, pas
 * d'automatisation de paiement. Composant partagé (accueil + photothèque) —
 * avant le 2026-11-12 ce markup n'existait qu'en dur dans index.html.
 *
 * Utilisation : mount.replaceWith(createQuickBuyPopup()), puis
 * window.openQuickBuy(title) pour ouvrir la popup avec le titre de la photo.
 *
 * @returns {HTMLElement}
 */
export function createQuickBuyPopup() {
  const popup = document.createElement('popup-panel');
  popup.id = 'quickBuyPopup';
  popup.className = 'ac-popup p-5';
  popup.style.display = 'none';
  popup.innerHTML = `
    <p class="ac-eyebrow m-0">Achat rapide</p>
    <p class="ac-popup__title m-0 mt-5">Acheter « <span id="quickBuyPhotoTitle">cette photographie</span> » — 5$</p>
    <p class="ac-popup__text m-0 mt-3">Fichier numérique haute résolution, usage personnel. Indique le titre de la photo dans la note de paiement PayPal — tu recevras le fichier par courriel sous 24 à 48h.</p>
    <a id="quickBuyPaypalLink" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PEW354Z63SR6L" target="_blank" rel="noopener" class="btn-primary ac-popup__submit gap-2 py-4 px-8 mt-7">Payer avec PayPal</a>
  `;
  return popup;
}

export function openQuickBuy(title) {
  const titleEl = document.getElementById('quickBuyPhotoTitle');
  if (titleEl) titleEl.textContent = title || 'cette photographie';
  document.getElementById('quickBuyPopup')?.open();
}
