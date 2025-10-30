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

let currentDisplayCount = 8; // Nombre initial de collections à afficher
const incrementSize = 12; // Nombre de collections à ajouter à chaque "Voir plus"

export function displayGalleries(galleries, append = false) {
    const container = el('galleriesContainer');
    if (!container) return;
    
    if (!galleries || galleries.length === 0) {
        container.innerHTML = '<div class="loading">Aucune galerie trouvée</div>';
        return;
    }

    // Si c'est un nouvel affichage, réinitialiser le compteur
    if (!append) {
        currentDisplayCount = 8;
        container.innerHTML = '';
    }

    // Prendre seulement les collections à afficher
    const collectionsToShow = galleries.slice(0, currentDisplayCount);
    const hasMore = galleries.length > currentDisplayCount;

    const galleriesHtml = collectionsToShow.map(g => {
        let icon = '🖼️';
        if (g.type === 'collection') icon = '📸';
        else if (g.type === 'folder') icon = '📂';
        else if (g.type === 'gallery') icon = '🎨';
        else if (g.type === 'album') icon = '📔';
        
        // Créer la mosaïque avec lazy loading optimisé
        let coverContent = '';
        if (g.thumbnails && g.thumbnails.length > 0) {
            const thumbs = g.thumbnails.slice(0, 4);
            coverContent = `
                <div class="gallery-mosaic">
                    ${thumbs.map((thumb, index) => `
                        <div class="mosaic-item" 
                             data-src="${escapeHtml(thumb)}" 
                             data-loading="true"
                             style="background-image: url('data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#333"/></svg>')}')"
                             data-priority="${index === 0 ? 'high' : 'low'}">
                            <div class="mosaic-loader"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            coverContent = `
                <div class="gallery-loading" data-gallery-id="${g.id}">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Chargement...</div>
                </div>
            `;
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

    if (append) {
        // Ajouter les nouvelles collections
        const existingLoadMore = container.querySelector('.load-more-container');
        if (existingLoadMore) existingLoadMore.remove();
        
        container.insertAdjacentHTML('beforeend', galleriesHtml);
    } else {
        // Remplacer tout le contenu
        container.innerHTML = galleriesHtml;
    }

    // Ajouter le bouton "Voir plus" si nécessaire
    if (hasMore) {
        const loadMoreHtml = `
            <div class="load-more-container" style="text-align: center; margin: 30px 0;">
                <button id="loadMoreBtn" class="load-more-btn" style="
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    📸 Voir ${Math.min(incrementSize, galleries.length - currentDisplayCount)} collections de plus
                    <span style="opacity: 0.7; font-size: 14px; display: block;">
                        (${currentDisplayCount}/${galleries.length})
                    </span>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', loadMoreHtml);

        // Attacher l'événement au bouton
        const loadMoreBtn = el('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                currentDisplayCount += incrementSize;
                displayGalleries(galleries, true);
                
                // Faire défiler vers les nouvelles collections
                setTimeout(() => {
                    const newCards = container.querySelectorAll('.gallery-card');
                    if (newCards.length > currentDisplayCount - incrementSize) {
                        newCards[currentDisplayCount - incrementSize].scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                }, 100);
            });
        }
    }
    
    // Charger les images avec throttling (seulement les nouvelles)
    loadThumbnailsWithThrottling();
}

// Nouvelle fonction pour le chargement progressif
function loadThumbnailsWithThrottling() {
    const items = document.querySelectorAll('.mosaic-item[data-loading="true"]');
    const highPriorityItems = Array.from(items).filter(item => item.dataset.priority === 'high');
    const lowPriorityItems = Array.from(items).filter(item => item.dataset.priority === 'low');
    
    // Charger d'abord les images prioritaires (première de chaque mosaïque)
    loadBatch(highPriorityItems, 5, () => {
        // Puis charger les autres par petits lots
        loadBatch(lowPriorityItems, 8);
    });
}

function loadBatch(items, batchSize, callback) {
    let index = 0;
    
    function loadNext() {
        const batch = items.slice(index, index + batchSize);
        if (batch.length === 0) {
            if (callback) callback();
            return;
        }
        
        const promises = batch.map(item => loadSingleThumbnail(item));
        
        Promise.allSettled(promises).then(() => {
            index += batchSize;
            // Délai entre les lots pour éviter la surcharge
            setTimeout(loadNext, 100);
        });
    }
    
    loadNext();
}

function loadSingleThumbnail(item) {
    return new Promise((resolve) => {
        const img = new Image();
        const loader = item.querySelector('.mosaic-loader');
        
        img.onload = () => {
            item.style.backgroundImage = `url('${item.dataset.src}')`;
            item.removeAttribute('data-loading');
            if (loader) loader.style.display = 'none';
            resolve();
        };
        
        img.onerror = () => {
            item.style.backgroundImage = "url('data:image/svg+xml;base64," + 
                btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#666"/><text x="50" y="50" text-anchor="middle" fill="white" font-size="12">❌</text></svg>') + "')";
            item.removeAttribute('data-loading');
            if (loader) loader.style.display = 'none';
            resolve();
        };
        
        // Ajouter un timeout pour éviter les blocages
        setTimeout(() => {
            if (item.hasAttribute('data-loading')) {
                img.src = '';
                resolve();
            }
        }, 10000);
        
        img.src = item.dataset.src;
    });
}

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
    
    resetPagination();
    displayGalleries(descendants);
    
    // Charger les thumbnails pour ce dossier (seulement les 8 premières)
    const { loadThumbnailsForCollections } = await import('./app.js');
    const initialCollections = descendants.slice(0, currentDisplayCount);
    loadThumbnailsForCollections(initialCollections);
    
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
    resetPagination();
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

// Fonction pour réinitialiser la pagination
export function resetPagination() {
    currentDisplayCount = 8;
}

// Preloader intelligent pour les collections suivantes
function preloadNextBatch(galleries) {
    if (currentDisplayCount < galleries.length) {
        const nextBatch = galleries.slice(currentDisplayCount, currentDisplayCount + 4);
        setTimeout(() => {
            nextBatch.forEach(g => {
                if (g.thumbnails && g.thumbnails[0]) {
                    const img = new Image();
                    img.src = g.thumbnails[0]; // Preload juste la première image
                }
            });
        }, 2000); // Preload après 2 secondes
    }
}