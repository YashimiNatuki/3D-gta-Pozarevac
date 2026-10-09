import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { audioDsp, spatialSoundManager } from '../services/audioDsp';
import { CharacterStats, Quest } from '../services/characterProgress';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { createPožarevacSatelliteTexture } from '../services/satelliteTexture';
import { TrafficSystem } from '../services/trafficSystem';
import { WeatherManager, WeatherState } from '../services/weatherManager';
import {
  buildThugCharacter,
  ThugOutfitId,
  CharacterRig,
  CustomCharacterConfig,
} from '../services/characterModel';
import { ThirdPersonController } from '../services/thirdPersonController';
import { PoliceAndDogsSystem } from '../services/policeAndDogsSystem';
import { DynamicMission } from '../services/dynamicMissionEngine';
import { PlantPlot } from '../services/streetEconomy';
import { CctvSystem } from '../services/cctvSystem';

export interface ThreeCanvasProps {
  cubeColor: string;
  sphereColor: string;
  cubeWireframe: boolean;
  onCubeRotated?: (rotation: { x: number; y: number; z: number }) => void;
  onScoreIncrement?: (amount: number) => void;
  onSelectObject?: (name: string) => void;
  autoSpinCube: boolean;
  cameraMode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp';
  bloomStrength?: number;
  bloomEnabled?: boolean;
  weather: WeatherState;
  onWeatherChange?: (w: WeatherState) => void;
  characterStats: CharacterStats;
  onUpdateCharacterPosition?: (pos: { x: number; z: number; heading: number }) => void;
  onCompleteQuest?: (questId: string) => void;
  quests: Quest[];
  dynamicMissions?: DynamicMission[];
  onCompleteDynamicMission?: (missionId: string) => void;
  plantPlots?: PlantPlot[];
  onInteractWithPlot?: (plot: PlantPlot) => void;
  onInteractWithPoi?: (poi: PožarevacPoi) => void;
  onNearPoiChange?: (poi: PožarevacPoi | null) => void;
  nearPoi?: PožarevacPoi | null;
  outfit?: ThugOutfitId;
  customConfig?: CustomCharacterConfig;
  isCctvActive?: boolean;
  cctvSystem?: CctvSystem;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  cubeColor,
  sphereColor,
  cubeWireframe,
  onCubeRotated,
  onScoreIncrement,
  onSelectObject,
  autoSpinCube,
  cameraMode,
  bloomStrength = 1.25,
  bloomEnabled = true,
  weather = 'Clear',
  onWeatherChange,
  characterStats,
  onUpdateCharacterPosition,
  onCompleteQuest,
  quests,
  dynamicMissions = [],
  onCompleteDynamicMission,
  plantPlots = [],
  onInteractWithPlot,
  onInteractWithPoi,
  onNearPoiChange,
  outfit = 'classic',
  customConfig,
  isCctvActive = false,
  cctvSystem,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cubeMeshRef = useRef<THREE.Mesh | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const nearPoiRef = useRef<PožarevacPoi | null>(null);
  const weatherManagerRef = useRef<WeatherManager | null>(null);
  const trafficSystemRef = useRef<TrafficSystem | null>(null);
  const policeAndDogsRef = useRef<PoliceAndDogsSystem | null>(null);
  const characterRigRef = useRef<CharacterRig | null>(null);
  const controllerRef = useRef<ThirdPersonController | null>(null);

  // Keep latest props in refs for animation loop
  const isCctvActiveRef = useRef<boolean>(isCctvActive);
  isCctvActiveRef.current = isCctvActive;

  const cctvSystemRef = useRef<CctvSystem | undefined>(cctvSystem);
  cctvSystemRef.current = cctvSystem;

  const wantedLevelRef = useRef<number>(characterStats.wantedLevel || 0);
  wantedLevelRef.current = characterStats.wantedLevel || 0;

  const dynamicMissionsRef = useRef<DynamicMission[]>(dynamicMissions);
  dynamicMissionsRef.current = dynamicMissions;

  const onCompleteDynamicMissionRef = useRef(onCompleteDynamicMission);
  onCompleteDynamicMissionRef.current = onCompleteDynamicMission;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e3a8a);
    scene.fog = new THREE.FogExp2(0x64748b, 0.005);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 800);
    camera.position.set(0, 2.8, 5.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    container.appendChild(renderer.domElement);

    // 2. Post-Processing: EffectComposer & UnrealBloomPass
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomEnabled ? bloomStrength * 0.25 : 0.0,
      0.88, // High threshold so only intense emissive neons bloom, NEVER normal surfaces
      0.18
    );
    bloomPassRef.current = bloomPass;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 3. Dynamic Environment Lighting - Natural & Crisp, Zero Overexposure
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 0.45);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.15);
    sunLight.position.set(28, 48, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 180;
    sunLight.shadow.camera.left = -38;
    sunLight.shadow.camera.right = 38;
    sunLight.shadow.camera.top = 38;
    sunLight.shadow.camera.bottom = -38;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.35);
    fillLight.position.set(-25, 22, -22);
    scene.add(fillLight);

    // Police Pursuit Overhead Strobe Light (Flashes red/blue when wantedLevel > 0)
    const pursuitAtmosphereLight = new THREE.PointLight(0xff0033, 0, 60, 1.6);
    pursuitAtmosphereLight.position.set(0, 14, 0);
    scene.add(pursuitAtmosphereLight);

    // Dynamic Weather Manager with skybox, periodic automated transitions & rain/storm
    const weatherMgr = new WeatherManager(scene, ambientLight, hemiLight, sunLight, fillLight);
    weatherManagerRef.current = weatherMgr;
    weatherMgr.setOnStateChange((newState) => {
      if (onWeatherChange) onWeatherChange(newState);
    });

    // 3D Spatial Audio Manager Factory: Bind localized ambient city noise loop relative to scene
    spatialSoundManager.createCityNoiseLoop('central_tabacka', { x: 0, y: 1.0, z: 0 }, 0.08);

    // 4. CRISP HIGH-DEFINITION POŽAREVAC SATELLITE GROUND PLANE
    const terrainSize = 78;
    const groundGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    const satTexture = createPožarevacSatelliteTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: satTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    weatherMgr.setTerrainMaterial(terrainMat);

    const groundMesh = new THREE.Mesh(groundGeo, terrainMat);
    groundMesh.receiveShadow = true;
    groundMesh.name = 'Požarevac Centar (Satelitska Mapa)';
    scene.add(groundMesh);

    // 5. 3D RAISED SIDEWALKS & STREET CURBS ALONG TABAČKA ČARŠIJA
    const sidewalksGroup = new THREE.Group();
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.1 });
    const sidewalkPavingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.05 });

    const westSidewalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.18, 68), sidewalkPavingMat);
    westSidewalk.position.set(-4.5, 0.09, 0);
    westSidewalk.receiveShadow = true;

    const westCurb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 68), curbMat);
    westCurb.position.set(-2.65, 0.11, 0);
    westCurb.castShadow = true;

    const eastSidewalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.18, 68), sidewalkPavingMat);
    eastSidewalk.position.set(4.5, 0.09, 0);
    eastSidewalk.receiveShadow = true;

    const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 68), curbMat);
    eastCurb.position.set(2.65, 0.11, 0);
    eastCurb.castShadow = true;

    sidewalksGroup.add(westSidewalk, westCurb, eastSidewalk, eastCurb);
    scene.add(sidewalksGroup);

    // 6. 3D URBAN BUILDINGS ALONG POŽAREVAC BLOCKS WITH NEON SIGNS
    const buildingsGroup = new THREE.Group();
    const buildingColors = [0x334155, 0x3f4e65, 0x475569, 0x2e3846, 0x52525b];
    const windowGeo = new THREE.PlaneGeometry(0.62, 0.82);
    const litWindowMat = new THREE.MeshStandardMaterial({
      color: 0xffe7ad,
      emissive: 0xffa726,
      emissiveIntensity: 0.2,
      roughness: 0.42,
      metalness: 0.04,
    });
    const darkWindowMat = new THREE.MeshStandardMaterial({
      color: 0x263445,
      emissive: 0x050b14,
      emissiveIntensity: 0.03,
      roughness: 0.52,
      metalness: 0.08,
    });
    const windowDummy = new THREE.Object3D();

    const createCityBuilding = (x: number, z: number, w: number, h: number, d: number, neonTitle?: string, neonColor?: number) => {
      const bColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.8, metalness: 0.1 });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(x, h / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      buildingsGroup.add(building);

      const columns = Math.max(2, Math.floor(w / 1.25));
      const rows = Math.max(3, Math.floor(h / 1.8));
      const windowCount = columns * rows;
      const litWindows = new THREE.InstancedMesh(windowGeo, litWindowMat, windowCount);
      const darkWindows = new THREE.InstancedMesh(windowGeo, darkWindowMat, windowCount);
      let litIndex = 0;
      let darkIndex = 0;
      const stableSeed = Math.abs(Math.round(x * 13 + z * 7));

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          windowDummy.position.set(
            x - w / 2 + ((column + 1) * w) / (columns + 1),
            1.1 + (row * (h - 2.2)) / Math.max(1, rows - 1),
            z + d / 2 + 0.055
          );
          windowDummy.rotation.set(0, 0, 0);
          windowDummy.scale.set(1, 1, 1);
          windowDummy.updateMatrix();

          // A deterministic occupancy pattern gives each facade a natural mix of lit and dark rooms.
          if ((stableSeed + column * 5 + row * 3) % 10 < 4) {
            litWindows.setMatrixAt(litIndex, windowDummy.matrix);
            litIndex += 1;
          } else {
            darkWindows.setMatrixAt(darkIndex, windowDummy.matrix);
            darkIndex += 1;
          }
        }
      }

      litWindows.count = litIndex;
      darkWindows.count = darkIndex;
      litWindows.instanceMatrix.needsUpdate = true;
      darkWindows.instanceMatrix.needsUpdate = true;
      litWindows.castShadow = false;
      darkWindows.castShadow = false;
      litWindows.receiveShadow = false;
      darkWindows.receiveShadow = false;
      buildingsGroup.add(litWindows, darkWindows);

      if (neonTitle) {
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512;
        signCanvas.height = 128;
        const sCtx = signCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#0f172a';
          sCtx.fillRect(0, 0, 512, 128);
          sCtx.strokeStyle = neonColor ? `#${neonColor.toString(16).padStart(6, '0')}` : '#00f0ff';
          sCtx.lineWidth = 6;
          sCtx.strokeRect(6, 6, 500, 116);
          sCtx.font = 'bold 36px sans-serif';
          sCtx.fillStyle = '#ffffff';
          sCtx.textAlign = 'center';
          sCtx.textBaseline = 'middle';
          sCtx.fillText(neonTitle, 256, 64);
        }
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.8, 1.4),
          new THREE.MeshBasicMaterial({ map: signTex })
        );
        signMesh.position.set(x, 4.2, z + d / 2 + 0.08);
        buildingsGroup.add(signMesh);
      }
    };

    const blockPositions = [
      { x: -9, z: -18, w: 5, h: 10, d: 14, neon: 'KONGLOMERAT TOWER', color: 0x10b981 },
      { x: -9, z: -3, w: 5, h: 14, d: 12, neon: 'KAFANA POŽAREVAC', color: 0xf59e0b },
      { x: -9, z: 14, w: 5, h: 11, d: 14, neon: 'CYBER BUVLJAK', color: 0x06b6d4 },
      { x: 9, z: -18, w: 5, h: 12, d: 14, neon: 'HOTEL GRAND 1900', color: 0xec4899 },
      { x: 9, z: -3, w: 5, h: 15, d: 12, neon: 'THUG LIFE CASINO', color: 0x8b5cf6 },
      { x: 9, z: 14, w: 5, h: 10, d: 14, neon: 'RADIONICA ČARŠIJA', color: 0x3b82f6 },
      { x: -18, z: -15, w: 8, h: 9, d: 10 },
      { x: 18, z: -15, w: 8, h: 11, d: 10 },
    ];

    blockPositions.forEach((b) => createCityBuilding(b.x, b.z, b.w, b.h, b.d, b.neon, b.color));
    scene.add(buildingsGroup);

    // 7. STREETLIGHTS ALONG TABAČKA ČARŠIJA
    const streetLightGroup = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    const createStreetLamp = (x: number, z: number) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2), poleMat);
      pole.position.set(x, 2.1, z);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff0aa }));
      lampHead.position.set(x, 4.2, z);

      const lampLight = new THREE.PointLight(0xfff0aa, 0.45, 8);
      lampLight.position.set(x, 4.0, z);

      streetLightGroup.add(pole, lampHead, lampLight);
    };

    [-22, -11, 0, 11, 22].forEach((zPos) => {
      createStreetLamp(-3.8, zPos);
      createStreetLamp(3.8, zPos);
    });
    scene.add(streetLightGroup);

    // 8. 3D STREET BENCHES & FLOWER PLANTERS (Prepreke & Detalji)
    const streetFurnitureGroup = new THREE.Group();
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });

    const createBench = (bx: number, bz: number, rotY: number = 0) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, 0, bz);
      bGroup.rotation.y = rotY;

      // Wooden planks
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), benchMat);
      seat.position.y = 0.45;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.06), benchMat);
      back.position.set(0, 0.75, -0.2);

      // Legs
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), ironMat);
      leg1.position.set(-0.7, 0.22, 0);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), ironMat);
      leg2.position.set(0.7, 0.22, 0);

      bGroup.add(seat, back, leg1, leg2);
      streetFurnitureGroup.add(bGroup);
    };

    // Benches along Tabačka and in the park
    createBench(-4.2, -14, Math.PI / 2);
    createBench(-4.2, 2, Math.PI / 2);
    createBench(4.2, -14, -Math.PI / 2);
    createBench(4.2, 2, -Math.PI / 2);
    createBench(-9, 5, 0);
    createBench(-11, 9, 0.4);

    // Flower Planters / Žardinjere
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });

    [-18, -6, 6, 18].forEach((pz) => {
      [-3.8, 3.8].forEach((px) => {
        const pBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), planterMat);
        pBox.position.set(px, 0.25, pz);
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), leafMat);
        bush.position.set(px, 0.65, pz);
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), flowerMat);
        flower.position.set(px, 0.9, pz);
        streetFurnitureGroup.add(pBox, bush, flower);
      });
    });
    scene.add(streetFurnitureGroup);

    // 9. TREES IN GRADSKI PARK
    const parkTreesGroup = new THREE.Group();
    for (let t = 0; t < 24; t++) {
      const tx = -12 + (Math.random() - 0.5) * 8;
      const tz = 8 + (Math.random() - 0.5) * 8;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
      );
      trunk.position.set(tx, 1.3, tz);

      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 })
      );
      foliage.position.set(tx, 3.4, tz);
      foliage.castShadow = true;

      parkTreesGroup.add(trunk, foliage);
    }
    scene.add(parkTreesGroup);

    // 9b. 3D OVERHEAD STREET NAME ARCHES & SIGNS (Prave Požarevačke Ulice)
    const streetSignsGroup = new THREE.Group();
    const createStreetArch = (text: string, x: number, y: number, z: number, rotY: number = 0, colorHex: number = 0x06b6d4) => {
      const arch = new THREE.Group();
      arch.position.set(x, 0, z);
      arch.rotation.y = rotY;

      const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, y, 12);

      const leftPost = new THREE.Mesh(postGeo, postMat);
      leftPost.position.set(-3.2, y / 2, 0);
      const rightPost = new THREE.Mesh(postGeo, postMat);
      rightPost.position.set(3.2, y / 2, 0);

      const beamMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.25, 0.3), beamMat);
      topBeam.position.set(0, y, 0);

      // Sign board with crisp canvas text
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 128;
      const sCtx = signCanvas.getContext('2d');
      if (sCtx) {
        sCtx.fillStyle = '#090d16';
        sCtx.fillRect(0, 0, 512, 128);
        sCtx.strokeStyle = '#' + colorHex.toString(16).padStart(6, '0');
        sCtx.lineWidth = 6;
        sCtx.strokeRect(4, 4, 504, 120);
        sCtx.font = 'bold 36px monospace';
        sCtx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText(text, 256, 64);
      }
      const sTex = new THREE.CanvasTexture(signCanvas);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 1.2),
        new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.2, emissive: colorHex, emissiveIntensity: 0.6 })
      );
      signMesh.position.set(0, y - 0.5, 0.16);

      arch.add(leftPost, rightPost, topBeam, signMesh);
      streetSignsGroup.add(arch);
    };

    // Place authentic Požarevac street arches
    createStreetArch('TABAČKA ČARŠIJA', 0, 5.2, -18, 0, 0x06b6d4);
    createStreetArch('STARI KORZO (VOJE DULIĆA)', 8, 4.8, -4, Math.PI / 2, 0xf59e0b);
    createStreetArch('GRADSKI PARK POŽAREVAC', -6, 4.8, 4, -Math.PI / 4, 0x10b981);
    createStreetArch('KOSOVSKA -> ČAČALICA', 14, 4.8, 8, Math.PI / 3, 0xa855f7);
    createStreetArch('BUVLJAK KOD PRUGE', -16, 4.5, -12, Math.PI / 2, 0xe11d48);
    scene.add(streetSignsGroup);

    // 10. AI TRAFFIC SYSTEM
    const traffic = new TrafficSystem(scene);
    trafficSystemRef.current = traffic;

    // 11. POLICE CRUISERS, STREET DOGS & SIDEWALK CITIZENS
    const policeAndDogs = new PoliceAndDogsSystem(scene);
    policeAndDogsRef.current = policeAndDogs;

    // 12. 3D INTERACTIVE POI BEACONS
    const poiGroup = new THREE.Group();
    const coresList: THREE.Mesh[] = [];

    POŽAREVAC_POIS.forEach((poi) => {
      const beaconContainer = new THREE.Group();
      beaconContainer.position.set(poi.coords.x, 0, poi.coords.z);

      const poiColor =
        poi.category === 'park'
          ? 0x22c55e
          : poi.category === 'commercial'
          ? 0x06b6d4
          : poi.category === 'hq'
          ? 0xa855f7
          : 0xeab308;

      const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 18, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: poiColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 9;
      beaconContainer.add(beam);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 1.9, 32),
        new THREE.MeshBasicMaterial({ color: poiColor, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      beaconContainer.add(ring);

      const coreGeo = new THREE.OctahedronGeometry(0.75);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: poiColor,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 2.4;
      beaconContainer.add(core);
      coresList.push(core);

      beaconContainer.name = `POI: ${poi.name}`;
      poiGroup.add(beaconContainer);
    });
    scene.add(poiGroup);

    // 13. DYNAMIC MISSION BEACONS (Flashing holographic beacons for dynamic missions)
    const missionBeaconsGroup = new THREE.Group();
    scene.add(missionBeaconsGroup);

    // 14. BUILD 3D THUG CHARACTER ("Mali Bandit")
    const characterRig = buildThugCharacter(outfit);
    characterRigRef.current = characterRig;
    characterRig.rootGroup.position.set(0, 0, 3.5); // Open street in front of Trg
    characterRig.setPlayerTag(characterStats.rankTitle || 'MALI BANDIT', characterStats.level);
    if (customConfig) {
      characterRig.setCustomConfig(customConfig);
    }

    scene.add(characterRig.rootGroup);

    // 15. INITIALIZE SMOOTH THIRD-PERSON CONTROLLER
    const controller = new ThirdPersonController({
      camera,
      characterGroup: characterRig.rootGroup,
      domElement: renderer.domElement,
      initialPosition: new THREE.Vector3(0, 0, 3.5),
      walkSpeed: 4.8 * (characterStats.moveSpeed || 1),
      runSpeed: 8.8 * (characterStats.moveSpeed || 1),
      jumpPower: 7.8 * (characterStats.jumpPower || 1),
      getDynamicColliders: () => {
        return traffic.vehicles.map((v) => ({
          x: v.mesh.position.x,
          z: v.mesh.position.z,
          halfWidth: v.type === 'suv' ? 0.95 : 0.85,
          halfDepth: v.type === 'suv' ? 1.9 : 1.75,
          type: 'vehicle' as const,
        }));
      },
    });
    controller.targetDistance = 4.2;
    controller.distance = 4.2;
    controller.pitch = 0.22;
    controller.targetPitch = 0.22;
    controller.setMode(cameraMode);
    controllerRef.current = controller;

    // 16. Interactive Quantum Cube and Genetic Sphere Monuments
    const cubeGeometry = new THREE.BoxGeometry(2.0, 2.0, 2.0);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cubeColor),
      wireframe: cubeWireframe,
      roughness: 0.15,
      metalness: 0.85,
      emissive: new THREE.Color(0x003322),
      emissiveIntensity: 0.6,
    });
    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(-5.5, 1.6, 6.0);
    cubeMesh.castShadow = true;
    cubeMesh.name = 'Kvantni Kockasti Monument';
    cubeMeshRef.current = cubeMesh;
    scene.add(cubeMesh);

    const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sphereColor),
      roughness: 0.1,
      metalness: 0.9,
      emissive: new THREE.Color(0x002244),
      emissiveIntensity: 0.5,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(5.5, 1.8, 6.0);
    sphereMesh.castShadow = true;
    sphereMesh.name = 'Genetska Kvantna Sfera';
    sphereMeshRef.current = sphereMesh;
    scene.add(sphereMesh);

    // 17. Clean Atmosphere (Cyber dust particles disabled per user directive for crisp, uncluttered vision)

    // 18. Raycaster for Object Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([cubeMesh, sphereMesh], false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === cubeMesh) {
          cubeMesh.rotation.y += Math.PI / 4;
          if (onCubeRotated) {
            onCubeRotated({ x: cubeMesh.rotation.x, y: cubeMesh.rotation.y, z: cubeMesh.rotation.z });
          }
          if (onSelectObject) onSelectObject('Quantum Cube');
          audioDsp.playRotateTick();
        } else if (hit === sphereMesh) {
          if (onScoreIncrement) onScoreIncrement(50);
          if (onSelectObject) onSelectObject('Genetic Sphere');
          audioDsp.playQuantumBurst();
        }
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // Keyboard Shortcuts: E for POI or Garden Plot Interaction
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        if (nearPoiRef.current && onInteractWithPoi) {
          onInteractWithPoi(nearPoiRef.current);
          audioDsp.playRotateTick();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      if (bloomPassRef.current) bloomPassRef.current.resolution.set(w, h);
    };
    window.addEventListener('resize', onResize);

    // 19. ANIMATION LOOP (Precision performance.now timer without deprecation warnings)
    let lastTime = performance.now();
    let startTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const elapsedTime = (currentTime - startTime) / 1000;

      // Update Camera based on CCTV Hacker or ThirdPersonController
      if (isCctvActiveRef.current && cctvSystemRef.current) {
        const { camPos, lookAt, fov } = cctvSystemRef.current.update(delta);
        camera.position.lerp(camPos, 0.1);
        camera.lookAt(lookAt);
        if (Math.abs(camera.fov - fov) > 0.05) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      } else {
        // Normal ThirdPersonController (WASD, Orbit, Ground clamp)
        if (camera.fov !== 50) {
          camera.fov = 50;
          camera.updateProjectionMatrix();
        }
        controller.update(delta);
      }

      // Update Character Limb Animations (walk/run cycle with proper jump airtime)
      const isJumping = !controller.isGrounded;
      characterRig.updateAnimation(
        delta,
        controller.isMoving,
        controller.isSprinting,
        isJumping
      );

      // Interactive Footstep Puddle Splashes in wet weather
      if (
        controller.isMoving &&
        controller.isGrounded &&
        (weatherMgr.currentState === 'Rain' || weatherMgr.currentState === 'Cyber-Storm')
      ) {
        if (Math.random() < 0.25) {
          weatherMgr.triggerSplash(
            controller.position.x + (Math.random() - 0.5) * 0.4,
            0.02,
            controller.position.z + (Math.random() - 0.5) * 0.4
          );
        }
      }

      // Rotate POI core beacons
      coresList.forEach((core) => {
        core.rotation.y += delta * 1.5;
        core.rotation.x += delta * 0.7;
      });

      // 3D Spatial Audio Listener tracking (PannerNode coordinates relative to camera)
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      audioDsp.updateAudioListener(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        cameraDir.x,
        cameraDir.z
      );

      // Randomized Spatial Ambient City Sound Emitters (Church bells, park wind, distant horns)
      audioDsp.updateSpatialCityAmbience(controller.position);

      // Update AI Traffic System (Slows down near player)
      traffic.update(delta, controller.position);

      // Update Police Cruisers, Street Dogs & Sidewalk Citizens
      policeAndDogs.update(delta, controller.position, wantedLevelRef.current, camera.position);

      // Police Pursuit Visual Effect (Red & Blue atmospheric strobe across Požarevac)
      if (wantedLevelRef.current > 0) {
        const strobeState = Math.sin(elapsedTime * 14) > 0;
        pursuitAtmosphereLight.color.setHex(strobeState ? 0xff0033 : 0x0066ff);
        pursuitAtmosphereLight.intensity = 4.0 + wantedLevelRef.current * 3.5;
        pursuitAtmosphereLight.position.set(controller.position.x, 10, controller.position.z);
      } else {
        pursuitAtmosphereLight.intensity = 0;
      }

      // Update Weather & Atmosphere
      weatherMgr.update(delta, controller.position);

      // Notify parent about character coordinates for Požarevac GPS radar
      if (onUpdateCharacterPosition && Math.floor(elapsedTime * 10) % 2 === 0) {
        onUpdateCharacterPosition({
          x: controller.position.x,
          z: controller.position.z,
          heading: controller.currentHeading,
        });
      }

      // Check proximity to POIs for mini-game interaction trigger
      let foundNearPoi: PožarevacPoi | null = null;
      for (const p of POŽAREVAC_POIS) {
        const d = controller.position.distanceTo(new THREE.Vector3(p.coords.x, 0, p.coords.z));
        if (d < 4.5) {
          foundNearPoi = p;
          break;
        }
      }
      if (foundNearPoi?.id !== nearPoiRef.current?.id) {
        nearPoiRef.current = foundNearPoi;
        if (onNearPoiChange) onNearPoiChange(foundNearPoi);
      }

      // Check initial quest beacons distance
      quests.forEach((q) => {
        if (!q.completed) {
          const distToQuest = controller.position.distanceTo(
            new THREE.Vector3(q.targetCoords.x, 0, q.targetCoords.z)
          );
          if (distToQuest < 2.8) {
            if (onCompleteQuest) onCompleteQuest(q.id);
            audioDsp.playHarvestChime();
          }
        }
      });

      // Check dynamic missions proximity
      dynamicMissionsRef.current.forEach((dm) => {
        if (dm.status === 'active') {
          const distToDm = controller.position.distanceTo(
            new THREE.Vector3(dm.targetCoords.x, 0, dm.targetCoords.z)
          );
          if (distToDm < 3.2) {
            if (onCompleteDynamicMissionRef.current) {
              onCompleteDynamicMissionRef.current(dm.id);
            }
            audioDsp.playHarvestChime();
          }
        }
      });

      // Monument animations
      sphereMesh.position.y = 1.8 + Math.sin(elapsedTime * 2.2) * 0.25;

      if (autoSpinCube) {
        cubeMesh.rotation.y += 0.009;
        cubeMesh.rotation.x += 0.004;
      }

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      controller.dispose();
      traffic.dispose();
      policeAndDogs.dispose();
      weatherMgr.dispose();
      spatialSoundManager.stopAll();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Weather dynamically
  useEffect(() => {
    if (weatherManagerRef.current) {
      weatherManagerRef.current.setWeather(weather, true);
    }
  }, [weather]);

  // Update Camera Mode dynamically on controller
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setMode(cameraMode);
    }
  }, [cameraMode]);

  // Update Outfit dynamically
  useEffect(() => {
    if (characterRigRef.current) {
      characterRigRef.current.setOutfit(outfit);
    }
  }, [outfit]);

  // Update Custom Config dynamically
  useEffect(() => {
    if (characterRigRef.current && customConfig) {
      characterRigRef.current.setCustomConfig(customConfig);
    }
  }, [customConfig]);

  // Update Player Tag dynamically
  useEffect(() => {
    if (characterRigRef.current) {
      characterRigRef.current.setPlayerTag(characterStats.rankTitle, characterStats.level);
    }
  }, [characterStats.rankTitle, characterStats.level]);

  // Update Bloom Strength dynamically
  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = bloomEnabled ? bloomStrength : 0.0;
    }
  }, [bloomStrength, bloomEnabled]);

  // Sync Monument Materials
  useEffect(() => {
    if (cubeMeshRef.current) {
      const mat = cubeMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(cubeColor);
      mat.wireframe = cubeWireframe;
    }
  }, [cubeColor, cubeWireframe]);

  useEffect(() => {
    if (sphereMeshRef.current) {
      const mat = sphereMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(sphereColor);
    }
  }, [sphereColor]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
