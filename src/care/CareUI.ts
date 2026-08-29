import type { CareEvent, CareSystem } from './CareSystem';
import type { FoodChoice, PlayChoice, RequestType } from './care-types';
import { getStatusDisplayValues } from './status-display';

const labels: Record<RequestType, { icon: string; text: string }> = {
  food: { icon: '🍽️', text: 'なにか食べたいな' },
  play: { icon: '⚽', text: 'いっしょに遊びたい！' },
  sleep: { icon: '💤', text: 'ちょっと眠たいな' },
  pet: { icon: '💗', text: '撫でてほしいな' },
  tart: { icon: '🥧', text: 'タルトが食べたいみたい' },
  'sick-warm': { icon: '🥶', text: '寒そうにしている……' },
  'sick-rest': { icon: '🤒', text: 'ゆっくり休みたいみたい' },
  'sick-meal': { icon: '🥣', text: '胃にやさしいものが食べたいみたい' },
};
const choiceLabels = {
  vegetable: { icon: '🥦', text: '野菜が食べたいみたい' }, sweet: { icon: '🍰', text: '甘いものが食べたいみたい' }, meat: { icon: '🍖', text: '肉が食べたいみたい' }, tart: { icon: '🥧', text: 'タルトが食べたいみたい' },
  ball: { icon: '⚽', text: 'ボールで遊びたいみたい' }, rattle: { icon: '🪇', text: 'ガラガラで遊びたいみたい' }, book: { icon: '📖', text: '絵本を読んでほしいみたい' },
  rest: { icon: '💤', text: 'ゆっくり休みたいみたい' }, warm: { icon: '🧣', text: 'あたためてほしいみたい' },
} as const;

export class CareUI {
  private readonly panel = document.querySelector<HTMLElement>('#care-panel')!;
  private readonly requestBubble = document.querySelector<HTMLElement>('#request-bubble')!;
  private readonly message = document.querySelector<HTMLElement>('#message')!;
  private messageTimer = 0;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly care: CareSystem, private readonly getCharacterName: () => string = () => 'この子') {
    document.querySelector<HTMLButtonElement>('#care-button')!.onclick = () => { if (this.panel.hidden) this.openMain(); else this.close(); };
    document.querySelector<HTMLButtonElement>('#care-close')!.onclick = () => this.close();
    document.querySelector<HTMLButtonElement>('#request-open')!.onclick = () => this.openForRequest();
    document.querySelector<HTMLButtonElement>('#request-delay')!.onclick = () => { this.care.delay(); this.close(); };
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
    const values = getStatusDisplayValues(this.care.save.status);
    for (const [key, value] of Object.entries(values)) {
      const row = document.querySelector<HTMLElement>(`[data-status="${key}"]`);
      const bar = row?.querySelector<HTMLElement>('.status-fill');
      if (!row || !bar) continue;
      const percent = Math.round(value);
      bar.style.width = `${percent}%`;
      row.setAttribute('aria-valuenow', String(percent));
    }
  }

  private renderRequest(request: RequestType | null): void {
    this.requestBubble.hidden = !request;
    if (!request) { this.close(); return; }
    const label = labels[request], choice = this.care.requestChoice ? choiceLabels[this.care.requestChoice] : null;
    this.requestBubble.querySelector<HTMLElement>('.request-icon')!.textContent = choice ? `${label.icon}${choice.icon}` : label.icon;
    this.requestBubble.querySelector<HTMLElement>('.request-text')!.textContent = choice?.text ?? label.text;
  }

  private openMain(): void { document.querySelector<HTMLElement>('#map-panel')!.hidden = true; this.care.deferIllnessRequest(); this.renderPanel('お世話', `<button data-menu="food">🍽️ 食事</button><button data-menu="play">🧸 遊び</button><button data-action="rest">💤 休む</button>`); }
  private openForRequest(): void {
    if (this.care.request === 'food' || this.care.request === 'tart' || this.care.request === 'sick-meal') this.openFood();
    else if (this.care.request === 'play') this.openPlay();
    else if (this.care.request === 'sleep') this.renderPanel('眠そう…', `<button data-action="rest">🛏️ 休ませる</button><button data-action="wake">☀️ 起こす</button>`);
    else if (this.care.request === 'pet') this.renderPanel('撫でてほしそう', `<p class="care-hint">${this.getCharacterName()}の上を指で撫でてね</p>`);
    else if (this.care.request === 'sick-warm') this.renderPanel('寒そう……', `<button data-action="warm">🧣 あたためる</button><button data-action="cool">🧊 冷やす</button>`);
    else if (this.care.request === 'sick-rest') this.renderPanel('眠そう……', `<button data-action="rest">🛏️ 休ませる</button><button data-action="wake">☀️ 起こす</button>`);
  }
  private openFood(): void { this.renderPanel('なにを食べる？', `<button data-food="vegetable">🥦 野菜</button><button data-food="sweet">🍰 甘いもの</button><button data-food="meat">🍖 肉</button>${this.care.request === 'tart' ? '<button class="rare-food" data-food="tart">🥧 タルト</button>' : ''}`); }
  private openPlay(): void { this.renderPanel('なにして遊ぶ？', `<button data-play="ball">⚽ ボール</button><button data-play="rattle">🪇 ガラガラ</button><button data-play="book">📖 絵本</button>`); }
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
    if (button.dataset.action === 'warm') { this.care.warm(); this.close(); }
    if (button.dataset.action === 'cool') { this.care.cool(); this.close(); }
    if (button.dataset.action === 'wake') { this.care.wake(); this.close(); }
    if (button.dataset.action === 'delay') { this.care.delay(); this.close(); }
  };

  private showMessage(text: string): void {
    this.message.textContent = text;
    clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => { this.message.textContent = `${this.getCharacterName()}は、のんびり過ごしています`; }, 2600);
  }
}
