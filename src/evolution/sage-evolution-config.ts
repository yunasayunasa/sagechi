import type { CareHistory } from '../care/care-types';
import type { SageCharacterId } from '../characters/character-config';

export type SageBranch = 'white' | 'black';
export interface SageEvolutionEntry {
  id: SageCharacterId;
  name: string;
  branch: SageBranch;
  description: string;
  hint: string;
  weights: Partial<Record<keyof CareHistory, number>>;
}
export interface EncyclopediaEntry {
  id: SageCharacterId;
  name: string;
  branch: SageBranch | 'rare';
  description: string;
  hint: string;
}

export const SAGE_EVOLUTIONS: readonly SageEvolutionEntry[] = Object.freeze([
  { id: 'maria-theresa', name: 'マリア・テレサっち', branch: 'white', description: '甘い時間とやさしいふれあいを大切にする賢者っち。', hint: '甘いものを好み、たくさん撫でられた子がたどり着くことがあるらしい。', weights: { sweet: 2.2, affection: 1.6, calm: .4 } },
  { id: 'caim', name: 'カイムっち', branch: 'white', description: '元気な遊びにも静かな時間にもまっすぐ向き合う賢者っち。', hint: 'いろいろなお世話にきちんと応えてもらった子がたどり着くことがあるらしい。', weights: { careSuccess: 1.4, playRattle: 1.5, healthy: .8 } },
  { id: 'lobelia', name: 'ロベリアっち', branch: 'white', description: '好奇心の赴くまま、遊びの気配を探して暮らす賢者っち。', hint: 'ガラガラ遊びをよく楽しんだ子がたどり着くことがあるらしい。', weights: { playRattle: 2.5, active: .5, careSuccess: .3 } },
  { id: 'alanaan', name: 'アラナンっち', branch: 'white', description: '健やかな毎日を力に変え、穏やかに過ごす賢者っち。', hint: '野菜をよく食べ、元気に育った子がたどり着くことがあるらしい。', weights: { healthy: 2.4, careSuccess: .7, calm: .5 } },
  { id: 'haaselia', name: 'ハーゼリーラっち', branch: 'white', description: '絵本と静かな時間を好む、思慮深い賢者っち。', hint: '絵本を好み、ゆったり育った子がたどり着くことがあるらしい。', weights: { playBook: 2.5, calm: 1.1, affection: .3 } },
  { id: 'borghan', name: 'ボーガっち', branch: 'black', description: 'たくましい食事と刺激のある毎日を好む賢者っち。', hint: '肉をよく食べ、活発に育った子がたどり着くことがあるらしい。', weights: { meat: 2.4, active: 1, playBall: .4 } },
  { id: 'catzelia', name: 'カッツェリーラっち', branch: 'black', description: '少し不器用な日々も自分らしさに変える賢者っち。', hint: 'お世話を待った経験も、個性として抱えてきた子がたどり着くことがあるらしい。', weights: { careDelay: 2.1, stress: 1.2, affection: .3 } },
  { id: 'fraux', name: 'フラウっち', branch: 'black', description: '走って遊ぶことが大好きな、エネルギッシュな賢者っち。', hint: 'ボール遊びをたくさん楽しんだ子がたどり着くことがあるらしい。', weights: { playBall: 2.7, active: 1.1 } },
  { id: 'nier', name: 'ニーアっち', branch: 'black', description: 'さみしさも愛情も深く受け止める、繊細な賢者っち。', hint: '少し寂しい時間と、たくさんのふれあいを知る子がたどり着くことがあるらしい。', weights: { affection: 1.8, stress: 1.2, careDelay: .7 } },
  { id: 'estarriola', name: 'エスタリオラっち', branch: 'black', description: 'のんびりと休みながら、自分の時間を楽しむ賢者っち。', hint: '静かな遊びや休息を好んだ子がたどり着くことがあるらしい。', weights: { playBook: 1.8, calm: .8, careDelay: .6 } },
]);

export const TARTMAN_ENCYCLOPEDIA: EncyclopediaEntry = Object.freeze({
  id: 'tartman', name: 'タルトマンっち', branch: 'rare',
  description: '世代を越えた絆と、特別なタルトから生まれる幻の賢者っち。',
  hint: '世代を越えて育った子の中には、特別なお菓子との出会いで姿を変える子がいるらしい。',
});
export const ENCYCLOPEDIA_ENTRIES: readonly EncyclopediaEntry[] = Object.freeze([...SAGE_EVOLUTIONS, TARTMAN_ENCYCLOPEDIA]);

export function selectSageEvolution(branch: SageBranch, history: CareHistory): SageEvolutionEntry {
  const candidates = SAGE_EVOLUTIONS.filter((entry) => entry.branch === branch);
  return candidates.reduce((best, entry) => score(entry, history) > score(best, history) ? entry : best);
}

function score(entry: SageEvolutionEntry, history: CareHistory): number {
  return Object.entries(entry.weights).reduce((total, [key, weight]) => total + history[key as keyof CareHistory] * weight, 0);
}
