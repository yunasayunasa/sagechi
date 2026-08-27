# ワールドっちGLB解析結果

対象: `public/models/worldtchi.glb`（元GLBは未変更）

| 項目 | 結果 |
|---|---|
| GLB | glTF 2.0 / 661,720 bytes |
| Triangle | 18,908 |
| Mesh / Primitive | 1 / 1 |
| Material | 1（OPAQUE） |
| PBR | Metallic 0 / Roughness 0.9 |
| Texture | BaseColor JPEG 1枚、1024 × 1024 |
| Skin / Bone | 0 / 0 |
| AnimationClip | 0 |
| Local BoundingBox | min `(-0.5000, 0, -0.4969)` / max `(0.5000, 0.9996, 0.4969)` |
| サイズ / 中心 | `(1.0000, 0.9996, 0.9939)` / `(0, 0.4998, 0)` |
| Root Transform | Position `(0,0,0)`、Rotation identity、Scale `(1,1,1)` |
| 原点 | 球体の下端中央。浮遊基準へ合わせやすく、補正上の問題なし |
| 正面 | Root回転はidentity。描画確認では地球模様に強い正面依存がなく、カメラ側を基準に扱える |
| Runtime Scale | BoundingBox高をCharacter Configの `targetHeight: 1.6` へ正規化 |

## Material判断

元MaterialはMetallic 0 / Roughness 0.9で過度なPBR光沢はない。一方、完成ゲームのToon方針、発光リアクション、将来の賢者っちとの共通化を優先し、BaseColor Textureを複製・維持した `MeshToonMaterial` へ実行時変換する。元GLBには手を加えない。

## 結論

単一Mesh・Material・1K Textureで、Phase 2のスマートフォン向け単体表示に重大な問題はない。Skin/Animation非依存の `FloatingCharacterController` が適合する。
