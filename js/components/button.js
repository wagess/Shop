/**
 * Button — Sigma Design System
 * Figma : node 1585-15045 — /Home/Components/Selection and input/Buttons
 *
 * @param {Object} options
 * @param {string}   options.label        — Texte du bouton
 * @param {'primary'|'secondary'|'tertiary'} [options.variant='primary']
 * @param {'lg'|'md'|'sm'}                  [options.size='lg']
 * @param {'text'|'icon-left'|'icon-right'|'icon-only'} [options.labelType='text']
 * @param {string}   [options.icon]       — SVG inline string (optionnel)
 * @param {boolean}  [options.disabled=false]
 * @param {string}   [options.id]         — Attribut id HTML
 * @param {string}   [options.className]  — Classes CSS additionnelles
 * @param {string}   [options.type='button'] — Type HTML (button | submit | reset)
 * @param {Function} [options.onClick]    — Handler clic
 * @returns {HTMLButtonElement}
 */
export function createButton({
  label = '',
  variant = 'primary',
  size = 'lg',
  labelType = 'text',
  icon = null,
  disabled = false,
  id = null,
  className = '',
  type = 'button',
  onClick = null,
} = {}) {
  const btn = document.createElement('button');
  btn.type = type;

  // Classes de base
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    tertiary:  'btn-tertiary',
  }[variant] ?? 'btn-primary';

  const sizeClass = {
    lg: '',       // taille par défaut (56px)
    md: 'btn-md', // 48px
    sm: 'btn-sm', // 40px
  }[size] ?? '';

  // Spacing en classes utilitaires (assets/styles/spacing-utilities.css).
  // Longhands (pt/pb/pr/pl) plutôt que les raccourcis p/px/py pour les
  // variantes icon-* : deux classes utilitaires de même spécificité se
  // départagent par leur ordre dans le fichier source, pas par labelType —
  // en longhand chaque propriété n'est fixée que par une seule classe.
  const sizePadding = { lg: { y: 4, x: 8 }, md: { y: 3, x: 6 }, sm: { y: 3, x: 5 } }[size]
    ?? { y: 4, x: 8 };
  const iconOnlyPadding = { lg: 4, md: 3, sm: 2 }[size] ?? 4;

  const spacingClass = {
    'icon-only': `gap-2 p-${iconOnlyPadding}`,
    'icon-left': `gap-2 pt-${sizePadding.y} pb-${sizePadding.y} pr-${sizePadding.x} pl-6`,
    'icon-right': `gap-2 pt-${sizePadding.y} pb-${sizePadding.y} pl-${sizePadding.x} pr-6`,
  }[labelType] ?? `gap-2 py-${sizePadding.y} px-${sizePadding.x}`;

  btn.className = [variantClass, sizeClass, spacingClass, className].filter(Boolean).join(' ');

  if (id)       btn.id = id;
  if (disabled) btn.disabled = true;
  if (onClick)  btn.addEventListener('click', onClick);

  // Contenu selon labelType
  switch (labelType) {
    case 'icon-only':
      if (icon) btn.innerHTML = _wrapIcon(icon);
      btn.setAttribute('aria-label', label);
      btn.style.setProperty('width', _iconSize(size));
      break;

    case 'icon-left':
      btn.innerHTML = (icon ? _wrapIcon(icon) : '') + _wrapLabel(label);
      break;

    case 'icon-right':
      btn.innerHTML = _wrapLabel(label) + (icon ? _wrapIcon(icon) : '');
      break;

    default: // 'text'
      btn.innerHTML = _wrapLabel(label);
      break;
  }

  return btn;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function _wrapLabel(text) {
  return `<span class="btn__label">${text}</span>`;
}

function _wrapIcon(svg) {
  return `<span class="btn__icon" aria-hidden="true">${svg}</span>`;
}

function _iconSize(size) {
  return { lg: '56px', md: '48px', sm: '40px' }[size] ?? '56px';
}
