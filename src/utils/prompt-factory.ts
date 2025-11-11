import type { SocialMediaPlatform } from "../types/index.js";
import { PLATFORM_PROMPTS } from "../config/prompts.js";

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
      case "youtube":
        return PLATFORM_PROMPTS.youtube.base(transcript, options.videoDuration, options.keywords);

      case "linkedin":
        return PLATFORM_PROMPTS.linkedin.base(transcript, options.keywords);

      case "twitter":
        return PLATFORM_PROMPTS.twitter.base(transcript);

      case "instagram":
        return PLATFORM_PROMPTS.instagram.base(transcript);

      case "tiktok":
        return PLATFORM_PROMPTS.tiktok.base(transcript, options.keywords);

      case "keywords":
        return PLATFORM_PROMPTS.keywords.base(transcript);

      default:
        throw new Error(`Unsupported platform type: ${type}`);
    }
  }

  // Convenience methods for tests
  createYouTubePrompt(transcript: string, videoDuration?: string, keywords?: string[]): string {
    return PromptFactory.createPrompt("youtube", transcript, { videoDuration, keywords });
  }

  createLinkedInPrompt(transcript: string, keywords?: string[]): string {
    return PromptFactory.createPrompt("linkedin", transcript, { keywords });
  }

  createTwitterPrompt(transcript: string): string {
    return PromptFactory.createPrompt("twitter", transcript);
  }

  createInstagramPrompt(transcript: string): string {
    return PromptFactory.createPrompt("instagram", transcript);
  }

  createTikTokPrompt(transcript: string, keywords?: string[]): string {
    return PromptFactory.createPrompt("tiktok", transcript, { keywords });
  }

  createKeywordsPrompt(transcript: string): string {
    return PromptFactory.createPrompt("keywords", transcript);
  }
}
