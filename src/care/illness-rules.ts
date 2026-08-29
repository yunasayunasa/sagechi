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

const ILLNESS_STEPS: readonly IllnessStep[] = ['warm', 'rest', 'meal'];

export function chooseIllnessStep(roll: number, previous: IllnessStep | null = null): IllnessStep {
  const choices = previous ? ILLNESS_STEPS.filter((step) => step !== previous) : ILLNESS_STEPS;
  return choices[Math.min(choices.length - 1, Math.floor(Math.max(0, roll) * choices.length))];
}
