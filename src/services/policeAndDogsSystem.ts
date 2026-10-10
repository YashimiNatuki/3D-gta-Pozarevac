import * as THREE from 'three';
import { audioDsp } from './audioDsp';
import { geminiStoryEngine } from './geminiStoryEngine';
import { audioLocalizationManager } from './audioLocalizationManager';
import { SpatialHash2D } from './spatialHash';
import { samplePozarevacTerrainGrade } from './terrainHeightfield';
import type { PozarevacDemHeightfield } from './terrainHeightfield';
import { findApproachingVehicleThreat, type PedestrianVehicleThreat } from './pedestrianPanic';

type PoliceAIState = 'patrol' | 'investigate' | 'intercept' | 'pursuit' | 'arrest';
type DogAIState = 'idle' | 'sniffing' | 'barking' | 'chasing' | 'pack-alert';
type AIContact = { kind: 'dog' | 'police' | 'pursuit'; index: number };

export interface StreetDog {
  group: THREE.Group;
  name: string;
  legs: THREE.Mesh[];
  tail: THREE.Mesh;
  barkIndicator: THREE.Mesh;
  state: DogAIState;
  patrolCenter: THREE.Vector3;
  patrolRadius: number;
  speed: number;
  angle: number;
  lastBarkTime: number;
  alertUntil: number;
  targetMemory: THREE.Vector3;
}

export interface PoliceCar {
  group: THREE.Group;
  sirenRed: THREE.PointLight;
  sirenBlue: THREE.PointLight;
  lightBarRedMesh: THREE.Mesh;
  lightBarBlueMesh: THREE.Mesh;
  speed: number;
  currentWaypoint: number;
  path: THREE.Vector3[];
  isPursuit?: boolean;
  aiState: PoliceAIState;
  suspicion: number;
  lastKnownPlayer: THREE.Vector3;
  searchUntil: number;
  formationSlot: number;
}

export interface Pedestrian {
  group: THREE.Group;
  gender: 'male' | 'female';
  legs: THREE.Mesh[];
  arms: THREE.Mesh[];
  path: THREE.Vector3[];
  waypointIndex: number;
  speed: number;
  name: string;
  mood: 'chill' | 'shocked' | 'hyped' | 'curious' | 'panicking';
  velocity: THREE.Vector3;
  panicUntil: number;
  panicBubbleUntil: number;
  panicDirection: THREE.Vector3;
  overheadBubble: THREE.Mesh;
  bubbleCanvas: HTMLCanvasElement;
  bubbleTexture: THREE.CanvasTexture;
  lastMoodChangeTime: number;
  lastSpokenTime: number;
  nextBanterDelayMs: number;
}

export class PoliceAndDogsSystem {
  private scene: THREE.Scene;
  public dogs: StreetDog[] = [];
  public policeCars: PoliceCar[] = [];
  public pursuitCruisers: PoliceCar[] = [];
  public pedestrians: Pedestrian[] = [];
  private sirenFlashTimer: number = 0;
  private redActive: boolean = true;
  private lastSirenSoundTime: number = 0;
  private readonly awarenessHash = new SpatialHash2D<AIContact>(8);
  private readonly aiBounds = 0.65;

  constructor(scene: THREE.Scene, private readonly getGroundHeight: (x: number, z: number) => number = () => 0) {
    this.scene = scene;
    this.spawnDogs();
    this.spawnPoliceCar(); // Base patrol cruiser
    this.spawnPedestrians();
  }

  // --- 1. LOW-POLY 3D STREET DOGS ---
  private spawnDogs() {
    const dogConfigs = [
      { name: 'Džeki (Lutalica)', color: 0x8b5a2b, startPos: new THREE.Vector3(-10, 0, 8), radius: 6 },
      { name: 'Rex (Čuvar Parka)', color: 0x221d1a, startPos: new THREE.Vector3(-8, 0, 12), radius: 7 },
      { name: 'Žuća sa Tabačke', color: 0xd4a373, startPos: new THREE.Vector3(-4, 0, -8), radius: 5 },
      { name: 'Bobi sa Korzoa', color: 0x6b7280, startPos: new THREE.Vector3(7, 0, -5), radius: 6 },
    ];

    dogConfigs.forEach((cfg) => {
      const dogGroup = new THREE.Group();
      dogGroup.position.copy(cfg.startPos);

      const dogMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

      // Body (Torso)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.75), dogMat);
      body.position.y = 0.4;
      body.castShadow = true;
      dogGroup.add(body);

      // Neck & Head
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.55, 0.38);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.32), dogMat);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), dogMat);
      snout.position.set(0, -0.06, 0.2);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), darkMat);
      nose.position.set(0, -0.04, 0.32);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.07, 0.16, 4);
      const leftEar = new THREE.Mesh(earGeo, dogMat);
      leftEar.position.set(-0.1, 0.18, 0.02);
      const rightEar = new THREE.Mesh(earGeo, dogMat);
      rightEar.position.set(0.1, 0.18, 0.02);

      headGroup.add(head, snout, nose, leftEar, rightEar);
      dogGroup.add(headGroup);

      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6), dogMat);
      tail.position.set(0, 0.5, -0.42);
      tail.rotation.x = -Math.PI / 4;
      dogGroup.add(tail);

      // 4 Legs
      const legGeo = new THREE.BoxGeometry(0.09, 0.32, 0.1);
      const legPositions = [
        [-0.12, 0.16, 0.25],
        [0.12, 0.16, 0.25],
        [-0.12, 0.16, -0.25],
        [0.12, 0.16, -0.25],
      ];
      const legs: THREE.Mesh[] = [];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, dogMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        dogGroup.add(leg);
        legs.push(leg);
      });

      // Barking indicator billboard: "AV! 🐕"
      const barkCanvas = document.createElement('canvas');
      barkCanvas.width = 128;
      barkCanvas.height = 64;
      const bCtx = barkCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        bCtx.roundRect(4, 4, 120, 56, 12);
        bCtx.fill();
        bCtx.strokeStyle = '#f59e0b';
        bCtx.lineWidth = 3;
        bCtx.stroke();
        bCtx.font = 'bold 26px sans-serif';
        bCtx.fillStyle = '#ffffff';
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.fillText('AV! 🐶', 64, 32);
      }
      const barkTex = new THREE.CanvasTexture(barkCanvas);
      const barkIndicator = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.45),
        new THREE.MeshBasicMaterial({ map: barkTex, transparent: true, side: THREE.DoubleSide })
      );
      barkIndicator.position.set(0, 1.15, 0);
      barkIndicator.visible = false;
      dogGroup.add(barkIndicator);

      this.scene.add(dogGroup);

      this.dogs.push({
        group: dogGroup,
        name: cfg.name,
        legs,
        tail,
        barkIndicator,
        state: 'idle',
        patrolCenter: cfg.startPos.clone(),
        patrolRadius: cfg.radius,
        speed: 2.2,
        angle: Math.random() * Math.PI * 2,
        lastBarkTime: 0,
        alertUntil: 0,
        targetMemory: cfg.startPos.clone(),
      });
    });
  }

  // --- 2. BUILD POLICE CRUISER MODEL ---
  private buildPoliceCarModel(): {
    group: THREE.Group;
    sirenRed: THREE.PointLight;
    sirenBlue: THREE.PointLight;
    lightBarRedMesh: THREE.Mesh;
    lightBarBlueMesh: THREE.Mesh;
  } {
    const policeGroup = new THREE.Group();
    const carLength = 3.6;
    const carWidth = 1.7;
    const carHeight = 1.1;

    // Body: White & Blue Police scheme
    const bodyGeo = new THREE.BoxGeometry(carWidth, carHeight * 0.55, carLength);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = carHeight * 0.45;
    body.castShadow = true;
    policeGroup.add(body);

    // Blue side stripe
    const stripeGeo = new THREE.BoxGeometry(carWidth + 0.02, 0.22, carLength * 0.95);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, carHeight * 0.45, 0);
    policeGroup.add(stripe);

    // Roof / Cabin with dark windows
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth * 0.85, carHeight * 0.5, carLength * 0.52),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
    );
    cabin.position.set(0, carHeight * 0.85, -carLength * 0.05);
    cabin.castShadow = true;
    policeGroup.add(cabin);

    // Lightbar on roof (Red & Blue flashing)
    const barBase = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth * 0.65, 0.08, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    barBase.position.set(0, carHeight * 1.12, -carLength * 0.05);
    policeGroup.add(barBase);

    const lightGeo = new THREE.BoxGeometry(carWidth * 0.28, 0.16, 0.22);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const redMesh = new THREE.Mesh(lightGeo, redLightMat);
    redMesh.position.set(-carWidth * 0.16, carHeight * 1.2, -carLength * 0.05);
    const blueMesh = new THREE.Mesh(lightGeo, blueLightMat);
    blueMesh.position.set(carWidth * 0.16, carHeight * 1.2, -carLength * 0.05);
    policeGroup.add(redMesh, blueMesh);

    // Point lights for flashing sirens with wide cast
    const sirenRed = new THREE.PointLight(0xff0033, 0, 22, 1.8);
    sirenRed.position.set(-carWidth * 0.2, carHeight * 1.35, -carLength * 0.05);
    const sirenBlue = new THREE.PointLight(0x0077ff, 0, 22, 1.8);
    sirenBlue.position.set(carWidth * 0.2, carHeight * 1.35, -carLength * 0.05);
    policeGroup.add(sirenRed, sirenBlue);

    // Headlights
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    const headLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const leftHead = new THREE.Mesh(headLightGeo, headLightMat);
    leftHead.position.set(-0.6, carHeight * 0.45, carLength * 0.48);
    const rightHead = new THREE.Mesh(headLightGeo, headLightMat);
    rightHead.position.set(0.6, carHeight * 0.45, carLength * 0.48);
    policeGroup.add(leftHead, rightHead);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    [
      [-carWidth / 2 - 0.05, 0.32, carLength / 3],
      [carWidth / 2 + 0.05, 0.32, carLength / 3],
      [-carWidth / 2 - 0.05, 0.32, -carLength / 3],
      [carWidth / 2 + 0.05, 0.32, -carLength / 3],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      policeGroup.add(wheel);
    });

    return {
      group: policeGroup,
      sirenRed,
      sirenBlue,
      lightBarRedMesh: redMesh,
      lightBarBlueMesh: blueMesh,
    };
  }

  // Spawn fixed patrol car
  private spawnPoliceCar() {
    const car = this.buildPoliceCarModel();
    const policePath = [
      new THREE.Vector3(-1.6, 0.35, -26),
      new THREE.Vector3(-1.6, 0.35, 0),
      new THREE.Vector3(-1.6, 0.35, 26),
      new THREE.Vector3(-20, 0.35, 26),
      new THREE.Vector3(-20, 0.35, -26),
    ];
    car.group.position.copy(policePath[0]);
    this.scene.add(car.group);

    this.policeCars.push({
      ...car,
      speed: 6.2,
      currentWaypoint: 0,
      path: policePath,
      isPursuit: false,
      aiState: 'patrol',
      suspicion: 0,
      lastKnownPlayer: policePath[0].clone(),
      searchUntil: 0,
      formationSlot: 0,
    });
  }

  // --- DYNAMIC PURSUIT CRUISERS (HOT PURSUIT) ---
  private syncPursuitCruisers(wantedLevel: number, playerPos: THREE.Vector3) {
    // Target pursuit count: 0 if wantedLevel === 0, 1 for wanted 1, 2 for wanted 2-3, 3 for wanted 4-5
    const targetCount = wantedLevel === 0 ? 0 : Math.min(3, Math.ceil(wantedLevel * 0.7));

    // Remove excess pursuit cruisers
    while (this.pursuitCruisers.length > targetCount) {
      const cruiser = this.pursuitCruisers.pop();
      if (cruiser) {
        this.scene.remove(cruiser.group);
      }
    }

    // Spawn new pursuit cruisers if below target
    while (this.pursuitCruisers.length < targetCount) {
      const cruiser = this.buildPoliceCarModel();
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = 28 + Math.random() * 8;
      cruiser.group.position.set(
        playerPos.x + Math.cos(angle) * spawnDist,
        0.35,
        playerPos.z + Math.sin(angle) * spawnDist
      );
      this.scene.add(cruiser.group);

      this.pursuitCruisers.push({
        ...cruiser,
        speed: 8.5 + wantedLevel * 0.8, // Faster during hot pursuit!
        currentWaypoint: 0,
        path: [],
        isPursuit: true,
        aiState: 'pursuit',
        suspicion: 1,
        lastKnownPlayer: playerPos.clone(),
        searchUntil: 0,
        formationSlot: this.pursuitCruisers.length,
      });
    }
  }

  // --- 3. PEDESTRIANS ON SIDEWALKS WITH MOOD BUBBLES ---
  private spawnPedestrians() {
    const pedConfigs = [
      {
        name: 'Milan (Tabačka)',
        gender: 'male' as const,
        color: 0x0284c7,
        path: [
          new THREE.Vector3(2.5, 0, -18),
          new THREE.Vector3(2.5, 0, 18),
          new THREE.Vector3(2.5, 0, -18),
        ],
      },
      {
        name: 'Jelena (Korzo)',
        gender: 'female' as const,
        color: 0xec4899,
        path: [
          new THREE.Vector3(-3.5, 0, 12),
          new THREE.Vector3(-3.5, 0, -12),
          new THREE.Vector3(-3.5, 0, 12),
        ],
      },
      {
        name: 'Goran (Čačalica)',
        gender: 'male' as const,
        color: 0x10b981,
        path: [
          new THREE.Vector3(62, 0, 48),
          new THREE.Vector3(70, 0, 52),
          new THREE.Vector3(62, 0, 48),
        ],
      },
      {
        name: 'Bane (Centar)',
        gender: 'male' as const,
        color: 0xf59e0b,
        path: [
          new THREE.Vector3(-10, 0, 6),
          new THREE.Vector3(-10, 0, 14),
          new THREE.Vector3(-10, 0, 6),
        ],
      },
      {
        name: 'Milica (Busije)',
        gender: 'female' as const,
        color: 0xa855f7,
        path: [
          new THREE.Vector3(-25, 0, -4),
          new THREE.Vector3(-18, 0, -4),
          new THREE.Vector3(-25, 0, -4),
        ],
      },
    ];

    pedConfigs.forEach((cfg) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.copy(cfg.path[0]);

      const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), bodyMat);
      torso.position.y = 0.88;
      torso.castShadow = true;
      pedGroup.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
      head.position.y = 1.32;
      head.castShadow = true;
      pedGroup.add(head);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.1, 0.3, 0);
      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.1, 0.3, 0);
      pedGroup.add(leftLeg, rightLeg);

      // Overhead Mood & Emote Speech Bubble Billboard
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = 256;
      bubbleCanvas.height = 96;
      const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
      const bubbleMat = new THREE.MeshBasicMaterial({
        map: bubbleTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const overheadBubble = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.52),
        bubbleMat
      );
      overheadBubble.position.set(0, 1.85, 0);
      overheadBubble.visible = false;
      pedGroup.add(overheadBubble);

      this.scene.add(pedGroup);

      const pedItem: Pedestrian = {
        group: pedGroup,
        legs: [leftLeg, rightLeg],
        arms: [],
        path: cfg.path,
        waypointIndex: 0,
        speed: 1.4,
        name: cfg.name,
        gender: cfg.gender,
        mood: 'chill',
        overheadBubble,
        bubbleCanvas,
        bubbleTexture,
        lastMoodChangeTime: 0,
        lastSpokenTime: performance.now() + Math.random() * 9000,
        nextBanterDelayMs: 22000 + Math.random() * 12000,
        velocity: new THREE.Vector3(),
        panicUntil: 0,
        panicBubbleUntil: 0,
        panicDirection: new THREE.Vector3(),
      };

      this.renderPedestrianBubble(pedItem, '🕶️', 'Bratina!', '#0284c7');
      this.pedestrians.push(pedItem);
    });
  }

  public renderPedestrianBubble(
    ped: Pedestrian,
    emoji: string,
    text: string,
    accentColor: string
  ) {
    const ctx = ped.bubbleCanvas.getContext('2d');
    if (!ctx) return;
    const w = ped.bubbleCanvas.width;
    const h = ped.bubbleCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Bubble background badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 14);
    ctx.fill();

    // Accent border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Emote & Text
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${emoji} ${text}`, w / 2, h / 2);

    ped.bubbleTexture.needsUpdate = true;
  }

  private rebuildAwarenessHash(): void {
    this.awarenessHash.clear();
    this.dogs.forEach((dog, index) => this.awarenessHash.insert({ minX: dog.group.position.x - this.aiBounds, maxX: dog.group.position.x + this.aiBounds, minZ: dog.group.position.z - this.aiBounds, maxZ: dog.group.position.z + this.aiBounds, value: { kind: 'dog', index } }));
    this.policeCars.forEach((car, index) => this.awarenessHash.insert({ minX: car.group.position.x - 1.1, maxX: car.group.position.x + 1.1, minZ: car.group.position.z - 2, maxZ: car.group.position.z + 2, value: { kind: 'police', index } }));
    this.pursuitCruisers.forEach((car, index) => this.awarenessHash.insert({ minX: car.group.position.x - 1.1, maxX: car.group.position.x + 1.1, minZ: car.group.position.z - 2, maxZ: car.group.position.z + 2, value: { kind: 'pursuit', index } }));
  }

  private nearbyContacts(position: THREE.Vector3, radius: number): AIContact[] {
    return this.awarenessHash.query({ minX: position.x - radius, maxX: position.x + radius, minZ: position.z - radius, maxZ: position.z + radius });
  }

  private steerFromCrowd(position: THREE.Vector3, contacts: AIContact[], self: AIContact): THREE.Vector3 {
    const separation = new THREE.Vector3();
    contacts.forEach((contact) => {
      if (contact.kind === self.kind && contact.index === self.index) return;
      const other = contact.kind === 'dog' ? this.dogs[contact.index]?.group.position : contact.kind === 'police' ? this.policeCars[contact.index]?.group.position : this.pursuitCruisers[contact.index]?.group.position;
      if (!other) return;
      const dx = position.x - other.x;
      const dz = position.z - other.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq > 0.01 && distanceSq < 16) {
        const weight = 1 / distanceSq;
        separation.x += dx * weight;
        separation.z += dz * weight;
      }
    });
    return separation;
  }

  private updateDogAI(dog: StreetDog, idx: number, delta: number, now: number, playerPos: THREE.Vector3, cameraPos: THREE.Vector3, wantedLevel: number): void {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, dog.group.position);
    toPlayer.y = 0;
    const playerDistance = toPlayer.length();
    const nearby = this.nearbyContacts(dog.group.position, 7);
    const policeNearby = nearby.some((contact) => contact.kind !== 'dog');
    const threatRange = wantedLevel > 0 ? 7.5 : 4.2;
    const canSeePlayer = playerDistance < threatRange;
    if (canSeePlayer) dog.targetMemory.copy(playerPos);
    if (canSeePlayer || (wantedLevel > 0 && policeNearby && playerDistance < 12)) {
      dog.alertUntil = now + (wantedLevel > 0 ? 5000 : 2500);
      dog.state = wantedLevel > 0 && policeNearby ? 'pack-alert' : playerDistance < 2 ? 'barking' : 'chasing';
      dog.barkIndicator.visible = true;
      if (now - dog.lastBarkTime > (dog.state === 'pack-alert' ? 2800 : 4000)) {
        dog.lastBarkTime = now;
        audioDsp.playThugCoinSound();
        if (dog.state === 'pack-alert') geminiStoryEngine.triggerBanterShout('AV! Murija, igrač beži kroz reon!', { x: dog.group.position.x, y: 0.8, z: dog.group.position.z }, dog.name);
      }
    } else if (now < dog.alertUntil) {
      dog.state = 'sniffing';
      dog.barkIndicator.visible = false;
    } else {
      dog.state = 'idle';
      dog.barkIndicator.visible = false;
    }
    dog.barkIndicator.lookAt(cameraPos);
    if (dog.state === 'idle' || dog.state === 'sniffing') dog.angle += (dog.state === 'sniffing' ? 0.9 : 0.5) * delta;
    const target = dog.state === 'chasing' || dog.state === 'barking' || dog.state === 'pack-alert' ? dog.targetMemory : new THREE.Vector3(dog.patrolCenter.x + Math.cos(dog.angle) * dog.patrolRadius, 0, dog.patrolCenter.z + Math.sin(dog.angle) * dog.patrolRadius);
    const move = new THREE.Vector3().subVectors(target, dog.group.position);
    move.y = 0;
    move.addScaledVector(this.steerFromCrowd(dog.group.position, nearby, { kind: 'dog', index: idx }), 0.35);
    if (move.length() > 0.35 && !(dog.state === 'barking' && playerDistance < 1.2)) {
      move.normalize();
      dog.group.position.addScaledVector(move, dog.speed * (dog.state === 'pack-alert' ? 1.45 : dog.state === 'chasing' ? 1.3 : 1) * delta);
      dog.group.rotation.y = THREE.MathUtils.lerp(dog.group.rotation.y, Math.atan2(move.x, move.z), 0.16);
    }
    const legSwing = Math.sin(now * 0.012 + idx) * 0.35;
    dog.legs[0].rotation.x = legSwing;
    dog.legs[1].rotation.x = -legSwing;
    dog.legs[2].rotation.x = -legSwing;
    dog.legs[3].rotation.x = legSwing;
    dog.tail.rotation.y = Math.sin(now * 0.02) * (dog.state === 'barking' ? 0.12 : 0.45);
  }

  private updatePoliceAI(car: PoliceCar, index: number, delta: number, now: number, playerPos: THREE.Vector3, wantedLevel: number, pursuit: boolean): void {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, car.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    const hasLineOfInterest = distance < (pursuit ? 36 : 20) && wantedLevel > 0;
    if (hasLineOfInterest) {
      car.lastKnownPlayer.copy(playerPos);
      car.suspicion = Math.min(1, car.suspicion + delta * (pursuit ? 1.8 : 0.7));
      car.searchUntil = now + (pursuit ? 2500 : 5000);
    } else car.suspicion = Math.max(0, car.suspicion - delta * 0.12);
    if (pursuit) car.aiState = distance < 4.5 ? 'arrest' : 'pursuit';
    else if (car.suspicion > 0.55) car.aiState = distance < 9 ? 'intercept' : 'investigate';
    else if (now < car.searchUntil) car.aiState = 'investigate';
    else car.aiState = 'patrol';
    const target = car.aiState === 'pursuit' || car.aiState === 'intercept' ? playerPos.clone() : car.aiState === 'investigate' ? car.lastKnownPlayer : car.path[(car.currentWaypoint + 1) % car.path.length];
    if (pursuit && distance > 5) {
      const flank = (car.formationSlot - 1) * 0.55;
      target.x += Math.cos(flank) * 3.5;
      target.z += Math.sin(flank) * 3.5;
    }
    const move = new THREE.Vector3().subVectors(target, car.group.position);
    move.y = 0;
    move.addScaledVector(this.steerFromCrowd(car.group.position, this.nearbyContacts(car.group.position, 8), { kind: pursuit ? 'pursuit' : 'police', index }), 0.22);
    if (move.length() < (car.aiState === 'arrest' ? 3.2 : 0.8)) {
      if (!pursuit) car.currentWaypoint = (car.currentWaypoint + 1) % car.path.length;
    } else {
      move.normalize();
      const speed = pursuit ? car.speed : car.speed * (car.aiState === 'patrol' ? 1 : 1.25);
      car.group.position.addScaledVector(move, speed * delta);
      car.group.rotation.y = THREE.MathUtils.lerp(car.group.rotation.y, Math.atan2(move.x, move.z), pursuit ? 0.18 : 0.12);
    }
  }

  // --- 4. UPDATE LOOP ---
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    wantedLevel: number,
    cameraPos: THREE.Vector3,
    vehicleThreats: readonly PedestrianVehicleThreat[] = [],
    terrain: PozarevacDemHeightfield | null = null,
  ) {
    const now = performance.now();

    // Sync active hot pursuit police cruisers based on wantedLevel
    this.syncPursuitCruisers(wantedLevel, playerPos);

    // Audio sirens only during high-stakes pursuit (Wanted Level 3+) with distance attenuation
    if (wantedLevel >= 3 && now - this.lastSirenSoundTime > 8500) {
      // Find closest pursuit cruiser distance
      let minDist = 999;
      this.pursuitCruisers.forEach((c) => {
        const d = c.group.position.distanceTo(playerPos);
        if (d < minDist) minDist = d;
      });
      if (minDist < 35) {
        this.lastSirenSoundTime = now;
        audioDsp.playPoliceSirenSound(minDist);
      }
    }

    // 1. Rebuild local awareness grid, then run dog perception/pack AI.
    this.rebuildAwarenessHash();
    this.dogs.forEach((dog, idx) => {
      this.updateDogAI(dog, idx, delta, now, playerPos, cameraPos, wantedLevel);
      dog.group.position.y = this.getGroundHeight(dog.group.position.x, dog.group.position.z);
    });
    // 2. Update Flashing Sirens State
    this.sirenFlashTimer += delta;
    if (this.sirenFlashTimer > 0.16) {
      this.sirenFlashTimer = 0;
      this.redActive = !this.redActive;
    }

    // 2a/2b. Police finite-state AI: patrol, investigate, intercept, pursuit, arrest.
    this.policeCars.forEach((pCar, index) => {
      pCar.sirenRed.intensity = wantedLevel > 0 && this.redActive ? 8.0 : 0;
      pCar.sirenBlue.intensity = wantedLevel > 0 && !this.redActive ? 8.0 : 0;
      pCar.lightBarRedMesh.visible = wantedLevel === 0 || this.redActive;
      pCar.lightBarBlueMesh.visible = wantedLevel === 0 || !this.redActive;
      this.updatePoliceAI(pCar, index, delta, now, playerPos, wantedLevel, false);
      pCar.group.position.y = this.getGroundHeight(pCar.group.position.x, pCar.group.position.z) + 0.35;
    });
    this.pursuitCruisers.forEach((pCruiser, index) => {
      pCruiser.sirenRed.intensity = this.redActive ? 12.0 : 0;
      pCruiser.sirenBlue.intensity = !this.redActive ? 12.0 : 0;
      pCruiser.lightBarRedMesh.visible = this.redActive;
      pCruiser.lightBarBlueMesh.visible = !this.redActive;
      this.updatePoliceAI(pCruiser, index, delta, now, playerPos, wantedLevel, true);
      pCruiser.group.position.y = this.getGroundHeight(pCruiser.group.position.x, pCruiser.group.position.z) + 0.35;
    });
    // 3. Update Pedestrians
    this.pedestrians.forEach((ped, pIdx) => {
      const nearestThreat = findApproachingVehicleThreat(ped.group.position, vehicleThreats);

      if (nearestThreat && now >= ped.panicUntil) {
        ped.panicUntil = now + 2800 + Math.random() * 900;
        ped.panicBubbleUntil = now + 1800;
        ped.mood = 'panicking';
        ped.panicDirection.set(ped.group.position.x - nearestThreat.x, 0, ped.group.position.z - nearestThreat.z);
        if (ped.panicDirection.lengthSq() < 0.01) ped.panicDirection.set(-Math.sign(nearestThreat.x - ped.group.position.x || 1), 0, -Math.sign(nearestThreat.z - ped.group.position.z || 1));
        ped.panicDirection.normalize();
        ped.lastMoodChangeTime = now;
        this.renderPedestrianBubble(ped, '⚠', 'PAZI AUTO!', '#ef4444');
        audioLocalizationManager.playLocalizedSerbian(
          ped.gender === 'female' ? 'Pazi, auto! Skloni se sa puta!' : 'Pazi, auto ti prilazi! Beži sa puta!',
          { x: ped.group.position.x, y: ped.group.position.y + 1.3, z: ped.group.position.z },
          { gender: ped.gender, emotion: 'shout', gain: 0.7 },
        );
      }
      if (now >= ped.panicUntil && ped.mood === 'panicking') ped.mood = 'chill';

      const target = ped.mood === 'panicking'
        ? new THREE.Vector3(
          THREE.MathUtils.clamp(ped.group.position.x + ped.panicDirection.x * 10, -76, 76),
          0,
          THREE.MathUtils.clamp(ped.group.position.z + ped.panicDirection.z * 10, -76, 76),
        )
        : ped.path[(ped.waypointIndex + 1) % ped.path.length];
      const toTarget = new THREE.Vector3(target.x - ped.group.position.x, 0, target.z - ped.group.position.z);
      if (ped.mood !== 'panicking' && toTarget.length() < 0.5) {
        ped.waypointIndex = (ped.waypointIndex + 1) % ped.path.length;
      } else {
        if (toTarget.lengthSq() > 1e-4) toTarget.normalize();
        const separation = new THREE.Vector3();
        for (const other of this.pedestrians) {
          if (other === ped) continue;
          const dx = ped.group.position.x - other.group.position.x;
          const dz = ped.group.position.z - other.group.position.z;
          const d2 = dx * dx + dz * dz;
          if (d2 > 0.001 && d2 < 1.44) separation.add(new THREE.Vector3(dx, 0, dz).multiplyScalar(0.12 / d2));
        }
        toTarget.add(separation).normalize();
        const speed = ped.mood === 'panicking' ? 5.2 : ped.speed;
        const grade = terrain ? samplePozarevacTerrainGrade(terrain, ped.group.position, {
          x: ped.group.position.x + toTarget.x,
          z: ped.group.position.z + toTarget.z,
        }) : 0;
        const slopeScale = THREE.MathUtils.clamp(1 - grade * 0.9, 0.68, 1.22);
        const desiredX = toTarget.x * speed * slopeScale;
        const desiredZ = toTarget.z * speed * slopeScale;
        ped.velocity.x = THREE.MathUtils.damp(ped.velocity.x, desiredX, ped.mood === 'panicking' ? 8 : 5, Math.min(delta, 0.1));
        ped.velocity.z = THREE.MathUtils.damp(ped.velocity.z, desiredZ, ped.mood === 'panicking' ? 8 : 5, Math.min(delta, 0.1));
        ped.group.position.x += ped.velocity.x * delta;
        ped.group.position.z += ped.velocity.z * delta;
        const ground = this.getGroundHeight(ped.group.position.x, ped.group.position.z);
        ped.group.position.y = ground;
        if (Math.hypot(ped.velocity.x, ped.velocity.z) > 0.1) {
          ped.group.rotation.y = THREE.MathUtils.lerp(ped.group.rotation.y, Math.atan2(ped.velocity.x, ped.velocity.z), 0.16);
        }
      }

      const legSwing = Math.sin(now * (ped.mood === 'panicking' ? 0.018 : 0.007) + pIdx) * (ped.mood === 'panicking' ? 0.75 : 0.4);
      ped.legs[0].rotation.x = legSwing;
      ped.legs[1].rotation.x = -legSwing;

      ped.overheadBubble.visible = ped.mood === 'panicking' && now < ped.panicBubbleUntil;
      if (ped.overheadBubble.visible) ped.overheadBubble.lookAt(cameraPos);

      // Proximity & collision-based NPC interaction with REAL VOICE (no UI popups!)
      const distToPlayer = ped.group.position.distanceTo(playerPos);

      // 1. Direct collision / bump into pedestrian (< 1.25m)
      if (distToPlayer < 1.25) {
        if (now - ped.lastSpokenTime > 7500) {
          ped.lastSpokenTime = now;
          audioDsp.playPedestrianBump(ped.group.position);
          audioLocalizationManager.triggerPedestrianCollision(ped.group.position, ped.gender);
        }
      }
      // 2. High-wanted pursuit reaction (Wanted Level > 0)
      else if (distToPlayer < 4.2 && wantedLevel > 0) {
        if (now - ped.lastSpokenTime > 8000) {
          ped.lastSpokenTime = now;
          audioLocalizationManager.playLocalizedSerbian('Beži rođo, evo murije!', ped.group.position, { gender: ped.gender, emotion: 'shout' });
        }
      }
      // 3. Occasional casual street pass-by voice (moderate frequency, 20s cooldown)
      else if (distToPlayer < 3.2) {
        if (now - ped.lastSpokenTime > ped.nextBanterDelayMs) {
          ped.lastSpokenTime = now;
          ped.nextBanterDelayMs = 22000 + Math.random() * 12000;
          audioLocalizationManager.triggerRandomNpcBanter(ped.group.position, ped.gender);
        }
      }
    });
  }

  public dispose() {
    this.dogs.forEach((d) => this.scene.remove(d.group));
    this.policeCars.forEach((p) => this.scene.remove(p.group));
    this.pursuitCruisers.forEach((p) => this.scene.remove(p.group));
    this.pedestrians.forEach((ped) => this.scene.remove(ped.group));
    this.dogs = [];
    this.policeCars = [];
    this.pursuitCruisers = [];
    this.pedestrians = [];
  }
}
