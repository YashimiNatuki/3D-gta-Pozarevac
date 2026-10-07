import * as THREE from 'three';
import { audioDsp } from './audioDsp';

export type WeatherState = 'Clear' | 'Rain' | 'Cyber-Storm' | 'Cyber-Fog';

export interface WeatherProfile {
  name: string;
  serbianName: string;
  skyTopColor: number;
  skyBottomColor: number;
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  fogColor: number;
  fogDensity: number;
  rainDensity: number;
  roadWetness: number; // 0 (dry) to 1 (wet reflective)
  hasLightning: boolean;
}

export const WEATHER_PROFILES: Record<WeatherState, WeatherProfile> = {
  Clear: {
    name: 'Clear',
    serbianName: 'Sunčano (Čisto Nebo)',
    skyTopColor: 0x1e3a8a,      // Deep azure blue
    skyBottomColor: 0x93c5fd,   // Light horizon blue
    ambientColor: 0x94a3b8,
    ambientIntensity: 0.55,
    sunColor: 0xfff7ed,         // Warm golden sun
    sunIntensity: 1.15,
    hemiSkyColor: 0xbfdbfe,
    hemiGroundColor: 0x1e293b,
    fogColor: 0x64748b,
    fogDensity: 0.003,
    rainDensity: 0,
    roadWetness: 0.1,
    hasLightning: false,
  },
  Rain: {
    name: 'Rain',
    serbianName: 'Kišna Oluja (Mokar Asfalt)',
    skyTopColor: 0x0f172a,      // Gunmetal slate
    skyBottomColor: 0x334155,   // Overcast storm horizon
    ambientColor: 0x475569,
    ambientIntensity: 0.45,
    sunColor: 0x94a3b8,         // Diffuse silver storm sun
    sunIntensity: 0.75,
    hemiSkyColor: 0x64748b,
    hemiGroundColor: 0x1e293b,
    fogColor: 0x1e293b,
    fogDensity: 0.015,
    rainDensity: 1.0,
    roadWetness: 0.4,
    hasLightning: false,
  },
  'Cyber-Storm': {
    name: 'Cyber-Storm',
    serbianName: 'Kibernetička Oluja (Ljubičaste Munje)',
    skyTopColor: 0x3b0764,      // Electric purple
    skyBottomColor: 0x701a75,   // Neon magenta horizon
    ambientColor: 0x581c87,
    ambientIntensity: 0.5,
    sunColor: 0xd946ef,         // Fuchsia electric storm light
    sunIntensity: 0.85,
    hemiSkyColor: 0xa855f7,
    hemiGroundColor: 0x2e1065,
    fogColor: 0x3b0764,
    fogDensity: 0.02,
    rainDensity: 0.7,
    roadWetness: 0.35,
    hasLightning: true,
  },
  'Cyber-Fog': {
    name: 'Cyber-Fog',
    serbianName: 'Gusta Noćna Magla (Neon)',
    skyTopColor: 0x020617,
    skyBottomColor: 0x0f172a,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.4,
    sunColor: 0x06b6d4,         // Cyan neon glow
    sunIntensity: 0.7,
    hemiSkyColor: 0x0891b2,
    hemiGroundColor: 0x020617,
    fogColor: 0x0a101d,
    fogDensity: 0.028,
    rainDensity: 0,
    roadWetness: 0.2,
    hasLightning: false,
  },
};

/**
 * Creates dynamic skybox canvas gradient texture.
 */
export function createSkyboxTexture(topHex: number, bottomHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const topColor = '#' + topHex.toString(16).padStart(6, '0');
  const botColor = '#' + bottomHex.toString(16).padStart(6, '0');

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, topColor);
  grad.addColorStop(0.65, botColor);
  grad.addColorStop(1, topColor);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle clouds & atmosphere dust
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * 512;
    const cy = 200 + Math.random() * 150;
    const rad = 25 + Math.random() * 60;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class WeatherManager {
  public currentState: WeatherState = 'Clear';
  public isAutoTransitionEnabled = true;
  private autoTimer: number | null = null;
  private transitionDuration = 3.0; // Seconds for smooth transition
  private transitionProgress = 1.0;
  private fromProfile: WeatherProfile = WEATHER_PROFILES.Clear;
  private toProfile: WeatherProfile = WEATHER_PROFILES.Clear;

  // Scene references
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private skyDomeMesh: THREE.Mesh;
  private rainParticles: THREE.Points;
  private rainGeometry: THREE.BufferGeometry;
  private rainPositions: Float32Array;
  private lightningLight: THREE.PointLight;
  private terrainMat?: THREE.MeshStandardMaterial;

  private onStateChangeCallback?: (state: WeatherState) => void;

  constructor(
    scene: THREE.Scene,
    ambientLight: THREE.AmbientLight,
    hemiLight: THREE.HemisphereLight,
    sunLight: THREE.DirectionalLight,
    fillLight: THREE.DirectionalLight
  ) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.hemiLight = hemiLight;
    this.sunLight = sunLight;
    this.fillLight = fillLight;

    // 1. Procedural 3D Sky Dome Mesh (Inverted Sphere)
    const skyGeo = new THREE.SphereGeometry(280, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createSkyboxTexture(WEATHER_PROFILES.Clear.skyTopColor, WEATHER_PROFILES.Clear.skyBottomColor),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDomeMesh);

    // 2. High-Performance Falling Rain Particles
    const rainCount = 2800;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 80;
      this.rainPositions[i * 3 + 1] = Math.random() * 40;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // 3. Lightning Strobe Point Light for Cyber-Storm
    this.lightningLight = new THREE.PointLight(0xf0abfc, 0, 120);
    this.lightningLight.position.set(0, 35, 0);
    this.scene.add(this.lightningLight);

    // Initial weather state
    this.setWeather('Clear', false);

    // Start periodic weather transitions (every 60 seconds)
    this.startPeriodicCycle();
  }

  public setOnStateChange(cb: (state: WeatherState) => void) {
    this.onStateChangeCallback = cb;
  }

  public setTerrainMaterial(mat: THREE.MeshStandardMaterial) {
    this.terrainMat = mat;
    this.applyRoadWetness(this.toProfile.roadWetness);
  }

  public startPeriodicCycle(intervalSeconds: number = 60) {
    this.stopPeriodicCycle();
    const states: WeatherState[] = ['Clear', 'Rain', 'Cyber-Storm', 'Clear', 'Cyber-Fog'];
    let stateIdx = 0;

    this.autoTimer = window.setInterval(() => {
      if (!this.isAutoTransitionEnabled) return;
      stateIdx = (stateIdx + 1) % states.length;
      this.setWeather(states[stateIdx], true);
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(states[stateIdx]);
      }
    }, intervalSeconds * 1000);
  }

  public stopPeriodicCycle() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  public setWeather(targetState: WeatherState, animate: boolean = true) {
    this.currentState = targetState;
    this.fromProfile = this.toProfile;
    this.toProfile = WEATHER_PROFILES[targetState];

    if (!animate) {
      this.transitionProgress = 1.0;
      this.applyInstantProfile(this.toProfile);
    } else {
      this.transitionProgress = 0.0;
      audioDsp.playQuantumBurst();
    }
  }

  private applyInstantProfile(p: WeatherProfile) {
    // Sky Dome Texture Update
    const skyMat = this.skyDomeMesh.material as THREE.MeshBasicMaterial;
    if (skyMat.map) skyMat.map.dispose();
    skyMat.map = createSkyboxTexture(p.skyTopColor, p.skyBottomColor);
    skyMat.needsUpdate = true;

    // Lights
    this.ambientLight.color.setHex(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.hemiLight.color.setHex(p.hemiSkyColor);
    this.hemiLight.groundColor.setHex(p.hemiGroundColor);

    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;

    // Fog
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(p.fogColor);
      this.scene.fog.density = p.fogDensity;
    }

    // Rain Visibility
    this.rainParticles.visible = p.rainDensity > 0;

    // Road Wetness
    this.applyRoadWetness(p.roadWetness);
  }

  private applyRoadWetness(wetness: number) {
    if (!this.terrainMat) return;
    this.terrainMat.roughness = THREE.MathUtils.lerp(0.65, 0.08, wetness);
    this.terrainMat.metalness = THREE.MathUtils.lerp(0.15, 0.85, wetness);
  }

  /**
   * Called every frame in ThreeCanvas animation loop.
   */
  public update(delta: number, playerPos: THREE.Vector3) {
    const dt = Math.min(delta, 0.1);

    // 1. Smooth Transition Interpolation
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt / this.transitionDuration);
      const t = this.transitionProgress;

      // Lerp Light Colors & Intensities
      const ambColor = new THREE.Color(this.fromProfile.ambientColor).lerp(
        new THREE.Color(this.toProfile.ambientColor),
        t
      );
      this.ambientLight.color.copy(ambColor);
      this.ambientLight.intensity = THREE.MathUtils.lerp(
        this.fromProfile.ambientIntensity,
        this.toProfile.ambientIntensity,
        t
      );

      const sunColor = new THREE.Color(this.fromProfile.sunColor).lerp(
        new THREE.Color(this.toProfile.sunColor),
        t
      );
      this.sunLight.color.copy(sunColor);
      this.sunLight.intensity = THREE.MathUtils.lerp(
        this.fromProfile.sunIntensity,
        this.toProfile.sunIntensity,
        t
      );

      // Lerp Fog
      if (this.scene.fog instanceof THREE.FogExp2) {
        const fogCol = new THREE.Color(this.fromProfile.fogColor).lerp(
          new THREE.Color(this.toProfile.fogColor),
          t
        );
        this.scene.fog.color.copy(fogCol);
        this.scene.fog.density = THREE.MathUtils.lerp(
          this.fromProfile.fogDensity,
          this.toProfile.fogDensity,
          t
        );
      }

      // Lerp Road Wetness
      const wetness = THREE.MathUtils.lerp(this.fromProfile.roadWetness, this.toProfile.roadWetness, t);
      this.applyRoadWetness(wetness);

      // Finalize texture once transition completes
      if (this.transitionProgress >= 1.0) {
        this.applyInstantProfile(this.toProfile);
      }
    }

    // 2. Animate Falling Rain Particles
    if (this.rainParticles.visible) {
      const positions = this.rainGeometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      const fallSpeed = this.currentState === 'Cyber-Storm' ? 44.0 : 32.0;

      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= fallSpeed * dt;
        if (positions[i * 3 + 1] <= 0.05) {
          positions[i * 3 + 1] = 35 + Math.random() * 5;
          // Keep rain centered around the player
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 65;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 65;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
    }

    // 3. Cyber-Storm Electric Lightning Flashes
    if (this.toProfile.hasLightning) {
      if (Math.random() < 0.015) {
        // Trigger lightning flash
        this.lightningLight.intensity = 8.5 + Math.random() * 4;
        this.lightningLight.position.set(
          playerPos.x + (Math.random() - 0.5) * 40,
          28,
          playerPos.z + (Math.random() - 0.5) * 40
        );
        audioDsp.playQuantumBurst();
        setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, 120);
      }
    }

    // Center skybox on player for infinite horizon feel
    this.skyDomeMesh.position.set(playerPos.x, 0, playerPos.z);
  }

  public dispose() {
    this.stopPeriodicCycle();
    if (this.skyDomeMesh.parent) this.skyDomeMesh.parent.remove(this.skyDomeMesh);
    if (this.rainParticles.parent) this.rainParticles.parent.remove(this.rainParticles);
    if (this.lightningLight.parent) this.lightningLight.parent.remove(this.lightningLight);
  }
}
