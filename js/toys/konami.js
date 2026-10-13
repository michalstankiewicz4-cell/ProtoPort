import { FX } from '../fx/registry.js';
import { loadFx, startFx } from '../fx/controller.js';
import { weakGpu } from '../fx/quality.js';
import { playFanfare, ambient } from './audio.js';
import { degauss } from './degauss.js';
import { duckSay } from './duck.js';

/** Ukryty tryb Konami: ↑ ↑ ↓ ↓ ← → ← → B A odpala na kilka sekund efekty tła naraz (te rysowane na płótnach, bez zmian stylu strony). */
const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
// warstwy tła z rejestru (typ 'canvas'; efekty zmieniające styl strony pomijamy), bez ciężkich na słabym GPU
const layers = () => Object.keys(FX).filter((k) => FX[k].kind === 'canvas' && !(FX[k].heavy && weakGpu()));
const DURATION = 7000;
let pos = 0, busy = false;

async function party() {
  busy = true;
  playFanfare();
  const stopAmbient = ambient('heart');
  const toast = document.createElement('div');
  toast.className = 'konami-toast';
  toast.textContent = '↑↑↓↓←→←→BA — tryb Konami!';
  document.body.append(toast);
  duckSay('Konami! Wszystko naraz!');
  const card = document.querySelector('.project') || document.body;
  const stops = [];
  for (const key of layers()) {
    try { const mod = await loadFx(key); if (mod) stops.push(startFx(key, mod, card)); } catch { /* ten efekt się nie załadował — reszta gra dalej */ }
  }
  degauss();
  await new Promise((r) => setTimeout(r, DURATION));
  stops.forEach((s) => s?.());
  stopAmbient();
  toast.classList.add('out');
  setTimeout(() => toast.remove(), 600);
  busy = false;
}

export function initKonami() {
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, [contenteditable]')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === CODE[pos] ? pos + 1 : (k === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; if (!busy) party(); }
  });
}
