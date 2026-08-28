import assert from 'node:assert/strict';
import { shouldCreateTartRequest } from '../src/care/care-rules.ts';
import { isEggReady } from '../src/generation/generation-rules.ts';

assert.equal(shouldCreateTartRequest({ generation: 0, currentCharacter: 'worldtchi' }, 'food', .05, 0), false);
assert.equal(shouldCreateTartRequest({ generation: 1, currentCharacter: 'worldtchi' }, 'food', .05, .049), true);
assert.equal(shouldCreateTartRequest({ generation: 1, currentCharacter: 'white-worldtchi' }, 'food', .05, .05), false);
assert.equal(shouldCreateTartRequest({ generation: 2, currentCharacter: 'nier' }, 'play', .05, 0), false);
assert.equal(shouldCreateTartRequest({ generation: 2, currentCharacter: 'tartman' }, 'food', .05, 0), false);
assert.equal(isEggReady(599.99, 5, { eggActiveSeconds: 600, eggCareCount: 5 }), false);
assert.equal(isEggReady(600, 4, { eggActiveSeconds: 600, eggCareCount: 5 }), false);
assert.equal(isEggReady(600, 5, { eggActiveSeconds: 600, eggCareCount: 5 }), true);
process.stdout.write('Phase 8 rare request and egg thresholds: PASS\n');
