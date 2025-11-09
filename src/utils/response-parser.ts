import type { SocialMediaPlatform, GenerateResponse } from '../types/index.js';

export class ResponseParser {
  static parseResponse(type: SocialMediaPlatform, text: string): Partial<GenerateResponse> {
    switch (type) {
      case 'youtube':
        return this.parseYoutubeResponse(text);
      case 'linkedin':
        return this.parseLinkedinResponse(text);
      case 'twitter':
        return this.parseTwitterResponse(text);
      case 'instagram':
        return this.parseInstagramResponse(text);
      case 'tiktok':
        return this.parseTiktokResponse(text);
      case 'keywords':
        return this.parseKeywordsResponse(text);
      default:
        throw new Error(`Unsupported platform type: ${type}`);
    }
  }

  private static parseYoutubeResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      transcript: '',
      title: '',
      description: '',
    };

    // Extract transcript
    const transcriptMatch = text.match(/TRANSCRIPT:\s*([\s\S]*?)(?=TITLE:|$)/);
    if (transcriptMatch?.[1]) {
      result.transcript = transcriptMatch[1].trim();
    }

    // Extract title
    const titleMatch = text.match(/TITLE:\s*([\s\S]*?)(?=DESCRIPTION:|$)/);
    if (titleMatch?.[1]) {
      result.title = titleMatch[1].trim();
    }

    // Extract description
    const descriptionMatch = text.match(/DESCRIPTION:\s*([\s\S]*?)(?=TIMESTAMPS:|$)/);
    if (descriptionMatch?.[1]) {
      result.description = descriptionMatch[1].trim();
    }

    // Extract timestamps (if present)
    const timestampsMatch = text.match(/TIMESTAMPS:\s*([\s\S]*?)(?=$)/);
    if (timestampsMatch?.[1]) {
      result.timestamps = timestampsMatch[1].trim();
    }

    return result;
  }

  private static parseLinkedinResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      linkedinPost: '',
    };

    // Extract LinkedIn post
    const linkedinMatch = text.match(/LINKEDIN POST:\s*([\s\S]*?)(?=$)/);
    if (linkedinMatch?.[1]) {
      result.linkedinPost = linkedinMatch[1].trim();
    }

    return result;
  }

  private static parseTwitterResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      twitterPost: '',
    };

    // Extract Twitter post
    const twitterMatch = text.match(/TWITTER POST:\s*([\s\S]*?)(?=$)/);
    if (twitterMatch?.[1]) {
      result.twitterPost = twitterMatch[1].trim();
    }

    return result;
  }

  private static parseInstagramResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      instagramPost: '',
    };

    // Extract Instagram post
    const instagramMatch = text.match(/INSTAGRAM POST:\s*([\s\S]*?)(?=$)/);
    if (instagramMatch?.[1]) {
      result.instagramPost = instagramMatch[1].trim();
    }

    return result;
  }

  private static parseTiktokResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      tiktokPost: '',
    };

    // Extract TikTok post
    const tiktokMatch = text.match(/TIKTOK POST:\s*([\s\S]*?)(?=$)/);
    if (tiktokMatch?.[1]) {
      result.tiktokPost = tiktokMatch[1].trim();
    }

    return result;
  }

  private static parseKeywordsResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      keywords: [],
    };

    // Extract keywords
    const keywordsMatch = text.match(/KEYWORDS:\s*([\s\S]*?)(?=$)/);
    if (keywordsMatch?.[1]) {
      const keywordsText = keywordsMatch[1].trim();
      const keywords = keywordsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 3); // Ensure max 3 keywords

      result.keywords = keywords;
    }

    return result;
  }
}