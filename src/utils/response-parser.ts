import type { SocialMediaPlatform, GenerateResponse } from "../types/index.js";

// Pre-compiled regex patterns for AI response parsing (avoid recompilation per request)
const HASHTAG_PATTERN = /#[a-zA-Z0-9_äöüÄÖÜß]+/g;

/**
 * Normalizes all hashtags in text to lowercase
 * e.g., "#VibeCoding #JavaScript" → "#vibecoding #javascript"
 */
function normalizeHashtags(text: string): string {
  return text.replace(HASHTAG_PATTERN, (hashtag) => hashtag.toLowerCase());
}

const PATTERNS = {
  // YouTube sections
  transcript: /TRANSCRIPT:\s*([\s\S]*?)(?=TITLE:|$)/,
  title: /TITLE:\s*([\s\S]*?)(?=DESCRIPTION:|$)/,
  description: /DESCRIPTION:\s*([\s\S]*?)(?=TIMESTAMPS:|$)/,
  timestamps: /TIMESTAMPS:\s*([\s\S]*?)(?=$)/,
  // Platform-specific posts
  linkedin: /LINKEDIN POST:\s*([\s\S]*?)(?=$)/,
  twitter: /TWITTER POST:\s*([\s\S]*?)(?=$)/,
  instagram: /INSTAGRAM POST:\s*([\s\S]*?)(?=$)/,
  tiktok: /TIKTOK POST:\s*([\s\S]*?)(?=$)/,
  keywords: /KEYWORDS:\s*([\s\S]*?)(?=$)/,
} as const;

export class ResponseParser {
  /**
   * Validates that a parsed response contains meaningful content
   * Returns an error message if validation fails, null if valid
   */
  static validateResponse(type: SocialMediaPlatform, response: Partial<GenerateResponse>): string | null {
    switch (type) {
      case "youtube":
        if (!response.title?.trim() || !response.description?.trim()) {
          return "AI response missing required YouTube content (title or description)";
        }
        break;
      case "linkedin":
        if (!response.linkedinPost?.trim()) {
          return "AI response missing LinkedIn post content";
        }
        break;
      case "twitter":
        if (!response.twitterPost?.trim()) {
          return "AI response missing Twitter post content";
        }
        break;
      case "instagram":
        if (!response.instagramPost?.trim()) {
          return "AI response missing Instagram post content";
        }
        break;
      case "tiktok":
        if (!response.tiktokPost?.trim()) {
          return "AI response missing TikTok post content";
        }
        break;
      case "keywords":
        if (!response.keywords || response.keywords.length === 0) {
          return "AI response missing keywords";
        }
        break;
    }
    return null;
  }

  static parseResponse(type: SocialMediaPlatform, text: string): Partial<GenerateResponse> {
    switch (type) {
      case "youtube":
        return this.parseYoutubeResponse(text);
      case "linkedin":
        return this.parseLinkedinResponse(text);
      case "twitter":
        return this.parseTwitterResponse(text);
      case "instagram":
        return this.parseInstagramResponse(text);
      case "tiktok":
        return this.parseTiktokResponse(text);
      case "keywords":
        return this.parseKeywordsResponse(text);
      default:
        throw new Error(`Unsupported platform type: ${type}`);
    }
  }

  private static parseYoutubeResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      transcript: "",
      title: "",
      description: "",
    };

    const transcriptMatch = text.match(PATTERNS.transcript);
    if (transcriptMatch?.[1]) {
      result.transcript = transcriptMatch[1].trim();
    }

    const titleMatch = text.match(PATTERNS.title);
    if (titleMatch?.[1]) {
      result.title = titleMatch[1].trim();
    }

    const descriptionMatch = text.match(PATTERNS.description);
    if (descriptionMatch?.[1]) {
      result.description = descriptionMatch[1].trim();
    }

    const timestampsMatch = text.match(PATTERNS.timestamps);
    if (timestampsMatch?.[1]) {
      result.timestamps = timestampsMatch[1].trim();
    }

    return result;
  }

  private static parseLinkedinResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      linkedinPost: "",
    };

    const linkedinMatch = text.match(PATTERNS.linkedin);
    if (linkedinMatch?.[1]) {
      result.linkedinPost = normalizeHashtags(linkedinMatch[1].trim());
    }

    return result;
  }

  private static parseTwitterResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      twitterPost: "",
    };

    const twitterMatch = text.match(PATTERNS.twitter);
    if (twitterMatch?.[1]) {
      result.twitterPost = normalizeHashtags(twitterMatch[1].trim());
    }

    return result;
  }

  private static parseInstagramResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      instagramPost: "",
    };

    const instagramMatch = text.match(PATTERNS.instagram);
    if (instagramMatch?.[1]) {
      result.instagramPost = normalizeHashtags(instagramMatch[1].trim());
    }

    return result;
  }

  private static parseTiktokResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      tiktokPost: "",
    };

    const tiktokMatch = text.match(PATTERNS.tiktok);
    if (tiktokMatch?.[1]) {
      result.tiktokPost = normalizeHashtags(tiktokMatch[1].trim());
    }

    return result;
  }

  private static parseKeywordsResponse(text: string): Partial<GenerateResponse> {
    const result: Partial<GenerateResponse> = {
      keywords: [],
    };

    const keywordsMatch = text.match(PATTERNS.keywords);
    if (keywordsMatch?.[1]) {
      const keywordsText = keywordsMatch[1].trim();
      const keywords = keywordsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);

      result.keywords = keywords;
    }

    return result;
  }

  // Instance methods for tests
  parseYouTubeResponse(text: string): Partial<GenerateResponse> {
    return ResponseParser.parseResponse("youtube", text);
  }

  parseLinkedInResponse(text: string): Partial<GenerateResponse> {
    return ResponseParser.parseResponse("linkedin", text);
  }

  parseTwitterResponse(text: string): Partial<GenerateResponse> {
    return ResponseParser.parseResponse("twitter", text);
  }

  parseInstagramResponse(text: string): Partial<GenerateResponse> {
    return ResponseParser.parseResponse("instagram", text);
  }

  parseTikTokResponse(text: string): Partial<GenerateResponse> {
    return ResponseParser.parseResponse("tiktok", text);
  }

  parseKeywordsResponse(text: string): string[] {
    const result = ResponseParser.parseResponse("keywords", text);
    return result.keywords || [];
  }
}
