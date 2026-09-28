import { escapeHtml } from '../utils.js';
import { fetchGalleryPhotos, fetchVisibilityConfig } from '../api.js';

// Vignette "série" (.series-card) partagée entre l'accueil (triptyque des
// séries mises en avant) et /series.html (liste complète des séries admin).

export function photoUrl(photo) {
    return photo?.full_size || photo?.url || photo?.thumbnail || '';
}

export function flattenCollections(nodes, acc = []) {
    for (const n of nodes || []) {
        if (n.type === 'folder') {
            flattenCollections(n.children, acc);
        } else if (n.id != null) {
            acc.push(n);
        }
    }
    return acc;
}

// Une saga = un dossier (folder) de la hiérarchie. Recherche récursive par id
// (les dossiers peuvent être imbriqués, ex. Tango > FITM).
export function findFolderById(nodes, folderId) {
    for (const n of nodes || []) {
        if (n.type === 'folder') {
            if (String(n.id) === String(folderId)) return n;
            const found = findFolderById(n.children, folderId);
            if (found) return found;
        }
    }
    return null;
}

export async function getSiteConfig() {
    try {
        return await fetchVisibilityConfig();
    } catch (err) {
        console.error('Erreur chargement config séries', err);
        return {};
    }
}

export async function getSeriesContent() {
    try {
        const resp = await fetch('./series-save.php');
        return resp.ok ? await resp.json() : {};
    } catch (err) {
        console.error('Erreur chargement contenu séries', err);
        return {};
    }
}

export async function getSagaContent() {
    try {
        const resp = await fetch('./saga-save.php');
        return resp.ok ? await resp.json() : {};
    } catch (err) {
        console.error('Erreur chargement contenu sagas', err);
        return {};
    }
}

// Collections qui composent une saga : celles du dossier associé (si elle en
// a un) + celles rattachées à la main depuis l'admin (cfg.collection_saga),
// additif dans les deux cas — une saga peut être "vierge" (sans dossier),
// voir project_content_model (Option B).
export function getSagaDescendants(hierarchy, collections, cfg, sagaId) {
    const folder = findFolderById(hierarchy, sagaId);
    const folderDescendants = folder ? flattenCollections(folder.children) : [];
    const manualDescendants = collections.filter(c =>
        cfg.collection_saga && String(cfg.collection_saga[c.id]) === String(sagaId)
    );
    const descendantsById = new Map();
    [...folderDescendants, ...manualDescendants].forEach(c => descendantsById.set(String(c.id), c));
    return { folder, descendants: Array.from(descendantsById.values()) };
}

export async function buildSeriesCards(picks, seriesContent) {
    return Promise.all(picks.map(async (c, i) => {
        let cover = '';
        try {
            const photos = await fetchGalleryPhotos(c.id);
            cover = photoUrl(photos[0]);
        } catch (err) {
            console.error('Erreur chargement série', c.name, err);
        }
        const fields = seriesContent[String(c.id)] || {};
        return { id: c.id, name: c.name, count: c.count, index: i + 1, cover, periode: fields.periode || '' };
    }));
}

// Cartes squelettes affichées immédiatement (avant même le fetch), pour que
// le shimmer remplace le vide plutôt que d'apparaître seulement une fois les
// vraies cartes injectées.
export function renderSkeletonCards(grid, count) {
    grid.innerHTML = Array.from({ length: count }, () =>
        `<div class="series-card shimmer" aria-hidden="true"></div>`
    ).join('');
}

// Icône "cercle" — Figma vDYe0oWfzs4InGstvpCxBk, node I42:118;1045:5381
// (asset 5d4cc10e-b076-4c95-8398-5b04b83f9786.svg), reproduite à l'identique.
export const CIRCLE_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>';

export function seriesCardHTML(c, { flex, large } = {}) {
    const style = flex ? ` style="flex:${flex};"` : '';
    const cardClass = large ? 'series-card series-card--lg' : 'series-card';
    const shimmerClass = c.cover ? ' shimmer' : '';
    const meta = `${c.periode ? `${escapeHtml(c.periode)} — ` : ''}${escapeHtml(String(c.count || 0))} image${Number(c.count) > 1 ? 's' : ''}`;
    return `
        <a href="/serie.html?id=${c.id}" class="${cardClass}"${style}>
            <div class="series-card__image${shimmerClass}">
                ${c.cover ? `<img src="${escapeHtml(c.cover)}" alt="${escapeHtml(c.name)}" loading="lazy" onload="this.parentElement.classList.remove('shimmer')">` : ''}
            </div>
            <div class="series-card__gradient"></div>
            <span class="series-card__badge py-2 px-3">${String(c.index).padStart(2, '0')}</span>
            <div class="series-card__content p-8">
                <p class="series-card__meta m-0">${meta}</p>
                <h3 class="series-card__title mt-2">${escapeHtml(c.name)}</h3>
                <span class="btn-soft series-card__cta gap-2 py-0 pr-4 pl-6 mt-5">
                    Voir la série
                    ${CIRCLE_ICON}
                </span>
            </div>
        </a>
    `;
}

// Toutes les sagas actives (config.saga[id] === true) — dossiers réels +
// sagas éditoriales "vierges" (sans dossier, Option B — project_content_model).
// Miroir de getAllSagaEntries() dans admin.html, source de vérité du modèle.
export function getAllSagaIds(cfg) {
    return Object.keys(cfg.saga || {}).filter(id => cfg.saga[id]);
}

// Nom d'affichage d'une saga : celui du dossier réel s'il en a un, sinon le
// champ éditorial saisi en admin pour une saga "vierge" (sagaContent[id].nom).
export function getSagaName(hierarchy, sagaContentData, sagaId) {
    const folder = findFolderById(hierarchy, sagaId);
    const content = sagaContentData[String(sagaId)] || {};
    return folder?.name || content.nom || 'Saga';
}
