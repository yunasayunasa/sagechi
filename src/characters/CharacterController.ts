import type * as THREE from 'three';
import type { CircleObstacle } from '../stages/stage-types';

export interface CharacterController {
  readonly state: string;
  readonly target: THREE.Vector3;
  update(dt: number): void;
  tap(cameraPosition: THREE.Vector3): void;
  pet(): void;
  delayReaction(): void;
  beginPickup(point: THREE.Vector3): void;
  movePickup(point: THREE.Vector3): void;
  releasePickup(): void;
  setObstacles(obstacles: readonly CircleObstacle[]): void;
  getTargetLabel(): string;
  dispose?(): void;
}
