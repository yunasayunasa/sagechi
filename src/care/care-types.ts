export type IllnessStep = 'warm' | 'rest' | 'meal';
export type RequestType = 'food' | 'play' | 'sleep' | 'pet' | 'tart' | 'sick-warm' | 'sick-rest' | 'sick-meal';
export type FoodChoice = 'vegetable' | 'sweet' | 'meat' | 'tart';
export type PlayChoice = 'ball' | 'rattle' | 'book';

export interface CharacterStatus {
  hunger: number;
  sleepiness: number;
  boredom: number;
  mood: number;
  stress: number;
  health: number;
}

export interface CareHistory {
  calm: number;
  active: number;
  sweet: number;
  healthy: number;
  meat: number;
  playBall: number;
  playRattle: number;
  playBook: number;
  affection: number;
  stress: number;
  sickCount: number;
  careSuccess: number;
  careDelay: number;
}

export const DEFAULT_STATUS: CharacterStatus = {
  hunger: 22, sleepiness: 16, boredom: 28,
  mood: 76, stress: 8, health: 92,
};

export const DEFAULT_HISTORY: CareHistory = {
  calm: 0, active: 0, sweet: 0, healthy: 0, meat: 0,
  playBall: 0, playRattle: 0, playBook: 0, affection: 0,
  stress: 0, sickCount: 0, careSuccess: 0, careDelay: 0,
};
