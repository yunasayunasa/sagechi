import { DEFAULT_HISTORY, DEFAULT_STATUS, type CareHistory, type CharacterStatus } from '../care/care-types';

interface GameSaveV1 { schemaVersion: 1; currentCharacter: string; evolutionStage: 1; map: 'phase2-garden'; settings: { debug: boolean } }
export interface GameSaveV2 { schemaVersion: 2; currentCharacter: string; evolutionStage: 1; map: 'phase2-garden'; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
export type WorldtchiForm = 'worldtchi' | 'white-worldtchi' | 'black-worldtchi';
export interface GameSaveV3 { schemaVersion: 3; currentCharacter: WorldtchiForm; evolutionStage: 1 | 2; map: 'phase2-garden'; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
const DEFAULT_SAVE: GameSaveV3 = { schemaVersion: 3, currentCharacter: 'worldtchi', evolutionStage: 1, map: 'phase2-garden', status: DEFAULT_STATUS, history: DEFAULT_HISTORY, careCount: 0, settings: { debug: false } };
export class SaveService {
  constructor(private readonly key: string) {}
  load(): GameSaveV3 {
    try { const raw = localStorage.getItem(this.key); if (!raw) return structuredClone(DEFAULT_SAVE); return this.migrate(JSON.parse(raw) as unknown); }
    catch { return structuredClone(DEFAULT_SAVE); }
  }
  save(value: GameSaveV3): void { try { localStorage.setItem(this.key, JSON.stringify(value)); } catch { /* private mode/quota: game remains playable */ } }
  private migrate(value: unknown): GameSaveV3 {
    if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SAVE);
    const data = value as Partial<GameSaveV3> & Partial<GameSaveV2> & Partial<GameSaveV1>;
    if (data.schemaVersion === 1) return { ...structuredClone(DEFAULT_SAVE), currentCharacter: data.currentCharacter ?? 'worldtchi', settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 2) return { ...structuredClone(DEFAULT_SAVE), status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, careCount: data.careCount ?? 0, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion !== 3) return structuredClone(DEFAULT_SAVE);
    return { ...structuredClone(DEFAULT_SAVE), ...data, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV3;
  }
}
