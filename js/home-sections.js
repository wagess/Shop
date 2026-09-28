import { el } from './utils.js';
import { fetchHierarchy, fetchGalleryPhotos, fetchVisibilityConfig } from './api.js';
import { flattenCollections, getSeriesContent, getSagaContent, buildSeriesCards, seriesCardHTML, renderSkeletonCards, photoUrl } from './components/series-cards.js';
import { renderSpotlight, initPrintModal } from './components/spotlight-saga.js';

// Séries + collections vedettes mises en avant sur l'accueil — gérées depuis admin.html.
async function getSiteConfig() {
    try {
        return await fetchVisibilityConfig();
    } catch (err) {
        console.error('Erreur chargement config accueil', err);
        return {};
    }
}

async function getFeaturedSeriesIds() {
    const cfg = await getSiteConfig();
    const entries = Object.entries(cfg.featured_series || {});
    entries.sort((a, b) => Number(a[1]) - Number(b[1]));
    return entries.map(([id]) => id);
}

async function renderSeriesCards(collections) {
    const grid = el('seriesCardsGrid');
    if (!grid) return;

    const [featuredIds, seriesContent] = await Promise.all([
        getFeaturedSeriesIds(),
        getSeriesContent(),
    ]);

    // Triptyque : les 3 premières séries mises en avant depuis l'admin,
    // ratio 1.5 / 1 / 1 (Figma vDYe0oWfzs4InGstvpCxBk, node 42:111 : 582.43 / 388.28 / 388.29).
    const picks = featuredIds
        .map(id => collections.find(c => String(c.id) === String(id)))
        .filter(Boolean)
        .slice(0, 3);

    if (picks.length === 0) {
        grid.innerHTML = '';
        return;
    }

    const cards = await buildSeriesCards(picks, seriesContent);
    grid.innerHTML = cards.map(c => seriesCardHTML(c, { flex: c.index === 1 ? 1.5 : 1, large: c.index === 1 })).join('');
}

async function renderSpotlights(hierarchy, collections) {
    const sections = document.querySelectorAll('.ac-spotlight[data-spotlight-slot]');
    if (sections.length === 0) return;

    const [cfg, sagaContentData] = await Promise.all([
        getSiteConfig(),
        getSagaContent(),
    ]);

    const orderedSagaIds = Object.entries(cfg.featured_sagas || {})
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .map(([id]) => id);

    await Promise.all(Array.from(sections).map((sectionEl, i) =>
        renderSpotlight(hierarchy, collections, cfg, sectionEl, orderedSagaIds[i], sagaContentData)
    ));
}

async function renderShopMedia() {
    const mediaEls = document.querySelectorAll('[data-shop-media-id]');
    await Promise.all(Array.from(mediaEls).map(async (mediaEl) => {
        const collectionId = mediaEl.dataset.shopMediaId;
        const img = mediaEl.querySelector('img');
        if (!img) return;
        try {
            const photos = await fetchGalleryPhotos(collectionId);
            if (photos[0]) img.src = photoUrl(photos[0]);
        } catch (err) {
            console.error('Erreur chargement photo boutique', collectionId, err);
        }
    }));
}

async function init() {
    const seriesGrid = el('seriesCardsGrid');
    if (seriesGrid) renderSkeletonCards(seriesGrid, 3);

    initPrintModal();

    try {
        const hierarchy = await fetchHierarchy();
        const collections = flattenCollections(hierarchy);
        await Promise.all([
            renderSeriesCards(collections),
            renderSpotlights(hierarchy, collections),
            renderShopMedia(),
        ]);
    } catch (err) {
        if (seriesGrid) seriesGrid.innerHTML = '';
        console.error('Erreur chargement sections accueil', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
