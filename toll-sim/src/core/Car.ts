export type CarType = 'ETC' | 'MANUAL';

export interface Car {
    id: number;
    type: CarType;
    originLane: number;
    inService: boolean;
    service: number;
    servedOnce: boolean;
    color: string;

    laneChangeCooldown: number; // >0 means cannot change lane
    targetBooth?: number; // Assigned booth index (v3.1)
    mergeTargetLane?: number; // Assigned highway lane for merge (v3.2)
    isTeleporting?: boolean; // Visual flag for fan-out teleport
    passedFanOut?: boolean; // Logic flag: has completed fan-out junction logic
}

let carIdCounter = 0;

export function newCar(type: CarType, originLane: number): Car {
    return {
        id: ++carIdCounter,
        type,
        originLane,
        inService: false,
        service: 0,
        servedOnce: false,
        color: type === 'ETC' ? '#4dd0e1' : '#ffca28',
        laneChangeCooldown: 0
    };
}
