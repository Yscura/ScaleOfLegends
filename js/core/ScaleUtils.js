import { MIN_CM, MAX_CM } from './constants.js';
import { BENCHMARKS } from '../data/benchmarks.js';

export class ScaleUtils {
    static sliderToCm(val) {
        const pct = val / 1000;
        return Math.round(MIN_CM + Math.pow(pct, 2.2) * (MAX_CM - MIN_CM));
    }

    static cmToSlider(cm) {
        const pct = Math.pow(Math.max(0, cm - MIN_CM) / (MAX_CM - MIN_CM), 1 / 2.2);
        return Math.round(pct * 1000);
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
