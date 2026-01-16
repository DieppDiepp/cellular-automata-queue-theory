import type { Car } from './Car';
import { BOOTH_X } from './constants';

export type ServiceMode = 'fixed' | 'exp';

export function updateServiceState(
    car: Car,
    x: number,
    mu: number,
    mode: ServiceMode
): void {
    // Only MANUAL cars stop. ETC cars fly through (implied by lack of logic for ETC in original).
    if (car.type === 'MANUAL') {
        // Start Service
        if (x === BOOTH_X && !car.inService && !car.servedOnce) {
            car.inService = true;
            if (mode === 'fixed') {
                car.service = mu;
            } else {
                // Exponential: -mu * ln(1 - rand)
                // Note: Original code used Math.ceil(...)
                car.service = Math.ceil(-mu * Math.log(1 - Math.random()));
            }
        }

        // Process Service
        if (car.inService) {
            car.service--;
            if (car.service <= 0) {
                car.inService = false;
                car.servedOnce = true;
            }
        }
    }
}
