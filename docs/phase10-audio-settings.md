# Phase 10 最終UI・Audio・設定

## 完了範囲

- `AudioService`でカフェ／バトル／甲板のMP3 BGMをループ再生し、主要SEをWeb Audioで生成する。
- BGM・SEは個別にON/OFFと音量を設定でき、iOS SafariでもGainNode経由で音量を反映する。
- 最初のPointer / Key入力内で音声を開始し、Page Visibilityに合わせてPause / Resumeする。
- 育成メーターを折りたたみ、お世話・背景選択をトグル表示する。
- 設定から図鑑・世代・マップ・設定を維持したまま幼年期へ育て直せる。
- 初回起動時に操作ガイドを表示し、スキップおよび設定からの再表示を可能にする。
- 「呼ぶ」でキャラクターを手前へ移動し、到着後に近影Cameraへ切り替える。8秒後、再押下、操作割込み、進化、背景・モデル切替時は通常生活へ戻る。

## Save

Save schema V14でBGM選択、BGM / SE音量、育成メーター格納、操作ガイド確認済み状態、看病回数を保存する。V1〜V13のSaveは、育成進行・図鑑・世代・マップを維持して移行する。

## 最終回帰

`npm run verify` はTypeScript、Production Build、全GLB、Animation CrossFade、Phase 6〜10に加え、初回ガイド、呼び寄せ状態、Camera復帰、Save migration、音声Asset、Sites配布物を検証する。

バランス、スマートフォン表示、音量、メモリは実機確認済み。今後のモニターテストで見つかった内容は完成版への調整パッチとして扱う。
