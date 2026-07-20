/**
 * BottomActionBar — Sigma Design System
 * Figma : node 1585-15444 — /Home/Components/Selection and input/Bottom action bar
 *
 * @param {Object}   options
 * @param {string}   [options.title]              — Texte principal gauche (ex: "$129")
 * @param {string}   [options.secondary]          — Lien secondaire gauche (ex: "Voir détail")
 * @param {Function} [options.onSecondary]        — Clic sur le lien secondaire
 * @param {string}   [options.actionLabel]        — Label du bouton (ex: "Commander")
 * @param {Function} [options.onAction]           — Clic sur le bouton
 * @param {boolean}  [options.showComplimentary]  — Afficher la zone gauche
 * @param {boolean}  [options.onMaterial]         — Variante glass (backdrop-blur)
 * @param {string}   [options.id]
 * @param {string}   [options.className]
 * @returns {HTMLElement}
 */
export function createBottomActionBar({
  title        = '',
  secondary    = '',
  onSecondary  = null,
  actionLabel  = 'Continuer',
  onAction     = null,
  showComplimentary = true,
  onMaterial   = false,
  id           = null,
  className    = '',
} = {}) {
  const bar = document.createElement('div');
  bar.className = [
    'bottom-action-bar',
    onMaterial ? 'bottom-action-bar--glass' : '',
    className,
  ].filter(Boolean).join(' ');
  if (id) bar.id = id;

  // ── Verre (onMaterial backdrop) ───────────────────────────────────────────
  if (onMaterial) {
    const glass = document.createElement('div');
    glass.className = 'bottom-action-bar__glass';
    glass.setAttribute('aria-hidden', 'true');
    bar.appendChild(glass);
  }

  // ── Zone gauche — titre + lien ────────────────────────────────────────────
  if (showComplimentary && (title || secondary)) {
    const left = document.createElement('div');
    left.className = 'bottom-action-bar__info';

    if (title) {
      const t = document.createElement('span');
      t.className = 'bottom-action-bar__title';
      t.textContent = title;
      left.appendChild(t);
    }

    if (secondary) {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'bottom-action-bar__secondary';
      link.textContent = secondary;
      if (onSecondary) link.addEventListener('click', onSecondary);
      left.appendChild(link);
    }

    bar.appendChild(left);
  }

  // ── Zone droite — bouton ──────────────────────────────────────────────────
  const right = document.createElement('div');
  right.className = 'bottom-action-bar__action';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bottom-action-bar__btn';
  btn.textContent = actionLabel;
  if (onAction) btn.addEventListener('click', onAction);
  right.appendChild(btn);

  bar.appendChild(right);

  return bar;
}
