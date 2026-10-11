/**
 * Achievement registry for the profile page. Each entry is derived entirely
 * from stored stats/records (see GameStore) — nothing extra is persisted.
 *
 * `value(d)` reads the player's current number toward the goal and `target` is
 * the threshold; unlocked = value >= target, and the ratio drives the progress
 * bar. `d` is the summary object built in Game.renderProfile().
 */
export const ACHIEVEMENTS = [
    { id: 'first-game',  icon: '🎮', name: 'Getting Started',    desc: 'Play your first game',               target: 1,   value: d => d.totalGames },
    { id: 'ten-games',   icon: '🕹️', name: 'Warmed Up',          desc: 'Play 10 games',                      target: 10,  value: d => d.totalGames },
    { id: 'fifty-games', icon: '🎖️', name: 'Veteran',            desc: 'Play 50 games',                      target: 50,  value: d => d.totalGames },
    { id: 'centurion',   icon: '💯', name: 'Centurion',          desc: 'Play 100 games',                     target: 100, value: d => d.totalGames },
    { id: 'all-modes',   icon: '🧭', name: 'Jack of All Scales', desc: 'Play all 6 modes',                   target: 6,   value: d => d.modesPlayed },
    { id: 'daily-7',     icon: '🔥', name: 'Week Warrior',       desc: 'Reach a 7-day streak',               target: 7,   value: d => d.bestDay },
    { id: 'daily-30',    icon: '📅', name: 'Unbroken Month',     desc: 'Reach a 30-day streak',              target: 30,  value: d => d.bestDay },
    { id: 'acc-80',      icon: '🎯', name: 'Sharp Eye',          desc: 'Finish a daily at 80%+ average',     target: 80,  value: d => d.bestDailyAcc },
    { id: 'acc-95',      icon: '🦅', name: 'Eagle Eye',          desc: 'Finish a daily at 95%+ average',     target: 95,  value: d => d.bestDailyAcc },
    { id: 'hl-15',       icon: '⚔️', name: 'Giant Slayer',       desc: '15 streak in Bigger?',               target: 15,  value: d => d.best.higherlower },
    { id: 'ladder-20',   icon: '🪜', name: 'Ladder Master',      desc: 'Place 20 in Scale Ladder',           target: 20,  value: d => d.best.ladder },
    { id: 'price-500',   icon: '💰', name: 'Price Tycoon',       desc: 'Score 500 in Price is Right',        target: 500, value: d => d.best.price },
    { id: 'order-8',     icon: '📊', name: 'In Perfect Order',   desc: '8 streak in Height Order',           target: 8,   value: d => d.best.order },
    { id: 'region-12',   icon: '🗺️', name: 'Master Cartographer',desc: '12 streak in Region Map',            target: 12,  value: d => d.best.region },
];
