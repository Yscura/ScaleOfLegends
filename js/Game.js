import { AudioController } from './core/AudioController.js';
import { GameStore } from './core/GameStore.js';
import { ScaleUtils } from './core/ScaleUtils.js';
import { MIN_CM, MAX_CM } from './core/constants.js';
import { BENCHMARKS } from './data/benchmarks.js';
import { ICONS } from './data/icons.js';
import { MODES } from './data/modes.js';
import { DailyMode } from './modes/DailyMode.js';
import { SandboxMode } from './modes/SandboxMode.js';
import { RegionMode } from './modes/RegionMode.js';
import { OrderMode } from './modes/OrderMode.js';
import { HigherLowerMode } from './modes/HigherLowerMode.js';
import { PriceMode } from './modes/PriceMode.js';
import { LadderMode } from './modes/LadderMode.js';

const VIEW_IDS = [
    'view-home',
    'view-scaling-arena',
    'view-region-game',
    'view-order-game',
    'view-higher-lower',
    'view-price',
    'view-ladder',
    'daily-banner-notice'
];

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
            higherlower: new HigherLowerMode(this),
            price: new PriceMode(this),
            ladder: new LadderMode(this)
        };
        this.activeMode = this.modes.daily;

        this.attachEventListeners();
        this.buildModeBar();
        this.buildHomePage();
        this.applyLogo();
        this.updateStreakDisplay();
        this.showHome();
    }

    /**
     * Fills `container` with a mode's icon: the assigned image (data/icons.js)
     * if present, otherwise the emoji. A broken image path falls back to the
     * emoji too, so assigning icons never breaks the UI.
     */
    fillIcon(container, src, emoji, imgClass) {
        container.textContent = '';
        if (src) {
            const img = document.createElement('img');
            img.className = imgClass;
            img.alt = '';
            img.onerror = () => { container.textContent = emoji; };
            container.appendChild(img);
            img.src = src;
        } else {
            container.textContent = emoji;
        }
    }

    /** Swaps the title text for the logo image when one is assigned. */
    applyLogo() {
        if (!ICONS.logo) return;
        const title = document.getElementById('app-title');
        if (!title) return;
        const fallback = title.textContent.trim();
        // Drop the text drop-shadow — on a rectangular image it renders as a
        // boxy halo around the whole logo.
        title.classList.remove('drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]');
        const img = document.createElement('img');
        img.className = 'app-logo';
        img.alt = fallback;
        img.onerror = () => { title.textContent = fallback; };
        title.textContent = '';
        title.appendChild(img);
        img.src = ICONS.logo;
    }

    /** Builds the icon-only mode bar; hovering an icon reveals its name. */
    buildModeBar() {
        const bar = document.getElementById('mode-bar');
        bar.innerHTML = '';
        MODES.forEach(m => {
            const btn = document.createElement('button');
            btn.id = `tab-${m.id}`;
            btn.className = 'mode-tab';
            btn.setAttribute('data-tooltip', m.name);
            btn.setAttribute('aria-label', m.name);
            this.fillIcon(btn, ICONS.modes[m.id], m.emoji, 'mode-tab-icon-img');
            btn.addEventListener('click', () => this.switchMode(m.id));
            bar.appendChild(btn);
        });
    }

    /** Builds the home page list of modes (icon + name + tagline). */
    buildHomePage() {
        const list = document.getElementById('home-mode-list');
        list.innerHTML = '';
        MODES.forEach(m => {
            const card = document.createElement('button');
            card.className = 'home-mode';
            card.innerHTML =
                `<span class="home-mode-icon"></span>` +
                `<span class="home-mode-text">` +
                `<span class="home-mode-name"></span>` +
                `<span class="home-mode-tagline"></span>` +
                `</span>`;
            card.querySelector('.home-mode-name').textContent = m.name;
            card.querySelector('.home-mode-tagline').textContent = m.tagline;
            this.fillIcon(card.querySelector('.home-mode-icon'), ICONS.modes[m.id], m.emoji, 'home-mode-icon-img');
            card.addEventListener('click', () => this.switchMode(m.id));
            list.appendChild(card);
        });
    }

    /** Shows the home page and clears the active-mode highlight. */
    showHome() {
        this.currentMode = 'home';
        document.body.classList.add('is-home');
        this.clearInfo();
        document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
        VIEW_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        document.getElementById('view-home').classList.remove('hidden');
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
            verdictStamp: document.getElementById('verdict-stamp'),
            infoBar: document.getElementById('info-bar')
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

        document.getElementById('price-slider').addEventListener('input', () => this.modes.price.onSliderInput());
        document.getElementById('price-lock-btn').addEventListener('click', () => this.modes.price.lockIn());

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

        // Logo acts as a home button; mode-tab clicks are wired in buildModeBar().
        document.getElementById('app-title').addEventListener('click', () => this.showHome());
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

    /** Pops a score/streak number larger for a beat when it increases. */
    bumpScore(el) {
        if (!el) return;
        el.classList.remove('score-bump');
        void el.offsetWidth;
        el.classList.add('score-bump');
    }

    /** Shakes a score/streak number (used when it crashes back to 0). */
    shakeScore(el) {
        if (!el) return;
        el.classList.remove('score-shake');
        void el.offsetWidth;
        el.classList.add('score-shake');
    }

    /**
     * Shows a slim info bar (under the mode bar) with the detail of a result.
     * Used on losses only — correct answers rely on the verdict + score pop.
     */
    showInfo(message, tone = 'loss') {
        const bar = this.elements.infoBar;
        if (!bar) return;
        const icon = tone === 'loss' ? '💀' : 'ℹ️';
        bar.innerHTML = `<div class="info-bar info-${tone}"><span>${icon}</span><span>${message}</span></div>`;
        bar.classList.remove('hidden');
        clearTimeout(this._infoTimer);
        this._infoTimer = setTimeout(() => this.clearInfo(), 6000);
    }

    clearInfo() {
        const bar = this.elements.infoBar;
        if (!bar) return;
        bar.classList.add('hidden');
        bar.innerHTML = '';
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
        document.body.classList.remove('is-home');
        this.clearInfo();

        document.querySelectorAll('.mode-tab').forEach(btn => {
            btn.classList.toggle('active', btn.id === `tab-${mode}`);
        });

        VIEW_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
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
