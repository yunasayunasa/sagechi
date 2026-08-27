# 賢者っち

スマートフォン向け3D育成ゲーム「賢者っち」の本番プロジェクトです。現在は **Phase 1 / Phase 2** のみを実装しています。本物のワールドっちGLBが、のんびり浮遊・自律移動し、Tap / Pet / PickUpへ反応します。育成機能はまだありません。

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
- Camera追跡、見回し範囲、自動復帰
- 移動速度・範囲、Idle時間
- Floating / Pulse / Glow / Reaction
- Tap / Pet / PickUp / CameraのGesture閾値
- Save key / schema version / Debug初期値

## Debug Mode

画面右上の `DEV` からHUDを切り替えます。FPS、Frame Time、delta、DPR、Character State、Target、Gesture、Draw Call、Triangleを表示します。HUD内のToggleでHit Area、Movement Area、Targetを可視化できます。通常表示ではすべて非表示です。

## 操作

- Character短押し: Tap
- Character上Swipe: Pet（Cameraは動かない）
- Character長押し: PickUp開始、そのままDrag
- Background Swipe: 制限付きCamera見回し
- Release: 浮遊高度へ戻り、Idle後に自律生活へ復帰

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
- `save/SaveService`: schema versionとMigration入口
- `debug/DebugHud`: 開発情報と可視化

## 現在実装Phase

- Phase 1: 本番ゲーム基盤 — 完了
- Phase 2: ワールドっち — 完了
- Phase 3以降: 未着手
