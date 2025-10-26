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
        renderFolders(folders);
        initSearchAutocomplete();
        initModalListeners();
    } catch (err) {
        console.error('loadHierarchy error', err);
        if (container) container.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}