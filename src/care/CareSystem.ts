import * as THREE from 'three';
import type { GameConfig } from '../config/game-config';
import type { GameSaveV5 } from '../save/SaveService';
import type { FoodChoice, PlayChoice, RequestType } from './care-types';

export type CareEvent = { kind: 'status' } | { kind: 'request'; request: RequestType | null } | { kind: 'reaction'; tone: 'happy' | 'calm' | 'delayed'; message: string; visualHandled?: boolean };

const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 100);
const random = (min: number, max: number) => THREE.MathUtils.randFloat(min, max);

export class CareSystem {
  request: RequestType | null = null;
  private requestClock = 0;
  private requestAt = 0;
  private saveClock = 0;
  private statusUiClock = 0;
  private readonly listeners = new Set<(event: CareEvent) => void>();

  constructor(readonly save: GameSaveV5, private readonly config: GameConfig, private readonly persist: () => void) {
    this.scheduleRequest();
  }

  subscribe(listener: (event: CareEvent) => void): () => void {
    this.listeners.add(listener);
    listener({ kind: 'status' });
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
    if (!this.request && this.requestClock >= this.requestAt) this.createRequest();
    if (this.saveClock >= this.config.care.saveIntervalSeconds) { this.saveClock = 0; this.persist(); }
    if (this.statusUiClock >= .25) { this.statusUiClock = 0; this.emit({ kind: 'status' }); }
  }

  feed(choice: FoodChoice): void {
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
    const effects = {
      ball: { boredom: -34, mood: 12, stress: -3, sleepiness: 4 },
      rattle: { boredom: -27, mood: 10, stress: -2 },
      book: { boredom: -22, mood: 8, stress: -6, sleepiness: 2 },
    }[choice];
    this.adjust(effects);
    if (choice === 'ball') { this.save.history.playBall += 1; this.save.history.active += 2; }
    if (choice === 'rattle') { this.save.history.playRattle += 1; this.save.history.active += 1; }
    if (choice === 'book') { this.save.history.playBook += 1; this.save.history.calm += 2; }
    this.completeCare('いっしょに遊んでうれしそう！', 'happy');
  }

  rest(): void {
    this.adjust({ sleepiness: -38, stress: -6, health: 4, mood: 3 });
    this.save.history.calm += 2;
    this.completeCare('ゆっくり休めたみたい。', 'calm');
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
    this.save.careCount += 1;
    this.request = null;
    this.scheduleRequest();
    this.persist();
    this.emit({ kind: 'request', request: null });
    this.emit({ kind: 'reaction', tone: 'delayed', message: 'わかった、あとでね。' });
  }

  private createRequest(): void {
    const status = this.save.status;
    const weighted: Array<[RequestType, number]> = [
      ['food', Math.max(8, status.hunger)], ['play', Math.max(8, status.boredom)],
      ['sleep', Math.max(5, status.sleepiness)], ['pet', Math.max(8, 100 - status.mood + status.stress)],
    ];
    const needy = Math.max(status.hunger, status.boredom, status.sleepiness, status.stress) >= this.config.care.requestNeedThreshold;
    const pool = needy ? weighted : weighted.map(([type, weight]) => [type, Math.sqrt(weight)] as [RequestType, number]);
    let pick = Math.random() * pool.reduce((sum, item) => sum + item[1], 0);
    this.request = pool.find((item) => (pick -= item[1]) <= 0)?.[0] ?? 'pet';
    this.emit({ kind: 'request', request: this.request });
  }

  private completeCare(message: string, tone: 'happy' | 'calm', visualHandled = false): void {
    this.save.history.careSuccess += 1;
    this.save.careCount += 1;
    this.request = null;
    this.scheduleRequest();
    this.persist();
    this.emit({ kind: 'request', request: null });
    this.emit({ kind: 'reaction', tone, message, visualHandled });
  }

  private adjust(values: Partial<Record<keyof GameSaveV5['status'], number>>): void {
    for (const key of Object.keys(values) as Array<keyof GameSaveV5['status']>) this.save.status[key] = clamp(this.save.status[key] + (values[key] ?? 0));
    this.emit({ kind: 'status' });
  }

  private scheduleRequest(): void {
    this.requestClock = 0;
    this.requestAt = random(this.config.care.requestMinSeconds, this.config.care.requestMaxSeconds);
  }

  private emit(event: CareEvent): void { this.listeners.forEach((listener) => listener(event)); }
}
