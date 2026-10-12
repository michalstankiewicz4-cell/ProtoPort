import { degauss } from './degauss.js';
import { isSoundEnabled, toggleSound } from './audio.js';

/**
 * Rejestr zabawek z prawego panelu.
 * Nowa zabawka = nowy plik w js/toys/ + wpis tutaj: { label, run }.
 * `run` może zwrócić Promise — przycisk jest wyłączony do jego zakończenia.
 */
const TOYS = [
  { label: '📺 Rozmagnesuj kineskop', run: degauss },
];

const soundLabel = () => (isSoundEnabled() ? '🔊 Dźwięk: wł.' : '🔇 Dźwięk: wył.');

export function initToys(container) {
  for (const toy of TOYS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = toy.label;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await toy.run(); } finally { button.disabled = false; }
    });
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
}