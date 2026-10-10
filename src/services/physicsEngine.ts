// [AiChatBratina v10.0] - Cannon.js Physics Engine Integration
// Full rigid-body 3D collision physics for Požarevac streets, ground, buildings, and player character
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CITY_BUILDING_BOXES, SceneObstacleBox } from './weatherManager';

export interface VehicleColliderInput {
  id: string;
  x: number;
  y: number;
  z: number;
  halfWidth: number;
  halfHeight: number;
  halfDepth: number;
  rotationY: number;
}

export class PhysicsEngine {
  public world: CANNON.World;
  public playerBody: CANNON.Body;
  private groundBody: CANNON.Body;
  private buildingBodies: CANNON.Body[] = [];
  private vehicleBodies: Map<string, CANNON.Body> = new Map();

  // Materials for realistic sliding without sticking to walls
  private defaultMaterial: CANNON.Material;
  private playerMaterial: CANNON.Material;
  private buildingMaterial: CANNON.Material;
  private groundMaterial: CANNON.Material;

  public isGrounded: boolean = true;
  private playerRadius = 0.42;
  private playerHeight = 1.75;

  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 3.5)) {
    // 1. Initialize CANNON World with realistic gravity
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -20.0, 0),
    });

    // Solver configuration
    this.world.defaultContactMaterial.friction = 0.1;
    this.world.defaultContactMaterial.restitution = 0.0;
    this.world.allowSleep = true;

    // 2. Physics Materials
    this.defaultMaterial = new CANNON.Material('default');
    this.playerMaterial = new CANNON.Material('player');
    this.buildingMaterial = new CANNON.Material('building');
    this.groundMaterial = new CANNON.Material('ground');

    // Frictionless contact between player and buildings prevents sticking/clipping
    const playerBuildingContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.buildingMaterial,
      {
        friction: 0.0,
        restitution: 0.0,
      }
    );
    this.world.addContactMaterial(playerBuildingContact);

    // Player-Ground Contact: Stable traction
    const playerGroundContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.groundMaterial,
      {
        friction: 0.25,
        restitution: 0.0,
      }
    );
    this.world.addContactMaterial(playerGroundContact);

    // 3. Ground Plane Collision Boundary at y = 0
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0, // static body
      material: this.groundMaterial,
      shape: groundShape,
    });
    // Rotate plane from facing +Z to facing +Y (upwards)
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.groundBody.position.set(0, 0, 0);
    this.world.addBody(this.groundBody);

    // 4. City Buildings Collision Boundaries (from Požarevac architectural layout)
    this.setupBuildingBoundaries();

    // 5. Street Props Collision Boundaries (Monolith, planters, benches)
    this.setupStreetPropBoundaries();

    // 6. Player Physics Body (Upright Capsule/Sphere representation)
    const sphereShape = new CANNON.Sphere(this.playerRadius);
    this.playerBody = new CANNON.Body({
      mass: 75.0, // Dynamic body
      material: this.playerMaterial,
      shape: sphereShape,
      linearDamping: 0.45,
      angularDamping: 1.0,
    });
    this.playerBody.position.set(initialPosition.x, initialPosition.y + this.playerRadius + 0.05, initialPosition.z);
    // Lock rotation so character stays upright
    this.playerBody.fixedRotation = true;
    this.playerBody.updateMassProperties();

    // Monitor ground contact
    this.playerBody.addEventListener('collide', (e: any) => {
      if (e.body === this.groundBody || e.contact?.ni?.y > 0.5) {
        this.isGrounded = true;
      }
    });

    this.world.addBody(this.playerBody);
  }

  private setupBuildingBoundaries() {
    CITY_BUILDING_BOXES.forEach((b: SceneObstacleBox) => {
      const width = b.maxX - b.minX;
      const depth = b.maxZ - b.minZ;
      const height = b.height || 12.0;

      const halfW = width / 2;
      const halfH = height / 2;
      const halfD = depth / 2;

      const centerX = b.minX + halfW;
      const centerZ = b.minZ + halfD;
      const centerY = halfH;

      const boxShape = new CANNON.Box(new CANNON.Vec3(halfW, halfH, halfD));
      const body = new CANNON.Body({
        mass: 0,
        material: this.buildingMaterial,
        shape: boxShape,
      });
      body.position.set(centerX, centerY, centerZ);
      this.world.addBody(body);
      this.buildingBodies.push(body);
    });
  }

  private setupStreetPropBoundaries() {
    // Flower Planters along Tabačka Čaršija
    [-18, -6, 6, 18].forEach((pz) => {
      [-3.8, 3.8].forEach((px) => {
        const planterShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 0.5));
        const planterBody = new CANNON.Body({
          mass: 0,
          material: this.buildingMaterial,
          shape: planterShape,
        });
        planterBody.position.set(px, 0.4, pz);
        this.world.addBody(planterBody);
        this.buildingBodies.push(planterBody);
      });
    });

    // Street Benches along sidewalks
    [
      { x: -4.2, z: -14, hw: 0.35, hd: 0.9 },
      { x: -4.2, z: 2, hw: 0.35, hd: 0.9 },
      { x: 4.2, z: -14, hw: 0.35, hd: 0.9 },
      { x: 4.2, z: 2, hw: 0.35, hd: 0.9 },
    ].forEach((bench) => {
      const benchShape = new CANNON.Box(new CANNON.Vec3(bench.hw, 0.45, bench.hd));
      const benchBody = new CANNON.Body({
        mass: 0,
        material: this.buildingMaterial,
        shape: benchShape,
      });
      benchBody.position.set(bench.x, 0.45, bench.z);
      this.world.addBody(benchBody);
      this.buildingBodies.push(benchBody);
    });
  }

  /**
   * Synchronizes dynamic vehicle collision boundaries from TrafficSystem
   */
  public syncVehicles(vehicles: VehicleColliderInput[]) {
    const activeIds = new Set<string>();

    vehicles.forEach((v) => {
      activeIds.add(v.id);
      let body = this.vehicleBodies.get(v.id);

      if (!body) {
        const boxShape = new CANNON.Box(new CANNON.Vec3(v.halfWidth, v.halfHeight, v.halfDepth));
        body = new CANNON.Body({
          mass: 0, // Kinematic/Static collision obstacle for character
          material: this.buildingMaterial,
          shape: boxShape,
        });
        this.world.addBody(body);
        this.vehicleBodies.set(v.id, body);
      }

      body.position.set(v.x, v.y + v.halfHeight, v.z);
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), v.rotationY);
    });

    // Clean up despawned vehicles
    this.vehicleBodies.forEach((body, id) => {
      if (!activeIds.has(id)) {
        this.world.removeBody(body);
        this.vehicleBodies.delete(id);
      }
    });
  }

  /**
   * Main physics step:
   * Moves player with target horizontal velocity while allowing gravity and Cannon.js collision resolution
   */
  public step(
    delta: number,
    targetVelX: number,
    targetVelZ: number,
    isJumpingInput: boolean,
    jumpPower: number
  ): { position: THREE.Vector3; isGrounded: boolean } {
    const dt = Math.min(delta, 0.05);

    // Check if player is on or near the ground plane
    if (this.playerBody.position.y <= this.playerRadius + 0.08) {
      this.isGrounded = true;
    } else {
      // Check downward velocity
      if (this.playerBody.velocity.y < -0.2) {
        this.isGrounded = false;
      }
    }

    // Apply horizontal motion to Cannon body (prevents clipping through walls)
    this.playerBody.velocity.x = targetVelX;
    this.playerBody.velocity.z = targetVelZ;

    // Handle Jump impulse via physics
    if (isJumpingInput && this.isGrounded) {
      this.playerBody.velocity.y = jumpPower;
      this.isGrounded = false;
    }

    // Fixed-step simulation
    this.world.step(1 / 60, dt, 3);

    // Clamp player within Požarevac play area
    const terrainBound = 35.0;
    this.playerBody.position.x = Math.max(-terrainBound, Math.min(terrainBound, this.playerBody.position.x));
    this.playerBody.position.z = Math.max(-terrainBound, Math.min(terrainBound, this.playerBody.position.z));
    if (this.playerBody.position.y < this.playerRadius) {
      this.playerBody.position.y = this.playerRadius;
      this.playerBody.velocity.y = 0;
      this.isGrounded = true;
    }

    const pos = new THREE.Vector3(
      this.playerBody.position.x,
      this.playerBody.position.y - this.playerRadius,
      this.playerBody.position.z
    );

    return {
      position: pos,
      isGrounded: this.isGrounded,
    };
  }

  public setPlayerPosition(x: number, y: number, z: number) {
    this.playerBody.position.set(x, y + this.playerRadius, z);
    this.playerBody.velocity.set(0, 0, 0);
  }

  public dispose() {
    this.buildingBodies.forEach((b) => this.world.removeBody(b));
    this.vehicleBodies.forEach((b) => this.world.removeBody(b));
    this.world.removeBody(this.groundBody);
    this.world.removeBody(this.playerBody);
  }
}
