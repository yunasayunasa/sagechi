import type { RequestType } from './care-types';

export interface RareRequestState { generation: number; currentCharacter: string }
export function shouldCreateTartRequest(save: RareRequestState, request: RequestType, chance: number, roll: number): boolean {
  return save.generation >= 1 && save.currentCharacter !== 'tartman' && request === 'food' && roll < chance;
}

export function chooseDelayReaction(roll: number): 'angry' | 'sad' {
  return roll < .5 ? 'angry' : 'sad';
}
