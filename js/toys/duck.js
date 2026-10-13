import { playQuack } from './audio.js';

/** Gumowa kaczuszka: mały towarzysz pływający za kursorem, który komentuje to, na co najechałeś (style: .duck w toys.css). */
const BY_TITLE = [
  [/patient/i, 'Słyszysz? Tu bije serce. Pod wodą brzmi lepiej.'],
  [/skaner|ip/i, 'Skanuje sieć. Ja tylko po niej pływam.'],
  [/space|kosmos/i, 'Kosmos? Ja wolę staw.'],
  [/cork|korek/i, 'Przypięte pinezką. Uważaj, gdzie stąpasz.'],
  [/nostra/i, 'Tajne! Ja nic nie widziałem. Kwak.'],
  [/hive|rój/i, 'Rój? Zostaję przy swoim stawie.'],
  [/petri|petrie/i, 'Szalka Petriego, czyli bagienko dla wirtuozów.'],
  [/monitor/i, 'Oko widzi wszystko. A ja widzę oko.'],
];
const OTHER = [
  ['.photo', 'To twórca. Michał. Porządny gość.'],
  ['.toys button', 'Ooo, zabawka! Kliknij, kliknij.'],
  ['.links a, .links button', 'Kliknij. Nie gryzie. Ja gryzę, ale tylko chleb.'],
  ['footer', 'Dotarłeś na dół. Gratulacje!'],
  ['h1', 'Tu mieszka portfolio. Rozgość się.'],
];

let duck = null, bubble = null, bubbleTimer = 0, lastText = '', raf = 0, on = false;
let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;

function say(text) {
  lastText = text;
  bubble.textContent = text;
  duck.classList.add('talk');
  duck.classList.toggle('left', x > innerWidth - 270);
  playQuack();
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => duck.classList.remove('talk'), 3200);
}

function comment(target) {
  const card = target.closest('.project');
  if (card) {
    const title = card.querySelector('h3')?.textContent || '';
    const hit = BY_TITLE.find(([re]) => re.test(title));
    return hit ? hit[1] : 'Ciekawy projekt. Kwa!';
  }
  for (const [sel, text] of OTHER) if (target.closest(sel)) return text;
  return null;
}

let lastEl = null;
function over(e) {
  tx = e.clientX + 22; ty = e.clientY + 24;
  if (e.target === lastEl) return;
  lastEl = e.target;
  const text = comment(e.target);
  if (!text) lastText = '';
  else if (text !== lastText) say(text);   // nowy komentarz od razu; ten sam nie powtarza się przy ruchu w obrębie kafelka
}

function loop() {
  x += (tx - x) * 0.12; y += (ty - y) * 0.12;
  duck.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  raf = on && !document.hidden ? requestAnimationFrame(loop) : 0;
}

export function duckSay(text) { if (on) say(text); }

export function setDuck(enable) {
  if (!duck) {
    duck = document.createElement('div');
    duck.className = 'duck';
    duck.setAttribute('aria-hidden', 'true');
    const body = document.createElement('span');
    body.className = 'duck-body'; body.textContent = '🦆';
    bubble = document.createElement('span');
    bubble.className = 'duck-bubble';
    duck.append(body, bubble);
    document.body.append(duck);
    document.addEventListener('visibilitychange', () => { if (on && !document.hidden && !raf) raf = requestAnimationFrame(loop); });
  }
  on = enable;
  removeEventListener('pointermove', over);
  duck.classList.toggle('on', enable);
  if (enable) {
    addEventListener('pointermove', over, { passive: true });
    if (!raf) raf = requestAnimationFrame(loop);
    lastText = '';
    say('Kwa! Jestem Twoją kaczuszką. Pokaż mi coś.');
  } else duck.classList.remove('talk');
}
