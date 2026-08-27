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
import { InputController } from '../input/InputController';
import { SaveService } from '../save/SaveService';

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
  private character: LoadedCharacter | null = null;
  private floating: FloatingCharacterController | null = null;
  private followCamera: FollowCamera | null = null;
  private input: InputController | null = null;
  private careUi: CareUI | null = null;
  private unsubscribeCareReaction: (() => void) | null = null;
  private debug: DebugHud | null = null;
  private frame = 0;
  private running = false;
  private visible = !document.hidden;
  private areaHelper: THREE.LineLoop | null = null;
  private targetHelper: THREE.Mesh | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.config.renderer.antialias, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(this.config.renderer.clearColor);
    this.camera = new THREE.PerspectiveCamera(this.config.camera.fov, 1, this.config.camera.near, this.config.camera.far);
    this.camera.position.set(...this.config.camera.overviewOffset);
    this.effects = new EffectSystem(this.scene);
    this.setupStage();
    this.resize();
    this.renderer.render(this.scene, this.camera);
  }

  async start(): Promise<void> {
    const loaded = await this.loader.load(WORLDTCCHI_CONFIG);
    this.character = loaded;
    loaded.root.position.y = this.config.floating.baseAltitude;
    this.scene.add(loaded.root);
    this.floating = new FloatingCharacterController(loaded, this.config, this.effects);
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
    this.floating?.update(dt);
    this.followCamera?.update(dt);
    this.care.update(dt);
    this.effects.update(dt);
    if (this.targetHelper && this.floating) this.targetHelper.position.copy(this.floating.target).setY(.03);
    this.debug?.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private setupStage(): void {
    this.scene.fog = new THREE.Fog(0xb8dca8, 8, 15);
    this.scene.add(new THREE.HemisphereLight(0xfff9e8, 0x5e7657, 2.5));
    const sun = new THREE.DirectionalLight(0xfff4cf, 2.2); sun.position.set(4, 7, 3); this.scene.add(sun);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshToonMaterial({ color: 0x82bd75 })); floor.rotation.x = -Math.PI / 2; this.scene.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.8, 64), new THREE.MeshToonMaterial({ color: 0xa9cf8f, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .006; this.scene.add(ring);
    for (let i = 0; i < 18; i++) { const flower = new THREE.Mesh(new THREE.SphereGeometry(.035 + Math.random() * .025, 8, 6), new THREE.MeshToonMaterial({ color: i % 3 === 0 ? 0xfff0a8 : i % 3 === 1 ? 0xf6b8c8 : 0xffffff })); const angle = Math.random() * Math.PI * 2, radius = 2.8 + Math.random() * 2; flower.position.set(Math.cos(angle) * radius, .04, Math.sin(angle) * radius); this.scene.add(flower); }
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
}
