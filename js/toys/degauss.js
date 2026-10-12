import { playDegauss } from './audio.js';

/* Filtr SVG rozdzielający kanały RGB (efekt "rozjechanych kolorów" kineskopu). */
const FILTER_SVG = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="degauss" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
    <feOffset id="degauss-r" in="r" dx="0" dy="0" result="r2"/>
    <feOffset id="degauss-b" in="b" dx="0" dy="0" result="b2"/>
    <feBlend in="r2" in2="g" mode="screen" result="rg"/>
    <feBlend in="rg" in2="b2" mode="screen"/>
  </filter>
</svg>`;

let parts = null;

/** Dokłada filtr SVG i warstwę kolorowych plam do strony (raz, przy pierwszym użyciu). */
function ensureParts() {
  if (parts) return parts;
  document.body.insertAdjacentHTML('beforeend', FILTER_SVG);
  const glow = document.createElement('div');
  glow.className = 'degauss-glow';
  document.body.append(glow);
  parts = {
    stage: document.querySelector('main'),
    glow,
    red: document.getElementById('degauss-r'),
    blue: document.getElementById('degauss-b'),
  };
  return parts;
}

/**
 * Rozmagnesowanie kineskopu: gasnące drgania, rozszczepienie RGB, zmiana barw
 * i kolorowe plamy. Zwraca Promise, który kończy się razem z animacją.
 */
export function degauss() {
  const { stage, glow, red, blue } = ensureParts();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 900 : 2200;

  playDegauss();

  return new Promise((done) => {
    const start = performance.now();

    (function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const amp = Math.pow(1 - progress, 2.2); // amplituda gaśnie z czasem
      const s = (now - start) / 1000;

      if (!reduced) {
        const dx = amp * 16 * Math.sin(s * 38);
        const dy = amp * 7 * Math.sin(s * 47 + 1);
        stage.style.transform =
          `translate(${dx}px,${dy}px) skewX(${amp * 2.4 * Math.sin(s * 29)}deg) scaleX(${1 + amp * 0.035 * Math.sin(s * 23)})`;

        const split = amp * 12 * Math.sin(s * 33);
        red.setAttribute('dx', split);
        red.setAttribute('dy', amp * 3 * Math.sin(s * 41));
        blue.setAttribute('dx', -split);

        stage.style.filter =
          `url(#degauss) hue-rotate(${amp * 200 * Math.sin(s * 14)}deg) saturate(${1 + amp * 1.6}) brightness(${1 + amp * 0.25 * Math.sin(s * 57)})`;
      }

      glow.style.opacity = amp * (reduced ? 0.3 : 0.85);
      glow.style.transform = `rotate(${s * 35}deg) scale(1.3)`;

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      stage.style.transform = '';
      stage.style.filter = '';
      glow.style.opacity = 0;
      red.setAttribute('dx', 0);
      red.setAttribute('dy', 0);
      blue.setAttribute('dx', 0);
      done();
    })(start);
  });
}