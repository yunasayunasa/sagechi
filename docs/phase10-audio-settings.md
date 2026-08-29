# Phase 10 Audio・設定基盤

## 実装範囲

- `AudioService`で外部音源に依存しない軽量なWeb Audio BGMとSEを生成する。
- Tap、Pet、要求、喜び、怒り、病気、回復、進化、卵、UIへSEを接続する。
- iOS Safariではユーザーの最初のPointer / Key入力内でAudioContextを生成・Resumeする。
- Page VisibilityでBackgroundへ移動した時はSuspend、復帰時はResumeする。
- 設定画面からBGM / SEを個別に切り替える。

## Save

Save schema V11で `settings.bgm` と `settings.se` を保存する。V1〜V10の既存Saveは、進行状況を維持したまま両方ONを初期値として移行する。

## 今後のPhase 10

- 実機で音量、音色、長時間再生時の疲れにくさを調整する。
- 必要に応じて本番音源Assetへ差し替えられる構造へ拡張する。
- UIの最終整理、描画負荷計測、Bundle分割、スマートフォン実機性能確認を行う。
