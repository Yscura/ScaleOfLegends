import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CREATORS } from '../data/creators.js';
import { BASELINE_HUMAN_CM } from '../core/constants.js';

const CREATOR_BEST_KEY = 'sol_creator_streak';

// Everyone here is human, so the slider covers a human range only (no 50 m giants).
const CREATOR_MIN_CM = 140;
const CREATOR_MAX_CM = 220;
// Guess within this many cm of the (self-reported!) height to keep the streak.
const CORRECT_CM = 12;
// Figures are drawn on an exaggerated scale so human height gaps read clearly:
// the slider's full range maps to BASE..BASE+SPAN px (not a true-to-zero scale).
const FIG_BASE_PX = 52;
const FIG_SPAN_PX = 120;

/**
 * Streamer Scale — a joke streak mode. You judge a content creator's height
 * against a fixed "average human" reference; guess close enough to keep the
 * streak going, miss and the run resets. Heights are community/self-reported
 * memes, flagged as such throughout.
 */
export class CreatorMode extends BaseMode {
    constructor(game) {
        super(game);
        this.creator = null;
        this.streak = 0;
        this.locked = false;
        this.recent = []; // own anti-repeat list
    }

    get viewId() { return 'view-creator'; }

    get slider() { return document.getElementById('creator-slider'); }

    enter() {
        this.updateBestDisplay();
        this.startRun();
    }

    onUnitChange() {
        this.renderHumanReference();
        this.updateRangeLabels();
        if (!this.locked) this.updateGuessLabel();
    }

    updateBestDisplay() {
        document.getElementById('creator-best').innerText = this.store.getBestStreak(CREATOR_BEST_KEY);
    }

    updateRangeLabels() {
        document.getElementById('creator-min-label').innerText = ScaleUtils.formatHeight(CREATOR_MIN_CM, this.unitSystem);
        document.getElementById('creator-max-label').innerText = ScaleUtils.formatHeight(CREATOR_MAX_CM, this.unitSystem);
    }

    currentGuessCm() {
        return Number(this.slider.value);
    }

    updateGuessLabel() {
        document.getElementById('creator-guess-box').innerText =
            ScaleUtils.formatHeight(this.currentGuessCm(), this.unitSystem);
    }

    /** Exaggerated pixel height so human differences are easy to see. */
    figPx(cm) {
        const clamped = Math.max(CREATOR_MIN_CM, Math.min(CREATOR_MAX_CM, cm));
        const frac = (clamped - CREATOR_MIN_CM) / (CREATOR_MAX_CM - CREATOR_MIN_CM);
        return Math.round(FIG_BASE_PX + frac * FIG_SPAN_PX);
    }

    renderHumanReference() {
        const fig = document.getElementById('creator-human-fig');
        if (fig) fig.style.height = `${this.figPx(BASELINE_HUMAN_CM)}px`;
        const lbl = document.getElementById('creator-human-height');
        if (lbl) lbl.innerText = ScaleUtils.formatHeight(BASELINE_HUMAN_CM, this.unitSystem);
    }

    renderStreamerFigure(cm) {
        const fig = document.getElementById('creator-streamer-fig');
        if (fig) fig.style.height = `${this.figPx(cm)}px`;
    }

    /**
     * Renders the creator's portrait circle: their assigned image (data/creators.js
     * `img`) if present, otherwise their initial. A broken path falls back to the
     * initial, so assigning images never breaks the UI.
     */
    renderAvatar(c) {
        const el = document.getElementById('creator-avatar');
        if (!el) return;
        const initial = c.name.charAt(0).toUpperCase();
        el.innerHTML = '';
        if (c.img) {
            const img = document.createElement('img');
            img.className = 'creator-avatar-img';
            img.alt = c.name;
            img.onerror = () => { el.textContent = initial; };
            el.appendChild(img);
            img.src = c.img;
        } else {
            el.textContent = initial;
        }
    }

    /** Anti-repeat pick from the creator roster. */
    pickCreator() {
        let pool = CREATORS.filter(c => !this.recent.includes(c.name));
        if (pool.length === 0) pool = CREATORS.slice();
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        this.recent.push(chosen.name);
        if (this.recent.length > Math.min(5, CREATORS.length - 1)) this.recent.shift();
        return chosen;
    }

    startRun() {
        this.streak = 0;
        document.getElementById('creator-score').innerText = this.streak;
        this.renderHumanReference();
        this.nextRound();
    }

    nextRound() {
        this.locked = false;
        this.creator = this.pickCreator();

        document.getElementById('creator-name').innerText = this.creator.name;
        this.renderAvatar(this.creator);

        this.slider.value = BASELINE_HUMAN_CM;
        this.slider.disabled = false;
        document.getElementById('creator-reveal').classList.add('hidden');
        document.getElementById('creator-lock-btn').classList.remove('hidden');

        this.updateRangeLabels();
        this.updateGuessLabel();
        this.renderStreamerFigure(BASELINE_HUMAN_CM);
    }

    onSliderInput() {
        if (this.locked) return;
        const cm = this.currentGuessCm();
        const frac = (cm - CREATOR_MIN_CM) / (CREATOR_MAX_CM - CREATOR_MIN_CM);
        this.audio.play('tick', { frequency: 300 + frac * 500 });
        this.updateGuessLabel();
        this.renderStreamerFigure(cm);
    }

    lockIn() {
        if (this.locked) return;
        this.locked = true;

        const guess = this.currentGuessCm();
        const actual = this.creator.height;
        const diff = Math.abs(guess - actual);
        const correct = diff <= CORRECT_CM;

        this.slider.disabled = true;
        document.getElementById('creator-lock-btn').classList.add('hidden');
        this.renderStreamerFigure(actual); // snap the figure to their real height

        const reveal = document.getElementById('creator-reveal');
        reveal.classList.remove('hidden');
        const actualStr = ScaleUtils.formatHeight(actual, this.unitSystem);
        const diffStr = ScaleUtils.formatHeight(diff, this.unitSystem);
        const factLine =
            `<span class="text-[color:var(--sol-text-dim)]">${this.creator.name} is ~${actualStr} ` +
            `<em class="not-italic text-[color:var(--sol-gold-soft)]">(self-reported)</em></span><br>` +
            `<span class="text-[color:var(--sol-gold-soft)] text-xs">${this.creator.note}</span>`;
        const scoreEl = document.getElementById('creator-score');

        if (correct) {
            this.audio.play('success');
            this.streak++;
            scoreEl.innerText = this.streak;
            this.game.bumpScore(scoreEl);

            const milestone = this.streak % 5 === 0;
            this.game.flashVerdict(milestone ? `🔥 ${this.streak} STREAK!` : `CORRECT · off ${diffStr}`,
                milestone ? 'hot' : 'good');
            reveal.innerHTML = `<span class="text-green-400">Nice — within ${diffStr}!</span><br>${factLine}`;

            if (this.store.recordBestStreak(CREATOR_BEST_KEY, this.streak)) {
                this.updateBestDisplay();
                this.game.bumpScore(document.getElementById('creator-best'));
            }

            setTimeout(() => this.nextRound(), milestone ? 2600 : 2200);
        } else {
            this.audio.play('fail');
            this.game.flashVerdict('WAY OFF', 'bad');
            reveal.innerHTML = `<span class="text-red-400">Off by ${diffStr} — run over!</span><br>${factLine}`;

            this.store.recordBestStreak(CREATOR_BEST_KEY, this.streak);
            this.updateBestDisplay();
            this.store.recordGamePlayed('creator', this.streak);
            const finalStreak = this.streak;

            this.streak = 0;
            scoreEl.innerText = 0;
            this.game.shakeScore(scoreEl);
            this.game.showInfo(`${this.creator.name} is ~${actualStr} (self-reported) — streak ended at ${finalStreak}.`);

            setTimeout(() => this.startRun(), 2800);
        }
    }
}
