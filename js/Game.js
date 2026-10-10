import { AudioController } from './core/AudioController.js';
import { GameStore } from './core/GameStore.js';
import { ScaleUtils } from './core/ScaleUtils.js';
import { MIN_CM, MAX_CM } from './core/constants.js';
import { BENCHMARKS } from './data/benchmarks.js';
import { DailyMode } from './modes/DailyMode.js';
import { SandboxMode } from './modes/SandboxMode.js';
import { RegionMode } from './modes/RegionMode.js';
import { OrderMode } from './modes/OrderMode.js';
import { HigherLowerMode } from './modes/HigherLowerMode.js';

const VIEW_IDS = [
    'view-scaling-arena',
    'view-region-game',
    'view-order-game',
    'view-higher-lower',
    'daily-banner-notice'
];

const TAB_INACTIVE_CLASS = "mode-tab flex-1 min-w-[110px] py-2.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5";
const TAB_ACTIVE_CLASS = "mode-tab flex-1 min-w-[110px] py-2.5 px-2 rounded-lg bg-cyan-500 text-slate-950 font-black shadow-lg transition-all flex items-center justify-center gap-1.5";

/**
 * Top-level orchestrator. Owns shared services (audio, store), shared state
 * (current mode, unit system, active benchmark), cached DOM references, and
 * the registry of game modes. Routes DOM events to the currently active mode.
 */
export class ScaleOfLegendsGame {
    constructor() {
        this.audio = new AudioController();
        this.store = new GameStore();

        this.currentMode = 'daily';
        this.unitSystem = 'metric';
        this.activeBenchmark = 'banana';

        this.bindElements();

        this.modes = {
            daily: new DailyMode(this),
            sandbox: new SandboxMode(this),
            region: new RegionMode(this),
            order: new OrderMode(this),
            higherlower: new HigherLowerMode(this)
        };
        this.activeMode = this.modes.daily;

        this.attachEventListeners();
        this.updateStreakDisplay();
        this.switchMode('daily');
    }

    bindElements() {
        this.elements = {
            slider: document.getElementById('height-slider'),
            liveGuessLabel: document.getElementById('live-guess-label'),
            liveGuessUnitCount: document.getElementById('live-guess-unit-count'),
            championVisual: document.getElementById('champion-visual'),
            baselineVisual: document.getElementById('baseline-visual'),
            baselineHeightText: document.getElementById('baseline-height-text'),
            baselineTitle: document.getElementById('baseline-title'),
            arenaCeilingText: document.getElementById('arena-ceiling-text'),
            sliderMinLabel: document.getElementById('slider-min-label'),
            sliderMaxLabel: document.getElementById('slider-max-label'),
            championImg: document.getElementById('champion-img'),
            targetName: document.getElementById('target-name'),
            progressText: document.getElementById('progress-text'),
            submitBtn: document.getElementById('submit-btn'),
            nextBtn: document.getElementById('next-btn'),
            resultsModal: document.getElementById('results-modal'),
            unitToggleBtn: document.getElementById('unit-toggle-btn'),
            unitLabel: document.getElementById('unit-label'),
            audioToggleBtn: document.getElementById('audio-toggle-btn'),
            streakCounter: document.getElementById('streak-counter'),
            benchmarkSelect: document.getElementById('benchmark-select'),
            dailyUnitBadge: document.getElementById('daily-unit-badge'),
            toastContainer: document.getElementById('toast-container'),
            verdictStamp: document.getElementById('verdict-stamp')
        };
    }

    attachEventListeners() {
        this.elements.slider.addEventListener('input', () => this.activeMode.onSliderInput());

        this.elements.unitToggleBtn.addEventListener('click', () => this.handleUnitToggle());

        this.elements.audioToggleBtn.addEventListener('click', () => {
            const isMuted = this.audio.toggleMute();
            document.getElementById('audio-icon').innerText = isMuted ? '🔇' : '🔊';
        });

        this.elements.benchmarkSelect.addEventListener('change', () => this.activeMode.onBenchmarkChange());

        this.elements.submitBtn.addEventListener('click', () => this.activeMode.handleSubmission());
        this.elements.nextBtn.addEventListener('click', () => this.activeMode.handleNext());

        document.getElementById('order-submit-btn').addEventListener('click', () => this.modes.order.handleOrderSubmission());
        document.getElementById('hl-btn-higher').addEventListener('click', () => this.modes.higherlower.handleHigherLowerGuess(true));
        document.getElementById('hl-btn-lower').addEventListener('click', () => this.modes.higherlower.handleHigherLowerGuess(false));

        // Map Pin Region Clicks + outline cross-highlighting
        const regionTargets = document.querySelectorAll('#view-region-game [data-region]');
        const setRegionActive = (region, active) => {
            document.querySelectorAll(`#view-region-game [data-region="${region}"]`)
                .forEach(el => el.classList.toggle('region-active', active));
        };
        regionTargets.forEach(el => {
            const region = el.getAttribute('data-region');
            el.addEventListener('mouseenter', () => setRegionActive(region, true));
            el.addEventListener('mouseleave', () => setRegionActive(region, false));
            el.addEventListener('click', () => this.modes.region.handleRegionGuess(region));
        });

        document.getElementById('copy-share-btn').addEventListener('click', () => this.modes.daily.copyShareCard());
        document.getElementById('close-daily-btn').addEventListener('click', () => {
            document.getElementById('daily-complete-modal').classList.add('hidden');
        });

        const tabs = ['daily', 'region', 'order', 'higherlower', 'sandbox'];
        tabs.forEach(mode => {
            const tabBtn = document.getElementById(`tab-${mode}`);
            if (tabBtn) {
                tabBtn.addEventListener('click', () => this.switchMode(mode));
            }
        });
    }

    handleUnitToggle() {
        this.unitSystem = (this.unitSystem === 'metric') ? 'imperial' : 'metric';
        this.elements.unitLabel.innerText = this.unitSystem === 'metric' ? 'Metric (m)' : 'Imperial (ft)';
        this.updateUnitLabels();
        this.activeMode.onUnitChange();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        let bgClass = 'bg-slate-800 border-slate-600 text-white';
        if (type === 'error') bgClass = 'bg-red-950 border-red-500 text-red-200';
        if (type === 'success') bgClass = 'bg-green-950 border-green-500 text-green-200';

        toast.className = `toast-enter px-4 py-2.5 rounded-xl border text-xs font-bold shadow-2xl flex items-center gap-2 ${bgClass}`;
        toast.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span> ${message}`;

        this.elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Flashes a big central verdict stamp (e.g. "CORRECT +1" / "WRONG") so the
     * player gets an unmistakable, deliberate beat on whether they were right.
     * `tone` controls colour: 'good' | 'bad' | 'hot'.
     */
    flashVerdict(label, tone = 'good') {
        const el = this.elements.verdictStamp;
        if (!el) return;
        el.textContent = label;
        el.className = `verdict-stamp verdict-${tone}`;
        // Force a reflow so the animation restarts on rapid successive calls.
        void el.offsetWidth;
        el.classList.add('verdict-show');
        clearTimeout(this._verdictTimer);
        this._verdictTimer = setTimeout(() => el.classList.remove('verdict-show'), 1150);
    }

    /** Briefly shakes an element (used on a wrong answer). */
    shake(el) {
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
    }

    /**
     * Animates `el`'s text from `from` to `to` over `duration` ms, running each
     * intermediate value through `format`. Used for the height count-up reveal.
     */
    animateCount(el, from, to, duration, format) {
        if (!el) return;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = format(from + (to - from) * eased);
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.activeMode = this.modes[mode];

        document.querySelectorAll('.mode-tab').forEach(btn => {
            btn.className = TAB_INACTIVE_CLASS;
        });
        const activeTab = document.getElementById(`tab-${mode}`);
        if (activeTab) {
            activeTab.className = TAB_ACTIVE_CLASS;
        }

        VIEW_IDS.forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(this.activeMode.viewId).classList.remove('hidden');

        this.activeMode.enter();

        this.updateBenchmarkVisuals();
        this.updateUnitLabels();
    }

    updateBenchmarkVisuals() {
        const b = BENCHMARKS[this.activeBenchmark];
        this.elements.baselineTitle.innerText = b.title;

        const container = document.getElementById('benchmark-svg-container');
        container.innerHTML = b.svg;

        this.updateUnitLabels();
    }

    updateUnitLabels() {
        const b = BENCHMARKS[this.activeBenchmark];
        if (this.currentMode === 'daily') {
            this.elements.baselineHeightText.innerText = "Daily Reference Unit";
            this.elements.sliderMinLabel.innerText = `0.1× ${b.unitSingular}`;
            this.elements.sliderMaxLabel.innerText = `500× ${b.unitSingular}`;
            this.elements.arenaCeilingText.innerText = "Arena Ceiling";
            this.elements.unitToggleBtn.classList.add('hidden');
        } else {
            this.elements.baselineHeightText.innerText = ScaleUtils.formatHeight(b.height, this.unitSystem);
            this.elements.sliderMinLabel.innerText = ScaleUtils.formatHeight(MIN_CM, this.unitSystem);
            this.elements.sliderMaxLabel.innerText = ScaleUtils.formatHeight(MAX_CM, this.unitSystem);
            this.elements.unitToggleBtn.classList.remove('hidden');
        }
    }

    updateStreakDisplay() {
        const streak = this.store.getStreak();
        this.elements.streakCounter.innerText = `🔥 ${streak}`;
    }
}
