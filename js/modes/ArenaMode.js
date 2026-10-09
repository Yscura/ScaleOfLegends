import { BaseMode } from './BaseMode.js';
import { ScaleUtils } from '../core/ScaleUtils.js';
import { BENCHMARKS } from '../data/benchmarks.js';

/**
 * Shared behaviour for the two modes that use the scaling arena view
 * (Daily and Sandbox). Subclasses supply the champion source, scoring, and
 * what happens on "next" via the hooks below.
 */
export class ArenaMode extends BaseMode {
    get viewId() { return 'view-scaling-arena'; }

    /** Daily hides exact units and shows relative comparisons instead. */
    get isDaily() { return false; }

    // --- Hooks for subclasses ---
    getCurrentChampion() { throw new Error('getCurrentChampion() not implemented'); }
    recordScore(/* accuracy, champ */) {}
    advance() {}

    // --- Shared control hooks ---
    onSliderInput() {
        const guessCm = ScaleUtils.sliderToCm(this.elements.slider.value);
        this.audio.play('tick');
        this.updateVisualScale(guessCm);
    }

    onUnitChange() {
        const guessCm = ScaleUtils.sliderToCm(this.elements.slider.value);
        this.updateVisualScale(guessCm);
    }

    onBenchmarkChange() {
        this.game.activeBenchmark = this.elements.benchmarkSelect.value;
        this.updateBenchmarkVisuals();
        const guessCm = ScaleUtils.sliderToCm(this.elements.slider.value);
        this.updateVisualScale(guessCm);
    }

    updateBenchmarkVisuals() {
        this.game.updateBenchmarkVisuals();
    }

    updateVisualScale(guessCm) {
        const b = BENCHMARKS[this.activeBenchmark];

        if (this.isDaily) {
            this.elements.liveGuessLabel.innerText = ScaleUtils.formatUnitCount(guessCm, this.activeBenchmark);
            this.elements.liveGuessUnitCount.innerText = "Relative Comparison";
        } else {
            this.elements.liveGuessLabel.innerText = ScaleUtils.formatHeight(guessCm, this.unitSystem);
            this.elements.liveGuessUnitCount.innerText = ScaleUtils.formatUnitCount(guessCm, this.activeBenchmark);
        }

        const bCm = b.height;
        const dynamicCeilingCm = Math.max(250, guessCm * 1.2, bCm * 1.2);

        if (this.isDaily) {
            this.elements.arenaCeilingText.innerText = "Arena Ceiling";
        } else {
            this.elements.arenaCeilingText.innerText = ScaleUtils.formatHeight(dynamicCeilingCm, this.unitSystem);
        }

        const baselinePct = (bCm / dynamicCeilingCm) * 100;
        const champPct = (guessCm / dynamicCeilingCm) * 100;

        this.elements.baselineVisual.style.height = `${baselinePct}%`;
        this.elements.championVisual.style.height = `${champPct}%`;
    }

    handleSubmission() {
        const guessCm = ScaleUtils.sliderToCm(this.elements.slider.value);
        const champ = this.getCurrentChampion();

        const actualCm = champ.height;
        const errorRatio = Math.abs(guessCm - actualCm) / actualCm;
        const accuracy = Math.max(0, 100 - (errorRatio * 100));

        this.recordScore(accuracy, champ);

        if (errorRatio <= 0.25) this.audio.play('success');
        else this.audio.play('fail');

        this.showResults(guessCm, actualCm, accuracy, errorRatio, champ);
    }

    showResults(guessCm, actualCm, accuracy, errorRatio, champ) {
        this.elements.resultsModal.classList.remove('hidden');

        document.getElementById('result-guess').innerText = ScaleUtils.formatHeight(guessCm, this.unitSystem);
        document.getElementById('result-guess-units').innerText = ScaleUtils.formatUnitCount(guessCm, this.activeBenchmark);

        document.getElementById('result-actual').innerText = ScaleUtils.formatHeight(actualCm, this.unitSystem);
        document.getElementById('result-actual-units').innerText = ScaleUtils.formatUnitCount(actualCm, this.activeBenchmark);

        document.getElementById('lore-fact-text').innerHTML = `<strong>[${(champ.region || 'Runeterra').toUpperCase()}]</strong> - ${champ.lore || "Formidable entity of Runeterra."}`;

        const titleEl = document.getElementById('result-title');
        const feedbackEl = document.getElementById('result-feedback');
        const glowEl = document.getElementById('result-glow');

        const bench = BENCHMARKS[this.activeBenchmark];
        const guessUnits = (guessCm / bench.height).toFixed(1);
        const actualUnits = (actualCm / bench.height).toFixed(1);

        if (errorRatio <= 0.20) {
            titleEl.innerText = "Spot on! 🎯";
            titleEl.className = "text-3xl font-black mb-1 relative z-10 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]";
            feedbackEl.innerText = `Accuracy: ${accuracy.toFixed(1)}% - Excellent ${bench.unitSingular} scale judgment! (${guessUnits} vs ${actualUnits} ${bench.unitPlural})`;
            glowEl.className = "absolute inset-0 opacity-20 transition-colors duration-500 pointer-events-none bg-green-500";
        } else if (errorRatio <= 0.45) {
            titleEl.innerText = "Close enough! 👍";
            titleEl.className = "text-3xl font-black mb-1 relative z-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
            feedbackEl.innerText = `Accuracy: ${accuracy.toFixed(1)}% - Guessed ${guessUnits} ${bench.unitPlural} (Actual: ${actualUnits} ${bench.unitPlural}).`;
            glowEl.className = "absolute inset-0 opacity-20 transition-colors duration-500 pointer-events-none bg-yellow-500";
        } else {
            titleEl.innerText = "Way off! 💥";
            titleEl.className = "text-3xl font-black mb-1 relative z-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
            const direction = guessCm > actualCm ? "too big" : "too small";
            feedbackEl.innerText = `Accuracy: ${Math.max(0, accuracy).toFixed(1)}% - You scaled them way ${direction}!`;
            glowEl.className = "absolute inset-0 opacity-20 transition-colors duration-500 pointer-events-none bg-red-500";
        }
    }

    handleNext() {
        this.elements.resultsModal.classList.add('hidden');
        this.advance();
    }
}
