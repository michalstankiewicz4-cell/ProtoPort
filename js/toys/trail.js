/** Kolorowa kreska za kursorem: neonowy ogon, który gaśnie. Tryb 1 = tęcza, tryb 2 = kolor aktywnego projektu (--accent). */
const LIFE = 650;                       // ms życia punktu
let canvas = null, g = null, mode = 0, pts = [], raf = 0, W = 0, H = 0, hue = 0;

function resize() {
  W = canvas.width = innerWidth; H = canvas.height = innerHeight;
}

function push(e) {
  const accent = mode === 2 ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() : '';
  hue = (hue + 3) % 360;
  pts.push({ x: e.clientX, y: e.clientY, t: performance.now(), c: accent || `hsl(${hue} 100% 60%)` });
  if (!raf) raf = requestAnimationFrame(draw);
}

function draw(now) {
  raf = 0;
  g.clearRect(0, 0, W, H);
  while (pts.length && now - pts[0].t > LIFE) pts.shift();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k = 1 - (now - b.t) / LIFE;
    if (k <= 0 || Math.hypot(b.x - a.x, b.y - a.y) > 200) continue;
    g.strokeStyle = b.c; g.globalAlpha = k * 0.9; g.lineWidth = 2 + 7 * k;
    g.shadowColor = b.c; g.shadowBlur = 14 * k;
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
  g.globalAlpha = 1; g.shadowBlur = 0;
  if (pts.length) raf = requestAnimationFrame(draw);
}

/** 0 = wyłączona, 1 = tęcza, 2 = kolory projektu. */
export function setTrail(m) {
  mode = m;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'trail-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    g = canvas.getContext('2d');
    document.body.append(canvas);
    resize();
    addEventListener('resize', resize);
  }
  removeEventListener('pointermove', push);
  if (m) addEventListener('pointermove', push, { passive: true });
  else { pts = []; g.clearRect(0, 0, W, H); }
}
