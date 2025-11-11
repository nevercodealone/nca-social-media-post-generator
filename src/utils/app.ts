import type { SocialMediaPlatform } from "../types/index.js";
import { VALIDATION_LIMITS, UI_MESSAGES, ERROR_MESSAGES } from "../config/constants.js";
import { validateTranscript, validateVideoDuration } from "./validation.js";
import { generateContent, detectKeywords, ApiError } from "./api.js";
import { KeywordManager } from "./keywords.js";
import { PlatformManager } from "./platform.js";
import {
  getElement,
  hideElement,
  showElement,
  setTextContent,
  displayError,
  hideError,
  copyToClipboard,
} from "./dom.js";

export class SocialMediaApp {
  private keywordManager: KeywordManager;
  private platformManager: PlatformManager;
  private sharedTranscript: HTMLTextAreaElement;
  private detectKeywordsBtn: HTMLButtonElement;
  private clearKeywordsBtn: HTMLButtonElement;
  private setKeywordsBtn: HTMLButtonElement;
  private keywordInput: HTMLInputElement;
  private stepKeywords: HTMLElement;
  private stepSocial: HTMLElement;
  private errorDiv: HTMLElement;
  private errorMessage: HTMLElement;

  constructor() {
    this.keywordManager = new KeywordManager();
    this.platformManager = new PlatformManager();
    this.initializeElements();
    this.setupEventListeners();
    this.updateFlowState();
  }

  private initializeElements(): void {
    this.sharedTranscript = getElement<HTMLTextAreaElement>("shared-transcript");
    this.detectKeywordsBtn = getElement<HTMLButtonElement>("detect-keywords-btn");
    this.clearKeywordsBtn = getElement<HTMLButtonElement>("clear-keywords-btn");
    this.setKeywordsBtn = getElement<HTMLButtonElement>("set-keywords-btn");
    this.keywordInput = getElement<HTMLInputElement>("keyword-input");
    this.stepKeywords = getElement("step-keywords");
    this.stepSocial = getElement("step-social");
    this.errorDiv = getElement("error");
    this.errorMessage = getElement("error-message");
  }

  private setupEventListeners(): void {
    // Transcript input monitoring
    this.sharedTranscript.addEventListener("input", () => {
      this.handleTranscriptChange();
    });

    // Keyword detection
    this.detectKeywordsBtn.addEventListener("click", () => {
      this.handleKeywordDetection();
    });

    // Keyword management
    this.clearKeywordsBtn.addEventListener("click", () => {
      this.keywordManager.clearKeywords();
      this.updateFlowState();
    });

    this.setKeywordsBtn.addEventListener("click", () => {
      this.keywordManager.confirmKeywords();
      this.updateFlowState();
    });

    // Keyword input
    this.keywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const keyword = this.keywordInput.value;
        if (this.keywordManager.addKeyword(keyword)) {
          this.keywordInput.value = "";
        }
      }
    });

    // Form submissions
    this.setupFormListeners();

    // Copy buttons
    this.setupCopyListeners();
  }

  private setupFormListeners(): void {
    const platforms: SocialMediaPlatform[] = [
      "youtube",
      "linkedin",
      "twitter",
      "instagram",
      "tiktok",
    ];

    platforms.forEach((platform) => {
      const form = getElement<HTMLFormElement>(`${this.getPlatformPrefix(platform)}-form`);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmission(platform, form);
      });
    });
  }

  private setupCopyListeners(): void {
    // YouTube copy buttons
    const copyTranscriptBtn = getElement("copy-transcript-btn");
    const copyTitleBtn = getElement("copy-title-btn");
    const copyDescriptionBtn = getElement("copy-description-btn");
    const copyTimestampsBtn = getElement("copy-timestamps-btn");

    copyTranscriptBtn.addEventListener("click", () => {
      const transcriptContent = getElement("transcript-content");
      copyToClipboard(transcriptContent, copyTranscriptBtn);
    });

    copyTitleBtn.addEventListener("click", () => {
      const titleContent = getElement("title-content");
      copyToClipboard(titleContent, copyTitleBtn);
    });

    copyDescriptionBtn.addEventListener("click", () => {
      const descriptionContent = getElement("description-content");
      copyToClipboard(descriptionContent, copyDescriptionBtn);
    });

    copyTimestampsBtn.addEventListener("click", () => {
      const timestampsContent = getElement("timestamps-content");
      copyToClipboard(timestampsContent, copyTimestampsBtn);
    });

    // Other platform copy buttons
    const copyLinkedinBtn = getElement("copy-linkedin-btn");
    const copyTwitterBtn = getElement("copy-twitter-btn");
    const copyInstagramBtn = getElement("copy-instagram-btn");
    const copyTiktokBtn = getElement("copy-tiktok-btn");

    copyLinkedinBtn.addEventListener("click", () => {
      const linkedinContentResult = getElement("linkedin-content-result");
      copyToClipboard(linkedinContentResult, copyLinkedinBtn);
    });

    copyTwitterBtn.addEventListener("click", () => {
      const twitterContentResult = getElement("twitter-content-result");
      copyToClipboard(twitterContentResult, copyTwitterBtn);
    });

    copyInstagramBtn.addEventListener("click", () => {
      const instagramContentResult = getElement("instagram-content-result");
      copyToClipboard(instagramContentResult, copyInstagramBtn);
    });

    copyTiktokBtn.addEventListener("click", () => {
      const tiktokContentResult = getElement("tiktok-content-result");
      copyToClipboard(tiktokContentResult, copyTiktokBtn);
    });
  }

  private handleTranscriptChange(): void {
    // Reset the flow when transcript changes
    this.keywordManager.clearKeywords();
    this.updateFlowState();
  }

  private async handleKeywordDetection(): Promise<void> {
    const transcript = this.sharedTranscript.value;
    const transcriptError = validateTranscript(transcript);

    if (transcriptError) {
      displayError(this.errorDiv, this.errorMessage, transcriptError);
      return;
    }

    this.setDetectingState(true);

    try {
      const keywords = await detectKeywords(transcript);
      this.keywordManager.setKeywords(keywords);
      this.updateFlowState();
      hideError(this.errorDiv);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.KEYWORD_DETECTION_FAILED + "Unbekannter Fehler";
      displayError(this.errorDiv, this.errorMessage, message);
      console.error("Keyword detection error:", error);
    } finally {
      this.setDetectingState(false);
    }
  }

  private async handleFormSubmission(
    platform: SocialMediaPlatform,
    form: HTMLFormElement
  ): Promise<void> {
    const transcript = this.sharedTranscript.value;
    const transcriptError = validateTranscript(transcript);

    if (transcriptError) {
      displayError(this.errorDiv, this.errorMessage, transcriptError);
      return;
    }

    const formData = new FormData(form);
    const videoDuration = formData.get("videoDuration") as string;

    // Validate video duration for YouTube
    if (platform === "youtube" && videoDuration) {
      const durationError = validateVideoDuration(videoDuration);
      if (durationError) {
        displayError(this.errorDiv, this.errorMessage, durationError);
        return;
      }
    }

    // Set transcript in hidden form field
    const hiddenTranscript = form.querySelector(
      `#${this.getPlatformPrefix(platform)}-transcript`
    ) as HTMLTextAreaElement;
    if (hiddenTranscript) {
      hiddenTranscript.value = transcript;
    }

    this.platformManager.showLoading(platform);

    try {
      const options: { videoDuration?: string; keywords?: string[] } = {};

      if (videoDuration && videoDuration.trim() !== "") {
        options.videoDuration = videoDuration.trim();
      }

      const keywords = this.keywordManager.getKeywords();
      if (
        keywords.length > 0 &&
        (platform === "youtube" || platform === "linkedin" || platform === "tiktok")
      ) {
        options.keywords = keywords;
      }

      const data = await generateContent(transcript, platform, options);
      this.platformManager.displayResults(platform, data);
      hideError(this.errorDiv);
    } catch (error) {
      this.platformManager.hideLoading();
      const message = error instanceof ApiError ? error.message : ERROR_MESSAGES.GENERATION_FAILED;
      displayError(this.errorDiv, this.errorMessage, message);
      console.error("Generation error:", error);
    }
  }

  private updateFlowState(): void {
    const transcript = this.sharedTranscript.value;
    const transcriptProcessed = transcript && transcript.trim().length > 0;
    const keywordsDetected = this.keywordManager.isDetected();
    const keywordsSet = this.keywordManager.isSet();

    // Step 1: Enable/disable keyword detection
    this.detectKeywordsBtn.disabled = !transcriptProcessed;

    // Step 2: Show/hide keywords section
    if (keywordsDetected) {
      showElement(this.stepKeywords);
      this.keywordInput.disabled = false;
    } else {
      hideElement(this.stepKeywords);
      this.keywordInput.disabled = true;
    }

    // Step 3: Show/hide social media section
    if (keywordsSet) {
      showElement(this.stepSocial);
    } else {
      hideElement(this.stepSocial);
    }
  }

  private setDetectingState(detecting: boolean): void {
    if (detecting) {
      setTextContent(this.detectKeywordsBtn, UI_MESSAGES.DETECTING_KEYWORDS);
      this.detectKeywordsBtn.disabled = true;
    } else {
      setTextContent(this.detectKeywordsBtn, UI_MESSAGES.DETECT_KEYWORDS);
      this.detectKeywordsBtn.disabled = false;
    }
  }

  private getPlatformPrefix(platform: SocialMediaPlatform): string {
    const prefixes: Record<SocialMediaPlatform, string> = {
      youtube: "yt",
      linkedin: "li",
      twitter: "tw",
      instagram: "ig",
      tiktok: "tt",
      keywords: "kw",
    };
    return prefixes[platform];
  }
}
