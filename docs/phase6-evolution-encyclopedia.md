# Phase 6 賢者っち進化・図鑑

## 進化

- 白ワールドっちから5体、黒ワールドっちから5体。
- 初期値は累計お世話8回。白黒進化が3回なので、さらに約5回で第3段階へ進む。
- `sage-evolution-config.ts` の候補データと育成履歴Weightから各Branch内の最高Scoreを選ぶ。
- 単一の正解・失敗ではなく、食事、遊び、ふれあい、お世話成功、保留など複数傾向を使う。
- Exact Weightはゲーム画面へ表示しない。図鑑には自然文のヒントだけを表示する。

## 図鑑

- Save schema V6の `encyclopedia` に発見済みCharacter IDを保存する。
- 発見済み: 名前、説明、育成ヒント、本番GLBのIdle 3D Preview。
- 未発見: シルエット、`？？？`、育成ヒント。
- 3D Previewは図鑑を開いている間だけ読み込み・描画し、閉じるとModel ResourceをDisposeする。

## Phase境界

病気・看病、卵、世代交代はPhase 6に含めず、未実装のままとする。
