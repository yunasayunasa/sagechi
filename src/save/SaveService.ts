export interface GameSaveV1 { schemaVersion: 1; currentCharacter: string; evolutionStage: 1; map: 'phase2-garden'; settings: { debug: boolean } }
const DEFAULT_SAVE: GameSaveV1 = { schemaVersion: 1, currentCharacter: 'worldtchi', evolutionStage: 1, map: 'phase2-garden', settings: { debug: false } };
export class SaveService {
  constructor(private readonly key: string) {}
  load(): GameSaveV1 {
    try { const raw = localStorage.getItem(this.key); if (!raw) return structuredClone(DEFAULT_SAVE); return this.migrate(JSON.parse(raw) as unknown); }
    catch { return structuredClone(DEFAULT_SAVE); }
  }
  save(value: GameSaveV1): void { try { localStorage.setItem(this.key, JSON.stringify(value)); } catch { /* private mode/quota: game remains playable */ } }
  private migrate(value: unknown): GameSaveV1 {
    if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SAVE);
    const data = value as Partial<GameSaveV1>;
    if (data.schemaVersion !== 1) return structuredClone(DEFAULT_SAVE);
    return { ...structuredClone(DEFAULT_SAVE), ...data, settings: { ...DEFAULT_SAVE.settings, ...data.settings } } as GameSaveV1;
  }
}
