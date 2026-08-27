import type * as THREE from 'three';

export type StageId = 'summer-garden' | 'kids-room' | 'japanese-room';
export type InterestType = 'LOOK_AT' | 'APPROACH' | 'PLAY' | 'SLEEP' | 'READ' | 'SIT';

export interface StageAssetDefinition { id: string; path: string; }
export interface StagePlacement {
  assetId: string;
  position: readonly [number, number, number];
  rotationY?: number;
  scale?: number;
  interestTypes?: readonly InterestType[];
}
export interface StageGeometryItem {
  id: string;
  kind: 'ground' | 'fence' | 'pool' | 'toy-ball' | 'kids-room-shell' | 'kids-rug' | 'rattle' | 'japanese-room-shell' | 'low-table' | 'cushion' | 'vase';
  position: readonly [number, number, number];
  rotationY?: number;
  scale?: number;
  interestTypes?: readonly InterestType[];
}
export interface CircleObstacle { kind: 'circle'; x: number; z: number; radius: number; }
export interface StageConfig {
  id: StageId;
  label: string;
  background: number;
  fog: { color: number; near: number; far: number };
  assets: readonly StageAssetDefinition[];
  placements: readonly StagePlacement[];
  geometry: readonly StageGeometryItem[];
  movement: { halfWidth: number; halfDepth: number; obstacles: readonly CircleObstacle[] };
}
export interface LoadedStage {
  root: THREE.Group;
  obstacles: readonly CircleObstacle[];
  interestPoints: readonly THREE.Object3D[];
  ownedGeometries: Set<THREE.BufferGeometry>;
  ownedMaterials: Set<THREE.Material>;
}
