/* triptyque.js — chargé comme script classique (pas de module)
   Panier de commande "Triptyque" (3 photos) — plus de génération d'histoire
   (retiré le 2026-09-22, voir mémoire projet_triptyque.md). */

const TRIPTYQUE_KEY = 'triptyque_photos';
const TRIPTYQUE_MAX = 3;

function _heartIcon(filled) {
    return filled
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function _setHeartBtnState(btn, selected) {
    const iconSpan = btn.querySelector('.btn__icon');
    if (iconSpan) {
        iconSpan.innerHTML = _heartIcon(selected);
        btn.classList.toggle('btn-primary', selected);
        btn.classList.toggle('btn-secondary', !selected);
    }
    btn.classList.toggle('triptyque-add-btn--selected', selected);
    btn.title = selected ? 'Retirer du triptyque' : 'Ajouter au triptyque';
}

function triptyqueGet() {
    try { return JSON.parse(localStorage.getItem(TRIPTYQUE_KEY)) || []; }
    catch { return []; }
}

function triptyqueSave(photos) {
    localStorage.setItem(TRIPTYQUE_KEY, JSON.stringify(photos));
    console.log('🎞️ Triptyque :', photos.map(p => p.title));
    triptyqueUpdateBadge();
    triptyqueUpdateBar();
}

function triptyqueUpdateBadge() {
    const badge = document.getElementById('triptyque-badge');
    if (badge) badge.textContent = triptyqueGet().length;
}

function triptyqueEsc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Appelé par le bouton + sur chaque vignette
window.toggleTriptyquePhoto = function(btn) {
    const photo = {
        id:    parseInt(btn.dataset.photoId),
        title: btn.dataset.photoTitle,
        url:   btn.dataset.photoUrl,
    };

    const photos = triptyqueGet();
    const idx    = photos.findIndex(p => p.id === photo.id);

    if (idx >= 0) {
        photos.splice(idx, 1);
        triptyqueSave(photos);
        _setHeartBtnState(btn, false);
    } else {
        if (photos.length >= TRIPTYQUE_MAX) {
            triptyqueOpenModal();
            return;
        }
        photos.push(photo);
        triptyqueSave(photos);
        _setHeartBtnState(btn, true);
        if (photos.length === TRIPTYQUE_MAX) triptyqueOpenModal();
    }
};

// Appelé par le bouton "Shop" de la nav — ouvre toujours le panier, même vide
window.openTriptyqueModal = function() {
    triptyqueOpenModal();
};

function shopHubHTML() {
    const photos = triptyqueGet();
    const count = photos.length;
    const remaining = TRIPTYQUE_MAX - count;

    return `
        <div class="tmodal shub p-6 gap-6">
            <button class="tmodal__close p-2" id="shub-close">&#x2715;</button>
            <div class="shub__grid gap-6">
                <div class="shub__content gap-4">
                    <p class="tmodal__label m-0">Boutique</p>
                    <h2 class="shub__title m-0">Acquérir une photo</h2>
                    <p class="shub__text m-0">Deux façons de commander un tirage — la mise en page définitive reste à concevoir.</p>

                    <div class="shub__option gap-1 p-4">
                        <p class="shub__option-title m-0">Impression unique</p>
                        <p class="shub__option-text m-0">Choisissez une photo dans la photothèque, puis commandez son tirage.</p>
                        <a href="/phototheque.html" class="btn-soft gap-2 py-0 pr-4 pl-6 mt-2">
                            Parcourir la photothèque
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>
                        </a>
                    </div>

                    <div class="shub__option gap-1 p-4">
                        <p class="shub__option-title m-0">Impression en lot (triptyque)</p>
                        <p class="shub__option-text m-0">${count}&#8239;/&#8239;${TRIPTYQUE_MAX} photo${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}${remaining > 0 ? ` &mdash; ${remaining} manquante${remaining > 1 ? 's' : ''}` : ''}.</p>
                        <button type="button" class="btn-soft gap-2 py-0 pr-4 pl-6 mt-2" id="shub-cart">
                            Voir mon panier
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>
                        </button>
                    </div>

                    <a href="/#shop" class="tmodal__secondary shub__shop-link m-0">Voir toute la boutique</a>
                </div>
                <div class="shub__visual">
                    <span class="shub__visual-label">[Illustration à définir]</span>
                </div>
            </div>
        </div>
    `;
}

// Variante "impression unique" — même shell, contextualisée à une photo
// précise (2026-09-24, demande PO : tous les boutons "Commander" associés
// à une photo doivent ouvrir cette modale, en mode impression unique,
// plutôt que sauter directement dans le formulaire de commande). Le CTA
// appelle window.orderPrint() tel quel (js/modal.js) — aucun changement au
// vrai formulaire de commande, juste un point d'entrée commun devant lui.
function shopUniqueHTML(photo) {
    const safeTitle = triptyqueEsc(photo.title || '');
    return `
        <div class="tmodal shub p-6 gap-6">
            <button class="tmodal__close p-2" id="shub-close">&#x2715;</button>
            <div class="shub__grid gap-6">
                <div class="shub__content gap-4">
                    <p class="tmodal__label m-0">Boutique &mdash; Impression unique</p>
                    <h2 class="shub__title m-0">Commander cette photo</h2>
                    <p class="shub__text m-0">${safeTitle ? `&laquo;&#8239;${safeTitle}&#8239;&raquo; &mdash; ` : ''}la mise en page définitive reste à concevoir, mais le formulaire de commande (format, finition, coordonnées) est déjà fonctionnel.</p>
                    <button type="button" class="btn-primary btn-commander gap-2 py-3 px-6" id="shub-order">
                        Commander cette impression
                    </button>
                    <a href="/phototheque.html" class="tmodal__secondary shub__shop-link m-0">Parcourir d'autres photos</a>
                </div>
                <div class="shub__visual shub__visual--photo">
                    <img src="${triptyqueEsc(photo.url)}" alt="${safeTitle}">
                </div>
            </div>
        </div>
    `;
}

// Modale "hub" boutique — WIREFRAME (2026-09-24, demande PO : "modale à
// designer plus précisément" plus tard, mais Shop et Commander doivent déjà
// ouvrir la même modale). Réunit sous un même point d'entrée les 3 parcours
// d'achat qui existaient jusqu'ici séparément et sans lien entre eux :
// - impression unique  → formulaire par photo (js/modal.js, orderPrint) ;
//   ouverte directement en mode contextualisé (options.mode === 'unique')
//   par tous les boutons "Commander" associés à une photo précise ;
// - impression en lot   → panier triptyque ci-dessus (inchangé, juste
//   maintenant atteint depuis ce hub en plus du bouton Shop direct) ;
// - boutique            → section #shop (accueil).
// Réutilise le shell .tmodal existant (pas un nouveau système de modale) et
// aucune des mécaniques réelles ci-dessous n'est modifiée — seul ce point
// d'entrée commun est nouveau. Le panneau de droite (mode hub) est un bloc
// pointillé explicitement non défini ("[Illustration à définir]"), même
// convention que "[prix]" ailleurs sur le site : pas de design final inventé.
//
// @param {Object} [options]
// @param {'hub'|'unique'} [options.mode='hub']
// @param {{id, title, url}} [options.photo] — requis si mode === 'unique'
window.openShopModal = function(options = {}) {
    document.getElementById('shop-hub-modal')?.remove();

    const mode = options.mode === 'unique' && options.photo ? 'unique' : 'hub';

    const modal = document.createElement('div');
    modal.id = 'shop-hub-modal';
    modal.className = 'tmodal-overlay p-5';
    modal.innerHTML = mode === 'unique' ? shopUniqueHTML(options.photo) : shopHubHTML();

    document.body.appendChild(modal);
    modal.getBoundingClientRect();
    modal.classList.add('tmodal-overlay--visible');

    function closeModal() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    }

    modal.querySelector('#shub-close').onclick = closeModal;
    modal.onclick = function(e) { if (e.target === modal) closeModal(); };

    if (mode === 'unique') {
        const photo = options.photo;
        modal.querySelector('#shub-order').onclick = function() {
            closeModal();
            setTimeout(() => window.orderPrint(photo.title, photo.url, photo.id), 210);
        };
    } else {
        modal.querySelector('#shub-cart').onclick = function() {
            closeModal();
            setTimeout(triptyqueOpenModal, 210);
        };
    }
};

function triptyqueOpenModal() {
    document.getElementById('triptyque-modal')?.remove();

    const photos = triptyqueGet();

    const slotsHtml = photos.map(p => `
        <div class="tmodal__slot gap-2">
            <img src="${triptyqueEsc(p.url)}" alt="${triptyqueEsc(p.title)}">
            <button class="tmodal__slot-remove p-0" data-id="${p.id}">&#x2715;</button>
            <span class="tmodal__slot-title">${triptyqueEsc(p.title)}</span>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = 'triptyque-modal';
    modal.className = 'tmodal-overlay p-5';
    modal.innerHTML = `
        <div class="tmodal p-6 gap-4">
            <button class="tmodal__close p-2" id="tmodal-close">&#x2715;</button>
            <p class="tmodal__label m-0">Triptyque &mdash; ${photos.length}&#8239;/&#8239;${TRIPTYQUE_MAX}</p>
            <div class="tmodal__slots gap-3">${slotsHtml}</div>
            ${photos.length === TRIPTYQUE_MAX
                ? `<button class="tmodal__generate p-3" id="tmodal-order">Commander ce triptyque</button>`
                : `<p class="tmodal__hint m-0">${TRIPTYQUE_MAX - photos.length} photo${TRIPTYQUE_MAX - photos.length > 1 ? 's' : ''} manquante${TRIPTYQUE_MAX - photos.length > 1 ? 's' : ''}</p>`
            }
            <button class="tmodal__secondary p-3" id="tmodal-close2">R&eacute;initialiser</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Forcer le reflow avant d'ajouter la classe d'animation
    modal.getBoundingClientRect();
    modal.classList.add('tmodal-overlay--visible');

    function closeModal() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    }

    modal.querySelector('#tmodal-close').onclick  = closeModal;
    modal.querySelector('#tmodal-close2').onclick = function() {
        triptyqueSave([]);
        document.querySelectorAll('.triptyque-add-btn--selected').forEach(b => _setHeartBtnState(b, false));
        closeModal();
    };
    modal.onclick = function(e) { if (e.target === modal) closeModal(); };

    modal.querySelectorAll('.tmodal__slot-remove').forEach(function(btn) {
        btn.onclick = function() {
            const id = parseInt(btn.dataset.id);
            triptyqueSave(triptyqueGet().filter(p => p.id !== id));
            const addBtn = document.getElementById('triptyque-btn-' + id);
            if (addBtn) _setHeartBtnState(addBtn, false);
            closeModal();
        };
    });

    const orderBtn = modal.querySelector('#tmodal-order');
    if (orderBtn) {
        orderBtn.onclick = function() {
            triptyqueOrder(modal);
        };
    }
}

// Étape commande — pas de tarifs/paiement en ligne pour l'instant sur le
// site (même traitement honnête que "Imprimer une série" ailleurs) : on
// confirme la sélection sans inventer de parcours de paiement.
function triptyqueOrder(modal) {
    const tmodal = modal.querySelector('.tmodal');
    const photos = triptyqueGet();

    const thumbsHtml = photos.map(function(p) {
        return `<img src="${triptyqueEsc(p.url)}" alt="${triptyqueEsc(p.title)}" class="tmodal__story-thumb">`;
    }).join('');

    tmodal.innerHTML = `
        <button class="tmodal__close p-2" id="tmodal-close">&#x2715;</button>
        <p class="tmodal__label m-0">Votre triptyque</p>
        <div class="tmodal__story-thumbs gap-2">${thumbsHtml}</div>
        <p class="tmodal__order-text m-0">Impression triptyque — formats et tarifs à venir. Revenez bientôt pour finaliser votre commande.</p>
        <button class="tmodal__secondary p-3" id="tmodal-close2">Fermer</button>
    `;

    function closeModal() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    }

    modal.querySelector('#tmodal-close').onclick  = closeModal;
    modal.querySelector('#tmodal-close2').onclick = closeModal;
}

const TRIPTYQUE_BAR_AUTO_HIDE_MS = 4000;
let triptyqueBarHideTimer = null;

function triptyqueUpdateBar() {
    const photos = triptyqueGet();
    let bar = document.getElementById('triptyque-page-bar');

    clearTimeout(triptyqueBarHideTimer);

    if (photos.length === 0) {
        if (bar) {
            bar.classList.remove('triptyque-page-bar--visible');
            setTimeout(() => bar?.remove(), 250);
        }
        return;
    }

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'triptyque-page-bar';
        document.body.appendChild(bar);
    }
    requestAnimationFrame(() => bar.classList.add('triptyque-page-bar--visible'));

    // Bandeau-résumé, pas un panier permanent : se referme tout seul, l'accès
    // au panier reste possible via le badge du bouton Shop (nav).
    triptyqueBarHideTimer = setTimeout(() => {
        bar.classList.remove('triptyque-page-bar--visible');
    }, TRIPTYQUE_BAR_AUTO_HIDE_MS);

    bar.innerHTML = '';

    if (!window.createBottomActionBar) return;

    const isComplete = photos.length === TRIPTYQUE_MAX;

    bar.appendChild(window.createBottomActionBar({
        title:       isComplete ? 'Triptyque complet' : `${photos.length}\u202f/\u202f${TRIPTYQUE_MAX} photos`,
        secondary:   isComplete ? 'Modifier la sélection' : 'Voir la sélection',
        onSecondary: triptyqueOpenModal,
        actionLabel: isComplete ? 'Commander ce triptyque →' : 'Continuer la sélection',
        onAction:    triptyqueOpenModal,
    }));
}

// Init au chargement — le panier persiste entre les pages (localStorage),
// seul le bouton "Réinitialiser" du panier le vide désormais.
document.addEventListener('DOMContentLoaded', function() {
    triptyqueUpdateBadge();
    triptyqueUpdateBar();
});
