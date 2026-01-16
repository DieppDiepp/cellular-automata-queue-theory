import type { Grid } from './GridUtils';
import type { Car } from './Car';

/**
 * Fan-In (Merge) Rule
 * -------------------
 * Purpose:
 *  - Decide WHICH highway lane a vehicle in a vanishing (booth) lane
 *    should attempt to merge into at the merge junction.
 *
 * Design principles:
 *  - Symmetric to Fan-Out quota logic
 *  - Deterministic (no randomness here)
 *  - Capacity-fair: all highway lanes can be used
 *  - No teleport, no execution — only preference ranking
 *
 * This function ONLY returns ordered candidates.
 * Arbitration & execution belong to Simulation.ts
 */

/**
 * Compute ordered merge candidates for a booth lane.
 *
 * @param boothLane   current lane index (>= L)
 * @param L           number of real highway lanes
 * @param B           total number of booth lanes
 * @returns           sorted array of highway lane indices (0 .. L-1)
 */
export function getMergeCandidates(
    boothLane: number,
    L: number,
    B: number
): number[] {
    /**
     * Intuition:
     * ----------
     * Fan-out maps:
     *   highway lane ℓ → booth space [0, B)
     *
     * Fan-in reverses it:
     *   booth lane j → highway space [0, L)
     *
     * We compute the "ideal" highway lane center (ℓ_star)
     * and rank nearby lanes symmetrically.
     */

    /* -----------------------------
       1. Ideal highway center
       ----------------------------- */

    // Normalize booth position to [0,1]
    const boothRatio = (boothLane + 0.5) / B;

    // Map into highway lane space
    const l_star = boothRatio * L - 0.5;

    /* -----------------------------
       2. Influence radius (quota)
       ----------------------------- */

    // How many booth lanes map into one highway lane
    const R = Math.ceil(B / L);

    /* -----------------------------
       3. Score highway lanes
       ----------------------------- */

    const scores: { lane: number; score: number }[] = [];

    for (let h = 0; h < L; h++) {
        const dist = Math.abs(h - l_star);
        const score = Math.max(0, 1 - dist / R);

        if (score > 0) {
            scores.push({ lane: h, score });
        }
    }

    /* -----------------------------
       4. Sort candidates
       ----------------------------- */

    scores.sort((a, b) => {
        // Primary: higher score first
        if (Math.abs(b.score - a.score) > 1e-6) {
            return b.score - a.score;
        }
        // Secondary: deterministic tie-break
        return a.lane - b.lane;
    });

    return scores.map(s => s.lane);
}

/**
 * Optional helper:
 * Check whether a merge into a given highway lane is physically possible.
 * (No execution, no probability here.)
 */
export function canMergePhysically(
    grid: Grid,
    nextGrid: Grid,
    targetLane: number,
    x: number
): boolean {
    // Target cell must be empty now and in nextGrid
    if (grid[targetLane][x] !== null) return false;
    if (nextGrid[targetLane][x] !== null) return false;

    // Forward cell must also be empty to avoid instant deadlock
    if (
        x + 1 < grid[0].length &&
        grid[targetLane][x + 1] !== null
    ) {
        return false;
    }

    return true;
}
