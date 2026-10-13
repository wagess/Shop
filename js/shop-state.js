// État du "shop" — MVP 2026-10-06 : une seule photo à la fois (pas de panier
// multi-items, voir idees.md et la discussion avec le PO). Persisté en
// localStorage pour survivre à la navigation entre pages (site multi-pages,
// pas de SPA — chaque page recrée la nav via createNav()). Le bouton Shop de
// la nav (js/components/nav.js) affiche 0 ou 1 selon qu'une photo est
// mémorisée ici, et rouvre le même formulaire de commande pour cette photo.
const STORAGE_KEY = 'shop_selected_photo';

export function getShopPhoto() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setShopPhoto({ title, imageUrl, photoId }) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, imageUrl, photoId }));
    } catch (e) {}
    updateShopBadge();
}

// Appelé une fois la commande envoyée (goToStep(3) dans modal.js) — le
// "panier" d'une seule place se vide, comme après un checkout.
export function clearShopPhoto() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    updateShopBadge();
}

export function updateShopBadge() {
    const badge = document.getElementById('shop-badge');
    const button = document.getElementById('shop-button');
    const clearBtn = document.getElementById('shop-clear');
    if (!badge) return;
    const hasPhoto = !!getShopPhoto();
    badge.textContent = hasPhoto ? '1' : '0';
    if (button) {
        button.disabled = !hasPhoto;
        button.classList.toggle('ac-nav__shop--empty', !hasPhoto);
    }
    if (clearBtn) {
        clearBtn.classList.toggle('ac-nav__shop-clear--visible', hasPhoto);
    }
}
