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
import { type Grid, getGap, getQueueLength } from './GridUtils';
import { assignTargetBooth } from './BoothAssignment';
import { getForwardProbability } from './MovementRule';
import { getFanOutCandidates } from './FanOutRule';
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
        if (this.params.laneChangeCooldown === undefined)
            this.params.laneChangeCooldown = LC_COOLDOWN;

        this.grid = Array.from({ length: this.params.B }, () =>
            Array(COLS).fill(null)
        );
    }

    public getGrid(): Grid {
        return this.grid;
    }

    public getStats(): SimStats {
        return { time: this.time, passedCars: this.passedCars };
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

        for (let i = 0; i < B; i++) {
            for (let x = COLS - 1; x >= 0; x--) {
                const car = grid[i][x];
                if (!car) continue;

                /* ---------- 1. Cooldown ---------- */
                if (car.laneChangeCooldown > 0) car.laneChangeCooldown--;

                /* ---------- 2. Service ---------- */
                updateServiceState(car, x, mu, serviceMode);
                if (car.inService) {
                    nextGrid[i][x] = car;
                    continue;
                }

                /* ---------- Common flags ---------- */
                const isVanishingLane = i >= L;
                const atMergeWall = x >= MERGE_START;
                const nextX = x + 1;

                /* =====================================================
                   FAN-OUT JUNCTION — MUST RUN BEFORE FORWARD
                   ===================================================== */
                if (x === DIV_START && !car.passedFanOut) {
                    const candidates = getFanOutCandidates(
                        car.originLane,
                        L,
                        B
                    );

                    let teleported = false;
                    for (const j of candidates) {
                        const occupiedNow = grid[j][x] !== null && grid[j][x] !== car;
                        const occupiedNext = nextGrid[j][x] !== null;

                        if (!occupiedNow && !occupiedNext) {
                            nextGrid[j][x] = car;
                            car.passedFanOut = true;
                            car.isTeleporting = (j !== i);
                            teleported = true;
                            break;
                        }
                    }

                    if (teleported) {
                        continue; // turn consumed
                    } else {
                        // stop-line behavior: wait & retry next tick
                        if (nextGrid[i][x] === null) nextGrid[i][x] = car;
                        continue;
                    }
                }

                // reset teleport visual flag once past junction
                car.isTeleporting = false;

                /* ---------- 3A. Forward ---------- */
                let forwardSuccess = false;

                if (!(isVanishingLane && atMergeWall)) {
                    let forwardFree = true;
                    if (nextX < COLS) {
                        if (grid[i][nextX] || nextGrid[i][nextX]) {
                            forwardFree = false;
                        }
                    }

                    const gap = getGap(grid, i, x, B);
                    const p_raw = getForwardProbability(
                        { useAdaptive, a, a_min, a_max, d_0, beta },
                        gap
                    );
                    const p_forward = Math.max(p_raw, p_min);

                    if (forwardFree && Math.random() < p_forward) {
                        if (nextX < COLS) nextGrid[i][nextX] = car;
                        else this.passedCars++;
                        forwardSuccess = true;
                    }
                }

                if (forwardSuccess) continue;

                /* ---------- 3B. Lane Change (Fan-in / Merge) ---------- */
                const inLockZone = !isVanishingLane && x >= LOCK_START;
                let laneChangeSuccess = false;

                if (car.laneChangeCooldown === 0 && !inLockZone) {
                    let targetLane = i;

                    // Vanishing lane must merge upward
                    if (isVanishingLane && atMergeWall) {
                        targetLane = i - 1;
                    }

                    if (
                        targetLane !== i &&
                        canChangeLane(grid, targetLane, x) &&
                        nextGrid[targetLane][x] === null
                    ) {
                        let p_change = 0.5;

                        if (isVanishingLane && atMergeWall) {
                            const q = getQueueLength(grid, i, x);
                            const p0 = 0.3;
                            p_change = Math.min(1, p0 + this.params.alpha * q);
                        }

                        if (Math.random() < p_change) {
                            nextGrid[targetLane][x] = car;
                            car.laneChangeCooldown = laneChangeCooldown;
                            laneChangeSuccess = true;
                        }
                    }
                }

                if (laneChangeSuccess) continue;

                /* ---------- 3C. Stay ---------- */
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
                const type = Math.random() < 0.6 ? 'ETC' : 'MANUAL';
                const car = newCar(type, lane);
                car.targetBooth = assignTargetBooth(lane, L, B, sigma);
                this.grid[lane][0] = car;
            }
        }
    }
}
