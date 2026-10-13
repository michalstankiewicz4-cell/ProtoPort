import { ambient } from './audio.js';

/** Skaner CRT/VHS: linie skanowania, drżenie, aberracja i wypukłość kineskopu (style: .crt-* w toys.css). */
let overlay = null;
let stopHum = null;

/** Filtr SVG z mapą przesunięć: środek obrazu lekko powiększony, brzegi ściśnięte (beczkowe zakrzywienie szkła). */
function bulgeFilter() {
  const N = 128, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x / (N - 1)) * 2 - 1, v = (y / (N - 1)) * 2 - 1, r2 = (u * u + v * v) / 2;
    const i = (y * N + x) * 4;
    img.data[i] = 128 + 127 * u * r2; img.data[i + 1] = 128 + 127 * v * r2; img.data[i + 2] = 128; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="crt-bulge" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
    <feImage href="${c.toDataURL()}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="46" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  document.body.append(svg);
}

export function setCrt(on) {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'crt-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.append(overlay);
    bulgeFilter();
  }
  document.body.classList.toggle('crt-on', on);
  stopHum?.(); stopHum = null;
  if (on) stopHum = ambient('hum');
}
