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
        const available = pool.filter(c => !excludeIds.includes(c.id));
        if (available.length === 0) {
            return pool[Math.floor(Math.random() * pool.length)];
        }

        if (this.recentPicks.length === 0) {
            const picked = available[Math.floor(Math.random() * available.length)];
            this.recordPick(picked);
            return picked;
        }

        const lastCat = ScaleUtils.getCategory(this.recentPicks[this.recentPicks.length - 1]);
        let candidates = available.filter(c => ScaleUtils.getCategory(c) !== lastCat);
        if (candidates.length === 0) candidates = available;

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        this.recordPick(selected);
        return selected;
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
