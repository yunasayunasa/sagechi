import * as THREE from 'three';
type Effect = { sprite: THREE.Sprite; age: number; duration: number; drift: THREE.Vector3 };
export class EffectSystem {
  private readonly active: Effect[] = [];
  constructor(private readonly scene: THREE.Scene) {}
  heart(position: THREE.Vector3): void { this.spawn('♥', '#ff6e91', position, 1.1, new THREE.Vector3(0, .55, 0)); }
  sparkle(position: THREE.Vector3): void { for (let i=0;i<4;i++) this.spawn('✦', '#fff5a8', position.clone().add(new THREE.Vector3((Math.random()-.5)*.8,(Math.random()-.2)*.55,(Math.random()-.5)*.2)), .85, new THREE.Vector3((Math.random()-.5)*.2,.28,0)); }
  update(dt: number): void { for (let i=this.active.length-1;i>=0;i--){const e=this.active[i];e.age+=dt;e.sprite.position.addScaledVector(e.drift,dt);const life=e.age/e.duration;e.sprite.material.opacity=Math.sin(Math.min(1,life)*Math.PI);e.sprite.scale.setScalar(.35+life*.2);if(e.age>=e.duration){this.scene.remove(e.sprite);e.sprite.material.map?.dispose();e.sprite.material.dispose();this.active.splice(i,1)}} }
  dispose(): void { this.active.forEach((e)=>{this.scene.remove(e.sprite);e.sprite.material.map?.dispose();e.sprite.material.dispose()});this.active.length=0; }
  private spawn(text:string,color:string,position:THREE.Vector3,duration:number,drift:THREE.Vector3):void { const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.font='bold 82px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,68);const texture=new THREE.CanvasTexture(canvas),material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0}),sprite=new THREE.Sprite(material);sprite.position.copy(position);sprite.scale.setScalar(.35);this.scene.add(sprite);this.active.push({sprite,age:0,duration,drift}); }
}
