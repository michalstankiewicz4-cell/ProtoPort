/**
 * Rejestr efektów po najechaniu na kafelek (klucz = pole `hoverFx` w js/data/projects.js).
 * Nowy efekt = plik w js/fx/ z `export function start(card)` zwracającym `stop()` + wpis tutaj.
 *  - load:    leniwy import modułu,
 *  - kind:    'canvas' (warstwa tła, można łączyć) albo 'theme' (zmienia styl strony — działa najwyżej jeden naraz),
 *  - heavy:   ciężki dla GPU (pomijany w trybie Konami na słabszych kartach),
 *  - ambient: dźwięki otoczenia z js/toys/audio.js.
 */
export const FX = {
  swarm: { load: () => import('./swarm.js'), kind: 'canvas' },
  space: { load: () => import('./space.js'), kind: 'canvas' },
  petri: { load: () => import('./petri.js'), kind: 'canvas' },
  vein: { load: () => import('./vein.js'), kind: 'canvas', heavy: true, ambient: ['heart'] },
  cork: { load: () => import('./cork.js'), kind: 'theme' },
  matrix: { load: () => import('./matrix.js'), kind: 'theme', ambient: ['rain', 'hum'] },
  archive: { load: () => import('./archive.js'), kind: 'theme', ambient: ['stamp'] },
};
