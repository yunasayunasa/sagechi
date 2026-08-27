import * as THREE from 'three';
import type { GameConfig } from '../config/game-config';

export type CameraMode = 'overview' | 'close';

export class FollowCamera {
  private yaw = 0;
  private pitch = 0;
  private idle = 0;
  private mode: CameraMode = 'overview';
  private readonly overviewOffset: THREE.Vector3;
  private readonly closeOffset: THREE.Vector3;
  private readonly currentOffset: THREE.Vector3;
  private readonly focus = new THREE.Vector3();

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    private readonly target: THREE.Object3D,
    private readonly config: GameConfig,
  ) {
    this.overviewOffset = new THREE.Vector3(...config.camera.overviewOffset);
    this.closeOffset = new THREE.Vector3(...config.camera.closeOffset);
    this.currentOffset = this.overviewOffset.clone();
  }

  /** 将来の「呼ぶ」演出から使用する近景切替口。 */
  setMode(mode: CameraMode): void {
    this.mode = mode;
    this.idle = 0;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  addSwipe(dx:number,dy:number):void{this.yaw=THREE.MathUtils.clamp(this.yaw-dx*this.config.camera.swipeSensitivityX,-this.config.camera.yawLimit,this.config.camera.yawLimit);this.pitch=THREE.MathUtils.clamp(this.pitch+dy*this.config.camera.swipeSensitivityY,-this.config.camera.pitchLimit,this.config.camera.pitchLimit);this.idle=0;}
  update(dt: number): void {
    this.idle += dt;
    if (this.idle > this.config.camera.returnDelaySeconds) {
      this.yaw = THREE.MathUtils.damp(this.yaw, 0, this.config.camera.returnDamping, dt);
      this.pitch = THREE.MathUtils.damp(this.pitch, 0, this.config.camera.returnDamping, dt);
    }

    const requestedOffset = this.mode === 'close' ? this.closeOffset : this.overviewOffset;
    this.currentOffset.lerp(
      requestedOffset,
      1 - Math.exp(-this.config.camera.modeTransitionDamping * dt),
    );

    const followFactor = this.mode === 'close' ? 1 : this.config.camera.overviewFollowFactor;
    this.focus.set(
      this.target.position.x * followFactor,
      this.target.position.y,
      this.target.position.z * followFactor,
    );
    const offset = this.currentOffset.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.yaw);
    offset.y += this.pitch;
    const desired = this.focus.clone().add(offset);
    this.camera.position.lerp(desired, 1 - Math.exp(-this.config.camera.followDamping * dt));
    this.camera.lookAt(
      this.focus.x,
      this.focus.y + this.config.camera.lookAtHeight + this.pitch * 0.35,
      this.focus.z,
    );
  }
}
