class SpotifyModal {
    constructor() {
        this.modal = null;
        this.iframe = null;
        this.floatingStopBtn = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.bindEvents();
            this.showModal();
        });
    }

    setupElements() {
        this.modal = document.getElementById('spotifyModal');
        this.closeBtn = document.getElementById('closeSpotifyModal');
        this.stopBtn = document.getElementById('stopSpotifyBtn');
    }

    bindEvents() {
        this.closeBtn?.addEventListener('click', () => this.closeModalKeepMusic());
        this.stopBtn?.addEventListener('click', () => this.stopMusic());
        
        // Fermer en cliquant sur le fond
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModalKeepMusic();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                this.closeModalKeepMusic();
            }
        });
    }

    showModal() {
        setTimeout(() => {
            if (this.modal) {
                this.modal.style.display = 'flex';
                document.body.classList.add('modal-open');
                this.iframe = this.modal.querySelector('iframe');
            }
        }, 1500);
    }

    closeModalKeepMusic() {
        this.attemptAutoplay();
        this.hideModal();
        this.createFloatingStopButton();
    }

    attemptAutoplay() {
        if (!this.iframe) return;

        const currentSrc = this.iframe.src;
        const newSrc = currentSrc.includes('autoplay=1') ? 
            currentSrc : 
            currentSrc + '&autoplay=1';
        
        this.iframe.src = newSrc;
        
        // Simuler interaction utilisateur
        setTimeout(() => {
            try {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                this.iframe.dispatchEvent(clickEvent);
            } catch (e) {
                console.log('Autoplay non autorisé par le navigateur');
            }
        }, 500);
    }

    stopMusic() {
        this.clearIframe();
        this.hideModal();
        this.removeFloatingButton();
    }

    clearIframe() {
        if (!this.iframe) return;

        const newIframe = document.createElement('iframe');
        newIframe.setAttribute('data-testid', 'embed-iframe');
        newIframe.style.borderRadius = '12px';
        newIframe.src = 'about:blank';
        newIframe.width = '100%';
        newIframe.height = '152';
        newIframe.frameBorder = '0';
        
        this.iframe.parentNode.replaceChild(newIframe, this.iframe);
        this.iframe = newIframe;
    }

    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    createFloatingStopButton() {
        this.floatingStopBtn = document.createElement('button');
        this.floatingStopBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="1"></rect>
            </svg>
        `;
        
        this.styleFloatingButton();
        this.bindFloatingButtonEvents();
        document.body.appendChild(this.floatingStopBtn);
    }

    styleFloatingButton() {
        this.floatingStopBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(45deg, #1db954, #1ed760);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
        `;
    }

    bindFloatingButtonEvents() {
        this.floatingStopBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.6)';
        });

        this.floatingStopBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.8';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.4)';
        });

        this.floatingStopBtn.addEventListener('click', () => this.stopMusic());
    }

    removeFloatingButton() {
        if (this.floatingStopBtn) {
            this.floatingStopBtn.remove();
            this.floatingStopBtn = null;
        }
    }
}

// Initialiser la modale Spotify
new SpotifyModal();