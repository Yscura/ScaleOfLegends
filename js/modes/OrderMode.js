import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { CHAMPIONS } from '../data/champions.js';

/** Lineup challenge: swap 4 champions into shortest-to-tallest order. */
export class OrderMode extends BaseMode {
    constructor(game) {
        super(game);
        this.orderChamps = [];
        this.selectedOrderSlot = null;
    }

    get viewId() { return 'view-order-game'; }

    enter() {
        this.startOrderGame();
    }

    startOrderGame() {
        this.selectedOrderSlot = null;
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
            const card = document.createElement('div');
            const isSelected = this.selectedOrderSlot === idx;

            card.className = `p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                isSelected ? 'bg-[var(--sol-panel)] border-[color:var(--sol-gold)] scale-105 shadow-[0_0_15px_rgb(var(--sol-gold-rgb)_/_0.5)]' : 'bg-slate-900 border-slate-700 hover:border-[color:rgb(var(--sol-gold-rgb)_/_0.6)]'
            }`;

            card.onclick = () => this.handleOrderCardClick(idx);

            card.innerHTML = `
                <span class="text-[10px] font-mono text-[color:var(--sol-gold)] font-bold mb-1">POS #${idx + 1}</span>
                <div class="h-32 w-full my-1 flex items-center justify-center">
                    <img src="${this.portraitUrl(champ.id)}" class="h-full object-contain rounded-lg drop-shadow" alt="${champ.name}">
                </div>
                <h4 class="text-xs font-black text-white mt-1 line-clamp-1">${champ.name}</h4>
                <span id="order-reveal-${idx}" class="text-[10px] font-mono text-[color:var(--sol-gold)] hidden mt-1">${ScaleUtils.formatHeight(champ.height, this.unitSystem)}</span>
            `;

            container.appendChild(card);
        });
    }

    handleOrderCardClick(index) {
        this.audio.play('tick');
        if (this.selectedOrderSlot === null) {
            this.selectedOrderSlot = index;
        } else if (this.selectedOrderSlot === index) {
            this.selectedOrderSlot = null;
        } else {
            const temp = this.orderChamps[this.selectedOrderSlot];
            this.orderChamps[this.selectedOrderSlot] = this.orderChamps[index];
            this.orderChamps[index] = temp;
            this.selectedOrderSlot = null;
        }
        this.renderOrderCards();
    }

    handleOrderSubmission() {
        let isCorrect = true;
        for (let i = 0; i < this.orderChamps.length - 1; i++) {
            if (this.orderChamps[i].height > this.orderChamps[i + 1].height) {
                isCorrect = false;
                break;
            }
        }

        this.orderChamps.forEach((_, idx) => {
            const el = document.getElementById(`order-reveal-${idx}`);
            if (el) el.classList.remove('hidden');
        });

        if (isCorrect) {
            this.audio.play('success');
            this.game.flashVerdict('PERFECT!', 'good');
            this.showToast("Perfect Order! You sorted all 4 champions correctly! 🎉", 'success');
            setTimeout(() => this.startOrderGame(), 2200);
        } else {
            this.audio.play('fail');
            this.game.flashVerdict('NOT QUITE', 'bad');
            this.showToast("Incorrect order! Check the revealed heights below.", 'error');
            setTimeout(() => this.startOrderGame(), 3000);
        }
    }
}
