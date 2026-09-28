/**
 * Progress bar — Sigma Design System
 * Figma : node 1585-17232 — /Home/Components/Status/Progress bar
 *
 * Barre de progression linéaire. Contrairement à Figma (11 variantes
 * pré-rendues par palier de 10 %), le remplissage est calculé en CSS :
 * n'importe quel pourcentage, pas seulement des paliers de 10, et la valeur
 * peut être mise à jour dynamiquement via l'élément retourné (voir `update()`).
 *
 * @param {Object} options
 * @param {number} [options.percentage=0]        — 0-100
 * @param {boolean} [options.showPercentage=true] — afficher le libellé ("40%") à droite de la barre
 * @param {boolean} [options.onMaterial=false]    — variante posée sur une photo (piste/remplissage translucides)
 * @param {string} [options.id]
 * @param {string} [options.className]
 * @returns {HTMLDivElement} — porte une méthode `.update(percentage)` pour rafraîchir sans tout reconstruire
 */
export function createProgressBar({
  percentage = 0,
  showPercentage = true,
  onMaterial = false,
  id = null,
  className = '',
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = ['progress-bar', 'gap-2', onMaterial ? 'progress-bar--on-material' : '', className]
    .filter(Boolean).join(' ');
  if (id) wrap.id = id;

  const track = document.createElement('div');
  track.className = 'progress-bar__track';

  const fill = document.createElement('div');
  fill.className = 'progress-bar__fill';
  track.appendChild(fill);
  wrap.appendChild(track);

  let label = null;
  if (showPercentage) {
    label = document.createElement('span');
    label.className = 'progress-bar__label';
    wrap.appendChild(label);
  }

  function setPercentage(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    fill.style.width = `${clamped}%`;
    if (label) label.textContent = `${Math.round(clamped)}%`;
  }

  setPercentage(percentage);

  /** Met à jour le pourcentage sans reconstruire le DOM. */
  wrap.update = (newPercentage) => setPercentage(newPercentage);

  return wrap;
}
