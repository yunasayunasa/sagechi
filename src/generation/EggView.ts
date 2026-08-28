import * as THREE from 'three';

export class EggView {
  private readonly root = new THREE.Group();
  private readonly material = new THREE.MeshToonMaterial({ color: 0xfff3cf, emissive: 0x6b5030, emissiveIntensity: .06 });
  private readonly geometry = new THREE.SphereGeometry(.42, 24, 18);
  private readonly button = document.querySelector<HTMLButtonElement>('#egg-button')!;
  private readonly panel = document.querySelector<HTMLElement>('#egg-panel')!;
  private elapsed = 0;

  constructor(scene: THREE.Scene, private readonly onGenerationChange: () => void) {
    const egg = new THREE.Mesh(this.geometry, this.material);
    egg.scale.set(1, 1.32, 1);
    egg.position.y = .53;
    this.root.add(egg);
    this.root.position.set(-1.55, 0, .78);
    scene.add(this.root);
    this.button.onclick = () => { this.panel.hidden = false; };
    document.querySelector<HTMLButtonElement>('#egg-continue')!.onclick = () => { this.panel.hidden = true; };
    document.querySelector<HTMLButtonElement>('#egg-hatch')!.onclick = () => { this.panel.hidden = true; this.onGenerationChange(); };
    this.setAvailable(false);
  }

  setAvailable(available: boolean): void {
    this.root.visible = available;
    this.button.hidden = !available;
    if (!available) this.panel.hidden = true;
  }

  update(dt: number): void {
    if (!this.root.visible) return;
    this.elapsed += dt;
    this.root.rotation.y = Math.sin(this.elapsed * .55) * .08;
    this.root.scale.setScalar(1 + Math.sin(this.elapsed * 1.4) * .012);
  }

  dispose(): void {
    this.root.parent?.remove(this.root);
    this.geometry.dispose();
    this.material.dispose();
  }
}
