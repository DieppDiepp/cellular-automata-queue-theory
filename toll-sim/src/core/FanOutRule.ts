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
 * Returns top-K ranked booth candidates for a given origin lane.
 * Formula:
 * mu(ln) = (B-1)/2 if L=1 else ln/(L-1)*(B-1)
 * score(j) = exp(-(j - mu)^2 / (2*sigma^2))
 */
export function getFanOutCandidates(
    originLane: number,
    L: number,
    B: number,
    sigma: number,
    topK: number = 3
): number[] {
    // 1. Calculate mu
    const mu = (L === 1)
        ? (B - 1) / 2
        : (originLane / (L - 1)) * (B - 1);

    // 2. Score all booths
    const scores: { index: number; score: number }[] = [];
    for (let j = 0; j < B; j++) {
        const dist = j - mu;
        const score = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        scores.push({ index: j, score });
    }

    // 3. Sort descending
    scores.sort((a, b) => b.score - a.score);

    // 4. Return top K
    return scores.slice(0, topK).map(s => s.index);
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
