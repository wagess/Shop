const ICON_STOP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`;
const ICON_MUSIC = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;

class SpotifyModal {
    constructor() {
        this.modal    = null;
        this.iframe   = null;
        this.navBtn   = null;
        this.isPlaying = false;
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.bindEvents();
        });
    }

    setupElements() {
        this.modal    = document.getElementById('spotifyModal');
        this.closeBtn = document.getElementById('closeSpotifyModal');
        this.stopBtn  = document.getElementById('stopSpotifyBtn');
        this.navBtn   = document.getElementById('spotifyNavBtn');
        if (this.modal) this.iframe = this.modal.querySelector('iframe');
    }

    bindEvents() {
        // Un seul handler sur le bouton nav : comportement selon l'état
        this.navBtn?.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopMusic();
            } else {
                this.showModal();
            }
        });

        // "M'accompagner en musique !" → lance et ferme la modale
        this.closeBtn?.addEventListener('click', () => this.startMusic());

        // "Non merci." → ferme sans lancer
        this.stopBtn?.addEventListener('click', () => this.hideModal());

        // Clic sur le fond
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });

        // Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                this.hideModal();
            }
        });
    }

    showModal() {
        if (!this.modal) return;
        this.modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    hideModal() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    startMusic() {
        if (this.iframe) {
            const src = this.iframe.src;
            this.iframe.src = src.includes('autoplay=1') ? src : src + '&autoplay=1';
        }
        this.isPlaying = true;
        this.updateNavBtn();
        this.hideModal();
    }

    stopMusic() {
        this.clearIframe();
        this.isPlaying = false;
        this.updateNavBtn();
    }

    clearIframe() {
        if (!this.iframe) return;
        const blank = document.createElement('iframe');
        blank.setAttribute('data-testid', 'embed-iframe');
        blank.style.borderRadius = '12px';
        blank.src = 'about:blank';
        blank.width = '100%';
        blank.height = '352';
        blank.frameBorder = '0';
        this.iframe.parentNode.replaceChild(blank, this.iframe);
        this.iframe = blank;
    }

    updateNavBtn() {
        if (!this.navBtn) return;
        this.navBtn.innerHTML = this.isPlaying ? ICON_STOP : ICON_MUSIC;
        this.navBtn.title = this.isPlaying ? 'Arrêter la musique' : 'Écouter ma playlist';
    }
}

new SpotifyModal();
