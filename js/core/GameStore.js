import { ScaleUtils } from './ScaleUtils.js';

export class GameStore {
    constructor() {
        this.recentPicks = [];
    }

    getDailySeed() {
        const today = new Date().toISOString().split('T')[0];
        let hash = 0;
        for (let i = 0; i < today.length; i++) {
            hash = today.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }

    recordPick(champ) {
        this.recentPicks.push(champ);
        if (this.recentPicks.length > 5) this.recentPicks.shift();
    }

    selectDiverseChampion(pool, excludeIds = []) {
        const recentIds = this.recentPicks.map(c => c.id);

        // Prefer champions that are neither explicitly excluded nor seen in the
        // last few picks, so the same champion can't reappear too soon. Fall
        // back gracefully when the pool is too small to honor that.
        let available = pool.filter(c => !excludeIds.includes(c.id) && !recentIds.includes(c.id));
        if (available.length === 0) available = pool.filter(c => !excludeIds.includes(c.id));
        if (available.length === 0) available = pool.slice();

        // Among those, also avoid repeating the last size category when possible.
        let candidates = available;
        if (this.recentPicks.length > 0) {
            const lastCat = ScaleUtils.getCategory(this.recentPicks[this.recentPicks.length - 1]);
            const differentCat = available.filter(c => ScaleUtils.getCategory(c) !== lastCat);
            if (differentCat.length > 0) candidates = differentCat;
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        this.recordPick(selected);
        return selected;
    }

    /** Per-mode best-streak records, keyed by an arbitrary storage key. */
    getBestStreak(key) {
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    /** Persists `value` as the new best for `key` only if it beats the record. */
    recordBestStreak(key, value) {
        if (value > this.getBestStreak(key)) {
            localStorage.setItem(key, value.toString());
            return true;
        }
        return false;
    }

    getStreak() {
        return parseInt(localStorage.getItem('scaleoflegends_streak') || '0', 10);
    }

    incrementStreak() {
        const current = this.getStreak() + 1;
        localStorage.setItem('scaleoflegends_streak', current.toString());
        return current;
    }
}
