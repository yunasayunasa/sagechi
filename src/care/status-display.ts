import type { CharacterStatus } from './care-types';

export type StatusDisplayValues = Record<keyof CharacterStatus, number>;

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

/** UI gauges always show remaining wellness: full is good, empty needs care. */
export function getStatusDisplayValues(status: CharacterStatus): StatusDisplayValues {
  return {
    hunger: clampPercent(100 - status.hunger),
    sleepiness: clampPercent(100 - status.sleepiness),
    boredom: clampPercent(100 - status.boredom),
    mood: clampPercent(status.mood),
    stress: clampPercent(100 - status.stress),
    health: clampPercent(status.health),
  };
}
