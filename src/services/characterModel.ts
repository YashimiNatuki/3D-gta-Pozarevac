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
    vestColor: 0x18181b, // Jet black leather vest
    shirtColor: 0xf8fafc, // Crisp white muscle tank
    pantsColor: 0x1d4ed8, // Classic street blue baggy jeans
    sneakerPrimary: 0xdc2626, // Red/White high-top kicks
    sneakerSecondary: 0xffffff,
    bandanaColor: 0xdc2626, // Iconic Red Bandana
    hatType: 'bandana',
    chainColor: 0xf59e0b, // Pure Gold chain
    auraColor: 0x00f0ff,
  },
  goldBoss: {
    id: 'goldBoss',
    name: 'Konglomerat Zlatni Don',
    vestColor: 0xfafafa, // White & Gold boss jacket
    shirtColor: 0xf59e0b, // Gold silk jersey
    pantsColor: 0x0f172a, // Obsidian tailored street pants
    sneakerPrimary: 0xf59e0b, // Gold luxury sneakers
    sneakerSecondary: 0xffffff,
    bandanaColor: 0xf59e0b, // Gold boss headband
    hatType: 'snapback',
    chainColor: 0xffd700, // Diamond-cut Gold chain
    auraColor: 0xffd700,
  },
  cyber2077: {
    id: 'cyber2077',
    name: 'Cyberpunk Požarevac 2077',
    vestColor: 0x09090b,
    shirtColor: 0x06b6d4, // Glowing cyan undershirt
    pantsColor: 0x18181b, // Cyber cargo pants
    sneakerPrimary: 0x06b6d4, // Cyan glow runners
    sneakerSecondary: 0xa855f7,
    bandanaColor: 0x06b6d4, // Cyber visor headband
    hatType: 'beanie',
    chainColor: 0x00ffff, // Platinum cyber chain
    auraColor: 0x00ff88,
  },
  redHood: {
    id: 'redHood',
    name: 'Požarevac Red Hood Boss',
    vestColor: 0x991b1b, // Deep crimson street hoodie
    shirtColor: 0x18181b, // Black graphic tee
    pantsColor: 0x334155, // Charcoal baggy denim
    sneakerPrimary: 0xef4444, // Red kicks
    sneakerSecondary: 0x000000,
    bandanaColor: 0x18181b, // Black stealth bandana
    hatType: 'snapback',
    chainColor: 0xf59e0b,
    auraColor: 0xef4444,
  },
};

/**
 * Creates a dynamic overhead billboard sprite with player title, level, health & respect.
 */
function createPlayerTagSprite(name: string, level: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background pill container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 128, 28);
    ctx.fill();

    // Border glowing neon
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Player Title with Crown
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`👑 ${name.toUpperCase()} 👑`, 256, 64);

    // Sub-stats (Level & Thug Life badge)
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`LVL ${level} • RESPEKT 99% • HP 100`, 256, 110);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.2, 1.0, 1.0);
  sprite.position.y = 2.85;
  return sprite;
}

/**
 * Creates tattoo sleeve canvas texture for muscular arms.
 */
function createTattooTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e8b28f'; // Skin base
    ctx.fillRect(0, 0, 256, 256);

    // Tribal / Thug Life tattoo linework
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(40 + (i % 4) * 55, 30 + Math.floor(i / 4) * 45, 18, 0, Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('THUG', 70, 120);
    ctx.fillText('LIFE', 70, 160);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

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
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
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
 * Builds the complete high-fidelity 3D GTA Thug Life Character ("AiChatBratina v10.0").
 */
export function buildThugCharacter(initialOutfit: ThugOutfitId = 'classic'): CharacterRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AiChatBratina v10.0 - Thug Avatar';

  const cfg = THUG_OUTFITS[initialOutfit];

  // Skin Material
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf2b992,
    roughness: 0.55,
    metalness: 0.1,
  });

  // Tattoo Sleeve Material
  const tattooTex = createTattooTexture();
  const tattooMat = new THREE.MeshStandardMaterial({
    map: tattooTex,
    roughness: 0.6,
  });

  // Dynamic Outfit Materials
  const vestMat = new THREE.MeshStandardMaterial({
    color: cfg.vestColor,
    roughness: 0.35,
    metalness: 0.35,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: cfg.shirtColor,
    roughness: 0.7,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: cfg.pantsColor,
    roughness: 0.75,
  });

  const sneakerMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerPrimary,
    roughness: 0.3,
    metalness: 0.2,
  });

  const sneakerWhiteMat = new THREE.MeshStandardMaterial({
    color: cfg.sneakerSecondary,
    roughness: 0.2,
  });

  const bandanaMat = new THREE.MeshStandardMaterial({
    color: cfg.bandanaColor,
    roughness: 0.6,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: cfg.chainColor,
    roughness: 0.15,
    metalness: 0.95,
  });

  const shadesMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.05,
    metalness: 0.9,
  });

  // 1. DEDICATED CHARACTER HERO LIGHT (Ensures the player always pops out brightly)
  const heroLight = new THREE.PointLight(0xfff1dc, 3.2, 12, 1.2);
  heroLight.position.set(0, 2.6, 1.2);
  rootGroup.add(heroLight);

  // 2. TORSO & CHEST
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.25;
  rootGroup.add(torsoGroup);

  // Inner Muscle Tank / Jersey
  const tankGeo = new THREE.BoxGeometry(0.72, 0.88, 0.44);
  const tankMesh = new THREE.Mesh(tankGeo, shirtMat);
  tankMesh.position.y = 0;
  tankMesh.castShadow = true;
  torsoGroup.add(tankMesh);

  // Outer Leather Biker Vest / Hoodie (Open in front to display jersey & gold chain)
  const vestBackGeo = new THREE.BoxGeometry(0.78, 0.9, 0.12);
  const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
  vestBack.position.set(0, 0, -0.19);
  vestBack.castShadow = true;
  torsoGroup.add(vestBack);

  const vestLeftGeo = new THREE.BoxGeometry(0.24, 0.9, 0.48);
  const vestLeft = new THREE.Mesh(vestLeftGeo, vestMat);
  vestLeft.position.set(-0.28, 0, 0.01);
  vestLeft.castShadow = true;
  torsoGroup.add(vestLeft);

  const vestRightGeo = new THREE.BoxGeometry(0.24, 0.9, 0.48);
  const vestRight = new THREE.Mesh(vestRightGeo, vestMat);
  vestRight.position.set(0.28, 0, 0.01);
  vestRight.castShadow = true;
  torsoGroup.add(vestRight);

  // Biker Vest Collar
  const collarGeo = new THREE.BoxGeometry(0.55, 0.14, 0.35);
  const collarMesh = new THREE.Mesh(collarGeo, vestMat);
  collarMesh.position.set(0, 0.46, -0.06);
  torsoGroup.add(collarMesh);

  // Leather Belt with Gold Buckle
  const beltGeo = new THREE.BoxGeometry(0.74, 0.12, 0.46);
  const beltMesh = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 }));
  beltMesh.position.set(0, -0.44, 0);
  torsoGroup.add(beltMesh);

  const buckleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.06);
  const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
  buckleMesh.position.set(0, -0.44, 0.24);
  torsoGroup.add(buckleMesh);

  // 3. HEAVY 3D GOLD CUBAN LINK CHAIN & MEDALLION
  const chainTorusGeo = new THREE.TorusGeometry(0.2, 0.035, 12, 28);
  const chainMesh = new THREE.Mesh(chainTorusGeo, goldMat);
  chainMesh.rotation.x = Math.PI / 3;
  chainMesh.position.set(0, 0.32, 0.18);
  torsoGroup.add(chainMesh);

  // 3D Gold Yashime / Kong Dollar Medallion
  const medallionGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.025, 24);
  const chainMedallion = new THREE.Mesh(medallionGeo, goldMat);
  chainMedallion.rotation.x = Math.PI / 2;
  chainMedallion.position.set(0, 0.12, 0.25);
  chainMedallion.castShadow = true;
  torsoGroup.add(chainMedallion);

  // 4. HEAD & FACE
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);
  torsoGroup.add(headGroup);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.22, 16);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.set(0, -0.08, 0);
  headGroup.add(neckMesh);

  // Head Box/Skull
  const headGeo = new THREE.BoxGeometry(0.46, 0.52, 0.46);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 0.22, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Defined Jaw & Ears
  const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.1), skinMat);
  leftEar.position.set(-0.25, 0.22, 0);
  const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.1), skinMat);
  rightEar.position.set(0.25, 0.22, 0);
  headGroup.add(leftEar, rightEar);

  // Gangster Sunglasses / Aviators
  const shadesBridge = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.15), shadesMat);
  shadesBridge.position.set(0, 0.25, 0.21);
  const shadesLeftLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), shadesMat);
  shadesLeftLens.position.set(-0.12, 0.25, 0.26);
  const shadesRightLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), shadesMat);
  shadesRightLens.position.set(0.12, 0.25, 0.26);

  // Gold Aviator Frame
  const shadesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.22), goldMat);
  shadesFrame.position.set(0, 0.32, 0.2);
  headGroup.add(shadesBridge, shadesLeftLens, shadesRightLens, shadesFrame);

  // HEADGEAR (Bandana / Snapback / Beanie based on outfit)
  const bandanaBand = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.14, 0.49), bandanaMat);
  bandanaBand.position.set(0, 0.42, 0);
  headGroup.add(bandanaBand);

  // Bandana Top Cover
  const bandanaTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.48), bandanaMat);
  bandanaTop.position.set(0, 0.5, 0);
  headGroup.add(bandanaTop);

  // Bandana Tied Knot at the Back
  const bandanaKnot = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), bandanaMat);
  bandanaKnot.rotation.x = -Math.PI / 3;
  bandanaKnot.position.set(0, 0.36, -0.28);
  headGroup.add(bandanaKnot);

  // Snapback Visor (Pointed backward for maximum 90s Thug Life street style)
  const snapbackVisor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.24), bandanaMat);
  snapbackVisor.position.set(0, 0.45, -0.32);
  snapbackVisor.rotation.x = -0.15;
  headGroup.add(snapbackVisor);

  // 5. 3D FLOATING OVERHEAD CROWN & BILLBOARD
  const crownGeo = new THREE.ConeGeometry(0.24, 0.28, 5);
  const overheadCrown = new THREE.Mesh(crownGeo, goldMat);
  overheadCrown.rotation.x = Math.PI; // Inverted crown
  overheadCrown.position.set(0, 1.05, 0);
  headGroup.add(overheadCrown);

  let playerTagSprite = createPlayerTagSprite('BRATINA (Yashime)', 1);
  rootGroup.add(playerTagSprite);

  // 6. LEFT ARM RIG
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.48, 0.32, 0);
  torsoGroup.add(leftArmGroup);

  const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.42, 12), tattooMat);
  leftBicep.position.set(0, -0.2, 0);
  leftBicep.castShadow = true;
  leftArmGroup.add(leftBicep);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.38, 12), tattooMat);
  leftForearm.position.set(0, -0.52, 0.04);
  leftForearm.castShadow = true;
  leftArmGroup.add(leftForearm);

  // Left Fist / Fingerless Glove
  const leftGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  leftGlove.position.set(0, -0.74, 0.05);
  leftArmGroup.add(leftGlove);

  // Gold Watch on Left Wrist
  const goldWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), goldMat);
  goldWatch.position.set(0, -0.66, 0.05);
  leftArmGroup.add(goldWatch);

  // 7. RIGHT ARM RIG
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.48, 0.32, 0);
  torsoGroup.add(rightArmGroup);

  const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.42, 12), tattooMat);
  rightBicep.position.set(0, -0.2, 0);
  rightBicep.castShadow = true;
  rightArmGroup.add(rightBicep);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.38, 12), tattooMat);
  rightForearm.position.set(0, -0.52, 0.04);
  rightForearm.castShadow = true;
  rightArmGroup.add(rightForearm);

  // Right Fist
  const rightGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  rightGlove.position.set(0, -0.74, 0.05);
  rightArmGroup.add(rightGlove);

  // Gold Ring on Right Hand
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 8, 16), goldMat);
  goldRing.position.set(0.08, -0.74, 0.05);
  rightArmGroup.add(goldRing);

  // 3D Hand Props
  // 1. Golden Microphone
  const micGroup = new THREE.Group();
  const micHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.025, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 })
  );
  const micHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 })
  );
  micHead.position.y = 0.12;
  micGroup.add(micHandle, micHead);
  micGroup.position.set(0, -0.76, 0.12);
  micGroup.rotation.x = Math.PI / 4;
  micGroup.visible = false;
  rightArmGroup.add(micGroup);

  // 2. Graffiti Spray Can
  const sprayGroup = new THREE.Group();
  const sprayCan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
  );
  const sprayCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  sprayCap.position.y = 0.11;
  sprayGroup.add(sprayCan, sprayCap);
  sprayGroup.position.set(0, -0.75, 0.12);
  sprayGroup.visible = false;
  rightArmGroup.add(sprayGroup);

  // 3. Kong Holographic Smartphone
  const phoneMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.6 })
  );
  phoneMesh.position.set(0, -0.74, 0.12);
  phoneMesh.visible = false;
  rightArmGroup.add(phoneMesh);

  // 8. LEGS & SNEAKERS RIG
  // Helper to create detailed High-Top Sneaker
  const createFreshSneaker = (isLeft: boolean) => {
    const shoeGroup = new THREE.Group();

    // White Rubber Sole
    const soleGeo = new THREE.BoxGeometry(0.26, 0.09, 0.52);
    const soleMesh = new THREE.Mesh(soleGeo, sneakerWhiteMat);
    soleMesh.position.set(0, 0.045, 0.06);
    soleMesh.castShadow = true;
    shoeGroup.add(soleMesh);

    // Upper Shoe
    const upperGeo = new THREE.BoxGeometry(0.24, 0.22, 0.48);
    const upperMesh = new THREE.Mesh(upperGeo, sneakerMat);
    upperMesh.position.set(0, 0.18, 0.06);
    upperMesh.castShadow = true;
    shoeGroup.add(upperMesh);

    // White Toe Cap
    const toeGeo = new THREE.BoxGeometry(0.24, 0.14, 0.18);
    const toeMesh = new THREE.Mesh(toeGeo, sneakerWhiteMat);
    toeMesh.position.set(0, 0.14, 0.24);
    shoeGroup.add(toeMesh);

    // High-top Collar / Ankle Support
    const collarShoeGeo = new THREE.BoxGeometry(0.25, 0.2, 0.26);
    const collarShoe = new THREE.Mesh(collarShoeGeo, sneakerMat);
    collarShoe.position.set(0, 0.32, -0.04);
    shoeGroup.add(collarShoe);

    // Laces
    const lacesGeo = new THREE.BoxGeometry(0.14, 0.04, 0.22);
    const lacesMesh = new THREE.Mesh(lacesGeo, sneakerWhiteMat);
    lacesMesh.position.set(0, 0.26, 0.12);
    shoeGroup.add(lacesMesh);

    return shoeGroup;
  };

  // LEFT LEG RIG
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.22, 0.75, 0);
  rootGroup.add(leftLegGroup);

  const leftPants = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.32), pantsMat);
  leftPants.position.set(0, -0.32, 0);
  leftPants.castShadow = true;
  leftLegGroup.add(leftPants);

  const leftSneakerGroup = createFreshSneaker(true);
  leftSneakerGroup.position.set(0, -0.74, 0);
  leftLegGroup.add(leftSneakerGroup);

  // RIGHT LEG RIG
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.22, 0.75, 0);
  rootGroup.add(rightLegGroup);

  const rightPants = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.32), pantsMat);
  rightPants.position.set(0, -0.32, 0);
  rightPants.castShadow = true;
  rightLegGroup.add(rightPants);

  const rightSneakerGroup = createFreshSneaker(false);
  rightSneakerGroup.position.set(0, -0.74, 0);
  rightLegGroup.add(rightSneakerGroup);

  // 9. DUAL-RING ROTATING PULSE AURA UNDER FEET
  const auraGeo = new THREE.RingGeometry(0.75, 0.95, 32);
  const auraMat = new THREE.MeshBasicMaterial({
    color: cfg.auraColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const playerAuraRing = new THREE.Mesh(auraGeo, auraMat);
  playerAuraRing.rotation.x = -Math.PI / 2;
  playerAuraRing.position.y = 0.04;
  rootGroup.add(playerAuraRing);

  // Internal Animation Clock
  let animClock = 0;

  const updateAnimation = (delta: number, isMoving: boolean, isRunning: boolean, isJumping: boolean) => {
    animClock += delta * (isRunning ? 13 : isMoving ? 8 : 2.5);

    // Crown floating & rotating
    overheadCrown.rotation.y += delta * 2;
    overheadCrown.position.y = 1.05 + Math.sin(animClock * 1.5) * 0.08;

    // Ground aura rotation
    playerAuraRing.rotation.z += delta * 1.5;

    // Medallion swing
    chainMedallion.rotation.z = Math.sin(animClock * 1.2) * 0.15;

    if (isJumping) {
      // Jump Pose: Legs tucked, arms flared up
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -0.6, 0.2);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.6, 0.2);
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -1.2, 0.2);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -1.2, 0.2);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.15, 0.1);
    } else if (isMoving) {
      // Walk / Sprint Cycle
      const legAmplitude = isRunning ? 0.75 : 0.52;
      const armAmplitude = isRunning ? 0.85 : 0.55;

      const cycle = Math.sin(animClock);
      leftLegGroup.rotation.x = cycle * legAmplitude;
      rightLegGroup.rotation.x = -cycle * legAmplitude;

      leftArmGroup.rotation.x = -cycle * armAmplitude;
      rightArmGroup.rotation.x = cycle * armAmplitude;

      // Sprint forward lean
      const forwardLean = isRunning ? 0.28 : 0.1;
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, forwardLean, 0.15);

      // Torso vertical bounce
      torsoGroup.position.y = 1.25 + Math.abs(Math.sin(animClock)) * (isRunning ? 0.1 : 0.05);
    } else {
      // Idle Breathing & Stance
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.15);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.15);
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, 0.15);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.15);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.15);
      // Subtle idle breathing
      torsoGroup.position.y = 1.25 + Math.sin(animClock) * 0.02;
      torsoGroup.scale.set(
        1 + Math.sin(animClock) * 0.015,
        1,
        1 + Math.sin(animClock) * 0.015
      );
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
    leftArmGroup,
    rightArmGroup,
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
