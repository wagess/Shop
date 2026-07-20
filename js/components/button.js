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

  btn.className = [variantClass, sizeClass, className].filter(Boolean).join(' ');

  if (id)       btn.id = id;
  if (disabled) btn.disabled = true;
  if (onClick)  btn.addEventListener('click', onClick);

  // Contenu selon labelType
  switch (labelType) {
    case 'icon-only':
      if (icon) btn.innerHTML = _wrapIcon(icon);
      btn.setAttribute('aria-label', label);
      btn.style.setProperty('padding', _iconPadding(size));
      btn.style.setProperty('width', _iconSize(size));
      break;

    case 'icon-left':
      btn.innerHTML = (icon ? _wrapIcon(icon) : '') + _wrapLabel(label);
      btn.style.setProperty('padding-left', '24px');
      break;

    case 'icon-right':
      btn.innerHTML = _wrapLabel(label) + (icon ? _wrapIcon(icon) : '');
      btn.style.setProperty('padding-right', '24px');
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

function _iconPadding(size) {
  return { lg: '16px', md: '12px', sm: '8px' }[size] ?? '16px';
}

function _iconSize(size) {
  return { lg: '56px', md: '48px', sm: '40px' }[size] ?? '56px';
}
