/**
 * MasonryGrid — grille organique image-only
 *
 * Pattern 9 items sur 3 colonnes (se répète en boucle) :
 *   Row 1 : [tall 1×2] [normal] [normal]
 *   Row 2 : [tall cont] [wide 2×1       ]
 *   Row 3 : [wide 2×1       ] [normal   ]
 *   Row 4 : [normal] [normal] [normal   ]
 *
 * @param {Object}   options
 * @param {Array}    options.photos         — Tableau de photos (objets WP)
 * @param {number}   [options.gap=8]        — Gouttière en px
 * @param {Function} [options.onPhotoClick] — Callback (photo, index)
 * @returns {HTMLDivElement}
 */
import { createImageCard } from './image-card.js';

const VARIANTS = ['tall', 'normal', 'normal', 'wide', 'wide', 'normal', 'normal', 'normal', 'normal'];

export function createMasonryGrid({ photos = [], gap = 8, onPhotoClick = null } = {}) {
    const grid = document.createElement('div');
    grid.className = 'masonry-grid';
    grid.style.setProperty('--masonry-gap', `${gap}px`);

    photos.forEach((photo, index) => {
        const src     = photo.full_size || photo.url || photo.guid || photo.source_url || '';
        const alt     = photo.title || photo.post_title || photo.name || '';
        const variant = VARIANTS[index % VARIANTS.length];

        const card = createImageCard({
            src,
            alt,
            variant,
            onClick: onPhotoClick ? () => onPhotoClick(photo, index) : null,
        });

        grid.appendChild(card);
    });

    return grid;
}
