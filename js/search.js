import { el, escapeHtml, escapeJs } from './utils.js';
import { allGalleries, allSearchableItems, displayGalleries } from './gallery.js';

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

    // Ajoutons un événement pour la recherche complète (Entrée)
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

// Remplaçons performSearchSimple par la vraie fonction
function performSearchSimple(value, searchInput, suggestionsBox) {
    console.log('🔍 performSearch appelée avec:', value);
    const query = value.trim().toLowerCase();
    
    // Recherche vide ou trop courte
    if (!query || query.length < 2) {
        console.log('🔍 Query trop courte, arrêt');
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        // Remettons l'affichage complet seulement si la recherche est complètement vide
        if (!query) {
            displayGalleries(allGalleries);
            updateStats(allGalleries.length);
        }
        return;
    }

    // Vérification de sécurité
    if (!Array.isArray(allSearchableItems)) {
        console.error('allSearchableItems n\'est pas un tableau');
        return;
    }

    console.log('📊 Nombre d\'éléments à filtrer:', allSearchableItems.length);

    try {
        // Filtrage avec protection et limitation stricte
        const filteredItems = allSearchableItems
            .filter(g => {
                if (!g) return false;
                
                const name = (g.name || '').toLowerCase();
                const path = (g.path || '').toLowerCase();
                const id = String(g.id || '');
                
                return name.includes(query) || path.includes(query) || id.includes(query);
            })
            .slice(0, 8); // Limitons à 8 résultats

        console.log('✅ Éléments filtrés:', filteredItems.length);

        // Mise à jour des suggestions avec protection
        if (suggestionsBox) {
            if (filteredItems.length > 0) {
                console.log('🎨 Génération HTML suggestions...');
                
                // Remplaçons le .map() par une boucle for plus sûre
                let html = '';
                for (let index = 0; index < filteredItems.length; index++) {
                    console.log(`🔄 Traitement élément ${index}`);
                    
                    const g = filteredItems[index];
                    if (!g) {
                        console.warn(`⚠️ Élément ${index} est null/undefined`);
                        continue;
                    }
                    
                    console.log(`🏷️ Nom: "${g.name}", Type: "${g.type}"`);
                    
                    let icon = '🖼️';
                    if (g.type === 'folder') icon = '📂';
                    else if (g.type === 'collection') icon = '📸';
                    else if (g.type === 'gallery') icon = '🎨';
                    else if (g.type === 'album') icon = '📔';
                    
                    console.log(`🔧 Icon choisi: ${icon}`);
                    
                    // Protection contre les noms problématiques
                    let safeName;
                    try {
                        safeName = (g.name || 'Sans nom').toString().replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        console.log(`✅ SafeName: "${safeName}"`);
                    } catch (error) {
                        console.error(`❌ Erreur lors du traitement du nom:`, error);
                        safeName = 'Nom invalide';
                    }
                    
                    console.log(`🏗️ Génération HTML pour ${index}...`);
                    
                    const itemHtml = `
                        <div class="suggestion-item" data-index="${index}" data-type="${g.type}" data-id="${g.id}" data-name="${safeName}">
                            <span class="suggestion-icon">${icon}</span>
                            <span class="suggestion-name">${safeName}</span>
                            <span class="suggestion-count">${g.count || 0} photo${(g.count || 0) > 1 ? 's' : ''}</span>
                        </div>
                    `;
                    
                    html += itemHtml;
                    console.log(`✅ HTML généré pour élément ${index}`);
                }

                console.log('📝 HTML complet généré, longueur:', html.length);
                suggestionsBox.innerHTML = html;
                
                // Event listeners sécurisés
                addSafeSuggestionEventListeners(suggestionsBox, filteredItems);
                
                suggestionsBox.style.display = 'block';
                console.log('✅ Suggestions affichées');
            } else {
                suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999;">Aucun résultat trouvé</div>';
                suggestionsBox.style.display = 'block';
            }
        }

        // NE METTONS PLUS À JOUR L'AFFICHAGE DES GALERIES ICI
        // L'affichage ne se fera que lors d'un clic sur une suggestion
        
        // Mettons à jour seulement les stats pour indiquer le nombre de résultats
        const filteredGalleries = filteredItems.filter(g => g && g.type !== 'folder');
        console.log('🖼️ Galeries trouvées:', filteredGalleries.length);
        updateStats(filteredGalleries.length, query);
        
        console.log('🏁 Recherche terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#f00;">Erreur de recherche</div>';
        }
    }
}

// Nouvelle fonction pour les event listeners sécurisés
function addSafeSuggestionEventListeners(suggestionsBox, filteredItems) {
    console.log('🎯 Début addSafeSuggestionEventListeners');
    console.log('📋 filteredItems reçus:', filteredItems);
    
    const suggestionItems = suggestionsBox.querySelectorAll('.suggestion-item[data-type]');
    console.log('🎯 Nombre d\'éléments trouvés:', suggestionItems.length);
    
    suggestionItems.forEach((item, idx) => {
        console.log(`🔗 Ajout listener sur élément ${idx}`);
        
        item.addEventListener('click', (e) => {
            console.log(`🖱️ DEBUT clic sur élément ${idx}`);
            
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ preventDefault/stopPropagation OK`);
            
            const index = parseInt(item.dataset.index);
            console.log(`🖱️ Index récupéré:`, index);
            
            const itemData = filteredItems[index];
            console.log(`🖱️ ItemData:`, itemData);
            
            if (!itemData) {
                console.warn('❌ Données item non trouvées');
                return;
            }
            
            console.log('🖱️ Nom item:', itemData.name);
            
            // Nettoyer l'interface IMMÉDIATEMENT
            console.log('🧹 Début nettoyage interface...');
            const searchInput = el('searchInput');
            console.log('🧹 searchInput trouvé:', !!searchInput);
            
            if (searchInput) {
                searchInput.value = '';
                console.log('🧹 searchInput vidé');
            }
            
            suggestionsBox.style.display = 'none';
            console.log('🧹 suggestionsBox caché');
            
            // Remettons les vrais appels de fonctions
            console.log('🚀 Appel des vraies fonctions...');
            try {
                if (itemData.type === 'folder') {
                    console.log('📂 Ouverture dossier:', itemData.name);
                    if (typeof window.showFolder === 'function') {
                        window.showFolder(itemData.id, itemData.name);
                    } else {
                        console.error('❌ window.showFolder n\'est pas une fonction');
                    }
                } else {
                    console.log('🎨 Ouverture galerie:', itemData.name);
                    if (typeof window.openGallery === 'function') {
                        window.openGallery(itemData.id, itemData.name);
                    } else {
                        console.error('❌ window.openGallery n\'est pas une fonction');
                    }
                }
            } catch (error) {
                console.error('❌ Erreur lors de l\'ouverture:', error);
            }
            
            console.log('🏁 FIN du clic');
        });
        
        console.log(`✅ Listener ajouté sur élément ${idx}`);
    });
    
    console.log('🎯 FIN addSafeSuggestionEventListeners');
}

// Ajoutons une nouvelle fonction pour effectuer une recherche complète
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
    
    console.log('🔍 Recherche complète pour:', query);
    console.log('🖼️ Galeries trouvées:', filteredGalleries.length);
    
    displayGalleriesSimple(filteredGalleries);
    updateStats(filteredGalleries.length, query);
}

// Version simplifiée de displayGalleries pour éviter le freeze
function displayGalleriesSimple(galleries) {
    const container = el('galleriesContainer') || el('galleries');
    if (!container) {
        console.warn('Container galeries non trouvé');
        return;
    }
    
    if (galleries.length === 0) {
        container.innerHTML = '<div class="no-results">Aucune galerie trouvée</div>';
        return;
    }
    
    // Affichage très simple sans risque de freeze
    let html = '<div class="galleries-grid">';
    galleries.slice(0, 20).forEach(gallery => { // Limitons à 20 pour éviter les problèmes
        if (gallery && gallery.name) {
            const safeName = gallery.name.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += `
                <div class="gallery-item" onclick="window.openGallery('${gallery.id}', '${safeName}')">
                    <div class="gallery-name">${safeName}</div>
                    <div class="gallery-count">${gallery.count || 0} photos</div>
                </div>
            `;
        }
    });
    html += '</div>';
    
    container.innerHTML = html;
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
        const safeQuery = query.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        statsEl.innerHTML = `${count} collection${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} pour "<strong>${safeQuery}</strong>"`;
    } else {
        statsEl.textContent = `${count} collection${count > 1 ? 's' : ''}`;
    }
}