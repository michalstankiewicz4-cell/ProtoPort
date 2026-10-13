/* Efekt dla NostraDamnOS: po najechaniu na kafelek cała strona powoli zmienia się w biurko w archiwum —
   ciemne sukno z lampą, a zdjęcie, teksty i kafelki stają się pożółkłymi kartami akt, lekko przekrzywionymi,
   ze spinaczami, pieczątkami „NIEJAWNE” / „TAJNE” / „POUFNE” i czarnymi pasami zaczernień na opisach.
   Elementy strony zostają prawdziwe (klikalne, przewijane) — zmienia się tylko ich wygląd. */

const STAMPS = [['NIEJAWNE', '#b3261e'], ['TAJNE', '#b3261e'], ['POUFNE', '#1f3f8a'], ['DO WGLĄDU', '#1f3f8a'], ['ZASTRZEŻONE', '#b3261e'], ['ARCHIWUM', '#2c5a35']];
const PAPER = '#eadfc0';
const INK = '#2a2216';
import { SLOW, rand } from './kit.js';

const STYLE = `
.arc-obj { position: relative; transition: transform ${SLOW} cubic-bezier(.2,.8,.2,1), box-shadow ${SLOW} ease, background-color ${SLOW} ease,
  border-color ${SLOW} ease, border-radius ${SLOW} ease, color ${SLOW} ease, filter ${SLOW} ease, opacity ${SLOW} ease !important; }
body.arc-on .arc-obj { transform: rotate(var(--arc-rot, 0deg)); box-shadow: 0 1px 1px rgba(0,0,0,.35), 4px 8px 16px rgba(0,0,0,.55); }
body.arc-on .project.arc-obj:hover { transform: rotate(0deg) translateY(-8px) scale(1.02); }
body.arc-on .arc-note, body.arc-on .arc-paper { background-color: ${PAPER} !important; border-radius: 2px !important; }
body.arc-on .arc-paper { width: fit-content; box-shadow: 0 0 0 12px ${PAPER}, 0 1px 1px 12px rgba(0,0,0,.3), 6px 10px 18px 12px rgba(0,0,0,.5); }
body.arc-on header > div.arc-paper { width: auto; box-shadow: 0 0 0 14px ${PAPER}, 0 1px 1px 14px rgba(0,0,0,.3), 6px 10px 18px 14px rgba(0,0,0,.5); }
body.arc-on header { border-bottom-color: transparent; }
body.arc-on footer.arc-paper { opacity: 1; }
body.arc-on .arc-note { border-color: rgba(90,70,30,.5) !important; opacity: 1; }
body.arc-on .arc-paper, body.arc-on .arc-paper *, body.arc-on .arc-note, body.arc-on .arc-note *:not(img):not(.arc-stamp):not(.arc-redact):not(.arc-clip):not(.arc-clip *) {
  color: ${INK} !important; text-shadow: none !important; font-family: 'Special Elite', 'Courier Prime', 'Courier New', monospace !important; text-transform: none !important; letter-spacing: 0 !important; }
body.arc-on .arc-paper :is(a, button) { border-color: rgba(60,45,20,.6) !important; }
body.arc-on .toys .arc-obj:hover { background-color: #f3e8b8 !important; }
body.arc-on .photo.arc-obj { border: 9px solid #f5efdc; border-radius: 2px; filter: sepia(.55) contrast(1.05); }
body.arc-on .project .shot, body.arc-on .project img, body.arc-on .project canvas { filter: grayscale(.85) sepia(.45) contrast(1.05); }
body.arc-on .arc-note p { position: relative; }

.arc-stamp { position: absolute; z-index: 5; pointer-events: none; padding: 2px 10px; border: 3px double currentColor; border-radius: 4px; mix-blend-mode: multiply;
  font: 700 1.05rem/1.2 'Special Elite', 'Courier New', monospace; letter-spacing: .12em; white-space: nowrap; opacity: 0; }
body.arc-on .arc-stamp { animation: arc-stamp .55s cubic-bezier(.2,.9,.3,1) var(--d, 1s) both; }
@keyframes arc-stamp {
  0% { opacity: 0; transform: rotate(var(--sr)) scale(2.6); }
  62% { opacity: .95; transform: rotate(var(--sr)) scale(.93); }
  100% { opacity: .82; transform: rotate(var(--sr)) scale(1); }
}
.arc-redact { position: absolute; height: 1.05em; background: #111; border-radius: 1px; z-index: 4; pointer-events: none; transform-origin: left; transform: scaleX(0); transition: transform .5s ease; transition-delay: var(--d, 1.4s); }
body.arc-on .arc-redact { transform: scaleX(1); }
.arc-clip { position: absolute; z-index: 6; pointer-events: none; width: 20px; height: 54px; opacity: 0; transition: opacity ${SLOW} ease; }
body.arc-on .arc-clip { opacity: 1; }
`;

const SVGNS = 'http://www.w3.org/2000/svg';

/** Płytka sukna 160×160 (szczegóły "zawijają się"). */
function feltTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#26302f'; g.fillRect(0, 0, 160, 160);
  const R = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 1300; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '210,225,215' : '0,0,0'},${R(0.03, 0.1)})`; g.fillRect(R(0, 160), R(0, 160), R(1, 2.2), R(1, 2.2)); }
  return c.toDataURL('image/png');
}

function clipSvg() {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', '0 0 20 54'); s.setAttribute('class', 'arc-clip'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M6 12 V40 a4 4 0 0 0 8 0 V8 a6 6 0 0 0 -12 0 V42 a8 8 0 0 0 16 0 V14" fill="none" stroke="#9aa3ab" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M6 12 V40 a4 4 0 0 0 8 0 V8 a6 6 0 0 0 -12 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".8" stroke-linecap="round"/>';
  return s;
}

let inst = null;

function create() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  const board = document.createElement('div');
  board.setAttribute('aria-hidden', 'true');
  board.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:0;transition:opacity 1.2s ease;' +
    'background:radial-gradient(ellipse at 32% 16%,rgba(255,226,160,.26),transparent 58%),radial-gradient(ellipse at 90% 100%,rgba(0,0,0,.45),transparent 55%),' +
    `url(${feltTile()}) #26302f;` + 'box-shadow:inset 0 0 130px rgba(0,0,0,.65)';
  document.body.prepend(board);

  let objs = [], added = [], hideTimer = 0, visible = false;

  function build() {
    const q = (s) => [...document.querySelectorAll(s)];
    const visibleEls = (els) => els.filter((e) => e.getBoundingClientRect().width > 0);
    const photo = q('header .photo')[0], note = q('header > div')[0];
    const toys = visibleEls([...q('.toys-title'), ...q('.toys button')]);
    const h2 = q('.scroll h2')[0], cards = q('.project'), footer = q('footer')[0];
    const papers = [note, h2, footer].filter(Boolean);
    objs = [photo, ...toys, h2, ...cards, footer, note].filter(Boolean);

    objs.forEach((el, i) => {
      const rot = el === photo ? -3 : (rand(i, 3) - 0.5) * 3.4;
      el.style.setProperty('--arc-rot', `${rot.toFixed(2)}deg`);
      el.classList.add('arc-obj');
    });
    for (const el of papers) el.classList.add('arc-paper');
    for (const el of [...toys, ...cards]) el.classList.add('arc-note');

    const add = (parent, el) => { parent.append(el); added.push(el); return el; };
    // pieczątki: na każdym kafelku i na notatce nagłówka, pod losowym kątem
    [...cards, note].filter(Boolean).forEach((el, i) => {
      const [text, color] = STAMPS[(i * 5 + 1) % STAMPS.length];
      const st = document.createElement('span');
      st.className = 'arc-stamp'; st.textContent = text;
      st.style.color = color;
      st.style.setProperty('--sr', `${((rand(i, 11) - 0.5) * 34).toFixed(1)}deg`);
      st.style.setProperty('--d', `${(0.9 + i * 0.22).toFixed(2)}s`);
      if (el === note) { st.style.right = '8px'; st.style.top = '6px'; }
      else { st.style.right = `${6 + rand(i, 12) * 14}px`; st.style.bottom = `${8 + rand(i, 13) * 10}px`; }
      add(el, st);
    });
    // spinacze na kartach
    [photo, ...cards.filter((_, i) => i % 2 === 0)].filter(Boolean).forEach((el, i) => {
      const c = clipSvg();
      c.style.left = `${8 + rand(i, 21) * 20}px`; c.style.top = '-14px';
      c.style.transform = `rotate(${((rand(i, 22) - 0.5) * 20).toFixed(0)}deg)`;
      add(el, c);
    });
    // zaczernienia na opisach kafelków
    cards.forEach((el, i) => {
      const p = el.querySelector('p');
      if (!p) return;
      p.style.position = 'relative';
      const n = 1;
      for (let k = 0; k < n; k++) {
        const bar = document.createElement('span');
        bar.className = 'arc-redact';
        const left = 20 + rand(i * 3 + k, 32) * 50;
        bar.style.left = `${left}%`; bar.style.width = `${9 + rand(i * 3 + k, 33) * 10}%`;
        bar.style.top = `${k === 0 ? 0 : 1.35}em`;
        bar.style.setProperty('--d', `${(1.5 + i * 0.2 + k * 0.3).toFixed(2)}s`);
        add(p, bar);
      }
    });
  }

  function cleanup() {
    for (const el of objs) { el.classList.remove('arc-obj', 'arc-paper', 'arc-note'); el.style.removeProperty('--arc-rot'); }
    for (const el of added) el.remove();
    objs = []; added = [];
    for (const p of document.querySelectorAll('.project p')) p.style.position = '';
  }

  return {
    show() {
      clearTimeout(hideTimer);
      if (visible) return;
      visible = true;
      if (!objs.length) build();
      board.style.opacity = '1';
      void document.body.offsetWidth;          // wymuś układ, żeby przejście zadziałało
      document.body.classList.add('arc-on');
    },
    hide() {
      if (!visible) return;
      visible = false;
      document.body.classList.remove('arc-on');
      board.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(cleanup, 1400);
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
