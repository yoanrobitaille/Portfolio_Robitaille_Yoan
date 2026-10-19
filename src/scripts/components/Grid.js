export default class Grid {
  constructor(element) {
    this.element = element;
    this.init();
  }
  init() {
    console.log('grid');
    this.grid = createCursorGrid(this.element, {
      color: '#f0997b', // couleur des cellules allumées
      cellSize: 45, // taille d'une cellule (px)
      radius: 130, // rayon d'influence du curseur (px)
      lineWidth: 1.3, // épaisseur des traits
      holdTime: 100, // temps (ms) où une cellule reste allumée avant de s'éteindre
      fadeDuration: 175, // durée (ms) du fondu de sortie
      clickPulse: false, // onde au clic
      pulseSpeed: 450, // vitesse de l'onde (px/s)
      strokeOpacity: 0.4, // opacité des contours (0 à 1)
      fillOpacity: 0, // léger remplissage des cellules (0 = aucun)
    });
  }
}
function createCursorGrid(canvas, options = {}) {
  const opts = {
    color: '#f0997b', // couleur des cellules allumées
    cellSize: 45, // taille d'une cellule (px)
    radius: 130, // rayon d'influence du curseur (px)
    lineWidth: 1.3, // épaisseur des traits
    holdTime: 100, // temps (ms) où une cellule reste allumée avant de s'éteindre
    fadeDuration: 350, // durée (ms) du fondu de sortie
    clickPulse: false, // onde au clic
    pulseSpeed: 450, // vitesse de l'onde (px/s)
    strokeOpacity: 0.4, // opacité des contours (0 à 1)
    fillOpacity: 0.0, // léger remplissage des cellules (0 = aucun)
    ...options,
  };

  const ctx = canvas.getContext('2d');
  const cells = new Map(); // "col,row" -> { peak, lastHit }
  const pulses = [];
  const pointer = { x: 0, y: 0, active: false };
  let width = 0,
    height = 0,
    cols = 0,
    rows = 0;
  let rafId = null;

  // Respecte la préférence "réduire les animations"
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  if (reduceMotion) return { destroy() {} };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(width / opts.cellSize);
    rows = Math.ceil(height / opts.cellSize);
    start();
  }

  // Intensité actuelle d'une cellule selon le temps écoulé depuis son dernier "hit"
  function valueOf(cell, now) {
    const elapsed = now - cell.lastHit;
    if (elapsed <= opts.holdTime) return cell.peak;
    const t = (elapsed - opts.holdTime) / opts.fadeDuration;
    return t >= 1 ? 0 : cell.peak * (1 - t);
  }

  function hit(col, row, strength, now) {
    if (col < 0 || row < 0 || col >= cols || row >= rows || strength <= 0)
      return;
    const key = col + ',' + row;
    const cell = cells.get(key);
    if (!cell) {
      cells.set(key, { col, row, peak: strength, lastHit: now });
      return;
    }
    const current = valueOf(cell, now);
    cell.peak = Math.max(current, strength);
    cell.lastHit = now;
  }

  // Allume les cellules dans le rayon d'un point
  function lightAround(x, y, now) {
    const s = opts.cellSize;
    const r = opts.radius;
    const c0 = Math.floor((x - r) / s),
      c1 = Math.floor((x + r) / s);
    const r0 = Math.floor((y - r) / s),
      r1 = Math.floor((y + r) / s);
    for (let col = c0; col <= c1; col++) {
      for (let row = r0; row <= r1; row++) {
        const cx = col * s + s / 2;
        const cy = row * s + s / 2;
        const d = Math.hypot(cx - x, cy - y);
        if (d < r) {
          const falloff = 1 - d / r;
          hit(col, row, falloff * falloff * (3 - 2 * falloff), now); // smoothstep
        }
      }
    }
  }

  function updatePulses(now) {
    const s = opts.cellSize;
    const maxDist = Math.hypot(width, height);
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const ringR = ((now - p.start) / 1000) * opts.pulseSpeed;
      if (ringR > maxDist) {
        pulses.splice(i, 1);
        continue;
      }
      const fade = 1 - ringR / maxDist;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const d = Math.hypot(col * s + s / 2 - p.x, row * s + s / 2 - p.y);
          const band = 1 - Math.abs(d - ringR) / s;
          if (band > 0) hit(col, row, band * fade, now);
        }
      }
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = opts.lineWidth;
    ctx.strokeStyle = opts.color;
    ctx.fillStyle = opts.color;
    const s = opts.cellSize;
    const half = opts.lineWidth / 2;

    for (const [key, cell] of cells) {
      const v = valueOf(cell, now);
      if (v <= 0.001) {
        cells.delete(key);
        continue;
      }
      const x = cell.col * s + half;
      const y = cell.row * s + half;
      if (opts.fillOpacity > 0) {
        ctx.globalAlpha = v * opts.fillOpacity;
        ctx.fillRect(x, y, s - opts.lineWidth, s - opts.lineWidth);
      }
      if (opts.strokeOpacity > 0) {
        ctx.globalAlpha = v * opts.strokeOpacity;
        ctx.strokeRect(x, y, s - opts.lineWidth, s - opts.lineWidth);
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (pointer.active) lightAround(pointer.x, pointer.y, now);
    if (pulses.length) updatePulses(now);
    draw(now);
    // On arrête la boucle quand plus rien n'est animé (économise le CPU)
    if (pointer.active || pulses.length || cells.size) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
    }
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  function toLocal(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMove(e) {
    const p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;
    start();
  }

  function onLeave() {
    pointer.active = false;
  }

  function onClick(e) {
    if (!opts.clickPulse) return;
    const p = toLocal(e);
    pulses.push({ x: p.x, y: p.y, start: performance.now() });
    start();
  }

  // Les événements sont écoutés sur la fenêtre : le canvas peut rester
  // derrière le contenu avec pointer-events: none.
  window.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  window.addEventListener('pointerdown', onClick);
  window.addEventListener('resize', resize);
  resize();

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('pointerdown', onClick);
      window.removeEventListener('resize', resize);
    },
  };
}
