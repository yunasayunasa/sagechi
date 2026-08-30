# GitHub公開チェックリスト

## 公開前に必ず決めること

- [x] ソースコードと専用AssetをAll rights reservedとして明記する
- [x] 公開先をGitHubのpublicリポジトリとする

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
- ソースコードLICENSE: All rights reserved（閲覧・実行のみ）
- キャラクターGLB・BGM: 再利用・改変・再配布を許諾しない専用Asset
- GitHubリポジトリ作成・remote追加・push: 未実施

公開後も、専用Assetへオープンライセンスを誤って付与しないでください。
