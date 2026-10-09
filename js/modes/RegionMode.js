import { BaseMode } from './BaseMode.js';
import { CHAMPIONS } from '../data/champions.js';

/** Origin challenge: click a champion's home region on the map of Runeterra. */
export class RegionMode extends BaseMode {
    constructor(game) {
        super(game);
        this.regionTargetChamp = null;
        this.regionStreak = 0;
        // Only champions whose region has a clickable pin can be answered, so
        // restrict the target pool to those. Regions are read from the pins
        // themselves to stay in sync with the map markup.
        this.validRegions = this.collectValidRegions();
        this.regionPool = CHAMPIONS.filter(c => this.validRegions.has(c.region));
    }

    get viewId() { return 'view-region-game'; }

    collectValidRegions() {
        const regions = new Set();
        document.querySelectorAll('#view-region-game .map-pin').forEach(btn => {
            const region = btn.getAttribute('data-region');
            if (region) regions.add(region);
        });
        return regions;
    }

    enter() {
        this.startRegionGame();
    }

    startRegionGame() {
        this.regionTargetChamp = this.store.selectDiverseChampion(this.regionPool);
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
