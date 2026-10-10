import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MAX_CHARACTER_BYTES = 100 * 1024 * 1024;

/** Parse a self-contained local GLB. External URI assets are intentionally not fetched. */
export async function parseLocalCharacterGlb(file: File): Promise<{
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  hasSkinnedMesh: boolean;
}> {
  if (!/\.glb$/i.test(file.name) && file.type !== 'model/gltf-binary') {
    throw new Error('Uvezi self-contained .glb model (teksture i skinning moraju biti ugrađeni u fajl).');
  }
  if (file.size <= 0 || file.size > MAX_CHARACTER_BYTES) {
    throw new Error('GLB model mora biti manji od 100 MB.');
  }

  const data = await file.arrayBuffer();
  if (data.byteLength < 20) throw new Error('GLB fajl je prekratak da sadrži validan model.');
  const header = new DataView(data);
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== data.byteLength) {
    throw new Error('Podržan je samo validan glTF 2.0 GLB kontejner.');
  }
  const jsonLength = header.getUint32(12, true);
  const jsonChunkType = header.getUint32(16, true);
  if (jsonChunkType !== 0x4e4f534a || jsonLength < 2 || 20 + jsonLength > data.byteLength) {
    throw new Error('GLB JSON chunk nije validan.');
  }
  const document = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength))) as {
    buffers?: Array<{ uri?: string }>;
    images?: Array<{ uri?: string }>;
  };
  const externalUris = [...(document.buffers ?? []), ...(document.images ?? [])]
    .map((resource) => resource.uri)
    .filter((uri): uri is string => Boolean(uri && !uri.startsWith('data:')));
  if (externalUris.length) throw new Error('GLB mora biti self-contained; eksterni URL i prateće fajlove ne učitavam.');

  const gltf = await new GLTFLoader().parseAsync(data, '');
  let hasSkinnedMesh = false;
  gltf.scene.traverse((object) => {
    if ((object as THREE.SkinnedMesh).isSkinnedMesh) hasSkinnedMesh = true;
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  if (!gltf.scene.children.length) throw new Error('GLB nema upotrebljivu scenu.');
  return { scene: gltf.scene, animations: gltf.animations, hasSkinnedMesh };
}
