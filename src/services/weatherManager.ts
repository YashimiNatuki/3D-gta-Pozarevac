import * as THREE from 'three';
import { audioDsp } from './audioDsp';

export type WeatherState = 'Clear' | 'Rain' | 'Cyber-Storm' | 'Cyber-Fog';

export interface SceneObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export const CITY_BUILDING_BOXES: SceneObstacleBox[] = [
  { minX: -11.5, maxX: -6.5, minZ: -25, maxZ: -11, height: 10 },
  { minX: -11.5, maxX: -6.5, minZ: -9, maxZ: 3, height: 14 },
  { minX: -11.5, maxX: -6.5, minZ: 7, maxZ: 21, height: 11 },
  { minX: 6.5, maxX: 11.5, minZ: -25, maxZ: -11, height: 12 },
  { minX: 6.5, maxX: 11.5, minZ: -9, maxZ: 3, height: 15 },
  { minX: 6.5, maxX: 11.5, minZ: 7, maxZ: 21, height: 10 },
  { minX: -22, maxX: -14, minZ: -20, maxZ: -10, height: 9 },
  { minX: 14, maxX: 22, minZ: -20, maxZ: -10, height: 11 },
];

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
  roadWetness: number;
  hasLightning: boolean;
}

export const WEATHER_PROFILES: Record<WeatherState, WeatherProfile> = {
  Clear: {
    name: 'Clear',
    serbianName: 'Sunčano (Čisto Nebo)',
    skyTopColor: 0x1e3a8a,
    skyBottomColor: 0x93c5fd,
    ambientColor: 0x94a3b8,
    ambientIntensity: 0.55,
    sunColor: 0xfff7ed,
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
    skyTopColor: 0x0f172a,
    skyBottomColor: 0x334155,
    ambientColor: 0x475569,
    ambientIntensity: 0.45,
    sunColor: 0x94a3b8,
    sunIntensity: 0.75,
    hemiSkyColor: 0x64748b,
    hemiGroundColor: 0x1e293b,
    fogColor: 0x1e293b,
    fogDensity: 0.015,
    rainDensity: 1.0,
    roadWetness: 0.5,
    hasLightning: false,
  },
  'Cyber-Storm': {
    name: 'Cyber-Storm',
    serbianName: 'Kibernetička Oluja (Ljubičaste Munje)',
    skyTopColor: 0x3b0764,
    skyBottomColor: 0x701a75,
    ambientColor: 0x581c87,
    ambientIntensity: 0.5,
    sunColor: 0xd946ef,
    sunIntensity: 0.85,
    hemiSkyColor: 0xa855f7,
    hemiGroundColor: 0x2e1065,
    fogColor: 0x3b0764,
    fogDensity: 0.02,
    rainDensity: 0.8,
    roadWetness: 0.45,
    hasLightning: true,
  },
  'Cyber-Fog': {
    name: 'Cyber-Fog',
    serbianName: 'Gusta Noćna Magla (Neon)',
    skyTopColor: 0x020617,
    skyBottomColor: 0x0f172a,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.4,
    sunColor: 0x06b6d4,
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

// =========================================================================
// CUSTOM SHADER DEFINITIONS FOR CUSTOM BUFFERGEOMETRY RAINFALL SYSTEM
// Zero cube artifacts, aerodynamic vertical point streaks, custom alpha blending
// =========================================================================

const RAIN_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uFallSpeed;
  uniform float uHeightCeiling;
  uniform vec3 uPlayerPos;
  uniform float uRadius;

  attribute float aVelocity;
  attribute float aLength;
  attribute float aSeed;
  attribute float aCollisionHeight;

  varying float vAlpha;
  varying float vCollisionDist;

  void main() {
    float totalHeight = uHeightCeiling - aCollisionHeight;
    float fallSpeed = aVelocity * uFallSpeed;
    float fallOffset = mod(uTime * fallSpeed + aSeed * totalHeight, totalHeight);
    float currentY = uHeightCeiling - fallOffset;

    // Center rain volume dynamically on the moving player
    vec3 worldPos = position;
    worldPos.x = uPlayerPos.x + mod(position.x - uPlayerPos.x + uRadius * 0.5, uRadius) - uRadius * 0.5;
    worldPos.z = uPlayerPos.z + mod(position.z - uPlayerPos.z + uRadius * 0.5, uRadius) - uRadius * 0.5;
    worldPos.y = currentY;

    vCollisionDist = currentY - aCollisionHeight;

    // Atmospheric fade: soft fade in at clouds, smooth fade out at impact surface
    float spawnFade = smoothstep(uHeightCeiling, uHeightCeiling - 4.0, currentY);
    float impactFade = smoothstep(0.0, 0.8, vCollisionDist);
    vAlpha = spawnFade * impactFade;

    vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size with camera distance perspective scaling
    gl_PointSize = (aLength * 70.0) / -mvPosition.z;
    gl_PointSize = clamp(gl_PointSize, 2.0, 36.0);
  }
`;

const RAIN_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uAlpha;

  varying float vAlpha;
  varying float vCollisionDist;

  void main() {
    // Aerodynamic vertical raindrop streak geometry inside point sprite
    float dx = abs(gl_PointCoord.x - 0.5) * 2.0;
    float dy = gl_PointCoord.y;

    // Smooth horizontal Gaussian droplet body (no cubes, soft anti-aliased edges)
    float xShape = exp(-dx * dx * 7.5);

    // Vertical elongation with bright droplet core at the leading bottom edge
    float yShape = smoothstep(0.0, 0.82, dy) * smoothstep(1.0, 0.82, dy * 0.98);

    float streak = xShape * (0.25 + 0.75 * yShape);
    if (streak < 0.02) discard;

    // Custom alpha blending
    gl_FragColor = vec4(uColor, streak * vAlpha * uAlpha);
  }
`;

// Dynamic Puddle Splash Ripple Ring Shader for terrain mesh
const PUDDLE_RIPPLE_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PUDDLE_RIPPLE_FRAGMENT = `
  uniform float uProgress;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0; // 0.0 at center, 1.0 at ring border

    // Expanding wavefront equation
    float ringRadius = uProgress;
    float ringWidth = 0.18 * (1.0 - uProgress * 0.4);
    float wave = exp(-pow((dist - ringRadius) / ringWidth, 2.0));

    // Outer subtle secondary ripple
    float secondary = 0.4 * exp(-pow((dist - ringRadius * 0.7) / (ringWidth * 1.2), 2.0));
    float totalWave = wave + secondary;

    // Fade out over lifetime
    float alpha = totalWave * (1.0 - uProgress) * 0.85;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

interface SplashEntity {
  x: number;
  y: number;
  z: number;
  progress: number;
  speed: number;
  active: boolean;
}

export class WeatherManager {
  public currentState: WeatherState = 'Clear';
  public isAutoTransitionEnabled = true;
  private autoTimer: number | null = null;
  private transitionDuration = 3.0;
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

  // Custom Shader Rain Particle System
  private rainPoints: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry;
  private rainMaterial: THREE.ShaderMaterial;
  private rainCount = 2800;
  private elapsedTime = 0;

  // Terrain Mesh Puddle Splashes
  private splashMesh: THREE.InstancedMesh | null = null;
  private splashPool: SplashEntity[] = [];
  private splashCount = 120;
  private splashMaterial: THREE.ShaderMaterial;
  private dummyObj = new THREE.Object3D();
  private lastSplashSpawn = 0;

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

    // 1. Procedural 3D Sky Dome Mesh
    const skyGeo = new THREE.SphereGeometry(280, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createSkyboxTexture(WEATHER_PROFILES.Clear.skyTopColor, WEATHER_PROFILES.Clear.skyBottomColor),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDomeMesh);

    // 2. Custom BufferGeometry Rainfall Particle System with Custom Shader
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);
    const lengths = new Float32Array(this.rainCount);
    const seeds = new Float32Array(this.rainCount);
    const collisionHeights = new Float32Array(this.rainCount);

    const radius = 65.0;
    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * radius;
      const ry = Math.random() * 36.0;
      const rz = (Math.random() - 0.5) * radius;

      positions[i * 3] = rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = rz;

      velocities[i] = 1.0 + Math.random() * 0.45; // Speed multiplier
      lengths[i] = 0.75 + Math.random() * 0.6;   // Streak length
      seeds[i] = Math.random();
      collisionHeights[i] = this.getCollisionHeight(rx, rz);
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 1));
    this.rainGeometry.setAttribute('aLength', new THREE.BufferAttribute(lengths, 1));
    this.rainGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.rainGeometry.setAttribute('aCollisionHeight', new THREE.BufferAttribute(collisionHeights, 1));

    this.rainMaterial = new THREE.ShaderMaterial({
      vertexShader: RAIN_VERTEX_SHADER,
      fragmentShader: RAIN_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uFallSpeed: { value: 34.0 },
        uHeightCeiling: { value: 36.0 },
        uPlayerPos: { value: new THREE.Vector3() },
        uRadius: { value: radius },
        uColor: { value: new THREE.Color(0xa5c9eb) },
        uAlpha: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    // 3. Terrain Puddle Splash Ripples with Custom Waveform Shader
    const rippleGeo = new THREE.PlaneGeometry(1.2, 1.2);
    rippleGeo.rotateX(-Math.PI / 2);

    this.splashMaterial = new THREE.ShaderMaterial({
      vertexShader: PUDDLE_RIPPLE_VERTEX,
      fragmentShader: PUDDLE_RIPPLE_FRAGMENT,
      uniforms: {
        uProgress: { value: 0.0 },
        uColor: { value: new THREE.Color(0x93c5fd) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.splashMesh = new THREE.InstancedMesh(rippleGeo, this.splashMaterial, this.splashCount);
    this.splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.splashMesh.visible = false;

    for (let i = 0; i < this.splashCount; i++) {
      this.splashPool.push({
        x: 0,
        y: 0,
        z: 0,
        progress: 1.0,
        speed: 2.2 + Math.random() * 0.8,
        active: false,
      });
      this.dummyObj.position.set(0, -999, 0);
      this.dummyObj.updateMatrix();
      this.splashMesh.setMatrixAt(i, this.dummyObj.matrix);
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.splashMesh);

    // 4. Lightning Strobe Point Light
    this.lightningLight = new THREE.PointLight(0xf0abfc, 0, 120);
    this.lightningLight.position.set(0, 35, 0);
    this.scene.add(this.lightningLight);

    // Initial weather state
    this.setWeather('Clear', false);
    this.startPeriodicCycle();
  }

  public triggerSplash(x: number, y: number, z: number) {
    const splash = this.splashPool.find((s) => !s.active);
    if (!splash) return;

    splash.x = x;
    splash.y = y + 0.02; // Prevents z-fighting with asphalt
    splash.z = z;
    splash.progress = 0.05;
    splash.speed = 2.4 + Math.random() * 0.8;
    splash.active = true;
  }

  public getCollisionHeight(x: number, z: number): number {
    for (let b of CITY_BUILDING_BOXES) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
        return b.height;
      }
    }
    if ((x >= -6.25 && x <= -2.75) || (x >= 2.75 && x <= 6.25)) {
      if (z >= -34 && z <= 34) {
        return 0.18; // Sidewalk curb
      }
    }
    return 0.02; // Ground asphalt
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
    const skyMat = this.skyDomeMesh.material as THREE.MeshBasicMaterial;
    if (skyMat.map) skyMat.map.dispose();
    skyMat.map = createSkyboxTexture(p.skyTopColor, p.skyBottomColor);
    skyMat.needsUpdate = true;

    this.ambientLight.color.setHex(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.hemiLight.color.setHex(p.hemiSkyColor);
    this.hemiLight.groundColor.setHex(p.hemiGroundColor);

    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(p.fogColor);
      this.scene.fog.density = p.fogDensity;
    }

    const isRaining = p.rainDensity > 0;
    if (this.rainPoints) {
      this.rainPoints.visible = isRaining;
      this.rainMaterial.uniforms.uAlpha.value = p.rainDensity * 0.85;
      this.rainMaterial.uniforms.uFallSpeed.value = this.currentState === 'Cyber-Storm' ? 44.0 : 34.0;
    }
    if (this.splashMesh) {
      this.splashMesh.visible = isRaining;
    }

    this.applyRoadWetness(p.roadWetness);
  }

  private applyRoadWetness(wetness: number) {
    if (!this.terrainMat) return;
    this.terrainMat.roughness = THREE.MathUtils.lerp(0.65, 0.08, wetness);
    this.terrainMat.metalness = THREE.MathUtils.lerp(0.15, 0.85, wetness);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    const dt = Math.min(delta, 0.1);
    this.elapsedTime += dt;

    // 1. Smooth Sky & Lighting Transition Interpolation
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt / this.transitionDuration);
      const t = this.transitionProgress;

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

      const wetness = THREE.MathUtils.lerp(this.fromProfile.roadWetness, this.toProfile.roadWetness, t);
      this.applyRoadWetness(wetness);

      const rainAlpha = THREE.MathUtils.lerp(this.fromProfile.rainDensity, this.toProfile.rainDensity, t) * 0.85;
      this.rainMaterial.uniforms.uAlpha.value = rainAlpha;
      if (this.rainPoints) this.rainPoints.visible = rainAlpha > 0.02;
      if (this.splashMesh) this.splashMesh.visible = rainAlpha > 0.02;

      if (this.transitionProgress >= 1.0) {
        this.applyInstantProfile(this.toProfile);
      }
    }

    // 2. Custom Shader Rainfall Particle Updates
    if (this.rainPoints && this.rainPoints.visible) {
      this.rainMaterial.uniforms.uTime.value = this.elapsedTime;
      this.rainMaterial.uniforms.uPlayerPos.value.copy(playerPos);

      // Procedural impact splash trigger on building roofs or terrain
      const now = performance.now();
      if (now - this.lastSplashSpawn > 22 && Math.random() < 0.38) {
        this.lastSplashSpawn = now;
        const splashX = playerPos.x + (Math.random() - 0.5) * 55;
        const splashZ = playerPos.z + (Math.random() - 0.5) * 55;
        const impactY = this.getCollisionHeight(splashX, splashZ);
        this.triggerSplash(splashX, impactY, splashZ);
      }
    }

    // 3. Terrain Puddle Splash Ripples Updates
    if (this.splashMesh && this.splashMesh.visible) {
      let needsUpdate = false;
      for (let i = 0; i < this.splashCount; i++) {
        const s = this.splashPool[i];
        if (s.active) {
          s.progress += s.speed * dt * 0.7;
          if (s.progress >= 1.0) {
            s.active = false;
            this.dummyObj.position.set(0, -999, 0);
            this.dummyObj.scale.set(0, 0, 0);
          } else {
            this.dummyObj.position.set(s.x, s.y, s.z);
            const scale = 0.2 + s.progress * 1.1;
            this.dummyObj.scale.set(scale, scale, scale);
          }
          this.dummyObj.updateMatrix();
          this.splashMesh.setMatrixAt(i, this.dummyObj.matrix);
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        this.splashMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 4. Cyber-Storm Lightning Strobes
    if (this.toProfile.hasLightning) {
      if (Math.random() < 0.012) {
        this.lightningLight.intensity = 8.5 + Math.random() * 4;
        this.lightningLight.position.set(
          playerPos.x + (Math.random() - 0.5) * 40,
          28,
          playerPos.z + (Math.random() - 0.5) * 40
        );
        audioDsp.playQuantumBurst();
        setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, 110);
      }
    }

    // Sky follows player for infinite horizon feel
    this.skyDomeMesh.position.set(playerPos.x, 0, playerPos.z);
  }

  public dispose() {
    this.stopPeriodicCycle();
    if (this.skyDomeMesh.parent) this.skyDomeMesh.parent.remove(this.skyDomeMesh);
    if (this.rainPoints && this.rainPoints.parent) this.rainPoints.parent.remove(this.rainPoints);
    if (this.splashMesh && this.splashMesh.parent) this.splashMesh.parent.remove(this.splashMesh);
    if (this.lightningLight.parent) this.lightningLight.parent.remove(this.lightningLight);
    this.rainGeometry.dispose();
    this.rainMaterial.dispose();
    this.splashMaterial.dispose();
  }
}
