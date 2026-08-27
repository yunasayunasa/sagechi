import * as THREE from 'three';
import type { SemanticAnimation } from './character-config';

export function withoutRootMotion(source: THREE.AnimationClip): THREE.AnimationClip {
  const clip = source.clone();
  clip.name = `${source.name}:in-place`;
  clip.tracks = clip.tracks.filter((track) => {
    if (!(track instanceof THREE.VectorKeyframeTrack) || !/\.position$/i.test(track.name)) return true;
    const values = track.values;
    if (values.length < 6) return true;
    const x = values[0], z = values[2];
    let maximum = 0;
    for (let index = 3; index < values.length; index += 3) maximum = Math.max(maximum, Math.hypot(values[index] - x, values[index + 2] - z));
    return maximum <= .001;
  });
  return clip;
}

export class AnimationController {
  private current: THREE.AnimationAction | null = null;
  private onComplete: (() => void) | null = null;
  constructor(private readonly mixer: THREE.AnimationMixer, private readonly clips: ReadonlyMap<SemanticAnimation, THREE.AnimationClip>) {
    mixer.addEventListener('finished', this.finished);
  }
  update(dt: number): void { this.mixer.update(dt); }
  has(name: SemanticAnimation): boolean { return this.clips.has(name); }
  play(name: SemanticAnimation, once = false, onComplete?: () => void): void {
    const clip = this.clips.get(name) ?? this.clips.get('idle');
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    if (this.current === next && !once) return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.play();
    this.current?.crossFadeTo(next, .28, true);
    this.current = next;
    this.onComplete = once ? onComplete ?? null : null;
  }
  dispose(): void { this.mixer.removeEventListener('finished', this.finished); this.mixer.stopAllAction(); }
  private finished = (event: THREE.Event & { action?: THREE.AnimationAction }): void => {
    if (event.action !== this.current) return;
    const callback = this.onComplete; this.onComplete = null; callback?.();
  };
}
