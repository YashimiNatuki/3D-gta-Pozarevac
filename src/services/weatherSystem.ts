import * as THREE from 'three';

export type WeatherState = 'Clear' | 'Rain' | 'Cyber-Fog';

export class WeatherSystem {
  public currentState: WeatherState = 'Clear';
  private scene: THREE.Scene;
  private rainParticles: THREE.Points | null = null;
  private rainCount = 1800;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private terrainMat?: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, ambientLight: THREE.AmbientLight, sunLight: THREE.DirectionalLight) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;
    this.initRain();
    this.setWeather('Clear');
  }

  public setTerrainMaterial(mat: THREE.MeshStandardMaterial) {
    this.terrainMat = mat;
    this.applyMaterialWetness();
  }

  private initRain() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = Math.random() * 30 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x9bc2e6,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(weather: WeatherState) {
    this.currentState = weather;

    if (weather === 'Clear') {
      // Crisp clear daylight / dusk city
      this.scene.background = new THREE.Color(0x1a2c42);
      this.scene.fog = new THREE.FogExp2(0x1a2c42, 0.009);

      this.ambientLight.color.setHex(0x3a5472);
      this.ambientLight.intensity = 2.4;

      this.sunLight.color.setHex(0xfff6dd);
      this.sunLight.intensity = 3.8;

      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'Rain') {
      // Overcast stormy wet rain
      this.scene.background = new THREE.Color(0x0e1520);
      this.scene.fog = new THREE.FogExp2(0x0e1520, 0.022);

      this.ambientLight.color.setHex(0x223042);
      this.ambientLight.intensity = 1.4;

      this.sunLight.color.setHex(0x88aacc);
      this.sunLight.intensity = 1.8;

      if (this.rainParticles) this.rainParticles.visible = true;
    } else if (weather === 'Cyber-Fog') {
      // Moody dense atmospheric haze
      this.scene.background = new THREE.Color(0x0a101b);
      this.scene.fog = new THREE.FogExp2(0x0a101b, 0.038);

      this.ambientLight.color.setHex(0x1a334d);
      this.ambientLight.intensity = 2.0;

      this.sunLight.color.setHex(0x00f0ff);
      this.sunLight.intensity = 2.2;

      if (this.rainParticles) this.rainParticles.visible = false;
    }

    this.applyMaterialWetness();
  }

  private applyMaterialWetness() {
    if (!this.terrainMat) return;
    if (this.currentState === 'Rain') {
      this.terrainMat.roughness = 0.12; // Wet reflective roads!
      this.terrainMat.metalness = 0.75;
    } else if (this.currentState === 'Cyber-Fog') {
      this.terrainMat.roughness = 0.35;
      this.terrainMat.metalness = 0.55;
    } else {
      this.terrainMat.roughness = 0.45; // Dry asphalt
      this.terrainMat.metalness = 0.35;
    }
    this.terrainMat.needsUpdate = true;
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (this.currentState === 'Rain' && this.rainParticles) {
      const posAttr = this.rainParticles.geometry.attributes.position;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 3;
        array[idx + 1] -= 22 * delta; // Falling speed

        // Reset raindrop when it hits the ground
        if (array[idx + 1] < 0) {
          array[idx + 1] = 25 + Math.random() * 5;
          array[idx] = playerPos.x + (Math.random() - 0.5) * 60;
          array[idx + 2] = playerPos.z + (Math.random() - 0.5) * 60;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose() {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
    }
  }
}
