/* Efekt z programu Petrie Dish: po najechaniu na kafelek tłem strony staje się symulacja cząsteczek —
   kolorowe gatunki z losową macierzą przyciągania/odpychania, lepkość płynu, wiązania między bliskimi
   cząstkami i neonowa poświata. Kursor działa jak wir (jak wciśnięta mysz w Petrie Dish).
   Mechanika uproszczona z oryginału (przestrzeń zapętlona, siatka sąsiedztwa), tylko Canvas 2D. */

const COLORS = ['#19e6ff', '#ff3df0', '#7dff4f', '#ffd23f', '#8a5cff', '#ff6a2b'];
const CFG = {
  count: 650, radius: 2.1, range: 64, viscosity: 0.965, force: 0.045, maxSpeed: 3.2,
  bondDist: 26, bondAlpha: 0.38, mouseRange: 150, mouseForce: 0.55, swirl: 0.7, fade: 1400,
};

let world = null;

function create() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  // z-index: -1 → nad tłem strony (body), pod całą zawartością
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:0;transition:opacity ${CFG.fade}ms ease;background:#03040a`;
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const S = COLORS.length;
  // macierz: dodatnia = przyciąganie, ujemna = odpychanie (jak w Petrie Dish: -0.6…0.6)
  const M = Array.from({ length: S }, () => Array.from({ length: S }, () => (Math.random() * 1.2 - 0.6)));
  for (let i = 0; i < S; i++) M[i][i] = Math.random() * 0.5 - 0.1;   // własny gatunek: lekko się skupia

  let W = 0, H = 0, dpr = 1;
  let px, py, vx, vy, sp, N = CFG.count;
  px = new Float32Array(N); py = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
  sp = new Uint8Array(N);

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  for (let i = 0; i < N; i++) {
    px[i] = Math.random() * W; py[i] = Math.random() * H;
    vx[i] = (Math.random() - 0.5) * 2; vy[i] = (Math.random() - 0.5) * 2;
    sp[i] = i % S;
  }

  // siatka sąsiedztwa
  const R = CFG.range;
  let cols = 0, rows = 0, head, next;
  next = new Int32Array(N);
  function buildGrid() {
    cols = Math.ceil(W / R); rows = Math.ceil(H / R);
    if (!head || head.length !== cols * rows) head = new Int32Array(cols * rows);
    head.fill(-1);
    for (let i = 0; i < N; i++) {
      const c = Math.min(cols - 1, Math.max(0, (px[i] / R) | 0));
      const r = Math.min(rows - 1, Math.max(0, (py[i] / R) | 0));
      const k = r * cols + c;
      next[i] = head[k]; head[k] = i;
    }
  }

  const mouse = { x: -9999, y: -9999, on: false };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = false, raf = 0, hideTimer = 0;

  const bonds = [];
  function step() {
    buildGrid();
    bonds.length = 0;
    const rSq = R * R, bSq = CFG.bondDist * CFG.bondDist;
    for (let i = 0; i < N; i++) {
      let ax = 0, ay = 0;
      const gc = Math.min(cols - 1, Math.max(0, (px[i] / R) | 0));
      const gr = Math.min(rows - 1, Math.max(0, (py[i] / R) | 0));
      for (let dr = -1; dr <= 1; dr++) {
        const rr = gr + dr; if (rr < 0 || rr >= rows) continue;
        for (let dc = -1; dc <= 1; dc++) {
          const cc = gc + dc; if (cc < 0 || cc >= cols) continue;
          for (let j = head[rr * cols + cc]; j !== -1; j = next[j]) {
            if (j === i) continue;
            const dx = px[j] - px[i], dy = py[j] - py[i];
            const d2 = dx * dx + dy * dy;
            if (d2 > rSq || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const t = d / R;
            let f;
            if (t < 0.22) f = t / 0.22 - 1;                          // zawsze odpychanie z bliska
            else f = M[sp[i]][sp[j]] * (1 - Math.abs(2 * t - 1 - 0.22) / (0.78)); // przyciąganie/odpychanie
            ax += (dx / d) * f; ay += (dy / d) * f;
            if (j > i && d2 < bSq && sp[i] === sp[j]) bonds.push(i, j);
          }
        }
      }
      vx[i] += ax * CFG.force; vy[i] += ay * CFG.force;
      if (mouse.on) {
        const dx = px[i] - mouse.x, dy = py[i] - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CFG.mouseRange * CFG.mouseRange && d2 > 1) {
          const d = Math.sqrt(d2), s = (1 - d / CFG.mouseRange) * CFG.mouseForce;
          vx[i] += (-dx / d) * s * 0.35 + (-dy / d) * s * CFG.swirl;   // lekki ciąg do środka + wir
          vy[i] += (-dy / d) * s * 0.35 + (dx / d) * s * CFG.swirl;
        }
      }
    }
    for (let i = 0; i < N; i++) {
      vx[i] *= CFG.viscosity; vy[i] *= CFG.viscosity;
      const v = Math.hypot(vx[i], vy[i]);
      if (v > CFG.maxSpeed) { vx[i] *= CFG.maxSpeed / v; vy[i] *= CFG.maxSpeed / v; }
      px[i] += vx[i]; py[i] += vy[i];
      if (px[i] < 0) px[i] += W; else if (px[i] >= W) px[i] -= W;     // przestrzeń zapętlona (torus)
      if (py[i] < 0) py[i] += H; else if (py[i] >= H) py[i] -= H;
    }
  }

  // poświata cząstek: gradient od jasnego środka do przezroczystości (rysowany raz na gatunek)
  const GS = 64;
  const glow = COLORS.map((col) => {
    const c = document.createElement('canvas'); c.width = c.height = GS;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(GS / 2, GS / 2, 0, GS / 2, GS / 2, GS / 2);
    gr.addColorStop(0, col + 'a6'); gr.addColorStop(0.25, col + '55'); gr.addColorStop(0.6, col + '16'); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.fillRect(0, 0, GS, GS);
    return c;
  });

  function draw() {
    // smugi: pół-przezroczyste przyciemnienie zamiast pełnego czyszczenia
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(3,4,10,0.28)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.2;
    for (let s = 0; s < S; s++) {
      ctx.strokeStyle = COLORS[s]; ctx.globalAlpha = CFG.bondAlpha;
      ctx.beginPath();
      for (let b = 0; b < bonds.length; b += 2) {
        const i = bonds[b], j = bonds[b + 1];
        if (sp[i] !== s) continue;
        if (Math.abs(px[i] - px[j]) > W / 2 || Math.abs(py[i] - py[j]) > H / 2) continue;   // nie rysuj przez szew torusa
        ctx.moveTo(px[i], py[i]); ctx.lineTo(px[j], py[j]);
      }
      ctx.stroke();
    }
    for (let s = 0; s < S; s++) {
      ctx.fillStyle = COLORS[s];
      ctx.globalAlpha = 1;                            // poświata: gradient promienisty (sprite)
      const gr = CFG.radius * 6.5;
      for (let i = s; i < N; i += S) ctx.drawImage(glow[s], px[i] - gr, py[i] - gr, gr * 2, gr * 2);
      ctx.globalAlpha = 0.95;                         // jądro
      ctx.beginPath();
      for (let i = s; i < N; i += S) { ctx.moveTo(px[i] + CFG.radius, py[i]); ctx.arc(px[i], py[i], CFG.radius, 0, 6.2832); }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!reduced) step();
    draw();
  }

  return {
    show() {
      clearTimeout(hideTimer);
      canvas.style.opacity = '1';
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    },
    hide() {
      canvas.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { running = false; cancelAnimationFrame(raf); }, CFG.fade + 100);
    },
  };
}

/** Wywoływane po najechaniu na kafelek; zwraca funkcję kończącą efekt. */
export function start() {
  if (!matchMedia('(hover: hover)').matches) return () => {};
  world ||= create();
  world.show();
  return () => world.hide();
}
