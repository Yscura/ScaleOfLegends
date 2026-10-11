/**
 * Central icon assignments.
 *
 * Drop your icon file paths here and they'll be applied automatically to the
 * app logo and the mode tabs on load. Paths are relative to index.html
 * (e.g. put files in an `assets/icons/` folder and reference them below).
 *
 * Leave a value as an empty string '' to keep the current emoji/text fallback
 * for that item. If a path is set but the file fails to load, it also falls
 * back to the emoji/text — so nothing ever breaks while you're assigning them.
 */
export const ICONS = {
    // App logo — replaces the "SCALE OF LEGENDS" title text when set.
    logo: 'img/logo.png', // e.g. 'assets/icons/logo.svg'

    // One icon per game mode — replaces that tab's emoji when set.
    // Keys match the mode ids used throughout the app.
    modes: {
        daily:       'img/daily.png', // e.g. 'assets/icons/daily.svg'
        region:      'img/region.png', 
        order:       'img/order.png', 
        higherlower: 'img/higherlower.png', 
        price:       'img/price.png', 
        ladder:      'img/ladder.png', 
        creator:    'img/streamer.png',
    }
};
