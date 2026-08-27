import * as THREE from 'three';import type { GameConfig } from '../config/game-config';
export class FollowCamera {
  private yaw=0;private pitch=0;private idle=0;private readonly base:THREE.Vector3;
  constructor(readonly camera:THREE.PerspectiveCamera,private readonly target:THREE.Object3D,private readonly config:GameConfig){this.base=new THREE.Vector3(...config.camera.baseOffset);}
  addSwipe(dx:number,dy:number):void{this.yaw=THREE.MathUtils.clamp(this.yaw-dx*this.config.camera.swipeSensitivityX,-this.config.camera.yawLimit,this.config.camera.yawLimit);this.pitch=THREE.MathUtils.clamp(this.pitch+dy*this.config.camera.swipeSensitivityY,-this.config.camera.pitchLimit,this.config.camera.pitchLimit);this.idle=0;}
  update(dt:number):void{this.idle+=dt;if(this.idle>this.config.camera.returnDelaySeconds){this.yaw=THREE.MathUtils.damp(this.yaw,0,this.config.camera.returnDamping,dt);this.pitch=THREE.MathUtils.damp(this.pitch,0,this.config.camera.returnDamping,dt)}const focus=this.target.position.clone(),offset=this.base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),this.yaw);offset.y+=this.pitch;const desired=focus.clone().add(offset);this.camera.position.lerp(desired,1-Math.exp(-this.config.camera.followDamping*dt));this.camera.lookAt(focus.x,focus.y+this.config.camera.lookAtHeight+this.pitch*.35,focus.z);}
}
