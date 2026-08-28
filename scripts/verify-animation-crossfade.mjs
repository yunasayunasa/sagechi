import fs from 'node:fs';
import * as THREE from 'three';

const source = fs.readFileSync('src/characters/AnimationController.ts', 'utf8');
if (/setEffectiveWeight\(0\)/.test(source)) throw new Error('CrossFade先をWeight 0にするとActionが無効化され、Bind Poseへ戻ります。');

const root = new THREE.Object3D(); root.name = 'Root';
const idle = new THREE.AnimationClip('idle', 1, [new THREE.VectorKeyframeTrack('Root.position', [0, 1], [0, 0, 0, 1, 0, 0])]);
const reaction = new THREE.AnimationClip('reaction', 1, [new THREE.VectorKeyframeTrack('Root.position', [0, 1], [0, 0, 0, 0, 1, 0])]);
const mixer = new THREE.AnimationMixer(root), previous = mixer.clipAction(idle), next = mixer.clipAction(reaction);
previous.reset().setEffectiveWeight(1).play(); mixer.update(.1);
next.reset().setEffectiveWeight(1).play(); previous.crossFadeTo(next, .32, true); mixer.update(.16);
if (previous.getEffectiveWeight() + next.getEffectiveWeight() < .99 || next.getEffectiveWeight() <= 0) throw new Error('CrossFade中の有効Weightが失われています。');
process.stdout.write(`crossfade weights: ${previous.getEffectiveWeight().toFixed(2)} + ${next.getEffectiveWeight().toFixed(2)}\n`);
