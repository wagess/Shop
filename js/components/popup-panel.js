/**
 * <popup-panel> — coquille commune aux popups du site (Figma "Modal",
 * Sigma node 1585:16501) : overlay + panneau + bouton fermer + fermeture
 * au clavier (Échap). Remplace la structure overlay/panel/close dupliquée
 * (modale "Impression" + popup d'inscription) — seul le contenu propre à
 * chaque popup (déjà déclaré en HTML comme enfants) reste spécifique.
 *
 * Utilisation : <popup-panel class="ac-popup" style="display:none;">
 *   ...contenu propre à cette popup (titre, texte, formulaire…)...
 * </popup-panel>
 *
 * API : element.open() / element.close() — remplace les anciens bindings
 * manuels par ID (ex. printSeriesModalOverlay, closePopupBtn).
 */
class PopupPanel extends HTMLElement {
    connectedCallback() {
        if (this.dataset.rendered) return;
        this.dataset.rendered = 'true';

        // Le contenu déjà présent dans le HTML (auteur de la popup) est
        // conservé tel quel — seul le wrapper overlay/panel est ajouté autour.
        const content = document.createElement('div');
        while (this.firstChild) content.appendChild(this.firstChild);

        const overlay = document.createElement('div');
        overlay.className = 'ac-popup__overlay';
        overlay.addEventListener('click', () => this.close());

        const closeBtn = document.createElement('button');
        closeBtn.className = 'ac-popup__close py-1 px-2';
        closeBtn.setAttribute('aria-label', 'Fermer');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.close());

        const panel = document.createElement('div');
        panel.className = 'ac-popup__panel py-11 px-10';
        panel.appendChild(closeBtn);
        panel.appendChild(content);

        this.appendChild(overlay);
        this.appendChild(panel);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.style.display !== 'none') this.close();
        });
    }

    open() { this.style.display = 'flex'; }
    close() { this.style.display = 'none'; }
}

customElements.define('popup-panel', PopupPanel);
