import { el, escapeHtml, escapeJs } from './utils.js';

export let allGalleries = [];
export let hierarchyData = null;
export let allSearchableItems = [];

export function setHierarchyData(data) {
    hierarchyData = data;
}

export function setAllGalleries(galleries) {
    allGalleries = galleries;
}

export function setAllSearchableItems(items) {
    allSearchableItems = items;
}

export function extractGalleryIds(node, result = []) {
    if (!node) return result;
    if (node.id) {
        const item = {
            id: node.id,
            name: node.name || node.title || `Galerie ${node.id}`,
            type: node.type || 'gallery',
            count: node.count || node.length || 0,
            path: node.path || ''
        };
        console.log('📦 Extrait:', item.name, '- Type:', item.type, '- Count:', item.count);
        result.push(item);
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

export function displayGalleries(galleries) {
    const container = el('galleriesContainer');
    if (!container) return;
    if (!galleries || galleries.length === 0) {
        container.innerHTML = '<div class="loading">Aucune galerie trouvée</div>';
        return;
    }

    container.innerHTML = galleries.map(g => {
        let icon = '🖼️';
        if (g.type === 'collection') icon = '📸';
        else if (g.type === 'folder') icon = '📂';
        else if (g.type === 'gallery') icon = '🎨';
        else if (g.type === 'album') icon = '📔';
        
        return `
            <div class="gallery-card" onclick="window.openGallery(${g.id}, '${escapeJs(g.name)}')">
                <div class="gallery-cover">${icon}</div>
                <div class="gallery-info">
                    <div class="gallery-name">${escapeHtml(g.name)}</div>
                    <div class="gallery-meta">ID: ${g.id} • Type: ${escapeHtml(g.type)}</div>
                    <div class="gallery-count">${g.count} photo${g.count > 1 ? 's' : ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

export function renderFolders(folders) {
    const containerTop = el('foldersContainerTop');
    if (!folders || folders.length === 0) {
        if (containerTop) containerTop.innerHTML = '';
        return;
    }

    const html = `
        <div id="foldersList" style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">
            ${folders.map(f => `<button class="folder-link" data-id="${f.id}" data-name="${escapeHtml(f.name||'')}" style="padding:8px 12px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:white; cursor:pointer;">📂 ${escapeHtml(f.name)}</button>`).join('')}
        </div>
    `;
    if (containerTop) containerTop.innerHTML = html;

    document.querySelectorAll('#foldersList .folder-link').forEach(btn => {
        btn.addEventListener('click', () => showFolder(btn.getAttribute('data-id'), btn.getAttribute('data-name') || ''));
    });
}

export function showFolder(folderId, folderName) {
    const node = findNodeById(hierarchyData, folderId);
    if (!node) return alert('Dossier introuvable');
    const descendants = extractGalleryIds(node).filter(n => n.id != null && n.type !== 'folder');
    displayGalleries(descendants);
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${descendants.length} collection${descendants.length > 1 ? 's' : ''} dans "${folderName}"`;
    
    const existing = el('backToAll');
    if (existing) existing.remove();
    const container = el('galleriesContainer');
    if (container) {
        container.insertAdjacentHTML('beforebegin', `<div id="backToAll" style="margin:20px 0; text-align:center;"><a href="#" onclick="window.displayCollectionsView();return false;" style="color:white; text-decoration:underline; font-size:16px;">← Voir toutes les collections</a></div>`);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function displayCollectionsView() {
    displayGalleries(allGalleries);
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${allGalleries.length} collection${allGalleries.length > 1 ? 's' : ''}`;
    const back = el('backToAll');
    if (back) back.remove();
    
    const searchInput = el('searchInput');
    if (searchInput) searchInput.value = '';
}

export function findNodeById(node, id) {
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
    if (Array.isArray(node)) {
        for (const it of node) {
            const found = findNodeById(it, id);
            if (found) return found;
        }
    }
    return null;
}