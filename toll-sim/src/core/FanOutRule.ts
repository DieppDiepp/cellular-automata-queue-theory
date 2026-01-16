import type { Car } from './Car';
import { DIV_START, LOCK_START } from './constants';

export type Grid = (Car | null)[][];

/**
 * Returns the inclusive range of booth lanes assigned to a given origin lane.
 */
export function getTargetRange(originLane: number, L: number, B: number): [number, number] {
    const min = Math.floor((originLane * B) / L);
    const max = Math.floor(((originLane + 1) * B) / L) - 1;
    return [min, max];
}

/**
 * Assigns a target booth (legacy/sampling) - kept for reference or spawn if needed.
 */
export function assignTargetBooth(originLane: number, L: number, B: number, sigma: number): number {
    const mu = (L === 1)
        ? (B - 1) / 2
        : (originLane / (L - 1)) * (B - 1);

    const weights: number[] = [];
    let sumWeights = 0;

    for (let j = 0; j < B; j++) {
        const dist = j - mu;
        const weight = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        weights.push(weight);
        sumWeights += weight;
    }

    const r = Math.random() * sumWeights;
    let accumulated = 0;
    for (let j = 0; j < B; j++) {
        accumulated += weights[j];
        if (r <= accumulated) {
            return j;
        }
    }

    return B - 1;
}

/**
 * Returns Quota-Based sorted booth candidates for a given origin lane.
 * Core Logic:
 * j_star = round(((origin + 0.5) * B / L) - 0.5)
 * R = ceil(B / L)
 * score(j) = max(0, 1 - |j - j_star| / R)
 */
export function getFanOutCandidates(
    originLane: number,
    L: number,
    B: number
): number[] {
    // 1. Calculate ideal center index (0-based)
    // Map lane center (origin + 0.5) to booth space
    const centerRatio = (originLane + 0.5) / L;
    const j_star = Math.round(centerRatio * B - 0.5);

    // 2. Calculate Influence Radius (Quota)
    const R = Math.ceil(B / L);

    // 3. Score booths
    const scores: { index: number; score: number }[] = [];
    for (let j = 0; j < B; j++) {
        const dist = Math.abs(j - j_star);
        // Linear falloff within radius R
        const score = Math.max(0, 1 - dist / R);

        if (score > 0) {
            scores.push({ index: j, score });
        }
    }

    // 4. Sort: Descending Score, then Ascending Index (Symmetry)
    scores.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 0.0001) {
            return b.score - a.score;
        }
        return a.index - b.index; // Ascending index for equality
    });

    return scores.map(s => s.index);
}


/**
 * Determines the target lane for a car in the fan-out zone (Drift Logic).
 * V3.3 UPDATE: Logic now effectively disabled or simplified, as teleport happens at DIV_START.
 * If called between DIV_START and LOCK_START, we return currentLane to prevent drift.
 */
export function getFanOutTarget(
    currentLane: number,
    x: number,
    car: Car
): number {
    // Disable drift logic completely
    return currentLane;
}
