import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';

/** Streak mode: guess whether the target champion is taller or shorter. */
export class HigherLowerMode extends BaseMode {
    constructor(game) {
        super(game);
        this.hlLeftChamp = null;
        this.hlRightChamp = null;
        this.hlStreak = 0;
    }

    get viewId() { return 'view-higher-lower'; }

    enter() {
        this.startHigherLowerGame();
    }

    onUnitChange() {
        if (this.hlLeftChamp) this.updateHigherLowerView();
    }

    startHigherLowerGame() {
        this.hlStreak = 0;
        document.getElementById('hl-score').innerText = this.hlStreak;

        this.hlLeftChamp = CHAMPIONS[Math.floor(Math.random() * CHAMPIONS.length)];
        this.hlRightChamp = this.store.selectDiverseChampion(CHAMPIONS, [this.hlLeftChamp.id]);

        this.updateHigherLowerView();
    }

    updateHigherLowerView() {
        document.getElementById('hl-left-name').innerText = this.hlLeftChamp.name;
        document.getElementById('hl-left-img').src = this.portraitUrl(this.hlLeftChamp.id);
        document.getElementById('hl-left-height').innerText = ScaleUtils.formatHeight(this.hlLeftChamp.height, this.unitSystem);

        document.getElementById('hl-right-name').innerText = this.hlRightChamp.name;
        document.getElementById('hl-right-img').src = this.portraitUrl(this.hlRightChamp.id);

        document.getElementById('hl-actions').classList.remove('hidden');
        document.getElementById('hl-result-reveal').classList.add('hidden');
    }

    handleHigherLowerGuess(guessedHigher) {
        const isHigher = this.hlRightChamp.height >= this.hlLeftChamp.height;
        const isCorrect = (guessedHigher && isHigher) || (!guessedHigher && !isHigher);

        document.getElementById('hl-actions').classList.add('hidden');
        const revealBox = document.getElementById('hl-result-reveal');
        revealBox.innerText = ScaleUtils.formatHeight(this.hlRightChamp.height, this.unitSystem);
        revealBox.classList.remove('hidden');

        if (isCorrect) {
            this.audio.play('success');
            this.hlStreak++;
            document.getElementById('hl-score').innerText = this.hlStreak;
            setTimeout(() => {
                this.hlLeftChamp = this.hlRightChamp;
                this.hlRightChamp = this.store.selectDiverseChampion(CHAMPIONS, [this.hlLeftChamp.id]);
                this.updateHigherLowerView();
            }, 1200);
        } else {
            this.audio.play('fail');
            setTimeout(() => {
                this.showToast(`Wrong! ${this.hlRightChamp.name} is ${ScaleUtils.formatHeight(this.hlRightChamp.height, this.unitSystem)}. Final Streak: ${this.hlStreak}`, 'error');
                this.startHigherLowerGame();
            }, 1200);
        }
    }
}
