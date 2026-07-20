/**
 * Dropdown — Sigma Design System
 * Figma : node 1585-16584 — /Home/Components/Presentation/Drop down opened
 *
 * @param {Object} options
 * @param {Array}   options.items         — [{ label, sublabel, avatar?, active?, accessory?, onClick? }]
 * @param {boolean} [options.onMaterial]  — variante glass (backdrop-blur)
 * @param {string}  [options.id]
 * @param {string}  [options.className]
 * @returns {HTMLElement}
 */
export function createDropdown({
  items = [],
  onMaterial = false,
  id = null,
  className = '',
} = {}) {
  const el = document.createElement('div');
  el.className = ['dropdown', onMaterial ? 'dropdown--glass' : '', className]
    .filter(Boolean).join(' ');
  if (id) el.id = id;

  items.forEach(item => {
    el.appendChild(_createItem(item, onMaterial));
  });

  return el;
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function _createItem({ label = '', sublabel = '', avatar = null, active = false, accessory = null, onClick = null }, onMaterial) {
  const row = document.createElement('div');
  row.className = ['dropdown__item', active ? 'dropdown__item--active' : ''].filter(Boolean).join(' ');
  if (onClick) {
    row.addEventListener('click', onClick);
    row.style.cursor = 'pointer';
  }

  // Avatar
  if (avatar) {
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'dropdown__avatar';
    if (typeof avatar === 'string' && avatar.startsWith('<')) {
      avatarWrap.innerHTML = avatar;
    } else if (typeof avatar === 'string') {
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = label;
      img.className = 'dropdown__avatar-img';
      avatarWrap.appendChild(img);
    } else if (avatar instanceof HTMLElement) {
      avatarWrap.appendChild(avatar);
    }
    row.appendChild(avatarWrap);
  }

  // Texte
  const text = document.createElement('div');
  text.className = 'dropdown__text';

  const title = document.createElement('span');
  title.className = 'dropdown__label';
  title.textContent = label;
  text.appendChild(title);

  if (sublabel) {
    const sub = document.createElement('span');
    sub.className = 'dropdown__sublabel';
    sub.textContent = sublabel;
    text.appendChild(sub);
  }

  row.appendChild(text);

  // Accessory (slot droit — icône, badge, checkbox…)
  const acc = document.createElement('div');
  acc.className = 'dropdown__accessory';
  if (accessory instanceof HTMLElement) acc.appendChild(accessory);
  else if (typeof accessory === 'string') acc.innerHTML = accessory;
  row.appendChild(acc);

  return row;
}
