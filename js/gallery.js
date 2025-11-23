import { el, escapeHtml, escapeJs } from './utils.js';

export let allGalleries = [];
export let hierarchyData = null;
export let allSearchableItems = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 8;
let currentDisplayedGalleries = [];

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
            path: node.path || '',
            // Ajouter les dates si disponibles
            created_date: node.created_date || node.dateCreated || null,
            modified_date: node.modified_date || node.dateModified || null,
            published_date: node.published_date || node.datePublished || null
        };
        console.log('📦 Extrait:', item.name, '- Type:', item.type, '- Créé:', item.created_date);
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

export function displayGalleries(galleries, page = 1) {
    const container = el('galleriesContainer');
    if (!container) return;
    
    currentDisplayedGalleries = galleries;
    currentPage = page;
    
    if (!galleries || galleries.length === 0) {
        container.innerHTML = '<div class="loading">Aucune galerie trouvée</div>';
        return;
    }

    // Calculer la pagination
    const totalPages = Math.ceil(galleries.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedGalleries = galleries.slice(startIndex, endIndex);

    container.innerHTML = paginatedGalleries.map(g => {
        let icon = '🖼️';
        if (g.type === 'collection') icon = '📸';
        else if (g.type === 'folder') icon = '📂';
        else if (g.type === 'gallery') icon = '🎨';
        else if (g.type === 'album') icon = '📔';
        
        // Créer la mosaïque de 4 photos si disponibles
        let coverContent = '';
        if (g.thumbnails && g.thumbnails.length > 0) {
            const thumbs = g.thumbnails.slice(0, 4);
            coverContent = `
                <div class="gallery-mosaic">
                    ${thumbs.map(thumb => `
                        <div class="mosaic-item" style="background-image: url('${escapeHtml(thumb)}')"></div>
                    `).join('')}
                </div>
            `;
        } else {
            coverContent = `<div class="gallery-icon">${icon}</div>`;
        }
        
        // Formater la date
        let dateDisplay = '';
        if (g.created_date) {
            const date = new Date(g.created_date);
            dateDisplay = `<div class="gallery-date">📅 ${date.toLocaleDateString('fr-FR')}</div>`;
        }
        
        return `
            <div class="gallery-card" onclick="window.openGallery(${g.id}, '${escapeJs(g.name)}')">
                <div class="gallery-cover">${coverContent}</div>
                <div class="gallery-info">
                    <div class="gallery-name">${escapeHtml(g.name)}</div>
                    <div class="gallery-meta">ID: ${g.id} • Type: ${escapeHtml(g.type)}</div>
                    ${dateDisplay}
                    <div class="gallery-count">${g.count} photo${g.count > 1 ? 's' : ''}</div>
                </div>
            </div>
        `;
    }).join('');

    // Ajouter la pagination
    renderPagination(totalPages, page, galleries.length);
}

function renderPagination(totalPages, currentPage, totalItems) {
    // Supprimer l'ancienne pagination
    const existingPagination = document.querySelector('.pagination-container');
    if (existingPagination) {
        existingPagination.remove();
    }

    if (totalPages <= 1) return;

    const container = el('galleriesContainer');
    if (!container) return;

    const paginationHTML = `
        <div class="pagination-container" style="margin: 20px 0; text-align: center;">
            <div class="pagination-info" style="color: white; margin-bottom: 10px; font-size: 14px;">
                Page ${currentPage} sur ${totalPages} (${totalItems} collections au total)
            </div>
            <div class="pagination-buttons" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                ${currentPage > 1 ? `
                    <button onclick="changePage(1)" class="pagination-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; cursor: pointer;">«</button>
                    <button onclick="changePage(${currentPage - 1})" class="pagination-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; cursor: pointer;">‹</button>
                ` : ''}
                
                ${generatePageNumbers(currentPage, totalPages)}
                
                ${currentPage < totalPages ? `
                    <button onclick="changePage(${currentPage + 1})" class="pagination-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; cursor: pointer;">›</button>
                    <button onclick="changePage(${totalPages})" class="pagination-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; cursor: pointer;">»</button>
                ` : ''}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('afterend', paginationHTML);
}

function generatePageNumbers(currentPage, totalPages) {
    let pages = '';
    const range = 2; // Nombre de pages à afficher de chaque côté de la page actuelle
    
    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
        const isActive = i === currentPage;
        pages += `
            <button onclick="changePage(${i})" class="pagination-btn ${isActive ? 'active' : ''}" 
                style="padding: 8px 12px; background: ${isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}; 
                border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: ${isActive ? 'bold' : 'normal'};">
                ${i}
            </button>
        `;
    }
    
    return pages;
}

// Fonction globale pour changer de page
window.changePage = function(page) {
    displayGalleries(currentDisplayedGalleries, page);
    
    // Charger les thumbnails pour la nouvelle page
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageCollections = currentDisplayedGalleries.slice(startIndex, endIndex);
    window.loadThumbnailsForCollections(pageCollections);
    
    // Scroll vers le haut des galeries
    const container = el('galleriesContainer');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

export function renderFolders(folders) {
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

export async function showFolder(folderId, folderName) {
    const node = findNodeById(hierarchyData, folderId);
    if (!node) return alert('Dossier introuvable');
    const descendants = extractGalleryIds(node).filter(n => n.id != null && n.type !== 'folder');
    displayGalleries(descendants, 1); // Toujours commencer à la page 1 pour un nouveau dossier
    
    // Charger les thumbnails pour ce dossier
    await window.loadThumbnailsForCollections(descendants);
    
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${descendants.length} collection${descendants.length > 1 ? 's' : ''} dans "${folderName}"`;
    
    const existing = el('backToAll');
    if (existing) existing.remove();
    const container = el('galleriesContainer');
    if (container) {
        container.insertAdjacentHTML('afterend', `<div id="backToAll" style="margin:20px; padding:20px; text-align:center;"><a href="#" onclick="window.displayCollectionsView();return false;" style="color:white; text-decoration:underline; font-size:16px;">← Voir toutes les collections</a></div>`);
    }
    
    // Scroll down vers les galeries après un petit délai
    setTimeout(() => {
        const galleriesContainer = el('galleriesContainer');
        if (galleriesContainer) {
            galleriesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

export function displayCollectionsView() {
    displayGalleries(allGalleries, 1); // Retourner à la page 1
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