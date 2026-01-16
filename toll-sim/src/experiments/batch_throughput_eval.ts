/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { Simulation, type SimParams } from '../core/Simulation';
import {
    DEFAULT_ACC,
    DEFAULT_MU,
    DEFAULT_A_MIN,
    DEFAULT_A_MAX,
    DEFAULT_D0,
    DEFAULT_ALPHA,
    DEFAULT_P_MIN,
    DEFAULT_ETC_RATIO,
    DEFAULT_BETA,
    LC_COOLDOWN
} from '../core/constants';

// ================= CONFIG =================

const EXPERIMENT_DURATION = 86000;

const L_RANGE = { min: 3, max: 8 };
const B_RANGE = { min: 3, max: 16 };

// CSV path
const CSV_PATH = path.join(
    process.cwd(),
    'src/core/lambda_per_second_all_plazas.csv'
);

// Output folder
const OUTPUT_DIR = path.join(process.cwd(), 'throughput_results');

// Fixed params
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
    etcRatio: DEFAULT_ETC_RATIO
};

// ================= CSV LOAD =================

type ArrivalSeries = Map<number, number>;

async function loadArrivalPerPlaza(
    filePath: string
): Promise<Map<string, ArrivalSeries>> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    const headers = lines[0].split(',').slice(1); // skip "second"
    const plazaData = new Map<string, ArrivalSeries>();

    headers.forEach(h => plazaData.set(h, new Map()));

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const t = parseInt(cols[0]);
        if (isNaN(t)) continue;

        headers.forEach((plaza, idx) => {
            const val = parseFloat(cols[idx + 1]);
            if (!isNaN(val)) {
                plazaData.get(plaza)!.set(t, val);
            }
        });
    }

    return plazaData;
}

// ================= EXPERIMENT =================

async function run() {
    console.log('🚦 Batch Throughput Evaluation per Plaza');
    console.log('Reading:', CSV_PATH);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const plazaSeries = await loadArrivalPerPlaza(CSV_PATH);

    for (const [plazaName, arrivalMap] of plazaSeries.entries()) {
        console.log(`\n▶ Running plaza: ${plazaName}`);

        const results: string[] = ['plaza,L,B,passedCars'];

        for (let L = L_RANGE.min; L <= L_RANGE.max; L++) {
            for (let B = B_RANGE.min; B <= B_RANGE.max; B++) {
                if (B <= L) continue;

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
                results.push(`${plazaName},${L},${B},${passed}`);

                console.log(
                    `  ${plazaName} | L=${L}, B=${B} → ${passed}`
                );
            }
        }

        const outFile = path.join(
            OUTPUT_DIR,
            `throughput_${plazaName}.csv`
        );

        fs.writeFileSync(outFile, results.join('\n'));
        console.log(`✔ Saved: ${outFile}`);
    }

    console.log('\n✅ ALL EXPERIMENTS DONE');
}

// Run
run().catch(console.error);
