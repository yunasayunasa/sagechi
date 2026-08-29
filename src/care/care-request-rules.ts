import type { CareRequestChoice, RequestType } from './care-types';

export function chooseRequestChoice(request: RequestType, roll: number): CareRequestChoice | null {
  const index = Math.min(2, Math.max(0, Math.floor(roll * 3)));
  if (request === 'food') return (['vegetable', 'sweet', 'meat'] as const)[index];
  if (request === 'play') return (['ball', 'rattle', 'book'] as const)[index];
  if (request === 'sleep' || request === 'sick-rest') return 'rest';
  if (request === 'tart') return 'tart';
  if (request === 'sick-warm') return 'warm';
  if (request === 'sick-meal') return 'vegetable';
  return null;
}

export function isExpectedChoice(expected: CareRequestChoice | null, actual: CareRequestChoice): boolean {
  return expected === null || expected === actual;
}
