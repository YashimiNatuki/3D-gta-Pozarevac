import * as THREE from 'three';

export interface EnvironmentFxConfig {
  wetness: number;
  neonIntensity: number;
  ambientColor: number;
}

const ENVIRONMENT_PROFILES: Record<string, EnvironmentFxConfig> = {
  Clear: { wetness: 0.1, neonIntensity: 1.0, ambientColor: 0x94a3b8 },
  Rain: { wetness: 0.72, neonIntensity: 1.35, ambientColor: 0x64748b },
  'Cyber-Storm': { wetness: 0.92, neonIntensity: 1.9, ambientColor: 0xa855f7 },
  'Cyber-Fog': { wetness: 0.38, neonIntensity: 1.55, ambientColor: 0x22d3ee },
};

export function getEnvironmentFxConfig(weather: string): EnvironmentFxConfig {
  return ENVIRONMENT_PROFILES[weather] ?? ENVIRONMENT_PROFILES.Clear;
}

export function dampEnvironmentValue(current: number, target: number, delta: number, speed = 4): number {
  const safeDelta = Math.max(0, Math.min(delta, 0.1));
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * safeDelta));
}

interface MaterialBaseline {
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
}

/** Applies the attached global wetness/neon concept safely to Three.js materials. */
export class GlobalEnvironmentFx {
  private readonly materials = new Map<THREE.MeshStandardMaterial, MaterialBaseline>();
  private current: EnvironmentFxConfig = { ...ENVIRONMENT_PROFILES.Clear };
  private target: EnvironmentFxConfig = { ...ENVIRONMENT_PROFILES.Clear };

  public registerMaterial(material: THREE.Material): void {
    if (!(material instanceof THREE.MeshStandardMaterial) || this.materials.has(material)) return;
    this.materials.set(material, {
      roughness: material.roughness,
      metalness: material.metalness,
      emissiveIntensity: material.emissiveIntensity,
    });
    this.applyMaterial(material, this.current);
  }

  public setWeatherState(weather: string): void {
    this.target = { ...getEnvironmentFxConfig(weather) };
  }

  public update(delta: number): void {
    this.current.wetness = dampEnvironmentValue(this.current.wetness, this.target.wetness, delta);
    this.current.neonIntensity = dampEnvironmentValue(this.current.neonIntensity, this.target.neonIntensity, delta);
    this.current.ambientColor = this.target.ambientColor;
    this.materials.forEach((_, material) => this.applyMaterial(material, this.current));
  }

  public getState(): EnvironmentFxConfig {
    return { ...this.current };
  }

  public dispose(): void {
    this.materials.clear();
  }

  private applyMaterial(material: THREE.MeshStandardMaterial, config: EnvironmentFxConfig): void {
    const baseline = this.materials.get(material);
    if (!baseline) return;
    material.roughness = THREE.MathUtils.lerp(baseline.roughness, Math.min(baseline.roughness, 0.08), config.wetness);
    material.metalness = THREE.MathUtils.lerp(baseline.metalness, Math.max(baseline.metalness, 0.86), config.wetness);
    material.emissiveIntensity = baseline.emissiveIntensity + Math.max(0, config.neonIntensity - 1) * 0.18;
  }
}
