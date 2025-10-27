import { el, escapeHtml, escapeJs } from './utils.js';
import { allGalleries, allSearchableItems, displayGalleries } from './gallery.js';

let searchTimeout;

export function initSearchAutocomplete() {
    const searchInput = el('searchInput');
    const suggestionsBox = el('searchSuggestions');
    
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        // Annulez la recherche précédente pour éviter l'accumulation
        clearTimeout(searchTimeout);
        
        // Débounce de 200ms
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value, searchInput, suggestionsBox);
        }, 200);
    });

    document.addEventListener('click', (e) => {
        if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearTimeout(searchTimeout);
            searchInput.value = '';
            if (suggestionsBox) suggestionsBox.style.display = 'none';
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
        }
    });
}

function performSearch(value, searchInput, suggestionsBox) {
    const query = value.trim().toLowerCase();
    
    // Recherche vide ou trop courte
    if (!query || query.length < 2) {
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        displayGalleries(allGalleries);
        updateStats(allGalleries.length);
        return;
    }

    // Vérification de sécurité
    if (!Array.isArray(allSearchableItems)) {
        console.error('allSearchableItems n\'est pas un tableau');
        return;
    }

    try {
        // Filtrage avec protection
        const filteredItems = allSearchableItems.filter(g => {
            if (!g) return false;
            
            const name = (g.name || '').toLowerCase();
            const path = (g.path || '').toLowerCase();
            const id = String(g.id || '');
            
            return name.includes(query) || path.includes(query) || id.includes(query);
        });

        // Mise à jour des suggestions
        if (suggestionsBox) {
            if (filteredItems.length > 0) {
                // Limitez à 8 résultats pour éviter le freeze DOM
                suggestionsBox.innerHTML = filteredItems.slice(0, 8).map(g => {
                    let icon = '🖼️';
                    if (g.type === 'folder') icon = '📂';
                    else if (g.type === 'collection') icon = '📸';
                    else if (g.type === 'gallery') icon = '🎨';
                    else if (g.type === 'album') icon = '📔';
                    
                    const action = g.type === 'folder' 
                        ? `window.showFolder('${g.id}', '${escapeJs(g.name)}')` 
                        : `window.selectGallery(${g.id}, '${escapeJs(g.name)}')`;
                    
                    return `
                        <div class="suggestion-item" onclick="${action}">
                            <span class="suggestion-icon">${icon}</span>
                            <span class="suggestion-name">${escapeHtml(g.name)}</span>
                            <span class="suggestion-count">${g.count || 0} photo${(g.count || 0) > 1 ? 's' : ''}</span>
                        </div>
                    `;
                }).join('');
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999;">Aucun résultat trouvé</div>';
                suggestionsBox.style.display = 'block';
            }
        }

        // Filtrage final pour l'affichage
        const filteredGalleries = filteredItems.filter(g => g && g.type !== 'folder');
        displayGalleries(filteredGalleries);
        updateStats(filteredGalleries.length, query);
        
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#f00;">Erreur de recherche</div>';
        }
    }
}

export function selectGallery(galleryId, galleryName) {
    const suggestionsBox = el('searchSuggestions');
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    const searchInput = el('searchInput');
    if (searchInput) searchInput.value = '';
    window.openGallery(galleryId, galleryName);
}

function updateStats(count, query = null) {
    const statsEl = el('stats');
    if (!statsEl) return;
    
    if (query) {
        statsEl.innerHTML = `${count} collection${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} pour "<strong>${escapeHtml(query)}</strong>"`;
    } else {
        statsEl.textContent = `${count} collection${count > 1 ? 's' : ''}`;
    }
}