import type { Car } from './Car';
import { DIV_START, LOCK_START } from './constants';

export type Grid = (Car | null)[][];

/**
 * Returns the inclusive range of booth lanes assigned to a given origin lane.
 */
export function getTargetRange(originLane: number, L: number, B: number): [number, number] {
    // Integer mappings:
    // Range size approx B/L.
    // Start = floor(origin * B / L)
    // End = floor((origin + 1) * B / L) - 1
    const min = Math.floor((originLane * B) / L);
    const max = Math.floor(((originLane + 1) * B) / L) - 1;
    return [min, max];
}

/**
 * Determines the target lane for a car in the fan-out zone.
 * 1. If outside assigned range, MUST move towards it (Navigation).
 * 2. If inside assigned range, use optional "balancing" logic (simple impedance check).
 */
/**
 * Assigns a specific target booth to a vehicle based on its origin lane.
 * Uses a Gaussian-like distribution centered on the mapped location.
 */
export function assignTargetBooth(originLane: number, L: number, B: number, sigma: number): number {
    // 1. Determine "ideal" center position in booth array [0..B-1]
    // Map [0, L] range to [0, B] range linearly.
    // Center of lane 'i' (which is i to i+1) maps to corresponding center in B.
    // originLane center = originLane + 0.5
    // Scale factor = B / L
    // Mapped center = (originLane + 0.5) * (B / L) - 0.5 (since booth indices are 0..B-1, center is x.5)
    // Example: L=1, B=1. Lane 0 center 0.5. Mapped 0.5. Index 0.
    const mu = (originLane + 0.5) * (B / L) - 0.5;

    // 2. Calculate probabilities for each booth j
    const weights: number[] = [];
    let sumWeights = 0;

    for (let j = 0; j < B; j++) {
        // Gaussian weight: exp( - (j - mu)^2 / (2 * sigma^2) )
        // Dist
        const dist = j - mu;
        const weight = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        weights.push(weight);
        sumWeights += weight;
    }

    // 3. Sample from distribution
    const r = Math.random() * sumWeights;
    let accumulated = 0;
    for (let j = 0; j < B; j++) {
        accumulated += weights[j];
        if (r <= accumulated) {
            return j;
        }
    }

    return B - 1; // Fallback (should not happen due to floating point)
}

/**
 * Determines the target lane for a car in the fan-out zone.
 * Now uses the pre-assigned targetBooth if available.
 */
export function getFanOutTarget(
    currentLane: number,
    x: number,
    car: Car
): number {
    // 0. Zone Check
    if (x < DIV_START || x >= LOCK_START) {
        return currentLane;
    }

    // Use pre-assigned target if available (v3.1)
    if (car.targetBooth !== undefined) {
        const target = car.targetBooth;

        // Navigation: Move towards target (Adjacent Moves Only)
        if (currentLane < target) {
            return currentLane + 1; // Desire to move Down
        } else if (currentLane > target) {
            return currentLane - 1; // Desire to move Up
        }
    } else {
        // Fallback assignment if not set (should be set at spawn in v3.1, but safety check)
        // We can't assign here easily as we don't return the car. 
        // But Simulation.ts logic should ensure assignment before this is called?
        // Actually, Simulation.ts spawns. Let's assume assignment happens at spawn or DIV_START.
    }

    // Default: Stay
    return currentLane;
}
