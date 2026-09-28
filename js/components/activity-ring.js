/**
 * Activity Ring — Sigma Design System
 * Figma : node 1585-17359 — /Home/Components/Status/Activity ring
 *
 * 3 anneaux concentriques (Outer/Center/Inner), chacun avec sa propre
 * progression 0-100%. Rendu en SVG natif (stroke-dasharray) plutôt qu'avec
 * les 33 images pré-rendues par palier de 10% du Figma — n'importe quel
 * pourcentage est possible, et la valeur peut être mise à jour dynamiquement
 * via l'élément retourné (voir `update()`).
 *
 * @param {Object} options
 * @param {Array<{percentage:number, color?:string}>} [options.rings] — anneaux, de l'extérieur vers l'intérieur (défaut : 3 vides à 0%)
 * @param {string|number} [options.value=''] — texte affiché au centre (ex. "941")
 * @param {number} [options.size=192]        — largeur/hauteur du SVG en px
 * @param {number} [options.strokeWidth=8]   — épaisseur des anneaux
 * @param {number} [options.gap=12]          — écart de rayon entre deux anneaux successifs
 * @param {boolean} [options.onMaterial=false] — variante sur photo (anneaux blancs translucides)
 * @param {string}  [options.id]
 * @param {string}  [options.className]
 * @returns {HTMLDivElement} — porte une méthode `.update(rings, value)` pour rafraîchir sans tout reconstruire
 */
export function createActivityRing({
  rings = [{ percentage: 0 }, { percentage: 0 }, { percentage: 0 }],
  value = '',
  size = 192,
  strokeWidth = 8,
  gap = 12,
  onMaterial = false,
  id = null,
  className = '',
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = ['activity-ring', onMaterial ? 'activity-ring--on-material' : '', className]
    .filter(Boolean).join(' ');
  if (id) wrap.id = id;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  wrap.appendChild(svg);

  const cx = size / 2;
  const cy = size / 2;
  const outerDiameter = size * 0.75; // proportion Figma : 144px d'anneau pour 192px de cadre

  function circleAt(diameter, extraClass, strokeColor) {
    const r = (diameter - strokeWidth) / 2;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('stroke-width', strokeWidth);
    c.setAttribute('class', extraClass);
    if (strokeColor) c.style.stroke = strokeColor;
    return c;
  }

  function circumference(diameter) {
    const r = (diameter - strokeWidth) / 2;
    return 2 * Math.PI * r;
  }

  function setProgress(circle, diameter, percentage) {
    const c = circumference(diameter);
    const pct = Math.max(0, Math.min(100, percentage));
    circle.setAttribute('stroke-dasharray', c);
    circle.setAttribute('stroke-dashoffset', c * (1 - pct / 100));
    circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  }

  const progressCircles = [];

  rings.forEach((ring, i) => {
    const diameter = outerDiameter - i * gap * 2;
    svg.appendChild(circleAt(diameter, 'activity-ring__track'));
    const progress = circleAt(diameter, 'activity-ring__progress', ring.color);
    setProgress(progress, diameter, ring.percentage);
    svg.appendChild(progress);
    progressCircles.push({ circle: progress, diameter });
  });

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', cx);
  text.setAttribute('y', cy);
  text.setAttribute('class', 'activity-ring__value');
  text.textContent = value;
  svg.appendChild(text);

  /** Met à jour les pourcentages / la valeur centrale sans reconstruire le SVG. */
  wrap.update = (newRings = [], newValue) => {
    newRings.forEach((ring, i) => {
      if (progressCircles[i]) {
        setProgress(progressCircles[i].circle, progressCircles[i].diameter, ring.percentage);
        if (ring.color) progressCircles[i].circle.style.stroke = ring.color;
      }
    });
    if (newValue !== undefined) text.textContent = newValue;
  };

  return wrap;
}
