# Scale of Legends

A League of Legends scale & trivia guessing game. Players estimate champion
heights in lore and test their knowledge of Runeterra across several game modes,
all wrapped in a gold-and-dark-blue, League-inspired UI.

## Game Modes

Pick a mode from the home page, or jump between them with the icon bar at the top
(hover an icon to see its name). Click the logo to return home.

- **Daily Scale** — Estimate the height of 5 seeded daily champions against a hidden
  benchmark unit (banana, Teemo, Baron…), then share your accuracy card.
- **Region Map** — Click a champion's home region on a hand-built, animated vector map
  of Runeterra. Hovering a pin (or the land itself) highlights that territory. Streak-based.
- **Height Order** — Arrange 4 champions shortest→tallest by swapping cards (they slide
  into place). Get it wrong and the misplaced cards are outlined in red, then animate into
  the correct order so you can see what you missed. Streak + best.
- **Bigger?** — Higher/lower: is the target taller or shorter than the reference? The reveal
  scales both champions to their true relative heights. The height gap narrows as your streak
  climbs. Streak + best.
- **Price is Right** — Guess a champion's height as close as you can *without going over*.
  Closer scores more, within 5% doubles the points, guessing too low scores nothing, and
  going over busts the run. Score + best.
- **Scale Ladder** — Endless: slot each new champion into a height-sorted ladder
  (tallest at top, shortest at bottom). The ladder grows and the gaps get finer the longer
  you last. Score + best.
- **Practice** — Free sandbox with a selectable benchmark and metric/imperial units.

## Features

- **Home page + icon bar** — a landing page listing every mode, plus a compact icon-only
  tab bar with hover tooltips.
- **League-inspired theme** — gold + deep-blue palette driven entirely by CSS variables.
- **Custom icons** — assign a logo and per-mode icons in one place (`js/data/icons.js`),
  with automatic emoji fallback.
- **Non-linear slider** — slider resolution is tuned to the real height distribution
  (most champions are ~150–250cm), so the common range gets fine control while giants are
  compressed up top.
- **Scoring & feedback** — streaks with persistent personal bests (localStorage), animated
  score pops on a gain and a red shake on a reset, central CORRECT/WRONG verdict stamps, and
  a slim info bar that shows the result detail only on a loss.
- **Smart champion selection** — recently-seen champions are avoided so the same one doesn't
  reappear too soon.
- Metric/imperial unit toggle and Web Audio sound effects.

## Running

The JavaScript is split into native ES modules, so the page must be served over
HTTP (modules can't load from `file://`). Easiest options:

- **VS Code**: install the *Live Server* extension, then "Open with Live Server" on `index.html`.
- **Any Python**: `python -m http.server` from the project root, then open http://localhost:8000.

No build step or dependencies required — styling uses the Tailwind CDN and fonts
load from Google Fonts.

## Project structure

```
index.html            markup only (all views live here)
css/styles.css        theme variables + custom styles (slider, map, animations, cards)
js/
  main.js             bootstrap
  Game.js             orchestrator: home page, icon bar, mode switching, shared DOM & services
  core/
    constants.js        MIN/MAX/baseline heights
    ScaleUtils.js       slider↔height mapping (SLIDER_STOPS), height/unit formatting
    AudioController.js   Web Audio sound effects
    GameStore.js        champion selection, streaks & best-score persistence
  data/
    champions.js        champion roster (name, id, height, race, region, lore)
    benchmarks.js        reference objects (banana … Baron) with inline SVGs
    icons.js             logo + per-mode icon assignments
    modes.js             mode registry (id, name, tagline, emoji) for the bar & home page
  modes/
    BaseMode.js          shared base for every mode
    ArenaMode.js         shared scaling-arena behaviour
    DailyMode.js         Daily Scale  (extends ArenaMode)
    SandboxMode.js       Practice     (extends ArenaMode)
    RegionMode.js        Region Map
    OrderMode.js         Height Order
    HigherLowerMode.js   Bigger?
    PriceMode.js         Price is Right
    LadderMode.js        Scale Ladder
```

## Customizing

- **Icons** — set file paths in `js/data/icons.js` (`logo` and one per mode key). Leave a
  value `''` to keep the emoji fallback; a broken path also falls back automatically.
- **Modes on the bar/home page** — edit `js/data/modes.js` (name, tagline, emoji, order).
- **Theme colours** — edit the CSS variables at the top of `css/styles.css`. Changing
  `--sol-gold-rgb` (space-separated `R G B`) recolours every gold accent at once.
- **Slider feel** — adjust the `SLIDER_STOPS` control points (`[sliderFraction, cm]`) in
  `js/core/ScaleUtils.js`.

## Tech

- Vanilla JavaScript (ES6 modules), no framework or build step.
- Tailwind CSS via CDN; custom CSS for the theme and animations.
- A hand-built inline-SVG map of Runeterra (no external map image).
- Champion portraits from Riot's Data Dragon CDN.
