import { el, escapeHtml } from './utils.js';
import { fetchHierarchy, fetchGalleryPhotos } from './api.js';
import { 
    extractGalleryIds, 
    displayGalleries, 
    renderFolders,
    setHierarchyData,
    setAllGalleries,
    setAllSearchableItems,
    showFolder,
    displayCollectionsView
} from './gallery.js';
import { openGallery, closeModal, orderPrint, initModalListeners } from './modal.js';
import { initSearchAutocomplete, selectGallery } from './search.js';

// Expose global functions for onclick handlers
window.openGallery = openGallery;
window.closeModal = closeModal;
window.orderPrint = orderPrint;
window.showFolder = showFolder;
window.displayCollectionsView = displayCollectionsView;
window.selectGallery = selectGallery;

window.onload = () => loadHierarchy();

async function loadHierarchy() {
    const container = el('galleriesContainer');
    if (!container) return;

    try {
        const hierarchyData = await fetchHierarchy();
        
        console.log('🔍 Hierarchy brute:', JSON.stringify(hierarchyData, null, 2));
        
        const nodes = extractGalleryIds(hierarchyData);
        
        console.log('📋 Tous les nodes:', nodes);
        console.log('📂 Folders:', nodes.filter(n => n.type === 'folder'));
        console.log('📁 Collections:', nodes.filter(n => n.type === 'collection'));
        
        const collections = nodes.filter(n => n.id != null && n.type !== 'folder');
        const folders = nodes.filter(n => n.type === 'folder');

        setHierarchyData(hierarchyData);
        setAllGalleries(collections);
        setAllSearchableItems(nodes.filter(n => n.id != null));

        const statsEl = el('stats');
        if (statsEl) statsEl.textContent = `${collections.length} collection${collections.length > 1 ? 's' : ''}`;

        displayGalleries(collections);
        
        // Charger les thumbnails pour chaque collection
        loadThumbnailsForCollections(collections);
        
        renderFolders(folders);
        initSearchAutocomplete();
        initModalListeners();
    } catch (err) {
        console.error('loadHierarchy error', err);
        if (container) container.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

async function loadThumbnailsForCollections(collections) {
    for (const collection of collections) {
        try {
            const photos = await fetchGalleryPhotos(collection.id);
            
            if (photos && Array.isArray(photos) && photos.length > 0) {
                // Extraire les URLs des thumbnails
                collection.thumbnails = photos.slice(0, 4).map(photo => 
                    photo.thumbnail || photo.thumb || photo.url_thumb || photo.sizes?.thumbnail || photo.url
                );
                
                // Mettre à jour l'affichage de cette collection
                updateCollectionThumbnails(collection);
            }
        } catch (err) {
            console.error(`Erreur chargement thumbnails pour ${collection.name}:`, err);
        }
    }
}

// Exporter pour pouvoir être utilisée depuis gallery.js
export { loadThumbnailsForCollections };

function updateCollectionThumbnails(collection) {
    if (!collection.thumbnails || collection.thumbnails.length === 0) return;
    
    const card = document.querySelector(`.gallery-card[onclick*="openGallery(${collection.id}"]`);
    if (!card) return;
    
    const cover = card.querySelector('.gallery-cover');
    if (!cover) return;
    
    const thumbs = collection.thumbnails.slice(0, 4);
    cover.innerHTML = `
        <div class="gallery-mosaic" style="opacity: 0; transition: opacity 0.5s ease-in;">
            ${thumbs.map(thumb => `
                <div class="mosaic-item" style="background-image: url('${escapeHtml(thumb)}')"></div>
            `).join('')}
        </div>
    `;
    
    // Déclencher le fade-in après un court délai
    setTimeout(() => {
        const mosaic = cover.querySelector('.gallery-mosaic');
        if (mosaic) mosaic.style.opacity = '1';
    }, 10);
}