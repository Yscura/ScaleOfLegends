import { ArenaMode } from './ArenaMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { BENCHMARKS, BENCHMARK_KEYS } from '../data/benchmarks.js';
import { CHAMPIONS } from '../data/champions.js';
import { BASELINE_HUMAN_CM } from '../core/constants.js';

/** Small deterministic PRNG so a seed always reproduces the same daily roster. */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Daily challenge: 5 seeded champions judged against a hidden benchmark unit. */
export class DailyMode extends ArenaMode {
    constructor(game) {
        super(game);
        this.dailyRoster = [];
        this.dailyIndex = 0;
        this.dailyScores = [];
        this.dailyLockedUnitKey = 'banana';
        this.loadDailyRoster();
    }

    get isDaily() { return true; }

    enter() {
        document.getElementById('mode-subtitle').innerText =
            this.store.challengeSeed != null ? "⚔️ FRIEND'S CHALLENGE" : "DAILY COMPARISON";

        this.game.activeBenchmark = this.dailyLockedUnitKey;
        this.elements.benchmarkSelect.value = this.game.activeBenchmark;
        this.elements.benchmarkSelect.disabled = true;
        this.elements.dailyUnitBadge.classList.remove('hidden');
        document.getElementById('daily-banner-notice').classList.remove('hidden');

        const b = BENCHMARKS[this.game.activeBenchmark];
        document.getElementById('daily-banner-unit-name').innerText = b.title;

        this.loadDailyChampion();
    }

    loadDailyRoster() {
        const seed = this.store.getDailySeed();
        this.dailyLockedUnitKey = BENCHMARK_KEYS[seed % BENCHMARK_KEYS.length];
        this.dailyRoster = this.buildSeededRoster(seed);
    }

    /**
     * Builds a fully deterministic 5-champion roster from a seed, so everyone
     * playing the same day (or the same challenge link) gets the identical set.
     * Avoids repeats and the same size category back-to-back.
     */
    buildSeededRoster(seed) {
        const rng = mulberry32(seed);
        const roster = [];
        for (let i = 0; i < 5; i++) {
            let candidates = CHAMPIONS.filter(c => !roster.some(r => r.id === c.id));
            if (roster.length > 0) {
                const lastCat = ScaleUtils.getCategory(roster[roster.length - 1]);
                const diff = candidates.filter(c => ScaleUtils.getCategory(c) !== lastCat);
                if (diff.length > 0) candidates = diff;
            }
            roster.push(candidates[Math.floor(rng() * candidates.length)]);
        }
        return roster;
    }

    loadDailyChampion() {
        if (this.dailyIndex >= this.dailyRoster.length) {
            this.showDailyCompleteModal();
            return;
        }

        const champ = this.dailyRoster[this.dailyIndex];
        this.elements.targetName.innerText = champ.name;
        this.elements.progressText.innerText = `${this.dailyIndex + 1} / ${this.dailyRoster.length}`;

        this.elements.championImg.src = this.portraitUrl(champ.id);
        this.elements.championImg.onerror = () => {
            this.elements.championImg.src = `https://placehold.co/180x320/1e293b/06b6d4?text=${champ.name}`;
        };

        this.elements.slider.value = ScaleUtils.cmToSlider(BASELINE_HUMAN_CM);
        this.updateVisualScale(BASELINE_HUMAN_CM);
    }

    getCurrentChampion() {
        return this.dailyRoster[this.dailyIndex];
    }

    recordScore(accuracy, champ) {
        this.dailyScores.push({ accuracy, name: champ.name });
    }

    advance() {
        this.dailyIndex++;
        if (this.dailyIndex >= this.dailyRoster.length) {
            const sum = this.dailyScores.reduce((acc, s) => acc + s.accuracy, 0);
            const avg = sum / (this.dailyScores.length || 1);
            this.store.recordGamePlayed('daily', Math.round(avg));
            this.store.recordDailyAccuracy(avg);
            // Only a real (non-challenge) daily counts toward the day streak.
            if (this.store.challengeSeed == null) {
                this.store.recordDailyComplete();
                this.game.updateStreakDisplay();
            }
            this.showDailyCompleteModal();
        } else {
            this.loadDailyChampion();
        }
    }

    showDailyCompleteModal() {
        const modal = document.getElementById('daily-complete-modal');
        modal.classList.remove('hidden');

        const bench = BENCHMARKS[this.dailyLockedUnitKey];
        const isChallenge = this.store.challengeSeed != null;
        document.getElementById('daily-unit-summary').innerText = isChallenge
            ? `Challenge complete — scored on the ${bench.title} scale!`
            : `You evaluated today's champions using the ${bench.title} scale!`;

        const sum = this.dailyScores.reduce((acc, curr) => acc + curr.accuracy, 0);
        const avgScore = sum / (this.dailyScores.length || 1);
        document.getElementById('daily-total-score').innerText = `${avgScore.toFixed(1)}%`;

        const seed = this.store.getDailySeed();
        const grid = this.dailyScores
            .map(s => s.accuracy >= 80 ? '🟩' : s.accuracy >= 55 ? '🟨' : '🟥')
            .join('');
        const challengeUrl = `${location.origin}${location.pathname}?c=${seed}`;
        const streak = this.store.currentDayStreak();

        let shareText = `🏆 Scale of Legends — ${isChallenge ? 'Challenge' : 'Daily #' + (seed % 1000)}\n`;
        shareText += `${bench.title} scale · ${avgScore.toFixed(1)}% accuracy\n`;
        shareText += `${grid}\n`;
        if (!isChallenge && streak > 0) shareText += `🔥 ${streak}-day streak\n`;
        shareText += `\nBeat my score 👉 ${challengeUrl}`;

        this._shareText = shareText;
        document.getElementById('share-card-text').innerText = shareText;

        // "Play today's daily" only matters while on a shared challenge.
        const playTodayBtn = document.getElementById('play-today-btn');
        if (playTodayBtn) playTodayBtn.classList.toggle('hidden', !isChallenge);
    }

    shareResults() {
        this.game.shareResult(this._shareText || document.getElementById('share-card-text').innerText);
    }
}
