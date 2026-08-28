import * as THREE from 'three';
import type { LoadedCharacter } from '../characters/CharacterLoader';
import type { SageCharacterId } from '../characters/character-config';
import type { GameConfig } from '../config/game-config';
import type { GameSaveV6, WorldtchiForm } from '../save/SaveService';
import { selectSageEvolution, type SageEvolutionEntry } from './sage-evolution-config';

type ToonSnapshot = { material: THREE.MeshToonMaterial; color: THREE.Color; emissive: THREE.Color };

const FORM_APPEARANCE = {
  worldtchi: { name: 'ワールドっち', color: new THREE.Color(0xffffff), emissive: new THREE.Color(0x07120c), emissiveIntensity: 0 },
  'white-worldtchi': { name: '白ワールドっち', color: new THREE.Color(0xffffff), emissive: new THREE.Color(0xd8edff), emissiveIntensity: .18 },
  'black-worldtchi': { name: '黒ワールドっち', color: new THREE.Color(0x596070), emissive: new THREE.Color(0x101528), emissiveIntensity: .04 },
} satisfies Record<WorldtchiForm, { name: string; color: THREE.Color; emissive: THREE.Color; emissiveIntensity: number }>;

export class EvolutionSystem {
  active = false;
  private elapsed = 0;
  private targetForm: Exclude<WorldtchiForm, 'worldtchi'> | null = null;
  private targetSage: SageEvolutionEntry | null = null;
  private readonly materials: ToonSnapshot[] = [];

  constructor(
    private readonly save: GameSaveV6,
    private readonly character: LoadedCharacter,
    private readonly config: GameConfig,
    private readonly persist: () => void,
    private readonly onStart: () => void,
    private readonly onComplete: (form: WorldtchiForm, name: string) => void,
    private readonly onSageStart: () => void,
    private readonly onSageComplete: (id: SageCharacterId, name: string) => void,
  ) {
    character.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material instanceof THREE.MeshToonMaterial) this.materials.push({ material, color: material.color.clone(), emissive: material.emissive.clone() });
      }
    });
    this.applyForm(this.getWorldForm());
  }

  update(dt: number): void {
    if (!this.active) {
      if (this.save.evolutionStage === 1 && this.save.careCount >= this.config.evolution.stage2CareCount) this.begin();
      else if (this.save.evolutionStage === 2 && this.save.careCount >= this.config.evolution.stage3CareCount) this.beginSage();
      return;
    }
    this.elapsed = Math.min(this.config.evolution.durationSeconds, this.elapsed + dt);
    const progress = this.elapsed / this.config.evolution.durationSeconds;
    const reveal = THREE.MathUtils.smoothstep(progress, .28, .88);
    const pulse = 1 + Math.sin(progress * Math.PI * 5) * .08 * (1 - reveal * .45);
    const finalScale = THREE.MathUtils.lerp(1, this.config.evolution.scale, reveal);
    this.character.visualPivot.scale.setScalar(pulse * finalScale);
    if (this.targetForm) this.applyMaterial(this.targetForm, reveal);
    if (progress >= 1 && this.targetForm) this.complete(this.targetForm);
    else if (progress >= 1 && this.targetSage) this.completeSage(this.targetSage);
  }

  getCurrentName(): string { return FORM_APPEARANCE[this.getWorldForm()].name; }

  private begin(): void {
    const history = this.save.history;
    const calm = Object.entries(this.config.evolution.calmWeights).reduce((score, [key, weight]) => score + history[key as keyof typeof history] * weight, 0);
    const active = Object.entries(this.config.evolution.activeWeights).reduce((score, [key, weight]) => score + history[key as keyof typeof history] * weight, 0);
    this.targetForm = calm >= active ? 'white-worldtchi' : 'black-worldtchi';
    this.targetSage = null;
    this.active = true;
    this.elapsed = 0;
    this.onStart();
  }

  private beginSage(): void {
    const branch = this.getWorldForm() === 'white-worldtchi' ? 'white' : 'black';
    this.targetForm = null;
    this.targetSage = selectSageEvolution(branch, this.save.history);
    this.active = true;
    this.elapsed = 0;
    this.onSageStart();
  }

  private complete(form: Exclude<WorldtchiForm, 'worldtchi'>): void {
    this.active = false;
    this.save.currentCharacter = form;
    this.save.evolutionStage = 2;
    this.applyForm(form);
    this.persist();
    this.onComplete(form, FORM_APPEARANCE[form].name);
  }

  private completeSage(entry: SageEvolutionEntry): void {
    this.active = false;
    this.targetSage = null;
    this.save.currentCharacter = entry.id;
    this.save.evolutionStage = 3;
    if (!this.save.encyclopedia.includes(entry.id)) this.save.encyclopedia.push(entry.id);
    this.persist();
    this.onSageComplete(entry.id, entry.name);
  }

  private applyForm(form: WorldtchiForm): void {
    this.character.visualPivot.scale.setScalar(form === 'worldtchi' ? 1 : this.config.evolution.scale);
    this.applyMaterial(form, 1);
  }

  private applyMaterial(form: WorldtchiForm, amount: number): void {
    const appearance = FORM_APPEARANCE[form];
    for (const snapshot of this.materials) {
      snapshot.material.color.copy(snapshot.color).lerp(appearance.color, amount);
      snapshot.material.emissive.copy(snapshot.emissive).lerp(appearance.emissive, amount);
      const intensity = appearance.emissiveIntensity * amount;
      snapshot.material.userData.baseEmissiveIntensity = intensity;
      snapshot.material.emissiveIntensity = intensity;
    }
  }

  private getWorldForm(): WorldtchiForm {
    return this.save.currentCharacter === 'white-worldtchi' || this.save.currentCharacter === 'black-worldtchi' ? this.save.currentCharacter : 'worldtchi';
  }
}
