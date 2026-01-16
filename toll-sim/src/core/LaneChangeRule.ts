import type { Car } from './Car';
import { COLS } from './constants';

export type LaneChangeMode = 'A' | 'B';

export interface LaneChangeParams {
    mode: LaneChangeMode;
    threshold: number; // For Mode B (probability threshold)
    currentProb?: number; // For Mode B (current a_n)
}

/**
 * Checks if a lane change is physically safe and permitted by rules.
 * @param grid The current grid state
 * @param targetLane The target lane index
 * @param x The current longitudinal position
 * @returns true if safe to move into target lane at x
 */
export function canChangeLane(grid: (Car | null)[][], targetLane: number, x: number): boolean {
    // 1. Bound checks
    if (targetLane < 0 || targetLane >= grid.length) return false;

    // 2. Target cell empty
    if (grid[targetLane][x] !== null) return false;

    // 3. Safety Check: Target Forward cell empty (Strict NaSch requirement from prompt)
    const nextX = x + 1;
    if (nextX < COLS) {
        if (grid[targetLane][nextX] !== null) return false;
    }

    return true;
}




