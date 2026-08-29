# 賢者っち

スマートフォン向け3D育成ゲーム「賢者っち」の本番プロジェクトです。現在は **Phase 1〜Phase 8** を実装しています。本物のワールドっちGLBがのんびり生活し、育て方によって10種類の賢者っちへ進化します。病気の時は連続した看病で回復し、卵から世代を重ねるとレア要求からタルトマンっちへ進化する可能性があります。

背景はCC0 AssetとThree.js Geometryを組み合わせた **夏の庭・子供部屋・和室** の3ステージを実装しています。下部のマップボタンから切り替えられ、選択したステージは端末に保存されます。

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
- 賢者っち10体＋タルトマンっち: `public/models/sages/`
- モデル参照、Scale、Material方式、Controller種別、Hit Areaは `src/characters/character-config.ts`
- 11体の原本は `assets/source-models/`、意味名対応表は `assets/animation-maps/`
- `npm run prepare:sages` で11体すべての原本から意味名付き派生GLBを再生成できる
- ゲームで使用する主要Clipは `idle / walk / happy / ok / lookAround / angry / sad / cry / fear`。目視で意味を確定していない未使用Clipは誤分類を避けて `unclassifiedXX` と明記する

解析記録は `docs/worldtchi-analysis.md` と `docs/sage-character-audit.md` にあります。

## Config

`src/config/game-config.ts` で次を調整できます。

- PixelRatio上限（初期値1.5）と最大delta（0.05秒）
- Cameraの通常俯瞰／呼び寄せ用近景、追跡量、見回し範囲、自動復帰
- 移動速度・範囲、Idle時間、縦／横スピンの頻度と速度
- Floating / Pulse / Glow / Reaction
- Tap / Pet / PickUp / CameraのGesture閾値
- ステータス変化速度、オネダリ間隔・判定閾値、育成効果
- 白黒／賢者っち進化の必要お世話回数、育成履歴Weight、演出時間、進化後Scale
- 卵の必要フォアグラウンド時間・お世話回数、タルト要求確率
- Save key / schema version / Debug初期値

## Debug Mode

画面右上の `DEV` からHUDを切り替えます。FPS、Frame Time、delta、DPR、Character State、Target、Gesture、Draw Call、Triangleを表示します。11体の一時表示、Reaction確認、レア要求の強制発生が可能です。

## 操作

- Character短押し: Tap
- Character上Swipe: Pet（Cameraは動かない）
- Character長押し: PickUp開始、そのままDrag
- Background Swipe: 制限付きCamera見回し
- Release: 浮遊高度へ戻り、Idle後に自律生活へ復帰
- お世話: 食事（野菜・甘いもの・肉）、遊び（ボール・ガラガラ・絵本）、休む
- オネダリ: 「応える」から適切なお世話、または「あとでね」
- 進化・卵: 各形態でフォアグラウンド2分＋お世話8回を満たすと次の進化または卵が発生
- レア要求: 2世代目以降の食事要求の5%で発生し、その時だけタルトを選択可能
- 育成メーターは良好状態から減る表示で統一し、初期版より2倍の速度で悪化するアクティブ調整

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
- `characters/CharacterLoader`: GLB、賢者っちのToon変換、ワールドっち系のGlossy PBR変換、Scale/中心補正、Dispose
- `characters/FloatingCharacterController`: 浮遊、自律行動、Reaction、PickUp
- `characters/WalkingCharacterController`: 賢者っちのIdle、自律歩行、旋回、Reaction、PickUp
- `characters/AnimationController`: 意味名Animation、CrossFade、LoopOnce復帰、Root Motion除去
- `input/InputController`: Pointer EventとGesture優先順位
- `camera/FollowCamera`: 追跡、制限付きSwipe、自動復帰
- `effects/EffectSystem`: 差し替え可能なHeart / Sparkle
- `care/CareSystem`: ステータス時間進行、オネダリ、育成効果・履歴
- `care/CareUI`: ステータスゲージ、お世話メニュー、オネダリ表示
- `evolution/EvolutionSystem`: 白黒の総合判定、Glossy PBR外観差分、進化演出・復元
- `evolution/sage-evolution-config`: 白／黒各5体の進化候補、重み、説明、非数値ヒント
- `encyclopedia/EncyclopediaUI`: 発見保存、未発見表示、発見済み本番GLBの3D閲覧
- `generation/GenerationSystem`: 成人時間・お世話回数、卵、世代交代
- `generation/EggView`: 軽量3D卵と世代交代UI
- `stages/StageAssetManager`: GLB Cache、共有Resource、Toon変換
- `stages/StageLoader`: Stage ConfigからAsset・Geometry・Interest Pointを構築
- `stages/*-stage`: 3ステージの配置、軽量Collision、Interest Metadata
- `stages/stage-registry`: ステージ切替用のConfig登録
- `audio/AudioService`: iOS初回Gesture対応、軽量BGM、主要SE、Lifecycle Pause/Resume
- `save/SaveService`: 育成・進化・病気・世代・卵・具体的な要求内容・音設定・図鑑、V1〜V11 Migration
- `debug/DebugHud`: 開発情報と可視化

## 現在実装Phase

- Phase 1: 本番ゲーム基盤 — 完了
- Phase 2: ワールドっち — 完了
- Phase 3: 育成 — 完了
- Phase 4: 白黒進化 — 完了
- Phase 5: 賢者っち共通基盤・10体Asset導入 — 完了
- Phase 6: 10種類の進化条件・図鑑 — 完了
- Phase 7: 病気・看病 — 完了
- Phase 8: 卵・世代交代・タルトマンっちレア進化 — 完了
- Phase 9: 3ステージ — 完了
- Phase 10: BGM / SE / UI / バランス調整 / 最適化 — 着手（Audio・設定基盤まで完了）

## Phase 3の時間と保存

- ステータスとオネダリの時間は、ページがフォアグラウンドの間だけ進行
- `visibilitychange` でバックグラウンド中のSimulationを停止
- 復帰時に巨大deltaや閉じていた時間を反映しない
- ステータス、育成履歴、対応回数、設定をLocalStorageへ定期保存
- 現在の進化段階と白／黒形態を保存し、再起動時は演出なしで復元
- 賢者っちへの進化形態、段階別時間・お世話回数、病気・看病段階、世代、卵、保留中要求と希望内容、BGM／SE設定、発見済み図鑑をSave schema V11で保存
- ブラウザデータ削除時の消失は仕様として許容

## Phase 4の白黒進化

- ワールドっちでフォアグラウンド2分かつお世話8回（Configから変更可能）
- Calm、Affection、Healthy、Book等と、Active、Ball、Delay、Stress等を重み付きで総合判定
- ワールドっち系は艶のあるMeshStandardMaterialを使い、白は明るいEmissive、黒は暗いColorとして同じ本番GLBへランタイム適用
- 両形態とも約8%大きく表示し、元GLBは変更しない
- 白＝善、黒＝悪ではなく、穏やか／活発の育成個性として扱う

## Phase 6の賢者っち進化・図鑑

- 白ワールドっちから5体、黒ワールドっちから5体へ進化
- 白／黒ワールドっちになってから、改めてフォアグラウンド2分かつお世話8回
- 食事・遊び・愛情・ストレス・お世話成功／保留など複数履歴の重み付き総合判定
- 正確なWeightや数値条件はUIに表示せず、図鑑では言葉による育成ヒントだけを表示
- 発見済みは名前・説明・本番GLBの3D表示、未発見はシルエット・？？？・進化ヒント
- 病気はCare回数、ストレス、健康、あとでね履歴と確率から発生し、死亡や永久ペナルティはない
- 看病は「あたためる→休ませる→野菜を与える」の連続イベント。間違いや「あとでね」でも同じ段階から再開可能
- 病気中は移動・Animation・浮遊・発光が弱まり、回復後に通常生活へ戻る
- 食事・遊びのおねだりは希望する品をアイコンで示し、別の品を選ぶと怒って要求を継続する
- 看病にも「あたためる／冷やす」「休ませる／起こす」などのハズレ選択肢があり、間違えても死亡せず同じ段階からやり直せる
- DEVの「病気を発生」で看病フローを即時確認可能

## Phase 8の卵・世代交代・レア進化

- 最終進化後、フォアグラウンド2分とお世話8回の両方を満たすと卵が現れる
- 世代交代でStatus・History・進化を初期化し、図鑑・マップ・設定を保持する

## Phase 10のサウンド・設定

- iOS Safariの制約に合わせ、最初のPointer / Key入力後にAudioContextを開始
- 育成画面では控えめなWeb Audio BGMを再生し、Tap、Pet、要求、喜怒、病気、回復、進化、卵、UIのSEを実装
- 設定画面からBGMと効果音を個別に切替でき、端末へ保存
- Background時はAudioContextをSuspendし、復帰時に安全にResume
- 1回以上世代交代すると、食事要求の5%で「タルトが食べたいみたい」が発生する
- レア要求への回答時だけタルトを表示し、与えると現在段階を問わずタルトマンっちへ進化する
- タルト以外の食事や「あとでね」では進化せず、後の食事要求で再抽選される
- タルトマンっちは図鑑の秘密の11枠目として扱う

## 背景進行状況

- 夏の庭: 実装・実機確認済み
- 子供部屋: 実装済み
- 和室: 実装済み
- 3ステージともスマートフォン実機確認済み

外部Assetの出典・License・使用モデルは `ASSET_LICENSES.md`、各ステージの構成と計測値は `docs/*-audit.md` を参照してください。
