import type { CharacterStatus } from './care-types';
import type { IllnessStep } from './care-types';

export interface IllnessRiskState {
  careCount: number;
  careDelay: number;
  status: CharacterStatus;
}

export interface IllnessRiskConfig {
  minimumCareCount: number;
  stressThreshold: number;
  healthThreshold: number;
  careDelayThreshold: number;
  baseChance: number;
  highRiskChance: number;
}

export function getIllnessChance(state: IllnessRiskState, config: IllnessRiskConfig): number {
  if (state.careCount < config.minimumCareCount) return 0;
  const highRisk = state.status.stress >= config.stressThreshold
    || state.status.health <= config.healthThreshold
    || state.careDelay >= config.careDelayThreshold;
  return highRisk ? config.highRiskChance : config.baseChance;
}

export function shouldStartIllness(state: IllnessRiskState, config: IllnessRiskConfig, roll: number): boolean {
  return roll < getIllnessChance(state, config);
}

export function nextIllnessStep(step: IllnessStep): IllnessStep | null {
  if (step === 'warm') return 'rest';
  if (step === 'rest') return 'meal';
  return null;
}
