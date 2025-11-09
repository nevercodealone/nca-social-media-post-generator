import { PLATFORM_CONFIGS } from './types.js';
import { getElement, hideElement, showElement, setTextContent } from './utils.js';

export class PlatformManager {
  constructor() {
    this.currentPlatform = 'youtube';
    this.tabs = {};
    this.contents = {};
    this.results = {};
    this.spinners = {};

    this.initializeElements();
    this.setupTabListeners();
  }

  initializeElements() {
    // Initialize tabs
    this.tabs.youtube = getElement('youtube-tab');
    this.tabs.linkedin = getElement('linkedin-tab');
    this.tabs.twitter = getElement('twitter-tab');
    this.tabs.instagram = getElement('instagram-tab');
    this.tabs.tiktok = getElement('tiktok-tab');

    // Initialize content areas
    this.contents.youtube = getElement('youtube-content');
    this.contents.linkedin = getElement('linkedin-content');
    this.contents.twitter = getElement('twitter-content');
    this.contents.instagram = getElement('instagram-content');
    this.contents.tiktok = getElement('tiktok-content');

    // Initialize result areas
    this.results.youtube = getElement('yt-result');
    this.results.linkedin = getElement('li-result');
    this.results.twitter = getElement('tw-result');
    this.results.instagram = getElement('ig-result');
    this.results.tiktok = getElement('tt-result');

    // Initialize spinners
    this.spinners.youtube = getElement('youtube-spinner');
    this.spinners.linkedin = getElement('linkedin-spinner');
    this.spinners.twitter = getElement('twitter-spinner');
    this.spinners.instagram = getElement('instagram-spinner');
    this.spinners.tiktok = getElement('tiktok-spinner');
  }

  setupTabListeners() {
    Object.entries(this.tabs).forEach(([platform, tab]) => {
      if (platform !== 'keywords') {
        tab.addEventListener('click', () => {
          this.switchToPlatform(platform);
        });
      }
    });
  }

  switchToPlatform(platform) {
    if (platform === 'keywords') return;

    this.currentPlatform = platform;
    
    // Update tab styles
    Object.entries(this.tabs).forEach(([p, tab]) => {
      if (p === 'keywords') return;
      
      const config = PLATFORM_CONFIGS[p];
      const isActive = p === platform;
      
      // Remove all color classes
      tab.classList.remove(
        'border-b-2', 'text-red-600', 'border-red-600',
        'text-blue-600', 'border-blue-600',
        'text-black', 'border-black',
        'text-pink-600', 'border-pink-600',
        'text-gray-500'
      );
      
      if (isActive) {
        tab.classList.add('border-b-2', `text-${config.color.primary}`, `border-${config.color.primary}`);
      } else {
        tab.classList.add('text-gray-500');
      }
    });

    // Show/hide content areas
    Object.entries(this.contents).forEach(([p, content]) => {
      if (p === 'keywords') return;
      
      if (p === platform) {
        showElement(content);
      } else {
        hideElement(content);
      }
    });

    // Show/hide results
    this.updateResultsVisibility();
  }

  showLoading(platform) {
    const loadingDiv = getElement('loading');
    showElement(loadingDiv);
    
    // Hide all spinners first
    Object.values(this.spinners).forEach(spinner => hideElement(spinner));
    
    // Show the current platform's spinner
    if (this.spinners[platform]) {
      showElement(this.spinners[platform]);
    }
    
    // Hide all results
    Object.values(this.results).forEach(result => hideElement(result));
    
    // Hide error
    const errorDiv = getElement('error');
    hideElement(errorDiv);
  }

  hideLoading() {
    const loadingDiv = getElement('loading');
    hideElement(loadingDiv);
  }

  displayResults(platform, data) {
    this.hideLoading();
    
    const result = this.results[platform];
    if (!result) return;
    
    showElement(result);
    
    // Platform-specific result display
    switch (platform) {
      case 'youtube':
        this.displayYouTubeResults(data);
        break;
      case 'linkedin':
        this.displayLinkedInResults(data);
        break;
      case 'twitter':
        this.displayTwitterResults(data);
        break;
      case 'instagram':
        this.displayInstagramResults(data);
        break;
      case 'tiktok':
        this.displayTikTokResults(data);
        break;
    }
    
    // Show copy buttons
    const copyButtons = getElement(`${this.getPlatformPrefix(platform)}-copy-buttons`);
    showElement(copyButtons);
  }

  displayYouTubeResults(data) {
    const transcriptContent = getElement('transcript-content');
    const titleContent = getElement('title-content');
    const descriptionContent = getElement('description-content');
    const timestampsSection = getElement('timestamps-section');
    const timestampsContent = getElement('timestamps-content');
    const copyTimestampsBtn = getElement('copy-timestamps-btn');
    const transcriptCleaned = getElement('transcript-cleaned');
    const modelName = getElement('model-name');

    setTextContent(transcriptContent, data.transcript || '');
    setTextContent(titleContent, data.title || '');
    setTextContent(descriptionContent, data.description || '');

    if (data.timestamps) {
      setTextContent(timestampsContent, data.timestamps);
      showElement(timestampsSection);
      showElement(copyTimestampsBtn);
    } else {
      hideElement(timestampsSection);
      hideElement(copyTimestampsBtn);
    }

    if (data.transcriptCleaned) {
      showElement(transcriptCleaned);
    }

    if (data.modelUsed) {
      setTextContent(modelName, data.modelUsed);
    }
  }

  displayLinkedInResults(data) {
    const linkedinContentResult = getElement('linkedin-content-result');
    const liModelName = getElement('li-model-name');

    setTextContent(linkedinContentResult, data.linkedinPost || '');
    
    if (data.modelUsed) {
      setTextContent(liModelName, data.modelUsed);
    }
  }

  displayTwitterResults(data) {
    const twitterContentResult = getElement('twitter-content-result');
    const twModelName = getElement('tw-model-name');

    setTextContent(twitterContentResult, data.twitterPost || '');
    
    if (data.modelUsed) {
      setTextContent(twModelName, data.modelUsed);
    }
  }

  displayInstagramResults(data) {
    const instagramContentResult = getElement('instagram-content-result');
    const igModelName = getElement('ig-model-name');

    setTextContent(instagramContentResult, data.instagramPost || '');
    
    if (data.modelUsed) {
      setTextContent(igModelName, data.modelUsed);
    }
  }

  displayTikTokResults(data) {
    const tiktokContentResult = getElement('tiktok-content-result');
    const ttModelName = getElement('tt-model-name');

    setTextContent(tiktokContentResult, data.tiktokPost || '');
    
    if (data.modelUsed) {
      setTextContent(ttModelName, data.modelUsed);
    }
  }

  updateResultsVisibility() {
    Object.entries(this.results).forEach(([platform, result]) => {
      if (platform === this.currentPlatform) {
        const hasContent = this.hasResultContent(platform);
        if (hasContent) {
          showElement(result);
        } else {
          hideElement(result);
        }
      } else {
        hideElement(result);
      }
    });
  }

  hasResultContent(platform) {
    switch (platform) {
      case 'youtube':
        const titleContent = getElement('title-content');
        const descriptionContent = getElement('description-content');
        return !!(titleContent.textContent || descriptionContent.textContent);
      
      case 'linkedin':
        const linkedinContentResult = getElement('linkedin-content-result');
        return !!linkedinContentResult.textContent;
      
      case 'twitter':
        const twitterContentResult = getElement('twitter-content-result');
        return !!twitterContentResult.textContent;
      
      case 'instagram':
        const instagramContentResult = getElement('instagram-content-result');
        return !!instagramContentResult.textContent;
      
      case 'tiktok':
        const tiktokContentResult = getElement('tiktok-content-result');
        return !!tiktokContentResult.textContent;
      
      default:
        return false;
    }
  }

  getPlatformPrefix(platform) {
    const prefixes = {
      youtube: 'yt',
      linkedin: 'li',
      twitter: 'tw',
      instagram: 'ig',
      tiktok: 'tt',
      keywords: 'kw'
    };
    return prefixes[platform];
  }

  getCurrentPlatform() {
    return this.currentPlatform;
  }
}