export const CELL = 10;
export const DEFAULT_L = 3;      // Default Initial lanes
export const DEFAULT_B = 6;      // Default Booth lanes
export const COLS = 90;
export const BOOTH_X = 55;
export const DIV_START = 30;     // Fan-out start
export const LOCK_START = 45;    // Lane commitment start
export const DIV_END = 50;       // Fan-out end (visual only? Logic uses LOCK_START)

export const LC_COOLDOWN = 5;

// Default Simulation Parameters
export const DEFAULT_LAMBDA = 0.6;
export const DEFAULT_ACC = 0.9;
export const DEFAULT_MU = 15;

// Lane Changing Defaults
export const DEFAULT_LC_MODE = 'A';
export const DEFAULT_LC_THRESHOLD = 0.3;

// Adaptive Reaction Defaults
export const DEFAULT_A_MIN = 0.1;
export const DEFAULT_A_MAX = 0.9;
export const DEFAULT_D0 = 5;      // Gap threshold

export const DEFAULT_BETA = 1.5;  // Sensitivity

export const DEFAULT_SIGMA = 1.5; // Booth distribution spread

export const MERGE_START = 60;
export const DEFAULT_ALPHA = 2.0;

// Minimum forward-movement probability to prevent deadlock
export const DEFAULT_P_MIN = 0.1;
