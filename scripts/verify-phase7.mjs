import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const careSource = readFileSync(new URL('../src/care/CareSystem.ts', import.meta.url), 'utf8');
assert.match(careSource, /vegetable: \{ hunger: -27, mood: 5, stress: -2 \}/);
assert.match(careSource, /ball: \{ boredom: -34, mood: 12, stress: -3, sleepiness: 4 \}/);
assert.match(careSource, /this\.adjust\(\{ sleepiness: -38, stress: -6, health: 4, mood: 3 \}\)/);
assert.match(careSource, /this\.adjust\(\{ mood: 7, stress: -5, boredom: -3 \}\)/);
const saveSource = readFileSync(new URL('../src/save/SaveService.ts', import.meta.url), 'utf8');
assert.match(saveSource, /data\.schemaVersion === 8[\s\S]*schemaVersion: 9[\s\S]*illnessActive: false, illnessStep: null/);
assert.match(saveSource, /status: \{ \.\.\.DEFAULT_STATUS, \.\.\.data\.status \}/);
assert.match(saveSource, /history: \{ \.\.\.DEFAULT_HISTORY, \.\.\.data\.history \}/);
assert.equal(GAME_CONFIG.evolution.activeSeconds, 120);
assert.equal(GAME_CONFIG.evolution.careCount, 8);
process.stdout.write('Phase 7 illness and juvenile scale rules: PASS\n');
