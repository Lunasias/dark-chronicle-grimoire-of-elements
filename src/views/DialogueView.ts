import { DialogueLine } from '../types';
import { sounds } from '../audio';
import { getPortraitSVG } from '../portraits';

export class DialogueView {
  private container: HTMLElement;
  private script: DialogueLine[] = [];
  private currentIndex: number = 0;
  private onFinished?: () => void;

  constructor(container: HTMLElement, script: DialogueLine[], onFinished?: () => void) {
    this.container = container;
    this.script = script;
    this.onFinished = onFinished;
    this.render();
  }

  public setScript(script: DialogueLine[]) {
    this.script = script;
    this.currentIndex = 0;
    this.render();
  }

  public next() {
    if (this.currentIndex < this.script.length - 1) {
      this.currentIndex++;
      sounds.playClick();
      this.render();
    } else {
      sounds.playClick();
      this.onFinished?.();
    }
  }

  public render() {
    const line = this.script[this.currentIndex];
    if (!line) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="vn-dialogue-overlay" id="vn-box">
        <div class="vn-bust-container">
          ${getPortraitSVG(line.portraitKey)}
        </div>
        <div class="vn-speech-box">
          <div class="vn-speaker-tag">${line.speaker} <span class="vn-speaker-th">(${line.speakerTh})</span></div>
          <div class="vn-text-content">
            <p class="vn-en-text">"${line.text}"</p>
            <p class="vn-th-text">${line.textTh}</p>
          </div>
          <div class="vn-prompt-indicator">▼ Click or Press Space to continue (${this.currentIndex + 1}/${this.script.length})</div>
        </div>
      </div>
    `;

    const box = this.container.querySelector('#vn-box');
    box?.addEventListener('click', () => this.next());
  }
}
