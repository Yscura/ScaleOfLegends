import { BENCHMARKS } from '../data/benchmarks.js';

/**
 * Non-linear slider mapping as [sliderFraction, centimetres] control points.
 * Champions cluster hard around 150-250cm (57% are 150-200cm, ~79% are
 * 100-300cm), so most of the slider travel is given to the 100-300cm band for
 * fine control, while the rare giants (up to 50m) are compressed into the top
 * end. Endpoints match MIN_CM (10) and MAX_CM (5000). Monotonic, so invertible.
 */
const SLIDER_STOPS = [
    [0.00, 10],
    [0.15, 100],
    [0.55, 300],
    [0.75, 600],
    [1.00, 5000],
];

export class ScaleUtils {
    static sliderToCm(val) {
        const t = Math.min(1, Math.max(0, val / 1000));
        for (let i = 0; i < SLIDER_STOPS.length - 1; i++) {
            const [t0, c0] = SLIDER_STOPS[i];
            const [t1, c1] = SLIDER_STOPS[i + 1];
            if (t <= t1) {
                const f = (t - t0) / (t1 - t0);
                return Math.round(c0 + f * (c1 - c0));
            }
        }
        return SLIDER_STOPS[SLIDER_STOPS.length - 1][1];
    }

    static cmToSlider(cm) {
        const minCm = SLIDER_STOPS[0][1];
        const maxCm = SLIDER_STOPS[SLIDER_STOPS.length - 1][1];
        const h = Math.min(maxCm, Math.max(minCm, cm));
        for (let i = 0; i < SLIDER_STOPS.length - 1; i++) {
            const [t0, c0] = SLIDER_STOPS[i];
            const [t1, c1] = SLIDER_STOPS[i + 1];
            if (h <= c1) {
                const f = (h - c0) / (c1 - c0);
                return Math.round((t0 + f * (t1 - t0)) * 1000);
            }
        }
        return 1000;
    }

    static formatHeight(cm, unitSystem = 'metric') {
        if (unitSystem === 'imperial') {
            const totalInches = cm / 2.54;
            let feet = Math.floor(totalInches / 12);
            let inches = Math.round(totalInches % 12);
            if (inches === 12) {
                feet += 1;
                inches = 0;
            }
            return `${feet}' ${inches}"`;
        }
        if (cm >= 100) return `${(cm / 100).toFixed(2)} m`;
        return `${Math.round(cm)} cm`;
    }

    static formatUnitCount(cm, benchmarkKey) {
        const bench = BENCHMARKS[benchmarkKey] || BENCHMARKS.banana;
        const count = (cm / bench.height).toFixed(1);
        const label = parseFloat(count) === 1.0 ? bench.unitSingular : bench.unitPlural;
        return `${count} ${label}`;
    }

    static getCategory(champ) {
        if (champ.height < 120) return 'tiny';
        if (champ.height < 160) return 'small';
        if (champ.height < 190) return 'medium';
        if (champ.height < 250) return 'tall';
        if (champ.height < 500) return 'large';
        return 'colossus';
    }
}
