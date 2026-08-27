import * as THREE from 'three';
import { StageAssetManager } from './StageAssetManager';
import type { LoadedStage, StageConfig, StageGeometryItem } from './stage-types';

export class StageLoader {
  constructor(private readonly assets: StageAssetManager) {}

  async load(config: StageConfig): Promise<LoadedStage> {
    const root = new THREE.Group(); root.name = `stage-${config.id}`;
    const registry = new Map(config.assets.map((asset) => [asset.id, asset.path]));
    const interestPoints: THREE.Object3D[] = [];
    const ownedGeometries = new Set<THREE.BufferGeometry>(), ownedMaterials = new Set<THREE.Material>();
    for (const placement of config.placements) {
      const path = registry.get(placement.assetId); if (!path) throw new Error(`Stage Assetが未定義です: ${placement.assetId}`);
      const object = await this.assets.instantiate(path); object.name = placement.assetId;
      object.position.set(...placement.position); object.rotation.y = placement.rotationY ?? 0; object.scale.setScalar(placement.scale ?? 1); root.add(object);
      if (placement.interestTypes) interestPoints.push(this.makeInterestPoint(object.name, placement.position, placement.interestTypes, root));
    }
    for (const item of config.geometry) {
      const object = this.createGeometry(item); object.traverse((node) => { if (node instanceof THREE.Mesh) { ownedGeometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : [node.material]) ownedMaterials.add(material); } }); root.add(object);
      if (item.interestTypes) interestPoints.push(this.makeInterestPoint(item.id, item.position, item.interestTypes, root));
    }
    return { root, obstacles: config.movement.obstacles, interestPoints, ownedGeometries, ownedMaterials };
  }

  dispose(stage: LoadedStage): void { stage.root.parent?.remove(stage.root); stage.ownedMaterials.forEach((material) => material.dispose()); stage.ownedGeometries.forEach((geometry) => geometry.dispose()); }

  private createGeometry(item: StageGeometryItem): THREE.Object3D {
    const factories: Record<StageGeometryItem['kind'], () => THREE.Object3D> = {
      ground: () => this.createGround(), fence: () => this.createFence(), pool: () => this.createPool(), 'toy-ball': () => this.createBall(),
      'kids-room-shell': () => this.createKidsRoom(), 'kids-rug': () => this.createRug(), rattle: () => this.createRattle(),
      'japanese-room-shell': () => this.createJapaneseRoom(), 'low-table': () => this.createLowTable(), cushion: () => this.createCushion(), vase: () => this.createVase(),
    };
    const object = factories[item.kind](); object.name = item.id; object.position.set(...item.position); object.rotation.y = item.rotationY ?? 0; object.scale.setScalar(item.scale ?? 1); return object;
  }

  private toon(color: number, options: Partial<THREE.MeshToonMaterialParameters> = {}): THREE.MeshToonMaterial { return new THREE.MeshToonMaterial({ color, ...options }); }
  private box(size: readonly [number, number, number], color: number, position: readonly [number, number, number]): THREE.Mesh { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.toon(color)); mesh.position.set(...position); return mesh; }
  private createGround(): THREE.Mesh { const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 48), this.toon(0x72ad68)); ground.rotation.x = -Math.PI / 2; return ground; }
  private createFence(): THREE.Group { const group = new THREE.Group(), wood = this.toon(0xf2d5a0), geometry = new THREE.BoxGeometry(.12, .85, .12), posts = new THREE.InstancedMesh(geometry, wood, 13), matrix = new THREE.Matrix4(); for (let index = 0; index < 13; index++) posts.setMatrixAt(index, matrix.makeTranslation(-4.2 + index * .7, .42, 0)); group.add(posts); for (const y of [.28, .65]) group.add(this.box([8.5, .1, .1], 0xf2d5a0, [0, y, 0])); return group; }
  private createPool(): THREE.Group { const group = new THREE.Group(), outer = new THREE.Mesh(new THREE.TorusGeometry(.72, .16, 8, 24), this.toon(0x69c9e8)), inner = new THREE.Mesh(new THREE.TorusGeometry(.45, .095, 8, 24), this.toon(0xc8f4ff)), water = new THREE.Mesh(new THREE.CylinderGeometry(.56, .56, .025, 24), this.toon(0x83dcf2, { transparent: true, opacity: .82 })); outer.rotation.x = inner.rotation.x = Math.PI / 2; outer.position.y = .17; inner.position.y = .14; water.position.y = .135; group.add(outer, inner, water); return group; }
  private createBall(): THREE.Mesh { return new THREE.Mesh(new THREE.SphereGeometry(.23, 12, 8), this.toon(0xffdf69)); }

  private createKidsRoom(): THREE.Group { const group = new THREE.Group(); group.add(this.box([8.2, .16, 6.2], 0xf1d7b9, [0, -.08, 0]), this.box([8.2, 3.25, .12], 0xf7d8df, [0, 1.62, -3]), this.box([.12, 3.25, 6.1], 0xd6e8f2, [-4.05, 1.62, 0]), this.box([.12, 3.25, 6.1], 0xe8ddf6, [4.05, 1.62, 0])); for (const x of [-2.6, 0, 2.6]) group.add(this.box([1.6, .1, .05], 0xffffff, [x, 2.25, -2.925])); return group; }
  private createRug(): THREE.Mesh { const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .04, 28), this.toon(0xffd580)); rug.scale.z = .72; return rug; }
  private createRattle(): THREE.Group { const group = new THREE.Group(), handle = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, .38, 10), this.toon(0xffedc7)), ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 7, 18), this.toon(0xf39ab7)); handle.rotation.z = Math.PI / 2; ring.rotation.y = Math.PI / 2; ring.position.x = .22; group.add(handle, ring); return group; }

  private createJapaneseRoom(): THREE.Group { const group = new THREE.Group(); group.add(this.box([8.2, .14, 6.2], 0xb98b5c, [0, -.08, 0]), this.box([8.2, 3.25, .12], 0xf1e6cc, [0, 1.62, -3]), this.box([.12, 3.25, 6.1], 0xe8dcc0, [-4.05, 1.62, 0]), this.box([.12, 3.25, 6.1], 0xe8dcc0, [4.05, 1.62, 0])); const geo = new THREE.BoxGeometry(1.88, .08, 1.35), mats = new THREE.InstancedMesh(geo, this.toon(0xc8c486), 6), matrix = new THREE.Matrix4(); let index = 0; for (const z of [-1.42, 0, 1.42]) for (const x of [-.98, .98]) mats.setMatrixAt(index++, matrix.makeTranslation(x, .02, z)); group.add(mats); for (const x of [-1.94, 0, 1.94]) group.add(this.box([.045, .105, 4.25], 0x566448, [x, .045, 0])); for (const z of [-2.13, -.71, .71, 2.13]) group.add(this.box([3.92, .105, .045], 0x566448, [0, .045, z])); group.add(this.createShoji()); return group; }
  private createShoji(): THREE.Group { const group = new THREE.Group(), panel = this.box([3.55, 2.35, .045], 0xfffbeb, [1.55, 1.42, -2.91]); (panel.material as THREE.MeshToonMaterial).transparent = true; (panel.material as THREE.MeshToonMaterial).opacity = .9; group.add(panel); const wood = 0x75553b; for (const x of [-.23, .66, 1.55, 2.44, 3.33]) group.add(this.box([.055, 2.42, .08], wood, [x, 1.42, -2.85])); for (const y of [.22, .82, 1.42, 2.02, 2.62]) group.add(this.box([3.65, .055, .08], wood, [1.55, y, -2.85])); return group; }
  private createLowTable(): THREE.Group { const group = new THREE.Group(); group.add(this.box([1.55, .14, 1.05], 0x8b5d3c, [0, .52, 0])); for (const x of [-.62, .62]) for (const z of [-.37, .37]) group.add(this.box([.14, .48, .14], 0x68452f, [x, .25, z])); return group; }
  private createCushion(): THREE.Mesh { const cushion = new THREE.Mesh(new THREE.BoxGeometry(.72, .15, .72, 3, 1, 3), this.toon(0xb55c62)); cushion.geometry.translate(0, .075, 0); return cushion; }
  private createVase(): THREE.Group { const group = new THREE.Group(), pot = new THREE.Mesh(new THREE.CylinderGeometry(.16, .12, .35, 12), this.toon(0x5f8a8b)), stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .52, 7), this.toon(0x5b7e44)); stem.position.y = .42; group.add(pot, stem); return group; }
  private makeInterestPoint(name: string, position: readonly [number, number, number], types: readonly string[], parent: THREE.Object3D): THREE.Object3D { const point = new THREE.Object3D(); point.name = `interest-${name}`; point.position.set(...position); point.userData.interestTypes = [...types]; parent.add(point); return point; }
}
