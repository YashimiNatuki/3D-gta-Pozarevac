import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function disposeGroupChildren(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  group.clear();
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

function replaceFallbackWithGlb(
  world: THREE.Group,
  target: THREE.Group,
  url: string,
  fit: THREE.Vector3,
  onLoaded: () => void,
): void {
  new GLTFLoader().load(url, (gltf) => {
    if (!world.parent || !target.parent) return;
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(model);
    if (sourceBounds.isEmpty()) return;
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const scale = Math.min(
      fit.x / Math.max(sourceSize.x, 0.01),
      fit.y / Math.max(sourceSize.y, 0.01),
      fit.z / Math.max(sourceSize.z, 0.01),
    );
    const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
    model.scale.setScalar(scale);
    model.position.set(-sourceCenter.x * scale, -sourceBounds.min.y * scale, -sourceCenter.z * scale);
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    disposeGroupChildren(target);
    model.name = `Generated landmark asset: ${url.split('/').pop()}`;
    target.add(model);
    onLoaded();
  }, undefined, (error) => {
    // Keep the authored geometry when the optional downloadable GLB cannot be loaded.
    console.warn(`[Landmarks] GLB fallback retained for ${url}`, error);
  });
}

/** Compact, authored gameplay landmarks around the central Požarevac map. */
export function buildUrbanMicroLandmarks(scene: THREE.Scene): THREE.Group {
  const world = new THREE.Group();
  world.name = 'Urban Micro-landmarks — Požarevac';

  const concrete = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.86 });
  const paleStone = new THREE.MeshStandardMaterial({ color: 0x9aa9b6, roughness: 0.78 });
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x263443, roughness: 0.96 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x132337, roughness: 0.8, metalness: 0.18 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x874f43, roughness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x14394d, emissive: 0x08728a, emissiveIntensity: 0.22, roughness: 0.3, metalness: 0.22 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x0e7490, emissive: 0x06b6d4, emissiveIntensity: 0.65, roughness: 0.4 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0xf59e0b, emissiveIntensity: 0.42, roughness: 0.45 });
  const green = new THREE.MeshStandardMaterial({ color: 0x285b48, roughness: 0.95 });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const postGeo = new THREE.CylinderGeometry(0.045, 0.065, 1, 7);
  const dummy = new THREE.Object3D();

  const box = (parent: THREE.Group, material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const mesh = new THREE.Mesh(boxGeo, material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sign = (parent: THREE.Group, text: string, color: string, x: number, y: number, z: number, w = 4.2, h = 0.72) => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#07111e'; ctx.fillRect(0, 0, 768, 160);
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.strokeRect(7, 7, 754, 146);
      ctx.fillStyle = '#ecfeff'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 384, 82, 720);
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: false }));
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const layer = (name: string, x: number, z: number) => {
    const g = new THREE.Group(); g.name = name; g.position.set(x, 0, z); world.add(g); return g;
  };

  // Vašarište: inset track with a grass infield and a compact, floodlit grandstand.
  const stadium = layer('Vašarište — stadion i atletska staza', -24, 12);
  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, 6.8, 4.6, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path(); hole.absellipse(0, 0, 5.15, 3.05, 0, Math.PI * 2, true, 0); trackShape.holes.push(hole);
  const track = new THREE.Mesh(new THREE.ShapeGeometry(trackShape, 40), new THREE.MeshStandardMaterial({ color: 0xa74239, roughness: 0.92, side: THREE.DoubleSide }));
  track.rotation.x = -Math.PI / 2; track.position.y = 0.035; stadium.add(track);
  const infield = new THREE.Mesh(new THREE.CircleGeometry(1, 32), green); infield.scale.set(5.05, 3, 1); infield.rotation.x = -Math.PI / 2; infield.position.y = 0.02; stadium.add(infield);
  // Fine lane stripes follow the oval as efficient sampled line geometry.
  for (let r = 0; r < 3; r++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * (5.45 + r * 0.43), 0.055, Math.sin(a) * (3.23 + r * 0.43))); }
    stadium.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xf5c2a5, transparent: true, opacity: 0.72 })));
  }
  box(stadium, concrete, 0, 0.28, -5.45, 8.2, 0.52, 1.15);
  box(stadium, dark, 0, 0.7, -5.45, 7.8, 0.24, 0.9);
  for (let row = 0; row < 3; row++) box(stadium, paleStone, 0, 0.94 + row * 0.22, -5.4 + row * 0.22, 7.2 - row * 0.5, 0.12, 0.16);
  sign(stadium, 'VAŠARIŠTE  •  SPORTSKI CENTAR', '#22d3ee', 0, 2.05, -6.08, 6.5, 0.64);
  const mastGeo = new THREE.CylinderGeometry(0.035, 0.05, 3.8, 6);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x71869a, metalness: 0.55, roughness: 0.4 });
  for (const [x, z] of [[-6.6,-4.8],[6.6,-4.8],[-6.6,4.8],[6.6,4.8]]) {
    const mast = new THREE.Mesh(mastGeo, mastMat); mast.position.set(x, 1.9, z); stadium.add(mast);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.18), amber); lamp.position.set(x, 3.78, z); stadium.add(lamp);
  }
  replaceFallbackWithGlb(world, stadium, '/assets/landmarks/vasariste-stadium.glb', new THREE.Vector3(13, 4.5, 9), () => {
    sign(stadium, 'VAŠARIŠTE  •  GRADSKI STADION', '#22d3ee', 0, 4.35, -4.5, 7.4, 0.62);
  });

  // Stari Korzo: distinct low-rise shopfront rhythm, awnings and illuminated street-facing names.
  const korzo = layer('Stari Korzo — izlozi i pasaž', 9, -4);
  box(korzo, paleStone, 0, 0.12, 0, 8.8, 0.22, 3.1);
  const shopWidths = [2.35, 2.35, 2.35];
  const shopMats = [brick, concrete, new THREE.MeshStandardMaterial({ color: 0x66586b, roughness: 0.84 })];
  let sx = -3.05;
  shopWidths.forEach((w, i) => {
    const x = sx + w / 2;
    box(korzo, shopMats[i], x, 1.7, -0.35, w, 3.15, 1.65);
    box(korzo, dark, x, 0.95, 0.51, w * 0.72, 1.55, 0.08);
    box(korzo, glass, x, 1.03, 0.57, w * 0.58, 1.22, 0.035);
    box(korzo, amber, x, 1.93, 0.63, w * 0.86, 0.11, 0.12);
    box(korzo, shopMats[i], x, 3.38, -0.35, w + 0.16, 0.18, 1.94);
    sign(korzo, ['KAFIĆ','KNJIŽARA','ZANAT'][i], ['#f59e0b','#22d3ee','#f472b6'][i], x, 2.72, 0.57, w * 0.88, 0.4);
    sx += w + 0.23;
  });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 8, 20, Math.PI), cyan); arch.position.set(0, 2.42, 0.52); korzo.add(arch);
  box(korzo, dark, 0, 1.75, 0.5, 1.38, 1.6, 0.16);
  replaceFallbackWithGlb(world, korzo, '/assets/landmarks/stari-korzo-block.glb', new THREE.Vector3(10, 7, 5), () => {
    sign(korzo, 'STARI KORZO', '#f59e0b', 0, 6.4, 0.7, 4.3, 0.58);
  });

  // General public-facing hospital arrival forecourt only; no interiors or security infrastructure.
  const hospital = layer('Opšta bolnica — javni spoljašnji ulaz', -14, -24);
  box(hospital, concrete, 0, 0.12, 0, 8.2, 0.22, 5.2);
  box(hospital, paleStone, 0, 2.15, -0.8, 7.2, 4.05, 2.65);
  box(hospital, paleStone, -2.85, 1.82, 1.28, 1.5, 3.35, 1.9);
  box(hospital, paleStone, 2.85, 1.82, 1.28, 1.5, 3.35, 1.9);
  for (const x of [-2.75, -1.55, -0.35, 0.85, 2.05, 3.25]) {
    box(hospital, glass, x, 2.65, 0.56, 0.62, 0.9, 0.055);
    box(hospital, glass, x, 1.45, 0.56, 0.62, 0.72, 0.055);
  }
  box(hospital, dark, 0, 1.04, 0.57, 1.25, 1.9, 0.12);
  box(hospital, glass, 0, 1.1, 0.65, 0.84, 1.55, 0.035);
  sign(hospital, 'OPŠTA BOLNICA', '#67e8f9', 0, 3.35, 0.58, 4.4, 0.62);
  const cross = new THREE.Group(); cross.position.set(0, 4.3, 0.64); hospital.add(cross);
  box(cross, cyan, 0, 0, 0, 0.58, 0.14, 0.08); box(cross, cyan, 0, 0, 0, 0.14, 0.58, 0.08);
  // Public drop-off canopy and path; deliberately no access-control/security props.
  box(hospital, dark, 0, 2.5, 2.0, 3.5, 0.16, 1.2);
  for (const x of [-1.45, 1.45]) { const p = new THREE.Mesh(postGeo, paleStone); p.position.set(x, 1.28, 2.25); hospital.add(p); }
  box(hospital, paleStone, 0, 0.08, 3.35, 3.8, 0.12, 1.3);
  replaceFallbackWithGlb(world, hospital, '/assets/landmarks/pozarevac-hospital.glb', new THREE.Vector3(10, 7, 7), () => {
    sign(hospital, 'OPŠTA BOLNICA', '#67e8f9', 0, 6.25, 0.75, 4.6, 0.62);
  });

  // Informal local labels in Tabačka: recognizable micro-block massing rather than claims of official sites.
  const blokC = layer('Blok C — lokalni orijentir Tabačke', 4, -12);
  box(blokC, asphalt, 0, 0.08, 0, 4.4, 0.16, 3.6);
  for (const [x,z] of [[-1.25,-0.9],[1.15,-0.9],[-1.25,0.95],[1.15,0.95]]) {
    box(blokC, brick, x, 1.05, z, 1.35, 1.9, 1.25);
    box(blokC, amber, x, 1.0, z + 0.64, 0.36, 0.42, 0.045);
    box(blokC, dark, x, 0.55, z + 0.65, 0.42, 0.8, 0.06);
  }
  sign(blokC, 'BLOK C', '#f59e0b', 0, 2.25, 1.55, 2.9, 0.55);

  const favele = layer('Đuranske favele — lokalni orijentir', -4, -6);
  box(favele, asphalt, 0, 0.07, 0, 4.5, 0.14, 4.1);
  // Repeated small homes, lean-to roofs, and a shared lane produce a legible but compact informal quarter.
  for (const [x,z] of [[-1.15,-1.05],[1.1,-1.05],[-1.15,1.1],[1.1,1.1]]) {
    box(favele, new THREE.MeshStandardMaterial({ color: x < 0 ? 0x80634e : 0x6b7073, roughness: 0.95 }), x, 0.78, z, 1.45, 1.4, 1.3);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.08, 0.56, 4), new THREE.MeshStandardMaterial({ color: 0x493e3a, roughness: 0.9 }));
    roof.position.set(x, 1.72, z); roof.rotation.y = Math.PI / 4; favele.add(roof);
    box(favele, amber, x, 0.82, z + 0.66, 0.33, 0.38, 0.045);
  }
  sign(favele, 'ĐURANSKE FAVELE', '#fb923c', 0, 2.36, 1.75, 3.7, 0.52);

  // Busije: modest hillside edge, lookout marker and a short, readable approach path.
  const busije = layer('Busije — uzvišeni rub grada', -26, -4);
  const mound = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.4, 9), green); mound.position.set(0, 0.63, 0); mound.scale.z = 0.76; busije.add(mound);
  const lookout = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 0.28, 10), woodMaterial()); lookout.position.set(0, 1.42, -0.1); busije.add(lookout);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.48), cyan); marker.position.set(0, 2.05, -0.1); busije.add(marker);
  sign(busije, 'BUSIJE', '#22d3ee', 0, 2.7, 0.95, 2.8, 0.52);
  const pathPoints = [new THREE.Vector3(0,0.055,3.3), new THREE.Vector3(-0.7,0.055,2.1), new THREE.Vector3(-0.3,0.055,1.1)];
  busije.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pathPoints), 14, 0.24, 6, false), new THREE.MeshStandardMaterial({ color: 0xb39a74, roughness: 1 })));

  // Fictional service-route marker only: abstract waypoint, not a depiction of real infrastructure.
  const route = layer('Đurđeve rupe — fictional abstract service route', -8, -18);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.11, 8, 32), cyan); ring.position.y = 0.2; ring.rotation.x = Math.PI / 2; route.add(ring);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.46), amber); beacon.position.y = 1.0; route.add(beacon);
  const routeSign = sign(route, 'ĐURĐEVE RUPE  //  RUTA', '#22d3ee', 0, 2.0, 0.2, 4.1, 0.55);
  routeSign.rotation.y = -0.28;
  const routePosts = new THREE.InstancedMesh(postGeo, cyan, 5);
  [[-1.8,0.8],[-0.9,1.2],[0,1.35],[0.9,1.2],[1.8,0.8]].forEach(([x,z], i) => {
    dummy.position.set(x, 0.43, z); dummy.scale.set(1, 0.86, 1); dummy.rotation.set(0,0,0); dummy.updateMatrix(); routePosts.setMatrixAt(i, dummy.matrix);
  });
  routePosts.instanceMatrix.needsUpdate = true; route.add(routePosts);

  scene.add(world);
  return world;
}

// Shared-style wooden-toned plinth material for the Busije lookout.
function woodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x76533a, roughness: 0.92 });
}
