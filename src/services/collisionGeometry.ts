export interface CollisionAabb2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface VehicleImpactContact {
  directionX: number;
  directionZ: number;
  relativeSpeed: number;
}

/** Returns the safe camera distance before a segment intersects any expanded world obstacle. */
export function getCameraSafeDistance(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  obstacles: readonly CollisionAabb2D[],
  clearance = 0.28,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(length) || length <= 0) return 0;
  const dir = [dx / length, dy / length, dz / length];
  let nearest = length;

  for (const obstacle of obstacles) {
    const bounds = [
      [obstacle.minX - clearance, obstacle.maxX + clearance],
      [-clearance, 100_000],
      [obstacle.minZ - clearance, obstacle.maxZ + clearance],
    ];
    const origin = [start.x, start.y, start.z];
    let enter = 0;
    let exit = length;
    let intersects = true;
    for (let axis = 0; axis < 3; axis += 1) {
      const velocity = dir[axis];
      const [min, max] = bounds[axis];
      if (Math.abs(velocity) < 1e-8) {
        if (origin[axis] < min || origin[axis] > max) { intersects = false; break; }
        continue;
      }
      const t1 = (min - origin[axis]) / velocity;
      const t2 = (max - origin[axis]) / velocity;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) { intersects = false; break; }
    }
    // Ignore an obstacle that contains the target point; it cannot be solved by moving the camera.
    if (intersects && exit > 0.12 && enter > 0.12) nearest = Math.min(nearest, Math.max(0.5, enter - clearance));
  }
  return nearest;
}

/** Detects a moving car reaching the player's collision radius and returns a stable outward normal. */
export function getVehicleImpactContact(
  player: { x: number; z: number },
  vehicle: { x: number; z: number; halfWidth: number; halfDepth: number; velocityX: number; velocityZ: number },
  playerRadius = 0.45,
  minimumSpeed = 1.8,
): VehicleImpactContact | null {
  const speed = Math.hypot(vehicle.velocityX, vehicle.velocityZ);
  if (!Number.isFinite(speed) || speed < minimumSpeed) return null;
  const closestX = Math.max(vehicle.x - vehicle.halfWidth, Math.min(vehicle.x + vehicle.halfWidth, player.x));
  const closestZ = Math.max(vehicle.z - vehicle.halfDepth, Math.min(vehicle.z + vehicle.halfDepth, player.z));
  let nx = player.x - closestX;
  let nz = player.z - closestZ;
  const distance = Math.hypot(nx, nz);
  if (distance > playerRadius + 0.14) return null;
  if (distance < 1e-5) {
    // When the player center overlaps the car box, push opposite the vehicle's travel vector.
    nx = -vehicle.velocityX / speed;
    nz = -vehicle.velocityZ / speed;
  } else {
    nx /= distance;
    nz /= distance;
  }
  return { directionX: nx, directionZ: nz, relativeSpeed: speed };
}
