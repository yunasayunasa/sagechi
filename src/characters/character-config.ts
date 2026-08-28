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
  sage('maria-theresa', 'マリア・テレサっち', 'maria-theresa.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'sad', 'cry', 'fear')),
  sage('caim', 'カイムっち', 'caim.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'sad', 'cry', 'fear')),
  sage('lobelia', 'ロベリアっち', 'lobelia.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'cry', 'cry', 'fear')),
  sage('alanaan', 'アラナンっち', 'alanaan.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'cry', 'cry', 'fear')),
  sage('haaselia', 'ハーゼリーラっち', 'haaselia.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'sad', 'cry', 'fear')),
  sage('borghan', 'ボーガっち', 'borghan.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'sad', 'cry', 'fear')),
  sage('catzelia', 'カッツェリーラっち', 'catzelia.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'cry', 'cry', 'fear')),
  sage('fraux', 'フラウっち', 'fraux.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'cry', 'cry', 'fear')),
  sage('nier', 'ニーアっち', 'nier.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'sad', 'cry', 'fear')),
  sage('estarriola', 'エスタリオラっち', 'estarriola.glb', clips('idle', 'walk', 'happy', 'ok', 'lookAround', 'angry', 'cry', 'cry', 'fear'), .9),
] as const);
export type SageCharacterId = typeof SAGE_CHARACTER_CONFIGS[number]['id'];
export const CHARACTER_CONFIGS = Object.freeze([WORLDTCCHI_CONFIG, ...SAGE_CHARACTER_CONFIGS]);
