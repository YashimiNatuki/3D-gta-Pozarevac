import * as THREE from 'three';

export interface ModularBuildingOptions {
  width: number;
  height: number;
  depth: number;
  bodyColor: number;
  roofColor?: number;
  windowColor?: number;
  floors?: number;
  name?: string;
  roofStyle?: 'gable' | 'flat';
}

export interface ModularBuildingBounds {
  width: number;
  height: number;
  depth: number;
}

export function getModularBuildingBounds(options: ModularBuildingOptions): ModularBuildingBounds {
  const roofHeight = options.roofStyle === 'flat' ? 0.28 : Math.max(0.7, Math.min(2.8, options.width * 0.24));
  return { width: options.width, height: options.height + roofHeight, depth: options.depth };
}

/**
 * Low-poly authored building fallback: readable architecture without a single
 * featureless cube, while keeping draw calls predictable and GLB-ready.
 */
export function createModularBuilding(options: ModularBuildingOptions): THREE.Group {
  const width = Math.max(1.5, options.width);
  const height = Math.max(1.8, options.height);
  const depth = Math.max(1.5, options.depth);
  const floors = Math.max(1, Math.floor(options.floors ?? Math.round(height / 3)));
  const group = new THREE.Group();
  group.name = options.name ?? 'Modular Požarevac building';

  const bodyMat = new THREE.MeshStandardMaterial({ color: options.bodyColor, roughness: 0.82, metalness: 0.08 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x283548, roughness: 0.6, metalness: 0.35 });
  const roofMat = new THREE.MeshStandardMaterial({ color: options.roofColor ?? 0x3b2634, roughness: 0.9, metalness: 0.04 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: options.windowColor ?? 0x203d52,
    emissive: options.windowColor ?? 0x0e7490,
    emissiveIntensity: 0.28,
    roughness: 0.28,
    metalness: 0.2,
  });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x241b23, roughness: 0.7, metalness: 0.15 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 0.18, depth + 0.18), trimMat);
  plinth.position.y = 0.09;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const roofHeight = options.roofStyle === 'flat' ? 0.28 : Math.max(0.7, Math.min(2.8, width * 0.24));
  if (options.roofStyle === 'flat') {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.32, roofHeight, depth + 0.32), roofMat);
    roof.position.y = height + roofHeight / 2;
    roof.castShadow = true;
    group.add(roof);
  } else {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), roofMat);
    roof.scale.set((width + 0.45) / 2, roofHeight, (depth + 0.45) / 2);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = height + roofHeight / 2;
    roof.castShadow = true;
    group.add(roof);
  }

  const windowWidth = Math.min(0.85, Math.max(0.42, width / Math.max(4, floors + 2)));
  const windowHeight = Math.min(1.0, Math.max(0.52, height / Math.max(5, floors + 1)));
  const frontZ = depth / 2 + 0.025;
  const sideX = width / 2 + 0.025;
  const floorHeight = height / floors;
  const windowGeo = new THREE.BoxGeometry(windowWidth, windowHeight, 0.06);
  const sideWindowGeo = new THREE.BoxGeometry(0.06, windowHeight, windowWidth);
  const windowColumns = Math.max(2, Math.floor(width / 1.35));
  const sideColumns = Math.max(1, Math.floor(depth / 1.55));

  for (let floor = 0; floor < floors; floor += 1) {
    const y = floorHeight * floor + floorHeight * 0.58;
    for (let column = 0; column < windowColumns; column += 1) {
      const x = -width / 2 + (column + 1) * width / (windowColumns + 1);
      const frontWindow = new THREE.Mesh(windowGeo, windowMat);
      frontWindow.position.set(x, y, frontZ);
      group.add(frontWindow);
      const backWindow = frontWindow.clone();
      backWindow.position.z = -frontZ;
      group.add(backWindow);
    }
    for (let column = 0; column < sideColumns; column += 1) {
      const z = -depth / 2 + (column + 1) * depth / (sideColumns + 1);
      const leftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
      leftWindow.position.set(-sideX, y, z);
      group.add(leftWindow);
      const rightWindow = leftWindow.clone();
      rightWindow.position.x = sideX;
      group.add(rightWindow);
    }

    if (floor > 0 && width >= 4.5) {
      const balcony = new THREE.Mesh(new THREE.BoxGeometry(Math.min(2.4, width * 0.42), 0.12, 0.7), trimMat);
      balcony.position.set(width * (floor % 2 === 0 ? -0.23 : 0.23), y - 0.42, frontZ + 0.32);
      group.add(balcony);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(balcony.scale.x || Math.min(2.4, width * 0.42), 0.42, 0.06), trimMat);
      rail.position.set(balcony.position.x, balcony.position.y + 0.24, balcony.position.z + 0.31);
      group.add(rail);
    }
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.05, width * 0.18), Math.min(2.15, height * 0.42), 0.08), doorMat);
  door.position.set(0, Math.min(1.05, height * 0.23), frontZ + 0.04);
  group.add(door);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.72), trimMat);
  canopy.position.set(0, door.position.y + door.geometry.parameters.height / 2 + 0.12, frontZ + 0.25);
  canopy.rotation.x = -0.1;
  group.add(canopy);

  if (width > 3.5 && height > 5) {
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.42), trimMat);
    chimney.position.set(width * 0.26, height + roofHeight * 0.72, -depth * 0.16);
    chimney.castShadow = true;
    group.add(chimney);
  }

  return group;
}
