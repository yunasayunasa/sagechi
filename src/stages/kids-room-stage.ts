import type { StageConfig } from './stage-types';

const assetPath = (name: string) => `${import.meta.env.BASE_URL}stages/interior/${name}.glb`;

export const KIDS_ROOM_STAGE: StageConfig = {
  id: 'kids-room', label: '子供部屋', background: 0xf0dce6,
  fog: { color: 0xf0dce6, near: 9, far: 17 },
  assets: [
    { id: 'bed', path: assetPath('bedSingle') }, { id: 'shelf', path: assetPath('bookcaseOpenLow') },
    { id: 'small-table', path: assetPath('sideTable') }, { id: 'bear', path: assetPath('bear') },
    { id: 'books', path: assetPath('books') }, { id: 'brick', path: assetPath('brick/bevel-lq-brick-2x4') },
    { id: 'toy-car', path: assetPath('toy-car/vehicle-vintage-racer') },
  ],
  placements: [
    { assetId: 'bed', position: [-3.2, .13, -.35], scale: 1.12, interestTypes: ['SLEEP', 'APPROACH'] },
    { assetId: 'shelf', position: [1.9, 0, -2.52], scale: 2.45, interestTypes: ['LOOK_AT', 'READ'] },
    { assetId: 'books', position: [2.03, 1.02, -2.39], rotationY: -.12, scale: 2.2, interestTypes: ['READ'] },
    { assetId: 'small-table', position: [2.35, 0, .55], rotationY: -1.15, scale: 1.45, interestTypes: ['LOOK_AT'] },
    { assetId: 'bear', position: [-2.55, 0, 1.45], rotationY: -.25, scale: 1.85, interestTypes: ['LOOK_AT', 'PLAY'] },
    { assetId: 'toy-car', position: [1.55, .14, 1.4], rotationY: -.7, scale: .62, interestTypes: ['APPROACH', 'PLAY'] },
    { assetId: 'brick', position: [-1.75, .03, 1.75], rotationY: .4, scale: 2.25, interestTypes: ['PLAY'] },
    { assetId: 'brick', position: [-1.35, .03, 1.55], rotationY: -.55, scale: 1.8 },
  ],
  geometry: [
    { id: 'kids-room', kind: 'kids-room-shell', position: [0, 0, 0] },
    { id: 'sunny-rug', kind: 'kids-rug', position: [0, .02, .25], rotationY: .1, interestTypes: ['SIT', 'PLAY'] },
    { id: 'rattle', kind: 'rattle', position: [.75, .23, 1.2], rotationY: -.45, scale: 1.2, interestTypes: ['APPROACH', 'PLAY'] },
  ],
  movement: { halfWidth: 2.35, halfDepth: 1.45, obstacles: [{ kind: 'circle', x: 2.35, z: .55, radius: .55 }] },
};
