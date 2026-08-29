# GitHub公開チェックリスト

## 公開前に必ず決めること

- [ ] ソースコードに適用するLICENSEを選び、`LICENSE`を追加する
- [ ] キャラクターGLBを一般公開リポジトリで再配布できる権利があることを確認する
- [ ] BGM 3曲を一般公開リポジトリで再配布できる権利があることを確認する
- [ ] 再配布できないAssetがある場合、Git履歴へ公開する前に除外し、配置手順とサンプル設定を用意する
- [ ] 公開先のGitHubリポジトリ名・説明・可視性を決める

## 公開直前の確認

- [ ] `npm ci` が成功する
- [ ] `npm run verify` が成功する
- [ ] GitHub ActionsのVerifyが成功する
- [ ] `.env`、秘密鍵、アクセストークン、個人情報、ローカルログが追跡されていない
- [ ] `git status` に意図しない変更や生成物がない
- [ ] `ASSET_LICENSES.md` の出典と権利条件が最新である
- [ ] READMEのSetup、操作、スマートフォン確認手順が現行実装と一致する
- [ ] 公開ビルドで初回ガイド、「呼ぶ」、お世話、進化、病気、卵、図鑑、3ステージ、BGM/SEを確認する

## 現在の状態

- GitHub Actions: 準備済み（`.github/workflows/verify.yml`）
- 秘密情報の基本除外: 準備済み（`.gitignore`）
- ソースコードLICENSE: 未選択
- キャラクターGLB・BGMの再配布確認: 未確認
- GitHubリポジトリ作成・remote追加・push: 未実施

GitHubへの初回pushは、LICENSEとAsset再配布条件を確定した後に行ってください。
