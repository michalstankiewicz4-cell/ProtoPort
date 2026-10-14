/**
 * Lista projektów wyświetlanych na stronie.
 *
 * Aby dodać projekt: dopisz obiekt poniżej i wrzuć screen do assets/img/projects/.
 *   img    — ścieżka do screena (puste = automatyczny placeholder z kolorów motywu)
 *   liveThumb — opcjonalnie: nazwa żywej miniatury z js/thumbs/ (np. 'eye'); img zostaje jako wersja awaryjna
 *   early  — true = wczesny pomysł: kafelek trafia do sekcji pod linią, bez theme i hoverFx
 *   theme  — kolory i styl, na które strona płynnie się zmienia po najechaniu na kafelek
 *            (fx: "scan" włącza efekt scanlines)
 */
export const PROJECTS = [
  {
    title: 'Skaner adresów IP',
    desc: 'Narzędzie do skanowania i audytu adresów IP.',
    tag: 'narzędzie • sieci',
    url: 'https://github.com/michalstankiewicz4-cell/IPscanner',
    img: 'assets/img/projects/ipscanner.webp',
    hoverFx: 'matrix',
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
    img: 'assets/img/projects/monitoring.webp',
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
    img: 'assets/img/projects/patientzero.webp',
    hoverFx: 'vein',
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
    img: 'assets/img/projects/space.webp',
    hoverFx: 'space',
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
    img: 'assets/img/projects/corkboard.webp',
    hoverFx: 'cork',
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
    img: 'assets/img/projects/nostradamnos.webp',
    hoverFx: 'archive',
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
    img: 'assets/img/projects/hivehunger.webp',
    hoverFx: 'swarm',
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
    img: 'assets/img/projects/petriedish.webp',
    hoverFx: 'petri',
    theme: {
      bg: '#04050c', fg: '#e8f6ff', accent: '#19e6ff', card: '#0b1022', radius: '14px',
      font: "'Orbitron', sans-serif", spacing: '0.06em', transform: 'uppercase', fx: '',
    },
  },
  {
    title: 'Capital Quarantine',
    desc: 'Survival z budową bazy w postapokaliptycznej Warszawie, widok z góry i grafika 3D z filtrem pixel-art.',
    tag: 'gra • survival',
    url: 'https://michalstankiewicz4-cell.github.io/VS/',
    theme: {
      bg: '#14120e', fg: '#ece3cf', accent: '#e0a030', card: '#201c14', radius: '4px',
      font: "'Share Tech Mono', monospace", spacing: '0.02em', transform: 'none', fx: '',
    },
  },
  {
    title: 'PicMess',
    desc: 'Program do ukrywania wiadomości w obrazku.',
    tag: 'narzędzie • steganografia',
    url: 'https://michalstankiewicz4-cell.github.io/PicMess/',
    theme: {
      bg: '#120f1f', fg: '#ece6ff', accent: '#b388ff', card: '#1c1730', radius: '10px',
      font: "'Inter', sans-serif", spacing: '0', transform: 'none', fx: '',
    },
  },
  {
    title: 'Liminal Spaces',
    desc: 'FPS o błądzeniu po nieskończonych, pustych pomieszczeniach.',
    tag: 'gra • FPS',
    url: 'https://michalstankiewicz4-cell.github.io/liminalspaces/',
    theme: {
      bg: '#cdc48a', fg: '#3a3418', accent: '#8a7a1c', card: '#e9e1ae', radius: '0px',
      font: "'Special Elite', monospace", spacing: '0.02em', transform: 'none', fx: '',
    },
  },
  {
    title: 'Bitwy morskie',
    desc: 'Gra o bitwach okrętów na morzu, na razie przeciw komputerowi.',
    tag: 'gra • strategia',
    url: 'https://michalstankiewicz4-cell.github.io/Battle/',
    theme: {
      bg: '#0a1a2c', fg: '#dbe9f6', accent: '#ff5a4d', card: '#12283f', radius: '6px',
      font: "'Antonio', sans-serif", spacing: '0.05em', transform: 'uppercase', fx: '',
    },
  },
  // ----- Wczesne pomysły: osobna sekcja pod linią, bez efektów i bez zmiany motywu strony -----
  {
    title: 'Gravitation',
    desc: 'Program o reakcjach cząsteczek.',
    tag: 'wczesny pomysł • symulacja',
    url: 'https://michalstankiewicz4-cell.github.io/Gravitation/',
    early: true,
  },
  {
    title: 'Cells Evolution',
    desc: 'Ewolucja komórek z DNA.',
    tag: 'wczesny pomysł • symulacja',
    url: 'https://michalstankiewicz4-cell.github.io/CellsEvolution/',
    early: true,
  },
  {
    title: 'Creepypasta Generator',
    desc: 'Generator creepypast.',
    tag: 'wczesna wersja • generator',
    url: 'https://michalstankiewicz4-cell.github.io/CreepyPastaGenerator/',
    early: true,
  },
  {
    title: 'Satisfactoria Mechanica',
    desc: 'Gra o kopaniu dziury i przetwarzaniu materiałów.',
    tag: 'wczesna wersja • gra',
    url: 'https://michalstankiewicz4-cell.github.io/Satisfactoria-Mechanica/',
    early: true,
  },
  {
    title: 'YouTube z lektorem',
    desc: 'Serwis do wrzucania filmów w stylu YouTube, czytany przez lektora.',
    tag: 'wczesna wersja • serwis',
    url: 'https://michalstankiewicz4-cell.github.io/YouTube/',
    early: true,
  },
  {
    title: 'Deep Dive',
    desc: 'Podróż wewnątrz komputera: zmniejszasz swój rozmiar aż do atomu.',
    tag: 'wczesna wersja • gra',
    url: 'https://michalstankiewicz4-cell.github.io/DeepDive/',
    early: true,
  },
  {
    title: 'Vibe-coding life hacki',
    desc: 'Life hacki do vibecodingu.',
    tag: 'wczesny pomysł • poradnik',
    url: 'https://michalstankiewicz4-cell.github.io/vibe-coding-life-hack/',
    early: true,
  },
];
