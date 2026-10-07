import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { audioDsp } from '../services/audioDsp';
import { CharacterStats, Quest } from '../services/characterProgress';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { createPožarevacSatelliteTexture } from '../services/satelliteTexture';
import { TrafficSystem } from '../services/trafficSystem';
import { WeatherSystem, WeatherState } from '../services/weatherSystem';
import {
  buildThugCharacter,
  ThugOutfitId,
  CharacterRig,
  CustomCharacterConfig,
} from '../services/characterModel';
import { ThirdPersonController } from '../services/thirdPersonController';

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
  onInteractWithPoi?: (poi: PožarevacPoi) => void;
  onNearPoiChange?: (poi: PožarevacPoi | null) => void;
  nearPoi?: PožarevacPoi | null;
  outfit?: ThugOutfitId;
  customConfig?: CustomCharacterConfig;
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
  characterStats,
  onUpdateCharacterPosition,
  onCompleteQuest,
  quests,
  onInteractWithPoi,
  onNearPoiChange,
  outfit = 'classic',
  customConfig,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cubeMeshRef = useRef<THREE.Mesh | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const nearPoiRef = useRef<PožarevacPoi | null>(null);
  const weatherSystemRef = useRef<WeatherSystem | null>(null);
  const trafficSystemRef = useRef<TrafficSystem | null>(null);
  const characterRigRef = useRef<CharacterRig | null>(null);
  const controllerRef = useRef<ThirdPersonController | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x1e293b, 0.007);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 3.2, 5.8);

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
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Post-Processing: EffectComposer & UnrealBloomPass
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomEnabled ? bloomStrength : 0.0,
      0.45,
      0.18
    );
    bloomPassRef.current = bloomPass;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 3. Clear Daylight & Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x8fa4be, 2.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e4, 3.8);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // Dynamic Weather System
    const weatherSys = new WeatherSystem(scene, ambientLight, sunLight);
    weatherSystemRef.current = weatherSys;

    // 4. CRISP HIGH-DEFINITION POŽAREVAC SATELLITE GROUND PLANE
    const terrainSize = 78;
    const groundGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    const satTexture = createPožarevacSatelliteTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: satTexture,
      roughness: 0.6,
      metalness: 0.15,
    });
    weatherSys.setTerrainMaterial(terrainMat);

    const groundMesh = new THREE.Mesh(groundGeo, terrainMat);
    groundMesh.receiveShadow = true;
    groundMesh.name = 'Požarevac Centar (Satelitska Mapa)';
    scene.add(groundMesh);

    // 5. 3D RAISED SIDEWALKS & STREET CURBS ALONG TABAČKA ČARŠIJA
    const sidewalksGroup = new THREE.Group();
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const sidewalkPavingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });

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

    // 6. 3D URBAN BUILDINGS ALONG POŽAREVAC BLOCKS
    const buildingsGroup = new THREE.Group();
    const buildingColors = [0x334155, 0x3f4e65, 0x475569, 0x2e3846, 0x52525b];
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });

    const createCityBuilding = (x: number, z: number, w: number, h: number, d: number) => {
      const bColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.4, metalness: 0.4 });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(x, h / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;

      const winGeo = new THREE.PlaneGeometry(w * 0.75, h * 0.65);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.set(x, h * 0.55, z + d / 2 + 0.05);
      buildingsGroup.add(building, win);
    };

    const blockPositions = [
      { x: -9, z: -18, w: 5, h: 10, d: 14 },
      { x: -9, z: -3, w: 5, h: 14, d: 12 },
      { x: -9, z: 14, w: 5, h: 11, d: 14 },
      { x: 9, z: -18, w: 5, h: 12, d: 14 },
      { x: 9, z: -3, w: 5, h: 15, d: 12 },
      { x: 9, z: 14, w: 5, h: 10, d: 14 },
      { x: -18, z: -15, w: 8, h: 9, d: 10 },
      { x: 18, z: -15, w: 8, h: 11, d: 10 },
    ];

    blockPositions.forEach((b) => createCityBuilding(b.x, b.z, b.w, b.h, b.d));
    scene.add(buildingsGroup);

    // 7. STREETLIGHTS ALONG TABAČKA ČARŠIJA
    const streetLightGroup = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    const createStreetLamp = (x: number, z: number) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2), poleMat);
      pole.position.set(x, 2.1, z);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff0aa }));
      lampHead.position.set(x, 4.2, z);

      const lampLight = new THREE.PointLight(0xfff0aa, 2.8, 14);
      lampLight.position.set(x, 4.0, z);

      streetLightGroup.add(pole, lampHead, lampLight);
    };

    [-22, -11, 0, 11, 22].forEach((zPos) => {
      createStreetLamp(-3.8, zPos);
      createStreetLamp(3.8, zPos);
    });
    scene.add(streetLightGroup);

    // 8. TREES IN GRADSKI PARK
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

    // 9. AI TRAFFIC SYSTEM
    const traffic = new TrafficSystem(scene);
    trafficSystemRef.current = traffic;

    // 10. 3D INTERACTIVE POI BEACONS
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

    // 11. BUILD 3D THUG CHARACTER
    const characterRig = buildThugCharacter(outfit);
    characterRigRef.current = characterRig;
    characterRig.rootGroup.position.set(0, 0, 0);
    characterRig.setPlayerTag(characterStats.rankTitle || 'BRATINA', characterStats.level);
    if (customConfig) {
      characterRig.setCustomConfig(customConfig);
    }
    scene.add(characterRig.rootGroup);

    // 12. INITIALIZE SMOOTH THIRD-PERSON CONTROLLER
    const controller = new ThirdPersonController({
      camera,
      characterGroup: characterRig.rootGroup,
      domElement: renderer.domElement,
      initialPosition: new THREE.Vector3(0, 0, 0),
      walkSpeed: 4.8 * (characterStats.moveSpeed || 1),
      runSpeed: 8.8 * (characterStats.moveSpeed || 1),
      jumpPower: 7.8 * (characterStats.jumpPower || 1),
    });
    controller.setMode(cameraMode);
    controllerRef.current = controller;

    // 13. Interactive Quantum Cube and Genetic Sphere Monuments
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
    cubeMesh.name = 'Quantum Cube';
    scene.add(cubeMesh);
    cubeMeshRef.current = cubeMesh;

    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    const cubeWire = new THREE.LineSegments(cubeEdges, lineMaterial);
    cubeMesh.add(cubeWire);

    const sphereGeometry = new THREE.SphereGeometry(1.2, 36, 36);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sphereColor),
      roughness: 0.1,
      metalness: 0.9,
      emissive: new THREE.Color(0x55002a),
      emissiveIntensity: 0.7,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(5.5, 1.8, 6.0);
    sphereMesh.castShadow = true;
    sphereMesh.name = 'Genetic Sphere';
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // 14. Raycaster click interaction for Monuments and POI
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      // Ignore click if mouse was dragging/orbiting camera
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([cubeMesh, sphereMesh]);
      if (intersects.length === 0) return;

      const topObj = intersects[0].object;
      if (topObj === sphereMesh) {
        audioDsp.playQuantumBurst();
        if (onSelectObject) onSelectObject('Genetic Sphere');
        sphereMesh.scale.set(1.35, 1.35, 1.35);
        setTimeout(() => sphereMesh.scale.set(1, 1, 1), 220);
        if (onScoreIncrement) onScoreIncrement(25);
      } else if (topObj === cubeMesh || topObj.parent === cubeMesh) {
        audioDsp.playRotateTick();
        if (onSelectObject) onSelectObject('Quantum Cube');
        cubeMesh.rotation.y += Math.PI / 4;
        if (onCubeRotated) {
          onCubeRotated({
            x: cubeMesh.rotation.x,
            y: cubeMesh.rotation.y,
            z: cubeMesh.rotation.z,
          });
        }
      }
    };

    // Keyboard 'E' interaction with POI
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && nearPoiRef.current) {
        if (onInteractWithPoi) {
          onInteractWithPoi(nearPoiRef.current);
          audioDsp.playHarvestChime();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    renderer.domElement.addEventListener('click', onClick);

    // 15. Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };
    window.addEventListener('resize', onResize);

    // 16. 60FPS Game Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // SMOOTH THIRD-PERSON CONTROLLER UPDATE
      // Maps WASD to camera-relative movement and smoothly updates character heading & position
      const moveState = controller.update(delta, characterStats.moveSpeed || 1.0);

      // Procedural limb animation on rigged character
      characterRig.updateAnimation(
        delta,
        moveState.isMoving,
        moveState.isRunning,
        moveState.isJumping
      );

      // Update AI Traffic Vehicles
      traffic.update(delta, controller.position);

      // Update Dynamic Weather
      weatherSys.update(delta, controller.position);

      // Animate POI Crystal Cores
      coresList.forEach((core, i) => {
        core.rotation.y += 0.02;
        core.position.y = 2.4 + Math.sin(elapsedTime * 2.5 + i) * 0.25;
      });

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

      // Check quest beacons distance
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
      weatherSys.dispose();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Weather dynamically
  useEffect(() => {
    if (weatherSystemRef.current) {
      weatherSystemRef.current.setWeather(weather);
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
