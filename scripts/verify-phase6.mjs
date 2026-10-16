import assert from 'node:assert/strict';
import { SAGE_EVOLUTIONS, selectSageEvolution } from '../src/evolution/sage-evolution-config.ts';
import { hasMetProgressThresholds } from '../src/progression/progression-rules.ts';
import { GAME_CONFIG } from '../src/config/game-config.ts';
import { selectWorldBranch } from '../src/evolution/world-branch-rules.ts';

const emptyHistory = { calm: 0, active: 0, sweet: 0, healthy: 0, meat: 0, playBall: 0, playRattle: 0, playBook: 0, affection: 0, stress: 0, sickCount: 0, careSuccess: 0, careDelay: 0 };
const pick = (branch, values) => selectSageEvolution(branch, { ...emptyHistory, ...values }).id;

assert.equal(SAGE_EVOLUTIONS.length, 10);
assert.equal(new Set(SAGE_EVOLUTIONS.map((entry) => entry.id)).size, 10);
assert.equal(SAGE_EVOLUTIONS.filter((entry) => entry.branch === 'white').length, 5);
assert.equal(SAGE_EVOLUTIONS.filter((entry) => entry.branch === 'black').length, 5);
assert.equal(pick('white', { sweet: 10 }), 'maria-theresa');
assert.equal(pick('white', { careSuccess: 10 }), 'caim');
assert.equal(pick('white', { playRattle: 10 }), 'lobelia');
assert.equal(pick('white', { healthy: 10 }), 'alanaan');
assert.equal(pick('white', { playBook: 10 }), 'haaselia');
assert.equal(pick('black', { meat: 10 }), 'borghan');
assert.equal(pick('black', { careDelay: 10 }), 'catzelia');
assert.equal(pick('black', { playBall: 10 }), 'fraux');
assert.equal(pick('black', { affection: 10 }), 'nier');
assert.equal(pick('black', { playBook: 10 }), 'estarriola');
assert.equal(hasMetProgressThresholds(119.99, 8, { activeSeconds: 120, careCount: 8 }), false);
assert.equal(hasMetProgressThresholds(120, 7, { activeSeconds: 120, careCount: 8 }), false);
assert.equal(hasMetProgressThresholds(120, 8, { activeSeconds: 120, careCount: 8 }), true);
const branch = (values) => selectWorldBranch({ ...emptyHistory, ...values }, GAME_CONFIG.evolution.calmWeights, GAME_CONFIG.evolution.activeWeights, GAME_CONFIG.evolution.blackBias);
assert.equal(branch({}), 'white');
assert.equal(branch({ calm: 4, affection: 2, healthy: 4, playBook: 2, careSuccess: 8 }), 'white');
assert.equal(branch({ active: 6, playBall: 2, meat: 4, careSuccess: 8 }), 'black');
assert.equal(branch({ active: 3, playRattle: 2, careDelay: 1, careSuccess: 8 }), 'black');
assert.equal(GAME_CONFIG.evolution.blackBias, .9);
// CareSystem の加算値で実プレイ手順を再現し、ヒント通りに育てたルートを検証する
const careActions = {
  vegetable: { healthy: 2, calm: 1, careSuccess: 1 }, sweet: { sweet: 2, careSuccess: 1 }, meat: { meat: 2, active: 1, careSuccess: 1 },
  ball: { playBall: 1, active: 2, careSuccess: 1 }, rattle: { playRattle: 1, calm: 1, careSuccess: 1 }, book: { playBook: 1, calm: 2, careSuccess: 1 },
  rest: { calm: 2, careSuccess: 1 }, pet: { affection: 1, calm: 1 }, delay: { active: 1, stress: 1, careDelay: 1 },
};
const raise = (history, counts) => {
  const next = { ...history };
  for (const [action, count] of Object.entries(counts)) for (const [key, value] of Object.entries(careActions[action])) next[key] += value * count;
  return next;
};
const route = (youngCare, worldCare) => {
  const young = raise(emptyHistory, youngCare);
  return selectSageEvolution(branch(young), raise(young, worldCare)).id;
};
assert.equal(branch(raise(emptyHistory, { rattle: 8 })), 'white');
assert.equal(route({ rattle: 8 }, { rattle: 8 }), 'lobelia');
assert.equal(route({ rattle: 6, sweet: 2 }, { rattle: 6, rest: 2 }), 'lobelia');
assert.equal(route({ rattle: 6, pet: 6 }, { rattle: 5, vegetable: 1, book: 1, rest: 1 }), 'lobelia');
assert.equal(route({ ball: 10 }, { ball: 10 }), 'fraux');
assert.equal(route({ delay: 8, pet: 15 }, { delay: 8, pet: 15 }), 'nier');
assert.equal(route({ delay: 6, pet: 12, sweet: 2 }, { delay: 6, pet: 12, sweet: 2 }), 'nier');
assert.equal(route({ delay: 8, pet: 3 }, { delay: 8, pet: 3 }), 'catzelia');
assert.equal(route({ sweet: 8, pet: 10 }, { sweet: 8, pet: 10 }), 'maria-theresa');
assert.equal(route({ rest: 8 }, { ball: 8 }), 'caim');
process.stdout.write('Phase 6 evolution routes: 10 / 10 reachable\n');
