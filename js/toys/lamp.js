import { playClick } from './audio.js';

/** Pstryk lampy: strona gaśnie, a światło ma tylko latarka podążająca za kursorem (style: .lamp-dark w toys.css). */
let dark = null;

function move(e) {
  dark.style.setProperty('--lx', `${e.clientX}px`);
  dark.style.setProperty('--ly', `${e.clientY}px`);
}

export function setLamp(on) {
  if (!dark) {
    dark = document.createElement('div');
    dark.className = 'lamp-dark';
    dark.setAttribute('aria-hidden', 'true');
    dark.style.setProperty('--lx', '50vw');
    dark.style.setProperty('--ly', '40vh');
    document.body.append(dark);
  }
  playClick();
  if (on) addEventListener('pointermove', move, { passive: true });
  else removeEventListener('pointermove', move);
  void dark.offsetWidth;
  dark.classList.toggle('on', on);
}
