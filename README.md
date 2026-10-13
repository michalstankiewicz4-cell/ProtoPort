# ProtoPort

Osobista strona-portfolio na GitHub Pages: nagłówek ze zdjęciem i kontaktem oraz kafelki projektów.
Po najechaniu na kafelek cała strona płynnie przyjmuje kolory i styl danego projektu.
Po prawej stronie (na szerokich ekranach) jest panel „Zabawek" z efektami.

Strona działa live pod: <https://michalstankiewicz4-cell.github.io/ProtoPort/>

## Struktura

```
ProtoPort/
├── index.html                  # szkielet strony + SEO (bez stylów i skryptów inline)
├── sitemap.xml                 # mapa strony dla Google
├── assets/
│   ├── css/
│   │   ├── base.css            # zmienne motywu, reset, typografia, blokada zaznaczania
│   │   ├── layout.css          # stały nagłówek + przewijana lista, siatka, media queries
│   │   ├── components.css      # zdjęcie, linki kontaktowe, kafelek projektu
│   │   └── toys.css            # prawy panel zabawek i efekty
│   └── img/
│       ├── photo.jpg           # zdjęcie profilowe
│       ├── og-image.png        # miniatura do udostępniania (1200×630)
│       ├── icons/              # favicon (svg, ico) i apple-touch-icon
│       └── projects/           # screeny projektów
├── js/
│   ├── main.js                 # punkt wejścia
│   ├── theme.js                # zmiana motywu (zmienne CSS)
│   ├── projects.js             # renderowanie kafelków
│   ├── copy.js                 # przyciski „kopiuj do schowka"
│   ├── data/
│   │   └── projects.js         # LISTA PROJEKTÓW — tu dodajesz nowe
│   ├── thumbs/
│   │   └── eye.js              # żywa miniatura: oko podąża za kursorem
│   └── toys/
│       ├── index.js            # rejestr zabawek (TOYS) i panel
│       ├── degauss.js          # rozmagnesowanie kineskopu CRT
│       └── audio.js            # dźwięki (Web Audio) i wyciszenie
└── .github/workflows/static.yml  # wdrożenie na GitHub Pages
```

## Uruchomienie lokalnie

Skrypty to moduły ES, więc nie zadziałają po dwukliku w `index.html` (`file://`). Uruchom lokalny serwer:

```bash
python -m http.server 8000      # potem http://localhost:8000
# albo w VS Code: rozszerzenie „Live Server" → Go Live
```

## Jak dodać projekt

1. Wrzuć screen do `assets/img/projects/`.
2. Dopisz obiekt do tablicy w `js/data/projects.js` (tytuł, opis, link, screen i `theme`).
3. Dopisz projekt do bloku `<noscript>` w `index.html` (wersja bez JavaScriptu).

## Jak dodać zabawkę

1. Utwórz plik w `js/toys/` eksportujący funkcję (może zwracać `Promise`).
2. Dopisz `{ label, run }` do tablicy `TOYS` w `js/toys/index.js`.

## SEO

Strona jest po polsku (`lang="pl"`). W `<head>` są: tytuł, opis, adres kanoniczny, Open Graph i Twitter Cards
(miniatura `assets/img/og-image.png`), dane strukturalne JSON-LD oraz ikony. Po wdrożeniu dodaj stronę w
[Google Search Console](https://search.google.com/search-console) i zgłoś `sitemap.xml`.

## Wdrożenie

Każdy push na `main` uruchamia workflow z `.github/workflows/static.yml`, który publikuje stronę na GitHub Pages.
