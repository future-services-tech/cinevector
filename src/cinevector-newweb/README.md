# CineVector — CineSphere 3D (cinevector-newweb)

Dashboard sperimentale standalone: esploratore semantico dei film su una sfera 3D interattiva, con pannello di dettaglio (trailer + colonna sonora). Ricostruisce fedelmente le specifiche di design fornite in `src/documents/dashboard_sfere3d/code.html` e `src/documents/dettaglio_sfere3d/code.html`, ma renderizzate con Three.js/`@react-three/fiber` reale invece del Canvas2D originale del mockup.

**Nessun backend richiesto**: tutti i dati (~1000 film, 8 cluster tematici, cast, colonne sonore) sono generati proceduralmente e deterministicamente a import-time (`src/data/generateMockData.ts`, PRNG seedato) — non è collegato all'API di `CineVector.Api` né a `cinevector-web`. È un progetto indipendente pensato per validare il design della sfera semantica.

## Avvio

```bash
npm install
npm run dev
```

Apri `http://localhost:5173` (o la porta indicata in console). Routing: `/` mostra la sfera 3D, `/movie/:id` apre sopra di essa il modal di dettaglio del film (deep-link diretto supportato, es. `/movie/blade-runner-2049`).

## Cosa è realmente funzionante (non solo decorativo, come nel mockup originale)

- **Sidebar**: toggle dei cluster tematici, soglia di similarità vettoriale e arco temporale filtrano davvero i nodi/archi visibili sulla sfera.
- **Player colonna sonora**: play/pausa, avanti/indietro, shuffle, repeat, volume e seek sono cablati a uno stato React reale (non placeholder statici).
- **Player trailer**: nessun video reale disponibile (è un mockup), ma play/pausa e barra di avanzamento sono guidati da stato React reale.
- **Ricerca, watchlist** (persistita in `localStorage`), pannello di dettaglio nodo, statistiche del footer (cluster più denso, valutazione media, consiglio del giorno) — tutti calcolati dai dati generati, non hardcoded.

## Struttura

```
src/
  data/            generatore dati mock deterministico (PRNG seedato) + API di lettura (getMovieById, ricerca, ...)
  types/           modello dati (MovieNode "leggero" per la sfera vs MovieDetail "pesante" on-demand)
  lib/              helper Three.js (Fibonacci sphere, texture glow, curve degli archi), hook, store
  state/            React Context: filtri, selezione/hover, watchlist
  components/
    sphere/         scena 3D (griglia olografica, nodi, archi semantici, controlli camera)
    layout/         chrome della dashboard (header, sidebar, pannello destro, footer)
    modal/          modal di dettaglio film (trailer, colonna sonora, cast, crediti)
  pages/            DashboardPage (layout + routing), NotFoundPage
```

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite`, tema via `@theme`) + Three.js / `@react-three/fiber` / `@react-three/drei` + React Router.

## Script

- `npm run dev` — dev server con HMR
- `npm run build` — type-check (`tsc -b`) + build di produzione (Vite)
- `npm run lint` — Oxlint
- `npm run preview` — anteprima della build di produzione
