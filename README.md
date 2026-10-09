# Scale of Legends

A daily League of Legends scale & origin guessing game. Players estimate champion
heights in lore and test their knowledge of Runeterra across five game modes.

## Game Modes

- **Daily Scale** — Guess the scale of 5 daily champions against a hidden benchmark unit.
- **Region Map** — Click a champion's home region on the map of Runeterra.
- **Height Order** — Arrange champions from shortest to tallest.
- **Bigger?** — Higher/lower streak mode comparing champion heights.
- **Practice** — Free sandbox with a selectable benchmark and unit system.

## Running

The JavaScript is split into native ES modules, so the page must be served over
HTTP (modules can't load from `file://`). Easiest options:

- **VS Code**: install the *Live Server* extension, then "Open with Live Server" on `index.html`.
- **Any Python**: `python -m http.server` from the project root, then open http://localhost:8000.

No build step or dependencies required — styling uses the Tailwind CDN and fonts
load from Google Fonts.

## Project structure

```
index.html            markup only
css/styles.css        custom styles (slider, arena, toasts)
js/
  main.js             bootstrap
  Game.js             orchestrator: mode switching, shared DOM & services
  core/               constants, ScaleUtils, AudioController, GameStore
  data/               champions.js, benchmarks.js
  modes/              BaseMode + one controller per game mode
```

## Tech

- Vanilla JavaScript (ES6 modules), no framework.
- Tailwind CSS via CDN.
- Champion portraits from Riot's Data Dragon CDN.
