import { el, escapeHtml } from './utils.js';
import { fetchHierarchy, fetchGalleryPhotos } from './api.js';
import { flattenCollections, getSiteConfig, getSeriesContent, photoUrl, CIRCLE_ICON } from './components/series-cards.js';
import { openLightbox, setCurrentPhotos } from './modal.js';

// Page /serie.html?id=<collectionId> — détail éditorial d'une série.
// Figma vDYe0oWfzs4InGstvpCxBk, node 38:73.

function getRequestedId() {
    return new URLSearchParams(location.search).get('id');
}

// N'écrase jamais <main> en entier : le point de montage de la nav vit à
// l'intérieur du hero (nécessaire pour son positionnement en superposition),
// donc un innerHTML global la ferait disparaître avec le reste.
function showError(message) {
    const banner = el('serieError');
    banner.textContent = message;
    banner.style.display = 'block';
}

function renderHero(collection, cover, fields) {
    const frame = el('serieHeroFrame');
    const img = el('serieHeroImg');
    const eyebrow = el('serieHeroEyebrow');
    const title = el('serieHeroTitle');

    eyebrow.textContent = fields.periode ? `Série — ${fields.periode}` : 'Série';
    title.textContent = collection.name;

    if (cover) {
        img.onload = () => {
            img.classList.add('is-loaded');
            frame.classList.remove('shimmer');
        };
        img.src = cover;
        img.alt = collection.name;
    }
}

function renderIntention(collection, fields) {
    el('serieIntentionHeading').textContent = collection.name;

    const body = el('serieIntentionBody');
    if (fields.description) {
        body.innerHTML = `<p class="m-0">${escapeHtml(fields.description)}</p>`;
    } else {
        body.innerHTML = `<p class="ac-placeholder m-0">[Note d'intention à écrire depuis l'admin]</p>`;
    }

    const rows = [];
    if (fields.format) rows.push(['Format', fields.format]);
    if (fields.periode) rows.push(['Période', fields.periode]);

    const table = el('serieMetaTable');
    if (rows.length === 0) {
        table.innerHTML = `<p class="ac-placeholder">[Fiche technique à compléter depuis l'admin]</p>`;
    } else {
        table.innerHTML = rows.map(([label, value]) => `
            <div class="serie-meta-row gap-4 py-3">
                <dt class="m-0">${escapeHtml(label)}</dt>
                <dd class="m-0">${escapeHtml(value)}</dd>
            </div>
        `).join('');
    }
}

function renderShop(collection) {
    el('serieShopTitle').textContent = `Posséder un tirage de la série « ${collection.name} »`;
}

function galleryItemHTML(photo, index, extraClass = '') {
    const src = photoUrl(photo);
    const title = photo.title || photo.post_title || photo.name || '';
    return `
        <a href="#" class="serie-gallery__item shimmer${extraClass ? ` ${extraClass}` : ''}" data-photo-index="${index}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" onload="this.closest('.serie-gallery__item').classList.remove('shimmer')">
        </a>
    `;
}

function renderGallery(photos) {
    const section = el('serieGallery');
    const caption = el('serieGalleryCaption');
    const rows = el('serieGalleryRows');
    if (!photos.length) {
        section.style.display = 'none';
        return;
    }

    const shown = photos.slice(0, 6);
    caption.textContent = `Œuvres sélectionnées (${shown.length} sur ${photos.length})`;

    const [p0, p1, p2, p3, p4, p5] = shown;
    let html = '';

    if (p0) html += `<div class="serie-gallery__full">${galleryItemHTML(p0, 0)}</div>`;

    if (p1 || p2) {
        html += `<div class="serie-gallery__pair gap-6">
            ${p1 ? galleryItemHTML(p1, 1) : ''}
            ${p2 ? galleryItemHTML(p2, 2) : ''}
        </div>`;
    }

    if (p3) {
        const rawTitle = p3.title || p3.post_title || p3.name || '';
        // Beaucoup de photos n'ont pas de titre éditorial dans Lightroom : WP
        // retombe alors sur le nom de fichier (ex. "IMG_4531.jpg"), pas
        // présentable comme légende. On ne l'affiche que si ça ressemble à un
        // vrai titre.
        const title = /\.(jpe?g|png|gif|heic|tiff?|webp)$/i.test(rawTitle) ? '' : rawTitle;
        html += `<div class="serie-gallery__spotlight gap-6">
            ${galleryItemHTML(p3, 3)}
            <div class="serie-gallery__spotlight-text gap-4">
                ${title ? `<h3 class="serie-gallery__spotlight-title m-0">${escapeHtml(title)}</h3>` : ''}
                <button type="button" class="btn-soft gap-2 py-0 pr-4 pl-6" data-order-photo-index="3">
                    Commander
                    ${CIRCLE_ICON}
                </button>
            </div>
        </div>`;
    }

    if (p4 || p5) {
        html += `<div class="serie-gallery__asymmetric gap-6">
            ${p4 ? galleryItemHTML(p4, 4) : ''}
            ${p5 ? galleryItemHTML(p5, 5) : ''}
        </div>`;
    }

    rows.innerHTML = html;

    setCurrentPhotos(photos);
    rows.querySelectorAll('[data-photo-index]').forEach(node => {
        node.addEventListener('click', (e) => {
            e.preventDefault();
            const index = Number(node.dataset.photoIndex);
            const photo = photos[index];
            openLightbox(photoUrl(photo), photo.title || photo.name || '', index);
        });
    });

    // "Commander" sur la photo spotlight (remplace "Voir en grand" — demande
    // PO du 2026-09-24) : ouvre directement le formulaire de commande par
    // courriel (orderPrint, js/modal.js), contextualisé à cette photo précise.
    rows.querySelectorAll('[data-order-photo-index]').forEach(node => {
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = Number(node.dataset.orderPhotoIndex);
            const photo = photos[index];
            window.orderPrint(photo.title || photo.name || '', photoUrl(photo), photo.id);
        });
    });
}

async function renderNextSeries(cfg, collections, currentId) {
    const seriesIds = Object.keys(cfg.series || {}).filter(id => cfg.series[id]);
    if (seriesIds.length < 2) {
        el('serieNext').style.display = 'none';
        return;
    }

    const currentIndex = seriesIds.indexOf(String(currentId));
    const nextId = seriesIds[(currentIndex + 1) % seriesIds.length];
    const next = collections.find(c => String(c.id) === String(nextId));
    if (!next) {
        el('serieNext').style.display = 'none';
        return;
    }

    el('serieNextTitle').textContent = next.name;
    el('serieNextLink').href = `/serie.html?id=${next.id}`;

    const cover = el('serieNextCover');
    cover.href = `/serie.html?id=${next.id}`;
    try {
        const photos = await fetchGalleryPhotos(next.id);
        const src = photoUrl(photos[0]);
        if (src) {
            const img = cover.querySelector('img');
            img.src = src;
            img.alt = next.name;
        }
    } catch (err) {
        console.error('Erreur chargement aperçu série suivante', err);
    }
}

async function init() {
    const id = getRequestedId();
    if (!id) {
        showError('Aucune série spécifiée (paramètre ?id= manquant).');
        return;
    }

    try {
        const [hierarchy, cfg, seriesContent] = await Promise.all([
            fetchHierarchy(),
            getSiteConfig(),
            getSeriesContent(),
        ]);

        const collections = flattenCollections(hierarchy);
        const collection = collections.find(c => String(c.id) === String(id));
        if (!collection) {
            showError('Série introuvable.');
            return;
        }

        const fields = seriesContent[String(id)] || {};
        document.title = `${collection.name} — Stéphane Wagner`;

        const photos = await fetchGalleryPhotos(id);
        renderHero(collection, photoUrl(photos[0]), fields);
        renderIntention(collection, fields);
        renderGallery(photos);
        renderShop(collection);
        renderNextSeries(cfg, collections, id);
    } catch (err) {
        console.error('Erreur chargement page série', err);
        showError(`Erreur : ${err.message}`);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
