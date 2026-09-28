import { fetchGalleryPhotos } from './api.js';
import { escapeHtml } from './utils.js';

/**
 * Charge les thumbnails pour les collections visibles
 * @param {Array} collections
 * @param {(done: number, total: number) => void} [onProgress] — appelé après chaque collection (succès ou erreur)
 */
async function loadThumbnailsForCollections(collections, onProgress) {
    const visibleCollections = collections.slice(0, 8);

    let done = 0;
    onProgress?.(0, visibleCollections.length);

    // En parallèle plutôt qu'en séquence : ces collections sont indépendantes,
    // les attendre une par une multiplie inutilement la latence réseau totale.
    await Promise.all(visibleCollections.map(async (collection) => {
        try {
            const photos = await fetchGalleryPhotos(collection.id);

            if (photos && Array.isArray(photos) && photos.length > 0) {
                collection.thumbnails = photos.slice(0, 4).map(photo =>
                    photo.thumbnail || photo.thumb || photo.url_thumb || photo.sizes?.thumbnail || photo.url
                );

                updateCollectionThumbnails(collection);
            } else {
                // Réponse reçue mais vide/invalide (pas une erreur réseau — sinon
                // le catch ci-dessous l'aurait attrapée) : la card reste bloquée
                // sur son placeholder. Signalé pour diagnostiquer un éventuel
                // problème intermittent côté API distante.
                console.warn(`Thumbnails vides pour ${collection.name} (id ${collection.id})`, photos);
            }
        } catch (err) {
            console.error(`Erreur chargement thumbnails pour ${collection.name}:`, err);
        } finally {
            done += 1;
            onProgress?.(done, visibleCollections.length);
        }
    }));

    console.log('✅ Thumbnails chargés pour les premières collections');
}

/**
 * Met à jour l'affichage des thumbnails d'une collection
 */
function updateCollectionThumbnails(collection) {
    if (!collection.thumbnails || collection.thumbnails.length === 0) return;
    
    const card = document.querySelector(`.gallery-card[onclick*="openGallery(${collection.id}"]`);
    if (!card) return;
    
    const cover = card.querySelector('.gallery-cover');
    if (!cover) return;

    const badge = cover.querySelector('.gallery-badge');
    const thumbs = collection.thumbnails.slice(0, 4);
    cover.innerHTML = `
        <div class="gallery-mosaic gap-0" style="opacity: 0; transition: opacity 0.5s ease-in;">
            ${thumbs.map(thumb => `
                <div class="mosaic-item" style="background-image: url('${escapeHtml(thumb)}')"></div>
            `).join('')}
        </div>
    `;
    if (badge) cover.appendChild(badge);

    setTimeout(() => {
        const mosaic = cover.querySelector('.gallery-mosaic');
        if (mosaic) mosaic.style.opacity = '1';
    }, 10);
}

export {
    loadThumbnailsForCollections,
    updateCollectionThumbnails
};