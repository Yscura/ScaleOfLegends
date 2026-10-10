import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';

const ORDER_BEST_KEY = 'sol_order_best';

/** Lineup challenge: swap 4 champions into shortest-to-tallest order. */
export class OrderMode extends BaseMode {
    constructor(game) {
        super(game);
        this.orderChamps = [];
        this.selectedOrderSlot = null;
        this.orderStreak = 0;
        this.locked = false;       // blocks input during a reveal/correction
        this.revealHeights = false; // show the height under each card
        this.wrongIds = null;       // champ ids that were in the wrong slot
    }

    get viewId() { return 'view-order-game'; }

    enter() {
        this.orderStreak = 0;
        document.getElementById('order-score').innerText = 0;
        this.updateBestDisplay();
        this.startOrderGame();
    }

    updateBestDisplay() {
        document.getElementById('order-best').innerText = this.store.getBestStreak(ORDER_BEST_KEY);
    }

    startOrderGame() {
        this.selectedOrderSlot = null;
        this.locked = false;
        this.revealHeights = false;
        this.wrongIds = null;

        const pool = [...CHAMPIONS];
        this.orderChamps = [];
        for (let i = 0; i < 4; i++) {
            const excludeList = this.orderChamps.map(c => c.id);
            const pick = this.store.selectDiverseChampion(pool, excludeList);
            this.orderChamps.push(pick);
        }
        this.orderChamps.sort(() => Math.random() - 0.5);
        this.renderOrderCards();
    }

    renderOrderCards() {
        const container = document.getElementById('order-cards-container');
        container.innerHTML = '';

        this.orderChamps.forEach((champ, idx) => {
            // Each grid cell = a fixed position label above a (swappable) card.
            const cell = document.createElement('div');
            cell.className = 'flex flex-col items-center gap-1.5';

            const pos = document.createElement('span');
            pos.className = 'text-[10px] font-mono text-[color:var(--sol-gold)] font-black tracking-widest';
            pos.textContent = `POS #${idx + 1}`;

            const isSelected = this.selectedOrderSlot === idx;
            const isWrong = this.wrongIds && this.wrongIds.has(champ.id);

            const card = document.createElement('div');
            card.dataset.champId = champ.id;
            let stateClass;
            if (isWrong) stateClass = 'order-card-wrong bg-slate-900';
            else if (isSelected) stateClass = 'bg-[var(--sol-panel)] border-[color:var(--sol-gold)] shadow-[0_0_15px_rgb(var(--sol-gold-rgb)_/_0.5)]';
            else stateClass = 'bg-slate-900 border-slate-700 hover:border-[color:rgb(var(--sol-gold-rgb)_/_0.6)]';

            card.className = `order-card w-full p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-colors ${stateClass}`;
            card.onclick = () => this.handleOrderCardClick(idx);

            const revealColor = isWrong ? 'text-red-300' : 'text-[color:var(--sol-gold)]';
            const revealHidden = this.revealHeights ? '' : 'hidden';
            card.innerHTML = `
                <div class="h-28 sm:h-32 w-full my-1 flex items-center justify-center">
                    <img src="${this.portraitUrl(champ.id)}" class="h-full object-contain rounded-lg drop-shadow" alt="${champ.name}">
                </div>
                <h4 class="text-xs font-black text-white mt-1 line-clamp-1">${champ.name}</h4>
                <span class="text-[10px] font-mono ${revealColor} ${revealHidden} mt-1">${ScaleUtils.formatHeight(champ.height, this.unitSystem)}</span>
            `;

            cell.appendChild(pos);
            cell.appendChild(card);
            container.appendChild(cell);
        });
    }

    handleOrderCardClick(index) {
        if (this.locked) return;
        this.audio.play('tick');
        if (this.selectedOrderSlot === null) {
            this.selectedOrderSlot = index;
            this.renderOrderCards();
        } else if (this.selectedOrderSlot === index) {
            this.selectedOrderSlot = null;
            this.renderOrderCards();
        } else {
            this.animateReorder(() => {
                const t = this.orderChamps[this.selectedOrderSlot];
                this.orderChamps[this.selectedOrderSlot] = this.orderChamps[index];
                this.orderChamps[index] = t;
                this.selectedOrderSlot = null;
            });
        }
    }

    /**
     * Applies `mutate()` to the lineup, re-renders, then slides every card that
     * moved from its old screen position to its new one (FLIP). Used for both a
     * manual swap and for sorting into the correct order after a wrong answer.
     */
    animateReorder(mutate) {
        const container = document.getElementById('order-cards-container');

        const oldRects = {};
        container.querySelectorAll('.order-card').forEach(card => {
            oldRects[card.dataset.champId] = card.getBoundingClientRect();
        });

        mutate();
        this.renderOrderCards();

        container.querySelectorAll('.order-card').forEach(card => {
            const oldR = oldRects[card.dataset.champId];
            if (!oldR) return;
            const newR = card.getBoundingClientRect();
            const dx = oldR.left - newR.left;
            const dy = oldR.top - newR.top;
            if (!dx && !dy) return;

            card.style.transition = 'none';
            card.style.transform = `translate(${dx}px, ${dy}px)`;
            card.style.zIndex = '20';
            requestAnimationFrame(() => {
                card.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
                card.style.transform = '';
            });
            card.addEventListener('transitionend', () => {
                card.style.transition = '';
                card.style.zIndex = '';
            }, { once: true });
        });
    }

    handleOrderSubmission() {
        if (this.locked) return;

        const correctOrder = [...this.orderChamps].sort((a, b) => a.height - b.height);
        const wrongIds = new Set();
        this.orderChamps.forEach((c, i) => {
            if (c.id !== correctOrder[i].id) wrongIds.add(c.id);
        });
        const isCorrect = wrongIds.size === 0;

        this.locked = true;
        this.revealHeights = true;
        this.selectedOrderSlot = null;

        const scoreEl = document.getElementById('order-score');

        if (isCorrect) {
            this.wrongIds = null;
            this.renderOrderCards();

            this.audio.play('success');
            this.orderStreak++;
            scoreEl.innerText = this.orderStreak;
            this.game.bumpScore(scoreEl);
            this.game.flashVerdict('PERFECT!', 'good');

            if (this.store.recordBestStreak(ORDER_BEST_KEY, this.orderStreak)) {
                this.updateBestDisplay();
                this.game.bumpScore(document.getElementById('order-best'));
            }

            setTimeout(() => this.startOrderGame(), 2200);
        } else {
            this.wrongIds = wrongIds;
            this.renderOrderCards(); // reveal heights + red-outline the misplaced cards

            this.audio.play('fail');
            this.game.flashVerdict('NOT QUITE', 'bad');
            const finalStreak = this.orderStreak;
            this.orderStreak = 0;
            scoreEl.innerText = 0;
            this.game.shakeScore(scoreEl);
            this.game.showInfo(finalStreak > 0
                ? `Not quite — the misplaced cards are outlined. Streak ended at ${finalStreak}.`
                : 'Not quite — the misplaced cards are outlined in red.');

            // Let the red outlines register, then slide everyone into the right order.
            setTimeout(() => this.animateReorder(() => { this.orderChamps = correctOrder; }), 1100);
            setTimeout(() => this.startOrderGame(), 3600);
        }
    }
}
