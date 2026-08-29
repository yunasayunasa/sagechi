import type { BgmTrack } from '../save/SaveService';

export type SoundEffect = 'tap' | 'pet' | 'request' | 'happy' | 'angry' | 'sick' | 'recover' | 'evolution' | 'egg' | 'ui';

const sounds: Record<SoundEffect, readonly [number, number, OscillatorType, number]> = {
  tap: [420, 560, 'sine', .09], pet: [520, 760, 'sine', .16], request: [650, 880, 'triangle', .18],
  happy: [660, 990, 'sine', .22], angry: [180, 110, 'sawtooth', .16], sick: [240, 175, 'triangle', .3],
  recover: [440, 880, 'sine', .32], evolution: [330, 1040, 'triangle', .55], egg: [510, 720, 'sine', .28], ui: [360, 430, 'sine', .06],
};

export class AudioService {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly bgm = new Audio();
  private bgmSource: MediaElementAudioSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private unlocked = false;
  private pendingEffect: SoundEffect | null = null;

  constructor(
    private bgmEnabled: boolean,
    private seEnabled: boolean,
    private bgmTrack: BgmTrack,
    private bgmVolume: number,
    private seVolume: number,
    private readonly assetBase: string,
  ) {
    this.bgm.loop = true;
    this.bgm.preload = 'auto';
    this.bgm.volume = 1;
    this.updateBgmSource();
    document.addEventListener('pointerdown', this.unlock, { capture: true });
    document.addEventListener('keydown', this.unlock, { capture: true });
  }

  setBgmEnabled(enabled: boolean): void { this.bgmEnabled = enabled; if (enabled) this.startBgm(); else this.stopBgm(); }
  setSeEnabled(enabled: boolean): void { this.seEnabled = enabled; }
  setBgmTrack(track: BgmTrack): void { if (track === this.bgmTrack) return; this.bgmTrack = track; this.updateBgmSource(); if (this.bgmEnabled && this.unlocked) this.startBgm(); }
  setBgmVolume(volume: number): void { this.bgmVolume = Math.min(1, Math.max(0, volume)); this.applyBgmVolume(); }
  setSeVolume(volume: number): void { this.seVolume = Math.min(1, Math.max(0, volume)); }

  play(name: SoundEffect): void {
    if (!this.seEnabled) return;
    if (!this.context || !this.master || this.context.state !== 'running') {
      this.pendingEffect = name;
      this.unlock();
      return;
    }
    const [from, to, type, duration] = sounds[name], now = this.context.currentTime;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    const peak = (name === 'angry' ? .12 : .18) * this.seVolume;
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(.0001, peak), now + .018); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.master); oscillator.start(now); oscillator.stop(now + duration + .02);
    this.duckBgm(now, duration);
  }

  pause(): void { this.bgm.pause(); if (this.context?.state === 'running') void this.context.suspend(); }
  resume(): void { if (this.unlocked && this.context?.state === 'suspended') void this.context.resume().then(() => this.startBgm()); else if (this.unlocked) this.startBgm(); }

  dispose(): void {
    document.removeEventListener('pointerdown', this.unlock, true);
    document.removeEventListener('keydown', this.unlock, true);
    this.stopBgm();
    if (this.context) void this.context.close();
    this.bgm.removeAttribute('src'); this.bgm.load();
    this.bgmSource?.disconnect(); this.bgmGain?.disconnect();
    this.context = null; this.master = null; this.bgmSource = null; this.bgmGain = null;
  }

  private unlock = (): void => {
    if (!this.context) {
      const AudioContextClass = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
      this.master = this.context.createGain(); this.master.gain.value = .78; this.master.connect(this.context.destination);
      this.bgmGain = this.context.createGain(); this.applyBgmVolume(); this.bgmGain.connect(this.master);
      this.bgmSource = this.context.createMediaElementSource(this.bgm); this.bgmSource.connect(this.bgmGain);
    }
    this.unlocked = true;
    this.startBgm();
    void this.context.resume().then(() => {
      this.startBgm();
      const pending = this.pendingEffect;
      this.pendingEffect = null;
      if (pending) this.play(pending);
      if (this.context?.state === 'running') {
        document.removeEventListener('pointerdown', this.unlock, true);
        document.removeEventListener('keydown', this.unlock, true);
      }
    }).catch(() => {
      // The next user gesture retries unlocking when a browser rejects this attempt.
    });
  };

  private startBgm(): void {
    if (!this.bgmEnabled || !this.unlocked || !this.bgm.paused) return;
    void this.bgm.play().catch(() => { /* the next user gesture retries playback */ });
  }

  private stopBgm(): void { this.bgm.pause(); }
  private updateBgmSource(): void { this.bgm.src = `${this.assetBase}${this.bgmTrack}.mp3`; this.bgm.load(); }
  private bgmLevel(): number { return .28 * this.bgmVolume * this.bgmVolume; }
  private applyBgmVolume(): void {
    if (!this.bgmGain || !this.context) return;
    const now = this.context.currentTime;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmLevel(), now);
  }
  private duckBgm(now: number, effectDuration: number): void {
    if (!this.bgmGain || !this.bgmEnabled) return;
    const normal = this.bgmLevel();
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
    this.bgmGain.gain.linearRampToValueAtTime(normal * .12, now + .025);
    this.bgmGain.gain.setValueAtTime(normal * .12, now + effectDuration + .08);
    this.bgmGain.gain.linearRampToValueAtTime(normal, now + effectDuration + .3);
  }
}
