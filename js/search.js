import { el, escapeHtml, escapeJs } from './utils.js';
import { 
    allGalleries, 
    allSearchableItems, 
    displayGalleries,
    selectGallery  // Importer depuis gallery.js
} from './gallery.js';

let searchTimeout;

export function initSearchAutocomplete() {
    console.log('🚀 Initialisation recherche');
    const searchInput = el('searchInput');
    const suggestionsBox = el('searchSuggestions');
    
    if (!searchInput) {
        console.error('❌ searchInput non trouvé');
        return;
    }

    console.log('✅ Elements trouvés');

    searchInput.addEventListener('input', (e) => {
        console.log('⌨️ Input event déclenché:', e.target.value);
        
        try {
            performSearchSimple(e.target.value, searchInput, suggestionsBox);
        } catch (error) {
            console.error('❌ Erreur dans input event:', error);
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query && query.length >= 2) {
                if (suggestionsBox) suggestionsBox.style.display = 'none';
                performFullSearch(query);
            }
        } else if (e.key === 'Escape') {
            clearTimeout(searchTimeout);
            searchInput.value = '';
            if (suggestionsBox) suggestionsBox.style.display = 'none';
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
        }
    });

    document.addEventListener('click', (e) => {
        if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}

function performSearchSimple(value, searchInput, suggestionsBox) {
    console.log('🔍 performSearch appelée avec:', value);
    const query = value.trim().toLowerCase();
    
    if (!query || query.length < 2) {
        console.log('🔍 Query trop courte, arrêt');
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        if (!query) {
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
        }
        return;
    }

    if (!Array.isArray(allSearchableItems)) {
        console.error('allSearchableItems n\'est pas un tableau');
        return;
    }

    console.log('📊 Nombre d\'éléments à filtrer:', allSearchableItems.length);

    try {
        const filteredItems = allSearchableItems
            .filter(g => {
                if (!g) return false;
                
                const name = (g.name || '').toLowerCase();
                const path = (g.path || '').toLowerCase();
                const id = String(g.id || '');
                
                return name.includes(query) || path.includes(query) || id.includes(query);
            })
            .slice(0, 8);

        console.log('✅ Éléments filtrés:', filteredItems.length);

        if (suggestionsBox) {
            if (filteredItems.length > 0) {
                let html = '';
                for (let index = 0; index < filteredItems.length; index++) {
                    const g = filteredItems[index];
                    if (!g) continue;
                    
                    let icon = '🖼️';
                    let countLabel = '';
                    
                    if (g.type === 'folder') {
                        icon = '📂';
                        const count = g.count || 0;
                        countLabel = `${count} collection${count > 1 ? 's' : ''}`;
                    } else if (g.type === 'collection') {
                        icon = '📸';
                        const count = parseInt(g.count) || 0;
                        countLabel = `${count} photo${count > 1 ? 's' : ''}`;
                    } else if (g.type === 'gallery') {
                        icon = '🎨';
                        const count = parseInt(g.count) || 0;
                        countLabel = `${count} photo${count > 1 ? 's' : ''}`;
                    } else if (g.type === 'album') {
                        icon = '📔';
                        const count = parseInt(g.count) || 0;
                        countLabel = `${count} photo${count > 1 ? 's' : ''}`;
                    }
                    
                    const safeName = escapeHtml(g.name || 'Sans nom');
                    
                    const itemHtml = `
                        <div class="suggestion-item" data-index="${index}" data-type="${g.type}" data-id="${g.id}" data-name="${safeName}">
                            <span class="suggestion-icon">${icon}</span>
                            <span class="suggestion-name">${safeName}</span>
                            <span class="suggestion-count">${countLabel}</span>
                        </div>
                    `;
                    
                    html += itemHtml;
                }

                suggestionsBox.innerHTML = html;
                addSafeSuggestionEventListeners(suggestionsBox, filteredItems);
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999;">Aucun résultat trouvé</div>';
                suggestionsBox.style.display = 'block';
            }
        }

        const filteredGalleries = filteredItems.filter(g => g && g.type !== 'folder');
        updateStats(filteredGalleries.length, query);
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#f00;">Erreur de recherche</div>';
        }
    }
}

function addSafeSuggestionEventListeners(suggestionsBox, filteredItems) {
    const suggestionItems = suggestionsBox.querySelectorAll('.suggestion-item[data-type]');
    
    suggestionItems.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const index = parseInt(item.dataset.index);
            const itemData = filteredItems[index];
            
            if (!itemData) {
                console.warn('❌ Données item non trouvées');
                return;
            }
            
            console.log('🎯 Clic sur:', itemData.name, 'Type:', itemData.type);
            
            // Nettoyer l'interface
            const searchInput = el('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            
            suggestionsBox.style.display = 'none';
            
            // Différencier le comportement selon le type
            try {
                if (itemData.type === 'folder') {
                    console.log('📂 Ouverture du folder:', itemData.name);
                    // Utiliser showFolder pour les dossiers
                    if (window.showFolder) {
                        window.showFolder(itemData.id, itemData.name);
                    } else {
                        // Import dynamique si nécessaire
                        import('./gallery.js').then(({ showFolder }) => {
                            showFolder(itemData.id, itemData.name);
                        });
                    }
                } else if (itemData.type === 'collection' || itemData.type === 'gallery' || itemData.type === 'album') {
                    console.log('📸 Ouverture de la galerie:', itemData.name);
                    // Ouvrir directement la galerie de photos
                    if (window.openGallery) {
                        window.openGallery(itemData.id, itemData.name);
                    } else {
                        console.error('❌ openGallery non disponible');
                    }
                } else {
                    console.log('❓ Type inconnu, utilisation de selectGallery');
                    // Fallback pour les autres types
                    selectGallery(itemData);
                }
            } catch (error) {
                console.error('❌ Erreur lors de l\'ouverture:', error);
            }
        });
    });
}

function performFullSearch(query) {
    if (!query || query.length < 2) return;
    
    const filteredItems = allSearchableItems
        .filter(g => {
            if (!g) return false;
            
            const name = (g.name || '').toLowerCase();
            const path = (g.path || '').toLowerCase();
            const id = String(g.id || '');
            
            return name.includes(query.toLowerCase()) || path.includes(query.toLowerCase()) || id.includes(query.toLowerCase());
        });

    const filteredGalleries = filteredItems.filter(g => g && g.type !== 'folder');
    
    displayGalleries(filteredGalleries);
    updateStats(filteredGalleries.length, query);
}

function updateStats(count, query = null) {
    const statsEl = el('stats');
    if (!statsEl) return;
    
    if (query) {
        const safeQuery = escapeHtml(query);
        statsEl.innerHTML = `${count} collection${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} pour "<strong>${safeQuery}</strong>"`;
    } else {
        statsEl.textContent = `${count} collection${count > 1 ? 's' : ''}`;
    }
}