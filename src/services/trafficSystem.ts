import * as THREE from 'three';
import { audioDsp } from './audioDsp';
import { CITY_BUILDING_BOXES } from './weatherManager';
import { audioLocalizationManager } from './audioLocalizationManager';
import { SpatialHash2D } from './spatialHash';
import { getVehicleImpactContact } from './collisionGeometry';

export interface Vehicle {
  mesh: THREE.Group;
  type: 'sedan' | 'taxi' | 'suv' | 'sports';
  speed: number;
  velocity: THREE.Vector3;
  steering: number;
  driftAngle: number;
  policeTuning: boolean;
  currentWaypointIndex: number;
  path: THREE.Vector3[];
  wheels: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  suspensionY: number;
}

export class TrafficSystem {
  public vehicles: Vehicle[] = [];
  private scene: THREE.Scene;
  private lastDriverVoiceTime = 0;
  private lastCrashSoundTime = 0;
  private pursuitMode = false;
  private buildingHash = new SpatialHash2D<typeof CITY_BUILDING_BOXES[number]>(8);

  // Mathematically validated routes adhering strictly to Požarevac avenues,
  // preventing collisions with building bounding boxes.
  private paths: THREE.Vector3[][] = [
    // Route 1: Tabačka Čaršija East Ring (Northbound along central avenue, return via East ring)
    [
      new THREE.Vector3(1.8, 0.35, -30),
      new THREE.Vector3(1.8, 0.35, -14),
      new THREE.Vector3(1.8, 0.35, 0),
      new THREE.Vector3(1.8, 0.35, 14),
      new THREE.Vector3(1.8, 0.35, 29),
      new THREE.Vector3(8, 0.35, 30),
      new THREE.Vector3(18, 0.35, 30),
      new THREE.Vector3(26, 0.35, 28),
      new THREE.Vector3(26, 0.35, 14),
      new THREE.Vector3(26, 0.35, 0),
      new THREE.Vector3(26, 0.35, -14),
      new THREE.Vector3(26, 0.35, -28),
      new THREE.Vector3(16, 0.35, -30),
      new THREE.Vector3(6, 0.35, -30),
    ],
    // Route 2: Tabačka Čaršija West Ring (Southbound along central avenue, return via West ring)
    [
      new THREE.Vector3(-1.8, 0.35, 29),
      new THREE.Vector3(-1.8, 0.35, 14),
      new THREE.Vector3(-1.8, 0.35, 0),
      new THREE.Vector3(-1.8, 0.35, -14),
      new THREE.Vector3(-1.8, 0.35, -30),
      new THREE.Vector3(-8, 0.35, -30),
      new THREE.Vector3(-18, 0.35, -30),
      new THREE.Vector3(-26, 0.35, -28),
      new THREE.Vector3(-26, 0.35, -14),
      new THREE.Vector3(-26, 0.35, 0),
      new THREE.Vector3(-26, 0.35, 14),
      new THREE.Vector3(-26, 0.35, 28),
      new THREE.Vector3(-16, 0.35, 30),
      new THREE.Vector3(-6, 0.35, 30),
    ],
    // Route 3: Cross Boulevard (Voje Dulića - Center Alley at z = 5.0 between architectural blocks)
    [
      new THREE.Vector3(-26, 0.35, 5.0),
      new THREE.Vector3(-14, 0.35, 5.0),
      new THREE.Vector3(-4, 0.35, 5.0),
      new THREE.Vector3(0, 0.35, 5.0),
      new THREE.Vector3(4, 0.35, 5.0),
      new THREE.Vector3(14, 0.35, 5.0),
      new THREE.Vector3(26, 0.35, 5.0),
      new THREE.Vector3(26, 0.35, 16),
      new THREE.Vector3(26, 0.35, 29),
      new THREE.Vector3(14, 0.35, 30),
      new THREE.Vector3(0, 0.35, 30),
      new THREE.Vector3(-14, 0.35, 30),
      new THREE.Vector3(-26, 0.35, 29),
      new THREE.Vector3(-26, 0.35, 16),
    ],
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    CITY_BUILDING_BOXES.forEach((building) => this.buildingHash.insert({ ...building, value: building }));
    this.spawnVehicles();
  }

  private createVehicleModel(type: 'sedan' | 'taxi' | 'suv' | 'sports', color: number): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    lights: THREE.SpotLight[];
  } {
    const carGroup = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const lights: THREE.SpotLight[] = [];

    const carLength = type === 'suv' ? 3.6 : type === 'sports' ? 3.2 : 3.4;
    const carWidth = type === 'suv' ? 1.7 : 1.55;
    const carHeight = type === 'suv' ? 1.4 : type === 'sports' ? 0.85 : 1.05;

    // Chassis / Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: type === 'taxi' ? 0xf5b002 : color,
      roughness: 0.25,
      metalness: 0.65,
    });
    const bodyGeo = new THREE.BoxGeometry(carWidth, carHeight * 0.55, carLength);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = carHeight * 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Cabin / Roof
    const cabinWidth = carWidth * 0.88;
    const cabinLength = carLength * 0.55;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, carHeight * 0.5, cabinLength);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.1,
      metalness: 0.9,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, carHeight * 0.85, -carLength * 0.05);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Taxi sign if taxi
    if (type === 'taxi') {
      const taxiSign = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.2, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      taxiSign.position.set(0, carHeight * 1.15, -carLength * 0.05);
      carGroup.add(taxiSign);
    }

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-carWidth / 2 - 0.05, 0.32, carLength / 3],
      [carWidth / 2 + 0.05, 0.32, carLength / 3],
      [-carWidth / 2 - 0.05, 0.32, -carLength / 3],
      [carWidth / 2 + 0.05, 0.32, -carLength / 3],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      carGroup.add(wheel);
      wheels.push(wheel);
    });

    // Headlights (glowing cones)
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headLightGeo = new THREE.BoxGeometry(0.25, 0.15, 0.1);

    const leftHeadlight = new THREE.Mesh(headLightGeo, headLightMat);
    leftHeadlight.position.set(-carWidth * 0.35, carHeight * 0.45, carLength / 2 + 0.02);
    const rightHeadlight = new THREE.Mesh(headLightGeo, headLightMat);
    rightHeadlight.position.set(carWidth * 0.35, carHeight * 0.45, carLength / 2 + 0.02);
    carGroup.add(leftHeadlight, rightHeadlight);

    // Front Light Cone SpotLight
    const spot = new THREE.SpotLight(0xfff4db, 2.5, 14, Math.PI / 5, 0.4);
    spot.position.set(0, carHeight * 0.5, carLength / 2);
    spot.target.position.set(0, 0, carLength / 2 + 8);
    carGroup.add(spot);
    carGroup.add(spot.target);
    lights.push(spot);

    // Taillights (Red LEDs)
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const leftTaillight = new THREE.Mesh(headLightGeo, tailLightMat);
    leftTaillight.position.set(-carWidth * 0.35, carHeight * 0.45, -carLength / 2 - 0.02);
    const rightTaillight = new THREE.Mesh(headLightGeo, tailLightMat);
    rightTaillight.position.set(carWidth * 0.35, carHeight * 0.45, -carLength / 2 - 0.02);
    carGroup.add(leftTaillight, rightTaillight);

    return { group: carGroup, wheels, lights };
  }

  private spawnVehicles() {
    const carTypes: ('sedan' | 'taxi' | 'suv' | 'sports')[] = [
      'taxi',
      'sedan',
      'suv',
      'sports',
      'sedan',
      'taxi',
      'suv',
      'sports',
    ];
    const carColors = [0x00f0ff, 0xdf2020, 0x1e56a0, 0xffffff, 0x222222, 0x2e8b57, 0xf07810];

    carTypes.forEach((type, idx) => {
      const path = this.paths[idx % this.paths.length];
      const startWpIndex = Math.floor(Math.random() * (path.length - 1));
      const col = carColors[idx % carColors.length];

      const { group, wheels, lights } = this.createVehicleModel(type, col);
      group.position.copy(path[startWpIndex]);

      this.scene.add(group);
      this.vehicles.push({
        mesh: group,
        type,
        speed: 4.5 + Math.random() * 2.5,
        velocity: new THREE.Vector3(),
        steering: 0,
        driftAngle: 0,
        policeTuning: type === 'sports',
        currentWaypointIndex: startWpIndex,
        path,
        wheels,
        headlights: lights,
        suspensionY: group.position.y,
      });
    });
  }

  public setPursuitMode(enabled: boolean) {
    this.pursuitMode = enabled;
  }

  public update(delta: number, playerPos: THREE.Vector3, getGroundHeight?: (x: number, z: number) => number) {
    const dt = Math.min(delta, 0.05);
    const now = performance.now();

    this.vehicles.forEach((v) => {
      const currentTarget = v.path[(v.currentWaypointIndex + 1) % v.path.length];
      const dir = new THREE.Vector3().subVectors(currentTarget, v.mesh.position);
      dir.y = 0;
      const dist = dir.length();

      // Check distance to player
      const distToPlayer = v.mesh.position.distanceTo(playerPos);
      const vehicleImpact = getVehicleImpactContact(playerPos, {
        x: v.mesh.position.x,
        z: v.mesh.position.z,
        halfWidth: v.type === 'suv' ? 0.95 : 0.85,
        halfDepth: v.type === 'suv' ? 1.9 : 1.75,
        velocityX: v.velocity.x,
        velocityZ: v.velocity.z,
      });
      const targetSpeed = v.speed * (this.pursuitMode && v.policeTuning ? 1.32 : 1);
      let effectiveSpeed = targetSpeed;

      // 1. Physical AABB impact or close head-on approach.
      if (vehicleImpact || distToPlayer < 1.45) {
        effectiveSpeed = 0; // Brake on impact.
        v.velocity.multiplyScalar(Math.max(0, 1 - dt * 12));
        if (now - this.lastCrashSoundTime > 1500) {
          this.lastCrashSoundTime = now;
          this.lastDriverVoiceTime = now;
          // Impact sound + tire screech + horn + real driver crash shout (NO UI POPUP WINDOW)
          audioDsp.playCrashImpact(v.mesh.position);
          audioDsp.playTireScreech(v.mesh.position);
          audioDsp.playCarHorn(v.mesh.position);
          audioLocalizationManager.triggerCarCollision(v.mesh.position, true);
        }
      }
      // 2. Realistic Near Encounter / Pedestrian in Front of Car (< 2.8m)
      else if (distToPlayer < 2.8) {
        effectiveSpeed = Math.min(targetSpeed, 2.5); // Slow down, but retain enough momentum for a readable impact if the player stays in the lane.
        // Realistic driver horn & voice with 16 second cooldown (not spammy!)
        if (now - this.lastDriverVoiceTime > 16000) {
          this.lastDriverVoiceTime = now;
          audioDsp.playCarHorn(v.mesh.position);
          audioLocalizationManager.triggerCarCollision(v.mesh.position, false);
        }
      }

      // Spatial Car Engine Sound Hook: trigger spatial engine rumble if near player
      if (distToPlayer < 22 && Math.random() < 0.08) {
        audioDsp.playSpatialCarEngine(v.mesh.position, playerPos, effectiveSpeed);
      }

      if (dist < 0.6) {
        v.currentWaypointIndex = (v.currentWaypointIndex + 1) % v.path.length;
      } else {
        dir.normalize();

        // Kinematic bicycle model with bounded tire slip. Police-tuned cars retain
        // more longitudinal speed under steering and visibly rotate into a drift.
        const targetAngle = Math.atan2(dir.x, dir.z);
        const angleError = Math.atan2(
          Math.sin(targetAngle - v.mesh.rotation.y),
          Math.cos(targetAngle - v.mesh.rotation.y),
        );
        const steeringLimit = v.policeTuning ? 0.78 : 0.58;
        v.steering = THREE.MathUtils.clamp(angleError * 1.8, -steeringLimit, steeringLimit);
        const speedRatio = Math.min(1, v.velocity.length() / Math.max(0.1, targetSpeed));
        const desiredForward = new THREE.Vector3(Math.sin(v.mesh.rotation.y), 0, Math.cos(v.mesh.rotation.y));
        const desiredVelocity = desiredForward.multiplyScalar(effectiveSpeed);
        const acceleration = v.policeTuning ? 18 : 12;
        v.velocity.lerp(desiredVelocity, Math.min(1, acceleration * dt));
        const side = new THREE.Vector3(Math.cos(v.mesh.rotation.y), 0, -Math.sin(v.mesh.rotation.y));
        const lateralVelocity = side.dot(v.velocity);
        const grip = (v.policeTuning ? 7.5 : 10.5) - Math.abs(v.steering) * (v.policeTuning ? 5.5 : 3.5);
        v.velocity.addScaledVector(side, -lateralVelocity * Math.min(1, Math.max(0.5, grip) * dt));
        v.driftAngle = THREE.MathUtils.damp(v.driftAngle, v.steering * speedRatio * 0.42, 8, dt);
        v.mesh.rotation.y += v.steering * (v.policeTuning ? 2.7 : 2.2) * dt;

        // Safety steering: verify forward ray doesn't intersect building boxes
        const nextPos = v.mesh.position.clone().addScaledVector(v.velocity, dt);
        let safeToMove = true;
        const nearbyBuildings = this.buildingHash.query({
          minX: nextPos.x - 0.8,
          maxX: nextPos.x + 0.8,
          minZ: nextPos.z - 0.8,
          maxZ: nextPos.z + 0.8,
        });
        for (const b of nearbyBuildings) {
          if (
            nextPos.x >= b.minX - 0.8 &&
            nextPos.x <= b.maxX + 0.8 &&
            nextPos.z >= b.minZ - 0.8 &&
            nextPos.z <= b.maxZ + 0.8
          ) {
            safeToMove = false;
            // Advance waypoint to steer around
            v.currentWaypointIndex = (v.currentWaypointIndex + 1) % v.path.length;
            break;
          }
        }

        if (safeToMove) {
          v.mesh.position.copy(nextPos);
        }

        // Body yaw follows the chassis while the visual body keeps a small drift bias.
        v.mesh.rotation.y += v.driftAngle * dt;

        // Spin wheels
        v.wheels.forEach((w) => {
          w.rotation.x += effectiveSpeed * dt * 3;
        });
      }

      if (getGroundHeight) {
        const yaw = v.mesh.rotation.y;
        const forwardX = Math.sin(yaw);
        const forwardZ = Math.cos(yaw);
        const sideX = Math.cos(yaw);
        const sideZ = -Math.sin(yaw);
        const frontY = getGroundHeight(v.mesh.position.x + forwardX * 1.35, v.mesh.position.z + forwardZ * 1.35);
        const rearY = getGroundHeight(v.mesh.position.x - forwardX * 1.35, v.mesh.position.z - forwardZ * 1.35);
        const leftY = getGroundHeight(v.mesh.position.x - sideX * 0.68, v.mesh.position.z - sideZ * 0.68);
        const rightY = getGroundHeight(v.mesh.position.x + sideX * 0.68, v.mesh.position.z + sideZ * 0.68);
        const targetPitch = THREE.MathUtils.clamp(-Math.atan2(frontY - rearY, 2.7), -0.22, 0.22);
        const targetRoll = THREE.MathUtils.clamp(Math.atan2(rightY - leftY, 1.36), -0.2, 0.2);
        const groundY = getGroundHeight(v.mesh.position.x, v.mesh.position.z) + 0.34;
        v.suspensionY = THREE.MathUtils.damp(v.suspensionY, groundY, 16, dt);
        v.mesh.position.y = v.suspensionY;
        v.mesh.rotation.x = THREE.MathUtils.damp(v.mesh.rotation.x, targetPitch, 10, dt);
        v.mesh.rotation.z = THREE.MathUtils.damp(v.mesh.rotation.z, targetRoll, 10, dt);
      }
    });
  }

  public dispose() {
    this.vehicles.forEach((v) => {
      this.scene.remove(v.mesh);
    });
    this.vehicles = [];
  }
}
