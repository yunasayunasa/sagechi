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

全10体を再利用できるよう、主要AnimationClip名を `idle / walk / happy / ok / lookAround / angry / sad / cry / fear` へ正規化している。変換表は `assets/animation-maps/<id>.json`。意味を目視確定していないゲーム未使用Clipは、誤った意味名を付けず `unclassifiedXX` として残す。
| エスタリオラ | 19,546 | 1 | 1 | 41 | 11 | 1×1024² |

全モデルがSkinnedMeshで、Phase 5の想定値（約2万Triangle、約41 Bone、複数Animation）内。Raw Clip名は `NlaTrack...` のため、`character-config.ts` で意味名へ変換し、ゲームロジックはRaw Clip名を参照しない。

ブラウザ自動確認では10体連続交換後も警告・Errorなし。子供部屋で約29〜34 Draw Call、約21,700〜22,900 Triangle、デスクトップ検証環境で約53〜57 FPS。最終的なiPhone Safari実機性能と各Animationの演技内容は公開版で目視確認する。
