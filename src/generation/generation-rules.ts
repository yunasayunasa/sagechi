export interface EggThresholds { eggActiveSeconds: number; eggCareCount: number }
export function isEggReady(activeSeconds: number, careCount: number, thresholds: EggThresholds): boolean {
  return activeSeconds >= thresholds.eggActiveSeconds && careCount >= thresholds.eggCareCount;
}
