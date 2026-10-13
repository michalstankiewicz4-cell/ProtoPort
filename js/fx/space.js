/* Efekt z gry Space (Swarm Protocol): po najechaniu na kafelek tłem strony staje się kosmos z gry —
   mgławice, Droga Mleczna, gwiazdy i pulsary — a kamera powoli krąży wokół Słońca (bez planet i orbit).
   Niebo i Słońce to ten sam kod co w grze (BodyKit, js/vendor/bodykit/), Three.js r128 ładuje się z CDN.
   Wszystko dociąga się dopiero przy pierwszym najechaniu i zostaje w pamięci. */

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const KIT_FILES = ['bodykit.js', 'suns.js', 'sky.js'];          // kolejność ma znaczenie

const SKY_RADIUS = 9000;               // jak w grze (scene/skybox.js)
const SUN_RADIUS = 5.5;                // w grze: promień 4.2 × skala 3; tu mniejsze, bo to tło
const ORBIT = { distance: 64, speed: 0.06, tilt: 0.3, bob: 0.045, fov: 52 };
const SUN_AT = { x: 0.12, y: 0.3 };    // gdzie na ekranie ma stać Słońce (ułamki szerokości/wysokości) — z boku, nie za kafelkami
const FADE_MS = 1400;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Nie wczytano ${src}`));
    document.head.append(s);
  });
}

async function loadKit() {
  if (!window.THREE) await loadScript(THREE_URL);
  for (const file of KIT_FILES) await loadScript(new URL(`../vendor/bodykit/${file}`, import.meta.url).href);
}

let world = null, creating = null;

async function create() {
  await loadKit();
  const { THREE, BodyKit } = window;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  // z-index: -1 → nad tłem strony (body), pod całą zawartością
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:0;transition:opacity ${FADE_MS}ms ease`;
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x02030c, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(ORBIT.fov, innerWidth / innerHeight, 0.1, 12000);

  // niebo: te same ustawienia co w grze (BodyKit.GAME_KINDS.sky)
  const skyRef = BodyKit.GAME_KINDS.sky;
  const sky = BodyKit.buildBody(skyRef.groupId, skyRef.bodyId, { detail: 1 });
  sky.setRadius(SKY_RADIUS);
  sky.setOctaves(BodyKit.QUALITY_OCTAVES[3]);
  scene.add(sky.group);

  // Słońce (SOL z gry), bez planet i linii orbit
  const sunRef = BodyKit.GAME_BODIES[0];
  const sun = BodyKit.buildBody(sunRef.groupId, sunRef.bodyId, { detail: BodyKit.GAME_DETAIL_SCALE * 1.4 });
  sun.setRadius(SUN_RADIUS);
  sun.setOctaves(BodyKit.QUALITY_OCTAVES[3]);
  scene.add(sun.group);

  // przesunięcie kadru: Słońce ląduje w SUN_AT, a nie na środku strony
  function frameCamera() {
    camera.aspect = innerWidth / innerHeight;
    camera.setViewOffset(innerWidth, innerHeight, innerWidth * (0.5 - SUN_AT.x), innerHeight * (0.5 - SUN_AT.y), innerWidth, innerHeight);
    camera.updateProjectionMatrix();
  }
  frameCamera();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, last = 0, running = false, raf = 0, hideTimer = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!reduced) t += dt;
    const yaw = t * ORBIT.speed * Math.PI * 2 * 0.5 + 1.1;
    const elev = ORBIT.tilt * Math.sin(t * ORBIT.bob * Math.PI * 2) + 0.12;
    camera.position.set(
      ORBIT.distance * Math.cos(elev) * Math.cos(yaw),
      ORBIT.distance * Math.sin(elev),
      ORBIT.distance * Math.cos(elev) * Math.sin(yaw),
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    sun.update(t, dt, {});
    sky.update(t, dt, { center: camera.position, renderer });
    renderer.render(scene, camera);
  }

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    frameCamera();
  });

  // pierwsze wypalenie mgławic (jednorazowe) zanim tło się pokaże
  camera.position.set(ORBIT.distance, 0, 0);
  camera.lookAt(0, 0, 0);
  sun.update(0, 0, {});
  sky.update(0, 0, { center: camera.position, renderer });
  renderer.render(scene, camera);

  return {
    show() {
      clearTimeout(hideTimer);
      canvas.style.opacity = '1';
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    hide() {
      canvas.style.opacity = '0';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { running = false; cancelAnimationFrame(raf); }, FADE_MS + 100);
    },
  };
}

/** Wywoływane po najechaniu na kafelek; zwraca funkcję kończącą efekt. */
export function start() {
  if (!matchMedia('(hover: hover)').matches) return () => {};
  let alive = true;
  (creating ||= create().then((w) => (world = w)))
    .then((w) => { if (alive) w.show(); })
    .catch(() => { creating = null; });
  return () => { alive = false; world?.hide(); };
}
