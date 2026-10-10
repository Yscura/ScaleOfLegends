import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';

const HL_BEST_KEY = 'sol_hl_best';

/** Streak mode: guess whether the target champion is taller or shorter. */
export class HigherLowerMode extends BaseMode {
    constructor(game) {
        super(game);
        this.hlLeftChamp = null;
        this.hlRightChamp = null;
        this.hlStreak = 0;
        // Guards against double-guessing while a reveal animation is playing.
        this.locked = false;
    }

    get viewId() { return 'view-higher-lower'; }

    enter() {
        this.updateBestDisplay();
        this.startHigherLowerGame();
    }

    onUnitChange() {
        if (this.hlLeftChamp) {
            document.getElementById('hl-left-height').innerText =
                ScaleUtils.formatHeight(this.hlLeftChamp.height, this.unitSystem);
        }
    }

    updateBestDisplay() {
        document.getElementById('hl-best').innerText = this.store.getBestStreak(HL_BEST_KEY);
    }

    startHigherLowerGame() {
        this.hlStreak = 0;
        document.getElementById('hl-score').innerText = this.hlStreak;

        this.hlLeftChamp = this.store.selectDiverseChampion(CHAMPIONS);
        this.hlRightChamp = this.store.selectDiverseChampion(CHAMPIONS, [this.hlLeftChamp.id]);

        this.resetRoundView();
    }

    /** Advance after a correct guess: the target becomes the new reference. */
    nextRound() {
        this.hlLeftChamp = this.hlRightChamp;
        this.hlRightChamp = this.store.selectDiverseChampion(CHAMPIONS, [this.hlLeftChamp.id]);
        this.resetRoundView();
    }

    resetRoundView() {
        this.locked = false;

        document.getElementById('hl-left-name').innerText = this.hlLeftChamp.name;
        document.getElementById('hl-left-img').src = this.portraitUrl(this.hlLeftChamp.id);
        document.getElementById('hl-left-height').innerText =
            ScaleUtils.formatHeight(this.hlLeftChamp.height, this.unitSystem);

        document.getElementById('hl-right-name').innerText = this.hlRightChamp.name;
        document.getElementById('hl-right-img').src = this.portraitUrl(this.hlRightChamp.id);

        // Equal, neutral portrait sizes while guessing so the answer isn't given away.
        document.getElementById('hl-left-img').style.height = '100%';
        document.getElementById('hl-right-img').style.height = '100%';

        document.getElementById('hl-left-card').classList.remove('hl-card-correct', 'hl-card-wrong');
        document.getElementById('hl-right-card').classList.remove('hl-card-correct', 'hl-card-wrong');

        document.getElementById('hl-actions').classList.remove('hidden');
        document.getElementById('hl-result-reveal').classList.add('hidden');
    }

    /** Scale both portraits to their true relative heights on the ground line. */
    revealFaceOff() {
        const l = this.hlLeftChamp.height;
        const r = this.hlRightChamp.height;
        const max = Math.max(l, r);
        // Floor at 14% so an extreme mismatch still leaves the shorter one visible.
        const pct = (h) => `${Math.max(14, (h / max) * 100)}%`;
        document.getElementById('hl-left-img').style.height = pct(l);
        document.getElementById('hl-right-img').style.height = pct(r);
    }

    handleHigherLowerGuess(guessedHigher) {
        if (this.locked) return;
        this.locked = true;

        const isHigher = this.hlRightChamp.height >= this.hlLeftChamp.height;
        const isCorrect = (guessedHigher && isHigher) || (!guessedHigher && !isHigher);

        document.getElementById('hl-actions').classList.add('hidden');

        // Count the revealed height up from the reference so the gap is felt.
        const revealBox = document.getElementById('hl-result-reveal');
        revealBox.classList.remove('hidden');
        this.game.animateCount(revealBox, this.hlLeftChamp.height, this.hlRightChamp.height, 900,
            (cm) => ScaleUtils.formatHeight(cm, this.unitSystem));

        this.revealFaceOff();

        const rightCard = document.getElementById('hl-right-card');

        if (isCorrect) {
            this.audio.play('success');
            this.hlStreak++;
            document.getElementById('hl-score').innerText = this.hlStreak;
            rightCard.classList.add('hl-card-correct');

            const isMilestone = this.hlStreak % 5 === 0;
            if (isMilestone) {
                this.game.flashVerdict(`🔥 ${this.hlStreak} STREAK!`, 'hot');
            } else {
                this.game.flashVerdict('CORRECT +1', 'good');
            }

            if (this.store.recordBestStreak(HL_BEST_KEY, this.hlStreak)) {
                this.updateBestDisplay();
            }

            setTimeout(() => this.nextRound(), isMilestone ? 2000 : 1700);
        } else {
            this.audio.play('fail');
            rightCard.classList.add('hl-card-wrong');
            this.game.shake(rightCard);
            this.game.flashVerdict('WRONG', 'bad');

            this.store.recordBestStreak(HL_BEST_KEY, this.hlStreak);
            this.updateBestDisplay();

            const finalStreak = this.hlStreak;
            setTimeout(() => {
                this.showToast(`${this.hlRightChamp.name} is ${ScaleUtils.formatHeight(this.hlRightChamp.height, this.unitSystem)}. Final streak: ${finalStreak}`, 'error');
                this.startHigherLowerGame();
            }, 2400);
        }
    }
}
