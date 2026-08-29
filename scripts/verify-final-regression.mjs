import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GAME_CONFIG } from '../src/config/game-config.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const game = read('../src/core/Game.ts');
const floating = read('../src/characters/FloatingCharacterController.ts');
const walking = read('../src/characters/WalkingCharacterController.ts');
const save = read('../src/save/SaveService.ts');

assert.equal(GAME_CONFIG.save.schemaVersion, 14);
assert.deepEqual(GAME_CONFIG.call, { targetX: 0, targetZ: 1.05, closeSeconds: 8 });
for (const id of ['call-button', 'tutorial-panel', 'tutorial-start', 'tutorial-skip', 'tutorial-open']) assert.match(html, new RegExp(`id="${id}"`));
for (const id of ['request-open', 'request-delay']) assert.match(html, new RegExp(`id="${id}"`));
assert.match(save, /tutorialSeen: false/);
assert.match(save, /settings\.tutorialSeen = Boolean\(settings\.tutorialSeen\)/);
assert.match(save, /data\.schemaVersion !== 9[\s\S]*data\.schemaVersion !== 14/);
assert.match(save, /schemaVersion: 14, currentCharacter, map, encyclopedia/);
const careUi = read('../src/care/CareUI.ts');
assert.match(careUi, /#request-delay/);
assert.doesNotMatch(careUi, /if \(this\.care\.save\.illnessActive\) this\.openForRequest/);
assert.match(careUi, /this\.care\.deferIllnessRequest\(\)/);
assert.doesNotMatch(careUi, /class="later" data-action="delay"/);
assert.match(game, /if \(import\.meta\.env\.DEV\)/);
for (const source of [floating, walking]) {
  assert.match(source, /'calling'/);
  assert.match(source, /'called'/);
  assert.match(source, /callTo\(/);
  assert.match(source, /releaseCall\(/);
}
assert.match(game, /setMode\('close'\)/);
assert.match(game, /setMode\('overview'\)/);
assert.match(game, /callCloseElapsed >= this\.config\.call\.closeSeconds/);
assert.match(game, /if \(!this\.save\.settings\.tutorialSeen\) this\.showTutorial\(\)/);
for (const track of ['cafe', 'battle', 'enzan']) assert.equal(existsSync(new URL(`../public/audio/${track}.mp3`, import.meta.url)), true);
assert.equal(existsSync(new URL('../dist/server/index.js', import.meta.url)), true);
assert.equal(existsSync(new URL('../dist/.openai/hosting.json', import.meta.url)), true);

process.stdout.write('Final tutorial, call, save migration, audio and deployment regression: PASS\n');
