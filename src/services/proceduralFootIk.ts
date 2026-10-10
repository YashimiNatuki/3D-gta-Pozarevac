import * as THREE from 'three';

export interface ProceduralFootIkOptions {
  root: THREE.Group;
  leftFoot: THREE.Object3D;
  rightFoot: THREE.Object3D;
  groundObjects: THREE.Object3D[];
  raycastHeight?: number;
  raycastDistance?: number;
  footOffset?: number;
  smoothSpeed?: number;
  weight?: number;
}

export function clampFootIkWeight(weight: number): number {
  return THREE.MathUtils.clamp(Number.isFinite(weight) ? weight : 0, 0, 1);
}

export function smoothFootTarget(current: number, target: number, delta: number, smoothSpeed: number): number {
  const safeDelta = Math.max(0, Math.min(delta, 0.1));
  const alpha = 1 - Math.exp(-Math.max(0, smoothSpeed) * safeDelta);
  return THREE.MathUtils.lerp(current, target, alpha);
}

/**
 * Bounded, allocation-light foot placement for the existing procedural rig.
 * Imported GLB characters safely fall back because the solver only touches the
 * two optional procedural sneaker nodes supplied by CharacterRig.
 */
export class ProceduralFootIkSolver {
  private readonly root: THREE.Group;
  private readonly raycaster = new THREE.Raycaster();
  private readonly origin = new THREE.Vector3();
  private readonly hitPoint = new THREE.Vector3();
  private readonly hitNormal = new THREE.Vector3();
  private readonly localPoint = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly down = new THREE.Vector3(0, -1, 0);
  private readonly feet: Array<{ node: THREE.Object3D; homeY: number }>;
  private readonly groundObjects: THREE.Object3D[];
  private readonly raycastHeight: number;
  private readonly raycastDistance: number;
  private readonly footOffset: number;
  private readonly smoothSpeed: number;
  private readonly weight: number;

  public constructor(options: ProceduralFootIkOptions) {
    this.root = options.root;
    this.groundObjects = options.groundObjects;
    this.raycastHeight = Math.max(0.25, options.raycastHeight ?? 0.8);
    this.raycastDistance = THREE.MathUtils.clamp(options.raycastDistance ?? 1.8, 0.25, 4);
    this.footOffset = THREE.MathUtils.clamp(options.footOffset ?? 0.025, -0.1, 0.2);
    this.smoothSpeed = THREE.MathUtils.clamp(options.smoothSpeed ?? 15, 0, 40);
    this.weight = clampFootIkWeight(options.weight ?? 1);
    this.feet = [
      { node: options.leftFoot, homeY: options.leftFoot.position.y },
      { node: options.rightFoot, homeY: options.rightFoot.position.y },
    ];
    this.raycaster.far = this.raycastDistance;
  }

  public update(delta: number, enabled = true): void {
    this.root.updateMatrixWorld(true);
    const blend = enabled ? this.weight : 0;

    for (const foot of this.feet) {
      const node = foot.node;
      node.getWorldPosition(this.origin);
      this.origin.y += this.raycastHeight;
      this.raycaster.set(this.origin, this.down);
      const hit = this.raycaster.intersectObjects(this.groundObjects, true)[0];
      const targetY = hit
        ? this.root.worldToLocal(this.hitPoint.copy(hit.point)).y + this.footOffset
        : foot.homeY;
      const blendedY = THREE.MathUtils.lerp(foot.homeY, targetY, blend);
      node.position.y = smoothFootTarget(node.position.y, blendedY, delta, this.smoothSpeed);

      if (hit) {
        this.hitNormal.copy(hit.face?.normal ?? this.up).transformDirection(hit.object.matrixWorld).normalize();
        const targetPitch = Math.atan2(this.hitNormal.z, Math.max(0.1, this.hitNormal.y)) * 0.45;
        const targetRoll = -Math.atan2(this.hitNormal.x, Math.max(0.1, this.hitNormal.y)) * 0.45;
        const rotationAlpha = 1 - Math.exp(-this.smoothSpeed * Math.max(0, Math.min(delta, 0.1)));
        node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, targetPitch * blend, rotationAlpha);
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, targetRoll * blend, rotationAlpha);
      } else {
        const rotationAlpha = 1 - Math.exp(-this.smoothSpeed * Math.max(0, Math.min(delta, 0.1)));
        node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, 0, rotationAlpha);
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, 0, rotationAlpha);
      }
    }
  }
}
