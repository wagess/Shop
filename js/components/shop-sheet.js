// Shell de modale — Figma vDYe0oWfzs4InGstvpCxBk, node 69:632 ("Layout
// Modale shop"), instance du composant Sigma "Modal" (fichier
// QgM6d52yaLh6vkJCnTRsMa, node 1585:16501), variante On Material=False,
// intégrité vérifiée le 2026-10-04.
//
// Retenu par le PO le 2026-10-04 comme modèle pour toutes les modales —
// utilisé par le formulaire de commande (js/modal.js, .order-modal). Voir
// idees.md pour l'état de la migration.

const CHEVRON_LEFT_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5001 15L7.5 9.99999L12.5001 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.28604 5.28646L14.7141 14.7145M14.7139 5.28646L5.28585 14.7145" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Construit le shell (handle + entête), détaché du DOM. Le contenu réel
// du module shop viendra remplir .shop-sheet__body plus tard.
export function createShopSheet({
    title = 'Modal Title',
    leftAction = true,
    rightAction = true,
    showHandle = true,
    showTitle = true,
} = {}) {
    const sheet = document.createElement('div');
    sheet.className = 'shop-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = `
        ${showHandle ? `
        <div class="shop-sheet__handle-row">
            <span class="shop-sheet__handle"></span>
        </div>` : ''}
        <div class="shop-sheet__header">
            <div class="shop-sheet__header-side shop-sheet__header-side--left">
                ${leftAction ? `<button type="button" class="shop-sheet__icon-btn" data-action="back" aria-label="Retour">${CHEVRON_LEFT_ICON}</button>` : ''}
            </div>
            <div class="shop-sheet__header-side shop-sheet__header-side--center">
                ${showTitle ? `<p class="shop-sheet__title m-0">${title}</p>` : ''}
            </div>
            <div class="shop-sheet__header-side shop-sheet__header-side--right">
                ${rightAction ? `<button type="button" class="shop-sheet__icon-btn" data-action="close" aria-label="Fermer">${CLOSE_ICON}</button>` : ''}
            </div>
        </div>
        <div class="shop-sheet__body"></div>
    `;
    return sheet;
}

// Monte le shell dans un overlay plein écran (voile léger + tiroir ancré en
// bas, voir shop-sheet.css), avec l'animation d'ouverture : overlay ajouté
// au DOM, classe "--visible" posée après coup pour déclencher la transition CSS,
// retrait différé à la fermeture. Pose aussi "shop-sheet-open" sur <body> :
// si la page a un hero (.ac-hero, pages/accueil.css), il s'estompe derrière
// la modale — voir shop-sheet.css. Figma vDYe0oWfzs4InGstvpCxBk, node
// 73:674 ("Layout Modale shop ouvert").
export function openShopSheet(options = {}) {
    closeShopSheet();

    const overlay = document.createElement('div');
    overlay.id = 'shop-sheet-overlay';
    overlay.className = 'shop-sheet-overlay';

    const sheet = createShopSheet(options);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    document.body.classList.add('shop-sheet-open');
    document.body.style.overflow = 'hidden';

    overlay.getBoundingClientRect();
    overlay.classList.add('shop-sheet-overlay--visible');

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeShopSheet();
    });
    sheet.querySelector('[data-action="close"]')?.addEventListener('click', () => {
        closeShopSheet();
        options.onClose?.();
    });
    sheet.querySelector('[data-action="back"]')?.addEventListener('click', () => options.onBack?.());

    return { overlay, sheet, body: sheet.querySelector('.shop-sheet__body') };
}

export function closeShopSheet() {
    const overlay = document.getElementById('shop-sheet-overlay');
    if (!overlay) return;
    document.body.classList.remove('shop-sheet-open');
    document.body.style.overflow = '';
    overlay.classList.remove('shop-sheet-overlay--visible');
    setTimeout(() => overlay.remove(), 200);
}

// Met à jour le titre et le bouton retour d'une sheet déjà ouverte, sans la
// refermer — pour une transition d'étape à l'intérieur de la même modale.
// onBack: fonction → affiche/rebranche le bouton retour ; null → le retire
// (écran "racine", pas de retour) ; omis → le header retour n'est pas
// touché (seul le titre change).
export function setShopSheetHeader({ title, onBack } = {}) {
    const overlay = document.getElementById('shop-sheet-overlay');
    if (!overlay) return;

    const titleEl = overlay.querySelector('.shop-sheet__title');
    if (title !== undefined && titleEl) titleEl.textContent = title;

    const leftSide = overlay.querySelector('.shop-sheet__header-side--left');
    if (!leftSide || onBack === undefined) return;

    if (onBack === null) {
        leftSide.innerHTML = '';
    } else {
        leftSide.innerHTML = `<button type="button" class="shop-sheet__icon-btn" data-action="back" aria-label="Retour">${CHEVRON_LEFT_ICON}</button>`;
        leftSide.querySelector('[data-action="back"]').addEventListener('click', onBack);
    }
}
