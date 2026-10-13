/* Efekt z Hive Hunger: po najechaniu na kafelek gry rój statków wylatuje z miniatury i zjada
   interfejs strony kratka po kratce (jak voxele planety w grze), a z ugryzień sypią się cząsteczki.
   Statki lecą jak boidy (separacja, zgodność kierunku, spójność, cel roju, własny "kęs").
   Po zjechaniu kursorem interfejs odrasta. Nic nie jest klikalne (pointer-events: none). */

const CELL = 7;                        // rozmiar "voxela" interfejsu w px
const CFG = {
  count: 110, speed: 4.2, turn: 0.14, reach: 7, eatFrames: 14, crater: 1.45, sense: 18, delay: 350,
  sepDist: 16, perception: 60, color: '#8fd0ff', len: 13, wid: 3,
  w: { separation: 1.5, alignment: 0.5, cohesion: 0.35, target: 1.1, feed: 3, feedFlock: 0.25 },
};
const DEBRIS = { max: 3500, minSpeed: 1.6, maxSpeed: 7, jitter: 2.2, friction: 0.97, fade: 0.014, size: 2 };

// Co może zostać zjedzone (kolejność dokumentu: rodzic przed dzieckiem)
const SELECTOR = [
  'header .photo', 'header h1', 'header .intro', '.links a', '.links .copy', '.scroll h2',
  '.project', '.project .shot-wrap', '.project img.shot', '.project h3', '.project p', '.project .tag',
  'footer', '.toys-title', '.toys button',
].join(',');

const rnd = (a, b) => a + Math.random() * (b - a);
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
probe.canvas.width = probe.canvas.height = 1;
/** Dowolny kolor CSS -> [r, g, b, a] */
function rgba(css) {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;

export function start(card) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return () => {};

  let swarm = null;
  const timer = setTimeout(() => { swarm = run(card); }, CFG.delay);   // krótkie przejazdy myszką nic nie uruchamiają
  return () => { clearTimeout(timer); swarm?.stop(); };
}

function run(card) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, cols = 0, rows = 0;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60';
  const ctx = canvas.getContext('2d');
  const mask = document.createElement('canvas');       // zjedzone kratki (nieprzezroczyste = zjedzone)
  const mctx = mask.getContext('2d');
  document.body.append(canvas);

  // ---- siatka kratek: co jest jadalne, jakiego jest koloru ----
  let state, col, remaining = 0, edible = [];
  const FREE = 1, CLAIMED = 2, EATEN = 3;
  let ready = false;

  function build() {
    W = innerWidth; H = innerHeight;
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    for (const c of [canvas, mask]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state = new Uint8Array(cols * rows);
    col = new Uint8Array(cols * rows * 3);
    edible = [];
    const accent = rgba(getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#8fd0ff');

    for (const el of document.querySelectorAll(SELECTOR)) {
      const r = el.getBoundingClientRect();
      let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
      const sc = el.closest('.scroll');
      if (sc) { const s = sc.getBoundingClientRect(); x0 = Math.max(x0, s.left); y0 = Math.max(y0, s.top); x1 = Math.min(x1, s.right); y1 = Math.min(y1, s.bottom); }
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;

      const st = getComputedStyle(el);
      if (st.visibility === 'hidden' || st.display === 'none') continue;
      const isImg = el.matches('img');
      const kind = isImg ? 'img' : el.matches('.project, .shot-wrap') ? 'box' : 'text';
      const bg = rgba(st.backgroundColor), fg = rgba(st.color);
      const circle = el.matches('.photo') && st.borderRadius.includes('%');

      const cx0 = Math.floor(x0 / CELL), cx1 = Math.floor((x1 - 0.01) / CELL);
      const cy0 = Math.floor(y0 / CELL), cy1 = Math.floor((y1 - 0.01) / CELL);
      let pix = null;
      const pw = cx1 - cx0 + 1, ph = cy1 - cy0 + 1;
      if (isImg) {
        try {
          const c = document.createElement('canvas'); c.width = pw; c.height = ph;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(el, 0, 0, pw, ph);
          pix = g.getImageData(0, 0, pw, ph).data;
        } catch { pix = null; }
      }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const idx = cy * cols + cx;
        if (circle) {
          const dx = (cx * CELL + CELL / 2 - mx) / hw, dy = (cy * CELL + CELL / 2 - my) / hh;
          if (dx * dx + dy * dy > 1.15) continue;
        }
        if (!state[idx]) { state[idx] = FREE; edible.push(idx); }
        let c = null;
        if (pix) { const k = ((cy - cy0) * pw + (cx - cx0)) * 4; c = [pix[k], pix[k + 1], pix[k + 2]]; }
        else if (kind === 'box') c = bg[3] > 20 ? bg : null;
        else if (hash(cx, cy) < 50) c = fg;
        else if (!col[idx * 3] && !col[idx * 3 + 1] && !col[idx * 3 + 2]) c = accent;
        if (c) { col[idx * 3] = c[0]; col[idx * 3 + 1] = c[1]; col[idx * 3 + 2] = c[2]; }
      }
    }
    remaining = edible.length;
    mctx.clearRect(0, 0, W, H);
    ready = true;
  }
  build();

  // ---- statki ----
  const MAX = CFG.count;
  const sx = new Float32Array(MAX), sy = new Float32Array(MAX), dx = new Float32Array(MAX), dy = new Float32Array(MAX);
  const food = new Int32Array(MAX).fill(-1), landed = new Uint8Array(MAX), timer = new Float32Array(MAX), dead = new Uint8Array(MAX);
  let n = 0;
  const spawnPoint = () => { const r = card.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  let tx = 0, ty = 0, exhausted = false;
  function retarget() {
    // cel roju: najbliższa wolna kratka od środka roju (rój "przeżuwa" interfejs po kolei)
    let cx = 0, cy = 0;
    if (n) { for (let i = 0; i < n; i++) { cx += sx[i]; cy += sy[i]; } cx /= n; cy /= n; } else [cx, cy] = spawnPoint();
    let best = -1, bd = Infinity;
    for (const idx of edible) {
      if (state[idx] !== FREE) continue;
      const x = (idx % cols) * CELL + CELL / 2, y = Math.floor(idx / cols) * CELL + CELL / 2;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bd) { bd = d; best = idx; }
    }
    if (best >= 0) { tx = (best % cols) * CELL + CELL / 2; ty = Math.floor(best / cols) * CELL + CELL / 2; }
    exhausted = false;
  }
  retarget();

  /** Własny "kęs": losowa wolna kratka w pobliżu celu roju */
  function pickFood() {
    const gx = Math.floor(tx / CELL), gy = Math.floor(ty / CELL), R = CFG.sense;
    let pick = -1, seen = 0;
    for (let y = Math.max(0, gy - R); y <= Math.min(rows - 1, gy + R); y++)
      for (let x = Math.max(0, gx - R); x <= Math.min(cols - 1, gx + R); x++) {
        const idx = y * cols + x;
        if (state[idx] === FREE && ++seen && Math.random() * seen < 1) pick = idx;
      }
    if (pick < 0) exhausted = true; else state[pick] = CLAIMED;
    return pick;
  }

  // ---- cząsteczki (jak Debris3D: wylot od środka, tarcie, wygasanie) ----
  const P = DEBRIS.max;
  const px = new Float32Array(P), py = new Float32Array(P), vx = new Float32Array(P), vy = new Float32Array(P), pl = new Float32Array(P);
  const pc = new Uint8Array(P * 3);
  let pn = 0;
  function emit(x, y, r, g, b, count) {
    for (let k = 0; k < count; k++) {
      let i = pn;
      if (i >= P) i = (Math.random() * P) | 0; else pn++;
      const a = Math.random() * 6.2832, s = rnd(DEBRIS.minSpeed, DEBRIS.maxSpeed);
      px[i] = x + rnd(-4, 4); py[i] = y + rnd(-4, 4);
      vx[i] = Math.cos(a) * s + rnd(-0.5, 0.5) * DEBRIS.jitter;
      vy[i] = Math.sin(a) * s + rnd(-0.5, 0.5) * DEBRIS.jitter;
      pl[i] = 1;
      pc[i * 3] = Math.min(255, r * 1.5 + 50); pc[i * 3 + 1] = Math.min(255, g * 1.5 + 50); pc[i * 3 + 2] = Math.min(255, b * 1.5 + 50);
    }
  }

  function eatCell(idx) {
    if (state[idx] !== FREE && state[idx] !== CLAIMED) return;
    state[idx] = EATEN; remaining--;
    const x = (idx % cols) * CELL, y = Math.floor(idx / cols) * CELL;
    mctx.fillStyle = '#000';
    mctx.fillRect(x - 0.5, y - 0.5, CELL + 1, CELL + 1);
    emit(x + CELL / 2, y + CELL / 2, col[idx * 3], col[idx * 3 + 1], col[idx * 3 + 2], 2);
  }
  function bite(idx) {
    const gx = idx % cols, gy = Math.floor(idx / cols), R = CFG.crater * rnd(0.8, 1.3), m = Math.ceil(R);
    for (let y = gy - m; y <= gy + m; y++) for (let x = gx - m; x <= gx + m; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if ((x - gx) ** 2 + (y - gy) ** 2 <= R * R) eatCell(y * cols + x);
    }
    emit(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 143, 208, 255, 5);   // błysk w kolorze statków
  }

  // ---- pętla ----
  let leaving = false, leaveFrames = 0, last = performance.now(), raf = 0, frame = 0, stopped = false;

  function step(dt) {
    const [ox, oy] = spawnPoint();
    const finished = remaining <= 0;
    const goHome = leaving || finished;
    if (!goHome && n < MAX && frame % 2 === 0) {
      for (let k = 0; k < 3 && n < MAX; k++, n++) {
        const a = Math.random() * 6.2832;
        sx[n] = ox + rnd(-20, 20); sy[n] = oy + rnd(-12, 12); dx[n] = Math.cos(a); dy[n] = Math.sin(a);
        food[n] = -1; landed[n] = 0; dead[n] = 0;
      }
    }
    if (exhausted && !goHome) retarget();

    const w = CFG.w, per2 = CFG.perception ** 2, sep2 = CFG.sepDist ** 2;
    for (let i = 0; i < n; i++) {
      if (landed[i]) {
        if (goHome || state[food[i]] !== CLAIMED) { landed[i] = 0; food[i] = -1; }   // koniec albo kęs zjadł już ktoś inny
        else {
          timer[i] -= dt;
          if (frame % 5 === 0) { const c = food[i] * 3; emit(sx[i], sy[i], col[c], col[c + 1], col[c + 2], 1); }
          if (timer[i] <= 0) { bite(food[i]); landed[i] = 0; food[i] = -1; }
          else continue;
        }
      }
      if (food[i] >= 0 && state[food[i]] !== CLAIMED) food[i] = -1;
      if (goHome && food[i] >= 0) { if (state[food[i]] === CLAIMED) state[food[i]] = FREE; food[i] = -1; }
      if (food[i] < 0 && !goHome && ready) food[i] = pickFood();

      let gx = tx, gy = ty, gw = w.target, flock = 1;
      if (goHome) { gx = ox; gy = oy; gw = 3; flock = 0.3; }
      else if (food[i] >= 0) {
        gx = (food[i] % cols) * CELL + CELL / 2; gy = Math.floor(food[i] / cols) * CELL + CELL / 2;
        gw = w.feed; flock = w.feedFlock;
        const ddx = gx - sx[i], ddy = gy - sy[i];
        if (ddx * ddx + ddy * ddy < (CFG.reach + CFG.speed) ** 2) {
          landed[i] = 1; timer[i] = CFG.eatFrames * rnd(0.7, 1.3);
          sx[i] = gx; sy[i] = gy;
          continue;
        }
      }

      let fx = 0, fy = 0, sepx = 0, sepy = 0, ax = 0, ay = 0, cx = 0, cy = 0, c = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const ex = sx[i] - sx[j], ey = sy[i] - sy[j], d2 = ex * ex + ey * ey;
        if (d2 > per2 || d2 === 0) continue;
        c++; ax += dx[j]; ay += dy[j]; cx += sx[j]; cy += sy[j];
        if (d2 < sep2) { sepx += ex / d2; sepy += ey / d2; }
      }
      const add = (x, y, k) => { const l = Math.hypot(x, y); if (l > 1e-6) { fx += (x / l) * k; fy += (y / l) * k; } };
      add(sepx, sepy, w.separation);
      if (c) { add(ax, ay, w.alignment * flock); add(cx / c - sx[i], cy / c - sy[i], w.cohesion * flock); }
      add(gx - sx[i], gy - sy[i], gw);

      const nx = dx[i] + fx * CFG.turn * dt, ny = dy[i] + fy * CFG.turn * dt;
      const l = Math.hypot(nx, ny) || 1;
      dx[i] = nx / l; dy[i] = ny / l;
      sx[i] += dx[i] * CFG.speed * dt; sy[i] += dy[i] * CFG.speed * dt;
      if (goHome && Math.hypot(ox - sx[i], oy - sy[i]) < 14) dead[i] = 1;
    }
    // usuń statki, które wróciły do miniatury
    for (let i = n - 1; i >= 0; i--) if (dead[i]) {
      n--;
      sx[i] = sx[n]; sy[i] = sy[n]; dx[i] = dx[n]; dy[i] = dy[n]; food[i] = food[n]; landed[i] = landed[n]; timer[i] = timer[n]; dead[i] = dead[n];
      dead[n] = 0;
    }

    // cząsteczki
    const fr = Math.pow(DEBRIS.friction, dt), fade = DEBRIS.fade * dt;
    let wi = 0;
    for (let r = 0; r < pn; r++) {
      const l = pl[r] - fade;
      if (l <= 0) continue;
      vx[wi] = vx[r] * fr; vy[wi] = vy[r] * fr;
      px[wi] = px[r] + vx[wi] * dt; py[wi] = py[r] + vy[wi] * dt;
      pl[wi] = l;
      if (wi !== r) { pc[wi * 3] = pc[r * 3]; pc[wi * 3 + 1] = pc[r * 3 + 1]; pc[wi * 3 + 2] = pc[r * 3 + 2]; }
      wi++;
    }
    pn = wi;

    // odrastanie interfejsu po zjechaniu kursorem
    if (leaving) {
      leaveFrames += dt;
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = `rgba(0,0,0,${Math.min(1, 0.06 * dt)})`;
      mctx.fillRect(0, 0, W, H);
      mctx.globalCompositeOperation = 'source-over';
      if (leaveFrames > 80) mctx.clearRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    // zjedzone kratki = tło strony (bieżący kolor motywu)
    if (!leaving || leaveFrames <= 80) {
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    // cząsteczki
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pn; i++) {
      ctx.fillStyle = `rgba(${pc[i * 3]},${pc[i * 3 + 1]},${pc[i * 3 + 2]},${pl[i]})`;
      ctx.fillRect(px[i], py[i], DEBRIS.size, DEBRIS.size);
    }
    // statki
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = CFG.color;
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.translate(sx[i], sy[i]);
      ctx.rotate(Math.atan2(dy[i], dx[i]));
      ctx.globalAlpha = 0.13; ctx.fillRect(-CFG.len * 0.8, -CFG.wid * 1.2, CFG.len * 1.6, CFG.wid * 2.4);   // poświata
      ctx.globalAlpha = 1; ctx.fillRect(-CFG.len / 2, -CFG.wid / 2, CFG.len, CFG.wid);
      ctx.restore();
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(3, Math.max(0.25, (now - last) / 16.667));
    last = now; frame++;
    step(dt);
    draw();
    if (leaving && n === 0 && pn === 0 && leaveFrames > 80) teardown();
  }
  raf = requestAnimationFrame(loop);

  // przewijanie / zmiana rozmiaru: układ się zmienił, więc kratki liczymy od nowa
  let rebuildTimer = 0;
  const relayout = () => {
    ready = false; mctx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { food[i] = -1; landed[i] = 0; }
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => { if (!stopped) { build(); retarget(); } }, 150);
  };
  addEventListener('scroll', relayout, true);
  addEventListener('resize', relayout);

  function teardown() {
    cancelAnimationFrame(raf);
    clearTimeout(rebuildTimer);
    removeEventListener('scroll', relayout, true);
    removeEventListener('resize', relayout);
    canvas.remove();
  }

  return {
    stop() {
      if (stopped) return;
      stopped = true; leaving = true; leaveFrames = 0;
      for (let i = 0; i < n; i++) { food[i] = -1; landed[i] = 0; }
    },
  };
}
