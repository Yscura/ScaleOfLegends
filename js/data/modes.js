/**
 * Mode registry used to build the icon bar and the home page. `id` must match
 * the keys in the game's mode map (Game.js) and the icon keys in data/icons.js.
 * `emoji` is the fallback shown when no icon image is assigned.
 */
export const MODES = [
    { id: 'daily',       name: 'Daily Scale',    tagline: "Guess today's champion heights",      emoji: '📅' },
    { id: 'region',      name: 'Region Map',     tagline: "Find each champion's home region",     emoji: '🗺️' },
    { id: 'order',       name: 'Height Order',   tagline: 'Sort champions shortest to tallest',   emoji: '📊' },
    { id: 'higherlower', name: 'Bigger?',        tagline: 'Taller or shorter — keep the streak',  emoji: '⚔️' },
    { id: 'price',       name: 'Price is Right', tagline: 'Guess the height without going over',   emoji: '💰' },
    { id: 'ladder',      name: 'Scale Ladder',   tagline: 'Slot each champion into the ladder',   emoji: '🪜' },
    { id: 'sandbox',     name: 'Practice',       tagline: 'Free-play the scaling arena',          emoji: '🛠️' },
];
