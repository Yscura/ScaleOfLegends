import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';
import { MIN_CM, MAX_CM, BASELINE_HUMAN_CM } from '../core/constants.js';

const PRICE_BEST_KEY = 'sol_price_best';

/**
 * Price is Right: guess a champion's height as closely as possible WITHOUT going
 * over. Overshoot and you bust (run ends). Staying under scores points by
 * closeness, so timid low-balls earn almost nothing — you have to push.
 */
export class PriceMode extends BaseMode {
    constructor(game) {
        super(game);
        this.champ = null;
        this.score = 0;
        this.locked = false;
    }

    get viewId() { return 'view-price'; }

    get slider() { return document.getElementById('price-slider'); }

    enter() {
        this.updateBestDisplay();
        this.startRun();
    }

    onUnitChange() {
        this.updateRangeLabels();
        if (!this.locked) this.updateGuessLabel();
    }

    updateBestDisplay() {
        document.getElementById('price-best').innerText = this.store.getBestStreak(PRICE_BEST_KEY);
    }

    updateRangeLabels() {
        document.getElementById('price-min-label').innerText = ScaleUtils.formatHeight(MIN_CM, this.unitSystem);
        document.getElementById('price-max-label').innerText = ScaleUtils.formatHeight(MAX_CM, this.unitSystem);
    }

    currentGuessCm() {
        return ScaleUtils.sliderToCm(this.slider.value);
    }

    updateGuessLabel() {
        document.getElementById('price-guess-box').innerText =
            ScaleUtils.formatHeight(this.currentGuessCm(), this.unitSystem);
    }

    startRun() {
        this.score = 0;
        document.getElementById('price-score').innerText = this.score;
        this.nextRound();
    }

    nextRound() {
        this.locked = false;
        this.champ = this.store.selectDiverseChampion(CHAMPIONS);

        document.getElementById('price-champ-name').innerText = this.champ.name;
        document.getElementById('price-champ-img').src = this.portraitUrl(this.champ.id);

        this.slider.value = ScaleUtils.cmToSlider(BASELINE_HUMAN_CM);
        this.slider.disabled = false;
        document.getElementById('price-reveal').classList.add('hidden');
        document.getElementById('price-lock-btn').classList.remove('hidden');

        this.updateRangeLabels();
        this.updateGuessLabel();
    }

    onSliderInput() {
        if (this.locked) return;
        const val = this.slider.value;
        const frequency = 300 + (val / 1000) * 500;
        this.audio.play('tick', { frequency });
        this.updateGuessLabel();
    }

    lockIn() {
        if (this.locked) return;
        this.locked = true;

        const guess = this.currentGuessCm();
        const actual = this.champ.height;
        this.slider.disabled = true;
        document.getElementById('price-lock-btn').classList.add('hidden');

        const reveal = document.getElementById('price-reveal');
        reveal.classList.remove('hidden');
        const actualStr = ScaleUtils.formatHeight(actual, this.unitSystem);

        if (guess > actual) {
            this.audio.play('fail');
            this.game.flashVerdict('BUST!', 'bad');
            const overBy = ScaleUtils.formatHeight(guess - actual, this.unitSystem);
            reveal.innerHTML =
                `<span class="text-red-400">BUST — over by ${overBy}!</span><br>` +
                `<span class="text-[color:var(--sol-text-dim)]">${this.champ.name} is ${actualStr}</span>`;

            this.store.recordBestStreak(PRICE_BEST_KEY, this.score);
            this.updateBestDisplay();

            const scoreEl = document.getElementById('price-score');
            scoreEl.innerText = 0;
            this.game.shakeScore(scoreEl);

            setTimeout(() => this.startRun(), 2600);
        } else {
            const margin = actual - guess;
            const marginRatio = margin / actual; // 0 = perfect, larger = safer

            // Guessing more than SAFE_LIMIT under earns nothing; within PERFECT doubles.
            const SAFE_LIMIT = 0.25;
            const PERFECT = 0.05;
            let points = 0;
            let doubled = false;
            if (marginRatio <= SAFE_LIMIT) {
                points = Math.round(100 * (1 - marginRatio / SAFE_LIMIT));
                if (marginRatio <= PERFECT) {
                    points *= 2;
                    doubled = true;
                }
            }

            const marginStr = ScaleUtils.formatHeight(margin, this.unitSystem);
            const champLine = `<span class="text-[color:var(--sol-text-dim)]">${this.champ.name} is ${actualStr}</span>`;
            const scoreEl = document.getElementById('price-score');

            if (points > 0) {
                this.audio.play('success');
                this.score += points;
                scoreEl.innerText = this.score;
                this.game.bumpScore(scoreEl);

                if (doubled) {
                    this.game.flashVerdict(`PERFECT ×2! +${points}`, 'hot');
                    reveal.innerHTML =
                        `<span class="text-green-400">Bullseye! ${marginStr} under — +${points} <strong>(×2 precision bonus!)</strong></span><br>${champLine}`;
                } else {
                    this.game.flashVerdict(`SAFE +${points}`, 'good');
                    reveal.innerHTML =
                        `<span class="text-green-400">Safe! ${marginStr} under (+${points})</span><br>${champLine}`;
                }

                if (this.store.recordBestStreak(PRICE_BEST_KEY, this.score)) {
                    this.updateBestDisplay();
                    this.game.bumpScore(document.getElementById('price-best'));
                }
            } else {
                // Survived, but played it too safe — no points.
                this.audio.play('tick');
                this.game.flashVerdict('TOO SAFE · +0', 'warn');
                reveal.innerHTML =
                    `<span class="text-[color:var(--sol-gold-soft)]">Too safe — ${marginStr} under. No points this time!</span><br>${champLine}`;
            }

            setTimeout(() => this.nextRound(), 2200);
        }
    }
}
