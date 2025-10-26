import { el, escapeHtml, escapeJs } from './utils.js';
import { allGalleries, allSearchableItems, displayGalleries } from './gallery.js';

export function initSearchAutocomplete() {
    const searchInput = el('searchInput');
    const suggestionsBox = el('searchSuggestions');
    
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (!query || query.length < 2) {
            if (suggestionsBox) suggestionsBox.style.display = 'none';
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
            return;
        }

        const filteredItems = allSearchableItems.filter(g => 
            g.name.toLowerCase().includes(query) ||
            (g.path && g.path.toLowerCase().includes(query)) ||
            String(g.id).includes(query)
        );

        if (suggestionsBox && filteredItems.length > 0) {
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
                        <span class="suggestion-count">${g.count} photo${g.count > 1 ? 's' : ''}</span>
                    </div>
                `;
            }).join('');
            suggestionsBox.style.display = 'block';
        } else if (suggestionsBox) {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999;">Aucun résultat trouvé</div>';
            suggestionsBox.style.display = 'block';
        }

        const filteredGalleries = filteredItems.filter(g => g.type !== 'folder');
        displayGalleries(filteredGalleries);
        updateStats(filteredGalleries.length, query);
    });

    document.addEventListener('click', (e) => {
        if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            if (suggestionsBox) suggestionsBox.style.display = 'none';
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
        }
    });
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