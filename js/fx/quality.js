/* Dobór jakości efektów do wydajności: mierzy klatki/s w oknach po ~1 s; gdy dwa okna z rzędu są poniżej progu,
   podnosi "poziom oszczędzania" (0 = pełna jakość … max) i woła onLevel(poziom). Efekt sam decyduje, co wtedy upraszcza
   (mniej cząstek, niższa rozdzielczość, bez bloomu/głębi ostrości). Poziom nigdy nie spada w trakcie jednej sesji strony. */

export function adaptiveQuality({ onLevel, max = 3, low = 42, windows = 2 }) {
  let level = 0, acc = 0, n = 0, bad = 0, warm = 0;
  return {
    get level() { return level; },
    /** Wołać co klatkę z surowym (nieobciętym) czasem klatki w sekundach. */
    tick(rawDt) {
      if (!(rawDt > 0) || rawDt > 0.3) return;        // pomijamy przystanki (karta w tle, kompilacja shaderów)
      acc += rawDt; n++;
      if (acc < 1) return;
      const fps = n / acc; acc = 0; n = 0;
      if (warm < 2) { warm++; return; }               // pierwsze sekundy po starcie nie liczą się
      if (fps < low) { if (++bad >= windows && level < max) { level++; bad = 0; onLevel(level); } } else bad = 0;
    },
    /** Po ponownym pokazaniu efektu: zaczynamy pomiar od nowa (poziom zostaje). */
    reset() { acc = 0; n = 0; bad = 0; warm = 0; },
    set(l) { level = Math.min(max, Math.max(level, l)); onLevel(level); },
  };
}

let weak;
/** Czy przeglądarka rysuje WebGL na słabym lub programowym GPU (zintegrowane/mobilne/swiftshader). Wynik jest zapamiętany. */
export function weakGpu() {
  if (weak !== undefined) return weak;
  weak = false;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) weak = /intel|mali|adreno|powervr|swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)));
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { /* bez wykrywania */ }
  return weak;
}
