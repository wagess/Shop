/**
 * Campagne d'acquisition — formulaires d'inscription Mailchimp
 * - Footer form
 * - Pop-up (déclenché après 30s ou 50% de scroll, une seule fois par session)
 */

const POPUP_KEY = 'sw_popup_dismissed'; // localStorage

const MC_BASE = 'https://stephanewagner.us2.list-manage.com/subscribe/post-json' +
                '?u=9e13300aa07c637eb257e4db1&id=185ed965aa&f_id=00c5f7e3f0';

// ─── Utilitaire d'inscription (JSONP — cross-origin sans serveur) ─────────────

function subscribe(email, fname = '') {
    return new Promise((resolve, reject) => {
        const cbName = 'mc_cb_' + Date.now();
        const params = new URLSearchParams({ EMAIL: email, FNAME: fname, 'gdpr[297]': 'Y', c: cbName });

        window[cbName] = function(data) {
            delete window[cbName];
            script.remove();
            if (data.result === 'success') {
                resolve({ message: data.msg.replace(/<[^>]+>/g, '') });
            } else {
                reject(new Error(data.msg.replace(/<[^>]+>/g, '').replace(/^\d+ - /, '')));
            }
        };

        const script = document.createElement('script');
        script.src = MC_BASE + '&' + params.toString();
        script.onerror = () => { delete window[cbName]; script.remove(); reject(new Error('Erreur réseau')); };
        document.body.appendChild(script);
    });
}

// ─── Footer form ─────────────────────────────────────────────────────────────

(function initFooterForm() {
    const form = document.getElementById('footerSignupForm');
    const emailInput = document.getElementById('footerEmail');
    const submitBtn = document.getElementById('footerSubmitBtn');
    const msgEl = document.getElementById('footerMsg');
    if (!form) return;

    // Focus: highlight border
    emailInput.addEventListener('focus', () => { emailInput.style.borderColor = '#57ad9d'; });
    emailInput.addEventListener('blur',  () => { emailInput.style.borderColor = 'rgba(255,255,255,0.12)'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        submitBtn.disabled = true;
        submitBtn.textContent = '…';
        msgEl.style.display = 'none';

        try {
            const data = await subscribe(email);
            msgEl.style.color = '#7ecfc3';
            msgEl.textContent = '✓ ' + data.message + ' Merci !';
            msgEl.style.display = 'block';
            form.reset();
            submitBtn.textContent = '✓';
            submitBtn.style.background = '#4a9a8c';
        } catch (err) {
            msgEl.style.color = '#e87878';
            msgEl.textContent = '✗ ' + err.message;
            msgEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'S\'inscrire';
        }
    });
})();

// ─── Pop-up ───────────────────────────────────────────────────────────────────

(function initPopup() {
    // Ne pas afficher si déjà vu
    if (localStorage.getItem(POPUP_KEY)) return;

    const popup   = document.getElementById('signupPopup');
    const overlay = document.getElementById('signupPopupOverlay');
    const closeBtn = document.getElementById('closePopupBtn');
    const skipBtn  = document.getElementById('popupSkipBtn');
    const form     = document.getElementById('popupSignupForm');
    const emailInput = document.getElementById('popupEmail');
    const submitBtn  = document.getElementById('popupSubmitBtn');
    const msgEl      = document.getElementById('popupMsg');
    if (!popup) return;

    let shown = false;

    function showPopup() {
        if (shown) return;
        shown = true;
        popup.style.display = 'flex';
        // Petite animation d'entrée
        popup.querySelector('div[style*="background:rgba(20"]').style.animation = 'popupIn 0.3s ease';
    }

    function dismissPopup() {
        popup.style.display = 'none';
        localStorage.setItem(POPUP_KEY, '1');
    }

    // Déclencheur 1 : 30 secondes
    const timer = setTimeout(showPopup, 30000);

    // Déclencheur 2 : 50% de scroll
    function onScroll() {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled >= 0.5) {
            clearTimeout(timer);
            showPopup();
            window.removeEventListener('scroll', onScroll);
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Fermeture
    closeBtn.addEventListener('click', dismissPopup);
    skipBtn.addEventListener('click',  dismissPopup);
    overlay.addEventListener('click',  dismissPopup);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shown) dismissPopup();
    });

    // Soumission
    emailInput.addEventListener('focus', () => { emailInput.style.borderColor = '#57ad9d'; });
    emailInput.addEventListener('blur',  () => { emailInput.style.borderColor = 'rgba(255,255,255,0.12)'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Inscription en cours…';
        msgEl.style.display = 'none';

        try {
            const data = await subscribe(email);
            msgEl.style.color = '#7ecfc3';
            msgEl.textContent = '✓ ' + data.message + ' Bienvenue !';
            msgEl.style.display = 'block';
            submitBtn.textContent = '✓ Inscrit !';
            submitBtn.style.background = '#4a9a8c';
            skipBtn.textContent = 'Fermer';
            form.reset();
            localStorage.setItem(POPUP_KEY, '1');
        } catch (err) {
            msgEl.style.color = '#e87878';
            msgEl.textContent = '✗ ' + err.message;
            msgEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Oui, je rejoins la liste';
        }
    });
})();
