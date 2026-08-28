import type { CareEvent, CareSystem } from './CareSystem';
import type { FoodChoice, PlayChoice, RequestType } from './care-types';

const labels: Record<RequestType, { icon: string; text: string }> = {
  food: { icon: '🍽️', text: 'なにか食べたいな' },
  play: { icon: '⚽', text: 'いっしょに遊びたい！' },
  sleep: { icon: '💤', text: 'ちょっと眠たいな' },
  pet: { icon: '💗', text: '撫でてほしいな' },
  tart: { icon: '🥧', text: 'タルトが食べたいみたい' },
};

export class CareUI {
  private readonly panel = document.querySelector<HTMLElement>('#care-panel')!;
  private readonly requestBubble = document.querySelector<HTMLElement>('#request-bubble')!;
  private readonly message = document.querySelector<HTMLElement>('#message')!;
  private messageTimer = 0;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly care: CareSystem, private readonly getCharacterName: () => string = () => 'この子') {
    document.querySelector<HTMLButtonElement>('#care-button')!.onclick = () => this.openMain();
    document.querySelector<HTMLButtonElement>('#care-close')!.onclick = () => this.close();
    document.querySelector<HTMLButtonElement>('#request-open')!.onclick = () => this.openForRequest();
    this.panel.addEventListener('click', this.onPanelClick);
    this.unsubscribe = care.subscribe(this.onCareEvent);
    this.renderStatus();
  }

  dispose(): void { this.unsubscribe?.(); this.panel.removeEventListener('click', this.onPanelClick); }

  private onCareEvent = (event: CareEvent): void => {
    if (event.kind === 'status') this.renderStatus();
    if (event.kind === 'request') this.renderRequest(event.request);
    if (event.kind === 'reaction') this.showMessage(event.message);
  };

  private renderStatus(): void {
    const status = this.care.save.status;
    const values = { hunger: status.hunger, sleepiness: status.sleepiness, boredom: status.boredom, mood: status.mood, stress: status.stress, health: status.health };
    for (const [key, value] of Object.entries(values)) {
      const bar = document.querySelector<HTMLElement>(`[data-status="${key}"] .status-fill`);
      if (bar) bar.style.width = `${Math.round(value)}%`;
    }
  }

  private renderRequest(request: RequestType | null): void {
    this.requestBubble.hidden = !request;
    if (!request) { this.close(); return; }
    const label = labels[request];
    this.requestBubble.querySelector<HTMLElement>('.request-icon')!.textContent = label.icon;
    this.requestBubble.querySelector<HTMLElement>('.request-text')!.textContent = label.text;
  }

  private openMain(): void { this.renderPanel('お世話', `<button data-menu="food">🍽️ 食事</button><button data-menu="play">🧸 遊び</button><button data-action="rest">💤 休む</button>`); }
  private openForRequest(): void {
    if (this.care.request === 'food' || this.care.request === 'tart') this.openFood();
    else if (this.care.request === 'play') this.openPlay();
    else if (this.care.request === 'sleep') this.renderPanel('眠そう…', `<button data-action="rest">🛏️ 休ませる</button><button class="later" data-action="delay">あとでね</button>`);
    else if (this.care.request === 'pet') this.renderPanel('撫でてほしそう', `<p class="care-hint">${this.getCharacterName()}の上を指で撫でてね</p><button class="later" data-action="delay">あとでね</button>`);
  }
  private openFood(): void { this.renderPanel('なにを食べる？', `<button data-food="vegetable">🥦 野菜</button><button data-food="sweet">🍰 甘いもの</button><button data-food="meat">🍖 肉</button>${this.care.request === 'tart' ? '<button class="rare-food" data-food="tart">🥧 タルト</button>' : ''}${this.care.request ? '<button class="later" data-action="delay">あとでね</button>' : ''}`); }
  private openPlay(): void { this.renderPanel('なにして遊ぶ？', `<button data-play="ball">⚽ ボール</button><button data-play="rattle">🪇 ガラガラ</button><button data-play="book">📖 絵本</button>${this.care.request ? '<button class="later" data-action="delay">あとでね</button>' : ''}`); }
  private renderPanel(title: string, content: string): void { this.panel.querySelector<HTMLElement>('h2')!.textContent = title; this.panel.querySelector<HTMLElement>('.care-options')!.innerHTML = content; this.panel.hidden = false; }
  private close(): void { this.panel.hidden = true; }

  private onPanelClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.menu === 'food') this.openFood();
    if (button.dataset.menu === 'play') this.openPlay();
    if (button.dataset.food) { this.care.feed(button.dataset.food as FoodChoice); this.close(); }
    if (button.dataset.play) { this.care.play(button.dataset.play as PlayChoice); this.close(); }
    if (button.dataset.action === 'rest') { this.care.rest(); this.close(); }
    if (button.dataset.action === 'delay') { this.care.delay(); this.close(); }
  };

  private showMessage(text: string): void {
    this.message.textContent = text;
    clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => { this.message.textContent = `${this.getCharacterName()}は、のんびり過ごしています`; }, 2600);
  }
}
