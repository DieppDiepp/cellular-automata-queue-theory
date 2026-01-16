import { DEFAULT_BETA, DEFAULT_D0, DEFAULT_A_MIN, DEFAULT_A_MAX } from './constants';

export interface AdaptiveParams {
    useAdaptive: boolean;
    a?: number;
    a_min?: number;
    a_max?: number;
    d_0?: number;
    beta?: number;
}

/**
 * Computes the adaptive acceleration/movement probability based on the gap.
 * Formula: a(gap) = a_min + (a_max - a_min) * (1 / (1 + exp(-beta * (gap - d_0))))
 */
export function computeAdaptiveA(
    gap: number,
    a_min: number = DEFAULT_A_MIN,
    a_max: number = DEFAULT_A_MAX,
    d_0: number = DEFAULT_D0,
    beta: number = DEFAULT_BETA
): number {
    const exponent = -beta * (gap - d_0);
    // Sigmoid function part
    const sigmoid = 1 / (1 + Math.exp(exponent));

    return a_min + (a_max - a_min) * sigmoid;
}

/**
 * Determines the movement probability for a car in the current step.
 */
export function getForwardProbability(params: AdaptiveParams, gap: number): number {
    if (!params.useAdaptive) {
        return params.a || 0.9;
    }
    return computeAdaptiveA(gap, params.a_min, params.a_max, params.d_0, params.beta);
}
