import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { audioDsp, spatialSoundManager } from '../services/audioDsp';
import { CharacterStats, Quest } from '../services/characterProgress';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { createPozarevacStylizedGroundTexture } from '../services/satelliteTexture';
import { createOpenStreetMapGroundTexture, type OsmGroundElement } from '../services/osmGroundTexture';
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
import { shouldTriggerMissionCheckpoint } from '../services/missionRules';
import { AdaptiveRenderBudget, getInitialPixelRatio } from '../services/rendererPerformance';
import { GameDirector } from '../services/gameDirector';
import { buildPozarevacLandmarks } from '../services/pozarevacLandmarks';
import { buildUrbanMicroLandmarks } from '../services/urbanMicroLandmarks';
import { buildPlantPlotModels, disposePlantPlotModels } from '../services/plantPlotModels';
import { isValidPozarevacDem, samplePozarevacTerrainHeight, type PozarevacDemHeightfield } from '../services/terrainHeightfield';
import { importTerrainGeoTiff } from '../services/terrainImagery';
import { parseLocalCharacterGlb } from '../services/gltfCharacter';
import { ProceduralFootIkSolver } from '../services/proceduralFootIk';
import { GlobalEnvironmentFx } from '../services/globalEnvironmentFx';
import { CinematicCameraDynamics } from '../services/cinematicCameraDynamics';
import { createModularBuilding } from '../services/modularBuildingFactory';
import { shouldAutoActivatePoi } from '../services/poiInteractionRules';
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
  onDirectorSignal?: (signal: { id: string; type: string; intensity: number; reason: string }) => void;
  onVehicleImpact?: (impact: { relativeSpeed: number; x: number; z: number }) => void;
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
  onDirectorSignal,
  onVehicleImpact,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cubeMeshRef = useRef<THREE.Mesh | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const nearPoiRef = useRef<PožarevacPoi | null>(null);
  const onInteractWithPoiRef = useRef(onInteractWithPoi);
  onInteractWithPoiRef.current = onInteractWithPoi;
  const weatherManagerRef = useRef<WeatherManager | null>(null);
  const trafficSystemRef = useRef<TrafficSystem | null>(null);
  const policeAndDogsRef = useRef<PoliceAndDogsSystem | null>(null);
  const characterRigRef = useRef<CharacterRig | null>(null);
  const controllerRef = useRef<ThirdPersonController | null>(null);
  const environmentFxRef = useRef<GlobalEnvironmentFx | null>(null);
  const directorRef = useRef<GameDirector | null>(null);
  const plantPlotsRef = useRef<PlantPlot[]>(plantPlots);
  plantPlotsRef.current = plantPlots;
  const onInteractWithPlotRef = useRef(onInteractWithPlot);
  onInteractWithPlotRef.current = onInteractWithPlot;
  const nearPlantPlotRef = useRef<PlantPlot | null>(null);
  const gardenPlotGroupRef = useRef<THREE.Group | null>(null);
  const [groundLayer, setGroundLayer] = useState<'osm' | 'classic' | 'satellite' | 'hybrid'>('classic');
  const [osmMapReady, setOsmMapReady] = useState(false);
  const [osmMapFailed, setOsmMapFailed] = useState(false);
  const [demStatus, setDemStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [satelliteAttribution, setSatelliteAttribution] = useState('');
  const [mapImportStatus, setMapImportStatus] = useState('');
  const [characterModelStatus, setCharacterModelStatus] = useState('');
  const [hasImportedCharacter, setHasImportedCharacter] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const terrainRef = useRef<PozarevacDemHeightfield | null>(null);
  const onVehicleImpactRef = useRef(onVehicleImpact);
  onVehicleImpactRef.current = onVehicleImpact;
  const terrainMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const osmGroundTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const classicGroundTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const satelliteGroundTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const hybridGroundTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const satelliteRasterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const osmElementsRef = useRef<OsmGroundElement[]>([]);
  const mapFileInputRef = useRef<HTMLInputElement>(null);
  const characterFileInputRef = useRef<HTMLInputElement>(null);

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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      setWebglError(false);
    } catch (error) {
      console.warn('[ThreeCanvas] WebGL is unavailable; keeping the HUD and mission controls usable.', error);
      setWebglError(true);
      return;
    }
    renderer.setSize(width, height);
    const deviceMemory = 'deviceMemory' in navigator
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
      : undefined;
    const renderBudget = new AdaptiveRenderBudget(
      getInitialPixelRatio(window.devicePixelRatio, deviceMemory),
    );
    renderer.setPixelRatio(renderBudget.pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
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

    // 4. DEM-DRAPED 2.56 km POŽAREVAC GROUND PLANE (30 m source spacing).
    const terrainSize = 160;
    const terrainSegments = 96;
    const groundGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    groundGeo.rotateX(-Math.PI / 2);

    const classicGroundTexture = createPozarevacStylizedGroundTexture();
    classicGroundTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    classicGroundTextureRef.current = classicGroundTexture;
    const terrainMat = new THREE.MeshStandardMaterial({
      map: classicGroundTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    terrainMaterialRef.current = terrainMat;
    const environmentFx = new GlobalEnvironmentFx();
    environmentFxRef.current = environmentFx;
    environmentFx.registerMaterial(terrainMat);
    weatherMgr.setTerrainMaterial(terrainMat);

    // Load the bundled OSM snapshot from this app origin; no external map tiles or API keys.
    let groundRequestCancelled = false;
    const groundAbortController = new AbortController();
    void fetch(`${import.meta.env.BASE_URL}data/pozarevac-osm-extract.json`, { signal: groundAbortController.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`OSM map data HTTP ${response.status}`);
        return response.json() as Promise<{ elements?: OsmGroundElement[] }>;
      })
      .then((snapshot) => {
        if (groundRequestCancelled) return;
        osmElementsRef.current = snapshot.elements ?? [];
        const openMapTexture = createOpenStreetMapGroundTexture(osmElementsRef.current);
        openMapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        osmGroundTextureRef.current = openMapTexture;
        setGroundLayer('osm');
        setOsmMapReady(true);
        terrainMat.map = openMapTexture;
        terrainMat.needsUpdate = true;
      })
      .catch((error: unknown) => {
        if (!groundRequestCancelled) {
          setOsmMapFailed(true);
          console.warn('OpenStreetMap ground layer unavailable; using the built-in stylized map.', error);
        }
      });

    const getGroundHeight = (x: number, z: number) => terrainRef.current
      ? samplePozarevacTerrainHeight(terrainRef.current, x, z)
      : 0;
    void fetch(`${import.meta.env.BASE_URL}data/pozarevac-dem-heightfield.json`, { signal: groundAbortController.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`DEM heightfield HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((snapshot) => {
        if (groundRequestCancelled) return;
        if (!isValidPozarevacDem(snapshot)) throw new Error('DEM snapshot schema or grid dimensions are invalid');
        terrainRef.current = snapshot;
        controllerRef.current?.setTerrain(snapshot);
        const position = groundGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let index = 0; index < position.count; index += 1) {
          position.setY(index, getGroundHeight(position.getX(index), position.getZ(index)));
        }
        position.needsUpdate = true;
        groundGeo.computeVertexNormals();
        groundGeo.computeBoundingSphere();
        setDemStatus('ready');
      })
      .catch((error: unknown) => {
        if (!groundRequestCancelled) {
          setDemStatus('failed');
          console.warn('Copernicus DEM terrain unavailable; using a flat fallback plane.', error);
        }
      });

    const groundMesh = new THREE.Mesh(groundGeo, terrainMat);
    groundMesh.receiveShadow = true;
    groundMesh.name = 'Požarevac Centar (Map Podloga)';
    scene.add(groundMesh);

    // 5. 3D RAISED SIDEWALKS & STREET CURBS ALONG TABAČKA ČARŠIJA
    const sidewalksGroup = new THREE.Group();
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.1 });
    const sidewalkPavingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.05 });
    environmentFx.registerMaterial(curbMat);
    environmentFx.registerMaterial(sidewalkPavingMat);

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
    environmentFx.registerMaterial(litWindowMat);
    environmentFx.registerMaterial(darkWindowMat);
    const windowDummy = new THREE.Object3D();

    const createCityBuilding = (x: number, z: number, w: number, h: number, d: number, neonTitle?: string, neonColor?: number) => {
      const bColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const building = createModularBuilding({
        width: w,
        height: h,
        depth: d,
        bodyColor: bColor,
        roofColor: 0x251b2b,
        windowColor: neonColor ?? 0x0e7490,
        floors: Math.max(2, Math.round(h / 3)),
        name: `Modularna kuća/fasada — ${neonTitle ?? 'Požarevac'}`,
        roofStyle: h >= 12 ? 'flat' : 'gable',
      });
      building.position.set(x, 0, z);
      building.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
          environmentFx.registerMaterial(object.material);
        }
      });
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

    // High-detail authored landmarks: Tulba, Čačalica and cultivation micro-zones.
    buildPozarevacLandmarks(scene);
    // Stadium, Korzo, hospital exterior and central local-reference micro-landmarks.
    buildUrbanMicroLandmarks(scene);

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
    const policeAndDogs = new PoliceAndDogsSystem(scene, getGroundHeight);
    policeAndDogsRef.current = policeAndDogs;
    directorRef.current = new GameDirector({ seed: 7302026, cooldownMs: 18_000 });

    // 12. 3D INTERACTIVE POI BEACONS
    const poiGroup = new THREE.Group();
    const coresList: THREE.Mesh[] = [];
    const beaconVisuals: Array<{ poi: PožarevacPoi; container: THREE.Group; beam: THREE.Mesh; ring: THREE.Mesh; core: THREE.Mesh }> = [];

    POŽAREVAC_POIS.forEach((poi) => {
      // Keep the square POI interactive, but do not place a giant marker in the open road.
      if (poi.id === 'stari_centar') return;
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
      beaconVisuals.push({ poi, container: beaconContainer, beam, ring, core });

      beaconContainer.name = `POI: ${poi.name}`;
      poiGroup.add(beaconContainer);
    });
    scene.add(poiGroup);

    const gardenPlotGroup = buildPlantPlotModels(plantPlotsRef.current);
    gardenPlotGroupRef.current = gardenPlotGroup;
    scene.add(gardenPlotGroup);

    // 13. DYNAMIC MISSION BEACONS (Flashing holographic beacons for dynamic missions)
    const missionBeaconsGroup = new THREE.Group();
    scene.add(missionBeaconsGroup);
    const missionProximityLatch = new Set<string>();

    // 14. BUILD 3D THUG CHARACTER ("Mali Bandit")
    const characterRig = buildThugCharacter(outfit);
    characterRigRef.current = characterRig;
    characterRig.rootGroup.position.set(0, 0, 3.5); // Open street in front of Trg
    characterRig.setPlayerTag(characterStats.rankTitle || 'MALI BANDIT', characterStats.level);
    if (customConfig) {
      characterRig.setCustomConfig(customConfig);
    }

    scene.add(characterRig.rootGroup);

    // 15. INITIALIZE SMOOTH THIRD-PERSON CONTROLLER + CINEMATIC DYNAMICS
    const cameraDynamics = new CinematicCameraDynamics(camera, {
      baseFov: 50,
      maxFov: 82,
      speedForMaxFov: 8.8,
    });
    const controller = new ThirdPersonController({
      camera,
      characterGroup: characterRig.rootGroup,
      domElement: renderer.domElement,
      initialPosition: new THREE.Vector3(0, 0, 3.5),
      walkSpeed: 4.8 * (characterStats.moveSpeed || 1),
      runSpeed: 8.8 * (characterStats.moveSpeed || 1),
      jumpPower: 7.8 * (characterStats.jumpPower || 1),
      terrain: terrainRef.current,
      getGroundHeight,
      onVehicleImpact: (impact) => {
        cameraDynamics.triggerShake(Math.min(0.28, impact.relativeSpeed * 0.018), 0.24);
        onVehicleImpactRef.current?.(impact);
      },
      getDynamicColliders: () => {
        return [
          ...traffic.vehicles.map((v) => ({
            x: v.mesh.position.x,
            z: v.mesh.position.z,
            halfWidth: v.type === 'suv' ? 0.95 : 0.85,
            halfDepth: v.type === 'suv' ? 1.9 : 1.75,
            type: 'vehicle' as const,
            velocityX: v.velocity.x,
            velocityZ: v.velocity.z,
          })),
          ...policeAndDogs.policeCars.map((car) => ({ x: car.group.position.x, z: car.group.position.z, halfWidth: 0.92, halfDepth: 1.85, type: 'vehicle' as const })),
          ...policeAndDogs.pursuitCruisers.map((car) => ({ x: car.group.position.x, z: car.group.position.z, halfWidth: 0.92, halfDepth: 1.85, type: 'vehicle' as const })),
          ...policeAndDogs.pedestrians.map((ped) => ({ x: ped.group.position.x, z: ped.group.position.z, halfWidth: 0.28, halfDepth: 0.28, type: 'prop' as const })),
          ...policeAndDogs.dogs.map((dog) => ({ x: dog.group.position.x, z: dog.group.position.z, halfWidth: 0.32, halfDepth: 0.48, type: 'prop' as const })),
        ];
      },
    });
    controller.targetDistance = 4.2;
    controller.distance = 4.2;
    controller.pitch = 0.22;
    controller.targetPitch = 0.22;
    controller.setMode(cameraMode);
    controllerRef.current = controller;
    const footIk = new ProceduralFootIkSolver({
      root: characterRig.rootGroup,
      leftFoot: characterRig.leftSneaker,
      rightFoot: characterRig.rightSneaker,
      groundObjects: [groundMesh, sidewalksGroup],
      raycastHeight: 0.8,
      raycastDistance: 1.8,
      smoothSpeed: 15,
      weight: 0.92,
    });

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
        if (e.repeat || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
        const nearbyPlot = nearPlantPlotRef.current;
        if (nearbyPlot && onInteractWithPlotRef.current) {
          onInteractWithPlotRef.current(nearbyPlot);
          audioDsp.playRotateTick();
          return;
        }
        if (nearPoiRef.current && onInteractWithPoiRef.current) {
          onInteractWithPoiRef.current(nearPoiRef.current);
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
    let lastRenderedTime = startTime;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      if (document.visibilityState === 'hidden') {
        lastTime = currentTime;
        lastRenderedTime = currentTime;
        return;
      }
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
        controller.update(delta);
        cameraDynamics.update(delta, controller.velocity.length(), controller.activeMode !== 'topDown');
      }
      if (isCctvActiveRef.current) cameraDynamics.clearShake();

      // Update Character Limb Animations (walk/run cycle with proper jump airtime)
      const isJumping = !controller.isGrounded;
      characterRig.updateAnimation(
        delta,
        controller.isMoving,
        controller.isSprinting,
        isJumping
      );
      footIk.update(delta, controller.isGrounded);

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
      traffic.setPursuitMode(wantedLevelRef.current > 0);
      traffic.update(delta, controller.position, getGroundHeight);

      // HQ AI Director fuses live telemetry into deterministic, bounded gameplay signals.
      const activeMission = dynamicMissionsRef.current.find((mission) => mission.status === 'active');
      const directorFrame = directorRef.current?.tick({
        now: currentTime,
        playerSpeed: controller.isMoving ? (controller.isSprinting ? 8.8 : 4.8) : 0,
        wantedLevel: wantedLevelRef.current,
        nearbyVehicles: traffic.vehicles.filter((vehicle) => vehicle.mesh.position.distanceTo(controller.position) < 18).length,
        nearbyCivilians: policeAndDogs.pedestrians.filter((pedestrian) => pedestrian.group.position.distanceTo(controller.position) < 18).length,
        activeMissionType: activeMission?.type,
        weather,
      });
      if (directorFrame?.signal) onDirectorSignal?.(directorFrame.signal);

      // Update Police Cruisers, Street Dogs & Sidewalk Citizens
      const pedestrianVehicleThreats = [
        ...traffic.vehicles.map((vehicle) => ({
          x: vehicle.mesh.position.x,
          z: vehicle.mesh.position.z,
          velocityX: vehicle.velocity.x,
          velocityZ: vehicle.velocity.z,
        })),
      ];
      policeAndDogs.update(delta, controller.position, wantedLevelRef.current, camera.position, pedestrianVehicleThreats, terrainRef.current);

      // Police Pursuit Visual Effect (Red & Blue atmospheric strobe across Požarevac)
      if (wantedLevelRef.current > 0) {
        const strobeState = Math.sin(elapsedTime * 14) > 0;
        pursuitAtmosphereLight.color.setHex(strobeState ? 0xff0033 : 0x0066ff);
        pursuitAtmosphereLight.intensity = 4.0 + wantedLevelRef.current * 3.5 + (directorFrame?.policePressure ?? 0) * 1.5;
        pursuitAtmosphereLight.position.set(controller.position.x, 10, controller.position.z);
      } else {
        pursuitAtmosphereLight.intensity = 0;
      }

      // Update Weather & Atmosphere
      weatherMgr.update(delta, controller.position);
      environmentFx.update(delta);

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
        const enteredPoi = foundNearPoi;
        const previousPoiId = nearPoiRef.current?.id;
        nearPoiRef.current = foundNearPoi;
        if (onNearPoiChange) onNearPoiChange(foundNearPoi);
        if (enteredPoi && shouldAutoActivatePoi(enteredPoi.id, previousPoiId) && onInteractWithPoiRef.current) {
          onInteractWithPoiRef.current(enteredPoi);
          audioDsp.playHarvestChime();
        }
      }

      beaconVisuals.forEach(({ poi, beam, ring, core }) => {
        const distance = Math.hypot(controller.position.x - poi.coords.x, controller.position.z - poi.coords.z);
        const isNearby = distance < 12;
        beam.visible = isNearby;
        const proximity = isNearby ? THREE.MathUtils.clamp(1 - distance / 12, 0, 1) : 0;
        (beam.material as THREE.MeshBasicMaterial).opacity = 0.08 + proximity * 0.32;
        ring.scale.setScalar(1 + proximity * 0.18 + Math.sin(elapsedTime * 3.2) * 0.035);
        (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75 + proximity * 1.4;
      });

      let nearestPlot: PlantPlot | null = null;
      let nearestPlotDistance = 4.2;
      for (const plot of plantPlotsRef.current) {
        if (!plot.isUnlocked) continue;
        const distance = Math.hypot(controller.position.x - plot.coords.x, controller.position.z - plot.coords.z);
        if (distance < nearestPlotDistance) {
          nearestPlot = plot;
          nearestPlotDistance = distance;
        }
      }
      nearPlantPlotRef.current = nearestPlot;

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

      // Trigger each checkpoint once on entry; remain latched until the player leaves its radius.
      const activeMissionIds = new Set<string>();
      dynamicMissionsRef.current.forEach((dm) => {
        if (dm.status !== 'active') return;
        activeMissionIds.add(dm.id);
        const distToDm = controller.position.distanceTo(
          new THREE.Vector3(dm.targetCoords.x, 0, dm.targetCoords.z)
        );
        if (shouldTriggerMissionCheckpoint(missionProximityLatch, dm.id, distToDm, 3.2)) {
          onCompleteDynamicMissionRef.current?.(dm.id);
          audioDsp.playHarvestChime();
        }
      });
      missionProximityLatch.forEach((missionId) => {
        if (!activeMissionIds.has(missionId)) missionProximityLatch.delete(missionId);
      });

      // Monument animations
      sphereMesh.position.y = 1.8 + Math.sin(elapsedTime * 2.2) * 0.25;

      if (autoSpinCube) {
        cubeMesh.rotation.y += 0.009;
        cubeMesh.rotation.x += 0.004;
      }

      composer.render();
      const nextPixelRatio = renderBudget.sample(currentTime - lastRenderedTime);
      lastRenderedTime = currentTime;
      if (nextPixelRatio !== null) {
        renderer.setPixelRatio(nextPixelRatio);
        composer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
      }
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
      environmentFx.dispose();
      environmentFxRef.current = null;
      groundRequestCancelled = true;
      groundAbortController.abort();
      terrainMaterialRef.current?.dispose();
      osmGroundTextureRef.current?.dispose();
      classicGroundTextureRef.current?.dispose();
      satelliteGroundTextureRef.current?.dispose();
      hybridGroundTextureRef.current?.dispose();
      characterRigRef.current?.setGltfModel(null);
      terrainMaterialRef.current = null;
      osmGroundTextureRef.current = null;
      classicGroundTextureRef.current = null;
      satelliteGroundTextureRef.current = null;
      hybridGroundTextureRef.current = null;
      satelliteRasterCanvasRef.current = null;
      osmElementsRef.current = [];
      if (gardenPlotGroupRef.current) {
        scene.remove(gardenPlotGroupRef.current);
        disposePlantPlotModels(gardenPlotGroupRef.current);
        gardenPlotGroupRef.current = null;
      }
      spatialSoundManager.stopAll();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const current = gardenPlotGroupRef.current;
    const parent = current?.parent;
    if (!current || !parent) return;
    const next = buildPlantPlotModels(plantPlots);
    parent.add(next);
    parent.remove(current);
    disposePlantPlotModels(current);
    gardenPlotGroupRef.current = next;
  }, [plantPlots]);

  // Update Weather dynamically
  useEffect(() => {
    if (weatherManagerRef.current) {
      weatherManagerRef.current.setWeather(weather, true);
    }
    environmentFxRef.current?.setWeatherState(weather);
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

  const selectGroundLayer = (nextLayer: 'osm' | 'classic' | 'satellite' | 'hybrid') => {
    let nextTexture: THREE.CanvasTexture | null = null;
    if (nextLayer === 'classic') nextTexture = classicGroundTextureRef.current;
    if (nextLayer === 'osm') nextTexture = osmGroundTextureRef.current;
    if (nextLayer === 'satellite') nextTexture = satelliteGroundTextureRef.current;
    if (nextLayer === 'hybrid' && satelliteRasterCanvasRef.current && osmElementsRef.current.length) {
      hybridGroundTextureRef.current?.dispose();
      const canvas = document.createElement('canvas');
      canvas.width = satelliteRasterCanvasRef.current.width;
      canvas.height = satelliteRasterCanvasRef.current.height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(satelliteRasterCanvasRef.current, 0, 0, canvas.width, canvas.height);
        const overlay = createOpenStreetMapGroundTexture(osmElementsRef.current, { transparentBackground: true });
        context.globalAlpha = 0.9;
        context.drawImage(overlay.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
        overlay.dispose();
        nextTexture = new THREE.CanvasTexture(canvas);
        nextTexture.colorSpace = THREE.SRGBColorSpace;
        nextTexture.anisotropy = terrainMaterialRef.current?.map?.anisotropy ?? 1;
        hybridGroundTextureRef.current = nextTexture;
      }
    }
    const material = terrainMaterialRef.current;
    if (!nextTexture || !material) {
      setMapImportStatus(nextLayer === 'hybrid' ? 'Hibrid zahteva raster i OSM podatke.' : 'Najpre uvezi GeoTIFF/učitaj podlogu.');
      return;
    }
    setGroundLayer(nextLayer);
    material.map = nextTexture;
    material.needsUpdate = true;
    if (nextLayer !== 'hybrid' && hybridGroundTextureRef.current) {
      hybridGroundTextureRef.current.dispose();
      hybridGroundTextureRef.current = null;
    }
    setMapImportStatus('');
    audioDsp.playRotateTick();
  };

  const handleTerrainRasterImport = async (file?: File) => {
    if (!file) return;
    if (!terrainRef.current) {
      setMapImportStatus('DEM još nije spreman; sačekaj učitavanje pa probaj ponovo.');
      return;
    }
    setMapImportStatus('Čitam GeoTIFF i poravnavam ga sa DEM-om…');
    try {
      const canvas = await importTerrainGeoTiff(file, terrainRef.current);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = terrainMaterialRef.current?.map?.anisotropy ?? 1;
      satelliteGroundTextureRef.current?.dispose();
      satelliteGroundTextureRef.current = texture;
      satelliteRasterCanvasRef.current = canvas;
      setSatelliteReady(true);
      selectGroundLayer('satellite');
      setMapImportStatus(`Satelitski GeoTIFF učitan: ${file.name}`);
    } catch (error) {
      setMapImportStatus(error instanceof Error ? error.message : 'GeoTIFF import nije uspeo.');
    }
  };

  const handleCharacterGlbImport = async (file?: File) => {
    if (!file) return;
    setCharacterModelStatus('Učitavam glTF skinning i animacije…');
    try {
      const result = await parseLocalCharacterGlb(file);
      characterRigRef.current?.setGltfModel(result.scene, result.animations);
      setHasImportedCharacter(true);
      const animationLabel = result.animations.length ? `${result.animations.length} animacija` : 'bez animacija';
      setCharacterModelStatus(`${file.name} · ${result.hasSkinnedMesh ? 'skinned mesh' : 'rig bez SkinnedMesh'} · ${animationLabel}`);
    } catch (error) {
      setCharacterModelStatus(error instanceof Error ? error.message : 'GLB import nije uspeo.');
    }
  };

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {webglError && (
        <div role="status" className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-slate-950/90 p-6 text-center font-mono text-slate-100 shadow-2xl backdrop-blur">
          <div className="max-w-md">
            <div className="text-sm font-black tracking-widest text-fuchsia-300">3D RENDERER PAUSED</div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">Ovaj browser blokira WebGL2. HUD, misije, POI akcije i intro ostaju dostupni; otvori preview u Chrome-u sa uključenim hardverskim ubrzanjem za punu 3D scenu.</p>
            <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-950/30 px-3 py-2 text-[10px] font-bold text-cyan-200">VAŠARIŠTE: priđi markeru → auto misija ili E / KLIK → razgovor</div>
          </div>
        </div>
      )}
      <div className="pointer-events-auto absolute bottom-3 left-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 font-mono">
        <label className="rounded-lg border border-emerald-400/50 bg-slate-950/85 px-2 py-1.5 text-[10px] font-black text-emerald-200 shadow-lg backdrop-blur">
          PODLOGA
          <select
            aria-label="Izaberite teksturu terena"
            value={groundLayer}
            onChange={(event) => selectGroundLayer(event.target.value as 'osm' | 'classic' | 'satellite' | 'hybrid')}
            className="ml-1 bg-transparent text-emerald-100 outline-none"
          >
            <option value="classic">stilizovana</option>
            <option value="osm" disabled={!osmMapReady}>{osmMapReady ? 'OSM' : 'OSM učitavanje…'}</option>
            <option value="satellite" disabled={!satelliteReady}>satelit</option>
            <option value="hybrid" disabled={!satelliteReady || !osmMapReady}>hibrid</option>
          </select>
        </label>
        <button type="button" onClick={() => mapFileInputRef.current?.click()} disabled={demStatus !== 'ready'} className="rounded-lg border border-cyan-400/50 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-black text-cyan-200 shadow-lg backdrop-blur disabled:opacity-50">
          UVEZI GeoTIFF
        </button>
        <input ref={mapFileInputRef} type="file" accept=".tif,.tiff,image/tiff" className="hidden" onChange={(event) => { void handleTerrainRasterImport(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        <button type="button" onClick={() => characterFileInputRef.current?.click()} className="rounded-lg border border-fuchsia-400/50 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-black text-fuchsia-200 shadow-lg backdrop-blur">
          UVEZI GLB LIK
        </button>
        {hasImportedCharacter && <button type="button" onClick={() => { characterRigRef.current?.setGltfModel(null); setHasImportedCharacter(false); setCharacterModelStatus('Vraćen proceduralni avatar.'); }} className="rounded-lg border border-slate-400/50 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-black text-slate-200 shadow-lg backdrop-blur">VRATI ORIGINAL</button>}
        <input ref={characterFileInputRef} type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={(event) => { void handleCharacterGlbImport(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        {satelliteReady && <label className="flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-slate-950/85 px-2 py-1 text-[9px] text-cyan-100 shadow backdrop-blur"><span>IZVOR/LICENCA</span><input aria-label="Atribucija satelitskog rastera" value={satelliteAttribution} onChange={(event) => setSatelliteAttribution(event.target.value)} placeholder="npr. Copernicus Sentinel-2" className="w-36 bg-transparent text-white outline-none placeholder:text-slate-400" /></label>}
        {mapImportStatus && <span role="status" className="max-w-80 rounded-md bg-slate-950/85 px-2 py-1 text-[9px] leading-relaxed text-slate-100 shadow backdrop-blur">{mapImportStatus}</span>}
        {characterModelStatus && <span role="status" className="max-w-80 rounded-md bg-slate-950/85 px-2 py-1 text-[9px] leading-relaxed text-slate-100 shadow backdrop-blur">{characterModelStatus}</span>}
        {osmMapReady && (groundLayer === 'osm' || groundLayer === 'hybrid') && (
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-slate-950/80 px-2 py-1 text-[9px] text-slate-200 underline decoration-emerald-400/70 underline-offset-2 shadow backdrop-blur"
          >
            © OpenStreetMap contributors · ODbL
          </a>
        )}
        {osmMapFailed && <span className="rounded-md bg-slate-950/80 px-2 py-1 text-[9px] text-amber-200 shadow backdrop-blur">OSM nije dostupan; hibridni layer nije spreman.</span>}
        <span className={`rounded-md bg-slate-950/80 px-2 py-1 text-[9px] shadow backdrop-blur ${demStatus === 'ready' ? 'text-cyan-200' : demStatus === 'failed' ? 'text-amber-200' : 'text-slate-300'}`}>
          {demStatus === 'ready' ? 'RELJEF: COPERNICUS GLO-30 · ČAČALICA +74 m' : demStatus === 'failed' ? 'RELJEF: RAVNA PODLOGA (DEM NEDOSTUPAN)' : 'RELJEF: UČITAVAM GLO-30…'}
        </span>
        {demStatus === 'ready' && (
          <a
            href="https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM"
            target="_blank"
            rel="noreferrer"
            title="© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"
            className="rounded-md bg-slate-950/80 px-2 py-1 text-[9px] text-slate-200 underline decoration-cyan-400/70 underline-offset-2 shadow backdrop-blur"
          >
            © DLR e.V. 2010–2014; © Airbus Defence and Space GmbH 2014–2018 · Copernicus/EU/ESA
          </a>
        )}
      </div>
    </div>
  );
};
