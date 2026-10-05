import { el, escapeHtml } from './utils.js';
import { fetchHierarchy, fetchGalleryPhotos } from './api.js';
import { flattenCollections, photoUrl } from './components/series-cards.js';

// Prototype /mur.html — exploration d'une présentation "mur de cadres"
// plutôt que la grille habituelle de phototheque.html. Non listé dans la
// nav, accessible uniquement depuis le lien footer (voir idees.md).

const GALLERIES_SAMPLED = 6;
const PHOTOS_PER_GALLERY = 4;
const PHOTOS_MAX = 20;
const FRAME_SIZES = ['mur-frame--s', 'mur-frame--m', 'mur-frame--l'];

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function collectPhotos() {
    const tree = await fetchHierarchy();
    const galleries = shuffle(flattenCollections(tree)).slice(0, GALLERIES_SAMPLED);

    const batches = await Promise.all(
        galleries.map(g => fetchGalleryPhotos(g.id)
            .then(photos => (photos || []).slice(0, PHOTOS_PER_GALLERY).map(p => ({ photo: p, galleryName: g.name })))
            .catch(() => [])
        )
    );

    return shuffle(batches.flat()).slice(0, PHOTOS_MAX);
}

function renderWall(entries) {
    const wall = el('murWall');
    wall.innerHTML = '';

    if (entries.length === 0) {
        wall.innerHTML = '<p class="ac-placeholder">Aucune photo disponible pour accrocher le mur.</p>';
        return;
    }

    entries.forEach(({ photo, galleryName }, i) => {
        const url = photoUrl(photo);
        if (!url) return;

        const frame = document.createElement('button');
        frame.type = 'button';
        frame.className = `mur-frame ${FRAME_SIZES[i % FRAME_SIZES.length]}`;
        frame.innerHTML = `
            <span class="mur-frame__mat">
                <img src="${url}" alt="${escapeHtml(photo.title || galleryName || '')}" loading="lazy">
            </span>
        `;
        frame.addEventListener('click', () => openViewer(url, photo.title || galleryName));
        wall.appendChild(frame);
    });
}

function openViewer(url, caption) {
    const viewer = el('murViewer');
    el('murViewerImg').src = url;
    el('murViewerCaption').textContent = caption || '';
    viewer.hidden = false;
}

function closeViewer() {
    el('murViewer').hidden = true;
}

async function init() {
    el('murViewerClose').addEventListener('click', closeViewer);
    el('murViewer').addEventListener('click', (e) => {
        if (e.target === el('murViewer')) closeViewer();
    });

    try {
        const entries = await collectPhotos();
        renderWall(entries);
    } catch (err) {
        console.error('Erreur de chargement du mur:', err);
        el('murWall').innerHTML = '<p class="ac-placeholder">Impossible de charger les photos pour le moment.</p>';
    }
}

init();
