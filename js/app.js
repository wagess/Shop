const API_BASE = 'https://www.photographie.stephanewagner.com/wp-json/wplr/v1';
// use API_BASE to derive the IPTC API host/path so it stays correct in dev/production
const IPTC_API = API_BASE.replace('/wplr/v1', '/wplr-iptc/v1');
const BEARER_TOKEN = 'EDNusnA0Q8TW';

let allGalleries = [];
let hierarchyData = null;

function el(id) {
    const e = document.getElementById(id);
    if (!e) console.warn(`Element introuvable: #${id}`);
    return e;
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJs(str) {
    if (str == null) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

window.onload = () => loadHierarchy();

async function loadHierarchy() {
    const container = el('galleriesContainer');
    if (!container) return;

    try {
        const resp = await fetch(`${API_BASE}/hierarchy`, {
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        hierarchyData = await resp.json();
        const nodes = extractGalleryIds(hierarchyData);
        const collections = nodes.filter(n => n.id != null);
        const folders = nodes.filter(n => n.type === 'folder');

        allGalleries = collections;

        const statsEl = el('stats');
        if (statsEl) statsEl.textContent = `${collections.length} collection${collections.length > 1 ? 's' : ''}`;

        displayGalleries(collections);
        renderFolders(folders);
    } catch (err) {
        console.error('loadHierarchy error', err);
        if (container) container.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

function renderFolders(folders) {
    const containerTop = el('foldersContainerTop');
    const containerBottom = el('foldersContainerBottom');
    if (!folders || folders.length === 0) {
        if (containerTop) containerTop.innerHTML = '';
        if (containerBottom) containerBottom.innerHTML = '';
        return;
    }

    const html = `
        <div id="foldersList" style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">
            ${folders.map(f => `<button class="folder-link" data-id="${f.id}" data-name="${escapeHtml(f.name||'')}" style="padding:8px 12px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:white; cursor:pointer;">📂 ${escapeHtml(f.name)}</button>`).join('')}
        </div>
    `;
    if (containerTop) containerTop.innerHTML = html;
    if (containerBottom) containerBottom.innerHTML = `<div style="color:white; margin-bottom:8px; font-weight:bold;">Dossiers :</div>${html}`;

    document.querySelectorAll('#foldersList .folder-link').forEach(btn => {
        btn.addEventListener('click', () => showFolder(btn.getAttribute('data-id'), btn.getAttribute('data-name') || ''));
    });
}

function extractGalleryIds(node, result = []) {
    if (!node) return result;
    if (node.id) {
        result.push({
            id: node.id,
            name: node.name || node.title || `Galerie ${node.id}`,
            type: node.type || 'gallery',
            count: node.count || node.length || 0,
            path: node.path || ''
        });
    }
    const childKeys = ['children', 'items', 'galleries', 'collections'];
    for (const key of childKeys) {
        if (node[key] && Array.isArray(node[key])) node[key].forEach(child => extractGalleryIds(child, result));
    }
    if (Array.isArray(node)) node.forEach(item => extractGalleryIds(item, result));
    return result;
}

function displayGalleries(galleries) {
    const container = el('galleriesContainer');
    if (!container) return;
    if (!galleries || galleries.length === 0) {
        container.innerHTML = '<div class="loading">Aucune galerie trouvée</div>';
        return;
    }

    container.innerHTML = galleries.map(g => `
        <div class="gallery-card" onclick="openGallery(${g.id}, '${escapeJs(g.name)}')">
            <div class="gallery-cover">${g.type === 'collection' ? '📁' : g.type === 'folder' ? '📂' : '🖼️'}</div>
            <div class="gallery-info">
                <div class="gallery-name">${escapeHtml(g.name)}</div>
                <div class="gallery-meta">ID: ${g.id} • Type: ${escapeHtml(g.type)}</div>
                <div class="gallery-count">${g.count} photo${g.count > 1 ? 's' : ''}</div>
            </div>
        </div>
    `).join('');
}

function showFolder(folderId, folderName) {
    const node = findNodeById(hierarchyData, folderId);
    if (!node) return alert('Dossier introuvable');
    const descendants = extractGalleryIds(node).filter(n => n.id != null);
    displayGalleries(descendants);
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${descendants.length} collection${descendants.length > 1 ? 's' : ''} dans "${folderName}"`;
    const bc = el('foldersContainerBottom');
    if (bc) bc.insertAdjacentHTML('afterend', `<div id="backToAll" style="margin-top:12px;"><a href="#" onclick="displayCollectionsView();return false;" style="color:white;text-decoration:underline">← Voir toutes les collections</a></div>`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function findNodeById(node, id) {
    if (!node) return null;
    if (node.id != null && node.id == id) return node;
    const childKeys = ['children','items','galleries','collections'];
    for (const k of childKeys) {
        if (node[k] && Array.isArray(node[k])) {
            for (const c of node[k]) {
                const found = findNodeById(c, id);
                if (found) return found;
            }
        }
    }
    if (Array.isArray(node)) for (const it of node) {
        const found = findNodeById(it, id);
        if (found) return found;
    }
    return null;
}

function displayCollectionsView() {
    displayGalleries(allGalleries);
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${allGalleries.length} collection${allGalleries.length > 1 ? 's' : ''}`;
    const back = el('backToAll');
    if (back) back.remove();
}

async function openGallery(galleryId, galleryName) {
    const modal = el('photosModal');
    const title = el('modalTitle');
    const grid = el('photosGrid');
    if (!modal || !title || !grid) return;

    modal.style.display = 'block';
    title.textContent = galleryName;
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement des photos...</div>';

    try {
        const resp = await fetch(`${API_BASE}/gallery/${galleryId}`, {
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const photos = await resp.json();
        if (!photos || photos.length === 0) {
            grid.innerHTML = '<div class="loading">Aucune photo dans cette galerie</div>';
            return;
        }
        displayPhotos(photos);
    } catch (err) {
        console.error('openGallery error', err);
        grid.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

// affiche photos puis récupère mots-clés via l'API IPTC (profil aiptc)
async function displayPhotos(photos) {
    const grid = el('photosGrid');
    if (!grid) return;

    grid.innerHTML = photos.map(photo => {
        const imgUrl = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const title = photo.title || photo.post_title || photo.name || `Photo ${photo.id}`;
        const kws = collectKeywords(photo); // mots présents dans l'objet photo (fallback immédiat)
        const kwsHtml = kws.length ? kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ') : `<span style="color:#999; font-size:12px;">Chargement mots-clés...</span>`;

        return `
            <div class="photo-card" id="photo-card-${photo.id}">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title)}" class="photo-img" onerror="this.style.background='linear-gradient(45deg,#ddd,#ccc)'; this.alt='Image non disponible';">
                <div class="photo-info">
                    <div class="photo-title">${escapeHtml(title)}</div>
                    <div class="photo-id">ID: ${photo.id}</div>
                    <div class="keywords-container" id="keywords-${photo.id}">${kwsHtml}</div>
                    <button class="order-btn" onclick="event.stopPropagation(); orderPrint('${escapeJs(title)}','${escapeJs(imgUrl)}', ${photo.id});">🖨️ Commander l'impression</button>
                </div>
            </div>
        `;
    }).join('');

    // pour chaque photo, récupérer IPTC via API modifiée (profile=aiptc) et remplacer si retourne mieux
    await Promise.allSettled(photos.map(async photo => {
        const container = el(`keywords-${photo.id}`);
        if (!container) return;

        try {
            const url = `${IPTC_API}/media/${photo.id}/keywords?profile=aiptc`;
            const headers = {};
            if (typeof BEARER_TOKEN === 'string' && BEARER_TOKEN.length) {
                headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
            }
            const resp = await fetch(url, { headers });
            if (resp.ok) {
                const data = await resp.json();
                // LOG DEBUG TEMPORAIRE
                console.log('🔍 Photo', photo.id, '- data brute:', JSON.stringify(data, null, 2));
                
                // Extraction simplifiée et sûre
                let kws = [];
                
                if (data && Array.isArray(data.keywords)) {
                    kws = data.keywords
                        .filter(k => k != null && k !== '')
                        .map(k => String(k).trim())
                        .filter(k => k.length > 0);
                } else if (Array.isArray(data)) {
                    kws = data
                        .filter(k => k != null && k !== '')
                        .map(k => String(k).trim())
                        .filter(k => k.length > 0);
                } else if (data && Array.isArray(data.items)) {
                    kws = data.items
                        .filter(k => k != null && k !== '')
                        .map(k => String(k).trim())
                        .filter(k => k.length > 0);
                }
                
                console.log('🏷️  Photo', photo.id, '- keywords extraits:', kws);
                
                if (!kws || kws.length === 0) {
                    kws = collectKeywords(photo);
                    console.log('⚠️  Photo', photo.id, '- fallback collectKeywords:', kws);
                }

                if (kws && kws.length > 0) {
                    container.innerHTML = kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ');
                } else {
                    container.innerHTML = `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
                }
            } else {
                const text = await resp.text().catch(() => '[no body]');
                console.warn(`⚠️  IPTC API ${resp.status} pour photo ${photo.id}`, text);
                // afficher fallback
                const kws = collectKeywords(photo);
                container.innerHTML = kws.length ? kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ') : `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
            }
        } catch (err) {
            console.error('❌ IPTC fetch error pour photo', photo.id, ':', err);
            const kws = collectKeywords(photo);
            container.innerHTML = kws.length ? kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ') : `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
        }
    }));
}

function collectKeywords(photo) {
    const s = new Set();
    if (!photo) return [];
    try {
        if (photo.keywords) {
            if (Array.isArray(photo.keywords)) photo.keywords.forEach(k => { if (k) s.add(String(k).trim()); });
            else if (typeof photo.keywords === 'string') photo.keywords.split(/[,;]+/).forEach(k => { const t = k.trim(); if (t) s.add(t); });
        }
        if (photo.iptc_keywords && Array.isArray(photo.iptc_keywords)) photo.iptc_keywords.forEach(k => { if (k) s.add(String(k).trim()); });
        if (photo.meta && photo.meta.keywords && Array.isArray(photo.meta.keywords)) photo.meta.keywords.forEach(k => { if (k) s.add(String(k).trim()); });
        if (photo.terms) {
            Object.values(photo.terms).forEach(group => {
                if (Array.isArray(group)) group.forEach(term => { if (term && term.name) s.add(String(term.name).trim()); });
            });
        }
        if (photo.tags && Array.isArray(photo.tags)) photo.tags.forEach(t => {
            if (typeof t === 'string') s.add(t.trim()); else if (t && t.name) s.add(String(t.name).trim());
        });
    } catch (e) {
        console.warn('collectKeywords error', e);
    }
    return Array.from(s).filter(k => k && k.length > 0);
}

function closeModal() {
    const modal = el('photosModal');
    if (modal) modal.style.display = 'none';
}

function orderPrint(title, imageUrl, photoId) {
    const to = 'wagess@gmail.com';
    const subject = `Commande impression: ${title}`;
    const body = `Bonjour,

Je souhaite commander une impression.

Titre: ${title}
ID: ${photoId}
Image: ${imageUrl}

Merci,
[Votre nom]`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert('Email préparé. Vérifiez votre client mail.');
}

const closeBtn = el('closeModalBtn');
if (closeBtn) closeBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });