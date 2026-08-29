import type { CareHistory } from '../care/care-types';

export type BranchWeights = Partial<Record<keyof CareHistory, number>>;

export function calculateBranchScore(history: CareHistory, weights: BranchWeights): number {
  return Object.entries(weights).reduce((score, [key, weight]) => score + history[key as keyof CareHistory] * (weight ?? 0), 0);
}

export function selectWorldBranch(history: CareHistory, calmWeights: BranchWeights, activeWeights: BranchWeights, blackBias: number): 'white' | 'black' {
  const calm = calculateBranchScore(history, calmWeights);
  const active = calculateBranchScore(history, activeWeights);
  if (calm === 0 && active === 0) return 'white';
  return active >= calm * blackBias ? 'black' : 'white';
}
