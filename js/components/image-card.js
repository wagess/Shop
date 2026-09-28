/**
 * ImageCard — carte image seule (sans titre ni actions)
 *
 * @param {Object}                       options
 * @param {string}                       options.src       — URL de l'image
 * @param {string}                       [options.alt]     — Texte alternatif
 * @param {'normal'|'wide'|'tall'}       [options.variant] — Variante de span
 * @param {Function}                     [options.onClick] — Handler clic
 * @returns {HTMLDivElement}
 */
export function createImageCard({ src = '', alt = '', variant = 'normal', onClick = null } = {}) {
    const card = document.createElement('div');
    const base = variant !== 'normal' ? `image-card image-card--${variant}` : 'image-card';
    card.className = src ? `${base} shimmer` : base;

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'image-card__img';
    img.draggable = false;
    img.loading = 'lazy';
    img.onload = () => {
        img.classList.add('is-loaded');
        card.classList.remove('shimmer');
    };

    card.appendChild(img);
    if (onClick) card.addEventListener('click', onClick);

    return card;
}
