import { ArenaMode } from './ArenaMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';
import { BASELINE_HUMAN_CM } from '../core/constants.js';

/** Free practice: a random champion with a selectable benchmark and unit system. */
export class SandboxMode extends ArenaMode {
    constructor(game) {
        super(game);
        this.currentChamp = null;
    }

    enter() {
        document.getElementById('mode-subtitle').innerText = "FREE PRACTICE / SANDBOX";

        this.elements.benchmarkSelect.disabled = false;
        this.elements.dailyUnitBadge.classList.add('hidden');

        this.loadRandomChampion();
    }

    loadRandomChampion() {
        const champ = this.store.selectDiverseChampion(CHAMPIONS);
        this.currentChamp = champ;
        this.elements.targetName.innerText = champ.name;
        this.elements.progressText.innerText = "PRACTICE";
        this.elements.championImg.src = this.portraitUrl(champ.id);

        this.elements.slider.value = ScaleUtils.cmToSlider(BASELINE_HUMAN_CM);
        this.updateVisualScale(BASELINE_HUMAN_CM);
    }

    getCurrentChampion() {
        return this.currentChamp || CHAMPIONS[0];
    }

    advance() {
        this.loadRandomChampion();
    }
}
