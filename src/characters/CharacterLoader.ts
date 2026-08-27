import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CharacterConfig } from './character-config';
export interface LoadedCharacter { root: THREE.Group; model: THREE.Group; hitArea: THREE.Mesh; ownedMaterials: Set<THREE.Material>; ownedTextures: Set<THREE.Texture>; }
export class CharacterLoader {
  private readonly loader = new GLTFLoader();
  async load(config: CharacterConfig): Promise<LoadedCharacter> {
    let gltf;
    try { gltf = await this.loader.loadAsync(config.glbPath); }
    catch (cause) { throw new Error(`GLBの読み込みに失敗しました: ${config.glbPath}`, { cause }); }
    const root = new THREE.Group(), model = gltf.scene;
    const ownedMaterials = new Set<THREE.Material>(), ownedTextures = new Set<THREE.Texture>(); root.name = `${config.id}-root`; root.add(model);
    model.traverse((node) => { if (!(node instanceof THREE.Mesh)) return; node.castShadow = false; node.receiveShadow = false; if (config.materialMode === 'toon') node.material = this.toon(node.material, ownedMaterials, ownedTextures); });
    const initial = new THREE.Box3().setFromObject(model), height = initial.max.y - initial.min.y;
    if (!Number.isFinite(height) || height <= 0) throw new Error('GLBのBoundingBoxを取得できません。');
    model.scale.setScalar(config.targetHeight / height); model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const hitArea = new THREE.Mesh(new THREE.SphereGeometry(config.hitRadius, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff7eb6, transparent: true, opacity: 0, depthWrite: false }));
    hitArea.name = 'worldtchi-hit-area'; hitArea.position.y = config.hitCenterY; root.add(hitArea);
    return { root, model, hitArea, ownedMaterials, ownedTextures };
  }
  dispose(character: LoadedCharacter): void {
    character.root.parent?.remove(character.root); character.root.traverse((node) => { if (node instanceof THREE.Mesh) node.geometry.dispose(); });
    character.ownedMaterials.forEach((m) => m.dispose()); character.ownedTextures.forEach((t) => t.dispose());
  }
  private toon(source: THREE.Material | THREE.Material[], materials: Set<THREE.Material>, textures: Set<THREE.Texture>): THREE.Material | THREE.Material[] {
    if (Array.isArray(source)) return source.map((m) => this.toonOne(m, materials, textures)); return this.toonOne(source, materials, textures);
  }
  private toonOne(source: THREE.Material, materials: Set<THREE.Material>, textures: Set<THREE.Texture>): THREE.MeshToonMaterial {
    const standard = source as THREE.MeshStandardMaterial, map = standard.map?.clone() ?? null; if (map) { map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true; textures.add(map); }
    const material = new THREE.MeshToonMaterial({ color: standard.color?.clone() ?? new THREE.Color(0xffffff), map, transparent: source.transparent, opacity: source.opacity, side: source.side, alphaTest: source.alphaTest, emissive: standard.emissive?.clone() ?? new THREE.Color(0x07120c), emissiveIntensity: 0 }); materials.add(material); return material;
  }
}
