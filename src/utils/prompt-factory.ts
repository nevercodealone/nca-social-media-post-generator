import type { SocialMediaPlatform } from '../types/index.js';
import { PLATFORM_PROMPTS } from '../config/prompts.js';

export class PromptFactory {
  static createPrompt(
    type: SocialMediaPlatform,
    transcript: string,
    options: {
      videoDuration?: string;
      keywords?: string[];
    } = {}
  ): string {
    switch (type) {
      case 'youtube':
        return PLATFORM_PROMPTS.youtube.base(
          transcript,
          options.videoDuration,
          options.keywords
        );
      
      case 'linkedin':
        return PLATFORM_PROMPTS.linkedin.base(transcript, options.keywords);
      
      case 'twitter':
        return PLATFORM_PROMPTS.twitter.base(transcript);
      
      case 'instagram':
        return PLATFORM_PROMPTS.instagram.base(transcript);
      
      case 'tiktok':
        return PLATFORM_PROMPTS.tiktok.base(transcript, options.keywords);
      
      case 'keywords':
        return PLATFORM_PROMPTS.keywords.base(transcript);
      
      default:
        throw new Error(`Unsupported platform type: ${type}`);
    }
  }
}