import { DEFAULT_HISTORY, DEFAULT_STATUS, type CareHistory, type CharacterStatus, type RequestType } from '../care/care-types';
import { SAGE_CHARACTER_CONFIGS, type SageCharacterId } from '../characters/character-config';
import type { StageId } from '../stages/stage-types';

interface GameSaveV1 { schemaVersion: 1; currentCharacter: string; evolutionStage: 1; map: 'phase2-garden'; settings: { debug: boolean } }
export interface GameSaveV2 { schemaVersion: 2; currentCharacter: string; evolutionStage: 1; map: 'phase2-garden'; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
export type WorldtchiForm = 'worldtchi' | 'white-worldtchi' | 'black-worldtchi';
export interface GameSaveV3 { schemaVersion: 3; currentCharacter: WorldtchiForm; evolutionStage: 1 | 2; map: 'phase2-garden'; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
export interface GameSaveV4 { schemaVersion: 4; currentCharacter: WorldtchiForm; evolutionStage: 1 | 2; map: 'summer-garden'; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
export interface GameSaveV5 { schemaVersion: 5; currentCharacter: WorldtchiForm; evolutionStage: 1 | 2; map: StageId; status: CharacterStatus; history: CareHistory; careCount: number; settings: { debug: boolean } }
export type CurrentCharacterId = WorldtchiForm | SageCharacterId;
export interface GameSaveV6 { schemaVersion: 6; currentCharacter: CurrentCharacterId; evolutionStage: 1 | 2 | 3; map: StageId; status: CharacterStatus; history: CareHistory; careCount: number; encyclopedia: SageCharacterId[]; settings: { debug: boolean } }
export interface GameSaveV7 { schemaVersion: 7; currentCharacter: CurrentCharacterId; evolutionStage: 1 | 2 | 3; map: StageId; status: CharacterStatus; history: CareHistory; careCount: number; encyclopedia: SageCharacterId[]; generation: number; adultActiveSeconds: number; adultCareCount: number; eggAvailable: boolean; pendingRequest: RequestType | null; settings: { debug: boolean } }
const DEFAULT_SAVE: GameSaveV7 = { schemaVersion: 7, currentCharacter: 'worldtchi', evolutionStage: 1, map: 'summer-garden', status: DEFAULT_STATUS, history: DEFAULT_HISTORY, careCount: 0, encyclopedia: [], generation: 0, adultActiveSeconds: 0, adultCareCount: 0, eggAvailable: false, pendingRequest: null, settings: { debug: false } };
const SAGE_IDS = new Set<string>(SAGE_CHARACTER_CONFIGS.map((config) => config.id));
export const isSageCharacterId = (value: string): value is SageCharacterId => SAGE_IDS.has(value);
export class SaveService {
  constructor(private readonly key: string) {}
  load(): GameSaveV7 {
    try { const raw = localStorage.getItem(this.key); if (!raw) return structuredClone(DEFAULT_SAVE); return this.migrate(JSON.parse(raw) as unknown); }
    catch { return structuredClone(DEFAULT_SAVE); }
  }
  save(value: GameSaveV7): void { try { localStorage.setItem(this.key, JSON.stringify(value)); } catch { /* private mode/quota: game remains playable */ } }
  private migrate(value: unknown): GameSaveV7 {
    if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SAVE);
    const data = value as Partial<GameSaveV7> & Partial<GameSaveV6> & Partial<GameSaveV5> & Partial<GameSaveV4> & Partial<GameSaveV3> & Partial<GameSaveV2> & Partial<GameSaveV1>;
    if (data.schemaVersion === 1) return { ...structuredClone(DEFAULT_SAVE), currentCharacter: data.currentCharacter ?? 'worldtchi', settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 2) return { ...structuredClone(DEFAULT_SAVE), status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, careCount: data.careCount ?? 0, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 3) return { ...structuredClone(DEFAULT_SAVE), currentCharacter: data.currentCharacter ?? 'worldtchi', evolutionStage: data.evolutionStage ?? 1, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, careCount: data.careCount ?? 0, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 4) return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 7, map: 'summer-garden', encyclopedia: [], status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV7;
    if (data.schemaVersion === 5 || data.schemaVersion === 6) return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 7, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV7;
    if (data.schemaVersion !== 7) return structuredClone(DEFAULT_SAVE);
    const map: StageId = data.map === 'kids-room' || data.map === 'japanese-room' ? data.map : 'summer-garden';
    const currentCharacter = typeof data.currentCharacter === 'string' && (isSageCharacterId(data.currentCharacter) || data.currentCharacter === 'worldtchi' || data.currentCharacter === 'white-worldtchi' || data.currentCharacter === 'black-worldtchi') ? data.currentCharacter : 'worldtchi';
    const encyclopedia = [...new Set((data.encyclopedia ?? []).filter((id): id is SageCharacterId => typeof id === 'string' && isSageCharacterId(id)))];
    if (isSageCharacterId(currentCharacter) && !encyclopedia.includes(currentCharacter)) encyclopedia.push(currentCharacter);
    const pendingRequest: RequestType | null = data.pendingRequest === 'food' || data.pendingRequest === 'play' || data.pendingRequest === 'sleep' || data.pendingRequest === 'pet' || data.pendingRequest === 'tart' ? data.pendingRequest : null;
    return { ...structuredClone(DEFAULT_SAVE), ...data, currentCharacter, map, encyclopedia, generation: Math.max(0, Math.floor(data.generation ?? 0)), adultActiveSeconds: Math.max(0, data.adultActiveSeconds ?? 0), adultCareCount: Math.max(0, Math.floor(data.adultCareCount ?? 0)), eggAvailable: Boolean(data.eggAvailable), pendingRequest, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV7;
  }
}
