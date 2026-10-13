/* Efekt z gry Patient Zero: po najechaniu na kafelek w tle, po skosie ekranu, biegnie żyła, w której płynie krew
   w rytmie bicia serca. To ta sama grafika co w grze: shadery tkanki, krwinek (dwuwklęsłe, z równania Evansa–Funga),
   płytek i białych krwinek, światło "endoskopu", mgła krwi, kaustyki i post-process (bloom, głębia ostrości, ACES).
   Rytm i przepływ jak w js/flow.js: tętno 72/min, skurcz komór pcha krew najmocniej, w rozkurczu prąd słabnie.
   Shadery: js/vendor/patientzero/shaders.js (skopiowane z gry). Three.js r128 ładuje się z CDN przy pierwszym najechaniu. */

import * as SH from '../vendor/patientzero/shaders.js';
import { adaptiveQuality, weakGpu } from './quality.js';
import { reduced, resizeGuard } from './kit.js';

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const BPM = 72;                                  // config.bpm w grze
const CFG = {
  angle: 0.52,                                   // nachylenie osi żyły (rad): z lewego dołu w prawo do góry
  radius: 3.5,                                   // promień światła żyły (jednostki świata gry)
  length: 26,                                    // połowa długości odcinka żyły
  zoom: 17, fov: 40,                             // kamera jak w grze (config.camera)
  cells: 260, specks: 500, platelets: 46, bubbles: 16, leuko: 3,
  fade: 1400,
};

// fazy cyklu serca z gry (js/flow.js): 0–0,12 skurcz przedsionków, 0,14–0,45 skurcz komór, 0,48–0,82 rozkurcz
const pulse = (a, b, x) => (x < a || x > b) ? 0 : Math.sin(Math.PI * (x - a) / (b - a));
const gains = (ph) => ({
  sys: Math.pow(pulse(0.14, 0.45, ph), 0.8),
  dia: 0.85 * pulse(0.48, 0.82, ph) + 1.0 * pulse(0.0, 0.12, ph) + (ph > 0.82 ? 0.12 : 0),
});
const contraction = (ph) => Math.max(0.35 * pulse(0.0, 0.12, ph), pulse(0.13, 0.48, ph));

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Nie wczytano ${src}`));
    document.head.append(s);
  });
}
/*THREE-LOADER*/
async function loadThree() { if (!window.THREE) await loadScript(THREE_URL); }
/*END-THREE-LOADER*/

// wspólne części tkanki z gry; zamiast tekstury SDF serca — analityczna żyła (odległość do wijącej się osi)
const COMMON = SH.TISSUE_COMMON
  .replace(/uniform sampler2D uSdf;/, '').replace(/uniform vec2 uWorldMin;/, '').replace(/uniform vec2 uWorldSize;/, '').replace(/uniform sampler2D uOrgan;/, '')
  .replace(/float sdfAt\(vec2 p\)\{[^\n]*\}/, `
    uniform float uAng; uniform float uRad;
    float sdfAt(vec2 p){
      vec2 dir = vec2(cos(uAng), sin(uAng));
      float u = dot(p, dir), v = dot(p, vec2(-dir.y, dir.x));
      v -= 1.4 * sin(u * 0.11 + 0.6);
      float r = uRad * (1.0 + 0.05 * uBeat + 0.035 * sin(u * 0.55 - uTime * 4.0) * (0.35 + uBeat));
      return abs(v) - r;
    }`)
  .replace(/vec4 organAt\(vec2 p\)\{[^\n]*\}/, 'vec4 organAt(vec2 p){ return vec4(0.0); }');

function rbcGeometry(THREE, R) {
  // z(r) = sqrt(1-(r/R)^2) * (C0 + C2 (r/R)^2 + C4 (r/R)^4) — jak w grze (js/render/cells.js)
  const C0 = 0.81, C2 = 7.83, C4 = -4.39, Rum = 3.91, k = R / Rum;
  const pts = [], n = 18;
  const half = (t) => 0.5 * Math.sqrt(Math.max(0, 1 - t * t)) * (C0 + C2 * t * t + C4 * t * t * t * t) * k;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(Math.max(0.0001, t * R), -half(t))); }
  for (let i = n - 1; i >= 0; i--) { const t = i / n; pts.push(new THREE.Vector2(Math.max(0.0001, t * R), half(t))); }
  const g = new THREE.LatheGeometry(pts, 22);
  g.computeVertexNormals();
  return g;
}

let world = null, creating = null;

async function create() {
  await loadThree();
  const THREE = window.THREE;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  // z-index: -1 → nad tłem strony (body), pod całą zawartością
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:0;transition:opacity ${CFG.fade}ms ease;background:#050101`;
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x050101, 1);
  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.1, 300);

  // wspólne uniformy jak DD.SHARED w grze
  const SHARED = {
    uTime: { value: 0 }, uBeat: { value: 0 },
    uCam: { value: new THREE.Vector3() }, uLight: { value: new THREE.Vector3() },
    uLightPow: { value: 1.5 }, uFever: { value: 0 },
  };
  const shared = () => Object.assign({}, SHARED);

  // ---------- tkanka (ściana żyły) ----------
  const tissueMat = new THREE.ShaderMaterial({
    vertexShader: COMMON + SH.TISSUE_VERT_BODY,
    fragmentShader: COMMON + SH.NOISE + SH.LIGHT + SH.CAUSTIC + SH.TISSUE_FRAG_BODY,
    uniforms: Object.assign({ uAng: { value: CFG.angle }, uRad: { value: CFG.radius }, uKidS: { value: new THREE.Vector2(1e4, 1e4) } }, shared()),
  });
  const tissue = new THREE.Mesh(new THREE.PlaneGeometry(64, 40, 192, 120), tissueMat);
  tissue.frustumCulled = false;
  scene.add(tissue);

  // ---------- krwinki czerwone (instancing) ----------
  const NC = CFG.cells;
  const rbc = new THREE.InstancedMesh(rbcGeometry(THREE, 0.46),
    new THREE.ShaderMaterial({ vertexShader: SH.RBC_VERT, fragmentShader: SH.NOISE + SH.LIGHT + SH.RBC_FRAG_BODY, uniforms: Object.assign({ uThick: { value: 1 } }, shared()), side: THREE.DoubleSide }), NC);
  rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rbc.frustumCulled = false;
  const tint = new THREE.Color();
  for (let i = 0; i < NC; i++) { const v = 0.82 + Math.random() * 0.3; tint.setRGB(v, v * (0.9 + Math.random() * 0.2), v); rbc.setColorAt(i, tint); }
  rbc.instanceColor.needsUpdate = true;
  scene.add(rbc);

  // ---------- płytki, pęcherzyki tlenu, białe krwinki — materiał powierzchni jak w grze (actors.js: surfMat) ----------
  function surfMat(o) {
    const u = Object.assign({
      uAlbedo: { value: new THREE.Color(o.albedo || 0xffffff) }, uSssCol: { value: new THREE.Color(o.sssCol || 0xff3020) },
      uSss: { value: o.sss ?? 0.5 }, uRough: { value: o.rough ?? 0.3 }, uWet: { value: o.wet ?? 0.6 },
      uEmit: { value: new THREE.Color(o.emit || 0x000000) }, uRim: { value: o.rim ?? 0 }, uRimCol: { value: new THREE.Color(o.rimCol || 0xffffff) },
      uAlpha: { value: o.alpha ?? 1 }, uGrain: { value: o.grain ?? 0 }, uFlash: { value: 0 }, uSlow: { value: 0 }, uTimeL: { value: 0 }, uWave: { value: 0 },
    }, shared());
    return new THREE.ShaderMaterial({
      vertexShader: SH.SURF_VERT, fragmentShader: SH.NOISE + SH.LIGHT + SH.SURF_FRAG_BODY, uniforms: u,
      transparent: (o.alpha ?? 1) < 1, depthWrite: o.depthWrite ?? true,
    });
  }
  const extras = [];
  function pool(geo, opts, n, o) {
    const m = new THREE.InstancedMesh(geo, surfMat(opts), n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
    scene.add(m);
    extras.push(Object.assign({ m, n }, o));
  }
  pool(new THREE.SphereGeometry(0.16, 14, 10), { albedo: 0xdff4ff, sssCol: 0xbfe8ff, sss: 0.4, rough: 0.05, wet: 1.0, rim: 3.2, rimCol: 0xffffff, emit: 0x16303a, alpha: 0.42, depthWrite: false },
    CFG.bubbles, { kind: 'bubble', scale: [1, 1, 1], speed: 1.08, size: [0.5, 1.4] });
  pool(new THREE.SphereGeometry(0.13, 12, 8), { albedo: 0xcdb4dc, sssCol: 0xe6ccff, sss: 0.7, rough: 0.35, wet: 0.6, rim: 0.8, rimCol: 0xf0e2ff, emit: 0x160e1e, grain: 0.6 },
    CFG.platelets, { kind: 'platelet', scale: [1.4, 1, 0.45], speed: 1.0, size: [0.7, 1.3] });
  pool(new THREE.IcosahedronGeometry(0.62, 3), { albedo: 0xe9e2ee, sssCol: 0xd6c8ff, sss: 0.9, rough: 0.4, wet: 0.7, rim: 1.4, rimCol: 0xf4ecff, emit: 0x14101c, grain: 0.9 },
    CFG.leuko, { kind: 'leuko', scale: [1, 1, 0.9], speed: 0.6, size: [0.9, 1.1] });

  // ---------- drobiny osocza ----------
  const NS = CFG.specks;
  const speckPos = new Float32Array(NS * 3), speckSize = new Float32Array(NS);
  for (let i = 0; i < NS; i++) speckSize[i] = 0.05 + Math.random() * 0.12;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(speckPos, 3).setUsage(THREE.DynamicDrawUsage));
  sg.setAttribute('aSize', new THREE.BufferAttribute(speckSize, 1));
  const speckMat = new THREE.ShaderMaterial({ vertexShader: SH.SPECK_VERT, fragmentShader: SH.SPECK_FRAG, uniforms: { uPx: { value: 600 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const specks = new THREE.Points(sg, speckMat);
  specks.frustumCulled = false;
  scene.add(specks);

  // ---------- cząstki płynące wzdłuż żyły: (s wzdłuż osi, tn −1…1 w poprzek, z wysokość) ----------
  const Z0 = -4.2, Z1 = 2.2, rnd = (a, b) => a + Math.random() * (b - a);
  const dir = [Math.cos(CFG.angle), Math.sin(CFG.angle)], perp = [-dir[1], dir[0]];
  const L = CFG.length;
  const mk = (n, small) => Array.from({ length: n }, () => ({
    s: rnd(-L, L), tn: rnd(-0.86, 0.86), z: rnd(Z0, Z1),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0, 6.28), rnd(0, 3.14), rnd(0, 6.28))),
    w: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(), sp: rnd(0.4, 1.6), ph: rnd(0, 6.28), sz: small ? 1 : rnd(0.9, 1.1),
  }));
  const cellS = mk(NC);
  extras.forEach((X) => { X.items = mk(X.n, true); X.items.forEach((it) => { it.sz = rnd(X.size[0], X.size[1]); }); });
  const specksS = Array.from({ length: NS }, () => ({ s: rnd(-L, L), tn: rnd(-0.95, 0.95), z: rnd(Z0, Z1) }));

  const radiusAt = (s, t, beat) => CFG.radius * (1 + 0.05 * beat + 0.035 * Math.sin(s * 0.55 - t * 4.0) * (0.35 + beat));
  const centerV = (s) => 1.4 * Math.sin(s * 0.11 + 0.6);      // ta sama wijąca się oś co w shaderze
  const place = (s, tn, t, beat, out) => {
    const v = centerV(s) + tn * (radiusAt(s, t, beat) - 0.6);
    out.set(dir[0] * s + perp[0] * v, dir[1] * s + perp[1] * v);
  };

  // ---------- post-process z gry (js/render/post.js): bloom 3 poziomy, głębia ostrości, ACES, winieta, ziarno ----------
  const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false;
  const psc = new THREE.Scene(); psc.add(quad);
  const type = renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const mkT = (w, h, depth) => {
    const o = { type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: !!depth };
    if (depth) { o.depthTexture = new THREE.DepthTexture(w, h); o.depthTexture.type = THREE.UnsignedIntType; }
    return new THREE.WebGLRenderTarget(w, h, o);
  };
  const pmat = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: SH.QUAD_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const mBright = pmat(SH.BRIGHT, { tIn: { value: null }, uThresh: { value: 1.5 } });
  const mBlur = pmat(SH.BLUR, { tIn: { value: null }, uDir: { value: new THREE.Vector2() } });
  const mCopy = pmat(SH.COPY, { tIn: { value: null } });
  const mComp = pmat(SH.COMPOSITE, {
    tScene: { value: null }, tDepth: { value: null }, tDof: { value: null }, tB1: { value: null }, tB2: { value: null }, tB3: { value: null },
    uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uNear: { value: 0.1 }, uFar: { value: 300 }, uFocus: { value: 17 },
    uFever: { value: 0 }, uHit: { value: 0 }, uFade: { value: 0 }, uSlow: { value: 0 }, uExposure: { value: 0.95 }, uClean: { value: 0 },
  });
  let T = null, pr = 1, resScale = 0.8, doDof = true, doBloom = true, cellFrac = 1;
  const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(psc, pcam); };
  const blur = (a, b, scale) => {
    mBlur.uniforms.tIn.value = a.texture; mBlur.uniforms.uDir.value.set(scale / a.width, 0); pass(mBlur, b);
    mBlur.uniforms.tIn.value = b.texture; mBlur.uniforms.uDir.value.set(0, scale / a.height); pass(mBlur, a);
  };
  function resize() {
    const w = innerWidth, h = innerHeight;
    pr = Math.min(devicePixelRatio || 1, 1) * resScale;   // tło — nie potrzeba pełnej rozdzielczości
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    const W = Math.floor(w * pr), Hh = Math.floor(h * pr);
    if (T) Object.values(T).forEach((t) => t.dispose());
    const d = (k) => [Math.max(1, W >> k), Math.max(1, Hh >> k)];
    T = { scene: mkT(W, Hh, true), b1a: mkT(...d(1)), b1b: mkT(...d(1)), b2a: mkT(...d(2)), b2b: mkT(...d(2)), b3a: mkT(...d(3)), b3b: mkT(...d(3)), da: mkT(...d(1)), db: mkT(...d(1)) };
    mComp.uniforms.uRes.value.set(W, Hh);
    speckMat.uniforms.uPx.value = Hh * 0.9;
  }
  resize();
  const syncSize = resizeGuard(resize, () => running);

  // jakość dopasowana do GPU i do klatek/s (js/fx/quality.js): 1 = bez głębi ostrości, 2 = bez bloomu i niższa rozdzielczość, 3 = mniej krwinek
  function applyLevel(l) {
    doDof = l < 1; doBloom = l < 2; cellFrac = l >= 3 ? 0.6 : 1; resScale = l >= 2 ? 0.6 : 0.8;
    mComp.uniforms.uClean.value = doDof ? 0 : 1;
    resize();                                         // nowe cele renderu są puste (czarne), więc po wyłączeniu bloomu nic nie zostaje na ekranie
  }
  const q = adaptiveQuality({ onLevel: applyLevel });
  if (weakGpu()) q.set(1);   // słabsze / programowe GPU: start bez głębi ostrości

  function post(time, focus) {
    renderer.setRenderTarget(T.scene); renderer.clear(); renderer.render(scene, camera);
    if (doBloom) {
      mBright.uniforms.tIn.value = T.scene.texture; pass(mBright, T.b1a);
      blur(T.b1a, T.b1b, 1.0);
      mCopy.uniforms.tIn.value = T.b1a.texture; pass(mCopy, T.b2a);
      blur(T.b2a, T.b2b, 1.0);
      mCopy.uniforms.tIn.value = T.b2a.texture; pass(mCopy, T.b3a);
      blur(T.b3a, T.b3b, 1.0); blur(T.b3a, T.b3b, 2.0);
    }
    if (doDof) {
      mCopy.uniforms.tIn.value = T.scene.texture; pass(mCopy, T.da);
      blur(T.da, T.db, 1.2); blur(T.da, T.db, 2.4);
    }
    const u = mComp.uniforms;
    u.tScene.value = T.scene.texture; u.tDepth.value = T.scene.depthTexture; u.tDof.value = T.da.texture;
    u.tB1.value = T.b1a.texture; u.tB2.value = T.b2a.texture; u.tB3.value = T.b3a.texture;
    u.uNear.value = camera.near; u.uFar.value = camera.far; u.uTime.value = time; u.uFocus.value = focus;
    pass(mComp, null);
  }

  // ---------- pętla ----------
  let running = false, raf = 0, hideTimer = 0, last = 0, t = 0, shake = 0, lastBeat = 0;
  const p2 = new THREE.Vector2(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), m4 = new THREE.Matrix4(), dq = new THREE.Quaternion(), ax = new THREE.Vector3(), eu = new THREE.Euler();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    const dt = Math.min(0.05, raw);
    last = now;
    q.tick(raw);
    if (!reduced) t += dt;
    const phase = (t * BPM / 60) % 1;
    const g = gains(phase), beat = contraction(phase);
    // prąd jak w grze: największy w skurczu komór (sys), słabszy w rozkurczu (dia)
    const V = 0.9 + 9.5 * (g.sys * 0.9 + g.dia * 0.35);

    // kamera jak w grze (view.js): z = 17 nad powierzchnią, lekko pochylona, drgnięcie przy skurczu komór
    if (beat > 0.85 && lastBeat < 0.85) shake = 1;
    lastBeat = beat; shake *= Math.exp(-dt * 6);
    const sh = shake * 0.05;
    camera.position.set(Math.sin(t * 40) * sh, -CFG.zoom * 0.3 + Math.cos(t * 37) * sh, CFG.zoom);
    camera.lookAt(0, 0.4, 0);
    SHARED.uTime.value = t; SHARED.uBeat.value = beat;
    SHARED.uCam.value.copy(camera.position);
    SHARED.uLight.value.set(camera.position.x + 1.2, camera.position.y + 1.8, camera.position.z * 0.85);
    SHARED.uLightPow.value = 1.5 * (1 + 0.12 * beat);

    const nC = Math.floor(NC * cellFrac); rbc.count = nC;
    for (let i = 0; i < nC; i++) {
      const c = cellS[i];
      c.s += V * (1 - 0.8 * c.tn * c.tn) * dt;
      if (c.s > L) { c.s -= 2 * L; c.tn = rnd(-0.86, 0.86); c.z = rnd(Z0, Z1); }
      place(c.s, c.tn, t, beat, p2);
      pos.set(p2.x, p2.y, c.z + Math.sin(t * 0.7 + i) * 0.15);
      ax.copy(c.w); dq.setFromAxisAngle(ax, dt * (0.4 + V * 0.12)); c.q.multiply(dq);
      scl.setScalar(c.sz);
      m4.compose(pos, c.q, scl); rbc.setMatrixAt(i, m4);
    }
    rbc.instanceMatrix.needsUpdate = true;

    for (const X of extras) {
      X.items.forEach((c, i) => {
        c.s += V * X.speed * (1 - 0.8 * c.tn * c.tn) * dt;
        if (c.s > L) { c.s -= 2 * L; c.tn = rnd(-0.86, 0.86); c.z = rnd(Z0, Z1); }
        place(c.s, c.tn, t, beat, p2);
        pos.set(p2.x, p2.y, c.z + Math.sin(t * 0.9 + i * 1.7) * 0.2);
        eu.set(t * 0.3 + i, t * 0.2 + i * 2.1, 0); dq.setFromEuler(eu);
        const r = c.sz * (X.kind === 'bubble' ? 1 + 0.05 * Math.sin(t * 3 + i) : 1);
        scl.set(X.scale[0] * r, X.scale[1] * r, X.scale[2] * r);
        m4.compose(pos, dq, scl); X.m.setMatrixAt(i, m4);
      });
      X.m.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < NS; i++) {
      const c = specksS[i];
      c.s += V * 1.05 * (1 - 0.8 * c.tn * c.tn) * dt;
      if (c.s > L) { c.s -= 2 * L; c.tn = rnd(-0.95, 0.95); c.z = rnd(Z0, Z1); }
      place(c.s, c.tn, t, beat, p2);
      speckPos[i * 3] = p2.x; speckPos[i * 3 + 1] = p2.y; speckPos[i * 3 + 2] = c.z;
    }
    sg.attributes.position.needsUpdate = true;

    post(t, camera.position.distanceTo(new THREE.Vector3(0, 0.4, 0)));
  }

  // pierwszy rzut (kompilacja shaderów) zanim tło się pokaże
  last = performance.now();
  frame(last); cancelAnimationFrame(raf);

  return {
    show() {
      clearTimeout(hideTimer);
      canvas.style.opacity = '1';
      syncSize();
      q.reset();
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    hide() {
      canvas.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { running = false; cancelAnimationFrame(raf); }, CFG.fade + 100);
    },
  };
}

/** Wywoływane po najechaniu na kafelek; zwraca funkcję kończącą efekt. */
export function start() {
  if (!matchMedia('(hover: hover)').matches) return () => {};
  let alive = true;
  (creating ||= create().then((w) => (world = w)))
    .then((w) => { if (alive) w.show(); })
    .catch((e) => { creating = null; console.warn(e); });
  return () => { alive = false; world?.hide(); };
}
