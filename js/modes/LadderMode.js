import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';

const LADDER_BEST_KEY = 'sol_ladder_best';

/**
 * Scale Ladder: a run where each champion must be slotted into a height-sorted
 * ladder (shortest at top). The ladder grows every round, so the gaps get finer
 * and the task gets harder the longer your streak runs. One wrong slot ends it.
 */
export class LadderMode extends BaseMode {
    constructor(game) {
        super(game);
        this.ladder = [];
        this.current = null;
        this.score = 0;
        this.locked = false;
        // {index, type} for the card to flash after an insert; cleared on next render.
        this.flash = null;
    }

    get viewId() { return 'view-ladder'; }

    enter() {
        this.updateBestDisplay();
        this.startRun();
    }

    onUnitChange() {
        if (this.ladder.length) this.renderLadder();
    }

    updateBestDisplay() {
        document.getElementById('ladder-best').innerText = this.store.getBestStreak(LADDER_BEST_KEY);
    }

    /** Pick a champion with a height no ladder member shares (keeps slots unambiguous). */
    pickChamp() {
        const usedHeights = new Set(this.ladder.map(c => c.height));
        const excludeIds = this.ladder.map(c => c.id);
        let pool = CHAMPIONS.filter(c => !usedHeights.has(c.height) && !excludeIds.includes(c.id));
        if (pool.length === 0) pool = CHAMPIONS.filter(c => !excludeIds.includes(c.id));
        return this.store.selectDiverseChampion(pool, excludeIds);
    }

    startRun() {
        this.score = 0;
        this.locked = false;
        this.flash = null;
        this.ladder = [];

        // Seed with two champions so the first placement already has three slots.
        this.ladder.push(this.pickChamp());
        this.ladder.push(this.pickChamp());
        this.ladder.sort((a, b) => a.height - b.height);

        this.current = this.pickChamp();

        document.getElementById('ladder-score').innerText = this.score;
        this.renderCurrent();
        this.renderLadder();
    }

    renderCurrent() {
        document.getElementById('ladder-champ-name').innerText = this.current.name;
        document.getElementById('ladder-champ-title').innerText = this.current.name;
        document.getElementById('ladder-champ-img').src = this.portraitUrl(this.current.id);
    }

    renderLadder() {
        const container = document.getElementById('ladder-container');
        container.innerHTML = '';

        container.appendChild(this.buildGap(0, 'Shortest'));
        this.ladder.forEach((champ, i) => {
            container.appendChild(this.buildCard(champ, i));
            container.appendChild(this.buildGap(i + 1, i + 1 === this.ladder.length ? 'Tallest' : null));
        });
    }

    buildGap(slot, label) {
        const gap = document.createElement('button');
        gap.className = 'ladder-gap';
        gap.innerHTML = `<span class="ladder-gap-line"></span><span class="ladder-gap-label">+ ${label || 'insert here'}</span><span class="ladder-gap-line"></span>`;
        if (this.locked) gap.disabled = true;
        gap.addEventListener('click', () => this.handleInsert(slot));
        return gap;
    }

    buildCard(champ, index) {
        const card = document.createElement('div');
        let flashClass = '';
        if (this.flash && this.flash.index === index) {
            flashClass = this.flash.type === 'good' ? 'ladder-card-correct' : 'ladder-card-wrong';
        }
        card.className = `ladder-card ${flashClass}`;
        card.innerHTML = `
            <img src="${this.portraitUrl(champ.id)}" class="ladder-card-img" alt="${champ.name}">
            <span class="ladder-card-name">${champ.name}</span>
            <span class="ladder-card-height">${ScaleUtils.formatHeight(champ.height, this.unitSystem)}</span>
        `;
        return card;
    }

    handleInsert(slot) {
        if (this.locked) return;
        this.locked = true;

        const correctSlot = this.ladder.filter(c => c.height < this.current.height).length;
        const isCorrect = slot === correctSlot;

        // Always insert at the correct slot so the ladder stays sorted/valid.
        this.ladder.splice(correctSlot, 0, this.current);
        this.flash = { index: correctSlot, type: isCorrect ? 'good' : 'bad' };
        this.renderLadder();

        // Scroll the freshly placed card into view.
        const container = document.getElementById('ladder-container');
        const placed = container.querySelector('.ladder-card-correct, .ladder-card-wrong');
        if (placed) placed.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        if (isCorrect) {
            this.audio.play('success');
            this.score++;
            document.getElementById('ladder-score').innerText = this.score;

            if (this.score % 5 === 0) this.game.flashVerdict(`🔥 ${this.score} PLACED!`, 'hot');
            if (this.store.recordBestStreak(LADDER_BEST_KEY, this.score)) this.updateBestDisplay();

            setTimeout(() => {
                this.flash = null;
                this.current = this.pickChamp();
                this.locked = false;
                this.renderCurrent();
                this.renderLadder();
            }, 700);
        } else {
            this.audio.play('fail');
            this.game.flashVerdict('WRONG SLOT', 'bad');
            this.store.recordBestStreak(LADDER_BEST_KEY, this.score);
            this.updateBestDisplay();
            const finalScore = this.score;
            setTimeout(() => {
                this.showToast(`Wrong slot! You placed ${finalScore}. New ladder!`, 'error');
                this.startRun();
            }, 2400);
        }
    }
}
