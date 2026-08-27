# 賢者っち

スマートフォン向け3D育成ゲーム「賢者っち」の本番プロジェクトです。現在は **Phase 1〜Phase 4** を実装しています。本物のワールドっちGLBがのんびり生活し、直接操作とお世話の傾向によって白／黒ワールドっちへ進化します。

背景制作は別途段階導入中です。現在はCC0 AssetとThree.js Geometryで構成した **夏の庭** まで完成しています。子供部屋・和室は、夏の庭のスマートフォン実機確認後に追加します。

## 使用技術

- Vite + Three.js + TypeScript
- HTML / CSS / Pointer Events
- LocalStorage（バージョン付きSave基盤のみ）

React等のUI Frameworkは採用していません。Phase 1 / 2は単一3D画面が中心で、Vanilla TypeScriptの方が依存と実行コストを小さく保てるためです。

## Setup / Development

```powershell
npm install
npm run dev
```

開発サーバーが表示するURLを開きます。同一LANのiPhoneから確認する場合は、PCのファイアウォール設定を確認して `http://<PCのIP>:4173` を開きます。

## Build / Verify

```powershell
npm run build
npm run verify
```

GLBの再解析だけを行う場合:

```powershell
npm run analyze:worldtchi
```

## Asset配置

- 本番ワールドっち: `public/models/worldtchi.glb`
- 元GLBは変更しない
- Phase 2では他キャラクターを配置・ロードしない
- モデル参照、Scale、Material方式、Controller種別、Hit Areaは `src/characters/character-config.ts`

解析記録は `docs/worldtchi-analysis.md` にあります。

## Config

`src/config/game-config.ts` で次を調整できます。

- PixelRatio上限（初期値1.5）と最大delta（0.05秒）
- Cameraの通常俯瞰／呼び寄せ用近景、追跡量、見回し範囲、自動復帰
- 移動速度・範囲、Idle時間、縦／横スピンの頻度と速度
- Floating / Pulse / Glow / Reaction
- Tap / Pet / PickUp / CameraのGesture閾値
- ステータス変化速度、オネダリ間隔・判定閾値、育成効果
- 白黒進化の必要お世話回数、Calm／Active判定Weight、演出時間、進化後Scale
- Save key / schema version / Debug初期値

## Debug Mode

画面右上の `DEV` からHUDを切り替えます。FPS、Frame Time、delta、DPR、Character State、Target、Gesture、Draw Call、Triangleを表示します。HUD内のToggleでHit Area、Movement Area、Targetを可視化できます。通常表示ではすべて非表示です。

## 操作

- Character短押し: Tap
- Character上Swipe: Pet（Cameraは動かない）
- Character長押し: PickUp開始、そのままDrag
- Background Swipe: 制限付きCamera見回し
- Release: 浮遊高度へ戻り、Idle後に自律生活へ復帰
- お世話: 食事（野菜・甘いもの・肉）、遊び（ボール・ガラガラ・絵本）、休む
- オネダリ: 「応える」から適切なお世話、または「あとでね」

通常時はステージ内で暮らす様子が見える俯瞰距離です。将来の「呼ぶ」操作では、`FollowCamera.setMode('close')` を使って従来相当の近景へ滑らかに切り替えられます（呼ぶUI自体はPhase 3以降）。

## スマートフォン確認

縦画面のiPhone Safariを主対象に、次を確認します。

1. 本番GLBのサイズ・向き・Toon表示
2. Idle、Floating、Pulse、Glowが過剰でない
3. 十分なIdle後にゆっくり自律移動する
4. Tap / Pet / PickUp / Cameraが競合しない
5. PickUp Release後に通常高度・自律生活へ戻る
6. Safari UI開閉・回転後にResizeされる
7. 別アプリ移動中に停止し、復帰時に瞬間移動しない
8. Debug HUDでDPR 1.5以下、巨大deltaなし、FPSに明らかな問題なし

## Architecture

- `core/Game`: Scene、Renderer、Loop、Lifecycle、Stage組立
- `characters/CharacterLoader`: GLB、Toon変換、Scale/中心補正、Dispose
- `characters/FloatingCharacterController`: 浮遊、自律行動、Reaction、PickUp
- `input/InputController`: Pointer EventとGesture優先順位
- `camera/FollowCamera`: 追跡、制限付きSwipe、自動復帰
- `effects/EffectSystem`: 差し替え可能なHeart / Sparkle
- `care/CareSystem`: ステータス時間進行、オネダリ、育成効果・履歴
- `care/CareUI`: ステータスゲージ、お世話メニュー、オネダリ表示
- `evolution/EvolutionSystem`: 白黒の総合判定、Toon外観差分、進化演出・復元
- `stages/StageAssetManager`: GLB Cache、共有Resource、Toon変換
- `stages/StageLoader`: Stage ConfigからAsset・Geometry・Interest Pointを構築
- `stages/garden-stage`: 夏の庭の配置、軽量Collision、Interest Metadata
- `save/SaveService`: 育成・進化データ、schema version、V1/V2→V3 Migration
- `debug/DebugHud`: 開発情報と可視化

## 現在実装Phase

- Phase 1: 本番ゲーム基盤 — 完了
- Phase 2: ワールドっち — 完了
- Phase 3: 育成 — 完了
- Phase 4: 白黒進化 — 完了
- Phase 5以降: 未着手

## Phase 3の時間と保存

- ステータスとオネダリの時間は、ページがフォアグラウンドの間だけ進行
- `visibilitychange` でバックグラウンド中のSimulationを停止
- 復帰時に巨大deltaや閉じていた時間を反映しない
- ステータス、育成履歴、対応回数、設定をLocalStorageへ定期保存
- 現在の進化段階と白／黒形態を保存し、再起動時は演出なしで復元
- ブラウザデータ削除時の消失は仕様として許容

## Phase 4の白黒進化

- 初期調整値はお世話3回（Configから変更可能）
- Calm、Affection、Healthy、Book等と、Active、Ball、Delay、Stress等を重み付きで総合判定
- 白は明るいEmissive、黒は暗いToon Colorとして同じ本番GLBへランタイム適用
- 両形態とも約8%大きく表示し、元GLBは変更しない
- 白＝善、黒＝悪ではなく、穏やか／活発の育成個性として扱う

## 背景進行状況

- 夏の庭: 実装済み（実機確認待ち）
- 子供部屋: 未着手
- 和室: 未着手

外部Assetの出典・License・使用モデル・Audit値は `ASSET_LICENSES.md`、夏の庭の構成と概算は `docs/summer-garden-audit.md` を参照してください。
