/* Efekt dla Skanera adresów IP: po najechaniu na kafelek strona przechodzi w tryb tekstowy —
   wszystko jednobarwne, jasnozielone, czcionką monospace, obrazy zielono-czarne, na tle spada deszcz znaków
   z "Matrixa" (katakana, cyfry, hex). Zmieniają się tylko style (klasa na body), treść i klikalność zostają. */

import { adaptiveQuality } from './quality.js';
import { reduced, SLOW, resizeGuard } from './kit.js';

const GREEN = '#8dff8d';
const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF:.=*+-<>¦';
const CFG = { size: 16, fade: 1200, speed: [9, 24], trail: 0.055, headChance: 0.975 };

const STYLE = `
body.mx-ready, body.mx-ready * { transition: color ${SLOW} ease, background-color ${SLOW} ease, border-color ${SLOW} ease, filter ${SLOW} ease, box-shadow ${SLOW} ease !important; }
body.mx-on { --bg: #000; --fg: ${GREEN}; --accent: ${GREEN}; --card: rgba(0, 14, 0, .86); --head-transform: none; --head-spacing: 0; background: #000 !important; }
body.mx-on, body.mx-on * { font-family: 'Share Tech Mono', 'Cascadia Mono', 'Consolas', 'Courier New', monospace !important; letter-spacing: 0 !important; text-transform: none !important;
  color: ${GREEN} !important; border-color: rgba(141, 255, 141, .55) !important; text-shadow: 0 0 7px rgba(80, 255, 80, .55); }
body.mx-on :is(header, footer, .project, .toys button, .toys-title, .links a, .links .copy, .scroll > *) { background-color: transparent; }
body.mx-on .project { background-color: rgba(0, 14, 0, .86) !important; box-shadow: 0 0 0 1px rgba(141, 255, 141, .5), 0 0 18px rgba(60, 255, 60, .18) !important; border-radius: 0 !important; }
body.mx-on .project:hover, body.mx-on .project:focus-visible { box-shadow: 0 0 0 1px ${GREEN}, 0 0 30px rgba(60, 255, 60, .45) !important; }
body.mx-on .toys button { background-color: rgba(0, 14, 0, .86) !important; border-radius: 0 !important; }
body.mx-on .toys button:hover { background-color: ${GREEN} !important; color: #000 !important; text-shadow: none; }
body.mx-on header > div, body.mx-on footer { background-color: rgba(0, 10, 0, .6) !important; }
body.mx-on .photo, body.mx-on .project img, body.mx-on .project canvas, body.mx-on .project video {
  filter: grayscale(1) sepia(1) hue-rotate(58deg) saturate(3.2) brightness(.85) contrast(1.25) !important; border-radius: 0 !important; }
body.mx-on .photo { border-radius: 0 !important; }
body.mx-on :is(h1, h2, h3, p, a, span, small, button, li, footer)::selection { background: ${GREEN}; color: #000; }
body.mx-on h1::after { content: '_'; animation: mx-blink 1s steps(1) infinite; }
@keyframes mx-blink { 50% { opacity: 0; } }
body.mx-on::after { content: ''; position: fixed; inset: 0; z-index: 70; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .18) 0 1px, transparent 1px 3px); mix-blend-mode: multiply; }
`;

let world = null;

function create() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  // z-index: -1 → nad tłem strony (body), pod całą zawartością
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:0;transition:opacity ${CFG.fade}ms ease;background:#000`;
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1, cols = 0, drops = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    cols = Math.ceil(W / CFG.size);
    drops = Array.from({ length: cols * 2 }, (_, k) => ({ x: k % cols, y: rnd(-H * 0.4, H * 1.1) / CFG.size, v: rnd(CFG.speed[0], CFG.speed[1]) }));
  }
  resize();
  const syncSize = resizeGuard(resize, () => running);

  let running = false, raf = 0, hideTimer = 0, last = 0, active = -1;
  // jakość dopasowana do klatek/s (js/fx/quality.js): mniej kolumn deszczu przy słabszej wydajności
  const q = adaptiveQuality({ onLevel: (l) => { active = Math.floor(drops.length * [1, 0.6, 0.4, 0.25][l]); } });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    const dt = Math.min(0.05, raw);
    last = now;
    q.tick(raw);
    // smuga: półprzezroczyste czernienie zamiast czyszczenia
    ctx.fillStyle = `rgba(0,0,0,${CFG.trail})`;
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${CFG.size}px "Share Tech Mono", "MS Gothic", "Consolas", monospace`;
    ctx.textBaseline = 'top';
    const nD = active < 0 ? drops.length : Math.min(active, drops.length);
    for (let k = 0; k < nD; k++) {
      const d = drops[k], i = d.x;
      const prev = Math.floor(d.y);
      d.y += d.v * dt * (reduced ? 0 : 1);
      const cur = Math.floor(d.y);
      for (let y = prev + 1; y <= cur; y++) {         // każda nowa komórka głowy dostaje znak
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        ctx.fillStyle = Math.random() > 0.85 ? '#e8ffe8' : '#2cff4a';
        ctx.fillText(ch, i * CFG.size, y * CFG.size);
        // poprzednia głowa przygasa do zieleni
        ctx.fillStyle = 'rgba(40,255,70,.55)';
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * CFG.size, (y - 1) * CFG.size);
      }
      if (d.y * CFG.size > H + 200 && Math.random() > CFG.headChance) { d.y = rnd(-30, 0); d.v = rnd(CFG.speed[0], CFG.speed[1]); }
    }
  }

  return {
    show() {
      clearTimeout(hideTimer);
      document.body.classList.add('mx-ready');
      void document.body.offsetWidth;
      document.body.classList.add('mx-on');
      canvas.style.opacity = '1';
      syncSize();
      q.reset();
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    hide() {
      document.body.classList.remove('mx-on');
      canvas.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { running = false; cancelAnimationFrame(raf); document.body.classList.remove('mx-ready'); }, CFG.fade + 100);
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
