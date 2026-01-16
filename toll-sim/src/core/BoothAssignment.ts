/**
 * Assigns a target booth index based on origin lane and distribution parameters.
 * Uses a Gaussian-like distribution centered around a mapped position.
 * 
 * @param originLane The starting lane index (0 to L-1)
 * @param L Number of highway lanes
 * @param B Number of booth lanes
 * @param sigma Standard deviation for distribution (spread)
 * @returns The index of the assigned booth (0 to B-1)
 */
export function assignTargetBooth(originLane: number, L: number, B: number, sigma: number): number {
    // 1. Map origin lane to a center point in the B lanes
    // Simple scaling: center ~ (originLane / (L-1)) * (B-1)
    // If L=1, center is middle of B.
    let center: number;
    if (L <= 1) {
        center = (B - 1) / 2;
    } else {
        const ratio = originLane / (L - 1);
        center = ratio * (B - 1);
    }

    // 2. Sample from Normal Distribution N(center, sigma)
    // Box-Muller transform for simple Gaussian sampling
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    let target = Math.round(center + z * sigma);

    // 3. Clamp to valid booth range [0, B-1]
    if (target < 0) target = 0;
    if (target >= B) target = B - 1;

    return target;
}
