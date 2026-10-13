/* Wspólne drobiazgi efektów (js/fx/*): preferencje ruchu, deterministyczna losowość, bezpieczne nasłuchiwanie resize. */

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Czas przejść stylów w efektach zmieniających wygląd strony (prawie natychmiast przy ograniczonym ruchu). */
export const SLOW = reduced ? '0.01s' : '0.9s';

/** Pseudolosowa liczba 0..1 zależna tylko od (i, k) — ten sam układ przy każdym wejściu. */
export const rand = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * Nasłuchuje `resize`, ale przelicza rozmiar tylko wtedy, gdy efekt działa (`isActive()`).
 * Zwraca funkcję do wywołania przy pokazaniu efektu — odrabia zaległą zmianę rozmiaru.
 */
export function resizeGuard(onResize, isActive) {
  let dirty = false;
  addEventListener('resize', () => { if (isActive()) onResize(); else dirty = true; });
  return () => { if (dirty) { dirty = false; onResize(); } };
}
