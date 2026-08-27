import * as THREE from 'three';
import { FollowCamera } from '../camera/FollowCamera';
import { CareSystem } from '../care/CareSystem';
import { CareUI } from '../care/CareUI';
import { CharacterLoader, type LoadedCharacter } from '../characters/CharacterLoader';
import { WORLDTCCHI_CONFIG } from '../characters/character-config';
import { FloatingCharacterController } from '../characters/FloatingCharacterController';
import { GAME_CONFIG } from '../config/game-config';
import { DebugHud } from '../debug/DebugHud';
import { EffectSystem } from '../effects/EffectSystem';
import { EvolutionSystem } from '../evolution/EvolutionSystem';
import { InputController } from '../input/InputController';
import { SaveService } from '../save/SaveService';
import { StageAssetManager } from '../stages/StageAssetManager';
import { StageLoader } from '../stages/StageLoader';
import { STAGES } from '../stages/stage-registry';
import type { LoadedStage, StageId } from '../stages/stage-types';

export class Game {
  private readonly config = GAME_CONFIG;
  private readonly scene = new THREE.Scene();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly loader = new CharacterLoader();
  private readonly effects: EffectSystem;
  private readonly saveService = new SaveService(GAME_CONFIG.save.key);
  private readonly save = this.saveService.load();
  private readonly care = new CareSystem(this.save, GAME_CONFIG, () => this.saveService.save(this.save));
  private readonly stageAssets = new StageAssetManager();
  private readonly stageLoader = new StageLoader(this.stageAssets);
  private stage: LoadedStage | null = null;
  private character: LoadedCharacter | null = null;
  private floating: FloatingCharacterController | null = null;
  private followCamera: FollowCamera | null = null;
  private input: InputController | null = null;
  private careUi: CareUI | null = null;
  private evolution: EvolutionSystem | null = null;
  private unsubscribeCareReaction: (() => void) | null = null;
  private debug: DebugHud | null = null;
  private frame = 0;
  private running = false;
  private visible = !document.hidden;
  private areaHelper: THREE.LineLoop | null = null;
  private targetHelper: THREE.Mesh | null = null;
  private switchingStage = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.config.renderer.antialias, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(this.config.renderer.clearColor);
    this.camera = new THREE.PerspectiveCamera(this.config.camera.fov, 1, this.config.camera.near, this.config.camera.far);
    this.camera.position.set(...this.config.camera.overviewOffset);
    this.effects = new EffectSystem(this.scene);
    this.setupEnvironment();
    this.resize();
    this.renderer.render(this.scene, this.camera);
  }

  async start(): Promise<void> {
    const initialStage = STAGES[this.save.map];
    this.stage = await this.stageLoader.load(initialStage);
    this.scene.background = new THREE.Color(initialStage.background);
    this.scene.fog = new THREE.Fog(initialStage.fog.color, initialStage.fog.near, initialStage.fog.far);
    this.scene.add(this.stage.root);
    const loaded = await this.loader.load(WORLDTCCHI_CONFIG);
    this.character = loaded;
    loaded.root.position.y = this.config.floating.baseAltitude;
    this.scene.add(loaded.root);
    this.floating = new FloatingCharacterController(loaded, this.config, this.effects, this.stage.obstacles);
    this.evolution = new EvolutionSystem(this.save, loaded, this.config, () => this.saveService.save(this.save), this.showEvolutionStart, this.showEvolutionComplete);
    document.querySelector<HTMLElement>('#character-name')!.textContent = this.evolution.getCurrentName();
    this.followCamera = new FollowCamera(this.camera, loaded.root, this.config);
    this.input = new InputController(this.canvas, this.camera, loaded.hitArea, this.floating, this.followCamera, this.config, () => this.care.pet());
    this.careUi = new CareUI(this.care);
    this.unsubscribeCareReaction = this.care.subscribe((event) => { if (event.kind === 'reaction' && event.tone === 'happy') this.floating?.pet(); else if (event.kind === 'reaction' && event.tone === 'calm') this.floating?.tap(this.camera.position); });
    this.debug = new DebugHud(document.querySelector('#debug-hud')!, document.querySelector('#debug-controls')!, this.renderer, this.floating, this.input);
    this.bindUi();
    this.running = true;
    this.clock.start();
    this.followCamera.update(this.config.timing.maxDeltaSeconds);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
    document.querySelector<HTMLElement>('#loading')!.hidden = true;
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.saveService.save(this.save);
    this.careUi?.dispose();
    this.unsubscribeCareReaction?.();
    this.input?.dispose();
    this.effects.dispose();
    if (this.character) this.loader.dispose(this.character);
    if (this.stage) this.stageLoader.dispose(this.stage);
    this.stageAssets.dispose();
    this.renderer.dispose();
    removeEventListener('resize', this.resize);
    visualViewport?.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibility);
  }

  private loop = (): void => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.loop);
    if (!this.visible) return;
    const dt = Math.min(this.clock.getDelta(), this.config.timing.maxDeltaSeconds);
    if (!this.evolution?.active) this.floating?.update(dt);
    this.evolution?.update(dt);
    this.followCamera?.update(dt);
    this.care.update(dt);
    this.effects.update(dt);
    if (this.targetHelper && this.floating) this.targetHelper.position.copy(this.floating.target).setY(.03);
    this.debug?.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private setupEnvironment(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff9e8, 0x5e7657, 2.5));
    const sun = new THREE.DirectionalLight(0xfff4cf, 2.2); sun.position.set(4, 7, 3); this.scene.add(sun);
    this.createDebugHelpers();
  }

  private createDebugHelpers(): void {
    const c = this.config.movement, points = [new THREE.Vector3(-c.halfWidth, .02, -c.halfDepth), new THREE.Vector3(c.halfWidth, .02, -c.halfDepth), new THREE.Vector3(c.halfWidth, .02, c.halfDepth), new THREE.Vector3(-c.halfWidth, .02, c.halfDepth)];
    this.areaHelper = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xfff59d })); this.areaHelper.visible = false; this.scene.add(this.areaHelper);
    this.targetHelper = new THREE.Mesh(new THREE.RingGeometry(.08, .13, 16), new THREE.MeshBasicMaterial({ color: 0xff6d8a, side: THREE.DoubleSide })); this.targetHelper.rotation.x = -Math.PI / 2; this.targetHelper.visible = false; this.scene.add(this.targetHelper);
  }

  private bindUi(): void {
    const button = document.querySelector<HTMLButtonElement>('#debug-button')!;
    if (this.save.settings.debug) this.debug?.toggle();
    button.onclick = () => { this.debug?.toggle(); this.save.settings.debug = !this.save.settings.debug; this.saveService.save(this.save); };
    document.querySelector<HTMLInputElement>('#show-hit')!.onchange = (event) => { if (this.character) (this.character.hitArea.material as THREE.MeshBasicMaterial).opacity = (event.target as HTMLInputElement).checked ? .18 : 0; };
    document.querySelector<HTMLInputElement>('#show-area')!.onchange = (event) => { if (this.areaHelper) this.areaHelper.visible = (event.target as HTMLInputElement).checked; };
    document.querySelector<HTMLInputElement>('#show-target')!.onchange = (event) => { if (this.targetHelper) this.targetHelper.visible = (event.target as HTMLInputElement).checked; };
    document.querySelector<HTMLButtonElement>('#evolution-close')!.onclick = () => { document.querySelector<HTMLElement>('#evolution-overlay')!.hidden = true; };
    const mapPanel = document.querySelector<HTMLElement>('#map-panel')!;
    document.querySelector<HTMLButtonElement>('#map-button')!.onclick = () => { mapPanel.hidden = false; };
    document.querySelector<HTMLButtonElement>('#map-close')!.onclick = () => { mapPanel.hidden = true; };
    mapPanel.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach((stageButton) => { stageButton.onclick = () => void this.switchStage(stageButton.dataset.stage as StageId); });
    this.updateStageUi();
    addEventListener('resize', this.resize);
    visualViewport?.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.visibility);
  }

  private resize = (): void => {
    const width = this.canvas.clientWidth || innerWidth, height = this.canvas.clientHeight || innerHeight;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.config.renderer.pixelRatioCap));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private visibility = (): void => {
    this.visible = !document.hidden;
    if (this.visible) { this.clock.stop(); this.clock.start(); this.clock.getDelta(); }
    else { this.saveService.save(this.save); this.clock.stop(); }
  };

  private showEvolutionStart = (): void => {
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.hidden = false;
    overlay.querySelector('p')!.textContent = 'ワールドっちの様子が……';
    overlay.querySelector('h2')!.textContent = '進化の気配';
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = true;
  };

  private showEvolutionComplete = (_form: string, name: string): void => {
    document.querySelector<HTMLElement>('#character-name')!.textContent = name;
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.querySelector('p')!.textContent = '育て方が新しい個性になった！';
    overlay.querySelector('h2')!.textContent = `${name} に進化した`;
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = false;
    this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 2, 0)));
  };

  private async switchStage(id: StageId): Promise<void> {
    if (this.switchingStage || id === this.save.map) { document.querySelector<HTMLElement>('#map-panel')!.hidden = true; return; }
    this.switchingStage = true;
    const loading = document.querySelector<HTMLElement>('#stage-loading')!; loading.hidden = false;
    try {
      const config = STAGES[id], next = await this.stageLoader.load(config); this.scene.add(next.root);
      if (this.stage) this.stageLoader.dispose(this.stage); this.stage = next; this.floating?.setObstacles(next.obstacles);
      this.scene.background = new THREE.Color(config.background); this.scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
      this.save.map = id; this.saveService.save(this.save); this.updateStageUi(); document.querySelector<HTMLElement>('#map-panel')!.hidden = true;
    } catch (error) { console.error(error); document.querySelector<HTMLElement>('#message')!.textContent = 'お部屋の準備に失敗しました'; }
    finally { loading.hidden = true; this.switchingStage = false; }
  }

  private updateStageUi(): void {
    const config = STAGES[this.save.map]; document.querySelector<HTMLElement>('#stage-label')!.textContent = config.label;
    document.querySelector<HTMLElement>('#phase-label')!.textContent = `PHASE 4 / ${config.id.toUpperCase()}`;
    document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach((button) => { button.classList.toggle('active', button.dataset.stage === this.save.map); });
  }
}
