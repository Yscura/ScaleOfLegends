/**
 * Shared base for every game mode. Holds a reference to the orchestrating
 * `Game` and exposes convenience accessors for shared services and state.
 * Lifecycle / event hooks default to no-ops so the Game can delegate to the
 * active mode without checking which capabilities it supports.
 */
export class BaseMode {
    constructor(game) {
        this.game = game;
    }

    get audio() { return this.game.audio; }
    get store() { return this.game.store; }
    get elements() { return this.game.elements; }
    get unitSystem() { return this.game.unitSystem; }
    get activeBenchmark() { return this.game.activeBenchmark; }

    showToast(message, type) {
        return this.game.showToast(message, type);
    }

    portraitUrl(id) {
        return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`;
    }

    /** DOM id of the <section> this mode controls. */
    get viewId() { return ''; }

    /** Called when the mode becomes active. */
    enter() {}

    // Shared control hooks the Game routes to the active mode (no-ops by default).
    onSliderInput() {}
    onUnitChange() {}
    onBenchmarkChange() {}
    handleSubmission() {}
    handleNext() {}
}
