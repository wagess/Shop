import { fetchGalleryPhotos } from './api.js';
import { escapeHtml } from './utils.js';

/**
 * Charge les thumbnails pour les collections visibles
 */
async function loadThumbnailsForCollections(collections) {
    const visibleCollections = collections.slice(0, 8);
    
    for (const collection of visibleCollections) {
        try {
            const photos = await fetchGalleryPhotos(collection.id);
            
            if (photos && Array.isArray(photos) && photos.length > 0) {
                collection.thumbnails = photos.slice(0, 4).map(photo => 
                    photo.thumbnail || photo.thumb || photo.url_thumb || photo.sizes?.thumbnail || photo.url
                );
                
                updateCollectionThumbnails(collection);
            }
        } catch (err) {
            console.error(`Erreur chargement thumbnails pour ${collection.name}:`, err);
        }
    }
    
    console.log('✅ Thumbnails chargés pour les premières collections');
}

/**
 * Met à jour l'affichage des thumbnails d'une collection
 */
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
    
    setTimeout(() => {
        const mosaic = cover.querySelector('.gallery-mosaic');
        if (mosaic) mosaic.style.opacity = '1';
    }, 10);
}

export {
    loadThumbnailsForCollections,
    updateCollectionThumbnails
};