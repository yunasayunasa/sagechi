import * as THREE from 'three';
import type { CharacterConfig, SageCharacterId } from '../characters/character-config';
import { CharacterLoader, type LoadedCharacter } from '../characters/CharacterLoader';
import type { GameSaveV9 } from '../save/SaveService';
import { ENCYCLOPEDIA_ENTRIES } from '../evolution/sage-evolution-config';

export class EncyclopediaUI {
  private readonly panel = document.querySelector<HTMLElement>('#encyclopedia-panel')!;
  private readonly list = document.querySelector<HTMLElement>('#encyclopedia-list')!;
  private readonly detail = document.querySelector<HTMLElement>('#encyclopedia-detail')!;
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#encyclopedia-canvas')!;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, .01, 20);
  private readonly loader = new CharacterLoader();
  private renderer: THREE.WebGLRenderer | null = null;
  private character: LoadedCharacter | null = null;
  private frame = 0;
  private lastTime = 0;
  private loadingToken = 0;

  constructor(private readonly save: GameSaveV9, private readonly configs: readonly CharacterConfig[], private readonly pixelRatioCap: number) {
    document.querySelector<HTMLButtonElement>('#encyclopedia-button')!.onclick = () => this.open();
    document.querySelector<HTMLButtonElement>('#encyclopedia-close')!.onclick = () => this.close();
    this.list.addEventListener('click', this.onListClick);
    this.scene.background = new THREE.Color(0xf5efcf);
    this.scene.add(new THREE.HemisphereLight(0xfff8df, 0x6e8066, 3));
    const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(3, 5, 4); this.scene.add(light);
    this.camera.position.set(0, 1.35, 5.2); this.camera.lookAt(0, 1.15, 0);
    this.refresh();
  }

  refresh(): void {
    const discovered = new Set(this.save.encyclopedia);
    document.querySelector<HTMLElement>('#encyclopedia-count')!.textContent = `${discovered.size}/11`;
    document.querySelector<HTMLElement>('#encyclopedia-count-header')!.textContent = `${discovered.size} / 11`;
    this.list.innerHTML = ENCYCLOPEDIA_ENTRIES.map((entry) => {
      const known = discovered.has(entry.id);
      const mark = entry.branch === 'rare' ? '★' : entry.branch === 'white' ? '✦' : '◆';
      return `<button type="button" data-character="${entry.id}" class="encyclopedia-entry ${known ? 'discovered' : 'unknown'} ${entry.branch === 'rare' ? 'rare-entry' : ''}"><span class="entry-mark">${known ? mark : '？'}</span><b>${known ? entry.name : '？？？'}</b><small>${known ? '3Dで見る' : entry.hint}</small></button>`;
    }).join('');
  }

  dispose(): void {
    this.close();
    this.list.removeEventListener('click', this.onListClick);
    this.renderer?.dispose();
  }

  private open(): void {
    document.querySelector<HTMLElement>('#care-panel')!.hidden = true;
    document.querySelector<HTMLElement>('#map-panel')!.hidden = true;
    this.refresh();
    this.panel.hidden = false;
    const firstKnown = ENCYCLOPEDIA_ENTRIES.find((entry) => this.save.encyclopedia.includes(entry.id));
    this.showEntry(firstKnown?.id ?? ENCYCLOPEDIA_ENTRIES[0].id);
  }

  private close(): void {
    this.panel.hidden = true;
    cancelAnimationFrame(this.frame);
    this.loadingToken += 1;
    this.disposeCharacter();
  }

  private onListClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-character]');
    if (button?.dataset.character) this.showEntry(button.dataset.character as SageCharacterId);
  };

  private showEntry(id: SageCharacterId): void {
    const entry = ENCYCLOPEDIA_ENTRIES.find((item) => item.id === id);
    if (!entry) return;
    const known = this.save.encyclopedia.includes(id);
    this.detail.querySelector<HTMLElement>('h3')!.textContent = known ? entry.name : '？？？';
    this.detail.querySelector<HTMLElement>('.encyclopedia-description')!.textContent = known ? entry.description : 'まだ出会っていない賢者っち。';
    this.detail.querySelector<HTMLElement>('.encyclopedia-hint')!.textContent = `ヒント：${entry.hint}`;
    this.canvas.hidden = !known;
    this.detail.querySelector<HTMLElement>('.unknown-silhouette')!.hidden = known;
    this.list.querySelectorAll('[data-character]').forEach((item) => item.classList.toggle('selected', (item as HTMLElement).dataset.character === id));
    this.loadingToken += 1;
    this.disposeCharacter();
    if (known) void this.loadPreview(id);
  }

  private async loadPreview(id: SageCharacterId): Promise<void> {
    const token = ++this.loadingToken;
    const config = this.configs.find((item) => item.id === id);
    if (!config) return;
    this.detail.classList.add('loading');
    try {
      const loaded = await this.loader.load(config);
      if (token !== this.loadingToken || this.panel.hidden) { this.loader.dispose(loaded); return; }
      this.character = loaded;
      this.scene.add(loaded.root);
      loaded.root.position.y = 0;
      loaded.mixer.clipAction(loaded.clips.get('idle')!).play();
      this.ensureRenderer();
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.render);
    } catch {
      if (token === this.loadingToken) this.detail.querySelector<HTMLElement>('.encyclopedia-description')!.textContent = '3Dモデルを読み込めませんでした。もう一度開いてください。';
    } finally {
      if (token === this.loadingToken) this.detail.classList.remove('loading');
    }
  }

  private ensureRenderer(): void {
    this.renderer ??= new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    const width = this.canvas.clientWidth || 280, height = this.canvas.clientHeight || 230;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.pixelRatioCap));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private render = (time: number): void => {
    if (this.panel.hidden || !this.renderer || !this.character) return;
    const dt = Math.min((time - this.lastTime) / 1000, .05); this.lastTime = time;
    this.character.mixer.update(dt);
    this.character.root.rotation.y += dt * .28;
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };

  private disposeCharacter(): void {
    cancelAnimationFrame(this.frame);
    if (this.character) this.loader.dispose(this.character);
    this.character = null;
  }
}
