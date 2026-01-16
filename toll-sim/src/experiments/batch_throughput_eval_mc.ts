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

// Simulation length (seconds)
const EXPERIMENT_DURATION = 86000;

// Monte Carlo repetitions
const MONTE_CARLO_RUNS = 100;

// Fixed topology
const FIXED_L = 5;
const B_VALUES = [5, 11];

// Target plaza
const TARGET_PLAZA = 'M9';

// CSV path
const CSV_PATH = path.join(
    process.cwd(),
    'src/core/lambda_per_second_all_plazas.csv'
);

// Output folder
const OUTPUT_DIR = path.join(process.cwd(), 'throughput_results_mc');

// Fixed simulation parameters
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

function loadArrivalForPlaza(
    filePath: string,
    plazaName: string
): ArrivalSeries {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    const headers = lines[0].split(',');
    const plazaIndex = headers.indexOf(plazaName);

    if (plazaIndex === -1) {
        throw new Error(`Plaza "${plazaName}" not found in CSV`);
    }

    const arrivalMap: ArrivalSeries = new Map();

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const t = parseInt(cols[0]);
        const val = parseFloat(cols[plazaIndex]);

        if (!isNaN(t) && !isNaN(val)) {
            arrivalMap.set(t, val);
        }
    }

    return arrivalMap;
}

// ================= EXPERIMENT =================

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const arrivalMap = loadArrivalForPlaza(
        CSV_PATH,
        TARGET_PLAZA
    );

    const csvFile = path.join(
        OUTPUT_DIR,
        `throughput_${TARGET_PLAZA}_L5_B5_B11_raw.csv`
    );

    const logFile = path.join(
        OUTPUT_DIR,
        `throughput_${TARGET_PLAZA}_L5_B5_B11.log`
    );

    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(
        csvFile,
        'plaza,L,B,run,passedCars\n'
    );
    fs.writeFileSync(logFile, '');

    log('🚦 Monte Carlo Throughput Evaluation');
    log(`Plaza = ${TARGET_PLAZA}`);
    log(`L = ${FIXED_L}`);
    log(`B values = ${B_VALUES.join(', ')}`);
    log(`Monte Carlo runs = ${MONTE_CARLO_RUNS}`);
    log(`Duration = ${EXPERIMENT_DURATION}s`);
    log('----------------------------------------');

    for (const B of B_VALUES) {
        log(`▶ Running configuration: L=${FIXED_L}, B=${B}`);

        for (let runIdx = 1; runIdx <= MONTE_CARLO_RUNS; runIdx++) {
            const params: SimParams = {
                ...FIXED_PARAMS,
                L: FIXED_L,
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

            fs.appendFileSync(
                csvFile,
                `${TARGET_PLAZA},${FIXED_L},${B},${runIdx},${passed}\n`
            );

            log(
                `  L=5, B=${B} | run ${runIdx}/${MONTE_CARLO_RUNS} → ${passed}`
            );
        }
    }

    log('----------------------------------------');
    log('✅ ALL MONTE CARLO RUNS COMPLETED');
    log(`CSV saved to: ${csvFile}`);
    log(`Log saved to: ${logFile}`);
}

run().catch(console.error);
