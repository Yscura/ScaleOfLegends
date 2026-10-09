import { ArenaMode } from './ArenaMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { BENCHMARKS, BENCHMARK_KEYS } from '../data/benchmarks.js';
import { CHAMPIONS } from '../data/champions.js';
import { BASELINE_HUMAN_CM } from '../core/constants.js';

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
        document.getElementById('mode-subtitle').innerText = "DAILY COMPARISON";

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

        const pool = [...CHAMPIONS];
        this.dailyRoster = [];

        const firstIdx = seed % pool.length;
        const firstChamp = pool[firstIdx];
        this.dailyRoster.push(firstChamp);
        this.store.recordPick(firstChamp);

        for (let i = 1; i < 5; i++) {
            const excludeList = this.dailyRoster.map(c => c.id);
            const picked = this.store.selectDiverseChampion(pool, excludeList);
            this.dailyRoster.push(picked);
        }
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
            this.store.incrementStreak();
            this.game.updateStreakDisplay();
            this.showDailyCompleteModal();
        } else {
            this.loadDailyChampion();
        }
    }

    showDailyCompleteModal() {
        const modal = document.getElementById('daily-complete-modal');
        modal.classList.remove('hidden');

        const bench = BENCHMARKS[this.dailyLockedUnitKey];
        document.getElementById('daily-unit-summary').innerText = `You evaluated today's champions using the ${bench.title} unit scale!`;

        const sum = this.dailyScores.reduce((acc, curr) => acc + curr.accuracy, 0);
        const avgScore = sum / (this.dailyScores.length || 1);
        document.getElementById('daily-total-score').innerText = `${avgScore.toFixed(1)}%`;

        const dateStr = new Date().toISOString().split('T')[0];
        const unitEmoji = bench.title.split(' ')[0];
        let shareText = `Scale of Legends #${this.store.getDailySeed() % 1000} ${unitEmoji} (${dateStr})\n`;
        shareText += `Unit: ${bench.title}\n`;
        shareText += `Accuracy: ${avgScore.toFixed(1)}% 🎯\n\n`;

        this.dailyScores.forEach(s => {
            if (s.accuracy >= 80) shareText += "🟩 ";
            else if (s.accuracy >= 55) shareText += "🟨 ";
            else shareText += "🟥 ";
        });
        shareText += "\nPlay now at scaleoflegends.com!";

        document.getElementById('share-card-text').innerText = shareText;
    }

    copyShareCard() {
        const text = document.getElementById('share-card-text').innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast("Results copied to clipboard! Share on Discord!", 'success');
        }).catch(() => {
            this.showToast("Results copied to clipboard!", 'success');
        });
    }
}
