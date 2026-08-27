# 夏の庭 Asset / Performance Audit

## Composition

- Kenney Nature Kit CC0 models: 8 unique / 16 placements
- Three.js Geometry: ground, fence, vinyl pool, toy ball
- External textures: 0
- External asset payload: 56,312 bytes
- External model triangle per unique model: 16–154
- External placed triangle subtotal: approximately 1,400
- Measured full scene (character + summer garden): 20,720 triangles / 26 draw calls
- Measured development preview: 57 FPS, 17.4 ms frame time, DPR 1.0
- Background texture count: 0 (full scene uses the character's one 1024px texture)
- Character movement bounds: x ±2.35 / z ±1.45
- Gameplay collision: simple circle obstacle metadata for the pool

## Interest Points

| Object | Interest type |
|---|---|
| Tree | `LOOK_AT` |
| Vinyl pool | `LOOK_AT`, `APPROACH` |
| Summer ball | `APPROACH`, `PLAY` |

Interest Points are metadata only in this background slice. Character AI integration is deferred.

## Rendering policy

- Cached GLB templates; clones share Geometry and Material
- PBR is converted to Toon at runtime
- Fence posts use `InstancedMesh`
- No realtime shadows on background assets
- No mesh collider; visual mesh and collision metadata are separate
- Stage resources are removed and disposed through Stage Loader / Asset Manager
