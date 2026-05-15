import { el, escapeHtml } from './utils.js';
import { fetchHierarchy } from './api.js';
import { 
    extractGalleryIds, 
    displayGalleries, 
    renderFolders,
    setHierarchyData,
    setAllGalleries,
    setAllSearchableItems,
    showFolder,
    displayCollectionsView,
    findNodeById,
    selectGallery  // Importer selectGallery depuis gallery.js
} from './gallery.js';
import { openGallery, closeModal, orderPrint, initModalListeners, displayPhotos } from './modal.js';
import { fetchGalleryPhotos } from './api.js';
import { initSearchAutocomplete } from './search.js';  // Supprimer selectGallery d'ici
import { loadThumbnailsForCollections } from './thumbnails.js';
import { 
    loadRandomImage, 
    loadRandomImageFromCollectionByName 
} from './images.js';

// Expose global functions for onclick handlers
window.openGallery = openGallery;
window.closeModal = closeModal;
window.orderPrint = orderPrint;
window.showFolder = showFolder;
window.displayCollectionsView = displayCollectionsView;
window.selectGallery = selectGallery;

// Variable globale pour stocker les collections - la rendre accessible globalement
let globalCollections = [];

window.onload = () => {
    loadHierarchy();
};

async function loadHierarchy() {
    const hasGalleriesContainer = !!el('galleriesContainer');
    const hasFeaturedGrid = !!el('featuredPhotosGrid');
    if (!hasGalleriesContainer && !hasFeaturedGrid) return;

    try {
        const hierarchyData = await fetchHierarchy();
        
        console.log('🔍 Hierarchy brute:', JSON.stringify(hierarchyData, null, 2));
        
        const nodes = extractGalleryIds(hierarchyData);
        const collections = nodes.filter(n => n.id != null && n.type !== 'folder');
        const folders = nodes.filter(n => n.type === 'folder');

        // Calculer le count pour chaque folder directement depuis hierarchyData
        folders.forEach(folder => {
            const folderNode = findNodeById(hierarchyData, folder.id);
            if (folderNode) {
                const descendants = extractGalleryIds(folderNode).filter(n => n.id != null && n.type !== 'folder');
                folder.count = descendants.length;
                console.log(`📂 Folder "${folder.name}" contient ${folder.count} collections`);
            }
        });

        const shuffledCollections = shuffleArray([...collections]);
        globalCollections = shuffledCollections;

        // Rendre globalCollections accessible partout
        window.globalCollections = globalCollections;

        setHierarchyData(hierarchyData);
        setAllGalleries(shuffledCollections);
        setAllSearchableItems([...shuffledCollections, ...folders]);

        const statsEl = el('stats');
        if (statsEl) statsEl.textContent = `${shuffledCollections.length} collection${shuffledCollections.length > 1 ? 's' : ''}`;

        displayGalleries(shuffledCollections, 1);
        loadThumbnailsForCollections(shuffledCollections.slice(0, 8));
        renderFolders(folders);
        initSearchAutocomplete();
        initModalListeners();

        hideGalleriesLoader();

        if (el('randomImage')) {
            await loadRandomImageFromCollectionByName("Scènes de vie", globalCollections);
            setTimeout(() => { updateImageInfo("Scènes de vie"); }, 1000);
        }

        // Album featured sur la page d'accueil
        const featuredGrid = el('featuredPhotosGrid');
        if (featuredGrid) {
            const FEATURED_ALBUM_NAME = 'Scènes de vie';
            const collection = shuffledCollections.find(c => c.name === FEATURED_ALBUM_NAME);
            if (collection) {
                try {
                    const photos = (await fetchGalleryPhotos(collection.id)).slice(0, 6);
                    await displayPhotos(photos, featuredGrid);
                } catch (err) {
                    featuredGrid.innerHTML = `<div class="error-message">Erreur chargement album : ${escapeHtml(err.message)}</div>`;
                }
            }
        }

    } catch (err) {
        console.error('loadHierarchy error', err);
        const errTarget = el('galleriesContainer') || el('featuredPhotosGrid');
        if (errTarget) errTarget.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function hideGalleriesLoader() {
    const loader = document.getElementById('galleriesLoader') || document.querySelector('.right-panel .loading');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Fonction pour recharger les thumbnails après un changement de vue
function reloadThumbnails() {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const visibleCollections = [];
    
    galleryCards.forEach((card, index) => {
        const galleryId = card.dataset.galleryId;
        const collection = globalCollections.find(c => c.id == galleryId);
        if (collection && index < 8) { // Limiter aux 8 premiers visibles
            visibleCollections.push(collection);
        }
    });
    
    console.log('🔄 Rechargement thumbnails pour:', visibleCollections.map(c => c.name));
    if (visibleCollections.length > 0) {
        loadThumbnailsForCollections(visibleCollections);
    }
}

// Nouvelle fonction pour mettre à jour les informations de l'image
function updateImageInfo(collectionName) {
    const imageInfo = document.getElementById('imageInfo');
    const collectionNameEl = document.getElementById('collectionName');
    
    console.log('📝 Tentative mise à jour info image:', { collectionName });
    
    if (imageInfo && collectionNameEl) {
        collectionNameEl.textContent = 'Collection : ' + collectionName;
        
        // Forcer l'affichage
        imageInfo.style.display = 'block';
        imageInfo.style.visibility = 'visible';
        imageInfo.style.opacity = '1';
        
        console.log('✅ Informations mises à jour');
    } else {
        console.error('❌ Éléments non trouvés:', { imageInfo, collectionNameEl });
    }
}

// Exposer les nouvelles fonctions globalement
window.loadRandomImageFromCollectionByName = async (name) => {
    try {
        const result = await loadRandomImageFromCollectionByName(name, globalCollections);
        // Afficher seulement le nom de la collection
        updateImageInfo(name);
    } catch (error) {
        console.error('Erreur lors du chargement de l\'image:', error);
    }
};

// Exposer la fonction updateImageInfo globalement
window.updateImageInfo = updateImageInfo;

window.reloadThumbnails = reloadThumbnails;
window.loadThumbnailsForCollections = loadThumbnailsForCollections;