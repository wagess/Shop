/**
 * <spotlight-saga> — bloc "Saga en vedette" (Figma vDYe0oWfzs4InGstvpCxBk,
 * node 49:501/49:530). Structure ET logique de rendu vivent ici, dans un
 * seul composant réutilisé par 2 pages :
 * - l'accueil (home-sections.js `renderSpotlights`) : 2 emplacements fixes,
 *   remplis avec les sagas mises en vedette (config.featured_sagas) ;
 * - /sagas.html (sagas-page.js) : un bloc par saga active (config.saga),
 *   toutes, pas seulement les vedettes.
 * Les deux pages appellent le même `renderSpotlight(hierarchy, collections,
 * cfg, sectionEl, sagaId, sagaContentData)` exporté ci-dessous — pas de
 * logique de rendu dupliquée entre les deux (2026-09-23, suite à la demande
 * explicite du PO de vérifier la réutilisation d'un composant unique).
 */
import { escapeHtml, el } from '../utils.js';
import { fetchGalleryPhotos } from '../api.js';
import { getSagaDescendants, photoUrl } from './series-cards.js';

const TEMPLATE = `
  <div class="ac-spotlight__grid gap-10 lg:gap-15">
    <div class="ac-spotlight__content">
      <div class="ac-spotlight__eyebrow-row gap-2">
        <p class="ac-eyebrow m-0">Saga en vedette</p>
        <span class="ac-spotlight__dot" data-role="dot" aria-hidden="true">
          <span class="ac-spotlight__dot-secondary"></span>
          <span class="ac-spotlight__dot-primary"></span>
        </span>
      </div>
      <h2 class="ac-spotlight__title m-0 mt-3" data-role="title">—</h2>
      <p class="ac-spotlight__desc m-0 mt-6" data-role="description"></p>
      <p class="ac-spotlight__note m-0 mt-4" data-role="note"></p>
      <dl class="ac-spotlight__meta mt-6 pt-4 gap-3">
        <div class="ac-spotlight__meta-row"><dt class="m-0">Format</dt><dd class="ac-placeholder m-0" data-role="meta-format">[à compléter]</dd></div>
        <div class="ac-spotlight__meta-row"><dt class="m-0">Période</dt><dd class="ac-placeholder m-0" data-role="meta-periode">[à compléter]</dd></div>
        <div class="ac-spotlight__meta-row"><dt class="m-0">Lieu</dt><dd class="ac-placeholder m-0" data-role="meta-lieu">[à compléter]</dd></div>
      </dl>
      <div class="ac-spotlight__actions gap-2 mt-6">
        <a href="/series.html" data-role="link" class="btn-soft gap-2 py-0 pr-4 pl-6">
          <span>Voir les séries</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 6.875C8.27415 6.875 6.87504 8.27411 6.87504 10C6.87504 11.7259 8.27415 13.125 10 13.125C11.7259 13.125 13.125 11.7259 13.125 10C13.125 8.27411 11.7259 6.875 10 6.875ZM8.12504 10C8.12504 8.96447 8.96451 8.125 10 8.125C11.0356 8.125 11.875 8.96447 11.875 10C11.875 11.0355 11.0356 11.875 10 11.875C8.96451 11.875 8.12504 11.0355 8.12504 10Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10 4.375C7.96005 4.375 6.11662 5.26768 4.67694 6.2781C3.2316 7.29249 2.13755 8.46454 1.58318 9.11262C1.14334 9.62682 1.14334 10.3732 1.58318 10.8874C2.13755 11.5355 3.2316 12.7075 4.67694 13.7219C6.11662 14.7323 7.96005 15.625 10 15.625C12.0399 15.625 13.8834 14.7323 15.3231 13.7219C16.7684 12.7075 17.8625 11.5355 18.4168 10.8874C18.8567 10.3732 18.8567 9.62682 18.4168 9.11262C17.8625 8.46454 16.7684 7.29249 15.3231 6.2781C13.8834 5.26768 12.0399 4.375 10 4.375ZM2.53307 9.92516C3.05026 9.32053 4.06726 8.23314 5.39503 7.30126C6.72845 6.36541 8.32017 5.625 10 5.625C11.6798 5.625 13.2716 6.36541 14.605 7.30126C15.9327 8.23314 16.9497 9.32053 17.4669 9.92515C17.4893 9.95128 17.4967 9.97742 17.4967 10C17.4967 10.0226 17.4893 10.0487 17.4669 10.0748C16.9497 10.6795 15.9327 11.7669 14.605 12.6987C13.2716 13.6346 11.6798 14.375 10 14.375C8.32017 14.375 6.72845 13.6346 5.39503 12.6987C4.06726 11.7669 3.05026 10.6795 2.53307 10.0748C2.51072 10.0487 2.5033 10.0226 2.5033 10C2.5033 9.97742 2.51072 9.95128 2.53307 9.92516Z" fill="currentColor"/></svg>
        </a>
        <button type="button" class="btn-secondary btn-sm gap-2 py-3 px-5" data-role="print-btn">
          <span>Imprimer une série</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.10861 13.7756L13.7753 7.10893C14.0194 6.86485 14.0194 6.46912 13.7753 6.22504C13.5312 5.98097 13.1355 5.98097 12.8914 6.22504L6.22473 12.8917C5.98065 13.1358 5.98065 13.5315 6.22473 13.7756C6.4688 14.0197 6.86453 14.0197 7.10861 13.7756Z" fill="currentColor"/><path d="M7.5 8.33365C7.96024 8.33365 8.33334 7.96056 8.33334 7.50032C8.33334 7.04008 7.96024 6.66699 7.5 6.66699C7.03976 6.66699 6.66667 7.04008 6.66667 7.50032C6.66667 7.96056 7.03976 8.33365 7.5 8.33365Z" fill="currentColor"/><path d="M13.3333 12.5003C13.3333 12.9606 12.9602 13.3337 12.5 13.3337C12.0398 13.3337 11.6667 12.9606 11.6667 12.5003C11.6667 12.0401 12.0398 11.667 12.5 11.667C12.9602 11.667 13.3333 12.0401 13.3333 12.5003Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.8261 1.37416C10.9091 0.164775 9.09095 0.164775 8.17393 1.37416L7.41232 2.37859C7.18488 2.67854 6.81331 2.83245 6.4404 2.78118L5.19162 2.60948C3.68802 2.40274 2.40242 3.68834 2.60916 5.19194L2.78086 6.44071C2.83213 6.81363 2.67822 7.1852 2.37827 7.41264L1.37385 8.17424C0.164457 9.09127 0.164457 10.9094 1.37385 11.8264L2.37827 12.588C2.67822 12.8154 2.83213 13.187 2.78086 13.5599L2.60916 14.8087C2.40242 16.3123 3.68802 17.5979 5.19162 17.3912L6.4404 17.2195C6.81331 17.1682 7.18488 17.3221 7.41232 17.622L8.17393 18.6265C9.09095 19.8359 10.9091 19.8359 11.8261 18.6265L12.5877 17.622C12.8151 17.3221 13.1867 17.1682 13.5596 17.2195L14.8084 17.3912C16.312 17.5979 17.5976 16.3123 17.3908 14.8087L17.2191 13.5599C17.1679 13.187 17.3218 12.8154 17.6217 12.588L18.6262 11.8264C19.8355 10.9094 19.8355 9.09127 18.6262 8.17424L17.6217 7.41264C17.3218 7.1852 17.1679 6.81363 17.2191 6.44071L17.3908 5.19194C17.5976 3.68834 16.312 2.40274 14.8084 2.60948L13.5596 2.78118C13.1867 2.83245 12.8151 2.67854 12.5877 2.37859L11.8261 1.37416ZM9.16997 2.12941C9.5868 1.57969 10.4132 1.57969 10.83 2.12941L11.5916 3.13384C12.092 3.79373 12.9095 4.13233 13.7299 4.01953L14.9786 3.84783C15.6621 3.75386 16.2465 4.33822 16.1525 5.02167L15.9808 6.27045C15.868 7.09087 16.2066 7.90832 16.8665 8.40868L17.8709 9.17029C18.4206 9.58711 18.4206 10.4135 17.8709 10.8304L16.8665 11.592C16.2066 12.0923 15.868 12.9098 15.9808 13.7302L16.1525 14.979C16.2465 15.6624 15.6621 16.2468 14.9786 16.1528L13.7299 15.9811C12.9095 15.8683 12.092 16.2069 11.5916 16.8668L10.83 17.8712C10.4132 18.4209 9.5868 18.4209 9.16997 17.8712L8.40836 16.8668C7.908 16.2069 7.09055 15.8683 6.27013 15.9811L5.02135 16.1528C4.3379 16.2468 3.75354 15.6624 3.84751 14.979L4.01921 13.7302C4.13201 12.9098 3.79341 12.0923 3.13352 11.592L2.1291 10.8304C1.57937 10.4135 1.57937 9.58711 2.1291 9.17029L3.13352 8.40868C3.79341 7.90832 4.13201 7.09087 4.01921 6.27045L3.84751 5.02167C3.75354 4.33822 4.3379 3.75386 5.02135 3.84783L6.27013 4.01953C7.09055 4.13233 7.908 3.79373 8.40836 3.13384L9.16997 2.12941Z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
    <div class="ac-spotlight__media gap-4">
      <div class="ac-spotlight__main shimmer">
        <img data-role="main" alt="">
      </div>
      <div class="ac-spotlight__secondary gap-4">
        <div class="ac-spotlight__secondary-img shimmer"><img data-role="secondary" alt=""></div>
        <div class="ac-spotlight__tag p-5 gap-4">
          <div class="ac-spotlight__avatars" data-role="avatars"></div>
          <div>
            <p class="ac-spotlight__tag-label m-0">Disponible en tirage</p>
            <p class="ac-spotlight__tag-value m-0 mt-1" data-role="count">—</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class SpotlightSaga extends HTMLElement {
    connectedCallback() {
        if (this.dataset.rendered) return;
        this.dataset.rendered = 'true';
        this.innerHTML = TEMPLATE;
    }
}

customElements.define('spotlight-saga', SpotlightSaga);

function fillSpotlightText(el, value, placeholder) {
    if (!el) return;
    const hasValue = !!value;
    el.textContent = hasValue ? value : placeholder;
    el.classList.toggle('ac-placeholder', !hasValue);
}

// Peuple un <spotlight-saga> (déjà dans le DOM, TEMPLATE rendu) pour une
// saga donnée. `sectionEl` doit contenir un [data-role="title"] — sinon (pas
// encore upgradé en custom element) la fonction sort sans rien faire.
export async function renderSpotlight(hierarchy, collections, cfg, sectionEl, sagaId, sagaContentData) {
    const titleEl = sectionEl.querySelector('[data-role="title"]');
    if (!sagaId || !titleEl) {
        sectionEl.style.display = 'none';
        return;
    }

    // Option B (2026-09-21) : une saga peut ne reposer sur aucun dossier réel
    // — une saga "vierge" créée depuis l'admin, purement éditoriale. Dans ce
    // cas folder est null : ce n'est plus une raison de cacher la section,
    // seulement de se passer de la composante "dossier".
    const content = sagaContentData[String(sagaId)] || {};
    const { folder, descendants } = getSagaDescendants(hierarchy, collections, cfg, sagaId);
    const name = folder?.name || content.nom || 'Saga';

    const countEl   = sectionEl.querySelector('[data-role="count"]');
    const mainImg   = sectionEl.querySelector('[data-role="main"]');
    const sec1      = sectionEl.querySelector('[data-role="secondary"]');
    const link      = sectionEl.querySelector('[data-role="link"]');
    const formatEl  = sectionEl.querySelector('[data-role="meta-format"]');
    const periodeEl = sectionEl.querySelector('[data-role="meta-periode"]');
    const lieuEl    = sectionEl.querySelector('[data-role="meta-lieu"]');
    const dotEl     = sectionEl.querySelector('[data-role="dot"]');
    const descEl    = sectionEl.querySelector('[data-role="description"]');
    const noteEl    = sectionEl.querySelector('[data-role="note"]');
    const avatarsEl = sectionEl.querySelector('[data-role="avatars"]');

    // Une saga n'a pas de photos en propre : on agrège les séries/collections
    // qu'elle contient (comptage total + photos de la première pour la vignette),
    // via getSagaDescendants (dossier réel + rattachements manuels additifs).
    if (!folder && descendants.length === 0) {
        // Saga vierge sans aucune collection rattachée : rien à montrer.
        sectionEl.style.display = 'none';
        return;
    }

    titleEl.textContent = name;
    // "Voir les séries" ouvre /series.html filtrée sur cette saga (pas
    // seulement l'album/dossier) — ne montre que les collections marquées
    // "Série" parmi celles qui composent la saga.
    if (link) link.href = `/series.html?saga=${encodeURIComponent(sagaId)}`;

    // Pastille primaire/secondaire — reprend la couleur choisie en admin pour
    // cette saga (config.saga couleur / sagaContent.couleur), neutre sinon.
    if (dotEl) {
        if (content.couleur) dotEl.dataset.color = content.couleur;
        else delete dotEl.dataset.color;
    }

    if (descEl) descEl.textContent = content.description || '';
    if (noteEl) noteEl.textContent = content.note || '';

    fillSpotlightText(formatEl, content.format, '[à compléter]');
    fillSpotlightText(periodeEl, content.periode, '[à compléter]');
    fillSpotlightText(lieuEl, content.lieu, '[à compléter]');

    // "édition limitée" retiré (2026-09-21) : copie reprise telle quelle du
    // mockup Figma sans vérification — aucun système d'édition limitée
    // n'existe réellement sur le site (pas de numérotation, pas de quantité
    // définie par tirage). Seul le compte réel de photos est affiché.
    const totalCount = descendants.reduce((sum, c) => sum + (Number(c.count) || 0), 0);
    if (countEl) countEl.textContent = `${totalCount} image${totalCount > 1 ? 's' : ''}`;

    const firstCollection = descendants[0];
    if (!firstCollection) return;

    try {
        const photos = await fetchGalleryPhotos(firstCollection.id);
        if (mainImg && photos[0]) {
            mainImg.src = photoUrl(photos[0]);
            mainImg.alt = name;
            mainImg.onload = () => mainImg.parentElement.classList.remove('shimmer');
        }
        if (sec1 && photos[1]) {
            sec1.src = photoUrl(photos[1]);
            sec1.alt = name;
            sec1.onload = () => sec1.parentElement.classList.remove('shimmer');
        }
    } catch (err) {
        console.error('Erreur chargement saga en vedette', sagaId, err);
    }

    // Avatars — couvertures réelles des séries/collections qui composent la
    // saga (jusqu'à 3), "+N" pour le reste. Pas d'illustration inventée.
    if (avatarsEl) {
        const avatarSources = descendants.slice(0, 3);
        try {
            const avatarPhotos = await Promise.all(
                avatarSources.map(c => fetchGalleryPhotos(c.id).then(p => photoUrl(p[0])).catch(() => ''))
            );
            const remaining = descendants.length - avatarSources.length;
            avatarsEl.innerHTML = avatarSources
                .map((c, i) => avatarPhotos[i] ? `<div class="ac-spotlight__avatar${i > 0 ? ' -ml-2' : ''}"><img src="${avatarPhotos[i]}" alt="${escapeHtml(c.name || '')}"></div>` : '')
                .join('') + (remaining > 0 ? `<span class="ac-spotlight__avatars-more ml-2">+${remaining}</span>` : '');
        } catch (err) {
            console.error('Erreur chargement avatars saga en vedette', sagaId, err);
        }
    }
}

// Modale "Imprimer une série" partagée par tous les <spotlight-saga>
// ([data-role="print-btn"]) — options pas encore définies (formats/tarifs),
// affiche un message d'attente plutôt qu'un faux parcours d'achat. Délégation
// d'événement sur document car les boutons sont rendus après le chargement
// des données (pas au moment d'un querySelectorAll direct). Nécessite un
// <popup-panel id="printSeriesModal"> présent sur la page hôte.
export function initPrintModal() {
    const modal = el('printSeriesModal');
    if (!modal) return;

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-role="print-btn"]')) modal.open();
    });
}
