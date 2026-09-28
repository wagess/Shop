/**
 * PhotosModal — modale plein écran d'affichage d'un album (grille de photos)
 * Composant JS partagé : avant le 2026-09-25, ce markup était dupliqué tel
 * quel dans index.html ET phototheque.html — sur l'accueil, aucun code
 * accessible ne l'ouvrait jamais (openGallery()/#photosGrid ne sont
 * atteints que par des chemins gardés par `hasGalleriesContainer`, vrai
 * uniquement sur phototheque.html), donc c'était du markup mort en plus
 * d'être dupliqué. Extrait en composant pour n'avoir plus qu'une seule
 * copie, montée uniquement là où elle sert réellement.
 *
 * Piloté par js/modal.js via getElementById('photosModal'/'modalTitle'/
 * 'photosGrid'/'closeModalBtn') — mêmes ids qu'avant, aucun changement à
 * modal.js nécessaire.
 *
 * @returns {HTMLElement}
 */
export function createPhotosModal() {
  const modal = document.createElement('div');
  modal.id = 'photosModal';
  modal.className = 'photos-modal';
  modal.innerHTML = `
    <div class="modal-header py-5 px-10 gap-5">
      <button class="close-modal py-3 px-5" id="closeModalBtn">
        <svg class="-mb-1" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L8.41421 10L12.7071 14.2929C13.0976 14.6834 13.0976 15.3166 12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289Z"></path>
        </svg>
      </button>
      <div class="modal-title" id="modalTitle" style="font-size: var(--font-size-large);"></div>
    </div>
    <div id="photosGrid" class="photos-grid gap-5 p-10"></div>
  `;
  return modal;
}
