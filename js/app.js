const API_BASE = 'https://www.photographie.stephanewagner.com/wp-json/wplr/v1';
const IPTC_API = 'https://www.photographie.stephanewagner.com/wp-json/wplr-iptc/v1';
const BEARER_TOKEN = 'njMh4lWVFQUz';

let allGalleries = [];
let hierarchyData = null;

// événement d'initialisation
window.onload = function() {
    loadHierarchy();
};

async function loadHierarchy() {
    const container = document.getElementById('galleriesContainer');
    
    try {
        const response = await fetch(`${API_BASE}/hierarchy`, {
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        hierarchyData = await response.json();
        console.log('Hiérarchie reçue:', hierarchyData);

        const nodes = extractGalleryIds(hierarchyData);
        // indexer TOUT node qui possède un id (ne pas se limiter au champ type)
        const collections = nodes.filter(n => n.id != null);
        const folders = nodes.filter(n => n.type === 'folder');

        console.info(`Total nodes=${nodes.length}, indexed collections=${collections.length}, folders=${folders.length}`);
 
        allGalleries = collections;
 
        if (collections.length === 0) {
            container.innerHTML = '<div class="error-message">Aucune collection trouvée</div>';
            return;
        }

        document.getElementById('stats').textContent = 
            `${collections.length} collection${collections.length > 1 ? 's' : ''} disponible${collections.length > 1 ? 's' : ''}`;

        displayGalleries(collections);
        renderFolders(folders);
        // démarre l'indexation basique des mots-clés (sans IPTC) en tâche de fond
        startIndexingKeywords(collections);

    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = `<div class="error-message">❌ Erreur: ${error.message}</div>`;
    }
}

function renderFolders(folders) {
    const containerBottom = document.getElementById('foldersContainerBottom');
    const containerTop = document.getElementById('foldersContainerTop');
    if (!folders || folders.length === 0) {
        containerBottom.innerHTML = '';
        containerTop.innerHTML = '';
        return;
    }

    const folderHTML = `
        <div id="foldersList" style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">
            ${folders.map(f => `<button type="button" class="folder-link" data-id="${f.id}" data-name="${(f.name||'').replace(/"/g,'&quot;')}" style="font-size:1.2rem; background: rgba(255,255,255,0.06); color: white; padding:8px 12px; border-radius:8px; border:none; cursor:pointer;">📂 ${f.name}</button>`).join('')}
        </div>
    `;

    containerTop.innerHTML = folderHTML;
    containerBottom.innerHTML = `<div style="color: white; margin-bottom: 8px; font-weight: bold;">Dossiers :</div>` + folderHTML;

    document.querySelectorAll('#foldersList .folder-link').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name') || '';
            showFolder(id, name);
        });
    });
}

function findNodeById(node, id) {
    if (!node) return null;
    if (node.id != null && node.id == id) return node;

    const childKeys = ['children', 'items', 'galleries', 'collections'];
    for (const key of childKeys) {
        if (node[key] && Array.isArray(node[key])) {
            for (const child of node[key]) {
                const found = findNodeById(child, id);
                if (found) return found;
            }
        }
    }

    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findNodeById(item, id);
            if (found) return found;
        }
    }

    return null;
}

function showFolder(folderId, folderName) {
    const oldBack = document.getElementById('backToAll');
    if (oldBack) oldBack.remove();

    const node = findNodeById(hierarchyData, folderId);
    if (!node) {
        alert('Dossier introuvable dans la hiérarchie.');
        return;
    }

    // ne pas se baser sur type uniquement : prendre tous les noeuds avec un id
    const descendants = extractGalleryIds(node).filter(n => n.id != null);
 
    if (descendants.length === 0) {
        displayGalleries([]);
        document.getElementById('stats').textContent = `0 collection dans "${folderName}"`;
    } else {
        displayGalleries(descendants);
        document.getElementById('stats').textContent = `${descendants.length} collection${descendants.length > 1 ? 's' : ''} dans "${folderName}"`;
    }

    const foldersDiv = document.getElementById('foldersContainerBottom');
    const backHtml = `<div id="backToAll" style="margin-top:12px;"><a href="#" onclick="displayCollectionsView();return false;" style="color:white; text-decoration:underline;">← Voir toutes les collections</a></div>`;
    foldersDiv.insertAdjacentHTML('afterend', backHtml);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function displayCollectionsView() {
    displayGalleries(allGalleries);
    document.getElementById('stats').textContent = `${allGalleries.length} collection${allGalleries.length > 1 ? 's' : ''} disponible${allGalleries.length > 1 ? 's' : ''}`;
    const maybeBack = document.getElementById('backToAll');
    if (maybeBack) maybeBack.remove();
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
        if (node[key] && Array.isArray(node[key])) {
            node[key].forEach(child => extractGalleryIds(child, result));
        }
    }

    if (Array.isArray(node)) {
        node.forEach(item => extractGalleryIds(item, result));
    }

    return result;
}

function displayGalleries(galleries) {
    const container = document.getElementById('galleriesContainer');
    
    if (galleries.length === 0) {
        container.innerHTML = '<div class="loading">Aucune galerie trouvée</div>';
        return;
    }

    container.innerHTML = galleries.map(gallery => `
        <div class="gallery-card" onclick="openGallery(${gallery.id}, '${gallery.name.replace(/'/g, "\\'")}')">
            <div class="gallery-cover">
                ${gallery.type === 'collection' ? '📁' : gallery.type === 'folder' ? '📂' : '🖼️'}
            </div>
            <div class="gallery-info">
                <div class="gallery-name">${gallery.name}</div>
                <div class="gallery-meta">
                    ID: ${gallery.id} • Type: ${gallery.type}
                </div>
                <span class="gallery-count">${gallery.count} photo${gallery.count > 1 ? 's' : ''}</span>
            </div>
        </div>
    `).join('');
}

function filterGalleries() {
    const raw = document.getElementById('searchInput');
    const keyword = raw ? String(raw.value).toLowerCase().trim() : '';
    
    if (!keyword) {
        displayGalleries(allGalleries);
        document.getElementById('stats').textContent = `${allGalleries.length} collection${allGalleries.length > 1 ? 's' : ''} disponible`;
        return;
    }

    const searchMode = document.querySelector('input[name="searchMode"]:checked') ?
        document.querySelector('input[name="searchMode"]:checked').value : 'collections';

    if (searchMode === 'collections') {
        const filtered = allGalleries.filter(g =>
            (g.name || '').toLowerCase().includes(keyword) ||
            g.id.toString().includes(keyword)
        );
        displayGalleries(filtered);
        document.getElementById('stats').textContent =
            `${filtered.length} résultat${filtered.length > 1 ? 's' : ''} pour "${keyword}"`;
        return;
    }

    // ----- mode "keywords" : chercher les PHOTOS dans l'index et les afficher -----
    const matchedPhotos = [];
    // si l'indexation n'a pas encore commencé / est en cours, on informe l'utilisateur
    if (Object.keys(galleryIndex).length === 0 && keywordsIndexing.running) {
        const container = document.getElementById('galleriesContainer');
        container.innerHTML = '<div class="loading"><div class="spinner"></div>Indexation des mots-clés en cours...</div>';
        document.getElementById('stats').textContent = `Indexation en cours…`;
        return;
    }

    for (const gid of Object.keys(galleryIndex)) {
        const entries = galleryIndex[gid] || [];
        for (const entry of entries) {
            const kws = Array.isArray(entry.keywords) ? entry.keywords : [];
            const title = (entry.photo && (entry.photo.title || entry.photo.name || entry.photo.post_title)) ? String(entry.photo.title || entry.photo.name || entry.photo.post_title).toLowerCase() : '';
            const matchKeyword = kws.some(k => k.includes(keyword));
            const matchTitle = title && title.includes(keyword);
            if (matchKeyword || matchTitle) {
                matchedPhotos.push(entry.photo);
            }
        }
    }

    if (matchedPhotos.length === 0) {
        const container = document.getElementById('galleriesContainer');
        container.innerHTML = '<div class="loading">Aucune photo trouvée pour cette recherche</div>';
        document.getElementById('stats').textContent = `0 résultat pour "${keyword}"`;
        return;
    }

    // affichage des photos correspondantes
    displayPhotos(matchedPhotos);
    document.getElementById('stats').textContent = `${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''} trouvée${matchedPhotos.length > 1 ? 's' : ''} pour "${keyword}"`;

    // ouvrir la modal de photos pour afficher les résultats de la recherche
    const modal = document.getElementById('photosModal');
    const titleEl = document.getElementById('modalTitle');
    if (modal) {
        if (titleEl) titleEl.textContent = `Résultats pour "${keyword}"`;
        modal.style.display = 'block';
        // positionne en haut pour que la modal soit visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function openGallery(galleryId, galleryName) {
    const modal = document.getElementById('photosModal');
    const title = document.getElementById('modalTitle');
    const grid = document.getElementById('photosGrid');

    modal.style.display = 'block';
    title.textContent = galleryName;
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement des photos...</div>';

    try {
        const response = await fetch(`${API_BASE}/gallery/${galleryId}`, {
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const photos = await response.json();
        console.log('Photos reçues:', photos);

        if (!photos || photos.length === 0) {
            grid.innerHTML = '<div class="loading">Aucune photo dans cette galerie</div>';
            return;
        }

        displayPhotos(photos);

    } catch (error) {
        console.error('Erreur:', error);
        grid.innerHTML = `<div class="error-message">❌ Erreur: ${error.message}</div>`;
    }
}

// MODIFICATION PRINCIPALE : Affichage avec appel API IPTC
async function displayPhotos(photos) {
    const grid = document.getElementById('photosGrid');

    // Afficher d'abord les photos sans les mots-clés
    grid.innerHTML = photos.map(photo => {
        const imgUrl = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const title = photo.title || photo.post_title || photo.name || `Photo ${photo.id}`;

        return `
            <div class="photo-card" id="photo-card-${photo.id}">
                <img 
                    src="${imgUrl}" 
                    alt="${title}" 
                    class="photo-img"
                    onerror="this.style.background='linear-gradient(45deg, #ddd, #ccc)'; this.alt='Image non disponible';"
                >
                <div class="photo-info">
                    <div class="photo-title">${title}</div>
                    <div class="photo-id">ID: ${photo.id}</div>
                    <div class="keywords-container" id="keywords-${photo.id}">
                        <span style="color: #999; font-size: 12px;">⏳ Chargement mots-clés...</span>
                    </div>
                    <button class="order-btn" onclick="orderPrint('${title.replace(/'/g, "\\'")}', '${imgUrl}', ${photo.id}, event)">
                        🖨️ Commander l'impression
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Charger les mots-clés IPTC en parallèle
    photos.forEach(async (photo) => {
        const keywords = await extractKeywordsWithIPTC(photo);
        const container = document.getElementById(`keywords-${photo.id}`);
        
        if (container) {
            if (keywords.length > 0) {
                container.innerHTML = keywords.map(k => 
                    `<span class="keyword-tag">${k}</span>`
                ).join('');
            } else {
                container.innerHTML = '<span style="color: #999; font-size: 12px;">Aucun mot-clé</span>';
            }
        }
    });

    console.log('Photos affichées:', photos.length);
}

// NOUVELLE FONCTION : Extraction avec API IPTC
async function extractKeywordsWithIPTC(photo) {
    const keywords = new Set();

    // 1. APPEL À L'API IPTC
    try {
        const iptcResponse = await fetch(
            `${IPTC_API}/media/${photo.id}/keywords`,
            {
                headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
            }
        );

        if (iptcResponse.ok) {
            const iptcData = await iptcResponse.json();
            console.log(`✅ IPTC Keywords photo ${photo.id}:`, iptcData);
            
            if (iptcData.keywords && Array.isArray(iptcData.keywords)) {
                iptcData.keywords.forEach(k => {
                    if (k && k.trim().length > 0) {
                        keywords.add(k.trim());
                    }
                });
            }
        } else {
            console.log(`⚠️ API IPTC HTTP ${iptcResponse.status} pour photo ${photo.id}`);
        }
    } catch (error) {
        console.log(`❌ Erreur API IPTC photo ${photo.id}:`, error.message);
    }

    // 2. Fallback : autres sources
    if (photo.keywords) {
        if (Array.isArray(photo.keywords)) {
            photo.keywords.forEach(k => keywords.add(k));
        } else if (typeof photo.keywords === 'string') {
            photo.keywords.split(/[,;]/).forEach(k => {
                const trimmed = k.trim();
                if (trimmed.length > 0) keywords.add(trimmed);
            });
        }
    }

    if (photo.iptc_keywords && Array.isArray(photo.iptc_keywords)) {
        photo.iptc_keywords.forEach(k => keywords.add(k));
    }

    if (photo.meta && photo.meta.keywords && Array.isArray(photo.meta.keywords)) {
        photo.meta.keywords.forEach(k => keywords.add(k));
    }

    if (photo.terms) {
        Object.values(photo.terms).forEach(termGroup => {
            if (Array.isArray(termGroup)) {
                termGroup.forEach(term => {
                    if (term.name) keywords.add(term.name);
                });
            }
        });
    }

    if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach(tag => {
            if (typeof tag === 'string') keywords.add(tag);
            else if (tag.name) keywords.add(tag.name);
        });
    }

    return Array.from(keywords).filter(k => k && k.length > 0);
}

function closeModal() {
    document.getElementById('photosModal').style.display = 'none';
}

function orderPrint(title, imageUrl, photoId, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();

    const to = 'wagess@gmail.com';
    const subject = `Commande impression: ${title}`;
    const body = `Bonjour,

Je souhaite commander une impression.

Titre: ${title}
ID: ${photoId}
Image: ${imageUrl}

Merci,
[Votre nom]`;

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    alert('Email préparé vers ' + to + '. Vérifiez votre client mail pour l\'envoyer.');
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        filterGalleries();
    }
});

document.getElementById('searchBtn').addEventListener('click', function() {
    filterGalleries();
});

document.getElementById('closeModalBtn').addEventListener('click', function() {
    closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// index mémoire: galleryId -> [{ photo, keywords: [..] }, ...]
const galleryIndex = {};
let keywordsIndexing = { running: false, done: false, processed: 0, total: 0 };

// met à jour l'indicateur d'indexation et active/désactive le radio "Mots-clés"
function updateIndexStatus() {
    const el = document.getElementById('keywordsIndexStatus');
    const modeKeywords = document.getElementById('modeKeywords');
    if (modeKeywords) {
        modeKeywords.disabled = !!keywordsIndexing.running;
        modeKeywords.title = keywordsIndexing.running ? 'Indexation des mots-clés en cours...' : '';
    }
    if (!el) return;
    if (keywordsIndexing.done) {
        el.textContent = 'Indexation mots-clés terminée';
        if (modeKeywords) {
            modeKeywords.disabled = false;
            modeKeywords.title = '';
        }
    } else if (keywordsIndexing.running) {
        el.textContent = `Indexation: ${keywordsIndexing.processed}/${keywordsIndexing.total}`;
    } else {
        el.textContent = '';
    }
}

// démarre l'indexation basique par galerie (concurrence limitée)
async function startIndexingKeywords(galleries) {
    if (!galleries || galleries.length === 0) return;
    if (keywordsIndexing.running) return;
    keywordsIndexing.running = true;
    keywordsIndexing.done = false;
    keywordsIndexing.total = galleries.length;
    keywordsIndexing.processed = 0;
    updateIndexStatus();

    console.info('Démarrage indexation mots-clés pour', galleries.length, 'galeries');

    const concurrency = 3;
    const queue = galleries.slice();

    const workers = new Array(concurrency).fill(null).map(() => (async () => {
        while (queue.length > 0) {
            const g = queue.shift();
            try {
                const entries = await buildGalleryKeywords(g.id);
                galleryIndex[g.id] = entries;
                console.debug(`Indexed gallery ${g.id}: ${entries.length} photos`);
            } catch (e) {
                console.warn('Indexation keywords galerie', g.id, e);
            } finally {
                keywordsIndexing.processed++;
                updateIndexStatus();
            }
        }
    })());

    await Promise.all(workers);
    keywordsIndexing.running = false;
    keywordsIndexing.done = true;
    updateIndexStatus();
    console.info('Indexation mots-clés terminée');
}

// ensure extractKeywordsWithIPTC returns normalized keywords
async function extractKeywordsWithIPTC(photo) {
    const keywords = new Set();

    // 1. APPEL À L'API IPTC
    try {
        const iptcResponse = await fetch(
            `${IPTC_API}/media/${photo.id}/keywords`,
            {
                headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
            }
        );

        if (iptcResponse.ok) {
            const iptcData = await iptcResponse.json();
            if (iptcData.keywords && Array.isArray(iptcData.keywords)) {
                iptcData.keywords.forEach(k => {
                    if (k && k.trim().length > 0) keywords.add(k.trim());
                });
            }
        }
    } catch (error) {
        // ignore IPTC errors, fallback to embedded metadata below
    }

    // 2. Fallback : autres sources (collect raw values)
    if (photo.keywords) {
        if (Array.isArray(photo.keywords)) photo.keywords.forEach(k => keywords.add(k));
        else if (typeof photo.keywords === 'string') photo.keywords.split(/[,;]/).forEach(k => keywords.add(k.trim()));
    }

    if (photo.iptc_keywords && Array.isArray(photo.iptc_keywords)) {
        photo.iptc_keywords.forEach(k => keywords.add(k));
    }

    if (photo.meta && photo.meta.keywords && Array.isArray(photo.meta.keywords)) {
        photo.meta.keywords.forEach(k => keywords.add(k));
    }

    if (photo.terms) {
        Object.values(photo.terms).forEach(termGroup => {
            if (Array.isArray(termGroup)) {
                termGroup.forEach(term => {
                    if (term && (term.name || term)) keywords.add(term.name || term);
                });
            }
        });
    }

    if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach(tag => {
            if (typeof tag === 'string') keywords.add(tag);
            else if (tag && tag.name) keywords.add(tag.name);
        });
    }

    // return normalized, deduped, lowercase keywords
    return normalizeKeywords(Array.from(keywords));
}

// normalize and dedupe keywords: accepts string/array/set/object and returns array of lowercase trimmed unique strings
function normalizeKeywords(input) {
    const set = new Set();
    if (!input) return [];
    const arr = [];

    if (typeof input === 'string') {
        arr.push(...input.split(/[,;|\/]+/));
    } else if (input instanceof Set) {
        arr.push(...Array.from(input));
    } else if (Array.isArray(input)) {
        arr.push(...input);
    } else if (typeof input === 'object') {
        // try common fields
        if (input.name) arr.push(input.name);
        else if (input.title) arr.push(input.title);
        else arr.push(String(input));
    } else {
        arr.push(String(input));
    }

    for (let v of arr) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'object') {
            if (v.name) v = v.name;
            else v = JSON.stringify(v);
        }
        const s = String(v).trim().toLowerCase();
        if (s.length) set.add(s);
    }

    return Array.from(set);
}

// when building gallery-level index, store normalized keywords
async function buildGalleryKeywords(galleryId) {
    if (galleryIndex[galleryId]) return galleryIndex[galleryId];
    const entries = [];
    try {
        const resp = await fetch(`${API_BASE}/gallery/${galleryId}`, { headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const photos = await resp.json();

        for (const p of photos) {
            // collect raw sources
            const raw = [];

            if (p.keywords) raw.push(p.keywords);
            if (p.iptc_keywords) raw.push(p.iptc_keywords);
            if (p.meta && p.meta.keywords) raw.push(p.meta.keywords);
            if (p.terms) {
                Object.values(p.terms).forEach(group => {
                    if (Array.isArray(group)) group.forEach(t => raw.push(t.name || t));
                });
            }
            if (p.tags) raw.push(p.tags);
            if (p.title) raw.push(p.title);
            if (p.name) raw.push(p.name);

            // flatten raw into strings and normalize
            const flat = [];
            raw.forEach(item => {
                if (!item) return;
                if (Array.isArray(item)) item.forEach(x => flat.push(x));
                else if (typeof item === 'object') {
                    if (item.name) flat.push(item.name);
                } else flat.push(item);
            });

            let kws = normalizeKeywords(flat);
            // fallback: split title/name tokens if still empty
            if (kws.length === 0) {
                const fallback = [];
                if (p.title) fallback.push(...String(p.title).split(/\s+/));
                if (p.name) fallback.push(...String(p.name).split(/\s+/));
                kws = normalizeKeywords(fallback);
            }

            entries.push({ photo: p, keywords: kws });
        }
    } catch (e) {
        console.warn('Erreur buildGalleryKeywords', galleryId, e);
    }
    galleryIndex[galleryId] = entries;
    return entries;
}