import { COLS } from './constants';
import { type Car } from './Car';

export type Grid = (Car | null)[][];

/**
 * Checks if a coordinate is within grid bounds.
 */
export function isOnGrid(lane: number, x: number, B: number): boolean {
    return lane >= 0 && lane < B && x >= 0 && x < COLS;
}

/**
 * Calculates the gap to the next vehicle in the specified lane, starting from x.
 * Used for adaptive acceleration and lane changing logic.
 * @returns gap distance (number of empty cells). If clear to end, returns a large number.
 */
export function getGap(grid: Grid, lane: number, currentX: number, B: number): number {
    if (!isOnGrid(lane, currentX, B)) return 0;

    let gap = 0;
    for (let checkX = currentX + 1; checkX < COLS; checkX++) {
        if (grid[lane][checkX]) {
            return gap;
        }
        gap++;
    }
    return 1000; // Efficiently infinite gap
}

/**
 * Computes the queue length behind a specific position.
 * Looks backwards from headX - 1.
 */
export function getQueueLength(grid: readonly (Car | null)[][], lane: number, headX: number): number {
    let q = 0;
    let x = headX - 1;
    while (x >= 0) {
        if (grid[lane][x] !== null) {
            q++;
            x--;
        } else {
            break;
        }
    }
    return q;
}
