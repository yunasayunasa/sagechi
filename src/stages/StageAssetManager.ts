import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class StageAssetManager {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<THREE.Object3D>>();
  private readonly materials = new Set<THREE.Material>();
  private readonly geometries = new Set<THREE.BufferGeometry>();

  async instantiate(path: string): Promise<THREE.Object3D> {
    let cached = this.cache.get(path);
    if (!cached) { cached = this.loadTemplate(path); this.cache.set(path, cached); }
    return (await cached).clone(true);
  }

  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.clear(); this.geometries.clear(); this.cache.clear();
  }

  private async loadTemplate(path: string): Promise<THREE.Object3D> {
    const gltf = await this.loader.loadAsync(path);
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      this.geometries.add(node.geometry);
      const sources = Array.isArray(node.material) ? node.material : [node.material];
      const converted = sources.map((source) => {
        const standard = source as THREE.MeshStandardMaterial;
        const toon = new THREE.MeshToonMaterial({ color: standard.color?.clone() ?? new THREE.Color(0xffffff), map: standard.map ?? null, transparent: source.transparent, opacity: source.opacity, side: source.side, alphaTest: source.alphaTest });
        this.materials.add(toon); source.dispose(); return toon;
      });
      node.material = Array.isArray(node.material) ? converted : converted[0];
      node.castShadow = false; node.receiveShadow = false;
    });
    return gltf.scene;
  }
}
