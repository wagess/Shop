/**
 * Toggle — Sigma Design System
 * Figma : node 1585-15559 — /Home/Components/Selection and input/Toggle
 *
 * @param {Object}   options
 * @param {boolean}  [options.checked=false]    — état initial (On/Off)
 * @param {boolean}  [options.disabled=false]
 * @param {boolean}  [options.onMaterial=false] — variante glass (backdrop-blur)
 * @param {Function} [options.onChange]         — (checked: boolean) => void
 * @param {string}   [options.id]
 * @param {string}   [options.className]
 * @returns {HTMLElement}
 */
export function createToggle({
  checked = false,
  disabled = false,
  onMaterial = false,
  onChange = null,
  id = null,
  className = '',
} = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.role = 'switch';
  btn.setAttribute('aria-checked', String(checked));
  btn.setAttribute('aria-disabled', String(disabled));
  if (disabled) btn.disabled = true;
  if (id) btn.id = id;

  _applyClasses(btn, checked, disabled, onMaterial, className);

  const thumb = document.createElement('span');
  thumb.className = 'toggle__thumb';
  btn.appendChild(thumb);

  if (!disabled && onChange) {
    btn.addEventListener('click', () => {
      checked = !checked;
      btn.setAttribute('aria-checked', String(checked));
      _applyClasses(btn, checked, disabled, onMaterial, className);
      onChange(checked);
    });
  }

  return btn;
}

function _applyClasses(btn, checked, disabled, onMaterial, extra) {
  btn.className = [
    'toggle',
    checked    ? 'toggle--on'          : 'toggle--off',
    disabled   ? 'toggle--disabled'    : '',
    onMaterial ? 'toggle--on-material' : '',
    extra,
  ].filter(Boolean).join(' ');
}
