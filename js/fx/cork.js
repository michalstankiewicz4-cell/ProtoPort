/* Efekt z projektu CorkBoard: po najechaniu na kafelek cała strona zmienia się w tablicę korkową —
   tło z korka w drewnianej ramie, zdjęcie, teksty i kafelki stają się karteczkami z cieniem, lekko
   przekrzywionymi, każda przypięta pinezką, a pinezki łączą kolorowe, zwisające nitki.
   Elementy strony zostają prawdziwe (klikalne, przewijane) — zmienia się tylko ich wygląd. */

const PIN_COLORS = [['#ff7a5c', '#d9482b', '#7c1d0c'], ['#6fa2f2', '#2f6fd0', '#173b7a'], ['#ffe27a', '#e7b92c', '#8a6a0a'], ['#6fdc9a', '#2f9e5a', '#145a30']];
const THREADS = ['#c0281f', '#2a62b8', '#2f8a3e', '#e0a21b'];   // czerwona, niebieska, zielona, żółta
const T = { pin: 250, pinStep: 70, thread: 800, threadWait: 250 };   // ms
import { SLOW, rand } from './kit.js';

const STYLE = `
.cork-obj { position: relative; transition: transform ${SLOW} cubic-bezier(.2,.8,.2,1), box-shadow ${SLOW} ease, background-color ${SLOW} ease,
  border-color ${SLOW} ease, border-width ${SLOW} ease, border-radius ${SLOW} ease, opacity ${SLOW} ease !important; }
body.cork-on .cork-obj { transform: rotate(var(--cork-rot, 0deg)); box-shadow: 0 1px 1px rgba(0,0,0,.28), 5px 9px 16px rgba(40,22,5,.45); }
body.cork-on .project.cork-obj:hover { transform: rotate(0deg) translateY(-8px) scale(1.02); }
body.cork-on .photo.cork-obj { border: 9px solid #fbf6e8; border-radius: 3px; }
body.cork-on .cork-paper { background-color: #ffef8a !important; width: fit-content;
  box-shadow: 0 0 0 12px #ffef8a, 0 1px 1px 12px rgba(0,0,0,.25), 6px 10px 18px 12px rgba(40,22,5,.4); }
body.cork-on header > div.cork-paper { width: auto; box-shadow: 0 0 0 14px #ffef8a, 0 1px 1px 14px rgba(0,0,0,.25), 6px 10px 18px 14px rgba(40,22,5,.4); }
body.cork-on .cork-note { background-color: #ffef8a !important; }
body.cork-on .project.cork-obj { border-color: rgba(120,90,0,.35); }
body.cork-on .toys .cork-obj { border-color: rgba(120,90,0,.5); opacity: 1; }
body.cork-on .cork-paper, body.cork-on .cork-paper *, body.cork-on .cork-note, body.cork-on .cork-note *:not(img) { color: #2e2508 !important; text-shadow: none !important; }
body.cork-on .cork-paper :is(a, button) { border-color: rgba(60,45,0,.55) !important; }
body.cork-on .toys .cork-obj:hover { background-color: #ffe14d !important; }
body.cork-on footer.cork-paper { opacity: 1; }
body.cork-on header { border-bottom-color: transparent; }
`;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (p) => 1 - Math.pow(1 - p, 3);
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}) => { const e = document.createElementNS(SVGNS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/** Płytka korka 256×256 (szczegóły "zawijają się", więc płytka się nie widzi). */
function corkTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b98550';
  g.fillRect(0, 0, 256, 256);
  const speck = (x, y, rx, ry, rot, color) => {
    g.fillStyle = color;
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
      g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, rot, 0, 6.2832); g.fill();
    }
  };
  const R = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 520; i++) speck(R(0, 256), R(0, 256), R(1, 5), R(1, 3.5), R(0, 3.14), `rgba(150,100,55,${R(0.15, 0.4)})`);
  for (let i = 0; i < 700; i++) speck(R(0, 256), R(0, 256), R(0.6, 2.4), R(0.6, 2), R(0, 3.14), `rgba(222,178,120,${R(0.2, 0.55)})`);
  for (let i = 0; i < 420; i++) speck(R(0, 256), R(0, 256), R(0.5, 2.2), R(0.5, 1.8), R(0, 3.14), `rgba(86,52,24,${R(0.25, 0.65)})`);
  return c.toDataURL('image/png');
}

let inst = null;

function create() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  // tło: korek w drewnianej ramie (z-index: -1 → nad tłem strony, pod całą zawartością)
  const board = document.createElement('div');
  board.setAttribute('aria-hidden', 'true');
  board.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:0;transition:opacity 1.2s ease;' +
    'background:radial-gradient(ellipse at 28% 18%,rgba(255,235,190,.28),transparent 62%),radial-gradient(ellipse at 85% 95%,rgba(0,0,0,.3),transparent 55%),' +
    `url(${corkTile()}) #b98550;` +
    'box-shadow:inset 0 0 0 10px #6b4423,inset 0 0 0 13px #3b2412,inset 0 0 110px rgba(0,0,0,.6)';
  document.body.prepend(board);

  // nitki i pinezki: jedna warstwa SVG nad zawartością; elementy z przewijanej listy przycinane do jej obszaru
  const svg = svgEl('svg', { 'aria-hidden': 'true' });
  svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .8s ease;z-index:61';
  const defs = svgEl('defs');
  const clipRect = svgEl('rect');
  const clip = svgEl('clipPath', { id: 'cork-clip' });
  clip.append(clipRect);
  defs.append(clip);
  PIN_COLORS.forEach(([hi, mid, lo], i) => {
    const g = svgEl('radialGradient', { id: `cork-pin-${i}`, cx: '35%', cy: '30%', r: '75%' });
    g.append(svgEl('stop', { offset: '0', 'stop-color': hi }), svgEl('stop', { offset: '.55', 'stop-color': mid }), svgEl('stop', { offset: '1', 'stop-color': lo }));
    defs.append(g);
  });
  const clipped = () => svgEl('g', { 'clip-path': 'url(#cork-clip)' });
  const gShadow = svgEl('g'), gThread = svgEl('g'), gPin = svgEl('g');
  const gShadowS = clipped(), gThreadS = clipped(), gPinS = clipped();
  svg.append(defs, gShadow, gShadowS, gThread, gThreadS, gPin, gPinS);
  document.body.append(svg);
  const groups = [gShadow, gShadowS, gThread, gThreadS, gPin, gPinS];

  let nodes = [], edges = [], objs = [];
  let t0 = 0, raf = 0, hideTimer = 0, visible = false, running = false;

  function build() {
    for (const g of groups) g.replaceChildren();
    const q = (s) => [...document.querySelectorAll(s)];
    const visibleEls = (els) => els.filter((e) => e.getBoundingClientRect().width > 0);

    const photo = q('header .photo')[0], note = q('header > div')[0];
    const toys = visibleEls([...q('.toys-title'), ...q('.toys button')]);
    const h2 = q('.scroll h2')[0], cards = q('.project'), footer = q('footer')[0];
    const papers = [note, h2, footer].filter(Boolean);
    objs = [photo, ...toys, h2, ...cards, footer, note].filter(Boolean);

    nodes = [];
    const mk = (el, g) => {
      if (!el) return null;
      const i = nodes.length;
      const n = { el, g, i, left: el.matches('h2, footer, .toys *'), jx: (rand(i, 1) - 0.5) * 36, jy: rand(i, 2) * 3, color: i % PIN_COLORS.length, x: 0, y: 0, delay: T.pin + i * T.pinStep };
      const pin = svgEl('g');
      pin.append(svgEl('ellipse', { cx: 4, cy: 9, rx: 6, ry: 3, fill: 'rgba(0,0,0,.35)' }), svgEl('circle', { r: 7.5, fill: `url(#cork-pin-${n.color})` }),
        svgEl('circle', { cx: -2.2, cy: -2.4, r: 1.8, fill: 'rgba(255,255,255,.75)' }));
      (g === 'scroll' ? gPinS : gPin).append(pin);
      n.pin = pin;
      nodes.push(n);
      return n;
    };
    const nPhoto = mk(photo, 'free'), nNote = mk(note, 'free');
    const nToys = toys.map((e) => mk(e, 'free'));
    const nH2 = mk(h2, 'scroll'), nCards = cards.map((e) => mk(e, 'scroll')), nFoot = mk(footer, 'scroll');

    edges = [];
    const link = (a, b) => {
      if (!a || !b) return;
      const scroll = a.g === 'scroll' && b.g === 'scroll';
      const mkPath = (attrs) => svgEl('path', { pathLength: 1, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': 1, 'stroke-dashoffset': 1, ...attrs });
      const shadow = mkPath({ stroke: 'rgba(0,0,0,.28)', 'stroke-width': 3 }), line = mkPath({ stroke: THREADS[Math.floor(rand(edges.length, 7) * THREADS.length)], 'stroke-width': 2.8 });
      (scroll ? gShadowS : gShadow).append(shadow);
      (scroll ? gThreadS : gThread).append(line);
      edges.push({ a, b, shadow, line, bow: (rand(edges.length, 9) - 0.5) * 0.5, delay: Math.max(a.delay, b.delay) + T.threadWait });
    };
    link(nPhoto, nNote);
    nToys.forEach((n, i) => i && link(nToys[i - 1], n));
    if (nH2 && nCards[0]) link(nH2, nCards[0]);
    const top0 = cards[0]?.getBoundingClientRect().top ?? 0;
    const cols = Math.max(1, cards.filter((c) => Math.abs(c.getBoundingClientRect().top - top0) < 14).length);
    nCards.forEach((n, i) => {
      if (i % cols < cols - 1 && nCards[i + 1]) link(n, nCards[i + 1]);
      if (nCards[i + cols]) link(n, nCards[i + cols]);
      if (i % cols < cols - 1 && nCards[i + cols + 1] && rand(i, 5) > 0.45) link(n, nCards[i + cols + 1]);
    });
    link(nCards[nCards.length - 1], nFoot);

    objs.forEach((el, i) => {
      const rot = el === photo ? -3.2 : (rand(i, 3) - 0.5) * 4.6;
      el.style.setProperty('--cork-rot', `${rot.toFixed(2)}deg`);
    });
    for (const el of papers) el.classList.add('cork-paper');
    for (const el of [...toys, ...cards]) el.classList.add('cork-note');
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const el = now - t0;
    const s = document.querySelector('.scroll')?.getBoundingClientRect();
    if (s) { clipRect.setAttribute('x', s.left - 40); clipRect.setAttribute('y', s.top); clipRect.setAttribute('width', s.width + 80); clipRect.setAttribute('height', s.height); }
    for (const n of nodes) {
      const r = n.el.getBoundingClientRect();
      n.x = (n.left ? r.left + 3 : r.left + r.width / 2 + n.jx); n.y = (n.left ? r.top - 4 : r.top + 10 + n.jy);
      const p = ease(clamp01((el - n.delay) / 320));
      n.pin.setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)}) scale(${(1 + (1 - p) * 1.4).toFixed(3)})`);
      n.pin.style.opacity = p;
    }
    for (const e of edges) {
      const { a, b } = e;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(b.x - a.x, b.y - a.y), sag = 14 + d * 0.12;
      const bow = (b.y - a.y) > Math.abs(b.x - a.x) ? e.bow * d : 0;   // długie, pionowe nitki wyginają się na bok
      const path = `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${(mx + bow).toFixed(1)},${(my + sag).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
      const off = 1 - ease(clamp01((el - e.delay) / T.thread));
      e.line.setAttribute('d', path); e.line.style.strokeDashoffset = off;
      e.shadow.setAttribute('d', path); e.shadow.style.strokeDashoffset = off;
      e.shadow.setAttribute('transform', 'translate(3,5)');
    }
  }

  return {
    show() {
      clearTimeout(hideTimer);
      if (visible) return;
      visible = true;
      build();
      for (const el of objs) el.classList.add('cork-obj');
      void document.body.offsetWidth;                       // żeby przejścia ruszyły od stanu wyjściowego
      document.body.classList.add('cork-on');
      board.style.opacity = '1';
      svg.style.opacity = '1';
      t0 = performance.now();
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    },
    hide() {
      if (!visible) return;
      visible = false;
      document.body.classList.remove('cork-on');
      board.style.opacity = '0';
      svg.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        running = false; cancelAnimationFrame(raf);
        for (const el of objs) { el.classList.remove('cork-obj', 'cork-paper', 'cork-note'); el.style.removeProperty('--cork-rot'); }
        for (const g of groups) g.replaceChildren();
      }, 1400);
    },
  };
}

/** Wywoływane po najechaniu na kafelek; zwraca funkcję kończącą efekt. */
export function start() {
  if (!matchMedia('(hover: hover)').matches) return () => {};
  inst ||= create();
  inst.show();
  return () => inst.hide();
}
