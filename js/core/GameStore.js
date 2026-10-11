import { ScaleUtils } from './ScaleUtils.js';

export class GameStore {
    constructor() {
        this.recentPicks = [];
        // Set from a ?c=<seed> challenge link so the daily reproduces a shared puzzle.
        this.challengeSeed = null;
    }

    todayStr() {
        return new Date().toISOString().split('T')[0];
    }

    seedFromDate(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }

    /** Seed for the active daily — a shared challenge seed if present, else today. */
    getDailySeed() {
        return this.challengeSeed != null ? this.challengeSeed : this.seedFromDate(this.todayStr());
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

    // --- Consecutive-day streak (the "come back every day" hook) ---
    getLastDailyDate() {
        return localStorage.getItem('sol_last_daily') || null;
    }

    hasPlayedDailyToday() {
        return this.getLastDailyDate() === this.todayStr();
    }

    /** The day-streak as it stands right now — 0 if a day was missed. */
    currentDayStreak() {
        const last = this.getLastDailyDate();
        if (!last) return 0;
        const stored = parseInt(localStorage.getItem('sol_day_streak') || '0', 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        return (last === this.todayStr() || last === yesterday) ? stored : 0;
    }

    /** Records a completed real (non-challenge) daily and advances the streak. */
    recordDailyComplete() {
        const today = this.todayStr();
        const last = this.getLastDailyDate();
        if (last === today) return this.currentDayStreak(); // already counted today
        const stored = parseInt(localStorage.getItem('sol_day_streak') || '0', 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const streak = (last === yesterday) ? stored + 1 : 1;
        localStorage.setItem('sol_day_streak', String(streak));
        localStorage.setItem('sol_last_daily', today);
        return streak;
    }
}
