import type { StageConfig } from './stage-types';

const assetPath = (name: string) => `${import.meta.env.BASE_URL}stages/interior/${name}.glb`;

export const JAPANESE_ROOM_STAGE: StageConfig = {
  id: 'japanese-room', label: '和室', background: 0xd8c6a4,
  fog: { color: 0xd8c6a4, near: 9, far: 17 },
  assets: [{ id: 'plant', path: assetPath('plantSmall1') }, { id: 'books', path: assetPath('books') }],
  placements: [
    { assetId: 'plant', position: [-2.8, .34, -2.55], scale: 2.4, interestTypes: ['LOOK_AT'] },
    { assetId: 'books', position: [2.65, .08, -2.55], rotationY: .15, scale: 2.15, interestTypes: ['LOOK_AT', 'READ'] },
  ],
  geometry: [
    { id: 'washitsu', kind: 'japanese-room-shell', position: [0, 0, 0] },
    { id: 'chabudai', kind: 'low-table', position: [.25, 0, .15], rotationY: .08, interestTypes: ['APPROACH', 'SIT'] },
    { id: 'red-cushion-a', kind: 'cushion', position: [-.95, .06, .35], rotationY: .22, interestTypes: ['SIT'] },
    { id: 'red-cushion-b', kind: 'cushion', position: [1.42, .06, -.15], rotationY: -.18, interestTypes: ['SIT'] },
    { id: 'flower-vase', kind: 'vase', position: [-2.8, .18, -2.3], scale: 1.15, interestTypes: ['LOOK_AT'] },
  ],
  movement: { halfWidth: 2.35, halfDepth: 1.45, obstacles: [{ kind: 'circle', x: .25, z: .15, radius: .92 }] },
};
