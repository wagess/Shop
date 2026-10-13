const WP_BASE   = 'https://www.photographie.stephanewagner.com';
const IS_LOCAL  = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)
                || location.hostname.endsWith('.local')
                || location.port === '8888';
const PROXY     = '/proxy.php?path=';

const API_BASE   = IS_LOCAL ? null : `${WP_BASE}/wp-json/wplr/v1`;
const IPTC_API   = IS_LOCAL ? null : `${WP_BASE}/wp-json/wplr-iptc/v1`;
const BEARER_TOKEN = 'EDNusnA0Q8TW';

function apiUrl(path) {
    return IS_LOCAL
        ? `${PROXY}${encodeURIComponent(path)}`
        : `${WP_BASE}${path}`;
}

// Limite de concurrence vers l'API WordPress distante — hébergement mutualisé
// qui ne tient qu'un tout petit nombre de workers PHP en même temps (mesuré
// le 2026-10-12 : 8 appels en parallèle passent de 0,5s à 5s chacun, mis en
// file d'attente par paquets de ~2 côté serveur). Le code appelant envoie
// ses requêtes en Promise.all (thumbnails.js, home-sections.js, etc.) sans
// se soucier de la concurrence réelle du serveur ; cette file d'attente le
// fait à sa place, au seul point de passage commun (apiFetch), sans toucher
// aux appelants.
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const pendingQueue = [];

function runQueued(task) {
    return new Promise((resolve, reject) => {
        const run = () => {
            activeRequests++;
            task().then(resolve, reject).finally(() => {
                activeRequests--;
                pendingQueue.shift()?.();
            });
        };
        if (activeRequests < MAX_CONCURRENT_REQUESTS) run();
        else pendingQueue.push(run);
    });
}

function apiFetch(path, options = {}) {
    const url = apiUrl(path);
    if (!IS_LOCAL) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${BEARER_TOKEN}` };
    }
    return runQueued(() => fetch(url, options));
}

export { API_BASE, IPTC_API, BEARER_TOKEN };

// Caches en mémoire (durée de vie = la page) — évitent de refaire les mêmes
// appels distants quand plusieurs modules (app.js, home-sections.js,
// series-page.js…) ont besoin des mêmes données sur une même page.
let _hierarchyPromise = null;
const _galleryPhotosCache = new Map();
let _visibilityConfigPromise = null;

export function fetchHierarchy() {
    if (!_hierarchyPromise) {
        _hierarchyPromise = (async () => {
            const resp = await apiFetch('/wp-json/wplr/v1/hierarchy');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        })().catch(err => { _hierarchyPromise = null; throw err; });
    }
    return _hierarchyPromise;
}

export function fetchGalleryPhotos(galleryId) {
    const key = String(galleryId);
    if (!_galleryPhotosCache.has(key)) {
        const promise = (async () => {
            const resp = await apiFetch(`/wp-json/wplr/v1/gallery/${galleryId}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        })().catch(err => { _galleryPhotosCache.delete(key); throw err; });
        _galleryPhotosCache.set(key, promise);
    }
    return _galleryPhotosCache.get(key);
}

// collections-visibility.json — config admin (séries mises en avant,
// vedettes, visibilité) : un seul fetch partagé par toute la page.
export function fetchVisibilityConfig() {
    if (!_visibilityConfigPromise) {
        _visibilityConfigPromise = fetch('./collections-visibility.json', { cache: 'no-store' })
            .then(resp => resp.ok ? resp.json() : {})
            .catch(err => { _visibilityConfigPromise = null; throw err; });
    }
    return _visibilityConfigPromise;
}

export async function sendOrderEmail(data) {
    const resp = await apiFetch('/wp-json/wplr-iptc/v1/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json.message || `HTTP ${resp.status}`);
    return json;
}

export async function fetchPhotoKeywords(photoId) {
    const resp = await apiFetch(`/wp-json/wplr-iptc/v1/media/${photoId}/keywords?profile=aiptc`);
    if (!resp.ok) return null;
    return await resp.json();
}