# Phase 5 賢者っちAsset監査

元GLBは `assets/source-models/` に保持する。`public/models/sages/` にはAnimationClipだけを意味名へ正規化した派生GLBを配置し、ゲーム実行時にScale補正、Toon変換、歩行ClipのRoot Motion除去を行う。Geometry、Texture、Rig、Animation Trackは変更しない。

| キャラクター | Triangle | Mesh | Material | Bone | Animation | Texture |
|---|---:|---:|---:|---:|---:|---|
| マリア・テレサ | 19,450 | 1 | 1 | 41 | 12 | 1×1024² |
| カイム | 18,816 | 1 | 1 | 41 | 10 | 1×1024² |
| ロベリア | 18,828 | 1 | 1 | 42 | 11 | 1×1024² |
| アラナン | 19,118 | 1 | 1 | 41 | 12 | 1×1024² |
| ハーゼリーラ | 19,418 | 1 | 1 | 41 | 12 | 1×1024² |
| ボーガン | 19,898 | 1 | 1 | 41 | 13 | 1×1024² |
| カッツェリーラ | 19,386 | 1 | 1 | 41 | 11 | 1×1024² |
| フラウ | 19,248 | 1 | 1 | 41 | 9 | 3×1024² |
| ニーア | 18,862 | 1 | 1 | 41 | 9 | 3×2048² |
| エスタリオラ | 19,546 | 1 | 1 | 41 | 11 | 1×1024² |
| タルトマン | 18,580 | 13 | 1 | 41 | 16 | 1×2048² |

全11体を再利用できるよう、主要AnimationClip名を `idle / walk / happy / ok / lookAround / angry / sad / cry / fear` へ正規化している。変換表は `assets/animation-maps/<id>.json`。意味を目視確定していないゲーム未使用Clipは、誤った意味名を付けず `unclassifiedXX` として残す。

全モデルがSkinnedMeshで、Phase 5の想定値（約2万Triangle、約41 Bone、複数Animation）内。Raw Clip名は `NlaTrack...` のため、`character-config.ts` で意味名へ変換し、ゲームロジックはRaw Clip名を参照しない。

既存10体はブラウザ連続交換済み。タルトマンは13 Meshのため既存1 MeshモデルよりDraw Callが増える。最終的なiPhone Safari性能、サイズ、向き、各Animationの演技内容は公開版で目視確認する。
