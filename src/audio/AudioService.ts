export type SoundEffect = 'tap' | 'pet' | 'request' | 'happy' | 'angry' | 'sick' | 'recover' | 'evolution' | 'egg' | 'ui';

const sounds: Record<SoundEffect, readonly [number, number, OscillatorType, number]> = {
  tap: [420, 560, 'sine', .09], pet: [520, 760, 'sine', .16], request: [650, 880, 'triangle', .18],
  happy: [660, 990, 'sine', .22], angry: [180, 110, 'sawtooth', .16], sick: [240, 175, 'triangle', .3],
  recover: [440, 880, 'sine', .32], evolution: [330, 1040, 'triangle', .55], egg: [510, 720, 'sine', .28], ui: [360, 430, 'sine', .06],
};

export class AudioService {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmNodes: OscillatorNode[] = [];
  private unlocked = false;

  constructor(private bgmEnabled: boolean, private seEnabled: boolean) {
    document.addEventListener('pointerdown', this.unlock, { capture: true, once: true });
    document.addEventListener('keydown', this.unlock, { capture: true, once: true });
  }

  setBgmEnabled(enabled: boolean): void { this.bgmEnabled = enabled; if (enabled) this.startBgm(); else this.stopBgm(); }
  setSeEnabled(enabled: boolean): void { this.seEnabled = enabled; }

  play(name: SoundEffect): void {
    if (!this.seEnabled || !this.context || !this.master || this.context.state !== 'running') return;
    const [from, to, type, duration] = sounds[name], now = this.context.currentTime;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(name === 'angry' ? .055 : .085, now + .018); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.master); oscillator.start(now); oscillator.stop(now + duration + .02);
  }

  pause(): void { if (this.context?.state === 'running') void this.context.suspend(); }
  resume(): void { if (this.unlocked && this.context?.state === 'suspended') void this.context.resume().then(() => this.startBgm()); }

  dispose(): void {
    document.removeEventListener('pointerdown', this.unlock, true);
    document.removeEventListener('keydown', this.unlock, true);
    this.stopBgm();
    if (this.context) void this.context.close();
    this.context = null; this.master = null; this.bgmGain = null;
  }

  private unlock = (): void => {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain(); this.master.gain.value = .65; this.master.connect(this.context.destination);
    }
    this.unlocked = true;
    void this.context.resume().then(() => this.startBgm());
  };

  private startBgm(): void {
    if (!this.bgmEnabled || !this.context || !this.master || this.context.state !== 'running' || this.bgmNodes.length) return;
    this.bgmGain = this.context.createGain(); this.bgmGain.gain.value = .018; this.bgmGain.connect(this.master);
    for (const [frequency, detune] of [[174.61, -4], [261.63, 5]] as const) {
      const oscillator = this.context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = detune;
      oscillator.connect(this.bgmGain); oscillator.start(); this.bgmNodes.push(oscillator);
    }
  }

  private stopBgm(): void {
    this.bgmNodes.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } node.disconnect(); });
    this.bgmNodes.length = 0; this.bgmGain?.disconnect(); this.bgmGain = null;
  }
}
