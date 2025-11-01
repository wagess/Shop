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

// Variable globale pour stocker les collections
let globalCollections = [];

window.onload = () => {
    loadHierarchy();
    
    // Attendre un petit délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        loadRandomImage();
    }, 100);
};

async function loadHierarchy() {
    const container = el('galleriesContainer');
    if (!container) return;

    try {
        const hierarchyData = await fetchHierarchy();
        
        console.log('🔍 Hierarchy brute:', JSON.stringify(hierarchyData, null, 2));
        
        const nodes = extractGalleryIds(hierarchyData);
        const collections = nodes.filter(n => n.id != null && n.type !== 'folder');
        const folders = nodes.filter(n => n.type === 'folder');

        globalCollections = collections;

        setHierarchyData(hierarchyData);
        setAllGalleries(collections);
        setAllSearchableItems(nodes.filter(n => n.id != null));

        const statsEl = el('stats');
        if (statsEl) statsEl.textContent = `${collections.length} collection${collections.length > 1 ? 's' : ''}`;

        displayGalleries(collections);
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
    
    console.log('✅ Tous les thumbnails sont chargés');
}

function updateRandomImage(imageUrl, collectionName) {
    const randomImageEl = el('randomImage');
    if (!randomImageEl) return;
    
    randomImageEl.style.opacity = '0';
    
    randomImageEl.onload = () => {
        randomImageEl.style.opacity = '1';
    };
    
    randomImageEl.src = imageUrl;
    randomImageEl.alt = `Image de ${collectionName}`;
}

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

async function loadRandomImage() {
    const randomImageEl = el('randomImage');
    console.log('🔍 Element randomImage trouvé:', !!randomImageEl);
    
    if (!randomImageEl) {
        console.error('❌ Element randomImage non trouvé dans le DOM');
        return;
    }

    console.log('🔄 Chargement d\'une image aléatoire...');

    try {
        const timestamp = Date.now();
        // Changer l'URL pour pointer vers votre WordPress
        const wordpressUrl = 'https://www.photographie.stephanewagner.com'; // ou l'URL de votre WordPress
        const response = await fetch(`${wordpressUrl}/wp-json/wplr-iptc/v1/random-image?size=large&t=${timestamp}`);
        
        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status, response.statusText);
            return;
        }
        
        const imageData = await response.json();
        console.log('📨 Image reçue:', imageData.title, imageData.url);
        
        if (imageData.url) {
            updateBackgroundImage(imageData.url);
            
            randomImageEl.style.opacity = '0.3';
            
            randomImageEl.onload = () => {
                console.log('✅ Image chargée avec succès');
                randomImageEl.style.opacity = '1';
            };
            
            randomImageEl.src = imageData.url;
            randomImageEl.alt = imageData.alt || imageData.title || 'Image aléatoire';
        }
    } catch (err) {
        console.error('❌ Erreur:', err);
    }
}

function updateBackgroundImage(imageUrl) {
    // Mettre à jour le background du body::before
    const style = document.createElement('style');
    style.textContent = `
        body::before {
            background-image: url('${imageUrl}') !important;
        }
    `;
    
    // Supprimer l'ancien style s'il existe
    const oldStyle = document.getElementById('dynamic-background');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'dynamic-background';
    document.head.appendChild(style);
}

// Exposer les fonctions globalement
window.loadRandomImage = loadRandomImage;
window.loadThumbnailsForCollections = loadThumbnailsForCollections;

// Export pour les modules ES6
export { loadThumbnailsForCollections, updateCollectionThumbnails };