import * as THREE from 'three';
import type { GameConfig } from '../config/game-config';
import type { GameSaveV11 } from '../save/SaveService';
import type { CareRequestChoice, FoodChoice, PlayChoice, RequestType } from './care-types';
import { shouldCreateTartRequest } from './care-rules';
import { chooseRequestChoice, isExpectedChoice } from './care-request-rules';
import { chooseIllnessStep, shouldStartIllness } from './illness-rules';

export type CareEvent = { kind: 'status' } | { kind: 'request'; request: RequestType | null } | { kind: 'reaction'; tone: 'happy' | 'calm' | 'delayed' | 'angry'; message: string; visualHandled?: boolean } | { kind: 'illness'; active: boolean } | { kind: 'care-complete' } | { kind: 'rare-evolution' };

const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 100);
const random = (min: number, max: number) => THREE.MathUtils.randFloat(min, max);

export class CareSystem {
  request: RequestType | null;
  requestChoice: CareRequestChoice | null;
  private requestClock = 0;
  private requestAt = 0;
  private saveClock = 0;
  private statusUiClock = 0;
  private illnessClock = 0;
  private readonly listeners = new Set<(event: CareEvent) => void>();

  constructor(readonly save: GameSaveV11, private readonly config: GameConfig, private readonly persist: () => void, private readonly rng: () => number = Math.random) {
    this.request = save.illnessActive && save.illnessStep ? `sick-${save.illnessStep}` : save.pendingRequest;
    this.requestChoice = save.pendingRequestChoice;
    this.scheduleRequest();
  }

  subscribe(listener: (event: CareEvent) => void): () => void {
    this.listeners.add(listener);
    listener({ kind: 'status' });
    listener({ kind: 'request', request: this.request });
    listener({ kind: 'illness', active: this.save.illnessActive });
    return () => this.listeners.delete(listener);
  }

  update(dt: number): void {
    const rates = this.config.care.statusPerMinute;
    const perMinute = dt / 60;
    this.save.status.hunger = clamp(this.save.status.hunger + rates.hunger * perMinute);
    this.save.status.sleepiness = clamp(this.save.status.sleepiness + rates.sleepiness * perMinute);
    this.save.status.boredom = clamp(this.save.status.boredom + rates.boredom * perMinute);
    this.save.status.mood = clamp(this.save.status.mood + rates.mood * perMinute);
    this.save.status.stress = clamp(this.save.status.stress + rates.stress * perMinute);
    this.save.status.health = clamp(this.save.status.health + rates.health * perMinute);
    this.requestClock += dt;
    this.saveClock += dt;
    this.statusUiClock += dt;
    this.illnessClock += dt;
    if (!this.request && this.requestClock >= this.requestAt) this.createRequest();
    if (!this.request && !this.save.illnessActive && this.illnessClock >= this.config.illness.checkIntervalSeconds) {
      this.illnessClock = 0;
      if (shouldStartIllness({ careCount: this.save.careCount, careDelay: this.save.history.careDelay, status: this.save.status }, this.config.illness, this.rng())) this.startIllness();
    }
    if (this.saveClock >= this.config.care.saveIntervalSeconds) { this.saveClock = 0; this.persist(); }
    if (this.statusUiClock >= .25) { this.statusUiClock = 0; this.emit({ kind: 'status' }); }
  }

  feed(choice: FoodChoice): void {
    if (this.request === 'sick-meal') {
      if (choice !== 'vegetable') {
        this.rejectChoice('体調が悪いのに、それは食べたくないみたい！');
        return;
      }
      this.adjust({ hunger: -27, health: 5, stress: -4 });
      this.save.history.healthy += 2;
      this.save.history.calm += 1;
      this.completeIllnessStep();
      return;
    }
    if (choice === 'tart') {
      if (this.request !== 'tart') return;
      this.adjust({ hunger: -36, mood: 16, stress: -4 });
      this.save.history.sweet += 2;
      this.completeCare('タルトをとても嬉しそうに食べた！', 'happy');
      this.emit({ kind: 'rare-evolution' });
      return;
    }
    if (this.request === 'food' && !isExpectedChoice(this.requestChoice, choice)) { this.rejectChoice('それじゃないみたい。ほしいものを選んであげよう。'); return; }
    const effects = {
      vegetable: { hunger: -27, mood: 5, stress: -2 },
      sweet: { hunger: -22, mood: 13, stress: -1 },
      meat: { hunger: -34, mood: 7, stress: -2 },
    }[choice];
    this.adjust(effects);
    if (choice === 'vegetable') { this.save.history.healthy += 2; this.save.history.calm += 1; }
    if (choice === 'sweet') this.save.history.sweet += 2;
    if (choice === 'meat') { this.save.history.meat += 2; this.save.history.active += 1; }
    this.completeCare('おいしそうに食べた！', 'happy');
  }

  play(choice: PlayChoice): void {
    if (this.request === 'play' && !isExpectedChoice(this.requestChoice, choice)) { this.rejectChoice('今はその遊びじゃないみたい。'); return; }
    const effects = {
      ball: { boredom: -34, mood: 12, stress: -3, sleepiness: 4 },
      rattle: { boredom: -27, mood: 10, stress: -2 },
      book: { boredom: -22, mood: 8, stress: -6, sleepiness: 2 },
    }[choice];
    this.adjust(effects);
    if (choice === 'ball') { this.save.history.playBall += 1; this.save.history.active += 2; }
    if (choice === 'rattle') { this.save.history.playRattle += 1; this.save.history.calm += 1; }
    if (choice === 'book') { this.save.history.playBook += 1; this.save.history.calm += 2; }
    this.completeCare('いっしょに遊んでうれしそう！', 'happy');
  }

  rest(): void {
    if (this.request && this.request !== 'sleep' && this.request !== 'sick-rest') { this.rejectChoice('今は眠りたいわけじゃないみたい。'); return; }
    this.adjust({ sleepiness: -38, stress: -6, health: 4, mood: 3 });
    this.save.history.calm += 2;
    if (this.request === 'sick-rest') { this.completeIllnessStep(); return; }
    this.completeCare('ゆっくり休めたみたい。', 'calm');
  }

  warm(): void {
    if (this.request !== 'sick-warm') return;
    this.adjust({ stress: -5, health: 3, mood: 2 });
    this.save.history.calm += 1;
    this.completeIllnessStep();
  }

  cool(): void {
    if (this.request !== 'sick-warm') return;
    this.rejectChoice('寒いのに冷たくされて怒っている！');
  }

  wake(): void {
    if (this.request !== 'sleep' && this.request !== 'sick-rest') return;
    this.rejectChoice('眠いのに起こされて怒っている！');
  }

  pet(): void {
    this.adjust({ mood: 7, stress: -5, boredom: -3 });
    this.save.history.affection += 1;
    this.save.history.calm += 1;
    if (this.request === 'pet') this.completeCare('撫でてもらえてごきげん！', 'happy', true);
    else { this.persist(); this.emit({ kind: 'reaction', tone: 'happy', message: '嬉しそうにしている。', visualHandled: true }); }
  }

  delay(): void {
    if (!this.request) return;
    this.adjust({ stress: 6, mood: -3 });
    this.save.history.active += 1;
    this.save.history.stress += 1;
    this.save.history.careDelay += 1;
    if (this.save.illnessActive) {
      this.dismissRequest();
      this.emit({ kind: 'reaction', tone: 'delayed', message: 'まだつらそう。あとで看病してあげよう。' });
      return;
    }
    this.save.careCount += 1;
    this.dismissRequest();
    this.emit({ kind: 'care-complete' });
    this.emit({ kind: 'reaction', tone: 'delayed', message: 'わかった、あとでね。' });
  }

  deferIllnessRequest(): void {
    if (!this.request?.startsWith('sick-')) return;
    this.dismissRequest();
  }

  private createRequest(): void {
    if (this.save.illnessActive && this.save.illnessStep) {
      this.save.illnessStep = chooseIllnessStep(this.rng(), this.save.illnessStep);
      this.request = `sick-${this.save.illnessStep}`;
      this.save.pendingRequest = this.request;
      this.setRequestChoice(this.choiceForRequest(this.request));
      this.persist();
      this.emit({ kind: 'request', request: this.request });
      return;
    }
    const status = this.save.status;
    const weighted: Array<[RequestType, number]> = [
      ['food', Math.max(8, status.hunger)], ['play', Math.max(8, status.boredom)],
      ['sleep', Math.max(5, status.sleepiness)], ['pet', Math.max(8, 100 - status.mood + status.stress)],
    ];
    const needy = Math.max(status.hunger, status.boredom, status.sleepiness, status.stress) >= this.config.care.requestNeedThreshold;
    const pool = needy ? weighted : weighted.map(([type, weight]) => [type, Math.sqrt(weight)] as [RequestType, number]);
    let pick = this.rng() * pool.reduce((sum, item) => sum + item[1], 0);
    this.request = pool.find((item) => (pick -= item[1]) <= 0)?.[0] ?? 'pet';
    if (shouldCreateTartRequest(this.save, this.request, this.config.generation.rareTartChance, this.rng())) this.request = 'tart';
    this.save.pendingRequest = this.request;
    this.setRequestChoice(this.choiceForRequest(this.request));
    this.persist();
    this.emit({ kind: 'request', request: this.request });
  }

  private completeCare(message: string, tone: 'happy' | 'calm', visualHandled = false): void {
    this.save.history.careSuccess += 1;
    this.save.careCount += 1;
    this.request = null;
    this.save.pendingRequest = null;
    this.requestChoice = null;
    this.save.pendingRequestChoice = null;
    this.scheduleRequest();
    this.persist();
    this.emit({ kind: 'request', request: null });
    this.emit({ kind: 'care-complete' });
    this.emit({ kind: 'reaction', tone, message, visualHandled });
  }

  forceTartRequest(): void {
    if (this.save.illnessActive) return;
    this.request = 'tart';
    this.save.pendingRequest = 'tart';
    this.setRequestChoice('tart');
    this.persist();
    this.emit({ kind: 'request', request: 'tart' });
  }

  forceIllness(): void { if (!this.save.illnessActive) this.startIllness(); }

  resetForGeneration(): void {
    this.request = null;
    this.save.pendingRequest = null;
    this.requestChoice = null;
    this.save.pendingRequestChoice = null;
    this.save.illnessActive = false;
    this.save.illnessStep = null;
    this.save.illnessCareCount = 0;
    this.illnessClock = 0;
    this.scheduleRequest();
    this.persist();
    this.emit({ kind: 'status' });
    this.emit({ kind: 'request', request: null });
  }

  private adjust(values: Partial<Record<keyof GameSaveV11['status'], number>>): void {
    for (const key of Object.keys(values) as Array<keyof GameSaveV11['status']>) this.save.status[key] = clamp(this.save.status[key] + (values[key] ?? 0));
    this.emit({ kind: 'status' });
  }

  private startIllness(): void {
    this.save.illnessActive = true;
    this.save.illnessCareCount = 0;
    this.save.illnessStep = chooseIllnessStep(this.rng());
    this.save.history.sickCount += 1;
    this.request = `sick-${this.save.illnessStep}`;
    this.save.pendingRequest = this.request;
    this.setRequestChoice(this.choiceForRequest(this.request));
    this.adjust({ health: -12, mood: -6, stress: 5 });
    this.persist();
    this.emit({ kind: 'request', request: this.request });
    this.emit({ kind: 'illness', active: true });
    this.emit({ kind: 'reaction', tone: 'calm', message: 'なんだか体調が悪そう……。', visualHandled: true });
  }

  private completeIllnessStep(): void {
    this.save.history.careSuccess += 1;
    this.save.careCount += 1;
    this.emit({ kind: 'care-complete' });
    this.save.illnessCareCount += 1;
    if (this.save.illnessCareCount < 3) {
      this.save.illnessStep = chooseIllnessStep(this.rng(), this.save.illnessStep);
      this.request = `sick-${this.save.illnessStep}`;
      this.setRequestChoice(this.choiceForRequest(this.request));
      this.emit({ kind: 'reaction', tone: 'calm', message: '少し楽になったみたい。もう少し看病してあげよう。', visualHandled: true });
    } else {
      this.save.illnessActive = false;
      this.save.illnessStep = null;
      this.save.illnessCareCount = 0;
      this.request = null;
      this.requestChoice = null;
      this.illnessClock = 0;
      this.adjust({ health: 18, stress: -15, mood: 10 });
      this.emit({ kind: 'illness', active: false });
      this.emit({ kind: 'reaction', tone: 'happy', message: 'しっかり休めて、元気になった！' });
      this.scheduleRequest();
    }
    this.save.pendingRequest = this.request;
    this.save.pendingRequestChoice = this.requestChoice;
    this.persist();
    this.emit({ kind: 'request', request: this.request });
  }

  private scheduleRequest(): void {
    this.requestClock = 0;
    this.requestAt = random(this.config.care.requestMinSeconds, this.config.care.requestMaxSeconds);
  }

  private choiceForRequest(request: RequestType): CareRequestChoice | null {
    return chooseRequestChoice(request, this.rng());
  }

  private setRequestChoice(choice: CareRequestChoice | null): void {
    this.requestChoice = choice;
    this.save.pendingRequestChoice = choice;
  }

  private rejectChoice(message: string): void {
    this.adjust({ stress: 3, mood: -2 });
    this.dismissRequest();
    this.emit({ kind: 'reaction', tone: 'angry', message });
  }

  private dismissRequest(): void {
    this.request = null;
    this.save.pendingRequest = null;
    this.requestChoice = null;
    this.save.pendingRequestChoice = null;
    this.scheduleRequest();
    this.persist();
    this.emit({ kind: 'request', request: null });
  }

  private emit(event: CareEvent): void { this.listeners.forEach((listener) => listener(event)); }
}
