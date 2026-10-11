import * as THREE from 'three';
import { audioDsp } from './audioDsp';
import { CITY_BUILDING_BOXES, SceneObstacleBox } from './weatherManager';
import { PhysicsEngine } from './physicsEngine';
import { SpatialHash2D } from './spatialHash';
import { getCameraSafeDistance, getVehicleImpactContact } from './collisionGeometry';
import { samplePozarevacTerrainGrade } from './terrainHeightfield';
import type { PozarevacDemHeightfield } from './terrainHeightfield';

export interface DynamicCollider {
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  type?: 'vehicle' | 'prop' | 'barrier';
  velocityX?: number;
  velocityZ?: number;
}

export interface ControllerOptions {
  camera: THREE.PerspectiveCamera;
  characterGroup: THREE.Group;
  domElement: HTMLElement;
  initialPosition?: THREE.Vector3;
  walkSpeed?: number;
  runSpeed?: number;
  jumpPower?: number;
  getDynamicColliders?: () => DynamicCollider[];
  getGroundHeight?: (x: number, z: number) => number;
  terrain?: PozarevacDemHeightfield | null;
  onVehicleImpact?: (impact: { relativeSpeed: number; x: number; z: number }) => void;
}

export class ThirdPersonController {
  public camera: THREE.PerspectiveCamera;
  public characterGroup: THREE.Group;
  public domElement: HTMLElement;

  // Spherical orbit angles
  public distance = 5.4;
  public targetDistance = 5.4;
  public minDistance = 1.6;
  public maxDistance = 14.0;
  private resolvedCameraDistance = 5.4;

  public yaw = 0;          // Horizontal orbit angle (radians)
  public targetYaw = 0;
  public pitch = 0.28;     // Vertical elevation angle (radians)
  public targetPitch = 0.28;
  public minPitch = -0.22;
  public maxPitch = 1.25;

  // Camera look target
  public currentTarget = new THREE.Vector3(0, 1.4, 0);

  // Player physics state
  public position = new THREE.Vector3(0, 0, 0);
  public velocity = new THREE.Vector3();
  public currentHeading = 0;
  public targetHeading = 0;
  public isJumping = false;
  public jumpVelocity = 0;

  // Tuning speeds
  public walkSpeed = 4.6;
  public runSpeed = 8.6;
  public jumpPower = 7.5;
  public acceleration = 18.0;
  public friction = 14.0;
  public turnSpeed = 14.0;

  // Input states
  public keys: Record<string, boolean> = {};
  public isOrbiting = false;
  public lastMousePos = { x: 0, y: 0 };

  // Collision System
  public getDynamicColliders: (() => DynamicCollider[]) | null = null;
  private readonly getGroundHeight: (x: number, z: number) => number;
  private terrain: PozarevacDemHeightfield | null;
  private readonly onVehicleImpact?: ControllerOptions['onVehicleImpact'];
  public staticObstacles: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
  private staticObstacleHash = new SpatialHash2D<{ minX: number; maxX: number; minZ: number; maxZ: number; isVehicle?: boolean }>(8);
  private dynamicObstacleHash = new SpatialHash2D<{ minX: number; maxX: number; minZ: number; maxZ: number; isVehicle?: boolean }>(8);
  public playerRadius = 0.45;
  private lastCollisionSoundTime = 0;
  private lastVehicleImpactTime = 0;
  public physicsEngine: PhysicsEngine;

  // Mode override (e.g. Inspect Close-Up or Top-Down Drone)
  public activeMode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp' = 'gtaFollow';

  public get isMoving(): boolean {
    return Math.hypot(this.velocity.x, this.velocity.z) > 0.2;
  }

  public get isSprinting(): boolean {
    return !!this.keys['shift'] && this.isMoving;
  }

  public get isGrounded(): boolean {
    return !this.isJumping;
  }

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnContextMenu: (e: MouseEvent) => void;
  private boundOnWindowBlur: () => void;

  constructor(opts: ControllerOptions) {
    this.camera = opts.camera;
    this.characterGroup = opts.characterGroup;
    this.domElement = opts.domElement;

    if (opts.initialPosition) {
      this.position.copy(opts.initialPosition);
      this.characterGroup.position.copy(this.position);
      this.currentTarget.set(this.position.x, this.position.y + 1.4, this.position.z);
    }
    if (opts.walkSpeed) this.walkSpeed = opts.walkSpeed;
    if (opts.runSpeed) this.runSpeed = opts.runSpeed;
    if (opts.jumpPower) this.jumpPower = opts.jumpPower;
    if (opts.getDynamicColliders) this.getDynamicColliders = opts.getDynamicColliders;
    this.getGroundHeight = opts.getGroundHeight ?? (() => 0);
    this.terrain = opts.terrain ?? null;
    this.onVehicleImpact = opts.onVehicleImpact;

    // Initialize static Požarevac obstacle bounds (Buildings, Planters and visible Benches).
    this.staticObstacles = [
      ...CITY_BUILDING_BOXES.map((b) => ({
        minX: b.minX,
        maxX: b.maxX,
        minZ: b.minZ,
        maxZ: b.maxZ,
      })),
      // Flower Planters along Tabačka Čaršija
      { minX: -4.3, maxX: -3.3, minZ: -18.5, maxZ: -17.5 },
      { minX: 3.3, maxX: 4.3, minZ: -18.5, maxZ: -17.5 },
      { minX: -4.3, maxX: -3.3, minZ: -6.5, maxZ: -5.5 },
      { minX: 3.3, maxX: 4.3, minZ: -6.5, maxZ: -5.5 },
      { minX: -4.3, maxX: -3.3, minZ: 5.5, maxZ: 6.5 },
      { minX: 3.3, maxX: 4.3, minZ: 5.5, maxZ: 6.5 },
      { minX: -4.3, maxX: -3.3, minZ: 17.5, maxZ: 18.5 },
      { minX: 3.3, maxX: 4.3, minZ: 17.5, maxZ: 18.5 },
      // Park and sidewalk benches
      { minX: -4.6, maxX: -3.8, minZ: -14.9, maxZ: -13.1 },
      { minX: -4.6, maxX: -3.8, minZ: 1.1, maxZ: 2.9 },
      { minX: 3.8, maxX: 4.6, minZ: -14.9, maxZ: -13.1 },
      { minX: 3.8, maxX: 4.6, minZ: 1.1, maxZ: 2.9 },
    ];
    this.staticObstacles.forEach((obstacle) => this.staticObstacleHash.insert({ ...obstacle, value: obstacle }));

    // Initialize Cannon.js rigid body physics engine
    this.physicsEngine = new PhysicsEngine(this.position);

    // Bind event handlers
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = (e: MouseEvent) => e.preventDefault();
    this.boundOnWindowBlur = () => {
      // Prevent a stuck walk/run/jump if the player alt-tabs or the browser loses focus.
      this.keys = {};
      this.isOrbiting = false;
    };

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('blur', this.boundOnWindowBlur);
    window.addEventListener('keyup', this.boundOnKeyUp);
    this.domElement.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.addEventListener('wheel', this.boundOnWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.boundOnContextMenu);
  }

  public setMode(mode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp') {
    this.activeMode = mode;
    if (mode === 'closeUp') {
      this.targetDistance = 2.4;
      this.targetPitch = 0.15;
    } else if (mode === 'gtaFollow') {
      this.targetDistance = 5.4;
      this.targetPitch = 0.28;
    } else if (mode === 'topDown') {
      this.targetDistance = 18.0;
      this.targetPitch = 1.25;
    } else if (mode === 'isometric') {
      this.targetDistance = 12.0;
      this.targetPitch = 0.65;
      this.targetYaw = Math.PI / 4;
    } else if (mode === 'perspective') {
      this.targetDistance = 4.2;
      this.targetPitch = 0.08;
    }
  }

  public setTerrain(terrain: PozarevacDemHeightfield | null) {
    this.terrain = terrain;
  }

  private onKeyDown(e: KeyboardEvent) {
    // Avoid capturing inputs if user is typing in chat inputs or forms
    const target = e.target as HTMLElement | null;
    const targetTag = target?.tagName?.toLowerCase();
    const isEditable = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select'
      || target?.isContentEditable;
    if (isEditable) return;

    const key = e.key.toLowerCase();
    this.keys[key] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();

    // Jump handling
    if (e.code === 'Space' && !this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpPower;
      audioDsp.playQuantumBurst();
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
  }

  private onMouseDown(e: MouseEvent) {
    // Left click (0) or Right click (2) starts camera orbit
    if (e.button === 0 || e.button === 2) {
      this.isOrbiting = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isOrbiting) return;

    const deltaX = e.clientX - this.lastMousePos.x;
    const deltaY = e.clientY - this.lastMousePos.y;
    this.lastMousePos = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0055;
    this.targetYaw -= deltaX * sensitivity;
    this.targetPitch += deltaY * sensitivity;

    // Clamp pitch so camera doesn't flip upside down
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
  }

  private onMouseUp() {
    this.isOrbiting = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomSpeed = 0.0035;
    this.targetDistance += e.deltaY * zoomSpeed;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  /**
   * Main 60FPS update loop: Camera-relative movement, smooth rotation, and camera tracking.
   */
  public update(delta: number, speedMultiplier: number = 1.0): {
    isMoving: boolean;
    isRunning: boolean;
    isJumping: boolean;
    heading: number;
    speed: number;
  } {
    const dt = Math.min(delta, 0.1);

    // 1. Gather directional input (WASD & Arrow Keys)
    let inputForward = 0;
    let inputRight = 0;

    if (this.keys['w'] || this.keys['arrowup']) inputForward += 1;
    if (this.keys['s'] || this.keys['arrowdown']) inputForward -= 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputRight -= 1;
    if (this.keys['d'] || this.keys['arrowright']) inputRight += 1;

    const hasInput = inputForward !== 0 || inputRight !== 0;
    const isRunning = (this.keys['shift'] || false) && hasInput;

    // 2. Camera-Relative Direction Calculation
    // Forward direction in horizontal plane based on current camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDirection = new THREE.Vector3();
    if (hasInput) {
      moveDirection.addScaledVector(forward, inputForward);
      moveDirection.addScaledVector(right, inputRight);
      moveDirection.normalize();
    }

    // 3. Acceleration & Velocity Damping
    const terrainGrade = this.terrain && hasInput
      ? samplePozarevacTerrainGrade(this.terrain, this.position, {
        x: this.position.x + moveDirection.x,
        z: this.position.z + moveDirection.z,
      })
      : 0;
    const gradeSpeedMultiplier = THREE.MathUtils.clamp(1 - terrainGrade * 0.9, 0.68, 1.22);
    const baseSpeed = (isRunning ? this.runSpeed : this.walkSpeed) * gradeSpeedMultiplier;
    const currentMaxSpeed = baseSpeed * speedMultiplier;

    if (hasInput) {
      const targetVelX = moveDirection.x * currentMaxSpeed;
      const targetVelZ = moveDirection.z * currentMaxSpeed;

      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, this.acceleration, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, this.acceleration, dt);

      // 4. Smooth Character Heading (Faces Movement Direction)
      this.targetHeading = Math.atan2(this.velocity.x, this.velocity.z);
    } else {
      // Natural deceleration via friction
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, this.friction, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, this.friction, dt);
    }

    // Smooth heading rotation with shortest angle interpolation
    const diff = (this.targetHeading - this.currentHeading + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    this.currentHeading += diff * Math.min(1, this.turnSpeed * dt);
    this.characterGroup.rotation.y = this.currentHeading;

    // Banking/tilt into turns (subtle realistic GTA inertia)
    const bankTarget = hasInput ? -diff * 0.12 : 0;
    this.characterGroup.rotation.z = THREE.MathUtils.damp(
      this.characterGroup.rotation.z,
      bankTarget,
      8,
      dt
    );
    const forwardX = Math.sin(this.currentHeading);
    const forwardZ = Math.cos(this.currentHeading);
    const currentGroundY = this.getGroundHeight(this.position.x, this.position.z);
    const forwardGroundY = this.getGroundHeight(this.position.x + forwardX, this.position.z + forwardZ);
    const slopePitch = this.isJumping ? 0 : THREE.MathUtils.clamp(-Math.atan2(forwardGroundY - currentGroundY, 1), -0.2, 0.2);
    this.characterGroup.rotation.x = THREE.MathUtils.damp(this.characterGroup.rotation.x, slopePitch, 8, dt);

    // 5. Physics Collision & Continuous Sliding Resolution
    // Player cannot walk through buildings, vehicles, or street objects
    const deltaX = this.velocity.x * dt;
    const deltaZ = this.velocity.z * dt;

    // Gather all active colliders (static buildings/props + dynamic vehicles)
    this.dynamicObstacleHash.clear();
    const dynamicColliders = this.getDynamicColliders?.() ?? [];
    if (dynamicColliders.length) {
      for (const d of dynamicColliders) {
        const collider = {
          minX: d.x - d.halfWidth,
          maxX: d.x + d.halfWidth,
          minZ: d.z - d.halfDepth,
          maxZ: d.z + d.halfDepth,
          isVehicle: d.type === 'vehicle',
        };
        this.dynamicObstacleHash.insert({ ...collider, value: collider });
      }
    }

    const broadphaseBounds = {
      minX: Math.min(this.position.x, this.position.x + deltaX) - this.playerRadius,
      maxX: Math.max(this.position.x, this.position.x + deltaX) + this.playerRadius,
      minZ: Math.min(this.position.z, this.position.z + deltaZ) - this.playerRadius,
      maxZ: Math.max(this.position.z, this.position.z + deltaZ) + this.playerRadius,
    };
    const allColliders = [
      ...this.staticObstacleHash.query(broadphaseBounds),
      ...this.dynamicObstacleHash.query(broadphaseBounds),
    ];

    // Step X with sliding collision resolution
    let newX = this.position.x + deltaX;
    let hitVehicle = false;
    for (const box of allColliders) {
      if (
        newX + this.playerRadius > box.minX &&
        newX - this.playerRadius < box.maxX &&
        this.position.z + this.playerRadius > box.minZ &&
        this.position.z - this.playerRadius < box.maxZ
      ) {
        if (box.isVehicle) hitVehicle = true;
        // Slide along X boundary
        if (deltaX > 0) {
          newX = box.minX - this.playerRadius - 0.002;
          this.velocity.x = 0;
        } else if (deltaX < 0) {
          newX = box.maxX + this.playerRadius + 0.002;
          this.velocity.x = 0;
        }
      }
    }
    this.position.x = newX;

    // Step Z with sliding collision resolution
    let newZ = this.position.z + deltaZ;
    for (const box of allColliders) {
      if (
        this.position.x + this.playerRadius > box.minX &&
        this.position.x - this.playerRadius < box.maxX &&
        newZ + this.playerRadius > box.minZ &&
        newZ - this.playerRadius < box.maxZ
      ) {
        if (box.isVehicle) hitVehicle = true;
        // Slide along Z boundary
        if (deltaZ > 0) {
          newZ = box.minZ - this.playerRadius - 0.002;
          this.velocity.z = 0;
        } else if (deltaZ < 0) {
          newZ = box.maxZ + this.playerRadius + 0.002;
          this.velocity.z = 0;
        }
      }
    }
    this.position.z = newZ;

    // A moving car that reaches the player transfers momentum once per impact window.
    const impactNow = performance.now();
    if (impactNow - this.lastVehicleImpactTime >= 1500) {
      const contact = dynamicColliders
        .filter((collider) => collider.type === 'vehicle')
        .map((vehicle) => getVehicleImpactContact(this.position, {
          x: vehicle.x,
          z: vehicle.z,
          halfWidth: vehicle.halfWidth,
          halfDepth: vehicle.halfDepth,
          velocityX: vehicle.velocityX ?? 0,
          velocityZ: vehicle.velocityZ ?? 0,
        }, this.playerRadius))
        .find((candidate) => candidate !== null);
      if (contact) {
        this.lastVehicleImpactTime = impactNow;
        const knockback = 4.2 + Math.min(2.0, contact.relativeSpeed * 0.22);
        this.velocity.x = contact.directionX * knockback;
        this.velocity.z = contact.directionZ * knockback;
        if (!this.isJumping) {
          this.isJumping = true;
          this.jumpVelocity = 2.4;
        }
        audioDsp.playCrashImpact(this.position);
        this.lastCollisionSoundTime = Date.now();
        this.onVehicleImpact?.({ relativeSpeed: contact.relativeSpeed, x: this.position.x, z: this.position.z });
      }
    }

    // Boundary clamping (within Požarevac play area)
    const terrainBound = 78.0;
    this.position.x = Math.max(-terrainBound, Math.min(terrainBound, this.position.x));
    this.position.z = Math.max(-terrainBound, Math.min(terrainBound, this.position.z));

    // Vehicle collision audio feedback
    if (hitVehicle && (Math.abs(deltaX) > 0.03 || Math.abs(deltaZ) > 0.03)) {
      const now = Date.now();
      if (now - this.lastCollisionSoundTime > 1800) {
        this.lastCollisionSoundTime = now;
        audioDsp.playCarHorn(this.position);
      }
    }

    // 6. Jump Physics & Gravity
    const groundY = this.getGroundHeight(this.position.x, this.position.z);
    if (this.isJumping) {
      this.position.y += this.jumpVelocity * dt;
      this.jumpVelocity -= 18.5 * dt; // Gravity
      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    } else {
      this.position.y = groundY;
    }

    this.characterGroup.position.copy(this.position);
    this.physicsEngine.setPlayerPosition(this.position.x, this.position.y, this.position.z);

    // 7. Smooth Third-Person Camera Follow & Orbit
    // Target focus: Character upper torso (y + 1.35)
    const targetFocusPoint = new THREE.Vector3(
      this.position.x,
      this.position.y + 1.35,
      this.position.z
    );
    this.currentTarget.lerp(targetFocusPoint, 0.14);

    // Interpolate spherical angles and distance
    this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 14, dt);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 14, dt);
    this.distance = THREE.MathUtils.damp(this.distance, this.targetDistance, 10, dt);

    // Calculate Camera Position
    const camX = this.currentTarget.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const camY = this.currentTarget.y + Math.sin(this.pitch) * this.distance;
    const camZ = this.currentTarget.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;
    const desiredCameraPosition = new THREE.Vector3(camX, camY, camZ);
    const cameraBounds = {
      minX: Math.min(this.currentTarget.x, camX) - 0.4,
      maxX: Math.max(this.currentTarget.x, camX) + 0.4,
      minZ: Math.min(this.currentTarget.z, camZ) - 0.4,
      maxZ: Math.max(this.currentTarget.z, camZ) + 0.4,
    };
    const nearbyObstacles = this.staticObstacleHash.query(cameraBounds);
    const safeDistance = getCameraSafeDistance(this.currentTarget, desiredCameraPosition, nearbyObstacles);
    const hasObstruction = safeDistance < this.distance - 0.05;
    this.resolvedCameraDistance = THREE.MathUtils.damp(
      this.resolvedCameraDistance,
      Math.min(this.distance, safeDistance),
      hasObstruction ? 28 : 5,
      dt,
    );
    const cameraDistance = Math.min(this.resolvedCameraDistance, safeDistance);
    const camScale = this.distance > 0 ? cameraDistance / this.distance : 1;
    this.camera.position.set(
      this.currentTarget.x + (camX - this.currentTarget.x) * camScale,
      this.currentTarget.y + (camY - this.currentTarget.y) * camScale,
      this.currentTarget.z + (camZ - this.currentTarget.z) * camScale,
    );
    this.camera.lookAt(this.currentTarget);

    // 8. Dynamic FOV Kick during sprint
    const targetFov = isRunning ? 55 : 50;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    return {
      isMoving: horizontalSpeed > 0.35,
      isRunning,
      isJumping: this.isJumping,
      heading: this.currentHeading,
      speed: horizontalSpeed,
    };
  }

  public dispose() {
    // Release Cannon bodies and broadphase state when the Three.js scene unmounts.
    // The controller currently owns this engine instance, so cleanup belongs here.
    this.physicsEngine.dispose();
    this.keys = {};
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    window.removeEventListener('blur', this.boundOnWindowBlur);
    this.domElement.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.removeEventListener('wheel', this.boundOnWheel);
    this.domElement.removeEventListener('contextmenu', this.boundOnContextMenu);
  }
}
