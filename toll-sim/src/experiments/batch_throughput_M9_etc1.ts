/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { Simulation, type SimParams } from '../core/Simulation_batch';
import {
    DEFAULT_ACC,
    DEFAULT_MU,
    DEFAULT_A_MIN,
    DEFAULT_A_MAX,
    DEFAULT_D0,
    DEFAULT_ALPHA,
    DEFAULT_P_MIN,
    DEFAULT_BETA,
    LC_COOLDOWN
} from '../core/constants';

// ================= CONFIG =================

// Simulation horizon (~1 day)
const EXPERIMENT_DURATION = 86000;

// Full range (ALLOW B = L)
const L_RANGE = { min: 3, max: 16 };
const B_RANGE = { min: 3, max: 16 };

// CSV path
const CSV_PATH = path.join(
    process.cwd(),
    'src/core/lambda_per_second_all_plazas.csv'
);

// Output folder (SEPARATE)
const OUTPUT_DIR = path.join(
    process.cwd(),
    'throughput_results_etc1'
);

// ===== FIXED PARAMETERS =====
// NOTE: ETC = 1.0 (100% ETC)
const FIXED_PARAMS: Omit<SimParams, 'L' | 'B' | 'lambda'> = {
    a: DEFAULT_ACC,
    mu: DEFAULT_MU,
    serviceMode: 'fixed',
    laneChangeCooldown: LC_COOLDOWN,
    useAdaptive: false,
    a_min: DEFAULT_A_MIN,
    a_max: DEFAULT_A_MAX,
    d_0: DEFAULT_D0,
    beta: DEFAULT_BETA,
    sigma: 1.5,
    alpha: DEFAULT_ALPHA,
    p_min: DEFAULT_P_MIN,
    etcRatio: 1.0
};

// ================= CSV LOAD =================

type ArrivalSeries = Map<number, number>;

async function loadArrivalForM9(
    filePath: string
): Promise<ArrivalSeries> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    const headers = lines[0].split(',');
    const m9Index = headers.indexOf('M9');

    if (m9Index === -1) {
        throw new Error('Column M9 not found in CSV');
    }

    const series: ArrivalSeries = new Map();

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const t = parseInt(cols[0]);
        const lambda = parseFloat(cols[m9Index]);

        if (!isNaN(t) && !isNaN(lambda)) {
            series.set(t, lambda);
        }
    }

    return series;
}

// ================= EXPERIMENT =================

async function run() {
    console.log('🚦 Batch Throughput – M9 only (ETC = 1.0)');
    console.log('Reading:', CSV_PATH);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const arrivalMap = await loadArrivalForM9(CSV_PATH);

    const results: string[] = ['plaza,L,B,passedCars'];

    for (let L = L_RANGE.min; L <= L_RANGE.max; L++) {
        for (let B = B_RANGE.min; B <= B_RANGE.max; B++) {

            // Allow B = L
            if (B < L) continue;

            const params: SimParams = {
                ...FIXED_PARAMS,
                L,
                B,
                lambda: 0
            };

            const sim = new Simulation(params);

            for (let t = 0; t < EXPERIMENT_DURATION; t++) {
                const lambda = arrivalMap.get(t) ?? 0;
                sim.updateParams({ ...params, lambda });
                sim.step();
            }

            const passed = sim.getStats().passedCars;
            results.push(`M9,${L},${B},${passed}`);

            console.log(`  M9 | L=${L}, B=${B} → ${passed}`);
        }
    }

    const outFile = path.join(
        OUTPUT_DIR,
        'throughput_M9_ETC1.csv'
    );

    fs.writeFileSync(outFile, results.join('\n'));
    console.log(`✔ Saved: ${outFile}`);
    console.log('✅ DONE (M9, ETC = 1.0)');
}

// Run
run().catch(console.error);
