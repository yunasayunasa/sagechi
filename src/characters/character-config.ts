export interface CharacterConfig {
  id: string; label: string; glbPath: string; targetHeight: number;
  groundOffset: number; materialMode: 'toon' | 'original'; controller: 'floating' | 'walking';
  hitRadius: number; hitCenterY: number;
}
export const WORLDTCCHI_CONFIG: CharacterConfig = Object.freeze({
  id: 'worldtchi', label: 'ワールドっち', glbPath: `${import.meta.env.BASE_URL}models/worldtchi.glb`,
  targetHeight: 1.6, groundOffset: 0.78, materialMode: 'toon', controller: 'floating',
  hitRadius: 0.92, hitCenterY: 0.8,
});
