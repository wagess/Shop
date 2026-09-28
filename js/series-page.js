import { el, escapeHtml } from './utils.js';
import { fetchHierarchy } from './api.js';
import { flattenCollections, getSiteConfig, getSeriesContent, getSagaContent, getSagaDescendants, buildSeriesCards, seriesCardHTML, renderSkeletonCards } from './components/series-cards.js';

// Page /series.html : liste de toutes les collections marquées "série" depuis
// l'admin (config.series), à ne pas confondre avec le triptyque de l'accueil
// qui n'affiche que les 3 séries mises en avant (config.featured_series).
//
// Filtrage par saga (2026-09-21) : le bouton "Voir les séries" d'une saga en
// vedette (accueil) pointe vers /series.html?saga={id} — cette page ne montre
// alors que les séries qui composent cette saga (dossier + rattachements
// manuels, voir getSagaDescendants), avec le titre adapté.

function updateHeading(sagaName) {
    const eyebrow = document.querySelector('.ac-series__head .ac-eyebrow');
    const title   = document.querySelector('.ac-series__title');
    if (eyebrow) eyebrow.textContent = 'Séries de la saga';
    if (title) title.textContent = sagaName || 'Séries';

    const head = document.querySelector('.ac-series__head');
    if (head && !head.querySelector('.ac-series__back')) {
        const back = document.createElement('a');
        back.href = '/series.html';
        back.className = 'btn-tertiary ac-series__back gap-2 py-4 px-8';
        back.textContent = '← Toutes les séries';
        head.appendChild(back);
    }
}

async function init() {
    const grid = el('allSeriesGrid');
    if (!grid) return;

    renderSkeletonCards(grid, 4);

    const sagaId = new URLSearchParams(location.search).get('saga');

    try {
        const [hierarchy, cfg, seriesContent] = await Promise.all([
            fetchHierarchy(),
            getSiteConfig(),
            getSeriesContent(),
        ]);

        const collections = flattenCollections(hierarchy);
        let seriesIds = Object.keys(cfg.series || {}).filter(id => cfg.series[id]);

        if (sagaId) {
            const { folder, descendants } = getSagaDescendants(hierarchy, collections, cfg, sagaId);
            const descendantIds = new Set(descendants.map(c => String(c.id)));
            seriesIds = seriesIds.filter(id => descendantIds.has(String(id)));

            const sagaContent = await getSagaContent();
            const sagaName = folder?.name || sagaContent[String(sagaId)]?.nom || '';
            updateHeading(sagaName);
        }

        const picks = seriesIds
            .map(id => collections.find(c => String(c.id) === String(id)))
            .filter(Boolean);

        if (picks.length === 0) {
            grid.innerHTML = sagaId
                ? '<p class="ac-placeholder">Aucune série pour cette saga pour le moment.</p>'
                : '<p class="ac-placeholder">Aucune série à afficher pour le moment.</p>';
            return;
        }

        const cards = await buildSeriesCards(picks, seriesContent);
        grid.innerHTML = cards.map(c => seriesCardHTML(c)).join('');
    } catch (err) {
        console.error('Erreur chargement page séries', err);
        grid.innerHTML = `<div class="error-message p-5 m-5">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
