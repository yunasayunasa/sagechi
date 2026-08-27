import type { StageConfig } from './stage-types';

const assetPath = (name: string) => `${import.meta.env.BASE_URL}stages/garden/${name}.glb`;

export const SUMMER_GARDEN_STAGE: StageConfig = {
  id: 'summer-garden', label: '夏の庭', background: 0xb9e4ef,
  fog: { color: 0xb9e4ef, near: 9, far: 17 },
  assets: [
    { id: 'tree-default', path: assetPath('tree_default') }, { id: 'tree-fat', path: assetPath('tree_fat') },
    { id: 'flower-red', path: assetPath('flower_redA') }, { id: 'flower-yellow', path: assetPath('flower_yellowB') },
    { id: 'grass', path: assetPath('grass') }, { id: 'bush', path: assetPath('plant_bush') },
    { id: 'rock-a', path: assetPath('rock_smallA') }, { id: 'rock-d', path: assetPath('rock_smallD') },
  ],
  placements: [
    { assetId: 'tree-default', position: [-2.55, 0, -2.45], rotationY: .35, scale: 1.55, interestTypes: ['LOOK_AT'] },
    { assetId: 'tree-fat', position: [2.55, 0, -2.35], rotationY: -.5, scale: 1.65, interestTypes: ['LOOK_AT'] },
    { assetId: 'tree-fat', position: [-3.15, 0, .15], rotationY: .8, scale: 1.18 },
    { assetId: 'bush', position: [-2.05, 0, -2.15], scale: 2.1 }, { assetId: 'bush', position: [2.05, 0, -2.2], scale: 1.8 },
    { assetId: 'bush', position: [-2.85, 0, 1.25], scale: 1.55 },
    { assetId: 'rock-a', position: [-2.3, 0, 1.4], rotationY: .8, scale: 1.35 }, { assetId: 'rock-d', position: [2.35, 0, .65], rotationY: -.25, scale: 1.25 },
    { assetId: 'flower-red', position: [-1.9, 0, -1.8], scale: 1.55 }, { assetId: 'flower-red', position: [1.75, 0, -2.05], rotationY: .7, scale: 1.35 },
    { assetId: 'flower-yellow', position: [-2.65, 0, .9], scale: 1.6 }, { assetId: 'flower-yellow', position: [2.7, 0, -.35], rotationY: .4, scale: 1.45 },
    { assetId: 'grass', position: [-1.15, 0, -2.15], scale: 1.3 }, { assetId: 'grass', position: [.95, 0, -2.35], rotationY: 1.1, scale: 1.15 },
    { assetId: 'grass', position: [-3.55, 0, -.65], rotationY: .4 }, { assetId: 'grass', position: [3.65, 0, 1.1], rotationY: -.8 },
  ],
  geometry: [
    { id: 'garden-ground', kind: 'ground', position: [0, 0, 0] },
    { id: 'garden-fence', kind: 'fence', position: [0, 0, -3.05] },
    { id: 'vinyl-pool', kind: 'pool', position: [1.85, .02, 1.55], rotationY: -.12, scale: .82, interestTypes: ['LOOK_AT', 'APPROACH'] },
    { id: 'summer-ball', kind: 'toy-ball', position: [-1.65, .18, 1.55], scale: .72, interestTypes: ['APPROACH', 'PLAY'] },
  ],
  movement: {
    halfWidth: 2.35, halfDepth: 1.45,
    obstacles: [{ kind: 'circle', x: 1.85, z: 1.55, radius: .75 }],
  },
};
