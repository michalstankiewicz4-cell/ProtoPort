/**
 * Lista projektów wyświetlanych na stronie.
 *
 * Aby dodać projekt: dopisz obiekt poniżej i wrzuć screen do assets/img/projects/.
 *   img    — ścieżka do screena (puste = automatyczny placeholder z kolorów motywu)
 *   liveThumb — opcjonalnie: nazwa żywej miniatury z js/thumbs/ (np. 'eye'); img zostaje jako wersja awaryjna
 *   theme  — kolory i styl, na które strona płynnie się zmienia po najechaniu na kafelek
 *            (fx: "scan" włącza efekt scanlines)
 */
export const PROJECTS = [
  {
    title: 'Skaner adresów IP',
    desc: 'Narzędzie do skanowania i audytu adresów IP.',
    tag: 'narzędzie • sieci',
    url: 'https://github.com/michalstankiewicz4-cell/IPscanner',
    img: 'assets/img/projects/ipscanner.jpg',
    theme: {
      bg: '#1b1b1d', fg: '#d8d8d8', accent: '#1a8cff', card: '#252527', radius: '3px',
      font: "'Inter', sans-serif", spacing: '0', transform: 'none', fx: '',
    },
  },
  {
    title: 'Monitoring obywatelski',
    desc: 'Teczki, dane, wszystko pod obserwacją.',
    tag: 'aplikacja web',
    url: 'https://michalstankiewicz4-cell.github.io/monitoringobywatelski/',
    img: 'assets/img/projects/monitoring.jpg',
    liveThumb: 'eye',
    theme: {
      bg: '#2a0606', fg: '#f6dede', accent: '#ff1f1f', card: '#400b0b', radius: '0px',
      font: "'Special Elite', monospace", spacing: '0.12em', transform: 'uppercase', fx: 'scan',
    },
  },
  {
    title: 'Patient Zero',
    desc: 'Rak kontra lekarz: gra dla dwóch osób w jednym oknie.',
    tag: 'gra • 2 graczy',
    url: 'https://michalstankiewicz4-cell.github.io/PatientZero/',
    img: 'assets/img/projects/patientzero.jpg',
    theme: {
      bg: '#111c20', fg: '#e6f2ee', accent: '#3ddc97', card: '#1a2a30', radius: '14px',
      font: "'Inter', sans-serif", spacing: '0', transform: 'none', fx: '',
    },
  },
  {
    title: 'Space',
    desc: 'Swarm Protocol: strategia kosmiczna z flotą i badaniami.',
    tag: 'gra • strategia',
    url: 'https://michalstankiewicz4-cell.github.io/Space/',
    img: 'assets/img/projects/space.jpg',
    theme: {
      bg: '#02030c', fg: '#e8ecff', accent: '#f4b04a', card: '#0b1236', radius: '24px',
      font: "'Antonio', sans-serif", spacing: '0.05em', transform: 'uppercase', fx: '',
    },
  },
  {
    title: 'CorkBoard',
    desc: 'Cyfrowa tablica korkowa z karteczkami i nićmi.',
    tag: 'narzędzie',
    url: 'https://michalstankiewicz4-cell.github.io/CorkBoard/',
    img: 'assets/img/projects/corkboard.jpg',
    theme: {
      bg: '#a8743c', fg: '#2a1a0e', accent: '#d9482b', card: '#f7efdc', radius: '3px',
      font: "'Caveat', cursive", spacing: '0.01em', transform: 'none', fx: '',
    },
  },
  {
    title: 'NostraDamnOS',
    desc: 'Parlament P.I.M.P.: analiza wypowiedzi parlamentarnych.',
    tag: 'analiza danych',
    url: 'https://michalstankiewicz4-cell.github.io/NostraDamnOS/',
    img: 'assets/img/projects/nostradamnos.jpg',
    theme: {
      bg: '#f0eff8', fg: '#1f2340', accent: '#0a93b8', card: '#ffffff', radius: '16px',
      font: "'Inter', sans-serif", spacing: '0', transform: 'none', fx: '',
    },
  },
  {
    title: 'Hive Hunger',
    desc: 'Rój pożera planetę blok po bloku.',
    tag: 'gra • 3D',
    url: 'https://michalstankiewicz4-cell.github.io/Hive-Hunger/',
    img: 'assets/img/projects/hivehunger.jpg',
    theme: {
      bg: '#070a1a', fg: '#cfe4ff', accent: '#ffd166', card: '#0e1634', radius: '6px',
      font: "'Share Tech Mono', monospace", spacing: '0.02em', transform: 'none', fx: '',
    },
  },
  {
    title: 'Petrie Dish',
    desc: 'Symulacja płynów i silnik fizyki, neonowe cząsteczki.',
    tag: 'symulacja • fizyka',
    url: 'https://michalstankiewicz4-cell.github.io/PetrieDish/',
    img: 'assets/img/projects/petriedish.jpg',
    theme: {
      bg: '#04050c', fg: '#e8f6ff', accent: '#19e6ff', card: '#0b1022', radius: '14px',
      font: "'Orbitron', sans-serif", spacing: '0.06em', transform: 'uppercase', fx: '',
    },
  },
];