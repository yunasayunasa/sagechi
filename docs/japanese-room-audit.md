# 和室 Asset / Performance Audit

## Composition

- Reused Kenney Furniture Kit CC0 models: books, small plant
- Three.js Geometry: floor, six tatami mats, tatami borders, three walls, shoji, low table, two cushions, vase
- External asset payload used by this stage: 15,088 bytes
- External placed triangle subtotal: 164
- Measured full scene (character + stage): approximately 20,190 triangles / 44 draw calls
- Measured development preview: 56 FPS, approximately 17.7 ms frame time, DPR 1.0
- Background textures: 0
- Character movement bounds: x ±2.35 / z ±1.45
- Gameplay collision: one simple circle around the low table

## Interest Points

| Object | Interest type |
|---|---|
| Low table | `APPROACH`, `SIT` |
| Cushions | `SIT` |
| Books | `LOOK_AT`, `READ` |
| Plant / vase | `LOOK_AT` |

Interest Points are metadata only. AI behavior integration is deferred.

## Improvement candidates

- 障子の格子は明瞭さを優先した個別Mesh。必要になればInstancedMeshへ統合可能
- 将来のWalking Characterでは低机以外の壁際家具にも単純collisionを追加
