import {
    COLS,
    LC_COOLDOWN,
    DEFAULT_SIGMA,
    LOCK_START,
    MERGE_START,
    DIV_START,
    DEFAULT_ALPHA
} from './constants';

import { newCar } from './Car';
import { type Grid, getGap } from './GridUtils';
import { assignTargetBooth } from './BoothAssignment';
import { getForwardProbability } from './MovementRule';
import { getFanOutCandidates } from './FanOutRule';
import { getMergeCandidates, canMergePhysically } from './FanInRule';
import { canChangeLane } from './LaneChangeRule';
import { updateServiceState, type ServiceMode } from './ServiceRule';

export interface SimStats {
    time: number;
    passedCars: number;
}

export interface SimParams {
    L: number;
    B: number;
    lambda: number;
    a: number;
    mu: number;
    serviceMode: ServiceMode;
    laneChangeCooldown: number;
    useAdaptive: boolean;
    a_min?: number;
    a_max?: number;
    d_0?: number;
    beta?: number;
    sigma: number;
    alpha: number;
    p_min: number;
    etcRatio: number;
}

export class Simulation {
    private grid: Grid;
    private time = 0;
    private passedCars = 0;
    private params: SimParams;

    constructor(initialParams: SimParams) {
        this.params = { ...initialParams };
        if (this.params.sigma === undefined) this.params.sigma = DEFAULT_SIGMA;
        if (this.params.alpha === undefined) this.params.alpha = DEFAULT_ALPHA;
        if (this.params.etcRatio === undefined) this.params.etcRatio = 0.6;
        if (this.params.laneChangeCooldown === undefined)
            this.params.laneChangeCooldown = LC_COOLDOWN;

        this.grid = Array.from({ length: this.params.B }, () =>
            Array(COLS).fill(null)
        );
    }

    public getStats(): SimStats {
        return { time: this.time, passedCars: this.passedCars };
    }

    public updateParams(newParams: SimParams) {
        this.params = { ...newParams };
    }

    public step() {
        this.time++;
        this.spawn();

        const {
            B,
            a,
            mu,
            serviceMode,
            laneChangeCooldown,
            p_min,
            useAdaptive,
            a_min,
            a_max,
            d_0,
            beta
        } = this.params;

        const L = this.params.L;
        const grid = this.grid;
        const nextGrid: Grid = Array.from({ length: B }, () =>
            Array(COLS).fill(null)
        );

        const isDegenerate = (L === B);

        for (let i = 0; i < B; i++) {
            for (let x = COLS - 1; x >= 0; x--) {
                const car = grid[i][x];
                if (!car) continue;

                /* ---------- Cooldown ---------- */
                if (car.laneChangeCooldown > 0) car.laneChangeCooldown--;

                /* ---------- Service ---------- */
                updateServiceState(car, x, mu, serviceMode);
                if (car.inService) {
                    nextGrid[i][x] = car;
                    continue;
                }

                const nextX = x + 1;

                /* =====================================================
                   CASE 1: L == B  (NO FAN-OUT, NO FAN-IN)
                   ===================================================== */
                if (isDegenerate) {
                    /* ---- Forward ---- */
                    let moved = false;
                    if (
                        nextX < COLS &&
                        grid[i][nextX] === null &&
                        nextGrid[i][nextX] === null
                    ) {
                        const gap = getGap(grid, i, x, B);
                        const p_raw = getForwardProbability(
                            { useAdaptive, a, a_min, a_max, d_0, beta },
                            gap
                        );
                        const p_forward = Math.max(p_raw, p_min);

                        if (Math.random() < p_forward) {
                            nextGrid[i][nextX] = car;
                            moved = true;
                        }
                    } else if (nextX >= COLS) {
                        this.passedCars++;
                        moved = true;
                    }

                    if (moved) continue;

                    /* ---- Lateral escape if blocked ---- */
                    if (car.laneChangeCooldown === 0) {
                        const candidates: number[] = [];
                        if (i > 0) candidates.push(i - 1);
                        if (i < B - 1) candidates.push(i + 1);

                        for (const j of candidates) {
                            if (
                                canChangeLane(grid, j, x) &&
                                nextGrid[j][x] === null
                            ) {
                                nextGrid[j][x] = car;
                                car.laneChangeCooldown = laneChangeCooldown;
                                moved = true;
                                break;
                            }
                        }
                    }

                    if (moved) continue;

                    nextGrid[i][x] = car;
                    continue;
                }

                /* =====================================================
                   CASE 2: NORMAL FAN-OUT / FAN-IN (B > L)
                   ===================================================== */

                const isVanishingLane = i >= L;
                const atMergeWall = x >= MERGE_START;

                /* ---------- FAN-OUT ---------- */
                if (x === DIV_START && !car.passedFanOut) {
                    const candidates = getFanOutCandidates(car.originLane, L, B);
                    let done = false;

                    for (const j of candidates) {
                        if (
                            grid[j][x] === null &&
                            nextGrid[j][x] === null
                        ) {
                            nextGrid[j][x] = car;
                            car.passedFanOut = true;
                            car.isTeleporting = j !== i;
                            done = true;
                            break;
                        }
                    }

                    if (!done) nextGrid[i][x] = car;
                    continue;
                }

                car.isTeleporting = false;

                /* ---------- Forward ---------- */
                let forwardSuccess = false;
                if (!(isVanishingLane && atMergeWall)) {
                    if (
                        nextX < COLS &&
                        grid[i][nextX] === null &&
                        nextGrid[i][nextX] === null
                    ) {
                        const gap = getGap(grid, i, x, B);
                        const p_raw = getForwardProbability(
                            { useAdaptive, a, a_min, a_max, d_0, beta },
                            gap
                        );
                        const p_forward = Math.max(p_raw, p_min);

                        if (Math.random() < p_forward) {
                            nextGrid[i][nextX] = car;
                            forwardSuccess = true;
                        }
                    } else if (nextX >= COLS) {
                        this.passedCars++;
                        forwardSuccess = true;
                    }
                }

                if (forwardSuccess) continue;

                /* ---------- Lane change escape ---------- */
                if (
                    car.laneChangeCooldown === 0 &&
                    x < LOCK_START &&
                    nextX < COLS &&
                    grid[i][nextX] !== null
                ) {
                    const options = [];
                    if (i > 0) options.push(i - 1);
                    if (i < B - 1) options.push(i + 1);

                    for (const j of options) {
                        if (
                            canChangeLane(grid, j, x) &&
                            nextGrid[j][x] === null
                        ) {
                            nextGrid[j][x] = car;
                            car.laneChangeCooldown = laneChangeCooldown;
                            forwardSuccess = true;
                            break;
                        }
                    }
                }

                if (forwardSuccess) continue;

                /* ---------- FAN-IN ---------- */
                if (isVanishingLane && atMergeWall) {
                    const mergeCandidates = getMergeCandidates(i, L, B);
                    for (const h of mergeCandidates) {
                        if (canMergePhysically(grid, nextGrid, h, x)) {
                            nextGrid[h][x] = car;
                            car.laneChangeCooldown = laneChangeCooldown;
                            forwardSuccess = true;
                            break;
                        }
                    }
                }

                if (forwardSuccess) continue;

                nextGrid[i][x] = car;
            }
        }

        this.grid = nextGrid;
    }

    private spawn() {
        const { lambda, L, B, sigma } = this.params;
        if (Math.random() < lambda) {
            const lane = Math.floor(Math.random() * L);
            if (!this.grid[lane][0]) {
                const type =
                    Math.random() < this.params.etcRatio
                        ? 'ETC'
                        : 'MANUAL';
                const car = newCar(type, lane);
                car.targetBooth = assignTargetBooth(lane, L, B, sigma);
                this.grid[lane][0] = car;
            }
        }
    }
}
