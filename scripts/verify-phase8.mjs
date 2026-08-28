import assert from 'node:assert/strict';
import { shouldCreateTartRequest } from '../src/care/care-rules.ts';
import { isEggReady } from '../src/generation/generation-rules.ts';
import { getStatusDisplayValues } from '../src/care/status-display.ts';

assert.equal(shouldCreateTartRequest({ generation: 0, currentCharacter: 'worldtchi' }, 'food', .05, 0), false);
assert.equal(shouldCreateTartRequest({ generation: 1, currentCharacter: 'worldtchi' }, 'food', .05, .049), true);
assert.equal(shouldCreateTartRequest({ generation: 1, currentCharacter: 'white-worldtchi' }, 'food', .05, .05), false);
assert.equal(shouldCreateTartRequest({ generation: 2, currentCharacter: 'nier' }, 'play', .05, 0), false);
assert.equal(shouldCreateTartRequest({ generation: 2, currentCharacter: 'tartman' }, 'food', .05, 0), false);
assert.equal(isEggReady(599.99, 5, { eggActiveSeconds: 600, eggCareCount: 5 }), false);
assert.equal(isEggReady(600, 4, { eggActiveSeconds: 600, eggCareCount: 5 }), false);
assert.equal(isEggReady(600, 5, { eggActiveSeconds: 600, eggCareCount: 5 }), true);
assert.deepEqual(getStatusDisplayValues({ hunger: 22, sleepiness: 16, boredom: 28, mood: 76, stress: 8, health: 92 }), { hunger: 78, sleepiness: 84, boredom: 72, mood: 76, stress: 92, health: 92 });
assert.deepEqual(getStatusDisplayValues({ hunger: 140, sleepiness: -20, boredom: 100, mood: 120, stress: 101, health: -1 }), { hunger: 0, sleepiness: 100, boredom: 0, mood: 100, stress: 0, health: 0 });
process.stdout.write('Phase 8 and status display rules: PASS\n');
