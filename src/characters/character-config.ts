export type SemanticAnimation = 'idle' | 'walk' | 'happy' | 'ok' | 'lookAround' | 'angry' | 'sad' | 'cry' | 'fear';
export interface CharacterConfig {
  id: string; label: string; glbPath: string; targetHeight: number;
  groundOffset: number; materialMode: 'toon' | 'original'; controller: 'floating' | 'walking';
  hitRadius: number; hitCenterY: number;
  animationMap?: Partial<Record<SemanticAnimation, string>>;
  moveSpeedScale?: number;
}
export const WORLDTCCHI_CONFIG: CharacterConfig = Object.freeze({
  id: 'worldtchi', label: 'ワールドっち', glbPath: `${import.meta.env.BASE_URL}models/worldtchi.glb`,
  targetHeight: 1.6, groundOffset: 0.78, materialMode: 'toon', controller: 'floating',
  hitRadius: 0.92, hitCenterY: 0.8,
});

const base = `${import.meta.env.BASE_URL}models/sages/`;
const clips = (idle: string, walk: string, happy: string, ok: string, lookAround: string, angry: string, sad: string, cry: string, fear?: string): Partial<Record<SemanticAnimation, string>> =>
  ({ idle, walk, happy, ok, lookAround, angry, sad, cry, ...(fear ? { fear } : {}) });
const sage = (id: string, label: string, file: string, animationMap: Partial<Record<SemanticAnimation, string>>, moveSpeedScale = 1): CharacterConfig => ({
  id, label, glbPath: `${base}${file}`, targetHeight: 2.45, groundOffset: 0,
  materialMode: 'toon', controller: 'walking', hitRadius: 1.05, hitCenterY: 1.2,
  animationMap, moveSpeedScale,
});

export const SAGE_CHARACTER_CONFIGS = Object.freeze([
  sage('maria-theresa', 'マリア・テレサ', 'maria-theresa.glb', clips('NlaTrack', 'NlaTrack.005', 'NlaTrack.002', 'NlaTrack.001', 'NlaTrack.008', 'NlaTrack.007', 'NlaTrack.011', 'NlaTrack.004')),
  sage('caim', 'カイム', 'caim.glb', clips('NlaTrack.008', 'NlaTrack.007', 'NlaTrack.001', 'NlaTrack.005', 'NlaTrack.003', 'NlaTrack.002', 'NlaTrack.009', 'NlaTrack.006')),
  sage('lobelia', 'ロベリア', 'lobelia.glb', clips('NlaTrack.009', 'NlaTrack', 'NlaTrack.003', 'NlaTrack.004', 'NlaTrack.002', 'NlaTrack.007', 'NlaTrack.010', 'NlaTrack.001')),
  sage('alanaan', 'アラナン', 'alanaan.glb', clips('NlaTrack.004', 'NlaTrack.009', 'NlaTrack.011', 'NlaTrack.008', 'NlaTrack.005', 'NlaTrack.002', 'NlaTrack', 'NlaTrack.001')),
  sage('haaselia', 'ハーゼリーラ', 'haaselia.glb', clips('NlaTrack', 'NlaTrack.002', 'NlaTrack.004', 'NlaTrack.007', 'NlaTrack.003', 'NlaTrack.009', 'NlaTrack.010', 'NlaTrack.011')),
  sage('borghan', 'ボーガン', 'borghan.glb', clips('NlaTrack', 'NlaTrack.010', 'NlaTrack.012', 'NlaTrack.003', 'NlaTrack.008', 'NlaTrack.001', 'NlaTrack.009', 'NlaTrack.002')),
  sage('catzelia', 'カッツェリーラ', 'catzelia.glb', clips('NlaTrack.002', 'NlaTrack.006', 'NlaTrack.004', 'NlaTrack.005', 'NlaTrack.008', 'NlaTrack.001', 'NlaTrack.007', 'NlaTrack')),
  sage('fraux', 'フラウ', 'fraux.glb', clips('NlaTrack.007', 'NlaTrack.001', 'NlaTrack.002', 'NlaTrack.003', 'NlaTrack.004', 'NlaTrack.005', 'NlaTrack.006', 'NlaTrack.008', 'NlaTrack')),
  sage('nier', 'ニーア', 'nier.glb', clips('NlaTrack.006', 'NlaTrack.005', 'NlaTrack.007', 'NlaTrack.004', 'NlaTrack.003', 'NlaTrack.002', 'NlaTrack.008', 'NlaTrack.001')),
  sage('estarriola', 'エスタリオラ', 'estarriola.glb', clips('NlaTrack.010', 'NlaTrack.003', 'NlaTrack', 'NlaTrack.002', 'NlaTrack.008', 'NlaTrack.005', 'NlaTrack.004', 'NlaTrack.009'), .9),
] as const);
export type SageCharacterId = typeof SAGE_CHARACTER_CONFIGS[number]['id'];
export const CHARACTER_CONFIGS = Object.freeze([WORLDTCCHI_CONFIG, ...SAGE_CHARACTER_CONFIGS]);
