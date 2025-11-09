import type { KeywordState } from '../types/index.js';
import { VALIDATION_LIMITS } from '../config/constants.js';
import { getElement, createKeywordTag, clearContainer, setTextContent } from './dom.js';

export class KeywordManager {
  private state: KeywordState = {
    keywords: [],
    maxKeywords: VALIDATION_LIMITS.MAX_KEYWORDS,
    detected: false,
    set: false
  };

  private keywordsList: HTMLElement;
  private keywordCount: HTMLElement;
  private setKeywordsBtn: HTMLButtonElement;

  constructor() {
    this.keywordsList = getElement('keywords-list');
    this.keywordCount = getElement('keyword-count');
    this.setKeywordsBtn = getElement<HTMLButtonElement>('set-keywords-btn');
  }

  getKeywords(): string[] {
    return [...this.state.keywords];
  }

  getState(): KeywordState {
    return { ...this.state };
  }

  setKeywords(keywords: string[]): void {
    this.state.keywords = keywords.slice(0, this.state.maxKeywords);
    this.state.detected = true;
    this.render();
  }

  addKeyword(keyword: string): boolean {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || this.state.keywords.includes(trimmed) || this.state.keywords.length >= this.state.maxKeywords) {
      return false;
    }
    
    this.state.keywords.push(trimmed);
    this.render();
    return true;
  }

  removeKeyword(index: number): void {
    if (index >= 0 && index < this.state.keywords.length) {
      this.state.keywords.splice(index, 1);
      this.render();
    }
  }

  clearKeywords(): void {
    this.state.keywords = [];
    this.state.detected = false;
    this.state.set = false;
    this.render();
  }

  confirmKeywords(): void {
    this.state.set = true;
  }

  isDetected(): boolean {
    return this.state.detected;
  }

  isSet(): boolean {
    return this.state.set;
  }

  private render(): void {
    clearContainer(this.keywordsList);
    
    this.state.keywords.forEach((keyword, index) => {
      const tag = createKeywordTag(keyword, index, (idx) => this.removeKeyword(idx));
      this.keywordsList.appendChild(tag);
    });
    
    this.updateKeywordCount();
    this.updateSetKeywordsButton();
  }

  private updateKeywordCount(): void {
    setTextContent(this.keywordCount, this.state.keywords.length.toString());
  }

  private updateSetKeywordsButton(): void {
    this.setKeywordsBtn.disabled = this.state.keywords.length === 0;
  }
}