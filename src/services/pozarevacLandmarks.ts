import * as THREE from 'three';

export interface CultivationZone {
  id: string;
  name: string;
  center: { x: number; z: number };
  radius: number;
  crop: 'cyber_bloom' | 'mint' | 'lavender';
}

const sign = (text: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#07111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  return new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), emissive: new THREE.Color(color), emissiveIntensity: 0.5 })
  );
};

const addTree = (group: THREE.Group, x: number, z: number, scale = 1) => {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.22 * scale, 2.4 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x51351f, roughness: 0.95 }),
  );
  trunk.position.set(x, 1.2 * scale, z);
  const crown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.15 * scale, 1),
    new THREE.MeshStandardMaterial({ color: 0x1f7a4c, roughness: 0.88 }),
  );
  crown.position.set(x, 2.8 * scale, z);
  crown.castShadow = true;
  group.add(trunk, crown);
};

const addPath = (group: THREE.Group, points: Array<[number, number]>, color = 0x9a7650) => {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.025, z)));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(8, points.length * 5), 0.72, 6, false),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  mesh.scale.y = 0.04;
  group.add(mesh);
};

const addCultivationPlot = (group: THREE.Group, zone: CultivationZone) => {
  const soil = new THREE.MeshStandardMaterial({ color: 0x5c3b25, roughness: 1 });
  const cropColors = { cyber_bloom: 0xf472b6, mint: 0x34d399, lavender: 0xa78bfa };
  const plot = new THREE.Mesh(new THREE.BoxGeometry(zone.radius * 2, 0.18, zone.radius * 1.3), soil);
  plot.position.set(zone.center.x, 0.09, zone.center.z);
  group.add(plot);
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -3; col <= 3; col += 1) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.04, 0.5, 5),
        new THREE.MeshStandardMaterial({ color: 0x166534 }),
      );
      stem.position.set(zone.center.x + col * 0.45, 0.38, zone.center.z + row * 0.34);
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 6),
        new THREE.MeshStandardMaterial({ color: cropColors[zone.crop], emissive: cropColors[zone.crop], emissiveIntensity: 0.35 }),
      );
      flower.position.set(stem.position.x, 0.68, stem.position.z);
      group.add(stem, flower);
    }
  }
};

export const CULTIVATION_ZONES: CultivationZone[] = [
  { id: 'grow_cacalica_01', name: 'Čačalica — neon bašta', center: { x: 15, z: 12 }, radius: 2.2, crop: 'cyber_bloom' },
  { id: 'grow_tulba_01', name: 'Tulba — lekoviti redovi', center: { x: 12, z: 29 }, radius: 2.4, crop: 'lavender' },
  { id: 'grow_park_01', name: 'Gradski park — urbana nana', center: { x: -11, z: 7 }, radius: 1.8, crop: 'mint' },
];

export function buildPozarevacLandmarks(scene: THREE.Scene): THREE.Group {
  const world = new THREE.Group();
  world.name = 'Požarevac Landmark Layer — Tulba / Čačalica';
  const stone = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x704f35, roughness: 0.95 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x0e7490, emissive: 0x06b6d4, emissiveIntensity: 0.5 });

  // Čačalica: layered hill, lookout deck, trees and a cultivated cyber-bloom plot.
  const cacalica = new THREE.Group();
  cacalica.name = 'Landmark Čačalica — Kvantni Vidikovac';
  const hill = new THREE.Mesh(new THREE.ConeGeometry(9, 4.5, 12), new THREE.MeshStandardMaterial({ color: 0x315b42, roughness: 1 }));
  hill.position.set(17, 2.2, 13);
  cacalica.add(hill);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.2, 0.35, 12), wood);
  deck.position.set(17, 4.45, 13);
  cacalica.add(deck);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), cyan);
  beacon.position.set(17, 5.3, 13);
  cacalica.add(beacon);
  const cacalicaSign = sign('ČAČALICA // VIDIKOVAC', '#22d3ee');
  cacalicaSign.position.set(17, 5.2, 10.8);
  cacalicaSign.rotation.y = Math.PI;
  cacalica.add(cacalicaSign);
  [[11, 8], [23, 9], [10, 18], [24, 19], [18, 6], [7, 14]].forEach(([x, z]) => addTree(cacalica, x, z, 0.9));
  addPath(cacalica, [[0, 0], [8, 7], [13, 10], [17, 13]]);
  addCultivationPlot(cacalica, CULTIVATION_ZONES[0]);
  world.add(cacalica);

  // Tulba: open-air museum style cabins, watchtower, lanterns and lavender rows.
  const tulba = new THREE.Group();
  tulba.name = 'Landmark Tulba — Etno Neon Sektor';
  const base = new THREE.Mesh(new THREE.BoxGeometry(11, 0.22, 8), stone);
  base.position.set(12, 0.12, 29);
  tulba.add(base);
  [[8, 27], [16, 27], [8, 33], [16, 33]].forEach(([x, z]) => {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 2.4), wood);
    cabin.position.set(x, 1.2, z);
    cabin.castShadow = true;
    tulba.add(cabin);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x9f4d2e, roughness: 0.9 }));
    roof.position.set(x, 3, z);
    roof.rotation.y = Math.PI / 4;
    tulba.add(roof);
  });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6.5, 8), wood);
  tower.position.set(19, 3.25, 29);
  tulba.add(tower);
  const towerTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 8), cyan);
  towerTop.position.set(19, 6.55, 29);
  tulba.add(towerTop);
  const tulbaSign = sign('TULBA // ETNO NEON', '#f59e0b');
  tulbaSign.position.set(12, 3.1, 24.8);
  tulba.add(tulbaSign);
  addPath(tulba, [[12, 21], [12, 25], [12, 29]]);
  addCultivationPlot(tulba, CULTIVATION_ZONES[1]);
  world.add(tulba);

  // Urban park cultivation is deliberately smaller and closer to the player's existing route.
  const park = new THREE.Group();
  park.name = 'Landmark Gradski Park — Urbana Bašta';
  addCultivationPlot(park, CULTIVATION_ZONES[2]);
  const parkSign = sign('URBANA BAŠTA // PARK', '#34d399');
  parkSign.position.set(-11, 2.2, 4.8);
  park.add(parkSign);
  world.add(park);

  scene.add(world);
  return world;
}
