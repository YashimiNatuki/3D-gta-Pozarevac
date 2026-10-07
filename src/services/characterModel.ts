import * as THREE from 'three';

export type ThugOutfitId = 'classic' | 'goldBoss' | 'cyber2077' | 'redHood';

export interface ThugOutfitConfig {
  id: ThugOutfitId;
  name: string;
  vestColor: number;
  shirtColor: number;
  pantsColor: number;
  sneakerPrimary: number;
  sneakerSecondary: number;
  bandanaColor: number;
  hatType: 'bandana' | 'snapback' | 'beanie';
  chainColor: number;
  auraColor: number;
}

export const THUG_OUTFITS: Record<ThugOutfitId, ThugOutfitConfig> = {
  classic: {
    id: 'classic',
    name: 'Thug Life Klasik (West Coast)',
    vestColor: 0x18181b,
    shirtColor: 0x27272a, // Rich dark muscle tank, non-glare
    pantsColor: 0x1e3a8a, // Deep denim blue
    sneakerPrimary: 0xb91c1c,
    sneakerSecondary: 0xe2e8f0,
    bandanaColor: 0xb91c1c,
    hatType: 'bandana',
    chainColor: 0xd97706,
    auraColor: 0x0284c7,
  },
  goldBoss: {
    id: 'goldBoss',
    name: 'Konglomerat Zlatni Don',
    vestColor: 0x1e293b,
    shirtColor: 0xb45309,
    pantsColor: 0x0f172a,
    sneakerPrimary: 0xd97706,
    sneakerSecondary: 0xf1f5f9,
    bandanaColor: 0xd97706,
    hatType: 'snapback',
    chainColor: 0xf59e0b,
    auraColor: 0xeab308,
  },
  cyber2077: {
    id: 'cyber2077',
    name: 'Cyberpunk Požarevac 2077',
    vestColor: 0x09090b,
    shirtColor: 0x0e7490,
    pantsColor: 0x18181b,
    sneakerPrimary: 0x06b6d4,
    sneakerSecondary: 0x64748b,
    bandanaColor: 0x0891b2,
    hatType: 'beanie',
    chainColor: 0x06b6d4,
    auraColor: 0x06b6d4,
  },
  redHood: {
    id: 'redHood',
    name: 'Požarevac Red Hood Boss',
    vestColor: 0x7f1d1d,
    shirtColor: 0x18181b,
    pantsColor: 0x334155,
    sneakerPrimary: 0x991b1b,
    sneakerSecondary: 0x1e293b,
    bandanaColor: 0x18181b,
    hatType: 'snapback',
    chainColor: 0xd97706,
    auraColor: 0xdc2626,
  },
};

export interface CustomCharacterConfig {
  skinColor?: number;
  vestColor?: number;
  shirtColor?: number;
  pantsColor?: number;
  sneakerPrimary?: number;
  sneakerSecondary?: number;
  bandanaColor?: number;
  chainColor?: number;
  prop?: 'none' | 'mic' | 'spray' | 'phone';
}

export interface CharacterRig {
  rootGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  leftShinGroup: THREE.Group;
  rightShinGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftForearmGroup: THREE.Group;
  rightForearmGroup: THREE.Group;
  leftSneaker: THREE.Mesh;
  rightSneaker: THREE.Mesh;
  chainMedallion: THREE.Mesh;
  overheadCrown: THREE.Mesh;
  heroLight: THREE.PointLight;
  playerAuraRing: THREE.Mesh;
  updateAnimation: (delta: number, isMoving: boolean, isRunning: boolean, isJumping: boolean) => void;
  setOutfit: (outfitId: ThugOutfitId) => void;
  setCustomConfig: (cfg: CustomCharacterConfig) => void;
  setPlayerTag: (name: string, level: number) => void;
}

/**
 * Creates subtle overhead player label without blinding white glare
 */
function createPlayerTagSprite(name: string, level: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 488, 96, 20);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText(`${name.toUpperCase()}`, 256, 52);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`LVL ${level} • RESPEKT 99%`, 256, 88);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.4, 0.6, 1.0);
  sprite.position.y = 2.45;
  return sprite;
}

/**
 * Builds the complete high-fidelity 3D GTA Character with anatomical multi-joint skeleton.
 */
export function buildThugCharacter(initialOutfit: ThugOutfitId = 'classic'): CharacterRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AiChatBratina v10.0 - Thug Avatar';

  const cfg = THUG_OUTFITS[initialOutfit];

  // Natural skin tone, calibrated roughness
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdf9b77,
    roughness: 0.65,
    metalness: 0.05,
  });

  const vestMat = new THREE.MeshStandardMaterial({
    color: cfg.vestColor,
    roughness: 0.6,
    metalness: 0.15,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: cfg.shirtColor,
    roughness: 0.8,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: cfg.pantsColor,
    roughness: 0.85,
  });

  const sneakerMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerPrimary,
    roughness: 0.4,
    metalness: 0.1,
  });

  const sneakerWhiteMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerSecondary,
    roughness: 0.4,
  });

  const bandanaMat = new THREE.MeshStandardMaterial({
    color: cfg.bandanaColor,
    roughness: 0.7,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: cfg.chainColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  const shadesMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.8,
  });

  // Soft, subtle character illumination (NO whiteout glare)
  const heroLight = new THREE.PointLight(0xfff7ed, 0.45, 6, 1.0);
  heroLight.position.set(0, 2.2, 0.8);
  rootGroup.add(heroLight);

  // 1. TORSO & CHEST
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.15;
  rootGroup.add(torsoGroup);

  // Athletic tapered torso
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.27, 0.76, 18);
  torsoGeo.scale(1.0, 1.0, 0.75);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Rounded chest definition
  const chestGeo = new THREE.SphereGeometry(0.16, 14, 14);
  chestGeo.scale(1.0, 0.85, 0.6);
  const leftPec = new THREE.Mesh(chestGeo, shirtMat);
  leftPec.position.set(-0.14, 0.18, 0.14);
  const rightPec = new THREE.Mesh(chestGeo, shirtMat);
  rightPec.position.set(0.14, 0.18, 0.14);
  torsoGroup.add(leftPec, rightPec);

  // Biker Vest
  const vestBackGeo = new THREE.CylinderGeometry(0.34, 0.29, 0.78, 18, 1, false, Math.PI / 2, Math.PI);
  vestBackGeo.scale(1.03, 1.0, 0.78);
  const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
  vestBack.castShadow = true;
  torsoGroup.add(vestBack);

  const vestFlapLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.29, 0.78, 14, 1, false, -Math.PI / 5, Math.PI / 2.8),
    vestMat
  );
  vestFlapLeft.position.set(-0.04, 0, 0);
  const vestFlapRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.29, 0.78, 14, 1, false, -Math.PI / 5, Math.PI / 2.8),
    vestMat
  );
  vestFlapRight.position.set(0.04, 0, 0);
  torsoGroup.add(vestFlapLeft, vestFlapRight);

  // Belt
  const beltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  beltMesh.position.set(0, -0.38, 0);
  beltMesh.scale.set(1.0, 1.0, 0.75);
  torsoGroup.add(beltMesh);

  // Gold chain & medallion
  const chainMesh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 10, 24), goldMat);
  chainMesh.rotation.x = Math.PI / 2.8;
  chainMesh.position.set(0, 0.26, 0.15);
  torsoGroup.add(chainMesh);

  const chainMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), goldMat);
  chainMedallion.rotation.x = Math.PI / 2;
  chainMedallion.position.set(0, 0.1, 0.2);
  chainMedallion.castShadow = true;
  torsoGroup.add(chainMedallion);

  // 2. HEAD & FACE
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0);
  torsoGroup.add(headGroup);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.18, 14), skinMat);
  neckMesh.position.set(0, -0.06, 0);
  headGroup.add(neckMesh);

  const headGeo = new THREE.SphereGeometry(0.24, 18, 18);
  headGeo.scale(0.95, 1.1, 1.0);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 0.2, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Jaw
  const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.16, 14), skinMat);
  jawMesh.position.set(0, 0.08, 0.06);
  headGroup.add(jawMesh);

  // Sunglasses
  const shadesMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.08), shadesMat);
  shadesMesh.position.set(0, 0.22, 0.22);
  headGroup.add(shadesMesh);

  // Bandana
  const bandanaBand = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.44), bandanaMat);
  bandanaBand.position.set(0, 0.35, 0);
  headGroup.add(bandanaBand);

  // Subtle overhead crown
  const overheadCrown = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 5), goldMat);
  overheadCrown.rotation.x = Math.PI;
  overheadCrown.position.set(0, 0.8, 0);
  headGroup.add(overheadCrown);

  let playerTagSprite = createPlayerTagSprite('BRATINA (Yashime)', 1);
  rootGroup.add(playerTagSprite);

  // 3. MULTI-JOINT ARMS (Shoulder -> Upper Arm -> Forearm Elbow -> Hand)
  // LEFT ARM
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.4, 0.28, 0);
  torsoGroup.add(leftArmGroup);

  const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 12), skinMat);
  leftBicep.position.set(0, -0.17, 0);
  leftBicep.castShadow = true;
  leftArmGroup.add(leftBicep);

  // Forearm with elbow joint pivot
  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(0, -0.34, 0);
  leftArmGroup.add(leftForearmGroup);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 12), skinMat);
  leftForearm.position.set(0, -0.15, 0.02);
  leftForearm.castShadow = true;
  leftForearmGroup.add(leftForearm);

  const leftGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
  );
  leftGlove.position.set(0, -0.32, 0.02);
  leftForearmGroup.add(leftGlove);

  // RIGHT ARM
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.4, 0.28, 0);
  torsoGroup.add(rightArmGroup);

  const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 12), skinMat);
  rightBicep.position.set(0, -0.17, 0);
  rightBicep.castShadow = true;
  rightArmGroup.add(rightBicep);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.34, 0);
  rightArmGroup.add(rightForearmGroup);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 12), skinMat);
  rightForearm.position.set(0, -0.15, 0.02);
  rightForearm.castShadow = true;
  rightForearmGroup.add(rightForearm);

  const rightGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
  );
  rightGlove.position.set(0, -0.32, 0.02);
  rightForearmGroup.add(rightGlove);

  // Props
  const micGroup = new THREE.Group();
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), goldMat);
  micGroup.add(micHead);
  micGroup.position.set(0, -0.36, 0.06);
  micGroup.visible = false;
  rightForearmGroup.add(micGroup);

  const sprayGroup = new THREE.Group();
  const sprayCan = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), vestMat);
  sprayGroup.add(sprayCan);
  sprayGroup.position.set(0, -0.36, 0.06);
  sprayGroup.visible = false;
  rightForearmGroup.add(sprayGroup);

  const phoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.01), shadesMat);
  phoneMesh.position.set(0, -0.36, 0.06);
  phoneMesh.visible = false;
  rightForearmGroup.add(phoneMesh);

  // 4. MULTI-JOINT LEGS (Hip Thigh -> Knee Joint Shin -> Foot Sneaker)
  const createSneaker = () => {
    const sGroup = new THREE.Group();
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.4), sneakerWhiteMat);
    sole.position.set(0, 0.035, 0.05);
    sole.castShadow = true;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.36), sneakerMat);
    body.position.set(0, 0.14, 0.04);
    body.castShadow = true;
    sGroup.add(sole, body);
    return sGroup;
  };

  // LEFT LEG
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.7, 0);
  rootGroup.add(leftLegGroup);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.42, 14), pantsMat);
  leftThigh.position.set(0, -0.21, 0);
  leftThigh.castShadow = true;
  leftLegGroup.add(leftThigh);

  const leftShinGroup = new THREE.Group();
  leftShinGroup.position.set(0, -0.42, 0);
  leftLegGroup.add(leftShinGroup);

  const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.4, 14), pantsMat);
  leftShin.position.set(0, -0.2, 0);
  leftShin.castShadow = true;
  leftShinGroup.add(leftShin);

  const leftSneakerGroup = createSneaker();
  leftSneakerGroup.position.set(0, -0.42, 0);
  leftShinGroup.add(leftSneakerGroup);

  // RIGHT LEG
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.7, 0);
  rootGroup.add(rightLegGroup);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.42, 14), pantsMat);
  rightThigh.position.set(0, -0.21, 0);
  rightThigh.castShadow = true;
  rightLegGroup.add(rightThigh);

  const rightShinGroup = new THREE.Group();
  rightShinGroup.position.set(0, -0.42, 0);
  rightLegGroup.add(rightShinGroup);

  const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.4, 14), pantsMat);
  rightShin.position.set(0, -0.2, 0);
  rightShin.castShadow = true;
  rightShinGroup.add(rightShin);

  const rightSneakerGroup = createSneaker();
  rightSneakerGroup.position.set(0, -0.42, 0);
  rightShinGroup.add(rightSneakerGroup);

  // Subdued Ground Aura Ring (No blinding neon)
  const auraGeo = new THREE.RingGeometry(0.65, 0.8, 28);
  const auraMat = new THREE.MeshBasicMaterial({
    color: cfg.auraColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
  });
  const playerAuraRing = new THREE.Mesh(auraGeo, auraMat);
  playerAuraRing.rotation.x = -Math.PI / 2;
  playerAuraRing.position.y = 0.02;
  rootGroup.add(playerAuraRing);

  // 5. SYNCHRONIZED CHOREOGRAPHY & BIPEDAL ANIMATION ENGINE
  let animClock = 0;

  const updateAnimation = (delta: number, isMoving: boolean, isRunning: boolean, isJumping: boolean) => {
    const speedMultiplier = isRunning ? 11.5 : isMoving ? 7.2 : 2.0;
    animClock += delta * speedMultiplier;

    // Subtle crown & aura rotation
    overheadCrown.rotation.y += delta * 1.5;
    playerAuraRing.rotation.z += delta * 0.8;

    if (isJumping) {
      // Jump Pose: Thighs flexed forward, knees tucked, arms flared up
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -0.7, 0.2);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.5, 0.2);
      leftShinGroup.rotation.x = THREE.MathUtils.lerp(leftShinGroup.rotation.x, 0.9, 0.2);
      rightShinGroup.rotation.x = THREE.MathUtils.lerp(rightShinGroup.rotation.x, 0.8, 0.2);

      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -1.1, 0.2);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -1.1, 0.2);
      leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, 0.6, 0.2);
      rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, 0.6, 0.2);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.1, 0.15);
      torsoGroup.rotation.y = THREE.MathUtils.lerp(torsoGroup.rotation.y, 0, 0.15);
      torsoGroup.position.y = 1.15;
    } else if (isMoving) {
      // Bipedal Locomotion Cycle
      const stride = Math.sin(animClock);
      const strideCos = Math.cos(animClock);
      const legAmp = isRunning ? 0.75 : 0.48;
      const armAmp = isRunning ? 0.72 : 0.44;

      // Hips swing in opposition
      leftLegGroup.rotation.x = stride * legAmp;
      rightLegGroup.rotation.x = -stride * legAmp;

      // Natural Knee Flexion: Knees bend during the swing-back phase
      // Left knee bends when left leg swings back
      leftShinGroup.rotation.x = Math.max(0, -stride * (isRunning ? 0.95 : 0.65));
      // Right knee bends when right leg swings back
      rightShinGroup.rotation.x = Math.max(0, stride * (isRunning ? 0.95 : 0.65));

      // Synchronized Arms: Opposite arm swings forward with leg!
      leftArmGroup.rotation.x = -stride * armAmp;
      rightArmGroup.rotation.x = stride * armAmp;

      // Natural Elbow Flexion: Forearms stay slightly flexed, flexing more on forward swing
      leftForearmGroup.rotation.x = 0.35 + Math.max(0, stride * 0.4);
      rightForearmGroup.rotation.x = 0.35 + Math.max(0, -stride * 0.4);

      // Spine Counter-Rotation (Pelvis vs Torso Yaw Twist)
      torsoGroup.rotation.y = -stride * (isRunning ? 0.14 : 0.08);

      // Forward lean during run
      const lean = isRunning ? 0.22 : 0.08;
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, lean, 0.15);

      // Vertical Bounce: 2 dips and peaks per gait cycle
      const bounce = Math.abs(strideCos) * (isRunning ? 0.08 : 0.04);
      torsoGroup.position.y = 1.15 + bounce;

      // Head remains focused forward
      headGroup.rotation.y = stride * 0.06;
    } else {
      // Natural Idle Breathing Stance
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0.04, 0.1);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.04, 0.1);
      leftShinGroup.rotation.x = THREE.MathUtils.lerp(leftShinGroup.rotation.x, 0, 0.1);
      rightShinGroup.rotation.x = THREE.MathUtils.lerp(rightShinGroup.rotation.x, 0, 0.1);

      // Relaxed arms at sides with slight elbow bend
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0.06, 0.1);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0.06, 0.1);
      leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, 0.22, 0.1);
      rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, 0.22, 0.1);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.1);
      torsoGroup.rotation.y = THREE.MathUtils.lerp(torsoGroup.rotation.y, 0, 0.1);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, 0.1);

      // Subtle breathing motion
      torsoGroup.position.y = 1.15 + Math.sin(animClock) * 0.015;
    }
  };

  const setOutfit = (outfitId: ThugOutfitId) => {
    const o = THUG_OUTFITS[outfitId];
    if (!o) return;
    vestMat.color.setHex(o.vestColor);
    shirtMat.color.setHex(o.shirtColor);
    pantsMat.color.setHex(o.pantsColor);
    sneakerMat.color.setHex(o.sneakerPrimary);
    sneakerWhiteMat.color.setHex(o.sneakerSecondary);
    bandanaMat.color.setHex(o.bandanaColor);
    goldMat.color.setHex(o.chainColor);
    (playerAuraRing.material as THREE.MeshBasicMaterial).color.setHex(o.auraColor);
  };

  const setCustomConfig = (cfg: CustomCharacterConfig) => {
    if (cfg.skinColor !== undefined) skinMat.color.setHex(cfg.skinColor);
    if (cfg.vestColor !== undefined) vestMat.color.setHex(cfg.vestColor);
    if (cfg.shirtColor !== undefined) shirtMat.color.setHex(cfg.shirtColor);
    if (cfg.pantsColor !== undefined) pantsMat.color.setHex(cfg.pantsColor);
    if (cfg.sneakerPrimary !== undefined) sneakerMat.color.setHex(cfg.sneakerPrimary);
    if (cfg.sneakerSecondary !== undefined) sneakerWhiteMat.color.setHex(cfg.sneakerSecondary);
    if (cfg.bandanaColor !== undefined) bandanaMat.color.setHex(cfg.bandanaColor);
    if (cfg.chainColor !== undefined) goldMat.color.setHex(cfg.chainColor);
    if (cfg.prop !== undefined) {
      micGroup.visible = cfg.prop === 'mic';
      sprayGroup.visible = cfg.prop === 'spray';
      phoneMesh.visible = cfg.prop === 'phone';
    }
  };

  const setPlayerTag = (name: string, level: number) => {
    rootGroup.remove(playerTagSprite);
    playerTagSprite = createPlayerTagSprite(name, level);
    rootGroup.add(playerTagSprite);
  };

  return {
    rootGroup,
    torsoGroup,
    headGroup,
    leftLegGroup,
    rightLegGroup,
    leftShinGroup,
    rightShinGroup,
    leftArmGroup,
    rightArmGroup,
    leftForearmGroup,
    rightForearmGroup,
    leftSneaker: leftSneakerGroup.children[0] as THREE.Mesh,
    rightSneaker: rightSneakerGroup.children[0] as THREE.Mesh,
    chainMedallion,
    overheadCrown,
    heroLight,
    playerAuraRing,
    updateAnimation,
    setOutfit,
    setCustomConfig,
    setPlayerTag,
  };
}
