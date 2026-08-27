# Asset Licenses

## Kenney Nature Kit

- Asset name: Nature Kit
- Author: Kenney
- Distribution: Kenney official website
- URL: https://kenney.nl/assets/nature-kit
- License: Creative Commons CC0 1.0 / Public Domain
- Local license copy: `public/stages/garden/KENNEY_LICENSE.txt`
- Textures: none in the selected GLB files

### Models used by 賢者っち

| Model | Use | File size | Triangle | Mesh | Material |
|---|---|---:|---:|---:|---:|
| `tree_default.glb` | 夏の庭・高木 | 9,428 B | 114 | 1 | 2 |
| `tree_fat.glb` | 夏の庭・低木風の木 | 5,576 B | 50 | 1 | 2 |
| `flower_redA.glb` | 赤い花 | 7,104 B | 76 | 1 | 2 |
| `flower_yellowB.glb` | 黄色い花 | 11,256 B | 154 | 1 | 2 |
| `grass.glb` | 草 | 11,496 B | 132 | 1 | 1 |
| `plant_bush.glb` | Bush | 4,396 B | 32 | 1 | 1 |
| `rock_smallA.glb` | 小さい岩 | 3,044 B | 16 | 1 | 2 |
| `rock_smallD.glb` | 小さい岩の差分 | 4,012 B | 32 | 1 | 2 |

Selected GLB total: 56,312 bytes. The original pack contains 330 files, but only the eight models used by the game are included.

All original PBR materials are converted at runtime to `MeshToonMaterial`. Original GLB files are not modified.

## Project-authored Geometry

The following background objects are original procedural Three.js geometry and do not use third-party assets:

- Grass ground
- Wooden boundary fence
- Vinyl pool and water surface
- Small summer ball

## Kenney Furniture Kit

- Asset name: Furniture Kit
- Author: Kenney
- Distribution: Kenney official website
- URL: https://kenney.nl/assets/furniture-kit
- License: Creative Commons CC0 1.0 / Public Domain
- Local license copy: `public/stages/interior/KENNEY_FURNITURE_LICENSE.txt`
- Textures: none in the selected GLB files

| Model | Use | File size | Triangle | Mesh | Material |
|---|---|---:|---:|---:|---:|
| `bedSingle.glb` | 子供部屋・ベッド | 18,636 B | 214 | 3 | 4 |
| `bookcaseOpenLow.glb` | 子供部屋・棚 | 11,520 B | 184 | 1 | 1 |
| `sideTable.glb` | 子供部屋・小机 | 8,800 B | 118 | 1 | 2 |
| `bear.glb` | 子供部屋・ぬいぐるみ | 11,884 B | 134 | 1 | 3 |
| `books.glb` | 子供部屋／和室・本 | 6,864 B | 62 | 1 | 4 |
| `plantSmall1.glb` | 和室・小さな植物 | 8,224 B | 102 | 1 | 2 |

## Kenney Brick Kit

- Asset name: Brick Kit
- Author: Kenney
- URL: https://kenney.nl/assets/brick-kit
- License: Creative Commons CC0 1.0 / Public Domain
- Local license copy: `public/stages/interior/KENNEY_BRICK_LICENSE.txt`
- Used model: `brick/bevel-lq-brick-2x4.glb` — 12,700 B / 188 triangles / 1 mesh / 1 material
- Required texture: `brick/Textures/colormap.png` — 8,534 B

## Kenney Toy Car Kit

- Asset name: Toy Car Kit
- Author: Kenney
- URL: https://kenney.nl/assets/toy-car-kit
- License: Creative Commons CC0 1.0 / Public Domain
- Local license copy: `public/stages/interior/KENNEY_TOY_CAR_LICENSE.txt`
- Used model: `toy-car/vehicle-vintage-racer.glb` — 102,156 B / 1,052 triangles / 5 meshes / 1 material
- Required texture: `toy-car/Textures/colormap.png` — 8,706 B

Only the eight models and two color maps used by the three stages are copied from these packs. Their selected payload is 198,024 bytes. PBR materials are converted to `MeshToonMaterial` at runtime; original files remain unchanged.

## Additional project-authored Geometry

- 子供部屋: floor, three walls, wall decoration, rug, rattle
- 和室: floor, tatami and borders, walls, wooden shoji frame and paper panel, low table, cushions, vase
