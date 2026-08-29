import { DEFAULT_HISTORY, DEFAULT_STATUS } from '../care/care-types';
import type { GameConfig } from '../config/game-config';
import type { GameSaveV9 } from '../save/SaveService';
import { isEggReady } from './generation-rules';

export class GenerationSystem {
  constructor(private readonly save: GameSaveV9, private readonly config: GameConfig, private readonly persist: () => void, private readonly onEggAvailable: () => void) {}

  update(dt: number): void {
    if (this.save.evolutionStage !== 3 || this.save.eggAvailable) return;
    this.save.adultActiveSeconds += dt;
    this.checkEgg();
  }

  recordCare(): void {
    if (this.save.evolutionStage !== 3 || this.save.eggAvailable) return;
    this.save.adultCareCount += 1;
    this.checkEgg();
  }

  resetAdultProgress(preserveEgg = false): void {
    this.save.adultActiveSeconds = 0;
    this.save.adultCareCount = 0;
    if (!preserveEgg) this.save.eggAvailable = false;
    this.persist();
  }

  beginNextGeneration(): void {
    this.save.generation += 1;
    this.save.currentCharacter = 'worldtchi';
    this.save.evolutionStage = 1;
    this.save.status = structuredClone(DEFAULT_STATUS);
    this.save.history = structuredClone(DEFAULT_HISTORY);
    this.save.careCount = 0;
    this.save.stageActiveSeconds = 0;
    this.save.stageCareCount = 0;
    this.save.adultActiveSeconds = 0;
    this.save.adultCareCount = 0;
    this.save.eggAvailable = false;
    this.save.pendingRequest = null;
    this.save.illnessActive = false;
    this.save.illnessStep = null;
    this.persist();
  }

  private checkEgg(): void {
    if (!isEggReady(this.save.adultActiveSeconds, this.save.adultCareCount, this.config.generation)) return;
    this.save.eggAvailable = true;
    this.persist();
    this.onEggAvailable();
  }
}
