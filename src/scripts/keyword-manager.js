import { VALIDATION_LIMITS } from "./types.js";
import { getElement, createKeywordTag, clearContainer, setTextContent } from "./utils.js";

export class KeywordManager {
  constructor() {
    this.state = {
      keywords: [],
      maxKeywords: VALIDATION_LIMITS.MAX_KEYWORDS,
      detected: false,
      set: false,
    };

    this.keywordsList = getElement("keywords-list");
    this.keywordCount = getElement("keyword-count");
    this.setKeywordsBtn = getElement("set-keywords-btn");
  }

  getKeywords() {
    return [...this.state.keywords];
  }

  getState() {
    return { ...this.state };
  }

  setKeywords(keywords) {
    this.state.keywords = keywords.slice(0, this.state.maxKeywords);
    this.state.detected = true;
    this.render();
  }

  addKeyword(keyword) {
    const trimmed = keyword.trim().toLowerCase();
    if (
      !trimmed ||
      this.state.keywords.includes(trimmed) ||
      this.state.keywords.length >= this.state.maxKeywords
    ) {
      return false;
    }

    this.state.keywords.push(trimmed);
    this.render();
    return true;
  }

  removeKeyword(index) {
    if (index >= 0 && index < this.state.keywords.length) {
      this.state.keywords.splice(index, 1);
      this.render();
    }
  }

  clearKeywords() {
    this.state.keywords = [];
    this.state.detected = false;
    this.state.set = false;
    this.render();
  }

  confirmKeywords() {
    this.state.set = true;
  }

  isDetected() {
    return this.state.detected;
  }

  isSet() {
    return this.state.set;
  }

  render() {
    clearContainer(this.keywordsList);

    this.state.keywords.forEach((keyword, index) => {
      const tag = createKeywordTag(keyword, index, (idx) => this.removeKeyword(idx));
      this.keywordsList.appendChild(tag);
    });

    this.updateKeywordCount();
    this.updateSetKeywordsButton();
  }

  updateKeywordCount() {
    setTextContent(this.keywordCount, this.state.keywords.length.toString());
  }

  updateSetKeywordsButton() {
    this.setKeywordsBtn.disabled = this.state.keywords.length === 0;
  }
}
