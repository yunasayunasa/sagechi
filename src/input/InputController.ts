import * as THREE from 'three';
import type { FollowCamera } from '../camera/FollowCamera';
import type { CharacterController } from '../characters/CharacterController';
import type { GameConfig } from '../config/game-config';

export type Gesture = 'NONE' | 'CHARACTER_PENDING' | 'TAP' | 'PET' | 'PICKUP' | 'CAMERA';
type Pointer = { id: number; startX: number; startY: number; x: number; y: number; hit: boolean; downAt: number; pickupTimer: number | null };

export class InputController {
  gesture: Gesture = 'NONE';
  private pointer: Pointer | null = null;
  private blockedUntil = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly pickupPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private readonly intersection = new THREE.Vector3();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly camera: THREE.PerspectiveCamera, private readonly hitArea: THREE.Object3D, private readonly controller: CharacterController, private readonly followCamera: FollowCamera, private readonly config: GameConfig, private readonly onPet: () => void = () => {}, private readonly onTap: () => void = () => {}) {
    canvas.addEventListener('pointerdown', this.onDown, { passive: false });
    canvas.addEventListener('pointermove', this.onMove, { passive: false });
    canvas.addEventListener('pointerup', this.onUp, { passive: false });
    canvas.addEventListener('pointercancel', this.onUp, { passive: false });
    canvas.addEventListener('contextmenu', this.prevent, { passive: false });
  }
  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onDown); this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp); this.canvas.removeEventListener('pointercancel', this.onUp);
    this.canvas.removeEventListener('contextmenu', this.prevent); this.clearTimer();
  }
  private onDown = (event: PointerEvent): void => {
    this.prevent(event); if (this.pointer || performance.now() < this.blockedUntil) return;
    this.canvas.setPointerCapture?.(event.pointerId); const hit = this.hit(event);
    this.pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, hit, downAt: performance.now(), pickupTimer: null };
    this.gesture = hit ? 'CHARACTER_PENDING' : 'CAMERA';
    if (hit) this.pointer.pickupTimer = window.setTimeout(() => {
      if (!this.pointer || this.distance(this.pointer) > this.config.gesture.pickupDragStartDistancePx) return;
      this.gesture = 'PICKUP'; this.controller.beginPickup(this.worldPoint(this.pointer.x, this.pointer.y));
    }, this.config.gesture.pickupHoldMs);
  };
  private onMove = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.id) return; this.prevent(event);
    const dx = event.clientX - this.pointer.x, dy = event.clientY - this.pointer.y, total = this.distance(this.pointer, event.clientX, event.clientY);
    this.pointer.x = event.clientX; this.pointer.y = event.clientY;
    if (this.pointer.hit) {
      if (this.gesture === 'PICKUP') { this.controller.movePickup(this.worldPoint(event.clientX, event.clientY)); return; }
      if (total >= this.config.gesture.petStartDistancePx) { this.clearTimer(); this.gesture = 'PET'; }
    } else if (total >= this.config.gesture.cameraStartDistancePx) { this.gesture = 'CAMERA'; this.followCamera.addSwipe(dx, dy); }
  };
  private onUp = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.id) return; this.prevent(event); this.clearTimer();
    if (this.gesture === 'PICKUP') this.controller.releasePickup();
    else if (this.pointer.hit && this.gesture === 'PET') { this.controller.pet(); this.onPet(); }
    else if (this.pointer.hit && this.distance(this.pointer) <= this.config.gesture.tapMaxDistancePx) { this.gesture = 'TAP'; this.controller.tap(this.camera.position); this.onTap(); }
    this.pointer = null; this.blockedUntil = performance.now() + this.config.gesture.afterGestureCooldownMs;
    window.setTimeout(() => { if (!this.pointer) this.gesture = 'NONE'; }, 250);
  };
  private hit(event: PointerEvent): boolean { this.setRay(event.clientX, event.clientY); return this.raycaster.intersectObject(this.hitArea, true).length > 0; }
  private worldPoint(x: number, y: number): THREE.Vector3 {
    this.setRay(x, y); const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion), center = this.hitArea.getWorldPosition(new THREE.Vector3());
    this.pickupPlane.set(normal, -normal.dot(center)); return this.raycaster.ray.intersectPlane(this.pickupPlane, this.intersection)?.clone() ?? center;
  }
  private setRay(x: number, y: number): void { const rect = this.canvas.getBoundingClientRect(); this.ndc.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height * 2 - 1)); this.raycaster.setFromCamera(this.ndc, this.camera); }
  private distance(pointer: Pointer, x = pointer.x, y = pointer.y): number { return Math.hypot(x - pointer.startX, y - pointer.startY); }
  private clearTimer(): void { const pointer = this.pointer; if (pointer?.pickupTimer !== null && pointer?.pickupTimer !== undefined) { clearTimeout(pointer.pickupTimer); pointer.pickupTimer = null; } }
  private prevent = (event: Event): void => { event.preventDefault(); };
}
