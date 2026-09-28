import { el, escapeHtml } from './utils.js';
import { fetchGalleryPhotos } from './api.js';

function updateOrderBtn(title, imageUrl, photoId) {
    const btn = document.getElementById('randomImageOrderBtn');
    if (!btn) return;
    btn.style.display = '';
    btn.onclick = (e) => {
        e.stopPropagation();
        window.openShopModal({ mode: 'unique', photo: { id: photoId, title, url: imageUrl } });
    };
}

/**
 * Charge une image aléatoire depuis WordPress
 */
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
        const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const path = `/wp-json/wplr-iptc/v1/random-image?size=large&t=${timestamp}`;
        const url = IS_LOCAL
            ? `/proxy.php?path=${encodeURIComponent(path)}`
            : `https://www.photographie.stephanewagner.com${path}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status, response.statusText);
            return;
        }
        
        const imageData = await response.json();
        console.log('📨 Image reçue:', imageData.title, imageData.url);
        
        if (imageData.url) {
            randomImageEl.onload = () => {
                console.log('✅ Image chargée avec succès');
                randomImageEl.classList.add('is-loaded');
                randomImageEl.parentElement?.classList.remove('shimmer');
            };

            randomImageEl.src = imageData.url;
            randomImageEl.alt = imageData.alt || imageData.title || 'Image aléatoire';
            updateOrderBtn(imageData.title || '', imageData.url, imageData.id);
        }
    } catch (err) {
        console.error('❌ Erreur:', err);
    }
}

/**
 * Charge une image aléatoire depuis une collection spécifique
 */
async function loadRandomImageFromCollection(collectionId) {
    const randomImageEl = el('randomImage');
    
    if (!randomImageEl) {
        console.error('❌ Element randomImage non trouvé dans le DOM');
        return;
    }

    console.log(`🔄 Chargement d'une image aléatoire de la collection ${collectionId}...`);

    try {
        const photos = await fetchGalleryPhotos(collectionId);
        
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            console.error('❌ Aucune photo trouvée dans cette collection');
            return;
        }

        const randomIndex = Math.floor(Math.random() * photos.length);
        const randomPhoto = photos[randomIndex];
        
        const imageUrl = randomPhoto.full_size || randomPhoto.url || randomPhoto.thumbnail;

        if (!imageUrl) {
            console.error('❌ Aucune URL d\'image trouvée pour cette photo');
            return;
        }

        console.log('📨 Photo aléatoire sélectionnée:', randomPhoto.title || randomPhoto.name);

        randomImageEl.onload = () => {
            console.log('✅ Image de collection chargée avec succès');
            randomImageEl.classList.add('is-loaded');
            randomImageEl.parentElement?.classList.remove('shimmer');
        };

        randomImageEl.onerror = () => {
            console.error('❌ Erreur de chargement de l\'image:', imageUrl);
        };

        randomImageEl.src = imageUrl;
        randomImageEl.alt = randomPhoto.alt || randomPhoto.title || randomPhoto.name || 'Image de collection';
        updateOrderBtn(randomPhoto.title || randomPhoto.name || '', imageUrl, randomPhoto.id);
        
        return randomPhoto;
        
    } catch (err) {
        console.error('❌ Erreur lors du chargement de l\'image de collection:', err);
    }
}

/**
 * Charge une image aléatoire d'une collection par son nom
 */
async function loadRandomImageFromCollectionByName(collectionName, collections) {
    console.log(`🔍 Recherche de la collection "${collectionName}"...`);
    console.log('📚 Collections disponibles:', collections.map(c => `"${c.name}"`).join(', '));
    
    if (!collections || collections.length === 0) {
        console.error('❌ Aucune collection disponible');
        return loadRandomImage();
    }
    
    // Recherche exacte d'abord
    let collection = collections.find(c => 
        c.name.toLowerCase() === collectionName.toLowerCase() ||
        c.title?.toLowerCase() === collectionName.toLowerCase()
    );
    
    // Si pas trouvé, recherche partielle
    if (!collection) {
        collection = collections.find(c => 
            c.name.toLowerCase().includes(collectionName.toLowerCase()) ||
            c.title?.toLowerCase().includes(collectionName.toLowerCase())
        );
    }
    
    if (!collection) {
        console.error(`❌ Collection "${collectionName}" non trouvée`);
        console.log('🔄 Fallback vers l\'image aléatoire WordPress...');
        return loadRandomImage();
    }
    
    console.log(`✅ Collection trouvée: "${collection.name}" (ID: ${collection.id})`);
    
    try {
        const photos = await fetchGalleryPhotos(collection.id);
        
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            console.error('❌ Aucune photo trouvée dans cette collection');
            return loadRandomImage();
        }

        const randomIndex = Math.floor(Math.random() * photos.length);
        const randomPhoto = photos[randomIndex];
        
        const imageUrl = randomPhoto.full_size || randomPhoto.url || randomPhoto.thumbnail;

        if (!imageUrl) {
            console.error('❌ Aucune URL d\'image trouvée pour cette photo');
            return loadRandomImage();
        }

        console.log('📨 Photo aléatoire sélectionnée:', randomPhoto.title || randomPhoto.name);

        const randomImageEl = el('randomImage');
        if (randomImageEl) {
            randomImageEl.onload = () => {
                console.log('✅ Image de collection chargée avec succès');
                randomImageEl.classList.add('is-loaded');
                randomImageEl.parentElement?.classList.remove('shimmer');
            };

            randomImageEl.src = imageUrl;
            randomImageEl.alt = randomPhoto.alt || randomPhoto.title || randomPhoto.name || 'Image de collection';
            updateOrderBtn(randomPhoto.title || randomPhoto.name || '', imageUrl, randomPhoto.id);
        }
        
        return randomPhoto;
        
    } catch (err) {
        console.error('❌ Erreur lors du chargement de l\'image de collection:', err);
        return loadRandomImage();
    }
}

export {
    loadRandomImage,
    loadRandomImageFromCollection,
    loadRandomImageFromCollectionByName
};