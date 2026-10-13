import { degauss } from './degauss.js';
import { setCrt } from './crt.js';
import { setLamp } from './lamp.js';
import { setTrail } from './trail.js';
import { setDuck } from './duck.js';
import { initKonami } from './konami.js';
import { isSoundEnabled, toggleSound } from './audio.js';

/**
 * Rejestr zabawek z prawego panelu.
 * Nowa zabawka = nowy plik w js/toys/ + wpis tutaj:
 *  - { label, run }                — jednorazowa; `run` może zwrócić Promise (przycisk jest wyłączony do jego zakończenia),
 *  - { label, states, set(i) }     — przełącznik; kolejne kliknięcia przechodzą po `states` (0 = wyłączone).
 */
const TOYS = [
  { label: '📺 Rozmagnesuj kineskop', run: degauss },
  { label: '📼 Skaner CRT/VHS', states: ['wył.', 'wł.'], set: (i) => setCrt(i === 1) },
  { label: '🔦 Pstryk lampy', states: ['światło', 'ciemno'], set: (i) => setLamp(i === 1) },
  { label: '🌈 Kreska za kursorem', states: ['wył.', 'tęcza', 'kolory projektu'], set: setTrail },
  { label: '🦆 Gumowa kaczuszka', states: ['wył.', 'wł.'], set: (i) => setDuck(i === 1) },
];

const soundLabel = () => (isSoundEnabled() ? '🔊 Dźwięk: wł.' : '🔇 Dźwięk: wył.');

export function initToys(container) {
  for (const toy of TOYS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = toy.label;
    if (toy.states) {
      let i = 0;
      button.addEventListener('click', () => {
        i = (i + 1) % toy.states.length;
        toy.set(i);
        button.textContent = i ? `${toy.label}: ${toy.states[i]}` : toy.label;
        button.classList.toggle('active', i > 0);
        button.setAttribute('aria-pressed', String(i > 0));
      });
    } else {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try { await toy.run(); } finally { button.disabled = false; }
      });
    }
    container.append(button);
  }

  const sound = document.createElement('button');
  sound.type = 'button';
  sound.className = 'mini';
  sound.textContent = soundLabel();
  sound.addEventListener('click', () => {
    toggleSound();
    sound.textContent = soundLabel();
  });
  container.append(sound);

  initKonami();
}
