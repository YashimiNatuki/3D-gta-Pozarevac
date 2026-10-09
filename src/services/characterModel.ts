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
    shirtColor: 0x27272a,
    pantsColor: 0x1e3a8a,
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
  leftSneaker: THREE.Group;
  rightSneaker: THREE.Group;
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
 * Builds high-fidelity organic curved 3D GTA Character with anatomical multi-joint skeleton.
 * Eliminates square/blocky limbs using smooth tapered geometry, sculpted musculature,
 * articulated elbows, knees, deltoids, and bipedal gait mechanics.
 */
export function buildThugCharacter(initialOutfit: ThugOutfitId = 'classic'): CharacterRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AiChatBratina v10.0 - Thug Avatar';

  const cfg = THUG_OUTFITS[initialOutfit];

  // Natural warm skin tone with subtle subsurface feel
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdf9b77,
    roughness: 0.6,
    metalness: 0.05,
  });

  const vestMat = new THREE.MeshStandardMaterial({
    color: cfg.vestColor,
    roughness: 0.55,
    metalness: 0.15,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: cfg.shirtColor,
    roughness: 0.75,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: cfg.pantsColor,
    roughness: 0.8,
  });

  const sneakerMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerPrimary,
    roughness: 0.35,
    metalness: 0.1,
  });

  const sneakerWhiteMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerSecondary,
    roughness: 0.35,
  });

  const bandanaMat = new THREE.MeshStandardMaterial({
    color: cfg.bandanaColor,
    roughness: 0.7,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: cfg.chainColor,
    roughness: 0.22,
    metalness: 0.88,
  });

  const shadesMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.85,
  });

  // Soft character point illumination (no blinding glare)
  const heroLight = new THREE.PointLight(0xfff7ed, 0.45, 6, 1.0);
  heroLight.position.set(0, 2.2, 0.8);
  rootGroup.add(heroLight);

  // 1. ANATOMICAL TORSO & MUSCULATURE
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.15;
  rootGroup.add(torsoGroup);

  // Tapered athletic V-taper torso with smooth curved contours
  const torsoGeo = new THREE.CylinderGeometry(0.33, 0.26, 0.76, 24);
  torsoGeo.scale(1.0, 1.0, 0.78);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Sculpted chest & pectorals with natural curved spheres
  const chestGeo = new THREE.SphereGeometry(0.16, 16, 16);
  chestGeo.scale(1.0, 0.82, 0.65);
  const leftPec = new THREE.Mesh(chestGeo, shirtMat);
  leftPec.position.set(-0.13, 0.18, 0.15);
  const rightPec = new THREE.Mesh(chestGeo, shirtMat);
  rightPec.position.set(0.13, 0.18, 0.15);
  torsoGroup.add(leftPec, rightPec);

  // Sculpted latissimus / back curve
  const backGeo = new THREE.SphereGeometry(0.19, 16, 16);
  backGeo.scale(1.0, 0.8, 0.45);
  const upperBack = new THREE.Mesh(backGeo, shirtMat);
  upperBack.position.set(0, 0.18, -0.16);
  torsoGroup.add(upperBack);

  // Biker Vest with rounded lapels
  const vestBackGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.78, 24, 1, false, Math.PI / 2, Math.PI);
  vestBackGeo.scale(1.03, 1.0, 0.8);
  const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
  vestBack.castShadow = true;
  torsoGroup.add(vestBack);

  const vestFlapLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.28, 0.78, 16, 1, false, -Math.PI / 5, Math.PI / 2.7),
    vestMat
  );
  vestFlapLeft.position.set(-0.04, 0, 0);
  const vestFlapRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.28, 0.78, 16, 1, false, -Math.PI / 5, Math.PI / 2.7),
    vestMat
  );
  vestFlapRight.position.set(0.04, 0, 0);
  torsoGroup.add(vestFlapLeft, vestFlapRight);

  // Leather Belt with metallic buckle
  const beltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  beltMesh.position.set(0, -0.38, 0);
  beltMesh.scale.set(1.0, 1.0, 0.78);
  torsoGroup.add(beltMesh);

  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.02),
    goldMat
  );
  buckleMesh.position.set(0, -0.38, 0.23);
  torsoGroup.add(buckleMesh);

  // Gold chain & engraved medallion
  const chainMesh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.024, 12, 28), goldMat);
  chainMesh.rotation.x = Math.PI / 2.8;
  chainMesh.position.set(0, 0.26, 0.16);
  torsoGroup.add(chainMesh);

  const chainMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), goldMat);
  chainMedallion.rotation.x = Math.PI / 2;
  chainMedallion.position.set(0, 0.1, 0.22);
  chainMedallion.castShadow = true;
  torsoGroup.add(chainMedallion);

  // 2. HEAD, NECK & CRANIAL MORPHOLOGY
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0);
  torsoGroup.add(headGroup);

  // Trapezius and contoured neck
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.18, 18), skinMat);
  neckMesh.position.set(0, -0.06, 0);
  headGroup.add(neckMesh);

  // Smooth cranial sphere with facial proportions
  const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
  headGeo.scale(0.95, 1.12, 1.02);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 0.2, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Sculpted jaw and chin
  const jawGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.16, 18);
  jawGeo.scale(1.0, 1.0, 0.85);
  const jawMesh = new THREE.Mesh(jawGeo, skinMat);
  jawMesh.position.set(0, 0.08, 0.06);
  headGroup.add(jawMesh);

  // Designer sunglasses with curved temple arms
  const shadesMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.08), shadesMat);
  shadesMesh.position.set(0, 0.22, 0.23);
  headGroup.add(shadesMesh);

  // Bandana with realistic headband contour
  const bandanaGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 24);
  bandanaGeo.scale(0.98, 1.0, 1.05);
  const bandanaBand = new THREE.Mesh(bandanaGeo, bandanaMat);
  bandanaBand.position.set(0, 0.35, 0);
  headGroup.add(bandanaBand);

  // Overhead crown (floating icon)
  const overheadCrown = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.16, 6), goldMat);
  overheadCrown.rotation.x = Math.PI;
  overheadCrown.position.set(0, 0.82, 0);
  headGroup.add(overheadCrown);

  let playerTagSprite = createPlayerTagSprite('BRATINA (Yashime)', 1);
  rootGroup.add(playerTagSprite);

  // 3. ARTICULATED CURVED ARMS (Deltoid -> Bicep -> Elbow -> Forearm -> Hand)
  // Helper for contoured muscle cylinder
  const createMuscleMesh = (rTop: number, rBot: number, len: number, mat: THREE.Material) => {
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 18);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  };

  // Helper for anatomical hand with fingers
  const createArticulatedHand = () => {
    const handGroup = new THREE.Group();
    // Palm
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.1, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
    );
    palm.castShadow = true;
    handGroup.add(palm);

    // Knuckles / fingers
    const fingers = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.03, 0.07, 10),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
    );
    fingers.position.set(0, -0.06, 0.02);
    handGroup.add(fingers);

    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.018, 0.045, 8),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
    );
    thumb.position.set(0.045, -0.02, 0.025);
    thumb.rotation.z = -Math.PI / 4;
    handGroup.add(thumb);

    return handGroup;
  };

  // LEFT ARM
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.41, 0.28, 0);
  torsoGroup.add(leftArmGroup);

  // Deltoid shoulder cap
  const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), shirtMat);
  leftArmGroup.add(leftDeltoid);

  // Upper arm / bicep
  const leftBicep = createMuscleMesh(0.095, 0.08, 0.32, skinMat);
  leftBicep.position.set(0, -0.16, 0);
  leftArmGroup.add(leftBicep);

  // Articulated elbow pivot
  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(0, -0.32, 0);
  leftArmGroup.add(leftForearmGroup);

  const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), skinMat);
  leftForearmGroup.add(leftElbow);

  // Forearm tapering toward wrist
  const leftForearm = createMuscleMesh(0.08, 0.065, 0.28, skinMat);
  leftForearm.position.set(0, -0.14, 0.02);
  leftForearmGroup.add(leftForearm);

  const leftHand = createArticulatedHand();
  leftHand.position.set(0, -0.3, 0.02);
  leftForearmGroup.add(leftHand);

  // RIGHT ARM
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.41, 0.28, 0);
  torsoGroup.add(rightArmGroup);

  const rightDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), shirtMat);
  rightArmGroup.add(rightDeltoid);

  const rightBicep = createMuscleMesh(0.095, 0.08, 0.32, skinMat);
  rightBicep.position.set(0, -0.16, 0);
  rightArmGroup.add(rightBicep);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.32, 0);
  rightArmGroup.add(rightForearmGroup);

  const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), skinMat);
  rightForearmGroup.add(rightElbow);

  const rightForearm = createMuscleMesh(0.08, 0.065, 0.28, skinMat);
  rightForearm.position.set(0, -0.14, 0.02);
  rightForearmGroup.add(rightForearm);

  const rightHand = createArticulatedHand();
  rightHand.position.set(0, -0.3, 0.02);
  rightForearmGroup.add(rightHand);

  // Props in right hand
  const micGroup = new THREE.Group();
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), goldMat);
  micGroup.add(micHead);
  micGroup.position.set(0, -0.34, 0.06);
  micGroup.visible = false;
  rightForearmGroup.add(micGroup);

  const sprayGroup = new THREE.Group();
  const sprayCan = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 14), vestMat);
  sprayGroup.add(sprayCan);
  sprayGroup.position.set(0, -0.34, 0.06);
  sprayGroup.visible = false;
  rightForearmGroup.add(sprayGroup);

  const phoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.01), shadesMat);
  phoneMesh.position.set(0, -0.34, 0.06);
  phoneMesh.visible = false;
  rightForearmGroup.add(phoneMesh);

  // 4. ARTICULATED CURVED LEGS & SNEAKERS (Pelvic Abductor -> Thigh -> Knee -> Calf -> Sneaker)
  const createSneaker = () => {
    const sGroup = new THREE.Group();
    // Cushioned midsole & outsole with ergonomic toe spring curve
    const soleGeo = new THREE.BoxGeometry(0.2, 0.07, 0.42);
    const sole = new THREE.Mesh(soleGeo, sneakerWhiteMat);
    sole.position.set(0, 0.035, 0.06);
    sole.castShadow = true;

    // Sculpted upper with padded collar
    const upperGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.16, 16);
    upperGeo.scale(1.0, 1.0, 1.8);
    const body = new THREE.Mesh(upperGeo, sneakerMat);
    body.position.set(0, 0.12, 0.05);
    body.castShadow = true;

    // Toe cap accent
    const toeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      sneakerWhiteMat
    );
    toeCap.scale.set(1.1, 0.7, 1.1);
    toeCap.position.set(0, 0.07, 0.22);
    sGroup.add(sole, body, toeCap);
    return sGroup;
  };

  // LEFT LEG
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.7, 0);
  rootGroup.add(leftLegGroup);

  // Hip joint & contoured quadriceps thigh
  const leftHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), pantsMat);
  leftLegGroup.add(leftHipJoint);

  const leftThigh = createMuscleMesh(0.13, 0.105, 0.42, pantsMat);
  leftThigh.position.set(0, -0.21, 0);
  leftLegGroup.add(leftThigh);

  // Knee pivot & Shin
  const leftShinGroup = new THREE.Group();
  leftShinGroup.position.set(0, -0.42, 0);
  leftLegGroup.add(leftShinGroup);

  const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), pantsMat);
  leftShinGroup.add(leftKnee);

  // Calf muscle definition (gastrocnemius taper)
  const leftCalf = createMuscleMesh(0.105, 0.085, 0.4, pantsMat);
  leftCalf.position.set(0, -0.2, 0);
  leftShinGroup.add(leftCalf);

  const leftSneakerGroup = createSneaker();
  leftSneakerGroup.position.set(0, -0.42, 0);
  leftShinGroup.add(leftSneakerGroup);

  // RIGHT LEG
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.7, 0);
  rootGroup.add(rightLegGroup);

  const rightHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), pantsMat);
  rightLegGroup.add(rightHipJoint);

  const rightThigh = createMuscleMesh(0.13, 0.105, 0.42, pantsMat);
  rightThigh.position.set(0, -0.21, 0);
  rightLegGroup.add(rightThigh);

  const rightShinGroup = new THREE.Group();
  rightShinGroup.position.set(0, -0.42, 0);
  rightLegGroup.add(rightShinGroup);

  const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), pantsMat);
  rightShinGroup.add(rightKnee);

  const rightCalf = createMuscleMesh(0.105, 0.085, 0.4, pantsMat);
  rightCalf.position.set(0, -0.2, 0);
  rightShinGroup.add(rightCalf);

  const rightSneakerGroup = createSneaker();
  rightSneakerGroup.position.set(0, -0.42, 0);
  rightShinGroup.add(rightSneakerGroup);

  // Subdued Ground Aura Ring
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

  // 5. BIOMECHANICAL LOCOMOTION & SYNCHRONIZED CHOREOGRAPHY
  let animClock = 0;

  const updateAnimation = (delta: number, isMoving: boolean, isRunning: boolean, isJumping: boolean) => {
    const speedMultiplier = isRunning ? 12.0 : isMoving ? 7.6 : 2.0;
    animClock += delta * speedMultiplier;

    overheadCrown.rotation.y += delta * 1.5;
    playerAuraRing.rotation.z += delta * 0.8;

    if (isJumping) {
      // Jump Stance: Thighs flexed forward, knees tucked, arms flung back for momentum balance
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -0.7, 0.2);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.5, 0.2);
      leftShinGroup.rotation.x = THREE.MathUtils.lerp(leftShinGroup.rotation.x, 0.95, 0.2);
      rightShinGroup.rotation.x = THREE.MathUtils.lerp(rightShinGroup.rotation.x, 0.85, 0.2);

      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -1.15, 0.2);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -1.15, 0.2);
      leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, 0.65, 0.2);
      rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, 0.65, 0.2);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.12, 0.15);
      torsoGroup.rotation.y = THREE.MathUtils.lerp(torsoGroup.rotation.y, 0, 0.15);
      torsoGroup.position.y = 1.15;
    } else if (isMoving) {
      // Natural Bipedal Gait Locomotion Cycle
      const stride = Math.sin(animClock);
      const strideCos = Math.cos(animClock);
      const legAmp = isRunning ? 0.82 : 0.52;
      const armAmp = isRunning ? 0.78 : 0.48;

      // Hips swing in harmonic opposition
      leftLegGroup.rotation.x = stride * legAmp;
      rightLegGroup.rotation.x = -stride * legAmp;

      // Biomechanical Knee Flexion: Knees bend during the swing-back phase
      leftShinGroup.rotation.x = Math.max(0, -stride * (isRunning ? 1.05 : 0.72));
      rightShinGroup.rotation.x = Math.max(0, stride * (isRunning ? 1.05 : 0.72));

      // Synchronized Arms: Opposite arm swings forward with leg!
      // (When left leg swings forward (+stride), right arm swings forward (+stride))
      leftArmGroup.rotation.x = -stride * armAmp;
      rightArmGroup.rotation.x = stride * armAmp;

      // Articulated Elbow Flexion: Forearms stay slightly flexed, flexing more on forward swing
      leftForearmGroup.rotation.x = 0.35 + Math.max(0, stride * 0.45);
      rightForearmGroup.rotation.x = 0.35 + Math.max(0, -stride * 0.45);

      // Spine Counter-Rotation (Pelvis vs Torso Yaw Twist for human realism)
      torsoGroup.rotation.y = -stride * (isRunning ? 0.14 : 0.08);

      // Forward lean during acceleration & sprint
      const lean = isRunning ? 0.24 : 0.09;
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, lean, 0.15);

      // Vertical Center-of-Mass Oscillation (2 dips/peaks per full stride cycle)
      const bounce = Math.abs(strideCos) * (isRunning ? 0.085 : 0.045);
      torsoGroup.position.y = 1.15 + bounce;

      // Stabilized head focus
      headGroup.rotation.y = stride * 0.05;
    } else {
      // Natural Relaxed Idle Breathing Stance
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0.04, 0.1);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.04, 0.1);
      leftShinGroup.rotation.x = THREE.MathUtils.lerp(leftShinGroup.rotation.x, 0, 0.1);
      rightShinGroup.rotation.x = THREE.MathUtils.lerp(rightShinGroup.rotation.x, 0, 0.1);

      // Relaxed arms at sides with slight natural elbow curvature
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0.06, 0.1);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0.06, 0.1);
      leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, 0.24, 0.1);
      rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, 0.24, 0.1);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.1);
      torsoGroup.rotation.y = THREE.MathUtils.lerp(torsoGroup.rotation.y, 0, 0.1);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, 0.1);

      // Subdued organic breathing motion
      torsoGroup.position.y = 1.15 + Math.sin(animClock) * 0.016;
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
    auraMat.color.setHex(o.auraColor);
  };

  const setCustomConfig = (c: CustomCharacterConfig) => {
    if (c.skinColor !== undefined) skinMat.color.setHex(c.skinColor);
    if (c.vestColor !== undefined) vestMat.color.setHex(c.vestColor);
    if (c.shirtColor !== undefined) shirtMat.color.setHex(c.shirtColor);
    if (c.pantsColor !== undefined) pantsMat.color.setHex(c.pantsColor);
    if (c.sneakerPrimary !== undefined) sneakerMat.color.setHex(c.sneakerPrimary);
    if (c.sneakerSecondary !== undefined) sneakerWhiteMat.color.setHex(c.sneakerSecondary);
    if (c.bandanaColor !== undefined) bandanaMat.color.setHex(c.bandanaColor);
    if (c.chainColor !== undefined) goldMat.color.setHex(c.chainColor);

    micGroup.visible = c.prop === 'mic';
    sprayGroup.visible = c.prop === 'spray';
    phoneMesh.visible = c.prop === 'phone';
  };

  const setPlayerTag = (name: string, level: number) => {
    rootGroup.remove(playerTagSprite);
    playerTagSprite.material.map?.dispose();
    playerTagSprite.material.dispose();
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
    leftSneaker: leftSneakerGroup,
    rightSneaker: rightSneakerGroup,
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
