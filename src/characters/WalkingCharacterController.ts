import * as THREE from 'three';
import type { GameConfig } from '../config/game-config';
import type { EffectSystem } from '../effects/EffectSystem';
import type { CircleObstacle } from '../stages/stage-types';
import { AnimationController } from './AnimationController';
import type { CharacterController } from './CharacterController';
import type { LoadedCharacter } from './CharacterLoader';
import type { CharacterConfig, SemanticAnimation } from './character-config';
import { chooseDelayReaction } from '../care/care-rules';

export type WalkingState = 'idle' | 'turning' | 'walking' | 'reaction' | 'pickup' | 'release';
const random = (min: number, max: number) => THREE.MathUtils.randFloat(min, max);

export class WalkingCharacterController implements CharacterController {
  state: WalkingState = 'idle';
  readonly target = new THREE.Vector3();
  private readonly animation: AnimationController;
  private idleLeft = 0;
  private reactionCooldown = 0;
  private sick = false;
  private pickupPoint = new THREE.Vector3();
  private releaseStart = new THREE.Vector3();
  private releaseProgress = 0;
  constructor(readonly character: LoadedCharacter, private readonly characterConfig: CharacterConfig, private readonly config: GameConfig, private readonly effects: EffectSystem, private obstacles: readonly CircleObstacle[] = []) {
    this.animation = new AnimationController(character.mixer, character.clips);
    this.enterIdle();
  }
  update(dt: number): void {
    this.animation.update(dt * (this.sick ? .62 : 1)); this.reactionCooldown = Math.max(0, this.reactionCooldown - dt);
    if (this.state === 'pickup') { this.character.root.position.lerp(this.pickupPoint, 1 - Math.exp(-dt * 12)); return; }
    if (this.state === 'release') { this.updateRelease(dt); return; }
    if (this.state === 'reaction') return;
    if (this.state === 'idle') { this.idleLeft -= dt; if (this.idleLeft <= 0) this.chooseTarget(); return; }
    this.move(dt);
  }
  tap(cameraPosition: THREE.Vector3): void {
    if (this.state === 'pickup') return;
    const direction = cameraPosition.clone().sub(this.character.root.position); direction.y = 0;
    if (direction.lengthSq()) this.character.root.rotation.y = Math.atan2(direction.x, direction.z);
    this.react(this.animation.has('ok') ? 'ok' : 'happy', 'sparkle');
  }
  pet(): void { if (this.state !== 'pickup') this.react('happy', 'heart'); }
  delayReaction(tone?: 'angry' | 'sad'): void { if (this.state !== 'pickup') this.react(tone ?? chooseDelayReaction(Math.random()), 'none'); }
  setSick(active: boolean): void {
    this.sick = active;
    this.character.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material instanceof THREE.MeshToonMaterial) material.emissiveIntensity = (Number(material.userData.baseEmissiveIntensity) || 0) * (active ? .25 : 1);
      }
    });
  }
  playReaction(name: SemanticAnimation): void { if (name !== 'idle' && name !== 'walk') this.react(name, name === 'happy' ? 'heart' : 'sparkle'); }
  beginPickup(point: THREE.Vector3): void { this.state = 'pickup'; this.animation.play('idle'); this.pickupPoint.copy(this.clamp(point)); }
  movePickup(point: THREE.Vector3): void { if (this.state === 'pickup') this.pickupPoint.copy(this.clamp(point)); }
  releasePickup(): void { if (this.state !== 'pickup') return; this.state = 'release'; this.releaseStart.copy(this.character.root.position); this.releaseProgress = 0; this.effects.sparkle(this.effectPosition()); }
  setObstacles(obstacles: readonly CircleObstacle[]): void { this.obstacles = obstacles; }
  getTargetLabel(): string { return this.state === 'walking' || this.state === 'turning' ? `${this.target.x.toFixed(2)}, ${this.target.z.toFixed(2)}` : '—'; }
  dispose(): void { this.animation.dispose(); }
  private enterIdle(afterInteraction = false): void {
    this.state = 'idle'; this.character.root.position.y = this.characterConfig.groundOffset;
    this.idleLeft = Math.max(random(this.config.walking.idleMinSeconds, this.config.walking.idleMaxSeconds), afterInteraction ? this.config.walking.interactionRestSeconds : 0);
    this.animation.play('idle');
  }
  private chooseTarget(): void {
    if (Math.random() < this.config.walking.lookAroundChance && this.animation.has('lookAround')) { this.react('lookAround', 'none'); return; }
    for (let attempt = 0; attempt < 12; attempt++) {
      this.target.set(random(-this.config.movement.halfWidth, this.config.movement.halfWidth), this.characterConfig.groundOffset, random(-this.config.movement.halfDepth, this.config.movement.halfDepth));
      if (!this.obstacles.some((obstacle) => Math.hypot(this.target.x - obstacle.x, this.target.z - obstacle.z) < obstacle.radius + .42)) break;
    }
    this.state = 'turning';
  }
  private move(dt: number): void {
    const root = this.character.root, delta = this.target.clone().sub(root.position); delta.y = 0; const distance = delta.length();
    if (distance <= this.config.movement.arrivalDistance) { root.position.x = this.target.x; root.position.z = this.target.z; this.enterIdle(); return; }
    const desiredYaw = Math.atan2(delta.x, delta.z), yawDelta = Math.atan2(Math.sin(desiredYaw - root.rotation.y), Math.cos(desiredYaw - root.rotation.y));
    root.rotation.y += THREE.MathUtils.clamp(yawDelta, -this.config.walking.turnSpeed * dt, this.config.walking.turnSpeed * dt);
    if (this.state === 'turning' && Math.abs(yawDelta) < .22) { this.state = 'walking'; this.animation.play('walk'); }
    if (this.state === 'walking') root.position.addScaledVector(delta.normalize(), Math.min(distance, this.config.walking.speed * (this.characterConfig.moveSpeedScale ?? 1) * (this.sick ? .58 : 1) * dt));
  }
  private react(name: SemanticAnimation, effect: 'heart' | 'sparkle' | 'none'): void {
    if (this.reactionCooldown > 0 && this.state === 'reaction') return;
    this.state = 'reaction'; this.reactionCooldown = .3;
    if (effect === 'heart') { this.effects.heart(this.effectPosition()); this.effects.sparkle(this.effectPosition()); }
    else if (effect === 'sparkle') this.effects.sparkle(this.effectPosition());
    this.animation.play(name, true, () => this.enterIdle(true));
  }
  private updateRelease(dt: number): void {
    this.releaseProgress = Math.min(1, this.releaseProgress + dt / this.config.reaction.pickupReleaseDuration);
    const eased = 1 - Math.pow(1 - this.releaseProgress, 3), destination = new THREE.Vector3(this.releaseStart.x, this.characterConfig.groundOffset, this.releaseStart.z);
    this.character.root.position.lerpVectors(this.releaseStart, destination, eased);
    if (this.releaseProgress >= 1) this.enterIdle(true);
  }
  private effectPosition(): THREE.Vector3 { return this.character.root.position.clone().add(new THREE.Vector3(0, this.characterConfig.targetHeight * .85, 0)); }
  private clamp(point: THREE.Vector3): THREE.Vector3 { return point.clone().set(THREE.MathUtils.clamp(point.x, -this.config.movement.halfWidth, this.config.movement.halfWidth), THREE.MathUtils.clamp(point.y, .25, 2.8), THREE.MathUtils.clamp(point.z, -this.config.movement.halfDepth, this.config.movement.halfDepth)); }
}
