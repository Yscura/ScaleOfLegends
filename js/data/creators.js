/**
 * Joke mode roster: well-known League of Legends content creators & personalities.
 *
 * ⚠️ These heights are NOT verified facts. Reliable height data for streamers
 * barely exists — the numbers below are the most commonly-cited community /
 * self-reported / meme figures, gathered from fan sites and streams. They are
 * presented in-game as "self-reported / community estimate" and the whole mode
 * is explicitly a bit of fun, not a reference. Edit freely: add/remove people
 * or correct a number and the mode picks it up automatically.
 *
 * Fields:
 *   name   — display name.
 *   height — in centimetres.
 *   note   — short, affectionate one-liner shown on the reveal.
 *   img    — portrait shown in the play circle. Put a square image (≈200×200)
 *            in img/creators/ and point to it, e.g. 'img/creators/tyler1.png'.
 *            null (or a missing file) falls back to the creator's initial, so
 *            adding portraits later never breaks anything.
 */
export const CREATORS = [
    { name: 'Tyler1',          height: 167, img: null, note: "Swears he's taller — the ceiling remains undefeated." },
    { name: 'Faker',           height: 176, img: null, note: 'The Unkillable Demon King, in metric.' },
    { name: 'Doublelift',      height: 175, img: null, note: "Never actually confirmed it himself. Allegedly." },
    { name: 'Imaqtpie',        height: 168, img: null, note: 'Pie: a man of the people, at a people-sized height.' },
    { name: 'Nightblue3',      height: 188, img: null, note: 'Surprisingly towering for a jungle main.' },
    { name: 'Tarzaned',        height: 175, img: null, note: 'Loud volume, medium altitude.' },
    { name: 'Disguised Toast', height: 174, img: null, note: 'Big brain, perfectly average elevation.' },
    { name: 'Scarra',          height: 188, img: null, note: 'Genuinely a large man.' },
    { name: 'Caedrel',         height: 180, img: null, note: 'Still shorter than the Golden Toilet.' },
    { name: 'Pokimane',        height: 165, img: null, note: "One of the internet's most-Googled heights." },
    { name: 'Dyrus',           height: 193, img: null, note: 'Famously, enormously tall.' },
    { name: 'Yassuo',          height: 168, img: null, note: 'The 5\'6" Yasuo demon. Claims otherwise on stream.' },
    { name: 'Thebausffs',      height: 175, img: null, note: 'Dies a lot. Height is perfectly average about it.' },
    { name: 'Sneaky',          height: 178, img: null, note: 'Cosplay height advantage is real.' },
    { name: 'Bjergsen',        height: 183, img: null, note: 'The Great Dane. Actually kind of tall.' },
    { name: 'Caps',            height: 180, img: null, note: 'Western midlaner height inflation is real.' },
    { name: 'Rekkles',         height: 182, img: null, note: 'Swedish, so the height is just standard issue.' },
    { name: 'Jankos',          height: 185, img: null, note: 'Polish power. Looks like he could jungle IRL too.' },
    { name: 'Perkz',           height: 178, img: null, note: 'Croatian midlane menace, medium-tall.' },
    { name: 'Broxah',          height: 180, img: null, note: 'Danish jungle height is no joke.' },
    { name: 'Shiphtur',        height: 175, img: null, note: 'Educational content at a respectable elevation.' },
    { name: 'BoxBox',          height: 170, img: null, note: 'Riven god. Height is more of a side quest.' },
    { name: 'TF Blade',        height: 178, img: null, note: 'Top lane tyrant. Tall enough to look down on most lanes.' },
    { name: 'Trick2g',         height: 183, img: null, note: 'The Forest is tall. And so is the man who lives there.' },
    { name: 'Gosu',            height: 175, img: null, note: 'Vayne god. Height is just another skillshot he lands.' },
    { name: 'Voyboy',          height: 180, img: null, note: 'Still streaming, still average-to-tall.' },
    { name: 'Aphromoo',        height: 173, img: null, note: 'Support height. Surprisingly not the shortest on the list.' },
    { name: 'CoreJJ',          height: 178, img: null, note: 'Korean support supremacy comes in a solid package.' },
    { name: 'Santorin',        height: 185, img: null, note: 'Danish jungler energy. Tall and unbothered.' },
    { name: 'Froggen',         height: 188, img: null, note: 'Anivia mains are just built different (and taller).' },
    { name: 'WildTurtle',      height: 175, img: null, note: 'The original NA ADC height archetype.' },
];
