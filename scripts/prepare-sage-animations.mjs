import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { renameGlbAnimations } from './rename-glb-animations.mjs';

const ids = ['maria-theresa', 'caim', 'lobelia', 'alanaan', 'haaselia', 'borghan', 'catzelia', 'fraux', 'nier', 'estarriola', 'tartman'];
await mkdir('public/models/sages', { recursive: true });

for (const id of ids) {
  await renameGlbAnimations(
    path.join('assets/source-models', `${id}.glb`),
    path.join('public/models/sages', `${id}.glb`),
    path.join('assets/animation-maps', `${id}.json`),
  );
}
