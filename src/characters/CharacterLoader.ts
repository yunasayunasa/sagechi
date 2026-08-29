import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { withoutRootMotion } from './AnimationController';
import type { CharacterConfig, SemanticAnimation } from './character-config';
export interface LoadedCharacter { root: THREE.Group; visualPivot: THREE.Group; model: THREE.Group; hitArea: THREE.Mesh; mixer: THREE.AnimationMixer; clips: ReadonlyMap<SemanticAnimation, THREE.AnimationClip>; ownedMaterials: Set<THREE.Material>; ownedTextures: Set<THREE.Texture>; }
export class CharacterLoader {
  private readonly loader = new GLTFLoader();
  async load(config: CharacterConfig): Promise<LoadedCharacter> {
    let gltf;
    try { gltf = await this.loader.loadAsync(config.glbPath); }
    catch (cause) { throw new Error(`GLBの読み込みに失敗しました: ${config.glbPath}`, { cause }); }
    const root = new THREE.Group(), visualPivot = new THREE.Group(), model = gltf.scene;
    const ownedMaterials = new Set<THREE.Material>(), ownedTextures = new Set<THREE.Texture>(); root.name = `${config.id}-root`; visualPivot.name = `${config.id}-visual-pivot`; root.add(visualPivot); visualPivot.add(model);
    model.traverse((node) => { if (!(node instanceof THREE.Mesh)) return; node.castShadow = false; node.receiveShadow = false; if (config.materialMode === 'toon') node.material = this.toon(node.material, ownedMaterials, ownedTextures); else if (config.materialMode === 'glossy') node.material = this.glossy(node.material, ownedMaterials, ownedTextures); });
    const initial = new THREE.Box3().setFromObject(model), height = initial.max.y - initial.min.y;
    if (!Number.isFinite(height) || height <= 0) throw new Error('GLBのBoundingBoxを取得できません。');
    model.scale.setScalar(config.targetHeight / height); model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const centerY = (box.max.y - box.min.y) / 2;
    visualPivot.position.y = centerY;
    model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y - centerY, -(box.min.z + box.max.z) / 2);
    const hitArea = new THREE.Mesh(new THREE.SphereGeometry(config.hitRadius, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff7eb6, transparent: true, opacity: 0, depthWrite: false }));
    hitArea.name = `${config.id}-hit-area`; hitArea.position.y = config.hitCenterY; root.add(hitArea);
    root.position.y = config.groundOffset;
    const mixer = new THREE.AnimationMixer(root), clips = new Map<SemanticAnimation, THREE.AnimationClip>();
    for (const [semantic, rawName] of Object.entries(config.animationMap ?? {}) as [SemanticAnimation, string][]) {
      const source = gltf.animations.find((clip) => clip.name === rawName);
      if (!source) { console.warn(`[CharacterLoader] ${config.id}: ${semantic} -> ${rawName} が見つかりません`); continue; }
      clips.set(semantic, semantic === 'walk' ? withoutRootMotion(source) : source.clone());
    }
    return { root, visualPivot, model, hitArea, mixer, clips, ownedMaterials, ownedTextures };
  }
  dispose(character: LoadedCharacter): void {
    character.mixer.stopAllAction(); character.mixer.uncacheRoot(character.root);
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
  private glossy(source: THREE.Material | THREE.Material[], materials: Set<THREE.Material>, textures: Set<THREE.Texture>): THREE.Material | THREE.Material[] {
    if (Array.isArray(source)) return source.map((material) => this.glossyOne(material, materials, textures));
    return this.glossyOne(source, materials, textures);
  }
  private glossyOne(source: THREE.Material, materials: Set<THREE.Material>, textures: Set<THREE.Texture>): THREE.MeshStandardMaterial {
    const standard = source as THREE.MeshStandardMaterial, map = standard.map ?? null;
    if (map) { map.colorSpace = THREE.SRGBColorSpace; textures.add(map); }
    const material = new THREE.MeshStandardMaterial({
      color: standard.color?.clone() ?? new THREE.Color(0xffffff), map,
      roughness: .24, metalness: .08, envMapIntensity: 1.35,
      transparent: source.transparent, opacity: source.opacity, side: source.side, alphaTest: source.alphaTest,
      emissive: standard.emissive?.clone() ?? new THREE.Color(0x07120c), emissiveIntensity: 0,
    });
    material.userData.baseEmissiveIntensity = 0;
    materials.add(material);
    return material;
  }
}
