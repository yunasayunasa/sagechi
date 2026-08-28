export interface ProgressThresholds { activeSeconds: number; careCount: number }

export function hasMetProgressThresholds(activeSeconds: number, careCount: number, thresholds: ProgressThresholds): boolean {
  return activeSeconds >= thresholds.activeSeconds && careCount >= thresholds.careCount;
}
