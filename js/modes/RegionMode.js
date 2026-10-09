import { BaseMode } from './BaseMode.js';
import { CHAMPIONS } from '../data/champions.js';

/** Origin challenge: click a champion's home region on the map of Runeterra. */
export class RegionMode extends BaseMode {
    constructor(game) {
        super(game);
        this.regionTargetChamp = null;
        this.regionStreak = 0;
    }

    get viewId() { return 'view-region-game'; }

    enter() {
        this.startRegionGame();
    }

    startRegionGame() {
        this.regionTargetChamp = this.store.selectDiverseChampion(CHAMPIONS);
        document.getElementById('region-target-name').innerText = this.regionTargetChamp.name;
        document.getElementById('region-target-card-name').innerText = this.regionTargetChamp.name;
        document.getElementById('region-target-img').src = this.portraitUrl(this.regionTargetChamp.id);
    }

    handleRegionGuess(clickedRegion) {
        const targetRegion = this.regionTargetChamp.region || 'runeterra';

        if (clickedRegion === targetRegion) {
            this.audio.play('success');
            this.regionStreak++;
            document.getElementById('region-score').innerText = this.regionStreak;
            this.showToast(`Correct! ${this.regionTargetChamp.name} hails from ${targetRegion.replace('_', ' ').toUpperCase()}! 🎉`, 'success');
            setTimeout(() => this.startRegionGame(), 1200);
        } else {
            this.audio.play('fail');
            this.showToast(`Wrong region! ${this.regionTargetChamp.name} is actually from ${targetRegion.replace('_', ' ').toUpperCase()}! Final streak: ${this.regionStreak}`, 'error');
            this.regionStreak = 0;
            document.getElementById('region-score').innerText = 0;
            setTimeout(() => this.startRegionGame(), 2000);
        }
    }
}
