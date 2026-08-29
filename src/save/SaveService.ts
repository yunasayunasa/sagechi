import { DEFAULT_HISTORY, DEFAULT_STATUS, type CareHistory, type CareRequestChoice, type CharacterStatus, type IllnessStep, type RequestType } from '../care/care-types';
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
export interface GameSaveV8 extends Omit<GameSaveV7, 'schemaVersion'> { schemaVersion: 8; stageActiveSeconds: number; stageCareCount: number }
export interface GameSaveV9 extends Omit<GameSaveV8, 'schemaVersion'> { schemaVersion: 9; illnessActive: boolean; illnessStep: IllnessStep | null }
export interface GameSaveV10 extends Omit<GameSaveV9, 'schemaVersion'> { schemaVersion: 10; pendingRequestChoice: CareRequestChoice | null }
const DEFAULT_SAVE: GameSaveV10 = { schemaVersion: 10, currentCharacter: 'worldtchi', evolutionStage: 1, map: 'summer-garden', status: DEFAULT_STATUS, history: DEFAULT_HISTORY, careCount: 0, encyclopedia: [], generation: 0, stageActiveSeconds: 0, stageCareCount: 0, adultActiveSeconds: 0, adultCareCount: 0, eggAvailable: false, pendingRequest: null, pendingRequestChoice: null, illnessActive: false, illnessStep: null, settings: { debug: false } };
const SAGE_IDS = new Set<string>(SAGE_CHARACTER_CONFIGS.map((config) => config.id));
export const isSageCharacterId = (value: string): value is SageCharacterId => SAGE_IDS.has(value);
export class SaveService {
  constructor(private readonly key: string) {}
  load(): GameSaveV10 {
    try { const raw = localStorage.getItem(this.key); if (!raw) return structuredClone(DEFAULT_SAVE); return this.migrate(JSON.parse(raw) as unknown); }
    catch { return structuredClone(DEFAULT_SAVE); }
  }
  save(value: GameSaveV10): void { try { localStorage.setItem(this.key, JSON.stringify(value)); } catch { /* private mode/quota: game remains playable */ } }
  private migrate(value: unknown): GameSaveV10 {
    if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SAVE);
    const data = value as Partial<GameSaveV10> & Partial<GameSaveV9> & Partial<GameSaveV8> & Partial<GameSaveV7> & Partial<GameSaveV6> & Partial<GameSaveV5> & Partial<GameSaveV4> & Partial<GameSaveV3> & Partial<GameSaveV2> & Partial<GameSaveV1>;
    if (data.schemaVersion === 1) return { ...structuredClone(DEFAULT_SAVE), currentCharacter: data.currentCharacter ?? 'worldtchi', settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 2) return { ...structuredClone(DEFAULT_SAVE), status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, careCount: data.careCount ?? 0, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 3) return { ...structuredClone(DEFAULT_SAVE), currentCharacter: data.currentCharacter ?? 'worldtchi', evolutionStage: data.evolutionStage ?? 1, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, careCount: data.careCount ?? 0, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
    if (data.schemaVersion === 4) return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 10, map: 'summer-garden', encyclopedia: [], status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV10;
    if (data.schemaVersion === 5 || data.schemaVersion === 6 || data.schemaVersion === 7) return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 10, stageActiveSeconds: 0, stageCareCount: 0, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV10;
    if (data.schemaVersion === 8) return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 10, illnessActive: false, illnessStep: null, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV10;
    if (data.schemaVersion !== 9 && data.schemaVersion !== 10) return structuredClone(DEFAULT_SAVE);
    const map: StageId = data.map === 'kids-room' || data.map === 'japanese-room' ? data.map : 'summer-garden';
    const currentCharacter = typeof data.currentCharacter === 'string' && (isSageCharacterId(data.currentCharacter) || data.currentCharacter === 'worldtchi' || data.currentCharacter === 'white-worldtchi' || data.currentCharacter === 'black-worldtchi') ? data.currentCharacter : 'worldtchi';
    const encyclopedia = [...new Set((data.encyclopedia ?? []).filter((id): id is SageCharacterId => typeof id === 'string' && isSageCharacterId(id)))];
    if (isSageCharacterId(currentCharacter) && !encyclopedia.includes(currentCharacter)) encyclopedia.push(currentCharacter);
    const validRequests: readonly RequestType[] = ['food', 'play', 'sleep', 'pet', 'tart', 'sick-warm', 'sick-rest', 'sick-meal'];
    const pendingRequest = typeof data.pendingRequest === 'string' && validRequests.includes(data.pendingRequest as RequestType) ? data.pendingRequest as RequestType : null;
    const illnessStep: IllnessStep | null = data.illnessStep === 'warm' || data.illnessStep === 'rest' || data.illnessStep === 'meal' ? data.illnessStep : null;
    const illnessActive = Boolean(data.illnessActive && illnessStep);
    const request = illnessActive ? `sick-${illnessStep}` as RequestType : pendingRequest;
    const pendingRequestChoice = this.choiceForRequest(request, data.schemaVersion === 10 ? data.pendingRequestChoice : null);
    return { ...structuredClone(DEFAULT_SAVE), ...data, schemaVersion: 10, currentCharacter, map, encyclopedia, generation: Math.max(0, Math.floor(data.generation ?? 0)), stageActiveSeconds: Math.max(0, data.stageActiveSeconds ?? 0), stageCareCount: Math.max(0, Math.floor(data.stageCareCount ?? 0)), adultActiveSeconds: Math.max(0, data.adultActiveSeconds ?? 0), adultCareCount: Math.max(0, Math.floor(data.adultCareCount ?? 0)), eggAvailable: Boolean(data.eggAvailable), pendingRequest: request, pendingRequestChoice, illnessActive, illnessStep: illnessActive ? illnessStep : null, status: { ...DEFAULT_STATUS, ...data.status }, history: { ...DEFAULT_HISTORY, ...data.history }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV10;
  }
  private choiceForRequest(request: RequestType | null, choice: CareRequestChoice | null | undefined): CareRequestChoice | null {
    if (request === 'food') return choice === 'vegetable' || choice === 'sweet' || choice === 'meat' ? choice : 'vegetable';
    if (request === 'play') return choice === 'ball' || choice === 'rattle' || choice === 'book' ? choice : 'ball';
    if (request === 'sleep' || request === 'sick-rest') return 'rest';
    if (request === 'tart') return 'tart';
    if (request === 'sick-warm') return 'warm';
    if (request === 'sick-meal') return 'vegetable';
    return null;
  }
}
