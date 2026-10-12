/** Dźwięki zabawek (Web Audio API, bez plików audio) + przełącznik wyciszenia. */
let enabled = true;
let ctx = null;

export const isSoundEnabled = () => enabled;

export function toggleSound() {
  enabled = !enabled;
  return enabled;
}

/** Niskie, gasnące buczenie rozmagnesowania kineskopu. */
export function playDegauss() {
  if (!enabled) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
    out.connect(ctx.destination);

    const am = ctx.createGain();
    am.gain.value = 0.6;
    am.connect(out);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(30, t);
    lfo.frequency.exponentialRampToValueAtTime(5, t + 1.8);
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(am.gain);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 1.8);
    osc.connect(am);

    [osc, lfo].forEach((node) => { node.start(t); node.stop(t + 2.1); });
  } catch {
    /* brak audio — trudno, zabawa działa bez dźwięku */
  }
}