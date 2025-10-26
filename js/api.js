const API_BASE = 'https://www.photographie.stephanewagner.com/wp-json/wplr/v1';
const IPTC_API = API_BASE.replace('/wplr/v1', '/wplr-iptc/v1');
const BEARER_TOKEN = 'EDNusnA0Q8TW';

export { API_BASE, IPTC_API, BEARER_TOKEN };

export async function fetchHierarchy() {
    const resp = await fetch(`${API_BASE}/hierarchy`, {
        headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
}

export async function fetchGalleryPhotos(galleryId) {
    const resp = await fetch(`${API_BASE}/gallery/${galleryId}`, {
        headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
}

export async function fetchPhotoKeywords(photoId) {
    const url = `${IPTC_API}/media/${photoId}/keywords?profile=aiptc`;
    const headers = {};
    if (typeof BEARER_TOKEN === 'string' && BEARER_TOKEN.length) {
        headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }
    const resp = await fetch(url, { headers });
    if (!resp.ok) return null;
    return await resp.json();
}