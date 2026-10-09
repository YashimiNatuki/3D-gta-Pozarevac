import * as THREE from 'three';
import { CITY_BUILDING_BOXES } from './weatherManager';

export type WeatherState = 'Clear' | 'Rain' | 'Cyber-Storm' | 'Cyber-Fog';

export class WeatherSystem {
  public currentState: WeatherState = 'Clear';
  private scene: THREE.Scene;
  private rainPoints: THREE.Points | null = null;
  private rainCount = 1800;
  private rainGeometry: THREE.BufferGeometry;
  private rainMaterial: THREE.ShaderMaterial;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private terrainMat?: THREE.MeshStandardMaterial;
  private elapsedTime = 0;

  constructor(scene: THREE.Scene, ambientLight: THREE.AmbientLight, sunLight: THREE.DirectionalLight) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;

    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);
    const lengths = new Float32Array(this.rainCount);
    const seeds = new Float32Array(this.rainCount);
    const collisionHeights = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * 60;
      const ry = Math.random() * 32;
      const rz = (Math.random() - 0.5) * 60;

      positions[i * 3] = rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = rz;

      velocities[i] = 1.0 + Math.random() * 0.4;
      lengths[i] = 0.7 + Math.random() * 0.5;
      seeds[i] = Math.random();
      collisionHeights[i] = this.getCollisionHeight(rx, rz);
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 1));
    this.rainGeometry.setAttribute('aLength', new THREE.BufferAttribute(lengths, 1));
    this.rainGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.rainGeometry.setAttribute('aCollisionHeight', new THREE.BufferAttribute(collisionHeights, 1));

    this.rainMaterial = new THREE.ShaderMaterial({
      vertexShader: `
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
        void main() {
          float totalH = uHeightCeiling - aCollisionHeight;
          float fallOffset = mod(uTime * aVelocity * uFallSpeed + aSeed * totalH, totalH);
          float curY = uHeightCeiling - fallOffset;
          vec3 wPos = position;
          wPos.x = uPlayerPos.x + mod(position.x - uPlayerPos.x + uRadius * 0.5, uRadius) - uRadius * 0.5;
          wPos.z = uPlayerPos.z + mod(position.z - uPlayerPos.z + uRadius * 0.5, uRadius) - uRadius * 0.5;
          wPos.y = curY;
          vAlpha = smoothstep(uHeightCeiling, uHeightCeiling - 3.0, curY) * smoothstep(0.0, 0.6, curY - aCollisionHeight);
          vec4 mvPos = modelViewMatrix * vec4(wPos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = clamp((aLength * 64.0) / -mvPos.z, 2.0, 32.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        varying float vAlpha;
        void main() {
          float dx = abs(gl_PointCoord.x - 0.5) * 2.0;
          float xShape = exp(-dx * dx * 7.0);
          float yShape = smoothstep(0.0, 0.8, gl_PointCoord.y) * smoothstep(1.0, 0.8, gl_PointCoord.y);
          float shape = xShape * (0.3 + 0.7 * yShape);
          if (shape < 0.02) discard;
          gl_FragColor = vec4(uColor, shape * vAlpha * uAlpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uFallSpeed: { value: 30.0 },
        uHeightCeiling: { value: 32.0 },
        uPlayerPos: { value: new THREE.Vector3() },
        uRadius: { value: 60.0 },
        uColor: { value: new THREE.Color(0x9bc2e6) },
        uAlpha: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    this.setWeather('Clear');
  }

  public setTerrainMaterial(mat: THREE.MeshStandardMaterial) {
    this.terrainMat = mat;
    this.applyMaterialWetness();
  }

  private getCollisionHeight(x: number, z: number): number {
    for (let b of CITY_BUILDING_BOXES) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
        return b.height;
      }
    }
    return 0.05;
  }

  public setWeather(weather: WeatherState) {
    this.currentState = weather;

    if (weather === 'Clear') {
      this.scene.background = new THREE.Color(0x1a2c42);
      this.scene.fog = new THREE.FogExp2(0x1a2c42, 0.009);
      this.ambientLight.color.setHex(0x3a5472);
      this.ambientLight.intensity = 2.4;
      this.sunLight.color.setHex(0xfff6dd);
      this.sunLight.intensity = 3.8;
      if (this.rainPoints) this.rainPoints.visible = false;
    } else if (weather === 'Rain') {
      this.scene.background = new THREE.Color(0x0e1520);
      this.scene.fog = new THREE.FogExp2(0x0e1520, 0.022);
      this.ambientLight.color.setHex(0x223042);
      this.ambientLight.intensity = 1.4;
      this.sunLight.color.setHex(0x88aacc);
      this.sunLight.intensity = 1.8;
      if (this.rainPoints) {
        this.rainPoints.visible = true;
        this.rainMaterial.uniforms.uAlpha.value = 0.85;
      }
    } else if (weather === 'Cyber-Fog') {
      this.scene.background = new THREE.Color(0x0a101b);
      this.scene.fog = new THREE.FogExp2(0x0a101b, 0.038);
      this.ambientLight.color.setHex(0x1a334d);
      this.ambientLight.intensity = 2.0;
      this.sunLight.color.setHex(0x00f0ff);
      this.sunLight.intensity = 2.2;
      if (this.rainPoints) this.rainPoints.visible = false;
    }

    this.applyMaterialWetness();
  }

  private applyMaterialWetness() {
    if (!this.terrainMat) return;
    if (this.currentState === 'Rain') {
      this.terrainMat.roughness = 0.12;
      this.terrainMat.metalness = 0.75;
    } else if (this.currentState === 'Cyber-Fog') {
      this.terrainMat.roughness = 0.35;
      this.terrainMat.metalness = 0.55;
    } else {
      this.terrainMat.roughness = 0.45;
      this.terrainMat.metalness = 0.35;
    }
    this.terrainMat.needsUpdate = true;
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.elapsedTime += delta;
    if (this.currentState === 'Rain' && this.rainPoints && this.rainPoints.visible) {
      this.rainMaterial.uniforms.uTime.value = this.elapsedTime;
      this.rainMaterial.uniforms.uPlayerPos.value.copy(playerPos);
    }
  }

  public dispose() {
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainGeometry.dispose();
      this.rainMaterial.dispose();
    }
  }
}
