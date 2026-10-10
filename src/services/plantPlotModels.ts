import * as THREE from 'three';
import { PlantPlot } from './streetEconomy';

const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x554238, roughness: 0.98 });
const bedEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3429, roughness: 0.9 });
const sproutMaterial = new THREE.MeshStandardMaterial({ color: 0x3d8c45, roughness: 0.75 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x68a85a, roughness: 0.68 });
const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xd8b4fe, roughness: 0.55, emissive: 0x2d1640 });
const signMaterial = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.65, emissive: 0x063b2c });
const stakeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b735e, roughness: 0.88 });

function addBox(parent: THREE.Group, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function deterministicOffset(seed: string, index: number): number {
  let hash = index + 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) / 0xffffffff) * 0.14 - 0.07;
}

export function buildPlantPlotModels(plots: readonly PlantPlot[]): THREE.Group {
  const root = new THREE.Group();
  root.name = 'District gardens — procedural crop beds';

  for (const plot of plots) {
    if (!plot.isUnlocked) continue;
    const bed = new THREE.Group();
    bed.name = `Garden plot: ${plot.id}`;
    bed.userData.plotId = plot.id;
    bed.position.set(plot.coords.x, 0, plot.coords.z);

    addBox(bed, [1.72, 0.11, 1.12], [0, 0.08, 0], soilMaterial);
    addBox(bed, [1.82, 0.17, 0.1], [0, 0.1, -0.61], bedEdgeMaterial);
    addBox(bed, [1.82, 0.17, 0.1], [0, 0.1, 0.61], bedEdgeMaterial);
    addBox(bed, [0.1, 0.17, 1.12], [-0.86, 0.1, 0], bedEdgeMaterial);
    addBox(bed, [0.1, 0.17, 1.12], [0.86, 0.1, 0], bedEdgeMaterial);

    // Low soil furrows keep the bed readable from a normal third-person camera.
    for (let row = -1; row <= 1; row += 1) {
      addBox(bed, [1.45, 0.018, 0.045], [0, 0.145, row * 0.27], bedEdgeMaterial);
    }

    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.52, 6), stakeMaterial);
    stake.position.set(0.98, 0.26, -0.35);
    bed.add(stake);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), signMaterial);
    marker.position.set(0.98, 0.57, -0.35);
    bed.add(marker);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 96;
    const labelContext = labelCanvas.getContext('2d');
    if (labelContext) {
      labelContext.fillStyle = 'rgba(5, 30, 24, 0.94)';
      labelContext.beginPath();
      labelContext.roundRect(8, 8, 240, 80, 18);
      labelContext.fill();
      labelContext.strokeStyle = '#34d399';
      labelContext.lineWidth = 5;
      labelContext.stroke();
      labelContext.fillStyle = '#d1fae5';
      labelContext.font = 'bold 30px sans-serif';
      labelContext.textAlign = 'center';
      labelContext.fillText('E  •  LEJA', 128, 60);
    }
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false }));
    label.scale.set(1.15, 0.43, 1);
    label.position.set(0.98, 0.9, -0.35);
    bed.add(label);

    if (plot.stage !== 'empty') {
      const heightScale = plot.stage === 'seedling' ? 0.38 : plot.stage === 'growing' ? 0.68 : plot.stage === 'blooming' ? 0.86 : 1;
      for (let index = 0; index < 6; index += 1) {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = (column - 1) * 0.43 + deterministicOffset(plot.id, index);
        const z = (row ? 0.27 : -0.27) + deterministicOffset(plot.id, index + 7);
        const stemHeight = (0.2 + deterministicOffset(plot.id, index + 11) * 0.7) * heightScale;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.032, stemHeight, 6), sproutMaterial);
        stem.position.set(x, 0.17 + stemHeight / 2, z);
        bed.add(stem);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.085 * heightScale, 8, 6), plot.stage === 'blooming' ? flowerMaterial : leafMaterial);
        leaf.scale.set(1.25, 0.62, 0.8);
        leaf.position.set(x + 0.06, 0.18 + stemHeight * 0.72, z);
        bed.add(leaf);
      }
    }

    root.add(bed);
  }
  return root;
}

export function disposePlantPlotModels(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
    const materialOwner = object instanceof THREE.Mesh || object instanceof THREE.Sprite ? object : null;
    if (!materialOwner) return;
    const materials = Array.isArray(materialOwner.material) ? materialOwner.material : [materialOwner.material];
    for (const material of materials) {
      if (material === soilMaterial || material === bedEdgeMaterial || material === sproutMaterial || material === leafMaterial || material === flowerMaterial || material === signMaterial || material === stakeMaterial) continue;
      (material as THREE.Material & { map?: THREE.Texture | null }).map?.dispose();
      material.dispose();
    }
  });
  group.clear();
}
