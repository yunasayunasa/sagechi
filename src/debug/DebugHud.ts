import * as THREE from 'three';import type { FloatingCharacterController } from '../characters/FloatingCharacterController';import type { InputController } from '../input/InputController';
export class DebugHud {
  private frames=0;private time=0;private fps=0;private frameMs=0;private enabled=false;
  constructor(private readonly hud:HTMLElement,private readonly controls:HTMLElement,private readonly renderer:THREE.WebGLRenderer,private readonly floating:FloatingCharacterController,private readonly input:InputController){}
  toggle():void{this.enabled=!this.enabled;this.hud.hidden=!this.enabled;this.controls.hidden=!this.enabled;}
  update(dt:number):void{if(!this.enabled)return;this.frames++;this.time+=dt;this.frameMs=dt*1000;if(this.time>=.5){this.fps=Math.round(this.frames/this.time);this.frames=0;this.time=0}const info=this.renderer.info;this.hud.innerHTML=`<b>${this.fps} FPS</b><span>Frame ${this.frameMs.toFixed(1)} ms</span><span>delta ${dt.toFixed(4)}</span><span>DPR ${this.renderer.getPixelRatio().toFixed(2)}×</span><span>State ${this.floating.state}</span><span>Target ${this.floating.getTargetLabel()}</span><span>Gesture ${this.input.gesture}</span><span>Draw ${info.render.calls} / Tri ${info.render.triangles.toLocaleString()}</span>`;}
}
