import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config/game-config.ts';
import { getIllnessChance, nextIllnessStep, shouldStartIllness } from '../src/care/illness-rules.ts';

const healthy = { hunger: 20, sleepiness: 20, boredom: 20, mood: 80, stress: 10, health: 90 };
const base = { careCount: 3, careDelay: 0, status: healthy };

assert.equal(getIllnessChance({ ...base, careCount: 2 }, GAME_CONFIG.illness), 0);
assert.equal(getIllnessChance(base, GAME_CONFIG.illness), .015);
assert.equal(getIllnessChance({ ...base, status: { ...healthy, stress: 60 } }, GAME_CONFIG.illness), .12);
assert.equal(getIllnessChance({ ...base, status: { ...healthy, health: 70 } }, GAME_CONFIG.illness), .12);
assert.equal(getIllnessChance({ ...base, careDelay: 2 }, GAME_CONFIG.illness), .12);
assert.equal(shouldStartIllness(base, GAME_CONFIG.illness, .0149), true);
assert.equal(shouldStartIllness(base, GAME_CONFIG.illness, .015), false);
assert.equal(nextIllnessStep('warm'), 'rest');
assert.equal(nextIllnessStep('rest'), 'meal');
assert.equal(nextIllnessStep('meal'), null);
assert.equal(GAME_CONFIG.evolution.juvenileScale, .7);
assert.equal(GAME_CONFIG.save.schemaVersion, 9);
process.stdout.write('Phase 7 illness and juvenile scale rules: PASS\n');
