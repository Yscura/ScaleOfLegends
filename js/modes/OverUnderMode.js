import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { BENCHMARKS, BENCHMARK_KEYS } from '../data/benchmarks.js';
import { CHAMPIONS } from '../data/champions.js';

const OU_BEST_KEY = 'sol_ou_best';

/**
 * Over/Under: is the champion taller or shorter than a reference object?
 * A streak run — one miss ends it, and the chosen benchmark creeps closer to the
 * champion's true height as your score climbs, so it gets harder the longer you last.
 */
export class OverUnderMode extends BaseMode {
    constructor(game) {
        super(game);
        this.champ = null;
        this.benchKey = 'banana';
        this.score = 0;
        this.locked = false;
    }

    get viewId() { return 'view-over-under'; }

    enter() {
        this.updateBestDisplay();
        this.startRun();
    }

    onUnitChange() {
        // Heights are hidden until reveal; nothing live to re-render mid-round.
    }

    updateBestDisplay() {
        document.getElementById('ou-best').innerText = this.store.getBestStreak(OU_BEST_KEY);
    }

    startRun() {
        this.score = 0;
        document.getElementById('ou-score').innerText = this.score;
        this.nextRound();
    }

    /** Pick a benchmark whose height ratio to the champion tightens with score. */
    pickBenchmark(champ) {
        const difficulty = Math.min(1, this.score / 10);
        const targetRatio = 3.5 - 2.25 * difficulty; // 3.5 (easy) -> 1.25 (hard)

        const candidates = BENCHMARK_KEYS
            .map(key => ({ key, h: BENCHMARKS[key].height }))
            .filter(b => b.h !== champ.height)
            .map(b => {
                const ratio = Math.max(b.h, champ.height) / Math.min(b.h, champ.height);
                return { key: b.key, dist: Math.abs(ratio - targetRatio) };
            })
            .sort((a, b) => a.dist - b.dist);

        // Pick among the closest few to the target ratio for a bit of variety.
        const pool = candidates.slice(0, Math.min(3, candidates.length));
        return pool[Math.floor(Math.random() * pool.length)].key;
    }

    nextRound() {
        this.locked = false;
        this.champ = this.store.selectDiverseChampion(CHAMPIONS);
        this.benchKey = this.pickBenchmark(this.champ);
        const bench = BENCHMARKS[this.benchKey];

        document.getElementById('ou-bench-name').innerText = bench.title;
        document.getElementById('ou-bench-title').innerText = bench.title;
        document.getElementById('ou-bench-svg').innerHTML = bench.svg;
        document.getElementById('ou-bench-height').innerText = ScaleUtils.formatHeight(bench.height, this.unitSystem);

        document.getElementById('ou-champ-name').innerText = this.champ.name;
        const img = document.getElementById('ou-champ-img');
        img.src = this.portraitUrl(this.champ.id);

        // Neutral equal sizes while guessing; hide the numbers.
        document.getElementById('ou-bench-svg').style.height = '100%';
        img.style.height = '100%';
        document.getElementById('ou-bench-height').classList.add('invisible');
        document.getElementById('ou-champ-height').classList.add('invisible');
        document.getElementById('ou-champ-card').classList.remove('hl-card-correct', 'hl-card-wrong');
        document.getElementById('ou-actions').classList.remove('hidden');
    }

    /** Scale the two silhouettes to their true relative heights on reveal. */
    revealFaceOff() {
        const ch = this.champ.height;
        const bh = BENCHMARKS[this.benchKey].height;
        const max = Math.max(ch, bh);
        const pct = (h) => `${Math.max(14, (h / max) * 100)}%`;
        document.getElementById('ou-champ-img').style.height = pct(ch);
        document.getElementById('ou-bench-svg').style.height = pct(bh);
    }

    handleGuess(guessedTaller) {
        if (this.locked) return;
        this.locked = true;

        const bench = BENCHMARKS[this.benchKey];
        const isTaller = this.champ.height >= bench.height;
        const isCorrect = guessedTaller === isTaller;

        document.getElementById('ou-actions').classList.add('hidden');

        const champHeightBox = document.getElementById('ou-champ-height');
        champHeightBox.classList.remove('invisible');
        this.game.animateCount(champHeightBox, bench.height, this.champ.height, 900,
            (cm) => ScaleUtils.formatHeight(cm, this.unitSystem));
        document.getElementById('ou-bench-height').classList.remove('invisible');

        this.revealFaceOff();

        const card = document.getElementById('ou-champ-card');

        if (isCorrect) {
            this.audio.play('success');
            this.score++;
            document.getElementById('ou-score').innerText = this.score;
            card.classList.add('hl-card-correct');

            const isMilestone = this.score % 5 === 0;
            this.game.flashVerdict(isMilestone ? `🔥 ${this.score} IN A ROW!` : 'CORRECT +1',
                isMilestone ? 'hot' : 'good');

            if (this.store.recordBestStreak(OU_BEST_KEY, this.score)) this.updateBestDisplay();

            setTimeout(() => this.nextRound(), isMilestone ? 2000 : 1600);
        } else {
            this.audio.play('fail');
            card.classList.add('hl-card-wrong');
            this.game.shake(card);
            this.game.flashVerdict('WRONG', 'bad');

            this.store.recordBestStreak(OU_BEST_KEY, this.score);
            this.updateBestDisplay();
            const finalScore = this.score;
            setTimeout(() => {
                this.showToast(`${this.champ.name} is ${ScaleUtils.formatHeight(this.champ.height, this.unitSystem)}. You scored ${finalScore}!`, 'error');
                this.startRun();
            }, 2400);
        }
    }
}
