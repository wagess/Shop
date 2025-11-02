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
        const kwsHtml = kws.length ? renderKeywordsLimited(kws) : `<span style="color:#999; font-size:12px;">Chargement mots-clés...</span>`;

        return `
    <div class="photo-card" id="photo-card-${photo.id}">
        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title)}" class="photo-img" 
             onclick="openLightbox('${escapeJs(imgUrl)}', '${escapeJs(title)}')"
             style="cursor: pointer !important;"
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
                container.innerHTML = renderKeywordsLimited(kws, photo.id);
            } else {
                container.innerHTML = `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
            }
        } catch (err) {
            console.error('❌ IPTC fetch error pour photo', photo.id, ':', err);
            const kws = collectKeywords(photo);
            container.innerHTML = kws.length ? renderKeywordsLimited(kws, photo.id) : `<span style="color:#999; font-size:12px;">Aucun mot-clé</span>`;
        }
    }));
}

function renderKeywordsLimited(keywords, photoId = null) {
    if (!keywords || keywords.length === 0) return '';
    
    const maxVisible = 3;
    const visibleKeywords = keywords.slice(0, maxVisible);
    const hiddenCount = keywords.length - maxVisible;
    
    // Tronquer les mots-clés trop longs pour éviter le débordement
    const truncatedKeywords = visibleKeywords.map(k => {
        const keyword = String(k);
        return keyword.length > 20 ? keyword.substring(0, 17) + '...' : keyword;
    });
    
    let html = truncatedKeywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ');
    
    if (hiddenCount > 0) {
        const allKeywordsData = JSON.stringify(keywords);
        html += ` <button class="more-keywords-btn" data-keywords='${escapeHtml(allKeywordsData)}' onclick="event.stopPropagation(); toggleAllKeywords('${photoId || ''}', this);" title="Afficher ${hiddenCount} mot(s)-clé(s) supplémentaire(s)">+${hiddenCount}</button>`;
    }
    
    return html;
}

window.toggleAllKeywords = function(photoId, button) {
    const container = button.parentElement;
    const isExpanded = button.dataset.expanded === 'true';
    
    const allKeywords = JSON.parse(button.dataset.keywords || '[]');
    
    if (isExpanded) {
        container.innerHTML = renderKeywordsLimited(allKeywords, photoId);
        container.classList.remove('expanded');
    } else {
        const allKeywordsHtml = allKeywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join(' ');
        container.innerHTML = allKeywordsHtml + ` <button class="more-keywords-btn" data-keywords='${escapeHtml(JSON.stringify(allKeywords))}' onclick="event.stopPropagation(); toggleAllKeywords('${photoId}', this);" data-expanded="true">−</button>`;
        container.classList.add('expanded');
    }
};

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
// Variables globales pour le suivi fluide
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let btnX = mouseX;
let btnY = mouseY;
const smoothness = 0.3; // Augmenté de 0.15 à 0.3 pour plus de rapidité

export function openLightbox(imageUrl, title) {
    // Créer la lightbox si elle n'existe pas
    let lightbox = el('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay">
                <img class="lightbox-image" src="" alt="">
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
    
    // Créer ou récupérer le bouton close
    let closeBtn = document.querySelector('.lightbox-close');
    if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = closeLightbox;
        document.body.appendChild(closeBtn);
    }
    
    // Afficher l'image
    const img = lightbox.querySelector('.lightbox-image');
    img.src = imageUrl;
    img.alt = title;
    
    // Position initiale du bouton (coin supérieur gauche)
    btnX = 50;        // Changé de window.innerWidth - 50 à 50
    btnY = 50;
    mouseX = btnX;
    mouseY = btnY;
    
    // Position initiale et fade in du bouton
    closeBtn.style.left = btnX + 'px';
    closeBtn.style.top = btnY + 'px';
    closeBtn.style.transform = 'translate(-50%, -50%)';
    closeBtn.style.opacity = '0';
    closeBtn.style.display = 'flex';
    
    // Afficher la lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Fade in du bouton après un court délai
    setTimeout(() => {
        closeBtn.style.opacity = '1';
    }, 100);
    
    // Démarrer l'animation du bouton
    updateButtonPosition();
    
    // Ajouter les événements
    addLightboxEvents(lightbox, closeBtn, img);

    // Détecter le format de l'image une fois chargée
    img.onload = function() {
        const isPortrait = this.naturalHeight > this.naturalWidth;
        
        if (isPortrait) {
            this.style.maxHeight = '90vh';
            this.style.maxWidth = 'none';
            this.style.width = 'auto';
        } else {
            this.style.maxWidth = '90vw';
            this.style.maxHeight = '90vh';
            this.style.width = 'auto';
        }
    };
}

function addLightboxEvents(lightbox, closeBtn, img) {
    // Supprimer les anciens événements
    if (window._lightboxMouseHandler) {
        lightbox.removeEventListener('mousemove', window._lightboxMouseHandler);
    }
    if (window._lightboxClickHandler) {
        lightbox.removeEventListener('click', window._lightboxClickHandler);
    }
    
    // Suivre la souris
    function handleMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
    
    // Fermer en cliquant
    function handleClick(e) {
        if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-overlay')) {
            closeLightbox();
        }
    }
    
    // Ajouter les événements
    lightbox.addEventListener('mousemove', handleMouseMove);
    lightbox.addEventListener('click', handleClick);
    
    // Stocker les handlers
    window._lightboxMouseHandler = handleMouseMove;
    window._lightboxClickHandler = handleClick;
}

function updateButtonPosition() {
    const lightbox = el('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    
    if (!lightbox || !lightbox.classList.contains('active') || !closeBtn) return;

    btnX += (mouseX - btnX) * smoothness;
    btnY += (mouseY - btnY) * smoothness;

    closeBtn.style.left = btnX + 'px';
    closeBtn.style.top = btnY + 'px';
    closeBtn.style.transform = 'translate(-50%, -50%)';

    requestAnimationFrame(updateButtonPosition);
}

export function closeLightbox() {
    const lightbox = el('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeBtn) {
        // Fade out du bouton
        closeBtn.style.opacity = '0';
        setTimeout(() => {
            closeBtn.style.display = 'none';
        }, 200);
    }
    
    // Supprimer les événements
    if (window._lightboxMouseHandler) {
        lightbox.removeEventListener('mousemove', window._lightboxMouseHandler);
        window._lightboxMouseHandler = null;
    }
    
    if (window._lightboxClickHandler) {
        lightbox.removeEventListener('click', window._lightboxClickHandler);
        window._lightboxClickHandler = null;
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