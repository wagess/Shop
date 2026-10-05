import { el, escapeHtml } from './utils.js';
import { fetchHierarchy, fetchVisibilityConfig } from './api.js';
import { createNav } from './components/nav.js';
import { createFooter } from './components/footer.js';
import { createPhotosModal } from './components/photos-modal.js';
import { createBottomActionBar } from './components/bottom-action-bar.js';
import { createButton } from './components/button.js';
import { createActivityRing } from './components/activity-ring.js';
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
import { openGallery, closeModal, orderPrint, initModalListeners, displayPhotos, setCurrentPhotos, openLightbox } from './modal.js';
import { createMasonryGrid } from './components/masonry-grid.js';
import { fetchGalleryPhotos } from './api.js';
import { initSearchAutocomplete } from './search.js';  // Supprimer selectGallery d'ici
import { loadThumbnailsForCollections } from './thumbnails.js';
import { 
    loadRandomImage, 
    loadRandomImageFromCollectionByName 
} from './images.js';

// Expose global functions for onclick handlers
window.openGallery = function(id, name) {
    location.hash = `album-${id}`;
    return openGallery(id, name);
};
window.closeModal = function() {
    history.replaceState(null, '', location.pathname);
    return closeModal();
};
window.orderPrint = orderPrint;
window.showFolder = function(id, name) {
    location.hash = `folder-${id}`;
    return showFolder(id, name);
};
window.displayCollectionsView = function() {
    history.replaceState(null, '', location.pathname);
    return displayCollectionsView();
};
window.selectGallery = selectGallery;

// Variable globale pour stocker les collections - la rendre accessible globalement
let globalCollections = [];

window.createBottomActionBar = createBottomActionBar;

window.onload = () => {
    protectImages();
    mountHeader();
    mountFooter();
    mountPhotosModal();
    loadHierarchy();
};

function protectImages() {
    document.addEventListener('contextmenu', e => {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });
    document.addEventListener('dragstart', e => {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });
}

function mountHeader() {
    const mount = el('site-header-mount');
    if (!mount) return;

    mount.replaceWith(createNav());
}

function mountFooter() {
    const mount = document.getElementById('site-footer-mount');
    if (!mount) return;

    const footer = createFooter({
        brand: '© Stéphane Wagner',
        links: [
            { label: 'Photothèque',    href: '/phototheque.html' },
            { label: 'Portfolio',      href: 'https://www.photographie.stephanewagner.com/', external: true },
            { label: 'Stories',        href: '/stories/' },
            { label: 'Infolettre',     href: '/rejoindre/' },
            { label: 'Mur (prototype)', href: '/mur.html' },
            { label: 'Confidentialité', href: '/politique-confidentialite.html' },
            { label: 'Admin',          href: '/admin.html' },
        ],
    });

    mount.replaceWith(footer);
}

// Montée uniquement sur phototheque.html (seule page avec #photos-modal-mount
// — voir js/components/photos-modal.js pour le pourquoi de l'extraction).
function mountPhotosModal() {
    const mount = el('photos-modal-mount');
    if (!mount) return;

    mount.replaceWith(createPhotosModal());
}

async function loadVisibilityConfig() {
    try {
        return await fetchVisibilityConfig();
    } catch {
        return { collections: {}, folders: {} };
    }
}

function applyVisibility(collections, folders, config) {
    const isVisible = (type, id) => (config[type] || {})[String(id)] !== false;
    return {
        collections: collections.filter(c => isVisible('collections', c.id)),
        folders:     folders.filter(f => isVisible('folders', f.id)),
    };
}

async function loadHierarchy() {
    const hasGalleriesContainer = !!el('galleriesContainer');
    const hasFeaturedGrid = !!el('featuredPhotosGrid');
    if (!hasGalleriesContainer && !hasFeaturedGrid) return;

    try {
        const [hierarchyData, visibilityConfig] = await Promise.all([
            fetchHierarchy(),
            loadVisibilityConfig(),
        ]);
        
        const nodes = extractGalleryIds(hierarchyData);
        const allCollections = nodes.filter(n => n.id != null && n.type !== 'folder');
        const allFolders     = nodes.filter(n => n.type === 'folder');
        const { collections, folders } = applyVisibility(allCollections, allFolders, visibilityConfig);

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

        // Catalogue (grille, dossiers, recherche, vignettes) — uniquement
        // pertinent sur phototheque.html : sur l'accueil, #galleriesContainer
        // n'existe pas et ce travail (dont 8 appels réseau pour les vignettes)
        // ne servirait à rien.
        if (hasGalleriesContainer) {
            displayGalleries(shuffledCollections, 1);
            loadThumbnailsForCollections(shuffledCollections.slice(0, 8), reportThumbPreloadProgress);
            renderFolders(folders, visibilityConfig);
            initSearchAutocomplete();
            hideGalleriesLoader();
            restoreFromHash(shuffledCollections, hierarchyData);
        }
        initModalListeners();

        const featuredName = visibilityConfig.featured_collection || 'Scènes de vie';

        if (el('randomImage')) {
            await loadRandomImageFromCollectionByName(featuredName, globalCollections);
            updateImageInfo(featuredName);
        }

        // Album featured sur la page d'accueil
        const featuredGrid = el('featuredPhotosGrid');
        if (featuredGrid) {
            const collection = shuffledCollections.find(c =>
                c.name?.toLowerCase() === featuredName.toLowerCase()
            );
            if (collection) {
                const titleEl = el('featuredAlbumTitle');
                if (titleEl) titleEl.textContent = collection.name;
                try {
                    const photos = (await fetchGalleryPhotos(collection.id)).slice(0, 4);
                    setCurrentPhotos(photos);
                    const masonryGrid = createMasonryGrid({
                        photos,
                        gap: 8,
                        onPhotoClick: (photo, index) => {
                            const src   = photo.full_size || photo.url || photo.guid || photo.source_url || '';
                            const title = photo.title || photo.post_title || photo.name || '';
                            openLightbox(src, title, index);
                        },
                    });
                    featuredGrid.replaceChildren(masonryGrid);
                } catch (err) {
                    featuredGrid.innerHTML = `<div class="error-message p-5 m-5">Erreur chargement album : ${escapeHtml(err.message)}</div>`;
                }
            }
        }

    } catch (err) {
        console.error('loadHierarchy error', err);
        const errTarget = el('galleriesContainer') || el('featuredPhotosGrid');
        if (errTarget) errTarget.innerHTML = `<div class="error-message p-5 m-5">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

function restoreFromHash(collections, hierarchyData) {
    const hash = location.hash.slice(1); // retire le #
    if (!hash) return;

    const albumMatch = hash.match(/^album-(.+)$/);
    const folderMatch = hash.match(/^folder-(.+)$/);

    if (albumMatch) {
        const id = albumMatch[1];
        const gallery = collections.find(c => String(c.id) === id);
        if (gallery) openGallery(gallery.id, gallery.name);
    } else if (folderMatch) {
        const id = folderMatch[1];
        showFolder(id, '');
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

// Progression du préchargement des vignettes de couverture (Activity Ring) —
// la grille s'affiche tout de suite, cet anneau montre juste où en est le
// remplissage des mosaïques en arrière-plan (voir loadThumbnailsForCollections).
let thumbPreloadRingEl = null;

function reportThumbPreloadProgress(done, total) {
    const container = el('thumbPreloadRing');
    if (!container || total === 0) return;

    if (done >= total) {
        container.classList.add('is-hidden');
        return;
    }

    container.classList.remove('is-hidden');

    if (!thumbPreloadRingEl) {
        thumbPreloadRingEl = createActivityRing({
            size: 48,
            rings: [{ percentage: 0 }],
            className: 'activity-ring--sm',
        });
        container.replaceChildren(thumbPreloadRingEl);
    }
    const percentage = (done / total) * 100;
    thumbPreloadRingEl.update([{ percentage }], `${done}/${total}`);

    // Reflète la même progression dans chaque card encore en attente de sa
    // vignette (voir gallery.js — placeholder .gallery-icon--loading).
    document.querySelectorAll('.gallery-icon--loading .progress-bar').forEach(bar => {
        bar.update?.(percentage);
    });
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
        loadThumbnailsForCollections(visibleCollections, reportThumbPreloadProgress);
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