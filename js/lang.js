/**
 * Przełącznik języka PL / CN — zabawny dodatek.
 * CN: teksty strony zamieniają się na chińskie (słownik poniżej, tłumaczenie „na oko”)
 * i cała strona obraca się o 180° (klasa `flipped` na <html>, style w components.css).
 * Teksty spoza słownika zostają po polsku. Oryginały trzymamy w WeakMap i przywracamy przy PL.
 * Twórcy: Michał Stankiewicz i Claude.
 */

// Klucze bez emoji; zamiana działa też na fragmentach (np. „Skaner CRT/VHS: wł.”, „gra • 3D”).
const ZH = {
  'Cześć, jestem': '你好，我是',
  'Michał': '米哈乌',
  'Vibecoder. Szybko buduję MVP, prototypy aplikacji i gry — zamiast tygodni planowania wolę zobaczyć pomysł działający na ekranie. Robię to hobbystycznie, dla siebie.':
    '氛围编程者。我快速构建 MVP、应用原型和游戏——与其花几周做计划，我更愿意看到想法在屏幕上运行。这是我的业余爱好，为自己而做。',
  'Moje projekty': '我的项目',
  'Projekty nie są skończone — to hobby. Najedź na kafelek, żeby zmienić klimat strony.': '项目尚未完成——这是爱好。把鼠标移到卡片上，改变页面的氛围。',
  'Wczesne pomysły': '早期想法',
  'Początek drogi: wczesne wersje i pomysły, które dopiero się rozkręcają.': '起步阶段：刚刚开始成形的早期版本和想法。',
  'Zabawki': '裹面糊的鸡肉',   // celowo: „kurczak w cieście” zamiast „zabawki” (żart Michała)
  'Kopiuj numer': '复制号码',
  'Skopiuj numer telefonu do schowka': '把电话号码复制到剪贴板',

  // Tytuły projektów (nazwy własne zostają)
  'Skaner adresów IP': 'IP 地址扫描器',
  'Monitoring obywatelski': '公民监控',
  'Bitwy morskie': '海战',
  'YouTube z lektorem': '带旁白的 YouTube',
  'Vibe-coding life hacki': '氛围编程小技巧',

  // Opisy projektów
  'Narzędzie do skanowania i audytu adresów IP.': '扫描和审计 IP 地址的工具。',
  'Teczki, dane, wszystko pod obserwacją.': '档案、数据，一切都在监视之下。',
  'Rak kontra lekarz: gra dla dwóch osób w jednym oknie.': '癌症对医生：一个窗口里的双人游戏。',
  'Swarm Protocol: strategia kosmiczna z flotą i badaniami.': '虫群协议：有舰队和科研的太空策略游戏。',
  'Cyfrowa tablica korkowa z karteczkami i nićmi.': '带便签和细线的数字软木板。',
  'Parlament P.I.M.P.: analiza wypowiedzi parlamentarnych.': 'P.I.M.P. 议会：议会发言分析。',
  'Rój pożera planetę blok po bloku.': '虫群一块一块地吞噬星球。',
  'Symulacja płynów i silnik fizyki, neonowe cząsteczki.': '流体模拟和物理引擎，霓虹粒子。',
  'Survival z budową bazy w postapokaliptycznej Warszawie, widok z góry i grafika 3D z filtrem pixel-art.': '在末日后的华沙建造基地求生，俯视视角，3D 画面加像素风滤镜。',
  'Program do ukrywania wiadomości w obrazku.': '把消息藏进图片里的程序。',
  'FPS o błądzeniu po nieskończonych, pustych pomieszczeniach.': '在无尽空房间里徘徊的第一人称射击游戏。',
  'Gra o bitwach okrętów na morzu, na razie przeciw komputerowi.': '海上舰船对战游戏，目前只能对战电脑。',
  'Program o reakcjach cząsteczek.': '关于粒子反应的程序。',
  'Ewolucja komórek z DNA.': '带 DNA 的细胞进化。',
  'Generator creepypast.': '恐怖故事生成器。',
  'Gra o kopaniu dziury i przetwarzaniu materiałów.': '挖洞和加工材料的游戏。',
  'Serwis do wrzucania filmów w stylu YouTube, czytany przez lektora.': 'YouTube 风格的视频网站，由旁白朗读。',
  'Podróż wewnątrz komputera: zmniejszasz swój rozmiar aż do atomu.': '电脑内部之旅：把自己缩小到原子大小。',
  'Life hacki do vibecodingu.': '氛围编程的小窍门。',

  // Tagi (fragmenty)
  'wczesny pomysł': '早期想法',
  'wczesna wersja': '早期版本',
  'aplikacja web': '网页应用',
  'analiza danych': '数据分析',
  '2 graczy': '双人',
  'narzędzie': '工具',
  'sieci': '网络',
  'gra': '游戏',
  'strategia': '策略',
  'symulacja': '模拟',
  'fizyka': '物理',
  'survival': '生存',
  'steganografia': '隐写术',
  'generator': '生成器',
  'serwis': '网站',
  'poradnik': '指南',

  // Zabawki
  'Rozmagnesuj kineskop': '显像管消磁',
  'Skaner CRT/VHS': 'CRT/VHS 扫描线',
  'Pstryk lampy': '开关台灯',
  'Kreska za kursorem': '光标拖尾',
  'Gumowa kaczuszka': '橡皮小鸭',
  'kolory projektu': '项目颜色',
  'kliknij stronę, by odblokować': '点击页面解锁',
  'Dźwięk': '声音',
  'światło': '亮',
  'ciemno': '暗',
  'tęcza': '彩虹',
  'wył.': '关',
  'wł.': '开',
};

const TITLE_ZH = '米哈乌 — 氛围编程者 | 原型、MVP、游戏和网页应用';

// Najdłuższe klucze najpierw; granice „słowa” po literach, żeby „gra” nie łapało „Program”.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RULES = Object.keys(ZH)
  .sort((a, b) => b.length - a.length)
  .map((k) => [new RegExp(`(?<!\\p{L})${esc(k)}(?!\\p{L})`, 'gu'), ZH[k]]);

function toZh(text) {
  let out = text.replace(/\s+/g, ' ');
  for (const [re, zh] of RULES) out = out.replace(re, zh);
  return out === text.replace(/\s+/g, ' ') ? text : out;
}

// Flagi jako SVG (emoji flag nie działają w Windows)
const star = (cx, cy, r, rot = 0) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.382 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="#ffde00"/>`;
};
const FLAG_PL = '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#dc143c"/></svg>';
const FLAG_CN = `<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#de2910"/>${star(5, 5, 3)}${star(10, 2, 1, 0.4)}${star(12, 4, 1, 0.9)}${star(12, 7, 1, 0)}${star(10, 9, 1, 0.4)}</svg>`;

const ATTRS = ['title', 'aria-label'];
const orig = new WeakMap();      // węzeł tekstowy → oryginał po polsku
const mine = new WeakMap();      // węzeł tekstowy → tekst wstawiony przez nas (żeby observer nie tłumaczył w kółko)
const origAttr = new WeakMap();  // element → { atrybut: oryginał }
const touched = new Set();       // wszystko, co zmieniliśmy, do przywrócenia
let zh = false, observer = null, plTitle = document.title;

const skip = (el) => !el || el.closest('script, style, noscript, .lang, svg');

function trText(node) {
  if (skip(node.parentElement) || mine.get(node) === node.nodeValue) return;
  const out = toZh(node.nodeValue);
  if (out === node.nodeValue) return;
  orig.set(node, node.nodeValue);
  mine.set(node, out);
  node.nodeValue = out;
  touched.add(node);
}

function trAttrs(el) {
  if (skip(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const out = toZh(v);
    if (out === v) continue;
    const saved = origAttr.get(el) || {};
    if (!(a in saved)) saved[a] = v;
    origAttr.set(el, saved);
    el.setAttribute(a, out);
    touched.add(el);
  }
}

function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) return trText(root);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = root; n; n = w.nextNode()) n.nodeType === Node.TEXT_NODE ? trText(n) : trAttrs(n);
}

function restore() {
  for (const n of touched) {
    if (n.nodeType === Node.TEXT_NODE) {
      if (mine.get(n) === n.nodeValue) n.nodeValue = orig.get(n);   // aplikacja w międzyczasie nic nie zmieniła
      mine.delete(n);
    } else {
      const saved = origAttr.get(n) || {};
      for (const [a, v] of Object.entries(saved)) n.setAttribute(a, v);
      origAttr.delete(n);
    }
  }
  touched.clear();
}

function setLang(lang, buttons) {
  zh = lang === 'zh';
  const html = document.documentElement;
  html.lang = zh ? 'zh-CN' : 'pl';
  html.classList.toggle('flipped', zh);
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

  if (zh) {
    plTitle = document.title;
    document.title = TITLE_ZH;
    walk(document.body);
    // Treść dorysowywana później (etykiety zabawek, dymki kaczuszki) też się tłumaczy
    observer = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') trText(m.target);
        else if (m.type === 'attributes') trAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  } else {
    observer?.disconnect();
    observer = null;
    restore();
    document.title = plTitle;
  }
}

/** Wstawia przełącznik PL / CN w prawy górny róg bloku z imieniem (nad przyciskiem kopiowania). */
export function initLang(host) {
  if (!host) return;
  const box = document.createElement('div');
  box.className = 'lang';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Język strony');
  box.innerHTML =
    `<button type="button" data-lang="pl" aria-pressed="true" title="Polski">${FLAG_PL}<span>PL</span></button>` +
    `<button type="button" data-lang="zh" aria-pressed="false" title="中文 (i do góry nogami)">${FLAG_CN}<span>CN</span></button>`;
  const buttons = [...box.querySelectorAll('button')];
  buttons.forEach((b) => b.addEventListener('click', () => {
    if ((b.dataset.lang === 'zh') !== zh) setLang(b.dataset.lang, buttons);
  }));
  host.prepend(box);
}
