import { el, escapeHtml } from './utils.js';
import { fetchHierarchy } from './api.js';
import { flattenCollections, getSiteConfig, getSagaContent, getAllSagaIds, getSagaName } from './components/series-cards.js';
import { renderSpotlight, initPrintModal } from './components/spotlight-saga.js';

// Page /sagas.html : liste de toutes les sagas actives depuis l'admin
// (config.saga) — dossiers réels marqués saga + sagas éditoriales "vierges"
// sans dossier (project_content_model, Option B). Un <spotlight-saga> par
// saga (même composant que la section "Saga en vedette" de l'accueil,
// js/components/spotlight-saga.js — pas de carte/composant dédié recréé) :
// ici toutes les sagas actives s'affichent, pas seulement les 1-2 mises en
// vedette (config.featured_sagas) sur l'accueil.

async function init() {
    const list = el('sagasList');
    if (!list) return;

    initPrintModal();

    try {
        const [hierarchy, cfg, sagaContentData] = await Promise.all([
            fetchHierarchy(),
            getSiteConfig(),
            getSagaContent(),
        ]);

        const collections = flattenCollections(hierarchy);
        const sagaIds = getAllSagaIds(cfg)
            .map(id => ({ id, name: getSagaName(hierarchy, sagaContentData, id) }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .map(({ id }) => id);

        if (sagaIds.length === 0) {
            list.innerHTML = '<p class="ac-placeholder p-6">Aucune saga à afficher pour le moment.</p>';
            return;
        }

        list.innerHTML = sagaIds
            .map(() => '<spotlight-saga class="ac-spotlight py-13 px-6 lg:py-16 lg:px-13"></spotlight-saga>')
            .join('');

        const sections = Array.from(list.querySelectorAll('spotlight-saga'));
        await Promise.all(sections.map((sectionEl, i) =>
            renderSpotlight(hierarchy, collections, cfg, sectionEl, sagaIds[i], sagaContentData)
        ));
    } catch (err) {
        console.error('Erreur chargement page sagas', err);
        list.innerHTML = `<div class="error-message p-5 m-5">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
