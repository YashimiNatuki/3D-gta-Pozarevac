import * as THREE from 'three';

export interface CinematicCameraDynamicsOptions {
  baseFov?: number;
  maxFov?: number;
  speedForMaxFov?: number;
}

export function computeSpeedFov(speed: number, baseFov = 50, maxFov = 78, speedForMaxFov = 8.8): number {
  const speedPercent = THREE.MathUtils.clamp(Math.max(0, speed) / Math.max(0.1, speedForMaxFov), 0, 1);
  return THREE.MathUtils.lerp(baseFov, maxFov, speedPercent);
}

export function decayShake(value: number, delta: number, decay = 12): number {
  const safeDelta = Math.max(0, Math.min(delta, 0.1));
  return value * Math.exp(-Math.max(0, decay) * safeDelta);
}

/** Camera layer that composes with the existing collision-safe orbit controller. */
export class CinematicCameraDynamics {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly baseFov: number;
  private readonly maxFov: number;
  private readonly speedForMaxFov: number;
  private readonly lastOffset = new THREE.Vector3();
  private shakeEnergy = 0;
  private shakeTime = 0;
  private shakeDuration = 0;

  public constructor(camera: THREE.PerspectiveCamera, options: CinematicCameraDynamicsOptions = {}) {
    this.camera = camera;
    this.baseFov = options.baseFov ?? 50;
    this.maxFov = options.maxFov ?? 78;
    this.speedForMaxFov = options.speedForMaxFov ?? 8.8;
  }

  public triggerShake(intensity = 0.12, duration = 0.22): void {
    this.shakeEnergy = THREE.MathUtils.clamp(Math.max(this.shakeEnergy, intensity), 0, 0.45);
    this.shakeDuration = THREE.MathUtils.clamp(duration, 0.04, 1.2);
    this.shakeTime = this.shakeDuration;
  }

  public update(delta: number, speed: number, enabled = true): void {
    this.camera.position.sub(this.lastOffset);
    this.lastOffset.set(0, 0, 0);
    if (!enabled) {
      this.shakeEnergy = 0;
      this.shakeTime = 0;
    } else if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - delta);
      const envelope = this.shakeDuration > 0 ? this.shakeTime / this.shakeDuration : 0;
      const amplitude = this.shakeEnergy * envelope;
      this.lastOffset.set(
        (Math.random() * 2 - 1) * amplitude,
        (Math.random() * 2 - 1) * amplitude * 0.65,
        (Math.random() * 2 - 1) * amplitude * 0.35,
      );
      this.camera.position.add(this.lastOffset);
      this.shakeEnergy = decayShake(this.shakeEnergy, delta, 7);
    }

    const targetFov = enabled ? computeSpeedFov(speed, this.baseFov, this.maxFov, this.speedForMaxFov) : this.baseFov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 1 - Math.exp(-7 * Math.max(0, Math.min(delta, 0.1))));
    this.camera.updateProjectionMatrix();
  }

  public reset(): void {
    this.camera.position.sub(this.lastOffset);
    this.lastOffset.set(0, 0, 0);
    this.shakeEnergy = 0;
    this.shakeTime = 0;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  public clearShake(): void {
    this.camera.position.sub(this.lastOffset);
    this.lastOffset.set(0, 0, 0);
    this.shakeEnergy = 0;
    this.shakeTime = 0;
  }
}
