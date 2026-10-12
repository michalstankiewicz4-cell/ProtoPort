import { applyTheme, DEFAULT_THEME } from './theme.js';

/** Placeholder-screen generowany z kolorów motywu (gdy brakuje prawdziwego screena). */
function placeholder({ title, theme: t }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'>
    <rect width='640' height='400' fill='${t.bg}'/>
    <circle cx='480' cy='140' r='110' fill='${t.accent}' opacity='.25'/>
    <rect x='60' y='240' width='360' height='18' rx='4' fill='${t.accent}'/>
    <rect x='60' y='276' width='240' height='12' rx='4' fill='${t.fg}' opacity='.5'/>
    <text x='60' y='190' font-size='44' fill='${t.fg}' font-family='sans-serif' font-weight='700'>${title}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function createCard(project) {
  const link = document.createElement('a');
  link.className = 'project';
  link.href = project.url;
  link.target = '_blank';
  link.rel = 'noopener';

  const shot = new Image();
  shot.className = 'shot';
  shot.alt = `Zrzut ekranu projektu ${project.title}`;
  shot.loading = 'lazy';
  shot.addEventListener('error', () => { shot.src = placeholder(project); }, { once: true });
  shot.src = project.img || placeholder(project);

  const info = document.createElement('div');
  info.className = 'info';
  const title = document.createElement('h3');
  title.textContent = project.title;
  const desc = document.createElement('p');
  desc.textContent = project.desc;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = `${project.tag} →`;
  info.append(title, desc, tag);

  link.append(shot, info);

  const on = () => applyTheme(project.theme, true);
  const off = () => applyTheme(DEFAULT_THEME, false);
  link.addEventListener('mouseenter', on);
  link.addEventListener('mouseleave', off);
  link.addEventListener('focus', on);
  link.addEventListener('blur', off);

  return link;
}

export function renderProjects(container, projects) {
  container.replaceChildren(...projects.map(createCard));
}
