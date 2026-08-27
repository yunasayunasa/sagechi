# 子供部屋 Asset / Performance Audit

## Composition

- Kenney CC0 models: Furniture Kit 5種、Brick Kit 1種、Toy Car Kit 1種
- Three.js Geometry: floor, three walls, wall decoration, rug, rattle
- External asset payload used by this stage: 189,800 bytes
- External placed triangle subtotal: approximately 2,140
- Measured full scene (character + stage): approximately 21,230 triangles / 29–33 draw calls
- Measured development preview: 57 FPS, approximately 18 ms frame time, DPR 1.0
- Background textures: 2 external color maps (brick 8,534 B / toy car 8,706 B); furniture is textureless
- Character movement bounds: x ±2.35 / z ±1.45
- Gameplay collision: one simple circle around the small table

## Interest Points

| Object | Interest type |
|---|---|
| Bed | `SLEEP`, `APPROACH` |
| Shelf / books | `LOOK_AT`, `READ` |
| Rug | `SIT`, `PLAY` |
| Bear / brick / toy car / rattle | `PLAY` and/or `APPROACH` |

Interest Points are metadata only. AI behavior integration is deferred.

## Improvement candidates

- 実機確認後、必要なら壁飾りの色と家具Scaleを微調整
- 将来のWalking Characterではベッドと棚にも単純なRectangle/Box collisionを追加
