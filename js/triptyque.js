/* triptyque.js — chargé comme script classique (pas de module) */

const TRIPTYQUE_KEY = 'triptyque_photos';
const TRIPTYQUE_MAX = 3;

function triptyqueGet() {
    try { return JSON.parse(localStorage.getItem(TRIPTYQUE_KEY)) || []; }
    catch { return []; }
}

function triptyqueSave(photos) {
    localStorage.setItem(TRIPTYQUE_KEY, JSON.stringify(photos));
    console.log('🎞️ Triptyque :', photos.map(p => p.title));
    triptyqueUpdateBadge();
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
        btn.classList.remove('triptyque-add-btn--selected');
    } else {
        if (photos.length >= TRIPTYQUE_MAX) {
            triptyqueOpenModal();
            return;
        }
        photos.push(photo);
        triptyqueSave(photos);
        btn.classList.add('triptyque-add-btn--selected');
        if (photos.length === TRIPTYQUE_MAX) triptyqueOpenModal();
    }
};

// Appelé par le bouton panier dans la nav
window.openTriptyqueModal = function() {
    if (triptyqueGet().length > 0) triptyqueOpenModal();
};

function triptyqueOpenModal() {
    document.getElementById('triptyque-modal')?.remove();

    const photos = triptyqueGet();

    const slotsHtml = photos.map(p => `
        <div class="tmodal__slot">
            <img src="${triptyqueEsc(p.url)}" alt="${triptyqueEsc(p.title)}">
            <button class="tmodal__slot-remove" data-id="${p.id}">&#x2715;</button>
            <span class="tmodal__slot-title">${triptyqueEsc(p.title)}</span>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = 'triptyque-modal';
    modal.className = 'tmodal-overlay';
    modal.innerHTML = `
        <div class="tmodal">
            <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
            <p class="tmodal__label">Triptyque &mdash; ${photos.length}&#8239;/&#8239;${TRIPTYQUE_MAX}</p>
            <div class="tmodal__slots">${slotsHtml}</div>
            ${photos.length === TRIPTYQUE_MAX
                ? `<button class="tmodal__generate" id="tmodal-generate">Cr&eacute;er une histoire</button>`
                : `<p class="tmodal__hint">${TRIPTYQUE_MAX - photos.length} photo${TRIPTYQUE_MAX - photos.length > 1 ? 's' : ''} manquante${TRIPTYQUE_MAX - photos.length > 1 ? 's' : ''}</p>`
            }
            <button class="tmodal__secondary" id="tmodal-close2">R&eacute;initialiser</button>
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
        document.querySelectorAll('.triptyque-add-btn--selected').forEach(b => b.classList.remove('triptyque-add-btn--selected'));
        closeModal();
    };
    modal.onclick = function(e) { if (e.target === modal) closeModal(); };

    modal.querySelectorAll('.tmodal__slot-remove').forEach(function(btn) {
        btn.onclick = function() {
            const id = parseInt(btn.dataset.id);
            triptyqueSave(triptyqueGet().filter(p => p.id !== id));
            const addBtn = document.getElementById('triptyque-btn-' + id);
            if (addBtn) addBtn.classList.remove('triptyque-add-btn--selected');
            closeModal();
        };
    });

    const genBtn = modal.querySelector('#tmodal-generate');
    if (genBtn) {
        genBtn.onclick = function() {
            triptyquePhase2(modal);
        };
    }
}

async function triptyquePhase2(modal) {
    const tmodal = modal.querySelector('.tmodal');
    const photos = triptyqueGet();

    // Transition : loader
    tmodal.innerHTML = `
        <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
        <p class="tmodal__label">Mots-cl&eacute;s du triptyque</p>
        <div class="tmodal__loading">Chargement des mots-cl&eacute;s&hellip;</div>
    `;
    modal.querySelector('#tmodal-close').onclick = function() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    };

    // Fetch keywords pour chaque photo
    const results = await Promise.all(photos.map(async function(p) {
        try {
            const resp = await fetch(
                'https://www.photographie.stephanewagner.com/wp-json/wplr-iptc/v1/media/' + p.id + '/keywords?profile=aiptc',
                { headers: { 'Authorization': 'Bearer EDNusnA0Q8TW' } }
            );
            const data = resp.ok ? await resp.json() : null;
            let kws = [];
            if (data && Array.isArray(data.keywords)) kws = data.keywords;
            else if (Array.isArray(data))              kws = data;
            else if (data && Array.isArray(data.items)) kws = data.items;
            return { photo: p, keywords: kws.filter(Boolean) };
        } catch {
            return { photo: p, keywords: [] };
        }
    }));

    // Affichage
    const rowsHtml = results.map(function(r) {
        const tags = r.keywords.length
            ? r.keywords.map(k => `<span class="tmodal__kw">${triptyqueEsc(k)}</span>`).join('')
            : `<span class="tmodal__kw tmodal__kw--empty">Aucun mot-cl&eacute;</span>`;
        return `
            <div class="tmodal__kw-row">
                <div class="tmodal__kw-thumb">
                    <img src="${triptyqueEsc(r.photo.url)}" alt="${triptyqueEsc(r.photo.title)}">
                </div>
                <div class="tmodal__kw-tags">${tags}</div>
            </div>
        `;
    }).join('');

    tmodal.innerHTML = `
        <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
        <p class="tmodal__label">Mots-cl&eacute;s du triptyque</p>
        <div class="tmodal__kw-list">${rowsHtml}</div>
        <button class="tmodal__generate" id="tmodal-story">G&eacute;n&eacute;rer l'histoire &rarr;</button>
    `;

    modal.querySelector('#tmodal-close').onclick = function() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#tmodal-story').onclick = function() {
        triptyquePhase3(modal, results);
    };
}

async function triptyquePhase3(modal, keywordResults) {
    const tmodal = modal.querySelector('.tmodal');

    // Loader
    tmodal.innerHTML = `
        <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
        <p class="tmodal__label">G&eacute;n&eacute;ration de l'histoire&hellip;</p>
        <div class="tmodal__story-loader">
            <span></span><span></span><span></span>
        </div>
    `;
    modal.querySelector('#tmodal-close').onclick = function() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    };

    // Préparer les données
    const photos = keywordResults.map(function(r) {
        return { title: r.photo.title, keywords: r.keywords };
    });

    let story = '';
    try {
        const resp = await fetch('./scripts/triptyque-story.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos }),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) throw new Error(data.error || 'Erreur serveur');
        story = data.story;
    } catch (err) {
        tmodal.innerHTML = `
            <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
            <p class="tmodal__label" style="color:#e06c6c;">Erreur</p>
            <p style="color:rgba(255,255,255,0.4); font-size:13px; text-align:center;">${triptyqueEsc(err.message)}</p>
            <button class="tmodal__secondary" id="tmodal-close2">Fermer</button>
        `;
        modal.querySelector('#tmodal-close').onclick =
        modal.querySelector('#tmodal-close2').onclick = function() {
            modal.classList.remove('tmodal-overlay--visible');
            setTimeout(() => modal.remove(), 200);
        };
        return;
    }

    // Vignettes des 3 photos
    const thumbsHtml = keywordResults.map(function(r) {
        return `<img src="${triptyqueEsc(r.photo.url)}" alt="${triptyqueEsc(r.photo.title)}" class="tmodal__story-thumb">`;
    }).join('');

    tmodal.innerHTML = `
        <button class="tmodal__close" id="tmodal-close">&#x2715;</button>
        <p class="tmodal__label">Votre triptyque</p>
        <div class="tmodal__story-thumbs">${thumbsHtml}</div>
        <p class="tmodal__story-text">${triptyqueEsc(story)}</p>
        <button class="tmodal__generate" id="tmodal-share">Partager cette histoire</button>
        <button class="tmodal__secondary" id="tmodal-close2">Fermer</button>
    `;

    function closeModal() {
        modal.classList.remove('tmodal-overlay--visible');
        setTimeout(() => modal.remove(), 200);
    }

    modal.querySelector('#tmodal-close').onclick  = closeModal;
    modal.querySelector('#tmodal-close2').onclick = closeModal;

    modal.querySelector('#tmodal-share').onclick = async function() {
        const shareData = {
            title: 'Mon triptyque — Stéphane Wagner',
            text: story,
            url: 'https://www.photographie.stephanewagner.com/',
        };
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); } catch {}
        } else {
            await navigator.clipboard.writeText(story);
            const btn = modal.querySelector('#tmodal-share');
            btn.textContent = 'Copié !';
            setTimeout(() => { btn.textContent = 'Partager cette histoire'; }, 2000);
        }
    };
}

// Init au chargement — liste vide
document.addEventListener('DOMContentLoaded', function() {
    localStorage.removeItem(TRIPTYQUE_KEY);
    triptyqueUpdateBadge();
});
