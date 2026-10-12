/**
 * Zmiana motywu strony: ustawia zmienne CSS na <html> i klasy na <body>.
 * Płynność zapewniają przejścia zdefiniowane w assets/css/base.css.
 */
const root = document.documentElement;
const SCANLINES = 'repeating-linear-gradient(0deg, rgba(0,0,0,.45) 0 1px, transparent 1px 3px)';

export const DEFAULT_THEME = {
  bg: '#101114', fg: '#e8e8ea', accent: '#7c9cff', card: '#1a1c21', radius: '14px',
  font: "'Inter', system-ui, sans-serif", spacing: '0em', transform: 'none', fx: '',
};

export function applyTheme(theme, themed = false) {
  const set = (name, value) => root.style.setProperty(name, value);
  set('--bg', theme.bg);
  set('--fg', theme.fg);
  set('--accent', theme.accent);
  set('--card', theme.card);
  set('--radius', theme.radius);
  set('--font', theme.font);
  set('--head-spacing', theme.spacing);
  set('--head-transform', theme.transform);
  set('--overlay', theme.fx === 'scan' ? SCANLINES : 'none');

  document.body.classList.toggle('fx', theme.fx === 'scan');
  document.body.classList.toggle('themed', themed);
}