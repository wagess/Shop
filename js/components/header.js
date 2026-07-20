/**
 * Header — Sigma Design System
 * Figma : node 1585-17014 — /Home/Components/Navigation and search/Header
 *
 * @param {Object} options
 * @param {Object}   options.logo           — { src, alt, href }
 * @param {string}   options.brand          — Nom affiché à côté du logo
 * @param {Array}    options.links          — [{ label, href, badge?, badgeId? }]
 * @param {Array}    [options.actions]      — Éléments slot droit (nœuds DOM ou configs btn)
 * @param {'desktop'|'mobile'} [options.type='desktop']
 * @returns {HTMLElement}
 */
export function createHeader({
  logo = null,
  brand = '',
  links = [],
  actions = [],
  type = 'desktop',
} = {}) {
  const header = document.createElement('header');
  header.className = `site-header site-header--${type}`;
  header.setAttribute('role', 'banner');

  // ── Zone gauche : logo + nav links ──────────────────────────────────────
  const left = document.createElement('div');
  left.className = 'site-header__left';

  // Logo
  const logoWrap = document.createElement('a');
  logoWrap.className = 'site-header__logo';
  logoWrap.href = logo?.href ?? '/';

  if (logo?.src) {
    const img = document.createElement('img');
    img.src = logo.src;
    img.alt = logo.alt ?? brand;
    img.className = 'site-header__logo-img';
    logoWrap.appendChild(img);
  }

  if (brand) {
    const name = document.createElement('span');
    name.className = 'site-header__brand';
    name.textContent = brand;
    logoWrap.appendChild(name);
  }

  left.appendChild(logoWrap);

  // Nav links (desktop uniquement)
  if (type === 'desktop' && links.length) {
    const nav = document.createElement('nav');
    nav.className = 'site-header__nav';
    nav.setAttribute('aria-label', 'Navigation principale');

    links.forEach(({ label, href, badge, badgeId }) => {
      const a = document.createElement('a');
      a.className = 'site-header__link';
      a.href = href ?? '#';
      a.textContent = label;

      if (badge !== undefined) {
        const span = document.createElement('span');
        span.className = 'site-header__badge';
        if (badgeId) span.id = badgeId;
        span.textContent = badge;
        a.appendChild(span);
      }

      nav.appendChild(a);
    });

    left.appendChild(nav);
  }

  header.appendChild(left);

  // ── Zone droite : actions ────────────────────────────────────────────────
  if (type === 'desktop' && actions.length) {
    const right = document.createElement('div');
    right.className = 'site-header__actions';

    actions.forEach(action => {
      if (action instanceof HTMLElement) {
        right.appendChild(action);
      }
    });

    header.appendChild(right);
  }

  // ── Hamburger — toujours présent, affiché/masqué par CSS selon breakpoint ──
  const burger = document.createElement('button');
  burger.className = 'site-header__burger';
  burger.setAttribute('aria-label', 'Menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8H20M4 12H20M4 16H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  header.appendChild(burger);

  return header;
}
