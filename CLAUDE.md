# Kontekst projektu ProtoPort (dla Claude)

Ten plik pozwala wznowić pracę w nowej rozmowie lub w innym miejscu bez utraty kontekstu. **Przeczytaj go w całości przed zmianami**
i aktualizuj sekcje „Stan” i „Decyzje” po każdym większym wydaniu.

## Projekt

- **Co to:** osobiste portfolio Michała (Warszawa) na GitHub Pages. Statyczna strona, moduły ES, bez bundlera i backendu.
- **Repo:** https://github.com/michalstankiewicz4-cell/ProtoPort — **strona:** https://michalstankiewicz4-cell.github.io/ProtoPort/
  (wdrożenie automatyczne po pushu na `main`, `.github/workflows/static.yml`).
- **Lokalnie (Windows):** `C:\Users\micha\vsrepos\ProtoPort`.
- **Układ strony:** stały nagłówek (zdjęcie, opis, linki), przewijana lista kafelków projektów, po prawej panel „Zabawki”
  (od szerokości 1400 px; węziej przez przycisk `✦ Zabawki`). Najechanie na kafelek zmienia motyw całej strony (`js/theme.js`)
  i ewentualnie uruchamia efekt tła (`hoverFx`).
- Interfejs, komentarze w kodzie i rozmowa po polsku, SEO po polsku. W kodzie komentarz: twórca Michał Stankiewicz i Claude.

## Zasady pracy (od Michała)

1. Pracujemy iteracyjnie: Michał testuje, zgłasza uwagi, ja poprawiam celowo. Odpowiedzi po polsku, **krótko**.
2. **Na GitHub wysyłamy tylko na polecenie** („wyślij na gh”). Wcześniej tylko lokalne repo + podgląd.
3. Gdy Michał prosi o propozycje („zaproponuj”), **tylko proponuję, nie implementuję**.
4. Testy i podgląd robimy w artefakcie (jeden plik HTML), a zmiany zapisujemy równolegle do lokalnego repo.
5. Przy nowych efektach i zabawkach sprawdzamy, czy nie psują stylów innych efektów (patrz „Pułapki”).

## Struktura repo

```
index.html                 szkielet, SEO, linki do CSS i js/main.js
assets/css/                base, layout, components, thumbs, toys (.css)
assets/img/                zdjęcie, og-image, screeny projektów (projects/)
js/main.js                 renderProjects + initToys + initCopyButtons
js/projects.js             kafelki (screeny .webp), rozgrzewka (warmUp), podpięcie efektu: bindFx(link, hoverFx)
js/theme.js                applyTheme (zmienne CSS na <html>, klasy body)
js/data/projects.js        lista projektów (title, desc, tag, url, img, theme, hoverFx, liveThumb)
js/fx/                     efekty tła po najechaniu (patrz niżej) + quality.js
js/thumbs/eye.js           żywa miniatura Monitoringu
js/toys/                   zabawki: audio, degauss, crt, lamp, trail, duck, konami, index (rejestr)
js/vendor/                 bodykit (Space), patientzero/shaders.js (shadery z gry)
```

## Efekty po najechaniu (`js/fx/`)

Pole `hoverFx` w `js/data/projects.js` → wpis w **`js/fx/registry.js`** (`load` = lazy `import()`, `kind` = `canvas` albo `theme`,
`heavy`, `ambient` = dźwięki). Moduł eksportuje `start(card)`, które zwraca `stop()`. **`js/fx/controller.js`** (`bindFx`, `startFx`)
wywołuje je na `mouseenter/focus`, kończy na `mouseleave/blur`, pilnuje wyścigów (`ticket`), stopu przy ukrytej karcie,
dźwięku otoczenia i tego, że **naraz działa najwyżej jeden efekt typu `theme`** (matrix/archive/cork). **`js/fx/kit.js`** to wspólne
`reduced`, `SLOW`, `rand`, `resizeGuard` (przelicza rozmiar tylko przy działającym efekcie). **Nowy efekt = plik w `js/fx/` + wpis w rejestrze.**
`weakGpu()` w `quality.js` wykrywa słabe/programowe GPU (żyła startuje od niższej jakości, Konami pomija efekty `heavy`).

| Projekt | hoverFx | Co robi |
|---|---|---|
| Skaner adresów IP | `matrix` | tryb tekstowy, jasnozielony monochromat, deszcz znaków (klasa `mx-on`) |
| Patient Zero | `vein` | żyła po skosie z krwinkami, Three.js r128, **prawdziwe shadery z gry** (`js/vendor/patientzero/shaders.js`), 72 bpm |
| Space | `space` | tło z biblioteki bodykit (Three.js) |
| CorkBoard | `cork` | tablica korkowa, żółte karteczki, pinezki (klasa `cork-on`) |
| NostraDamnOS | `archive` | biurko w archiwum: karty akt, pieczątki, zaczernienia (klasa `arc-on`) |
| Hive Hunger | `swarm` | rój cząstek |
| Petrie Dish | `petri` | cząstki z gradientową poświatą |
| Monitoring | — | tylko żywa miniatura `eye` (`liveThumb`) |

- **Wydajność:** `js/fx/quality.js` → `adaptiveQuality({onLevel,max,low,windows})`; efekty obniżają jakość przy niskim FPS
  (żyła: poziom 1 bez DOF, 2 bez bloomu i niższa rozdzielczość, 3 mniej krwinek; petri/matrix mniej cząstek/kolumn).
  Wykrycie słabego GPU (regex na `WEBGL_debug_renderer_info`) startuje żyłę od poziomu 1. Idle `warmUp()` dociąga moduły i Three.js.
- Warstwy efektów to `position:fixed; z-index:-1` nad tłem `body`, pod treścią. Klasy na `body` zmieniają wygląd z `!important`.
- Shadery gry powstają skryptem `gen_shaders.js` (poza repo, `C:\Users\micha\vsrepos\`) z klonu PatientZero — nie edytować ręcznie.

## Zabawki (`js/toys/`)

Rejestr `TOYS` w `js/toys/index.js`: `{label, run}` (jednorazowa) albo `{label, states, set(i)}` (przełącznik; 0 = wyłączone).

- **📺 Rozmagnesuj kineskop** (`degauss.js`): filtr SVG na `main` + poświata, 2 s.
- **📼 Skaner CRT/VHS** (`crt.js` + style `.crt-*`): linie skanowania, winieta, zaokrąglone rogi, drżenie (`translate` na `header`/`.scroll`),
  aberracja chromatyczna (`text-shadow` przez `:where`, więc efekty ją nadpisują), wypukłość kineskopu (SVG `feDisplacementMap`
  z mapą generowaną na canvasie, `filter` na `main`; gdy przewijanie szarpie (<38 FPS przez ~0,7 s) włącza się `crt-flat` i zostaje sam CRT bez zakrzywienia), brum 50/100 Hz.
- **🔦 Pstryk lampy** (`lamp.js`): ciemna nakładka z gradientem radialnym podążającym za kursorem.
- **🌈 Kreska za kursorem** (`trail.js`): canvas, stany: wył. / tęcza / kolor projektu (`--accent`).
- **🦆 Gumowa kaczuszka** (`duck.js`): podąża za kursorem, komentuje kafelki (dopasowanie tytułu `h3` regexem) i elementy strony;
  nowy komentarz pojawia się od razu, ten sam nie powtarza się.
- **Konami** (`konami.js`, bez przycisku): ↑↑↓↓←→←→BA → na 7 s efekty `swarm, space, petri, vein` naraz + rozmagnesowanie + fanfara.
  Bierze z rejestru efekty `kind: 'canvas'` (bez `heavy` na słabym GPU); `theme` pomija, bo zmieniają style strony i kolidowałyby.
- **Dźwięk** (`audio.js`, Web Audio, bez plików): wspólny `AudioContext` + master; `ambient(kind)` z licznikiem odwołań:
  `heart` (lub/dub z gry, lowpass 700 Hz „pod wodą”, szum krwi), `hum`, `rain`, `stamp`, `space` (niski dron z „oddychaniem”,
  szum i dalekie pingi pulsarów), `chomp` (brzęczenie roju + chrupiące gryzienia w nieregularnych odstępach). Pole `ambient` w rejestrze efektów:
  vein→heart, matrix→rain+hum, archive→stamp, space→space, swarm→chomp. Nowy dźwięk = nowa funkcja w `KINDS` w `audio.js`. Przeglądarka odblokuje dźwięk dopiero po pierwszym kliknięciu na stronie.

## Pułapki (czego już się nauczyliśmy)

- **Zmienne CSS na tych samych elementach:** archiwum i tablica korkowa dawniej dzieliły `--rot`, a sprzątanie jednego kasowało wartość drugiego.
  Teraz `--arc-rot` i `--cork-rot`. Nowy efekt = własne nazwy zmiennych i klas.
- `filter`/`transform`/`translate` na przodku robi z niego blok zawierający dla elementów `position:fixed` — nie nakładać ich na kontenery z elementami fixed.
- Sprzątanie efektu odbywa się z opóźnieniem po `hide()` — nie zakładać, że po zejściu kursora DOM jest od razu czysty.
- W Playwright z programowym WebGL (swiftshader) wszystko jest kilkukrotnie wolniejsze; timery potrafią odpalić z opóźnieniem (np. toast Konami znika „od razu”).
- Nie ma sprawdzenia na prawdziwym GPU — warto zerknąć na płynność żyły i Konami na słabszym sprzęcie.

## Podgląd w artefakcie i narzędzia pomocnicze (poza repo)

- **Artefakt podglądu:** https://claude.ai/artifact/ADSA21sx7YRE1uH4XWSCo7 — jedna strona, składana skryptem `mk.py` z sandboxu
  (moduły z repo zawijane w IIFE, importy usuwane). Po zmianie kodu w repo trzeba przebudować i opublikować ponownie.
  Jeśli sandbox zniknął: odtworzyć pipeline lub testować repo przez `python -m http.server` + Playwright (Chromium).
- **PC (Windows):** PowerShell `-Command` zjada `$` — zawsze uruchamiać skrypty `.ps1` (`powershell -ExecutionPolicy Bypass -File ...`).
  Skrypty w `C:\Users\micha\vsrepos\`: `chk.ps1` (node --check na kopiach `.mjs`), `push.ps1`/`push2.ps1` (commit z pliku UTF-8 bez BOM,
  `git pull --rebase origin main`, `git push origin main`).
- Stopka commitów: `Co-Authored-By: Claude ...` + `Claude-Session: ...` zgodnie z bieżącą instrukcją sesji.

## Stan

Na `main`: 7 efektów hover z rejestrem i kontrolerem (`js/fx/`), adaptacyjna jakość, 6 zabawek (degauss, CRT/VHS z wypukłością, lampa,
kreska, kaczuszka, Konami) i dźwięki otoczenia dla vein, matrix, archive, space i swarm. Screeny projektów w WebP.
Ostatnie kroki: refaktor (a4c7a45), potem ambient kosmosu i gryzień roju. Aktualną historię pokaże `git log`.

## Pomysły czekające na decyzję (nie wprowadzać bez prośby)

- Dźwięk monitoringu/oka, kolejne komentarze kaczuszki (np. losowe, gdy nic się nie dzieje).
- Regulacja siły wypukłości CRT i wyłączenie jej na słabszych urządzeniach, jeśli przewijanie będzie szarpać.
