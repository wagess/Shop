/**
 * Footer — Sigma Design System
 * Fond noir, liens secondaires + Admin
 *
 * @param {Object} options
 * @param {string}   options.brand   — Nom affiché
 * @param {Array}    options.links   — [{ label, href, external? }]
 * @returns {HTMLElement}
 */
export function createFooter({ brand = '', links = [] } = {}) {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';

  const inner = document.createElement('div');
  inner.className = 'site-footer__inner';

  // ── Brand ──────────────────────────────────────────────────────────────────
  const brandEl = document.createElement('span');
  brandEl.className = 'site-footer__brand';
  brandEl.textContent = brand;
  inner.appendChild(brandEl);

  // ── Nav links ──────────────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'site-footer__nav';
  nav.setAttribute('aria-label', 'Liens secondaires');

  links.forEach(({ label, href, external = false }) => {
    const a = document.createElement('a');
    a.className = 'site-footer__link';
    a.href = href ?? '#';
    a.textContent = label;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    nav.appendChild(a);
  });

  inner.appendChild(nav);
  footer.appendChild(inner);

  return footer;
}
