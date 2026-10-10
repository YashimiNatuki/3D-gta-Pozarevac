export interface PedestrianVehicleThreat {
  x: number;
  z: number;
  velocityX: number;
  velocityZ: number;
}

export interface PredictedVehicleThreat {
  x: number;
  z: number;
  speed: number;
  timeToReach: number;
}

/** Predict a near-term hit using a vehicle's forward trajectory and lateral clearance. */
export function findApproachingVehicleThreat(
  pedestrian: { x: number; z: number },
  vehicles: readonly PedestrianVehicleThreat[],
  options: { minimumSpeed?: number; maxLookAhead?: number; maxLateralDistance?: number; maxTimeToReach?: number } = {},
): PredictedVehicleThreat | null {
  const minimumSpeed = options.minimumSpeed ?? 2.6;
  const maxLookAhead = options.maxLookAhead ?? 11;
  const maxLateralDistance = options.maxLateralDistance ?? 2.35;
  const maxTimeToReach = options.maxTimeToReach ?? 3.2;
  let nearest: PredictedVehicleThreat | null = null;

  for (const vehicle of vehicles) {
    const speed = Math.hypot(vehicle.velocityX, vehicle.velocityZ);
    if (!Number.isFinite(speed) || speed < minimumSpeed) continue;
    const dx = pedestrian.x - vehicle.x;
    const dz = pedestrian.z - vehicle.z;
    const ux = vehicle.velocityX / speed;
    const uz = vehicle.velocityZ / speed;
    const along = dx * ux + dz * uz;
    const lateral = Math.abs(dx * uz - dz * ux);
    const timeToReach = along / speed;
    if (along < -0.5 || along >= maxLookAhead || lateral >= maxLateralDistance || timeToReach >= maxTimeToReach) continue;
    if (!nearest || timeToReach < nearest.timeToReach) nearest = { x: vehicle.x, z: vehicle.z, speed, timeToReach };
  }
  return nearest;
}
