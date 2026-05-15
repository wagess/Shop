import { el, escapeHtml, escapeJs } from './utils.js';
import { fetchGalleryPhotos, fetchPhotoKeywords, sendOrderEmail } from './api.js';

export async function openGallery(galleryId, galleryName) {
    const modal = el('photosModal');
    const title = el('modalTitle');
    const grid = el('photosGrid');
    if (!modal || !title || !grid) return;

    modal.style.display = 'block';
    
    // Supprimer le bouton retour du titre - juste afficher le nom de la galerie
    title.textContent = galleryName;
    
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement des photos...</div>';

    try {
        const photos = await fetchGalleryPhotos(galleryId);
        if (!photos || photos.length === 0) {
            grid.innerHTML = '<div class="loading">Aucune photo dans cette galerie</div>';
            title.textContent = `${galleryName} (0 photo)`;
            return;
        }
        
        // Mettre à jour le titre avec le nombre de photos
        title.innerHTML = `${escapeHtml(galleryName)} <span class="photo-count">(${photos.length} photo${photos.length > 1 ? 's' : ''})</span> <span class="gallery-id">- ID: ${galleryId}</span>`;
        displayPhotos(photos, el('photosGrid'));
    } catch (err) {
        console.error('openGallery error', err);
        grid.innerHTML = `<div class="error-message">Erreur: ${escapeHtml(err.message)}</div>`;
    }
}

// Variables globales pour la navigation
let currentPhotos = [];
let currentPhotoIndex = 0;
let isMobile = false;

// Fonction pour détecter si on est sur mobile
function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || window.innerWidth <= 768 
           || ('ontouchstart' in window);
}

export async function displayPhotos(photos, gridEl = null) {
    const grid = gridEl || el('photosGrid');
    if (!grid) return;

    // Stocker les photos pour la navigation dans la lightbox
    currentPhotos = photos;

    grid.innerHTML = photos.map((photo, index) => {
        const imgUrl = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const title = photo.title || photo.post_title || photo.name || `Photo ${photo.id}`;
        const kws = collectKeywords(photo);
        const kwsHtml = kws.length ? renderKeywordsLimited(kws) : `<span style="color:#999; font-size:12px;">Chargement mots-clés...</span>`;

        return `
    <div class="photo-card" id="photo-card-${photo.id}">
        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title)}" class="photo-img" 
             onclick="openLightbox('${escapeJs(imgUrl)}', '${escapeJs(title)}', ${index})"
             onerror="this.style.background='linear-gradient(45deg,#ddd,#ccc)'; this.alt='Image non disponible';">
        <div class="photo-info">
            <div class="photo-title">${escapeHtml(title)}</div>
            <div class="photo-id">ID: ${photo.id}</div>
            <div class="keywords-container" id="keywords-${photo.id}">${kwsHtml}</div>
            <button class="order-btn" onclick="event.stopPropagation(); window.orderPrint('${escapeJs(title)}','${escapeJs(imgUrl)}', ${photo.id});">${['🖨️ Commander l\'impression', '😍 Cool, acheter cette photo !', '❤️ j\'aime cette photo !'][Math.floor(Math.random() * 3)]}</button>
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

let _shutterBuffer = null;

async function loadShutterSound() {
    try {
        const response = await fetch('./assets/sounds/shutter.wav');
        const arrayBuffer = await response.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        _shutterBuffer = await ctx.decodeAudioData(arrayBuffer);
        await ctx.close();
    } catch (e) {}
}
loadShutterSound();

function playShutterSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = _shutterBuffer;
        source.connect(ctx.destination);
        source.start(0, 0, 0.8);
        source.onended = () => ctx.close();
    } catch (e) {}
}

export function orderPrint(title, imageUrl, photoId) {
    showOrderForm(title, imageUrl, photoId);
}

function showOrderForm(title, imageUrl, photoId) {
    document.getElementById('orderFormOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'orderFormOverlay';
    overlay.className = 'order-overlay';
    overlay.innerHTML = `
        <div class="order-modal" role="dialog" aria-modal="true" aria-label="Commander une impression">

            <div class="order-modal__header">
                <button class="order-modal__back" id="orderBackBtn" aria-label="Retour" style="visibility:hidden">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L8.41421 10L12.7071 14.2929C13.0976 14.6834 13.0976 15.3166 12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289Z"/>
                    </svg>
                </button>
                <div class="order-steps">
                    <span class="order-step order-step--active" id="orderStep1Dot"></span>
                    <span class="order-step" id="orderStep2Dot"></span>
                    <span class="order-step" id="orderStep3Dot"></span>
                </div>
                <button class="order-modal__close" id="closeOrderForm" aria-label="Fermer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579Z"/>
                    </svg>
                </button>
            </div>

            <div class="order-modal__preview">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}">
                <span class="order-modal__preview-title">${escapeHtml(title)}</span>
            </div>

            <div class="order-modal__steps-wrapper">

                <!-- Étape 1 : Format & papier -->
                <div class="order-step-panel" id="orderPanel1">
                    <p class="order-step-label">Étape 1 — Format & finition</p>
                    <div class="order-format-grid">
                        ${['20×30 cm','30×40 cm','40×60 cm','50×70 cm','60×90 cm','Autre'].map((f, i) => `
                        <label class="order-format-card${i === 2 ? ' order-format-card--selected' : ''}">
                            <input type="radio" name="format" value="${f}"${i === 2 ? ' checked' : ''}>
                            <span class="order-format-card__label">${f}</span>
                        </label>`).join('')}
                    </div>
                    <div class="order-paper-row">
                        ${['Brillant','Mat','Fine Art'].map((p, i) => `
                        <label class="order-paper-chip${i === 1 ? ' order-paper-chip--selected' : ''}">
                            <input type="radio" name="paper" value="${p}"${i === 1 ? ' checked' : ''}>
                            ${p}
                        </label>`).join('')}
                    </div>
                    <button type="button" class="order-submit" id="orderNextBtn">Continuer →</button>
                </div>

                <!-- Étape 2 : Coordonnées -->
                <div class="order-step-panel order-step-panel--hidden" id="orderPanel2">
                    <p class="order-step-label">Étape 2 — Vos coordonnées</p>
                    <form id="orderForm" novalidate>
                        <div class="order-field">
                            <label for="orderName">Nom complet <span class="order-field__required">*</span></label>
                            <input type="text" id="orderName" name="name" required placeholder="Votre nom">
                        </div>
                        <div class="order-field">
                            <label for="orderEmail">Courriel <span class="order-field__required">*</span></label>
                            <input type="email" id="orderEmail" name="email" required placeholder="votre@courriel.com">
                        </div>
                        <div class="order-field">
                            <label for="orderPhone">Téléphone</label>
                            <input type="tel" id="orderPhone" name="phone" placeholder="Optionnel">
                        </div>
                        <div class="order-field">
                            <label for="orderMessage">Message</label>
                            <textarea id="orderMessage" name="message" rows="3" placeholder="Précisions, questions..."></textarea>
                        </div>
                        <div class="order-feedback" id="orderFeedback"></div>
                        <button type="submit" class="order-submit" id="orderSubmitBtn">Envoyer la commande</button>
                    </form>
                </div>

                <!-- Étape 3 : Confirmation -->
                <div class="order-step-panel order-step-panel--hidden" id="orderPanel3">
                    <div style="text-align: center; padding: 20px 0 10px;">
                        <div style="width: 56px; height: 56px; background: rgba(87,173,157,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#57ad9d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <p style="color: #57ad9d; font-size: var(--font-size-large); font-weight: var(--font-weight-medium); margin: 0 0 8px;">Commande envoyée !</p>
                        <p style="color: var(--text-secondary); font-size: var(--font-size-small); margin: 0 0 4px;" id="orderConfirmName"></p>
                        <p style="color: var(--text-muted); font-size: var(--font-size-small); margin: 0;">Je vous contacterai sous peu pour finaliser votre tirage.</p>
                    </div>
                    <button type="button" class="order-submit" id="orderCloseConfirmBtn" style="margin-top: 16px;">Fermer</button>
                </div>

            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('order-overlay--visible'));

    function closeForm() {
        overlay.classList.remove('order-overlay--visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }

    document.getElementById('closeOrderForm').addEventListener('click', closeForm);
    document.getElementById('orderCloseConfirmBtn').addEventListener('click', closeForm);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeForm(); });

    // Sélection format
    overlay.querySelectorAll('.order-format-card input').forEach(input => {
        input.addEventListener('change', () => {
            overlay.querySelectorAll('.order-format-card').forEach(c => c.classList.remove('order-format-card--selected'));
            input.closest('.order-format-card').classList.add('order-format-card--selected');
        });
    });

    // Sélection papier
    overlay.querySelectorAll('.order-paper-chip input').forEach(input => {
        input.addEventListener('change', () => {
            overlay.querySelectorAll('.order-paper-chip').forEach(c => c.classList.remove('order-paper-chip--selected'));
            input.closest('.order-paper-chip').classList.add('order-paper-chip--selected');
        });
    });

    // Étape 1 → 2
    document.getElementById('orderNextBtn').addEventListener('click', () => {
        goToStep(2);
    });

    // Étape 2 → 1
    document.getElementById('orderBackBtn').addEventListener('click', () => {
        goToStep(1);
    });

    function goToStep(step) {
        const panels = [
            document.getElementById('orderPanel1'),
            document.getElementById('orderPanel2'),
            document.getElementById('orderPanel3'),
        ];
        const dots = [
            document.getElementById('orderStep1Dot'),
            document.getElementById('orderStep2Dot'),
            document.getElementById('orderStep3Dot'),
        ];
        const backBtn = document.getElementById('orderBackBtn');

        const currentIndex = panels.findIndex(p => !p.classList.contains('order-step-panel--hidden'));
        const nextIndex = step - 1;
        if (currentIndex === nextIndex) return;

        const forward = nextIndex > currentIndex;
        const current = panels[currentIndex];
        const next    = panels[nextIndex];

        current.classList.add(forward ? 'order-step-panel--exit' : 'order-step-panel--exit-reverse');
        current.addEventListener('transitionend', () => {
            current.classList.add('order-step-panel--hidden');
            current.classList.remove('order-step-panel--exit', 'order-step-panel--exit-reverse');
            next.classList.remove('order-step-panel--hidden');
            requestAnimationFrame(() => next.classList.add(forward ? 'order-step-panel--enter' : 'order-step-panel--enter-reverse'));
            requestAnimationFrame(() => {
                requestAnimationFrame(() => next.classList.remove('order-step-panel--enter', 'order-step-panel--enter-reverse'));
            });
            if (step === 2) document.getElementById('orderName')?.focus();
        }, { once: true });

        dots.forEach((d, i) => d.classList.toggle('order-step--active', i === nextIndex));
        backBtn.style.visibility = step === 2 ? 'visible' : 'hidden';
    }

    // Soumission
    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('orderSubmitBtn');
        const feedback = document.getElementById('orderFeedback');

        const format = overlay.querySelector('input[name="format"]:checked')?.value || '';
        const paper  = overlay.querySelector('input[name="paper"]:checked')?.value || '';

        btn.disabled = true;
        btn.textContent = 'Envoi en cours...';
        feedback.textContent = '';
        feedback.className = 'order-feedback';

        try {
            const name = e.target.name.value.trim();
            await sendOrderEmail({
                name,
                email: e.target.email.value.trim(),
                phone: e.target.phone.value.trim(),
                format,
                paper,
                message: e.target.message.value.trim(),
                photo_title: title,
                photo_id: photoId,
                photo_url: imageUrl,
            });
            const confirmName = document.getElementById('orderConfirmName');
            if (confirmName) confirmName.textContent = `Merci ${name}, votre demande a bien été reçue.`;
            goToStep(3);
        } catch (err) {
            feedback.textContent = `Erreur : ${err.message}`;
            feedback.className = 'order-feedback order-feedback--error';
            btn.disabled = false;
            btn.textContent = 'Envoyer la commande';
        }
    });
}

// Ajouter ces nouvelles fonctions
// Variables globales pour le suivi fluide
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let btnX = mouseX;
let btnY = mouseY;
const smoothness = 0.2;
let animationId = null;

function updateButtonPosition() {
    if (isMobile) return; // Pas d'animation en mobile
    
    const closeBtn = document.querySelector('.lightbox-close');
    if (!closeBtn || closeBtn.style.display === 'none') return;
    
    // Interpolation fluide vers la position de la souris
    btnX += (mouseX - btnX) * smoothness;
    btnY += (mouseY - btnY) * smoothness;
    
    // Appliquer la position
    closeBtn.style.left = btnX + 'px';
    closeBtn.style.top = btnY + 'px';
    
    // Continuer l'animation
    animationId = requestAnimationFrame(updateButtonPosition);
}

function addLightboxEvents(lightbox, closeBtn, img) {
    // Supprimer les anciens événements
    if (window._lightboxMouseHandler) {
        lightbox.removeEventListener('mousemove', window._lightboxMouseHandler);
    }
    if (window._lightboxClickHandler) {
        lightbox.removeEventListener('click', window._lightboxClickHandler);
    }
    
    if (isMobile) {
        // Mode mobile : contrôles fixes
        const mobileControls = createMobileControls();
        
        function handleClick(e) {
            if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-overlay') || e.target === img) {
                const controls = document.querySelectorAll('.mobile-nav-btn');
                const isVisible = controls[0] && controls[0].style.opacity !== '0';
                
                controls.forEach(btn => {
                    btn.style.opacity = isVisible ? '0' : '1';
                    btn.style.pointerEvents = isVisible ? 'none' : 'auto';
                });
                
                if (!isVisible) {
                    setTimeout(() => {
                        controls.forEach(btn => {
                            btn.style.opacity = '0.7';
                        });
                    }, 3000);
                }
            }
        }
        
        lightbox.addEventListener('click', handleClick);
        window._lightboxClickHandler = handleClick;
        
    } else {
        // Mode desktop : comportement avec zones et bouton qui suit la souris
        function handleMouseMove(e) {
            // IMPORTANT: Mettre à jour les coordonnées de la souris pour l'animation
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Changer l'icône selon la position du curseur avec zones de 15%
            const screenWidth = window.innerWidth;
            const leftZone = screenWidth * 0.15;
            const rightZone = screenWidth * 0.85;
            
            if (mouseX < leftZone) {
                closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L8.41421 10L12.7071 14.2929C13.0976 14.6834 13.0976 15.3166 12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289Z"></path>
                </svg>`;
                closeBtn.title = 'Image précédente';
            } else if (mouseX > rightZone) {
                closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.29289 4.29289C7.68342 3.90237 8.31658 3.90237 8.70711 4.29289L13.7071 9.29289C14.0976 9.68342 14.0976 10.3166 13.7071 10.7071L8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071C6.90237 15.3166 6.90237 14.6834 7.29289 14.2929L11.5858 10L7.29289 5.70711C6.90237 5.31658 6.90237 4.68342 7.29289 4.29289Z"></path>
                </svg>`;
                closeBtn.title = 'Image suivante';
            } else {
                closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579Z"></path>
                </svg>`;
                closeBtn.title = 'Fermer';
            }
        }
        
        function handleClick(e) {
            if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-overlay')) {
                const screenWidth = window.innerWidth;
                const clickX = e.clientX;
                const leftZone = screenWidth * 0.15;
                const rightZone = screenWidth * 0.85;
                
                if (clickX < leftZone) {
                    navigateToPhoto('prev');
                } else if (clickX > rightZone) {
                    navigateToPhoto('next');
                } else {
                    closeLightbox();
                }
            }
        }
        
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            const buttonContent = closeBtn.innerHTML;
            
            if (buttonContent.includes('L6.29289 10.7071C5.90237 10.3166')) {
                navigateToPhoto('prev');
            } else if (buttonContent.includes('L13.7071 9.29289C14.0976 9.68342')) {
                navigateToPhoto('next');
            } else {
                closeLightbox();
            }
        };
        
        lightbox.addEventListener('mousemove', handleMouseMove);
        lightbox.addEventListener('click', handleClick);
        
        window._lightboxMouseHandler = handleMouseMove;
        window._lightboxClickHandler = handleClick;
    }
}

function navigateToPhoto(direction) {
    if (!currentPhotos || currentPhotos.length === 0) return;
    
    let newIndex = currentPhotoIndex;
    
    if (direction === 'prev') {
        newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : currentPhotos.length - 1;
    } else if (direction === 'next') {
        newIndex = currentPhotoIndex < currentPhotos.length - 1 ? currentPhotoIndex + 1 : 0;
    }
    
    if (newIndex !== currentPhotoIndex) {
        const photo = currentPhotos[newIndex];
        const imgUrl = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const title = photo.title || photo.post_title || photo.name || `Photo ${photo.id}`;
        
        currentPhotoIndex = newIndex;
        
        // Mettre à jour l'image dans la lightbox
        const img = document.querySelector('.lightbox-image');
        if (img) {
            img.src = imgUrl;
            img.alt = title;
            
            // Réappliquer le redimensionnement
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
    }
}

function createMobileControls() {
    // Supprimer les anciens contrôles mobiles s'ils existent
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.remove());
    
    // Bouton précédent (gauche)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'mobile-nav-btn mobile-prev-btn';
    prevBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L8.41421 10L12.7071 14.2929C13.0976 14.6834 13.0976 15.3166 12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289Z"></path>
    </svg>`;
    prevBtn.title = 'Image précédente';
    prevBtn.onclick = (e) => {
        e.stopPropagation();
        navigateToPhoto('prev');
    };
    
    // Bouton suivant (droite)
    const nextBtn = document.createElement('button');
    nextBtn.className = 'mobile-nav-btn mobile-next-btn';
    nextBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.29289 4.29289C7.68342 3.90237 8.31658 3.90237 8.70711 4.29289L13.7071 9.29289C14.0976 9.68342 14.0976 10.3166 13.7071 10.7071L8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071C6.90237 15.3166 6.90237 14.6834 7.29289 14.2929L11.5858 10L7.29289 5.70711C6.90237 5.31658 6.90237 4.68342 7.29289 4.29289Z"></path>
    </svg>`;
    nextBtn.title = 'Image suivante';
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        navigateToPhoto('next');
    };
    
    // Bouton fermer (centre haut)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-nav-btn mobile-close-btn';
    closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579Z"></path>
    </svg>`;
    closeBtn.title = 'Fermer';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeLightbox();
    };
    
    // Ajouter les boutons au body
    document.body.appendChild(prevBtn);
    document.body.appendChild(nextBtn);
    document.body.appendChild(closeBtn);
    
    return { prevBtn, nextBtn, closeBtn };
}

export function openLightbox(imageUrl, title, photoIndex = 0) {
    playShutterSound();
    currentPhotoIndex = photoIndex;
    isMobile = detectMobile();
    
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
        
        // Charger le CSS lightbox si pas déjà présent - CORRECTION DU CHEMIN
        if (!document.querySelector('link[href*="lightbox.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './assets/styles/components/lightbox.css';
            document.head.appendChild(link);
        }
    }
    
    // Créer ou récupérer le bouton close
    let closeBtn = document.querySelector('.lightbox-close');
    if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579Z"></path>
        </svg>`;
        closeBtn.title = 'Fermer';
        closeBtn.onclick = closeLightbox;
        document.body.appendChild(closeBtn);
    }
    
    // Afficher l'image
    const img = lightbox.querySelector('.lightbox-image');
    img.src = imageUrl;
    img.alt = title;
    
    if (!isMobile) {
        // Mode desktop : bouton qui suit la souris
        btnX = 50;
        btnY = 50;
        mouseX = btnX;
        mouseY = btnY;
        
        closeBtn.style.left = btnX + 'px';
        closeBtn.style.top = btnY + 'px';
        closeBtn.style.transform = 'translate(-50%, -50%)';
        closeBtn.style.opacity = '0';
        closeBtn.style.display = 'flex';
        
        setTimeout(() => {
            closeBtn.style.opacity = '1';
        }, 100);
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        updateButtonPosition();
    } else {
        // Mode mobile : cacher le bouton qui suit la souris
        closeBtn.style.display = 'none';
    }
    
    // Afficher la lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Ajouter les événements
    addLightboxEvents(lightbox, closeBtn, img);

    // Redimensionnement de l'image (pour mobile ET desktop)
    img.onload = function() {
        const isPortrait = this.naturalHeight > this.naturalWidth;
        
        if (isMobile) {
            // Redimensionnement spécifique mobile
            if (isPortrait) {
                this.style.maxHeight = '80vh';
                this.style.maxWidth = '95vw';
                this.style.width = 'auto';
                this.style.height = 'auto';
            } else {
                this.style.maxWidth = '95vw';
                this.style.maxHeight = '80vh';
                this.style.width = 'auto';
                this.style.height = 'auto';
            }
        } else {
            // Redimensionnement desktop
            if (isPortrait) {
                this.style.maxHeight = '90vh';
                this.style.maxWidth = 'none';
                this.style.width = 'auto';
            } else {
                this.style.maxWidth = '90vw';
                this.style.maxHeight = '90vh';
                this.style.width = 'auto';
            }
        }
    };
}

export function closeLightbox() {
    const lightbox = el('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    
    // Arrêter l'animation du bouton
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeBtn && !isMobile) {
        closeBtn.style.opacity = '0';
        setTimeout(() => {
            closeBtn.style.display = 'none';
        }, 200);
    }
    
    // Supprimer les contrôles mobiles
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.remove());
    
    // Supprimer les événements
    if (window._lightboxMouseHandler) {
        lightbox?.removeEventListener('mousemove', window._lightboxMouseHandler);
        window._lightboxMouseHandler = null;
    }
    
    if (window._lightboxClickHandler) {
        lightbox?.removeEventListener('click', window._lightboxClickHandler);
        window._lightboxClickHandler = null;
    }
}

export function initModalListeners() {
    const closeBtn = el('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        closeModal();
        window.displayCollectionsView();
    });
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape') {
            closeLightbox();
            closeModal();
            window.displayCollectionsView();
        } else if (e.key === 'ArrowLeft') {
            navigateToPhoto('prev');
        } else if (e.key === 'ArrowRight') {
            navigateToPhoto('next');
        }
    });
}

// Exposer les fonctions lightbox globalement
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;