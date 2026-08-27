import * as THREE from 'three';
import { StageAssetManager } from './StageAssetManager';
import type { LoadedStage, StageConfig, StageGeometryItem } from './stage-types';

export class StageLoader {
  private readonly generatedMaterials = new Set<THREE.Material>();
  private readonly generatedGeometries = new Set<THREE.BufferGeometry>();
  constructor(private readonly assets: StageAssetManager) {}

  async load(config: StageConfig): Promise<LoadedStage> {
    const root = new THREE.Group(); root.name = `stage-${config.id}`;
    const registry = new Map(config.assets.map((asset) => [asset.id, asset.path]));
    const interestPoints: THREE.Object3D[] = [];
    for (const placement of config.placements) {
      const path = registry.get(placement.assetId); if (!path) throw new Error(`Stage Assetが未定義です: ${placement.assetId}`);
      const object = await this.assets.instantiate(path); object.name = placement.assetId;
      object.position.set(...placement.position); object.rotation.y = placement.rotationY ?? 0; object.scale.setScalar(placement.scale ?? 1); root.add(object);
      if (placement.interestTypes) interestPoints.push(this.makeInterestPoint(object.name, placement.position, placement.interestTypes, root));
    }
    for (const item of config.geometry) {
      const object = this.createGeometry(item); object.traverse((node) => { if (node instanceof THREE.Mesh) { this.generatedGeometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : [node.material]) this.generatedMaterials.add(material); } }); root.add(object);
      if (item.interestTypes) interestPoints.push(this.makeInterestPoint(item.id, item.position, item.interestTypes, root));
    }
    return { root, obstacles: config.movement.obstacles, interestPoints };
  }

  dispose(stage: LoadedStage): void {
    stage.root.parent?.remove(stage.root);
    this.generatedMaterials.forEach((material) => material.dispose());
    this.generatedGeometries.forEach((geometry) => geometry.dispose());
    this.generatedMaterials.clear(); this.generatedGeometries.clear();
  }

  private createGeometry(item: StageGeometryItem): THREE.Object3D {
    let object: THREE.Object3D;
    if (item.kind === 'ground') object = this.createGround();
    else if (item.kind === 'fence') object = this.createFence();
    else if (item.kind === 'pool') object = this.createPool();
    else object = this.createBall();
    object.name = item.id; object.position.set(...item.position); object.rotation.y = item.rotationY ?? 0; object.scale.setScalar(item.scale ?? 1); return object;
  }

  private createGround(): THREE.Mesh {
    const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshToonMaterial({ color: 0x72ad68 })); ground.rotation.x = -Math.PI / 2; return ground;
  }

  private createFence(): THREE.Group {
    const group = new THREE.Group(), wood = new THREE.MeshToonMaterial({ color: 0xf2d5a0 });
    const postGeometry = new THREE.BoxGeometry(.12, .85, .12), posts = new THREE.InstancedMesh(postGeometry, wood, 13), matrix = new THREE.Matrix4();
    for (let index = 0; index < 13; index++) posts.setMatrixAt(index, matrix.makeTranslation(-4.2 + index * .7, .42, 0));
    group.add(posts);
    for (const y of [.28, .65]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(8.5, .1, .1), wood); rail.position.y = y; group.add(rail); }
    return group;
  }

  private createPool(): THREE.Group {
    const group = new THREE.Group(), blue = new THREE.MeshToonMaterial({ color: 0x69c9e8 }), light = new THREE.MeshToonMaterial({ color: 0xc8f4ff }), water = new THREE.MeshToonMaterial({ color: 0x83dcf2, transparent: true, opacity: .82 });
    const outer = new THREE.Mesh(new THREE.TorusGeometry(.72, .16, 8, 24), blue); outer.rotation.x = Math.PI / 2; outer.position.y = .17;
    const inner = new THREE.Mesh(new THREE.TorusGeometry(.45, .095, 8, 24), light); inner.rotation.x = Math.PI / 2; inner.position.y = .14;
    const surface = new THREE.Mesh(new THREE.CylinderGeometry(.56, .56, .025, 24), water); surface.position.y = .135;
    group.add(outer, inner, surface); return group;
  }

  private createBall(): THREE.Mesh {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.23, 12, 8), new THREE.MeshToonMaterial({ color: 0xffdf69 })); ball.material.wireframe = false; return ball;
  }

  private makeInterestPoint(name: string, position: readonly [number, number, number], types: readonly string[], parent: THREE.Object3D): THREE.Object3D {
    const point = new THREE.Object3D(); point.name = `interest-${name}`; point.position.set(...position); point.userData.interestTypes = [...types]; parent.add(point); return point;
  }
}
