import { el, escapeHtml } from './utils.js';
import { fetchHierarchy } from './api.js';
import { createHeader } from './components/header.js';
import { createFooter } from './components/footer.js';
import { createBottomActionBar } from './components/bottom-action-bar.js';
import { createButton } from './components/button.js';
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

    // Bouton Spotify (action slot)
    const spotifyBtn = document.createElement('button');
    spotifyBtn.id = 'spotifyNavBtn';
    spotifyBtn.title = 'Écouter ma playlist';
    spotifyBtn.className = 'btn-secondary btn-sm site-header__spotify';
    spotifyBtn.innerHTML = `
        <svg id="spotifyNavIcon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1"/>
        </svg>`;

    // Bouton triptyque (action slot)
    const triptyqueBtn = document.createElement('button');
    triptyqueBtn.id = 'triptyque-cart';
    triptyqueBtn.className = 'triptyque-cart';
    triptyqueBtn.setAttribute('aria-label', 'Triptyque');
    triptyqueBtn.setAttribute('onclick', 'window.openTriptyqueModal()');
    triptyqueBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2"/>
            <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
        <span id="triptyque-badge" class="triptyque-cart__badge">0</span>`;

    const header = createHeader({
        logo: {
            src: './assets/svg/Stéphane Wagner.svg',
            alt: 'Logo Stéphane Wagner',
            href: '/',
        },
        links: [
            { label: 'Photothèque', href: '/phototheque.html', badge: '', badgeId: 'stats' },
            { label: 'Portfolio',   href: 'https://www.photographie.stephanewagner.com/', },
            { label: 'Stories',     href: '/stories/' },
            { label: 'Infolettre',  href: '/rejoindre/' },
        ],
        actions: [spotifyBtn, triptyqueBtn],
        type: 'desktop',
    });

    mount.replaceWith(header);
}

function mountFooter() {
    const mount = document.getElementById('site-footer-mount');
    if (!mount) return;

    const footer = createFooter({
        brand: '© Stéphane Wagner',
        links: [
            { label: 'Photothèque',  href: '/phototheque.html' },
            { label: 'Portfolio',    href: 'https://www.photographie.stephanewagner.com/', external: true },
            { label: 'Stories',      href: '/stories/' },
            { label: 'Infolettre',   href: '/rejoindre/' },
            { label: 'Admin',        href: '/admin.html' },
        ],
    });

    mount.replaceWith(footer);
}

async function loadVisibilityConfig() {
    try {
        const resp = await fetch('./collections-visibility.json');
        if (resp.ok) return await resp.json();
    } catch {}
    return { collections: {}, folders: {} };
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
        
        console.log('🔍 Hierarchy brute:', JSON.stringify(hierarchyData, null, 2));
        
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

        displayGalleries(shuffledCollections, 1);
        loadThumbnailsForCollections(shuffledCollections.slice(0, 8));
        renderFolders(folders);
        initSearchAutocomplete();
        initModalListeners();

        hideGalleriesLoader();
        restoreFromHash(shuffledCollections, hierarchyData);

        if (el('randomImage')) {
            await loadRandomImageFromCollectionByName("Scènes de vie", globalCollections);
            setTimeout(() => { updateImageInfo("Scènes de vie"); }, 1000);
        }

        // Album featured sur la page d'accueil
        const featuredGrid = el('featuredPhotosGrid');
        if (featuredGrid) {
            const featuredName = visibilityConfig.featured_collection || 'Scènes de vie';
            const collection = shuffledCollections.find(c =>
                c.name?.toLowerCase() === featuredName.toLowerCase()
            );
            if (collection) {
                const titleEl = el('featuredAlbumTitle');
                if (titleEl) titleEl.textContent = collection.name;
                try {
                    const photos = (await fetchGalleryPhotos(collection.id)).slice(0, 9);
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