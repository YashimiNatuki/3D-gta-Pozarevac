import * as THREE from 'three';
import { audioDsp } from './audioDsp';

export interface StreetDog {
  group: THREE.Group;
  name: string;
  legs: THREE.Mesh[];
  tail: THREE.Mesh;
  barkIndicator: THREE.Mesh;
  state: 'idle' | 'sniffing' | 'barking' | 'chasing';
  patrolCenter: THREE.Vector3;
  patrolRadius: number;
  speed: number;
  angle: number;
  lastBarkTime: number;
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
}

export interface Pedestrian {
  group: THREE.Group;
  legs: THREE.Mesh[];
  arms: THREE.Mesh[];
  path: THREE.Vector3[];
  waypointIndex: number;
  speed: number;
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

  constructor(scene: THREE.Scene) {
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
      });
    }
  }

  // --- 3. PEDESTRIANS ON SIDEWALKS ---
  private spawnPedestrians() {
    const pedConfigs = [
      {
        color: 0x0284c7,
        path: [
          new THREE.Vector3(2.5, 0, -18),
          new THREE.Vector3(2.5, 0, 18),
          new THREE.Vector3(2.5, 0, -18),
        ],
      },
      {
        color: 0xec4899,
        path: [
          new THREE.Vector3(-3.5, 0, 12),
          new THREE.Vector3(-3.5, 0, -12),
          new THREE.Vector3(-3.5, 0, 12),
        ],
      },
      {
        color: 0x10b981,
        path: [
          new THREE.Vector3(8, 0, -3),
          new THREE.Vector3(16, 0, -3),
          new THREE.Vector3(8, 0, -3),
        ],
      },
      {
        color: 0xf59e0b,
        path: [
          new THREE.Vector3(-10, 0, 6),
          new THREE.Vector3(-10, 0, 14),
          new THREE.Vector3(-10, 0, 6),
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

      this.scene.add(pedGroup);

      this.pedestrians.push({
        group: pedGroup,
        legs: [leftLeg, rightLeg],
        arms: [],
        path: cfg.path,
        waypointIndex: 0,
        speed: 1.4,
      });
    });
  }

  // --- 4. UPDATE LOOP ---
  public update(delta: number, playerPos: THREE.Vector3, wantedLevel: number, cameraPos: THREE.Vector3) {
    const now = performance.now();

    // Sync active hot pursuit police cruisers based on wantedLevel
    this.syncPursuitCruisers(wantedLevel, playerPos);

    // Audio sirens during pursuit
    if (wantedLevel > 0 && now - this.lastSirenSoundTime > 3200) {
      this.lastSirenSoundTime = now;
      audioDsp.playPoliceSirenSound();
    }

    // 1. Update Dogs
    this.dogs.forEach((dog, idx) => {
      const distToPlayer = dog.group.position.distanceTo(playerPos);

      // Make billboard face camera
      dog.barkIndicator.lookAt(cameraPos);

      if (distToPlayer < 4.2) {
        // Player is nearby! Bark and approach or follow
        dog.state = distToPlayer < 2.0 ? 'barking' : 'chasing';
        dog.barkIndicator.visible = true;

        if (now - dog.lastBarkTime > 4000) {
          dog.lastBarkTime = now;
          audioDsp.playThugCoinSound(); // Audio bark alert sound
        }

        // Rotate and move towards player smoothly
        const dir = new THREE.Vector3().subVectors(playerPos, dog.group.position);
        dir.y = 0;
        if (dir.length() > 1.2) {
          dir.normalize();
          dog.group.position.addScaledVector(dir, dog.speed * 1.3 * delta);
          dog.group.rotation.y = Math.atan2(dir.x, dir.z);
        }
      } else {
        // Normal patrol within radius
        dog.state = 'idle';
        dog.barkIndicator.visible = false;
        dog.angle += 0.5 * delta;
        const targetX = dog.patrolCenter.x + Math.cos(dog.angle) * dog.patrolRadius;
        const targetZ = dog.patrolCenter.z + Math.sin(dog.angle) * dog.patrolRadius;
        const dir = new THREE.Vector3(targetX - dog.group.position.x, 0, targetZ - dog.group.position.z);
        if (dir.length() > 0.3) {
          dir.normalize();
          dog.group.position.addScaledVector(dir, dog.speed * delta);
          dog.group.rotation.y = THREE.MathUtils.lerp(dog.group.rotation.y, Math.atan2(dir.x, dir.z), 0.1);
        }
      }

      // Animate dog legs and tail
      const legSwing = Math.sin(now * 0.012 + idx) * 0.35;
      dog.legs[0].rotation.x = legSwing;
      dog.legs[1].rotation.x = -legSwing;
      dog.legs[2].rotation.x = -legSwing;
      dog.legs[3].rotation.x = legSwing;
      dog.tail.rotation.y = Math.sin(now * 0.02) * 0.45;
    });

    // 2. Update Flashing Sirens State
    this.sirenFlashTimer += delta;
    if (this.sirenFlashTimer > 0.16) {
      this.sirenFlashTimer = 0;
      this.redActive = !this.redActive;
    }

    // 2a. Update Patrol Police Cars
    this.policeCars.forEach((pCar) => {
      if (wantedLevel > 0) {
        pCar.sirenRed.intensity = this.redActive ? 8.0 : 0;
        pCar.sirenBlue.intensity = !this.redActive ? 8.0 : 0;
        pCar.lightBarRedMesh.visible = this.redActive;
        pCar.lightBarBlueMesh.visible = !this.redActive;
      } else {
        pCar.sirenRed.intensity = 0;
        pCar.sirenBlue.intensity = 0;
        pCar.lightBarRedMesh.visible = true;
        pCar.lightBarBlueMesh.visible = true;
      }

      const effSpeed = wantedLevel > 0 ? pCar.speed * 1.4 : pCar.speed;
      const targetWp = pCar.path[(pCar.currentWaypoint + 1) % pCar.path.length];
      const dir = new THREE.Vector3().subVectors(targetWp, pCar.group.position);
      dir.y = 0;

      const distToPlayer = pCar.group.position.distanceTo(playerPos);
      let speedMult = 1.0;
      if (distToPlayer < 3.5 && wantedLevel === 0) {
        speedMult = 0.2;
      }

      if (dir.length() < 0.8) {
        pCar.currentWaypoint = (pCar.currentWaypoint + 1) % pCar.path.length;
      } else {
        dir.normalize();
        pCar.group.position.addScaledVector(dir, effSpeed * speedMult * delta);
        const targetRot = Math.atan2(dir.x, dir.z);
        pCar.group.rotation.y = THREE.MathUtils.lerp(pCar.group.rotation.y, targetRot, 0.1);
      }
    });

    // 2b. Update Active Pursuit Cruisers (Following & Intercepting Player in Hot Pursuit!)
    this.pursuitCruisers.forEach((pCruiser, cIdx) => {
      // High intensity siren strobes
      pCruiser.sirenRed.intensity = this.redActive ? 12.0 : 0;
      pCruiser.sirenBlue.intensity = !this.redActive ? 12.0 : 0;
      pCruiser.lightBarRedMesh.visible = this.redActive;
      pCruiser.lightBarBlueMesh.visible = !this.redActive;

      const toPlayer = new THREE.Vector3().subVectors(playerPos, pCruiser.group.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      // Flank player slightly based on cruiser index
      const flankAngle = (cIdx - 1) * 0.45;
      const targetPos = playerPos.clone();
      if (dist > 5) {
        targetPos.x += Math.cos(flankAngle) * 3;
        targetPos.z += Math.sin(flankAngle) * 3;
      }

      const moveDir = new THREE.Vector3().subVectors(targetPos, pCruiser.group.position);
      moveDir.y = 0;

      if (dist > 3.2) {
        // Full throttle chase!
        moveDir.normalize();
        pCruiser.group.position.addScaledVector(moveDir, pCruiser.speed * delta);
        const targetRot = Math.atan2(moveDir.x, moveDir.z);
        pCruiser.group.rotation.y = THREE.MathUtils.lerp(pCruiser.group.rotation.y, targetRot, 0.12);
      } else {
        // Encircle and block player escape
        const targetRot = Math.atan2(toPlayer.x, toPlayer.z);
        pCruiser.group.rotation.y = THREE.MathUtils.lerp(pCruiser.group.rotation.y, targetRot, 0.15);
      }
    });

    // 3. Update Pedestrians
    this.pedestrians.forEach((ped, pIdx) => {
      const target = ped.path[(ped.waypointIndex + 1) % ped.path.length];
      const dir = new THREE.Vector3().subVectors(target, ped.group.position);
      dir.y = 0;
      if (dir.length() < 0.5) {
        ped.waypointIndex = (ped.waypointIndex + 1) % ped.path.length;
      } else {
        dir.normalize();
        ped.group.position.addScaledVector(dir, ped.speed * delta);
        ped.group.rotation.y = THREE.MathUtils.lerp(ped.group.rotation.y, Math.atan2(dir.x, dir.z), 0.1);
      }

      const legSwing = Math.sin(now * 0.007 + pIdx) * 0.4;
      ped.legs[0].rotation.x = legSwing;
      ped.legs[1].rotation.x = -legSwing;
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
