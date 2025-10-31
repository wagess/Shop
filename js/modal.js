import { el, escapeHtml, escapeJs } from './utils.js';
import { fetchGalleryPhotos, fetchPhotoKeywords } from './api.js';

export async function openGallery(galleryId, galleryName) {
    const modal = el('photosModal');
    const title = el('modalTitle');
    const grid = el('photosGrid');
    if (!modal || !title || !grid) return;

    modal.style.display = 'block';
    title.textContent = galleryName;
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement des photos...</div>';

    try {
        const photos = await fetchGalleryPhotos(galleryId);
        if (!photos || photos.length === 0) {
            grid.innerHTML = '<div class="loading">Aucune photo dans cette galerie</div>';
            return;
        }
        displayPhotos(photos);
    } catch (err) {
        console.error('openGallery error', err);
        grid.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

async function displayPhotos(photos) {
    const grid = el('photosGrid');
    if (!grid) return;

    grid.innerHTML = photos.map(photo => {
        const imgUrl = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const title = photo.title || photo.post_title || photo.name || `Photo ${photo.id}`;
        const kws = collectKeywords(photo);
        const kwsHtml = kws.length ? kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ') : `<span style="color:#999; font-size:12px;">Chargement mots-clés...</span>`;

        return `
            <div class="photo-card" id="photo-card-${photo.id}">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title)}" class="photo-img" 
                     onclick="openLightbox('${escapeJs(imgUrl)}', '${escapeJs(title)}')"
                     onerror="this.style.background='linear-gradient(45deg,#ddd,#ccc)'; this.alt='Image non disponible';">
                <div class="photo-info">
                    <div class="photo-title">${escapeHtml(title)}</div>
                    <div class="photo-id">ID: ${photo.id}</div>
                    <div class="keywords-container" id="keywords-${photo.id}">${kwsHtml}</div>
                    <button class="order-btn" onclick="event.stopPropagation(); window.orderPrint('${escapeJs(title)}','${escapeJs(imgUrl)}', ${photo.id});">🖨️ Commander l'impression</button>
                </div>
            </div>
        `;
    }).join('');

    await Promise.allSettled(photos.map(async photo => {
        const container = el(`keywords-${photo.id}`);
        if (!container) return;

        try {
            const data = await fetchPhotoKeywords(photo.id);
            console.log('🔍 Photo', photo.id, '- data brute:', JSON.stringify(data, null, 2));
            
            let kws = [];
            if (data && Array.isArray(data.keywords)) {
                kws = data.keywords.filter(k => k != null && k !== '').map(k => String(k).trim()).filter(k => k.length > 0);
            } else if (Array.isArray(data)) {
                kws = data.filter(k => k != null && k !== '').map(k => String(k).trim()).filter(k => k.length > 0);
            } else if (data && Array.isArray(data.items)) {
                kws = data.items.filter(k => k != null && k !== '').map(k => String(k).trim()).filter(k => k.length > 0);
            }
            
            console.log('🏷️  Photo', photo.id, '- keywords extraits:', kws);
            
            if (!kws || kws.length === 0) {
                kws = collectKeywords(photo);
                console.log('⚠️  Photo', photo.id, '- fallback collectKeywords:', kws);
            }

            if (kws && kws.length > 0) {
                container.innerHTML = kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ');
            } else {
                container.innerHTML = `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
            }
        } catch (err) {
            console.error('❌ IPTC fetch error pour photo', photo.id, ':', err);
            const kws = collectKeywords(photo);
            container.innerHTML = kws.length ? kws.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ') : `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
        }
    }));
}

function collectKeywords(photo) {
    const s = new Set();
    if (!photo) return [];
    try {
        if (photo.keywords) {
            if (Array.isArray(photo.keywords)) photo.keywords.forEach(k => { if (k) s.add(String(k).trim()); });
            else if (typeof photo.keywords === 'string') photo.keywords.split(/[,;]+/).forEach(k => { const t = k.trim(); if (t) s.add(t); });
        }
        if (photo.iptc_keywords && Array.isArray(photo.iptc_keywords)) photo.iptc_keywords.forEach(k => { if (k) s.add(String(k).trim()); });
        if (photo.meta && photo.meta.keywords && Array.isArray(photo.meta.keywords)) photo.meta.keywords.forEach(k => { if (k) s.add(String(k).trim()); });
        if (photo.terms) {
            Object.values(photo.terms).forEach(group => {
                if (Array.isArray(group)) group.forEach(term => { if (term && term.name) s.add(String(term.name).trim()); });
            });
        }
        if (photo.tags && Array.isArray(photo.tags)) photo.tags.forEach(t => {
            if (typeof t === 'string') s.add(t.trim()); else if (t && t.name) s.add(String(t.name).trim());
        });
    } catch (e) {
        console.warn('collectKeywords error', e);
    }
    return Array.from(s).filter(k => k && k.length > 0);
}

export function closeModal() {
    const modal = el('photosModal');
    if (modal) modal.style.display = 'none';
}

export function orderPrint(title, imageUrl, photoId) {
    const to = 'wagess@gmail.com';
    const subject = `Commande impression: ${title}`;
    const body = `Bonjour,

Je souhaite commander une impression.

Titre: ${title}
ID: ${photoId}
Image: ${imageUrl}

Merci,
[Votre nom]`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert('Email préparé. Vérifiez votre client mail.');
}

// Ajouter ces nouvelles fonctions
export function openLightbox(imageUrl, title) {
    // Créer la lightbox si elle n'existe pas
    let lightbox = el('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay" onclick="closeLightbox()">
                <div class="lightbox-content" onclick="event.stopPropagation()">
                    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
                    <img class="lightbox-image" src="" alt="">
                    <div class="lightbox-title"></div>
                </div>
            </div>
        `;
        document.body.appendChild(lightbox);
        
        // Charger le CSS lightbox si pas déjà présent
        if (!document.querySelector('link[href*="lightbox.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './css/lightbox.css';
            document.head.appendChild(link);
        }
    }
    
    // Afficher l'image
    const img = lightbox.querySelector('.lightbox-image');
    const titleEl = lightbox.querySelector('.lightbox-title');
    
    img.src = imageUrl;
    img.alt = title;
    titleEl.textContent = title;
    
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Détecter le format de l'image une fois chargée
    img.onload = function() {
        const isPortrait = this.naturalHeight > this.naturalWidth;
        const content = lightbox.querySelector('.lightbox-content');
        
        if (isPortrait) {
            // Image portrait : contraindre la hauteur, largeur auto
            content.style.maxHeight = 'calc(100vh - 60px)';
            content.style.maxWidth = 'none';
            this.style.height = 'calc(100vh - 60px)';
            this.style.width = 'auto';
        } else {
            // Image paysage : contraindre la largeur, hauteur auto avec plus de padding vertical
            content.style.maxWidth = 'calc(100vw - 80px)';
            content.style.maxHeight = 'calc(100vh - 100px)';
            this.style.width = 'calc(100vw - 80px)';
            this.style.height = 'auto';
            this.style.maxHeight = 'calc(100vh - 100px)';
        }
    };
}

export function closeLightbox() {
    const lightbox = el('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
}

export function initModalListeners() {
    const closeBtn = el('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape') {
            closeLightbox();
            closeModal();
        }
    });
}

// Exposer les fonctions lightbox globalement
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;