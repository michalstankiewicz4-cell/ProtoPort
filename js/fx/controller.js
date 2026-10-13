import { FX } from './registry.js';
import { ambient } from '../toys/audio.js';

/** Sterowanie efektami: ładowanie, start/stop z dźwiękiem otoczenia i pilnowanie, że naraz działa jeden efekt zmieniający styl strony. */
let theme = null;                       // zakończenie aktualnie działającego efektu typu 'theme'

export const loadFx = (key) => FX[key].load().catch(() => null);

/** Uruchamia załadowany moduł; zwraca funkcję kończącą efekt (można wołać wielokrotnie). */
export function startFx(key, mod, card) {
  const def = FX[key];
  if (def.kind === 'theme') theme?.();  // poprzedni motyw gaśnie, zanim wejdzie nowy
  const stop = mod.start(card);
  const sounds = (def.ambient || []).map(ambient);
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    stop(); sounds.forEach((s) => s());
    if (theme === end) theme = null;
  };
  if (def.kind === 'theme') theme = end;
  return end;
}

/** Podpina efekt pod kafelek: mysz i klawiatura, bez wyścigów przy szybkim przechodzeniu, stop przy ukrytej karcie. */
export function bindFx(link, key) {
  if (!FX[key]) return;
  let stopFx = null, ticket = 0;
  const on = async () => {
    const mine = ++ticket;
    const mod = await loadFx(key);
    if (mod && mine === ticket) { stopFx?.(); stopFx = startFx(key, mod, link); }
  };
  const off = () => { ticket++; stopFx?.(); stopFx = null; };
  link.addEventListener('mouseenter', on);
  link.addEventListener('mouseleave', off);
  link.addEventListener('focus', on);
  link.addEventListener('blur', off);
  document.addEventListener('visibilitychange', () => { if (document.hidden) off(); });
}
