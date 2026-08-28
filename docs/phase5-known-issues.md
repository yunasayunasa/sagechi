# Phase 5 既知不具合と修正

2026-08-28のスマートフォン確認を基準に修正。

- 賢者っち確認中もPetをCareへ通知し、撫でるオネダリを完了する。
- Petの見た目ReactionとCare Reactionの二重再生を廃止。
- Animation切替時は現在Actionと次ActionのFade状態を整理し、同一Actionを再Resetしない。
- Pointer Gesture後550msは次入力を受けず、Reaction／PickUp後は最低7.5秒Idleを確保。
- 自律Look Around率を0.30から0.10へ下げ、怯え続ける印象を抑制。
- 全賢者っちの表示名へ「っち」を追加。ボーガン表記は「ボーガっち」へ訂正。
- Care案内と通常Narrationを現在キャラクター名に追従。
- ユーザーが目視確認した実際の演技を基準に、意味名Animation Mapを再割り当て。

ニーアっちはモデルのRig自体に問題があり、後日GLB差し替え予定。今回はゲーム側のMappingのみ修正し、元GLBは変更していない。
