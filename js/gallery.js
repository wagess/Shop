import { el, escapeHtml, escapeJs } from './utils.js';

// Configuration des thématiques favorites
const FAVORITE_FOLDERS = [
    { id: '67', name: 'Scènes de vie', icon: '⭐', type: 'collection' },
    { id: 'paysages', name: 'Paysages', icon: '🏔️', type: 'folder' },
    { id: 'portraits', name: 'Portraits', icon: '👤', type: 'folder' },
    { id: 'tango', name: 'Tango', icon: '🌿', type: 'folder' },
    { id: 'voyages', name: 'Voyages', icon: '🏙️', type: 'folder' },
];

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

    // À la fin de la fonction, après avoir créé les cartes
    // Recharger les thumbnails pour la nouvelle vue
    setTimeout(() => {
        if (window.reloadThumbnails) {
            window.reloadThumbnails();
        }
    }, 100);
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

    // Séparer favoris dossiers et collections
    const favoriteFolders = folders.filter(f => 
        FAVORITE_FOLDERS.some(fav => 
            fav.type === 'folder' && (
                fav.id.toString().toLowerCase() === f.id.toString().toLowerCase() || 
                fav.id.toLowerCase() === f.name?.toLowerCase()
            )
        )
    );
    
    const favoriteCollections = allGalleries.filter(g => 
        FAVORITE_FOLDERS.some(fav => 
            fav.type === 'collection' && (
                fav.id.toString() === g.id.toString() || 
                fav.id.toLowerCase() === g.name?.toLowerCase()
            )
        )
    );

    // HTML pour tous les dossiers
    const allFoldersHtml = `
        <div id="foldersList" style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">
            ${folders.map(f => `
                <button class="folder-link" data-id="${f.id}" data-name="${escapeHtml(f.name||'')}" data-type="folder"
                    style="padding:8px 12px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:white; cursor:pointer; transition: all 0.3s ease;"
                    onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
                    onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    📂 ${escapeHtml(f.name)}
                </button>
            `).join('')}
        </div>
    `;

    // HTML pour les favoris (dossiers + collections) avec icônes personnalisées
    const favoritesHtml = (favoriteFolders.length > 0 || favoriteCollections.length > 0) ? `
        <div id="favoritesList" style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">
            ${favoriteFolders.map(f => {
                const favConfig = FAVORITE_FOLDERS.find(fav => 
                    fav.type === 'folder' && (
                        fav.id.toString().toLowerCase() === f.id.toString().toLowerCase() || 
                        fav.id.toLowerCase() === f.name?.toLowerCase()
                    )
                );
                const icon = favConfig?.icon || '📂';
                const displayName = favConfig?.name || f.name;
                
                return `
                    <button class="favorite-item" data-id="${f.id}" data-name="${escapeHtml(f.name||'')}" data-type="folder"
                        style="padding:12px 16px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:white; cursor:pointer; transition: all 0.3s ease;"
                        onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
                        onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        ${icon} ${escapeHtml(displayName)}
                    </button>
                `;
            }).join('')}
            ${favoriteCollections.map(c => {
                const favConfig = FAVORITE_FOLDERS.find(fav => 
                    fav.type === 'collection' && (
                        fav.id.toString() === c.id.toString() || 
                        fav.id.toLowerCase() === c.name?.toLowerCase()
                    )
                );
                const icon = favConfig?.icon || '🎨';
                const displayName = favConfig?.name || c.name;
                
                return `
                    <button class="favorite-item" data-id="${c.id}" data-name="${escapeHtml(c.name||'')}" data-type="collection"
                        style="padding:12px 16px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:white; cursor:pointer; transition: all 0.3s ease;"
                        onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
                        onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        ${icon} ${escapeHtml(displayName)}
                    </button>
                `;
            }).join('')}
        </div>
    ` : '';
    
    // Afficher les favoris en haut
    if (containerTop) {
        containerTop.innerHTML = (favoriteFolders.length > 0 || favoriteCollections.length > 0) 
            ? `<div style="color:white; margin-bottom:16px; font-weight:bold;">Favoris :</div>${favoritesHtml}`
            : '';
    }
    
    // Afficher toutes les catégories en bas
    if (containerBottom) {
        containerBottom.innerHTML = `<div style="color:white; margin-bottom:8px; font-weight:bold;">Catégories :</div>${allFoldersHtml}`;
    }

    // Fonction pour gérer le clic selon le type
    function handleItemClick(btn) {
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || '';
        
        // Sauvegarder le contenu original
        const originalContent = btn.innerHTML;
        const originalStyle = btn.style.cssText;
        
        // Ajouter le spinner
        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                ${originalContent}
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        btn.style.pointerEvents = 'none';
        
        // Appeler la bonne fonction selon le type
        if (type === 'collection') {
            // Ouvrir directement l'album de la collection
            window.openGallery(id, name);
        } else {
            // Afficher le dossier
            showFolder(id, name);
        }
        
        // Restaurer le contenu original
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.cssText = originalStyle;
        }, 1500);
    }

    // Ajouter les événements
    document.querySelectorAll('#foldersList .folder-link').forEach(btn => {
        btn.addEventListener('click', () => handleItemClick(btn));
    });
    
    document.querySelectorAll('#favoritesList .favorite-item').forEach(btn => {
        btn.addEventListener('click', () => handleItemClick(btn));
    });
}

export async function showFolder(folderId, folderName) {
    console.log('🔍 Recherche du dossier:', folderId, 'Type:', typeof folderId);
    console.log('📊 Données hiérarchie disponibles:', !!hierarchyData);
    
    if (!hierarchyData) {
        console.error('❌ hierarchyData non définie');
        return alert('Données non chargées, veuillez rafraîchir la page');
    }
    
    // Chercher dans allGalleries d'abord (pour les dossiers qui sont aussi des collections)
    let node = allGalleries.find(g => String(g.id) === String(folderId));
    
    if (!node) {
        // Chercher dans la hiérarchie complète
        node = findNodeById(hierarchyData, folderId);
    }
    
    if (!node) {
        console.error('❌ Dossier introuvable avec ID:', folderId);
        console.log('🔎 Tous les IDs disponibles:');
        const allIds = getAllIdsFromNode(hierarchyData);
        console.table(allIds);
        
        // Chercher dans allGalleries aussi
        console.log('🔎 IDs dans allGalleries:', allGalleries.map(g => ({ id: g.id, name: g.name, type: g.type })));
        
        return alert(`Dossier introuvable (ID: ${folderId})`);
    }
    
    console.log('✅ Dossier trouvé:', node);
    
    // Si c'est un dossier avec des enfants
    let descendants = [];
    if (node.children && Array.isArray(node.children)) {
        descendants = extractGalleryIds(node).filter(n => n.id != null && n.type !== 'folder');
    } else if (node.type === 'folder') {
        // Chercher tous les éléments qui ont ce dossier comme parent
        descendants = allGalleries.filter(g => g.parentId === node.id || g.parent === node.id);
    } else {
        // Si c'est une galerie unique, l'afficher
        descendants = [node];
    }
    
    console.log('📦 Collections trouvées dans le dossier:', descendants);
    
    if (descendants.length === 0) {
        console.warn('⚠️ Aucune collection trouvée dans ce dossier');
        return alert(`Aucune collection trouvée dans "${folderName}"`);
    }
    
    displayGalleries(descendants, 1);
    
    // Charger les thumbnails pour ce dossier
    if (window.loadThumbnailsForCollections) {
        await window.loadThumbnailsForCollections(descendants);
    }
    
    const statsEl = el('stats');
    if (statsEl) statsEl.textContent = `${descendants.length} collection${descendants.length > 1 ? 's' : ''} dans "${folderName}"`;
    
    const existing = el('backToAll');
    if (existing) existing.remove();
    const container = el('galleriesContainer');
    if (container) {
        container.insertAdjacentHTML('afterend', `<div id="backToAll" style="margin:20px; padding:20px; text-align:center;"><a href="#" onclick="window.displayCollectionsView();return false;" style="color:white; text-decoration:underline; font-size:16px;">← Retour à l'accueil</a></div>`);
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
    
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function findNodeById(node, id) {
    if (!node) return null;
    
    // Gérer le cas où node est un tableau (racine de hierarchyData)
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findNodeById(item, id);
            if (found) return found;
        }
        return null;
    }
    
    // Conversion pour gérer les types différents
    const nodeId = String(node.id);
    const searchId = String(id);
    
    console.log('🔍 Comparaison:', nodeId, '===', searchId, '?', nodeId === searchId);
    
    if (node.id != null && nodeId === searchId) {
        console.log('✅ Nœud trouvé:', node);
        return node;
    }
    
    const childKeys = ['children', 'items', 'galleries', 'collections'];
    for (const k of childKeys) {
        if (node[k] && Array.isArray(node[k])) {
            for (const c of node[k]) {
                const found = findNodeById(c, id);
                if (found) return found;
            }
        }
    }
    return null;
}

export function selectGallery(selectedCollection) {
    console.log('🎯 Sélection de la collection:', selectedCollection.name);
    
    // Afficher la galerie sélectionnée
    displayGalleries([selectedCollection], 1);
    
    // Recharger les thumbnails pour cette galerie
    setTimeout(() => {
        if (window.loadThumbnailsForCollections) {
            window.loadThumbnailsForCollections([selectedCollection]);
        }
    }, 200);
    
    // Scroll vers les galeries
    setTimeout(() => {
        const container = el('galleriesContainer');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    // Mettre à jour les stats
    const statsEl = el('stats');
    if (statsEl) {
        statsEl.textContent = `1 collection sélectionnée`;
    }
    
    // Ajouter le bouton retour
    const existing = el('backToAll');
    if (existing) existing.remove();
    const container = el('galleriesContainer');
    if (container) {
        container.insertAdjacentHTML('afterend', `<div id="backToAll" style="margin:20px; padding:20px; text-align:center;"><a href="#" onclick="window.displayCollectionsView();return false;" style="color:white; text-decoration:underline; font-size:16px;">← Retour à l'accueil</a></div>`);
    }
}