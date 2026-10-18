/* Żywa miniatura Monitoringu obywatelskiego: ekran startowy 960×600 z oknem (oko podąża za myszką)
   i wszystkimi efektami w ustawieniach domyślnych oryginału. Bez klikania (pointer-events: none). */

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sm = (a, b, x) => { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

// szum wartościowy / fbm (do mgły)
const NZ = Float32Array.from({ length: 65536 }, Math.random);
function vn(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi,
    a = NZ[((yi & 255) << 8) | (xi & 255)], b = NZ[((yi & 255) << 8) | ((xi + 1) & 255)],
    c = NZ[(((yi + 1) & 255) << 8) | (xi & 255)], d = NZ[(((yi + 1) & 255) << 8) | ((xi + 1) & 255)],
    u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => (vn(x, y) * 0.5 + vn(x * 2.03, y * 2.03) * 0.25 + vn(x * 4.1, y * 4.1) * 0.125 + vn(x * 8.3, y * 8.3) * 0.0625) / 0.9375;

// Ustawienia domyślne z projektu (DEF)
const FX = { mistK: 0.7, dropCon: 1.05, dropN: 1.7, dropSpd: 1, grainSize: 6, grainPow: 0.2, grainSpd: 0.9 };

// Filtry SVG (szorstkie przyciski) – wstrzykiwane raz
const FILTERS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" id="eye-filters"><defs>
  <filter id="rp1" x="-12%" y="-30%" width="124%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03 0.22" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G" result="d"><animate attributeName="scale" values="15;18;13;15" dur="5s" repeatCount="indefinite"/></feDisplacementMap>
    <feTurbulence type="fractalNoise" baseFrequency="0.018 0.07" numOctaves="4" seed="9" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 .78" result="mm"/>
    <feComposite in="mm" in2="d" operator="in" result="dk"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="dk"/></feMerge>
  </filter>
  <filter id="rp2" x="-12%" y="-30%" width="124%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.026 0.28" numOctaves="3" seed="21" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="17" xChannelSelector="G" yChannelSelector="R" result="d"><animate attributeName="scale" values="17;13;19;17" dur="6.3s" repeatCount="indefinite"/></feDisplacementMap>
    <feTurbulence type="fractalNoise" baseFrequency="0.022 0.09" numOctaves="4" seed="44" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 .78" result="mm"/>
    <feComposite in="mm" in2="d" operator="in" result="dk"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="dk"/></feMerge>
  </filter>
  <filter id="rpscr" x="-5%" y="-20%" width="110%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>`;

export function mount(wrap) {
  if (!document.getElementById('eye-filters')) document.body.insertAdjacentHTML('beforeend', FILTERS);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 960, H = 600;

  const scr = document.createElement('div');
  scr.className = 'rscreen';
  scr.setAttribute('aria-hidden', 'true');
  scr.innerHTML =
    `<canvas class="layer rbg" width="${W}" height="${H}"></canvas>` +
    `<canvas class="layer rmist" width="${W}" height="${H}"></canvas>` +
    `<canvas class="layer rst" width="${W}" height="${H}"></canvas>` +
    `<canvas class="layer rgl" width="${W}" height="${H}"></canvas>` +
    `<div class="layer rsheen"></div><div class="layer rvig"></div>` +
    `<canvas class="layer rgrain"></canvas>` +
    `<nav class="rmenu"><div class="rbtn on"><span>DATA</span></div><div class="rbtn"><span>FILES</span></div></nav>`;
  wrap.append(scr);

  const fit = () => { scr.style.transform = `scale(${wrap.clientWidth / W})`; };
  fit();
  new ResizeObserver(fit).observe(wrap);

  const q = (c) => scr.querySelector(c);
  const bx = q('.rbg').getContext('2d'), mzx = q('.rmist').getContext('2d');
  const sx = q('.rst').getContext('2d'), gx = q('.rgl').getContext('2d');
  const gr = q('.rgrain'), rx = gr.getContext('2d');
  gr.width = Math.ceil(W / FX.grainSize); gr.height = Math.ceil(H / FX.grainSize);
  const gi = rx.createImageData(gr.width, gr.height);

  const gaze = { x: 0, y: 0 };

  // --- oko (makro) ---
  const lashes = Array.from({ length: 110 }, () => ({ u: Math.random(), a: rnd(-0.6, 0.6), l: rnd(0.25, 1), up: Math.random() < 0.55, w: rnd(0.6, 1.8) }));
  let bb = -1, bn = 2500;
  function eyeBg(t) {
    const ir = Math.min(H * 0.3, W * 0.2), cx = W * 0.5, cy = H * 0.5, hw = ir * 2.3;
    let open = 1;
    if (bb < 0 && t > bn) bb = t;
    if (bb >= 0) { const p = (t - bb) / 300; if (p >= 1) { bb = -1; bn = t + rnd(4000, 9000); } else open = Math.abs(p * 2 - 1) * 0.95 + 0.05; }
    bx.fillStyle = '#050202'; bx.fillRect(0, 0, W, H);
    let g = bx.createRadialGradient(cx, cy, ir, cx, cy, ir * 4);
    g.addColorStop(0, '#3a1710'); g.addColorStop(1, '#050202'); bx.fillStyle = g; bx.fillRect(0, 0, W, H);
    const up = ir * 1.55 * open, lo = ir * 1.35 * open;
    const lid = () => {
      bx.beginPath(); bx.moveTo(cx - hw, cy + ir * 0.15);
      bx.bezierCurveTo(cx - hw * 0.45, cy - up * 1.25, cx + hw * 0.55, cy - up * 1.15, cx + hw, cy + ir * 0.2);
      bx.bezierCurveTo(cx + hw * 0.55, cy + lo * 1.3, cx - hw * 0.4, cy + lo * 1.4, cx - hw, cy + ir * 0.15);
    };
    const pr = ir * (0.33 + 0.025 * Math.sin(t * 0.0013)), ix = cx + ir * 0.12 + gaze.x * ir * 0.35, iy = cy + gaze.y * ir * 0.25;
    lid(); bx.save(); bx.clip();
    g = bx.createLinearGradient(cx - hw, 0, cx + hw, 0);
    g.addColorStop(0, '#0a0404'); g.addColorStop(0.35, '#3a1a15'); g.addColorStop(0.62, '#bdb0a8'); g.addColorStop(0.78, '#fff'); g.addColorStop(0.95, '#8a7a74');
    bx.fillStyle = g; bx.fillRect(cx - hw, cy - ir * 3, hw * 2, ir * 6);
    bx.strokeStyle = 'rgba(160,30,30,.45)'; bx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { bx.beginPath(); bx.moveTo(cx + ir * 1.2, cy - ir * (0.5 - i * 0.2)); bx.quadraticCurveTo(cx + ir * (1.7 + i * 0.1), cy - ir * (0.3 - i * 0.15), cx + ir * 2.2, cy - ir * (0.7 - i * 0.3)); bx.stroke(); }
    g = bx.createRadialGradient(ix, iy, ir * 0.3, ix, iy, ir);
    g.addColorStop(0, '#8a4510'); g.addColorStop(0.5, '#b8661a'); g.addColorStop(0.85, '#7a3a0c'); g.addColorStop(1, '#2a1005');
    bx.fillStyle = g; bx.beginPath(); bx.arc(ix, iy, ir, 0, 7); bx.fill();
    for (let i = 0; i < 160; i++) {
      const a = i / 160 * 6.283 + Math.sin(i * 12.9) * 0.02, r1 = ir * (0.8 + 0.18 * ((i * 0.37) % 1));
      bx.strokeStyle = i % 2 ? 'rgba(40,15,3,.55)' : 'rgba(235,150,60,.35)'; bx.lineWidth = 1 + (i % 3) * 0.6;
      bx.beginPath(); bx.moveTo(ix + Math.cos(a) * pr, iy + Math.sin(a) * pr); bx.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1); bx.stroke();
    }
    bx.strokeStyle = 'rgba(240,170,80,.35)'; bx.lineWidth = ir * 0.05; bx.beginPath(); bx.arc(ix, iy, ir * 0.5, 0, 7); bx.stroke();
    bx.strokeStyle = 'rgba(20,8,3,.9)'; bx.lineWidth = ir * 0.1; bx.beginPath(); bx.arc(ix, iy, ir * 0.97, 0, 7); bx.stroke();
    g = bx.createRadialGradient(ix, iy, pr * 0.8, ix, iy, pr * 1.1); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.beginPath(); bx.arc(ix, iy, pr * 1.1, 0, 7); bx.fill();
    g = bx.createLinearGradient(0, cy - up, 0, cy - up + ir * 1.4); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.fillRect(cx - hw, cy - up * 1.3, hw * 2, ir * 1.8);
    g = bx.createLinearGradient(cx - hw, 0, cx + ir * 0.3, 0); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.fillRect(cx - hw, cy - ir * 3, hw * 1.3, ir * 6);
    bx.fillStyle = 'rgba(255,255,255,.18)'; bx.beginPath(); bx.arc(ix + ir * 0.62, iy - ir * 0.1, ir * 0.12, 0, 7); bx.fill();
    bx.fillStyle = 'rgba(255,255,255,.95)'; bx.beginPath(); bx.arc(ix + ir * 0.62, iy - ir * 0.1, ir * 0.04, 0, 7); bx.fill();
    bx.restore();
    lid(); bx.strokeStyle = 'rgba(0,0,0,.85)'; bx.lineWidth = ir * 0.06; bx.stroke();
    bx.strokeStyle = 'rgba(210,120,100,.3)'; bx.lineWidth = ir * 0.025; bx.stroke();
    bx.lineCap = 'round';
    for (const L of lashes) {
      const k = (L.u - 0.5) * 2, s = 1 - k * k, x = cx - hw + L.u * 2 * hw, y = cy + ir * 0.17 + (L.up ? -up * 0.95 * s : lo * s);
      const d = L.up ? -1 : 1, len = ir * L.l * (L.up ? 0.5 : 0.35);
      bx.strokeStyle = L.up ? 'rgba(10,5,4,.85)' : 'rgba(255,235,220,.28)'; bx.lineWidth = L.w;
      bx.beginPath(); bx.moveTo(x, y); bx.lineTo(x + Math.sin(L.a) * len, y + d * Math.cos(L.a) * len); bx.stroke();
    }
  }

  // --- czerwona mgła ---
  const MW = 160, MH = 100, mc = document.createElement('canvas');
  mc.width = MW; mc.height = MH;
  const mcx = mc.getContext('2d'), mi = mcx.createImageData(MW, MH);
  function mist(t) {
    const tt = t * 0.001, D = mi.data, r0 = 0.1;
    let k = 0;
    for (let j = 0; j < MH; j++) {
      const ny = j / MH;
      for (let i = 0; i < MW; i++, k += 4) {
        const nx = i / MW;
        const n1 = fbm(nx * 3.2 + tt * 0.05, ny * 3.2 + tt * 0.03), n2 = fbm(nx * 5.2 + 10 - tt * 0.04, ny * 5.2 + tt * 0.06 + 7);
        const dx = (nx - 0.5) * 1.1, dy = (ny - 0.48) * 0.9, d = Math.sqrt(dx * dx + dy * dy) * 1.7;
        let a = (sm(0.3, 1, d) * 0.85 + sm(0.5, 1, ny) * 0.8 + sm(0.5, 0, nx) * 0.35) * (0.3 + n1 * 1.5) - 0.1 + Math.max(0, n2 - 0.6) * 0.9 * sm(0.15, 0.6, d);
        a = a * sm(r0, r0 + 0.45, d);
        a = a < 0 ? 0 : a > 0.93 ? 0.93 : a;
        const c = (0.5 + n2 * 0.8) * (0.55 + 0.45 * Math.min(1, n1 * 1.6));
        D[k] = Math.min(255, 215 * c); D[k + 1] = 4 + c * 8; D[k + 2] = 10 + c * 8; D[k + 3] = a * 255;
      }
    }
    mcx.putImageData(mi, 0, 0);
    mzx.clearRect(0, 0, W, H);
    mzx.imageSmoothingEnabled = true; mzx.imageSmoothingQuality = 'high';
    mzx.globalAlpha = FX.mistK; mzx.drawImage(mc, 0, 0, W, H); mzx.globalAlpha = 1;
  }

  // --- krople na szybie ---
  function drop(c, x, y, r, k = 1) {
    k *= FX.dropCon;
    c.save(); c.translate(x, y); c.scale(1, 1.22);
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.08, 0, 0, r);
    g.addColorStop(0, `rgba(255,255,255,${0.3 * k})`); g.addColorStop(0.55, `rgba(255,255,255,${0.04 * k})`);
    g.addColorStop(0.86, `rgba(0,0,0,${0.14 * k})`); g.addColorStop(1, `rgba(0,0,0,${0.5 * k})`);
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(0, 0, r * 0.92, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = `rgba(255,255,255,${0.22 * k})`; c.lineWidth = Math.max(0.7, r * 0.12); c.stroke();
    c.beginPath(); c.arc(-r * 0.34, -r * 0.4, Math.max(0.6, r * 0.17), 0, 7); c.fillStyle = `rgba(255,255,255,${0.75 * k})`; c.fill();
    c.restore();
  }
  const nStatic = Math.round(W * H / 5200 * FX.dropN);
  for (let i = 0; i < nStatic; i++) { const p = Math.random(); drop(sx, rnd(0, W), rnd(0, H), p < 0.78 ? rnd(1.2, 3.6) : p < 0.96 ? rnd(4, 9) : rnd(10, 17), rnd(0.6, 1)); }
  const mov = [];
  const spawn = (d, first) => { d.x = rnd(0, W); d.y = first ? rnd(-50, H) : rnd(-30, -5); d.r = rnd(3, 8.5); d.v = 0; d.ph = rnd(0, 9); d.pts = []; };
  for (let i = 0; i < Math.max(8, Math.round(W / 90 * FX.dropN)); i++) { const d = {}; spawn(d, true); mov.push(d); }
  function stepDrops(t) {
    gx.clearRect(0, 0, W, H); gx.lineCap = 'round';
    for (const d of mov) {
      if (Math.random() < 0.025) d.v = rnd(0.3, 2.4) * (d.r / 6);
      d.v *= 0.965; d.y += d.v * FX.dropSpd; d.x += Math.sin(t * 0.003 + d.ph) * 0.06 * d.v;
      if (d.v > 0.15) { d.pts.push([d.x, d.y, d.r]); if (d.pts.length > 140) d.pts.shift(); d.r = Math.max(2, d.r - d.v * 0.0007); }
      else if (d.pts.length) d.pts.shift();
      const L = d.pts.length;
      for (let i = 1; i < L; i++) {
        const p = d.pts[i], pq = d.pts[i - 1], f = i / L;
        gx.strokeStyle = `rgba(0,0,0,${0.05 * f})`; gx.lineWidth = p[2] * 0.95; gx.beginPath(); gx.moveTo(pq[0], pq[1]); gx.lineTo(p[0], p[1]); gx.stroke();
        gx.strokeStyle = `rgba(255,255,255,${0.1 * f})`; gx.lineWidth = p[2] * 0.5; gx.beginPath(); gx.moveTo(pq[0] - 0.5, pq[1]); gx.lineTo(p[0] - 0.5, p[1]); gx.stroke();
      }
      drop(gx, d.x, d.y, d.r);
      if (d.y > H + 30) spawn(d, false);
    }
  }

  // --- ziarno filmowe ---
  function grain() {
    const D = gi.data;
    for (let i = 0; i < D.length; i += 4) {
      let v = 128 + (Math.random() - 0.5) * 255 * FX.grainPow;
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      D[i] = D[i + 1] = D[i + 2] = v; D[i + 3] = 255;
    }
    rx.putImageData(gi, 0, 0);
  }

  // Ruch ograniczony: jedna nieruchoma klatka
  if (reduced) { bn = Infinity; eyeBg(0); mist(0); grain(); return; }

  let pointer = null;
  addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(wrap);

  let f = 0;
  (function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    f++;
    let tx = 0, ty = 0;
    if (pointer) { const r = wrap.getBoundingClientRect(); tx = clamp((pointer.x - (r.left + r.width / 2)) / 260, -1, 1); ty = clamp((pointer.y - (r.top + r.height / 2)) / 200, -1, 1); if (document.documentElement.classList.contains('flipped')) { tx = -tx; ty = -ty; } }   // strona obrócona o 180° (js/lang.js)
    gaze.x += (tx - gaze.x) * 0.16; gaze.y += (ty - gaze.y) * 0.16;
    if (f % 3 === 1) mist(t);
    eyeBg(t);
    stepDrops(t);
    if (f % Math.max(1, Math.round(3 / FX.grainSpd)) === 0) grain();
  })(performance.now());
}
