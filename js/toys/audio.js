/** Dźwięki zabawek i efektów (Web Audio API, bez plików audio) + przełącznik wyciszenia "Dźwięk". */
let enabled = false;                  // domyślnie wyciszone — dźwięk włącza dopiero kliknięcie przełącznika (to też odblokowuje audio w przeglądarce)
let ctx = null;
let bus = null;                       // wspólne wyjście: master -> kompresor -> głośniki
let noiseBuf = null, brownBuf = null;

export const isSoundEnabled = () => enabled;

export function toggleSound() {
  enabled = !enabled;
  if (bus) bus.gain.setTargetAtTime(enabled ? 0.9 : 0, ctx.currentTime, 0.05);
  return enabled;
}

/** Wspólny kontekst audio (tworzony przy pierwszej potrzebie; przeglądarka wznawia go po geście użytkownika). */
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    bus = ctx.createGain();
    bus.gain.value = enabled ? 0.9 : 0;
    bus.connect(comp); comp.connect(ctx.destination);
    const n = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    brownBuf = ctx.createBuffer(1, n * 2, ctx.sampleRate);
    const a = noiseBuf.getChannelData(0), b = brownBuf.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    let last = 0;
    for (let i = 0; i < b.length; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.12; b[i] = last; }   // szum "brązowy"
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
/* Przeglądarki odblokowują dźwięk dopiero po geście użytkownika (kliknięcie, klawisz, dotyk) — samo najechanie myszą się nie liczy.
   Pierwszy taki gest wznawia kontekst i daje znać panelowi zabawek (zdarzenie 'sound-unlocked'). */
let unlocked = false;
export const soundLocked = () => !unlocked && !(navigator.userActivation && navigator.userActivation.hasBeenActive);
function unlock() {
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  dispatchEvent(new Event('sound-unlocked'));
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, { passive: true, capture: true });

const env = (g, t, peak, attack, dur) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
};

/** Niskie "uderzenie" (sinus z opadającą częstotliwością + trochę szumu) — jak w grze Patient Zero. */
function thump(dest, t, strength, f0, f1, dur, noiseCut = 220) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, strength, 0.008, dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
  const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
  n.buffer = noiseBuf; nf.type = 'lowpass'; nf.frequency.value = noiseCut;
  env(ng, t, strength * 0.6, 0.006, dur * 0.6);
  n.connect(nf); nf.connect(ng); ng.connect(dest);
  n.start(t); n.stop(t + dur);
}

function noiseLoop(buf, type, freq, q, gain, dest) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
  s.connect(f); f.connect(g); g.connect(dest); s.start();
  return s;
}

/* ---------- dźwięki otoczenia: każdy rodzaj ma jedną instancję (licznik odwołań), płynnie wchodzi i wychodzi ---------- */
const BEAT = 60 / 72;                 // 72 uderzenia na minutę, jak w tle "żyły"

const KINDS = {
  /** Bicie serca "pod wodą" — ten sam lub/dub i dolnoprzepustowy filtr co w grze, plus szum prądu krwi. */
  heart(out) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.7;
    lp.connect(out);
    const flow = noiseLoop(brownBuf, 'lowpass', 260, 0.7, 0.2, lp);
    let next = ctx.currentTime + 0.1;
    const timer = setInterval(() => {
      while (next < ctx.currentTime + 0.35) {
        thump(lp, next + 0.13 * BEAT, 0.7, 68, 34, 0.17);      // lub
        thump(lp, next + 0.45 * BEAT, 0.45, 92, 48, 0.12);     // dub
        next += BEAT;
      }
    }, 120);
    return () => { clearInterval(timer); flow.stop(ctx.currentTime + 0.6); };
  },
  /** Szum starego ekranu: brum 50/100 Hz i cienki pisk cewki odchylania. */
  hum(out) {
    const nodes = [];
    for (const [type, f, v] of [['sawtooth', 50, 0.05], ['sine', 100, 0.04], ['sine', 15734, 0.004]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = type; o.frequency.value = f; g.gain.value = v;
      lp.type = f > 5000 ? 'allpass' : 'lowpass'; lp.frequency.value = 220;
      o.connect(lp); lp.connect(g); g.connect(out); o.start(); nodes.push(o);
    }
    const hiss = noiseLoop(noiseBuf, 'highpass', 3000, 0.5, 0.004, out);
    return () => { const t = ctx.currentTime + 0.6; nodes.forEach((o) => o.stop(t)); hiss.stop(t); };
  },
  /** Deszcz kodu: cichy szum i losowe krótkie "bipy". */
  rain(out) {
    const hiss = noiseLoop(noiseBuf, 'bandpass', 2600, 0.6, 0.03, out);
    const timer = setInterval(() => {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 500 + Math.random() * 1800;
      env(g, t, 0.012, 0.004, 0.05 + Math.random() * 0.05);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12);
    }, 150);
    return () => { clearInterval(timer); hiss.stop(ctx.currentTime + 0.6); };
  },
  /** Pieczątki: seria głuchych uderzeń w rytmie pojawiania się pieczątek w efekcie archiwum. */
  stamp(out) {
    const timers = [];
    for (let i = 0; i < 7; i++) timers.push(setTimeout(() => thump(out, ctx.currentTime, 0.9, 150, 45, 0.16, 500), (1.2 + i * 0.22) * 1000));
    return () => timers.forEach(clearTimeout);
  },
  /** Kosmos: niski dron z wolnym "oddychaniem", cichy szum i rzadkie dalekie "pingi" pulsarów. */
  space(out) {
    const nodes = [];
    for (const [f, v] of [[55, 0.07], [82.7, 0.045], [110.4, 0.02]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = v;
      lfo.frequency.value = 0.05 + Math.random() * 0.08; lg.gain.value = v * 0.6;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(out); o.start(); lfo.start(); nodes.push(o, lfo);
    }
    const dust = noiseLoop(brownBuf, 'lowpass', 420, 0.7, 0.07, out);
    let timer = 0;
    const ping = () => {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1400 + Math.random() * 1600;
      env(g, t, 0.014, 0.01, 1.4);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.5);
      timer = setTimeout(ping, 2200 + Math.random() * 4500);
    };
    timer = setTimeout(ping, 1200);
    return () => { clearTimeout(timer); const t = ctx.currentTime + 0.6; nodes.forEach((o) => o.stop(t)); dust.stop(t); };
  },
  /** Hive Hunger: brzęczenie roju i chrupiące "gryzienia" w nieregularnych odstępach. */
  chomp(out) {
    const buzz = ctx.createOscillator(), bg = ctx.createGain(), bl = ctx.createBiquadFilter(), trem = ctx.createOscillator(), tg = ctx.createGain();
    buzz.type = 'sawtooth'; buzz.frequency.value = 96; bl.type = 'lowpass'; bl.frequency.value = 320; bg.gain.value = 0.02;
    trem.frequency.value = 28; tg.gain.value = 0.012; trem.connect(tg); tg.connect(bg.gain);
    buzz.connect(bl); bl.connect(bg); bg.connect(out); buzz.start(); trem.start();
    let timer = 0;
    const bite = () => {
      const t = ctx.currentTime, n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 900; f.Q.value = 1.3;
      env(g, t, 0.16, 0.004, 0.07);
      n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + 0.1);
      thump(out, t, 0.3, 240, 90, 0.07, 1800);
      timer = setTimeout(bite, Math.random() < 0.3 ? 120 : 320 + Math.random() * 700);
    };
    timer = setTimeout(bite, 400);
    return () => { clearTimeout(timer); const t = ctx.currentTime + 0.6; buzz.stop(t); trem.stop(t); };
  },
};

const live = new Map();               // rodzaj -> { n, stop, out }

/** Włącza dźwięk otoczenia; zwraca funkcję go kończącą. Bez audio w przeglądarce nic nie robi. */
export function ambient(kind) {
  try {
    if (!KINDS[kind] || !audio()) return () => {};
    let inst = live.get(kind);
    if (!inst) {
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime);
      out.gain.setTargetAtTime(kind === 'heart' ? 0.8 : 1, ctx.currentTime, 0.25);
      out.connect(bus);
      inst = { n: 0, out, stop: KINDS[kind](out) };
      live.set(kind, inst);
    }
    inst.n++;
    let done = false;
    return () => {
      if (done) return;
      done = true;
      if (--inst.n > 0) return;
      live.delete(kind);
      inst.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      setTimeout(() => { inst.stop(); inst.out.disconnect(); }, 700);
    };
  } catch { return () => {}; }
}

/* ---------- krótkie dźwięki zabawek ---------- */
function blip(f0, f1, dur, type = 'square', vol = 0.12) {
  if (!enabled || !audio()) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, vol, 0.005, dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
export const playClick = () => blip(1800, 600, 0.05, 'square', 0.1);
export const playQuack = () => { blip(520, 260, 0.12, 'sawtooth', 0.1); setTimeout(() => blip(480, 230, 0.1, 'sawtooth', 0.08), 130); };
export function playFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f * 1.01, 0.18, 'square', 0.08), i * 110));
}

/** Niskie, gasnące buczenie rozmagnesowania kineskopu. */
export function playDegauss() {
  if (!enabled) return;
  try {
    if (!audio()) return;
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
