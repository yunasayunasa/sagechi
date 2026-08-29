import * as THREE from 'three';
import { AudioService } from '../audio/AudioService';
import { FollowCamera } from '../camera/FollowCamera';
import { CareSystem } from '../care/CareSystem';
import { CareUI } from '../care/CareUI';
import { CharacterLoader, type LoadedCharacter } from '../characters/CharacterLoader';
import { SAGE_CHARACTER_CONFIGS, WORLDTCCHI_CONFIG, type CharacterConfig, type SemanticAnimation } from '../characters/character-config';
import type { CharacterController } from '../characters/CharacterController';
import { FloatingCharacterController } from '../characters/FloatingCharacterController';
import { WalkingCharacterController } from '../characters/WalkingCharacterController';
import { GAME_CONFIG } from '../config/game-config';
import { DebugHud } from '../debug/DebugHud';
import { EffectSystem } from '../effects/EffectSystem';
import { EncyclopediaUI } from '../encyclopedia/EncyclopediaUI';
import { EvolutionSystem } from '../evolution/EvolutionSystem';
import { EggView } from '../generation/EggView';
import { GenerationSystem } from '../generation/GenerationSystem';
import { InputController } from '../input/InputController';
import { isSageCharacterId, SaveService } from '../save/SaveService';
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
  private readonly audio = new AudioService(this.save.settings.bgm, this.save.settings.se, this.save.settings.bgmTrack, this.save.settings.bgmVolume, this.save.settings.seVolume, `${import.meta.env.BASE_URL}audio/`);
  private readonly stageAssets = new StageAssetManager();
  private readonly stageLoader = new StageLoader(this.stageAssets);
  private stage: LoadedStage | null = null;
  private character: LoadedCharacter | null = null;
  private controller: CharacterController | null = null;
  private activeConfig: CharacterConfig = WORLDTCCHI_CONFIG;
  private followCamera: FollowCamera | null = null;
  private input: InputController | null = null;
  private careUi: CareUI | null = null;
  private evolution: EvolutionSystem | null = null;
  private encyclopedia: EncyclopediaUI | null = null;
  private generation: GenerationSystem | null = null;
  private eggView: EggView | null = null;
  private unsubscribeCareReaction: (() => void) | null = null;
  private debug: DebugHud | null = null;
  private frame = 0;
  private running = false;
  private visible = !document.hidden;
  private areaHelper: THREE.LineLoop | null = null;
  private targetHelper: THREE.Mesh | null = null;
  private switchingStage = false;
  private switchingGeneration = false;
  private rareEvolutionTarget: CharacterConfig | null = null;
  private rareEvolutionElapsed = 0;
  private rareEvolutionLoading = false;
  private callActive = false;
  private callArrived = false;
  private callCloseElapsed = 0;

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
    const initialConfig = isSageCharacterId(this.save.currentCharacter)
      ? SAGE_CHARACTER_CONFIGS.find((config) => config.id === this.save.currentCharacter) ?? WORLDTCCHI_CONFIG
      : WORLDTCCHI_CONFIG;
    const loaded = await this.mountCharacter(initialConfig);
    if (initialConfig.id === 'worldtchi') this.evolution = this.createEvolution(loaded);
    document.querySelector<HTMLElement>('#character-name')!.textContent = initialConfig.id === 'worldtchi' ? this.evolution!.getCurrentName() : initialConfig.label;
    this.followCamera = new FollowCamera(this.camera, loaded.root, this.config);
    this.input = new InputController(this.canvas, this.camera, loaded.hitArea, this.controller!, this.followCamera, this.config, () => { this.care.pet(); this.audio.play('pet'); }, () => this.audio.play('tap'));
    this.careUi = new CareUI(this.care, () => this.getCurrentCharacterName());
    this.encyclopedia = new EncyclopediaUI(this.save, SAGE_CHARACTER_CONFIGS, this.config.renderer.pixelRatioCap);
    this.eggView = new EggView(this.scene, () => void this.beginNextGeneration());
    this.eggView.setAvailable(this.save.eggAvailable);
    this.generation = new GenerationSystem(this.save, this.config, () => this.saveService.save(this.save), this.showEggAvailable);
    this.unsubscribeCareReaction = this.care.subscribe((event) => {
      if (event.kind === 'illness') {
        this.controller?.setSick(event.active);
        document.querySelector<HTMLElement>('.status-card')!.classList.toggle('sick', event.active);
        this.audio.play(event.active ? 'sick' : 'recover');
        return;
      }
      if (event.kind === 'request') { if (event.request) this.audio.play('request'); return; }
      if (event.kind === 'care-complete') { this.audio.play('happy'); this.evolution?.recordCare(); this.generation?.recordCare(); return; }
      if (event.kind === 'rare-evolution') { this.audio.play('evolution'); this.startRareEvolution(); return; }
      if (event.kind !== 'reaction' || event.visualHandled) return;
      if (event.tone === 'angry') this.audio.play('angry');
      if (event.tone === 'happy') this.controller?.pet();
      else if (event.tone === 'calm') this.controller?.tap(this.camera.position);
      else this.controller?.delayReaction(event.tone === 'angry' ? 'angry' : undefined);
    });
    this.debug = new DebugHud(document.querySelector('#debug-hud')!, document.querySelector('#debug-controls')!, this.renderer, this.controller!, this.input);
    this.bindUi();
    this.running = true;
    this.clock.start();
    this.followCamera.update(this.config.timing.maxDeltaSeconds);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
    document.querySelector<HTMLElement>('#loading')!.hidden = true;
    if (!this.save.settings.tutorialSeen) this.showTutorial();
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.saveService.save(this.save);
    this.careUi?.dispose();
    this.encyclopedia?.dispose();
    this.audio.dispose();
    this.eggView?.dispose();
    this.unsubscribeCareReaction?.();
    this.input?.dispose();
    this.controller?.dispose?.();
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
    if (!this.evolution?.active && !this.rareEvolutionTarget) this.controller?.update(dt);
    this.updateCall(dt);
    if (this.activeConfig.id === 'worldtchi') this.evolution?.update(dt);
    this.updateRareEvolution(dt);
    if (!this.rareEvolutionTarget) this.generation?.update(dt);
    this.eggView?.update(dt);
    this.followCamera?.update(dt);
    this.care.update(dt);
    this.effects.update(dt);
    if (this.targetHelper && this.controller) this.targetHelper.position.copy(this.controller.target).setY(.03);
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
    const selector = document.querySelector<HTMLSelectElement>('#character-preview')!;
    selector.innerHTML = `<option value="worldtchi">ワールドっち（現在の育成個体）</option>${SAGE_CHARACTER_CONFIGS.map((config) => `<option value="${config.id}">${config.label}</option>`).join('')}`;
    selector.onchange = () => void this.previewCharacter(selector.value);
    document.querySelectorAll<HTMLButtonElement>('[data-reaction]').forEach((button) => { button.onclick = () => (this.controller as WalkingCharacterController)?.playReaction?.(button.dataset.reaction as SemanticAnimation); });
    document.querySelector<HTMLButtonElement>('#force-tart-request')!.onclick = () => this.care.forceTartRequest();
    document.querySelector<HTMLButtonElement>('#force-illness')!.onclick = () => this.care.forceIllness();
    const settingsPanel = document.querySelector<HTMLElement>('#settings-panel')!;
    const bgm = document.querySelector<HTMLInputElement>('#setting-bgm')!, se = document.querySelector<HTMLInputElement>('#setting-se')!;
    const bgmTrack = document.querySelector<HTMLSelectElement>('#setting-bgm-track')!, bgmVolume = document.querySelector<HTMLInputElement>('#setting-bgm-volume')!, seVolume = document.querySelector<HTMLInputElement>('#setting-se-volume')!;
    bgm.checked = this.save.settings.bgm; se.checked = this.save.settings.se; bgmTrack.value = this.save.settings.bgmTrack; bgmVolume.value = String(Math.round(this.save.settings.bgmVolume * 100)); seVolume.value = String(Math.round(this.save.settings.seVolume * 100));
    document.querySelector<HTMLButtonElement>('#settings-button')!.onclick = () => { this.audio.play('ui'); settingsPanel.hidden = false; };
    document.querySelector<HTMLButtonElement>('#settings-close')!.onclick = () => { this.audio.play('ui'); settingsPanel.hidden = true; };
    bgm.onchange = () => { this.save.settings.bgm = bgm.checked; this.audio.setBgmEnabled(bgm.checked); this.saveService.save(this.save); };
    se.onchange = () => { this.save.settings.se = se.checked; this.audio.setSeEnabled(se.checked); this.audio.play('ui'); this.saveService.save(this.save); };
    bgmTrack.onchange = () => { this.save.settings.bgmTrack = bgmTrack.value as typeof this.save.settings.bgmTrack; this.audio.setBgmTrack(this.save.settings.bgmTrack); this.saveService.save(this.save); };
    bgmVolume.oninput = () => { this.save.settings.bgmVolume = Number(bgmVolume.value) / 100; this.audio.setBgmVolume(this.save.settings.bgmVolume); this.saveService.save(this.save); };
    seVolume.oninput = () => { this.save.settings.seVolume = Number(seVolume.value) / 100; this.audio.setSeVolume(this.save.settings.seVolume); this.saveService.save(this.save); };
    seVolume.onchange = () => this.audio.play('ui');
    document.querySelector<HTMLButtonElement>('#restart-button')!.onclick = () => { if (confirm('図鑑・世代・設定を残して、幼年期のワールドっちから育て直しますか？')) void this.restartFromChild(); };
    document.querySelector<HTMLButtonElement>('#call-button')!.onclick = () => { if (this.callActive) this.finishCall(); else this.beginCall(); };
    document.querySelector<HTMLButtonElement>('#tutorial-open')!.onclick = () => { settingsPanel.hidden = true; this.showTutorial(); };
    document.querySelector<HTMLButtonElement>('#tutorial-start')!.onclick = this.dismissTutorial;
    document.querySelector<HTMLButtonElement>('#tutorial-skip')!.onclick = this.dismissTutorial;
    const statusCard = document.querySelector<HTMLElement>('.status-card')!, statusToggle = document.querySelector<HTMLButtonElement>('#status-toggle')!;
    const renderStatusCollapsed = () => { statusCard.classList.toggle('collapsed', this.save.settings.statusCollapsed); statusToggle.ariaExpanded = String(!this.save.settings.statusCollapsed); statusToggle.querySelector<HTMLElement>('b')!.textContent = this.save.settings.statusCollapsed ? '＋' : '−'; };
    statusToggle.onclick = () => { this.save.settings.statusCollapsed = !this.save.settings.statusCollapsed; renderStatusCollapsed(); this.saveService.save(this.save); }; renderStatusCollapsed();
    document.querySelector<HTMLButtonElement>('#evolution-close')!.onclick = () => { document.querySelector<HTMLElement>('#evolution-overlay')!.hidden = true; };
    const mapPanel = document.querySelector<HTMLElement>('#map-panel')!;
    document.querySelector<HTMLButtonElement>('#map-button')!.onclick = () => { const willOpen = mapPanel.hidden; mapPanel.hidden = !willOpen; if (willOpen) document.querySelector<HTMLElement>('#care-panel')!.hidden = true; };
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
    if (this.visible) { this.clock.stop(); this.clock.start(); this.clock.getDelta(); this.audio.resume(); }
    else { this.saveService.save(this.save); this.clock.stop(); this.audio.pause(); }
  };

  private showEvolutionStart = (): void => {
    this.finishCall();
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.hidden = false;
    overlay.querySelector('p')!.textContent = 'ワールドっちの様子が……';
    overlay.querySelector('h2')!.textContent = '進化の気配';
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = true;
  };

  private showEvolutionComplete = (_form: string, name: string): void => {
    document.querySelector<HTMLElement>('#character-name')!.textContent = name;
    this.audio.play('evolution');
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.querySelector('p')!.textContent = '育て方が新しい個性になった！';
    overlay.querySelector('h2')!.textContent = `${name} に進化した`;
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = false;
    this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 2, 0)));
  };

  private showSageEvolutionStart = (): void => {
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.hidden = false;
    overlay.querySelector('p')!.textContent = '育ててきた個性が集まって……';
    overlay.querySelector('h2')!.textContent = '賢者っちへ進化する気配';
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = true;
  };

  private showSageEvolutionComplete = (id: typeof SAGE_CHARACTER_CONFIGS[number]['id'], name: string): void => {
    const config = SAGE_CHARACTER_CONFIGS.find((item) => item.id === id);
    if (!config) return;
    void this.swapCharacter(config).then(() => {
      this.eggView?.setAvailable(false);
      this.encyclopedia?.refresh();
      const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
      overlay.querySelector('p')!.textContent = '育て方が、この子だけの姿になった！';
      overlay.querySelector('h2')!.textContent = `${name} に進化した`;
      overlay.querySelector<HTMLButtonElement>('button')!.hidden = false;
      this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 2, 0)));
    }).catch((error: unknown) => {
      console.error(error);
      document.querySelector<HTMLElement>('#evolution-overlay')!.hidden = true;
      document.querySelector<HTMLElement>('#message')!.textContent = `${name}を呼べませんでした`;
    });
  };

  private showEggAvailable = (): void => {
    this.audio.play('egg');
    this.eggView?.setAvailable(true);
    document.querySelector<HTMLElement>('#message')!.textContent = 'いつの間にか、そばに卵がある。';
    this.effects.sparkle(new THREE.Vector3(-1.55, 1.15, .78));
  };

  private startRareEvolution(): void {
    if (this.save.currentCharacter === 'tartman' || this.rareEvolutionTarget) return;
    this.finishCall();
    const config = SAGE_CHARACTER_CONFIGS.find((item) => item.id === 'tartman');
    if (!config) return;
    const preserveEgg = this.save.eggAvailable;
    this.save.currentCharacter = 'tartman';
    this.save.evolutionStage = 3;
    if (!this.save.encyclopedia.includes('tartman')) this.save.encyclopedia.push('tartman');
    this.generation?.resetAdultProgress(preserveEgg);
    this.encyclopedia?.refresh();
    this.evolution = null;
    this.rareEvolutionTarget = config;
    this.rareEvolutionElapsed = 0;
    const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
    overlay.hidden = false;
    overlay.querySelector('p')!.textContent = 'タルトの甘い香りに包まれて……';
    overlay.querySelector('h2')!.textContent = '特別な進化の気配';
    overlay.querySelector<HTMLButtonElement>('button')!.hidden = true;
    this.saveService.save(this.save);
  }

  private updateRareEvolution(dt: number): void {
    if (!this.rareEvolutionTarget || this.rareEvolutionLoading) return;
    this.rareEvolutionElapsed += dt;
    if (this.rareEvolutionElapsed < this.config.evolution.durationSeconds) return;
    const config = this.rareEvolutionTarget;
    this.rareEvolutionLoading = true;
    void this.swapCharacter(config).then(() => {
      this.rareEvolutionTarget = null;
      this.rareEvolutionLoading = false;
      const overlay = document.querySelector<HTMLElement>('#evolution-overlay')!;
      overlay.querySelector('p')!.textContent = '世代を越えた出会いが、特別な姿になった！';
      overlay.querySelector('h2')!.textContent = 'タルトマンっち に進化した';
      overlay.querySelector<HTMLButtonElement>('button')!.hidden = false;
      this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 2, 0)));
    }).catch((error: unknown) => {
      console.error(error);
      this.rareEvolutionTarget = null;
      this.rareEvolutionLoading = false;
      document.querySelector<HTMLElement>('#evolution-overlay')!.hidden = true;
      document.querySelector<HTMLElement>('#message')!.textContent = 'タルトマンっちを呼べませんでした';
    });
  }

  private async beginNextGeneration(): Promise<void> {
    if (this.switchingGeneration || !this.save.eggAvailable) return;
    this.switchingGeneration = true;
    const loading = document.querySelector<HTMLElement>('#stage-loading')!;
    loading.textContent = '卵を見守っています…'; loading.hidden = false;
    try {
      this.generation?.beginNextGeneration();
      this.care.resetForGeneration();
      this.eggView?.setAvailable(false);
      await this.swapCharacter(WORLDTCCHI_CONFIG);
      document.querySelector<HTMLSelectElement>('#character-preview')!.value = 'worldtchi';
      document.querySelector<HTMLElement>('#message')!.textContent = `第${this.save.generation + 1}世代のワールドっちが生まれた！`;
      this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)));
    } catch (error) {
      console.error(error);
      document.querySelector<HTMLElement>('#message')!.textContent = '卵から生まれる準備に失敗しました';
    } finally {
      loading.hidden = true; loading.textContent = 'お部屋を準備しています…'; this.switchingGeneration = false;
    }
  }

  private async restartFromChild(): Promise<void> {
    if (this.switchingGeneration) return;
    this.switchingGeneration = true;
    const loading = document.querySelector<HTMLElement>('#stage-loading')!;
    const settingsPanel = document.querySelector<HTMLElement>('#settings-panel')!;
    loading.textContent = '幼年期のワールドっちを呼んでいます…'; loading.hidden = false; settingsPanel.hidden = true;
    try {
      this.generation?.restartFromChild();
      this.care.resetForGeneration();
      this.eggView?.setAvailable(false);
      await this.swapCharacter(WORLDTCCHI_CONFIG);
      document.querySelector<HTMLSelectElement>('#character-preview')!.value = 'worldtchi';
      document.querySelector<HTMLElement>('#message')!.textContent = '幼年期のワールドっちから育て直します';
      this.effects.sparkle(this.character!.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)));
    } catch (error) {
      console.error(error);
      document.querySelector<HTMLElement>('#message')!.textContent = '育て直しの準備に失敗しました';
    } finally {
      loading.hidden = true; loading.textContent = 'お部屋を準備しています…'; this.switchingGeneration = false;
    }
  }

  private async switchStage(id: StageId): Promise<void> {
    if (this.switchingStage || id === this.save.map) { document.querySelector<HTMLElement>('#map-panel')!.hidden = true; return; }
    this.finishCall();
    this.switchingStage = true;
    const loading = document.querySelector<HTMLElement>('#stage-loading')!; loading.hidden = false;
    try {
      const config = STAGES[id], next = await this.stageLoader.load(config); this.scene.add(next.root);
      if (this.stage) this.stageLoader.dispose(this.stage); this.stage = next; this.controller?.setObstacles(next.obstacles);
      this.scene.background = new THREE.Color(config.background); this.scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
      this.save.map = id; this.saveService.save(this.save); this.updateStageUi(); document.querySelector<HTMLElement>('#map-panel')!.hidden = true;
    } catch (error) { console.error(error); document.querySelector<HTMLElement>('#message')!.textContent = 'お部屋の準備に失敗しました'; }
    finally { loading.hidden = true; this.switchingStage = false; }
  }

  private updateStageUi(): void {
    const config = STAGES[this.save.map]; document.querySelector<HTMLElement>('#stage-label')!.textContent = config.label;
    document.querySelector<HTMLElement>('#phase-label')!.textContent = `PHASE 10 / ${config.id.toUpperCase()}`;
    document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach((button) => { button.classList.toggle('active', button.dataset.stage === this.save.map); });
  }

  private async mountCharacter(config: CharacterConfig): Promise<LoadedCharacter> {
    const loaded = await this.loader.load(config);
    this.character = loaded; this.activeConfig = config;
    if (config.controller === 'floating') loaded.root.position.y = this.config.floating.baseAltitude;
    this.scene.add(loaded.root);
    this.controller = config.controller === 'walking'
      ? new WalkingCharacterController(loaded, config, this.config, this.effects, this.stage?.obstacles)
      : new FloatingCharacterController(loaded, this.config, this.effects, this.stage?.obstacles);
    this.controller.setSick(this.save.illnessActive);
    return loaded;
  }

  private async previewCharacter(id: string): Promise<void> {
    const config = id === 'worldtchi' ? WORLDTCCHI_CONFIG : SAGE_CHARACTER_CONFIGS.find((item) => item.id === id);
    if (!config || config.id === this.activeConfig.id) return;
    const loading = document.querySelector<HTMLElement>('#stage-loading')!; loading.textContent = `${config.label}を呼んでいます…`; loading.hidden = false;
    try {
      await this.swapCharacter(config);
    } catch (error) { console.error(error); document.querySelector<HTMLElement>('#message')!.textContent = `${config.label}を呼べませんでした`; }
    finally { loading.hidden = true; loading.textContent = 'お部屋を準備しています…'; }
  }

  private async swapCharacter(config: CharacterConfig): Promise<void> {
    this.finishCall();
    const previous = this.character, previousController = this.controller, previousInput = this.input;
    const loaded = await this.mountCharacter(config);
    previousInput?.dispose(); previousController?.dispose?.();
    if (previous) this.loader.dispose(previous);
    this.followCamera?.setTarget(loaded.root);
    this.input = new InputController(this.canvas, this.camera, loaded.hitArea, this.controller!, this.followCamera!, this.config, () => { this.care.pet(); this.audio.play('pet'); }, () => this.audio.play('tap'));
    this.debug?.setSources(this.controller!, this.input);
    this.evolution = config.id === 'worldtchi' && this.save.evolutionStage < 3 ? this.createEvolution(loaded) : null;
    document.querySelector<HTMLElement>('#character-name')!.textContent = config.id === 'worldtchi' ? this.evolution?.getCurrentName() ?? WORLDTCCHI_CONFIG.label : config.label;
    document.querySelector<HTMLElement>('#message')!.textContent = `${this.getCurrentCharacterName()}は、のんびり過ごしています`;
    document.querySelector<HTMLCanvasElement>('#game-canvas')!.ariaLabel = `${this.getCurrentCharacterName()}が暮らす3D空間`;
    document.querySelector<HTMLElement>('.status-card')!.ariaLabel = `${this.getCurrentCharacterName()}の状態`;
    document.querySelector<HTMLElement>('#sage-reactions')!.hidden = config.controller !== 'walking';
  }

  private createEvolution(loaded: LoadedCharacter): EvolutionSystem {
    return new EvolutionSystem(
      this.save, loaded, this.config, () => this.saveService.save(this.save),
      this.showEvolutionStart, this.showEvolutionComplete,
      this.showSageEvolutionStart, this.showSageEvolutionComplete,
    );
  }

  private getCurrentCharacterName(): string {
    return this.activeConfig.id === 'worldtchi' ? this.evolution?.getCurrentName() ?? WORLDTCCHI_CONFIG.label : this.activeConfig.label;
  }

  private beginCall(): void {
    if (!this.controller || !this.followCamera || this.evolution?.active || this.rareEvolutionTarget || this.switchingStage || this.switchingGeneration) return;
    const destination = new THREE.Vector3(this.config.call.targetX, this.character?.root.position.y ?? 0, this.config.call.targetZ);
    if (!this.controller.callTo(destination, this.camera.position)) {
      document.querySelector<HTMLElement>('#message')!.textContent = '抱っこを終えてから呼んでね';
      return;
    }
    this.callActive = true; this.callArrived = false; this.callCloseElapsed = 0;
    const button = document.querySelector<HTMLButtonElement>('#call-button')!; button.classList.add('active'); button.querySelector('b')!.textContent = '戻す';
    document.querySelector<HTMLElement>('#message')!.textContent = `${this.getCurrentCharacterName()}を呼んでいます`;
  }

  private updateCall(dt: number): void {
    if (!this.callActive || !this.controller || !this.followCamera) return;
    if (this.controller.state === 'called') {
      if (!this.callArrived) {
        this.callArrived = true; this.followCamera.setMode('close');
        document.querySelector<HTMLElement>('#message')!.textContent = `${this.getCurrentCharacterName()}が近くまで来てくれた`;
      }
      this.callCloseElapsed += dt;
      if (this.callCloseElapsed >= this.config.call.closeSeconds) this.finishCall();
    } else if (this.controller.state !== 'calling') this.finishCall();
  }

  private finishCall(): void {
    if (!this.callActive && this.followCamera?.getMode() !== 'close') return;
    this.controller?.releaseCall(); this.followCamera?.setMode('overview');
    this.callActive = false; this.callArrived = false; this.callCloseElapsed = 0;
    const button = document.querySelector<HTMLButtonElement>('#call-button'); if (button) { button.classList.remove('active'); button.querySelector('b')!.textContent = '呼ぶ'; }
  }

  private showTutorial(): void { document.querySelector<HTMLElement>('#tutorial-panel')!.hidden = false; }
  private dismissTutorial = (): void => {
    document.querySelector<HTMLElement>('#tutorial-panel')!.hidden = true;
    this.save.settings.tutorialSeen = true; this.saveService.save(this.save); this.audio.play('ui');
  };
}
