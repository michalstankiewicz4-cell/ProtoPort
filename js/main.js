import { PROJECTS } from './data/projects.js';
import { renderProjects } from './projects.js';
import { initToys } from './toys/index.js';
import { initCopyButtons } from './copy.js';

renderProjects(document.getElementById('grid'), PROJECTS);
initToys(document.getElementById('toys'));
initCopyButtons();

// Razem z `user-select: none` (base.css): nie da się przeciągać obrazków ani linków.
// Prawy przycisk myszy (menu kontekstowe) działa normalnie.
document.addEventListener('dragstart', (event) => event.preventDefault());
