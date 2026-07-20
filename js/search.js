import { el, escapeHtml, escapeJs } from './utils.js';
import {
    allGalleries,
    allSearchableItems,
    displayGalleries,
    selectGallery  // Importer depuis gallery.js
} from './gallery.js';
import { createDropdown } from './components/dropdown.js';

let searchTimeout;

export function initSearchAutocomplete() {
    console.log('🚀 Initialisation recherche');
    const searchInput = el('searchInput');
    const suggestionsBox = el('searchSuggestions');
    
    if (!searchInput) {
        console.error('❌ searchInput non trouvé');
        return;
    }

    // Ajouter l'événement de scroll sur focus pour mobile
    searchInput.addEventListener('focus', () => {
        // Vérifier si on est en mobile (largeur d'écran < 768px)
        if (window.innerWidth < 768) {
            const searchContainer = searchInput.closest('.search-container-modern');
            if (searchContainer) {
                setTimeout(() => {
                    searchContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 100); // Petit délai pour laisser le clavier mobile s'ouvrir
            }
        }
    });

    // Corriger le placement de searchSuggestions si nécessaire
    if (suggestionsBox) {
        const wrapper = searchInput.closest('.search-input-wrapper');
        const container = searchInput.closest('.search-input-container');
        
        if (wrapper && container && container.contains(suggestionsBox)) {
            // Déplacer searchSuggestions au bon niveau
            wrapper.appendChild(suggestionsBox);
        }
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
                const items = filteredItems.map((g, index) => {
                    if (!g) return null;

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

                    return {
                        label: g.name || 'Sans nom',
                        sublabel: countLabel,
                        avatar: `<span style="font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">${icon}</span>`,
                        active: index === 0,
                        onClick: () => _handleSuggestionClick(g, suggestionsBox),
                    };
                }).filter(Boolean);

                suggestionsBox.innerHTML = '';
                suggestionsBox.appendChild(createDropdown({ items }));
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = '';
                suggestionsBox.appendChild(createDropdown({
                    items: [{ label: 'Aucun résultat trouvé', sublabel: '' }],
                }));
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

function _handleSuggestionClick(itemData, suggestionsBox) {
    const searchInput = el('searchInput');
    if (searchInput) searchInput.value = '';
    suggestionsBox.style.display = 'none';

    try {
        if (itemData.type === 'folder') {
            if (window.showFolder) {
                window.showFolder(itemData.id, itemData.name);
            } else {
                import('./gallery.js').then(({ showFolder }) => showFolder(itemData.id, itemData.name));
            }
        } else if (itemData.type === 'collection' || itemData.type === 'gallery' || itemData.type === 'album') {
            if (window.openGallery) {
                window.openGallery(itemData.id, itemData.name);
            }
        } else {
            selectGallery(itemData);
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture:', error);
    }
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