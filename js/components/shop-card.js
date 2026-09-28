/**
 * <shop-card> — carte boutique de l'accueil (Figma vDYe0oWfzs4InGstvpCxBk,
 * bloc "Boutique"). Les deux cartes actuelles ("Tirages d'art" et "Livres &
 * monographies") ont un contenu de corps différent (liste de prix vs
 * description+note) — plutôt que d'inventer un schéma d'attributs rigide
 * pour les deux cas, ce contenu variable reste déclaré en HTML comme
 * enfants de la balise ; le composant ne génère que le cadre commun
 * (média/badge, titre, bouton CTA) partagé par toutes les cartes.
 *
 * Attributs :
 *   heading            — titre de la carte (pas "title", pour éviter le
 *                         tooltip natif du navigateur)
 *   media-id           — id de collection pour la photo (data-shop-media-id,
 *                         peuplé par home-sections.js:renderShopMedia) ;
 *                         absent = variante "placeholder" (pas de photo)
 *   badge              — texte de la pastille sur le média (variante photo
 *                         uniquement)
 *   placeholder-text   — texte affiché dans le cadre média quand il n'y a
 *                         pas de media-id
 *   cta                — libellé du bouton
 *   cta-icon            (booléen) — ajoute l'icône cercle au bouton
 *   print-btn           (booléen) — ajoute data-role="print-btn" (ouvre la
 *                         modale Impression, voir home-sections.js)
 *   disabled            (booléen) — bouton désactivé, style secondaire
 *
 * Usage :
 *   <shop-card heading="Tirages d'art" media-id="73" badge="…" cta="Commander un tirage" cta-icon print-btn>
 *     <dl class="ac-shop-card__prices">…</dl>
 *   </shop-card>
 */
const CTA_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/></svg>';

class ShopCard extends HTMLElement {
    connectedCallback() {
        if (this.dataset.rendered) return;
        this.dataset.rendered = 'true';

        const heading = this.getAttribute('heading') || '';
        const mediaId = this.getAttribute('media-id');
        const badge = this.getAttribute('badge');
        const placeholderText = this.getAttribute('placeholder-text') || '';
        const cta = this.getAttribute('cta') || '';
        const hasCtaIcon = this.hasAttribute('cta-icon');
        const isPrintBtn = this.hasAttribute('print-btn');
        const isDisabled = this.hasAttribute('disabled');

        // Contenu variable (liste de prix ou description+note) déjà déclaré
        // en HTML — conservé tel quel, juste déplacé dans le corps généré.
        const contentChildren = Array.from(this.childNodes);
        contentChildren.forEach(node => this.removeChild(node));

        const media = document.createElement('div');
        if (mediaId) {
            media.className = 'ac-shop-card__media';
            media.dataset.shopMediaId = mediaId;
            const img = document.createElement('img');
            img.alt = '';
            media.appendChild(img);
            if (badge) {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'series-card__badge py-2 px-3';
                badgeEl.textContent = badge;
                media.appendChild(badgeEl);
            }
        } else {
            media.className = 'ac-shop-card__media ac-shop-card__media--placeholder p-5';
            media.textContent = placeholderText;
        }

        const body = document.createElement('div');
        body.className = 'ac-shop-card__body p-7 gap-4';

        const titleEl = document.createElement('h3');
        titleEl.className = 'ac-shop-card__title m-0';
        titleEl.textContent = heading;
        body.appendChild(titleEl);

        contentChildren.forEach(node => body.appendChild(node));

        const ctaBtn = document.createElement('button');
        ctaBtn.type = 'button';
        ctaBtn.className = `${isDisabled ? 'btn-secondary gap-2 py-4 px-8' : 'btn-soft gap-2 py-0 pr-4 pl-6'} ac-shop-card__cta mt-auto`;
        if (isDisabled) ctaBtn.disabled = true;
        if (isPrintBtn) ctaBtn.dataset.role = 'print-btn';
        const ctaLabel = document.createElement('span');
        ctaLabel.textContent = cta;
        ctaBtn.appendChild(ctaLabel);
        if (hasCtaIcon) ctaBtn.insertAdjacentHTML('beforeend', CTA_ICON_SVG);
        body.appendChild(ctaBtn);

        this.className = `ac-shop-card ${this.className}`.trim();
        this.appendChild(media);
        this.appendChild(body);
    }
}

customElements.define('shop-card', ShopCard);
