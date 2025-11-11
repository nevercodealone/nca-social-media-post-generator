import type { SocialMediaPlatform, PlatformConfig } from "../types/index.js";

export const VALIDATION_LIMITS = {
  MAX_KEYWORDS: 3,
} as const;

export const CHARACTER_LIMITS = {
  twitter: 280,
  instagram: { min: 500, max: 800 },
  youtube: { description: 1500 },
  linkedin: { min: 1000, max: 1500 },
  tiktok: { min: 150, max: 300 },
} as const;

// AI Models - configured via environment variables with fallback defaults
const getGoogleModels = (): readonly string[] => {
  const models = import.meta.env.GOOGLE_GEMINI_MODELS;
  if (models) {
    return models.split(",").map((m: string) => m.trim());
  }
  // Default models if not configured
  return ["gemini-2.5-pro", "gemini-2.5-flash"];
};

const getAnthropicModels = (): readonly string[] => {
  const models = import.meta.env.ANTHROPIC_MODELS;
  if (models) {
    return models.split(",").map((m: string) => m.trim());
  }
  // Default models if not configured
  return ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"];
};

export const AI_MODELS = {
  google: getGoogleModels(),
  anthropic: getAnthropicModels(),
} as const;

export const PLATFORM_CONFIGS: Record<SocialMediaPlatform, PlatformConfig> = {
  youtube: {
    name: "YouTube",
    endpoint: "youtube",
    spinner: "youtube-spinner",
    result: "yt-result",
    color: {
      primary: "red-600",
      secondary: "red-700",
    },
  },
  linkedin: {
    name: "LinkedIn",
    endpoint: "linkedin",
    spinner: "linkedin-spinner",
    result: "li-result",
    color: {
      primary: "blue-600",
      secondary: "blue-700",
    },
  },
  twitter: {
    name: "Twitter",
    endpoint: "twitter",
    spinner: "twitter-spinner",
    result: "tw-result",
    color: {
      primary: "black",
      secondary: "gray-800",
    },
    characterLimits: {
      max: CHARACTER_LIMITS.twitter,
    },
  },
  instagram: {
    name: "Instagram",
    endpoint: "instagram",
    spinner: "instagram-spinner",
    result: "ig-result",
    color: {
      primary: "pink-500",
      secondary: "pink-600",
    },
    characterLimits: CHARACTER_LIMITS.instagram,
  },
  tiktok: {
    name: "TikTok",
    endpoint: "tiktok",
    spinner: "tiktok-spinner",
    result: "tt-result",
    color: {
      primary: "black",
      secondary: "gray-800",
    },
    characterLimits: CHARACTER_LIMITS.tiktok,
  },
  keywords: {
    name: "Keywords",
    endpoint: "keywords",
    spinner: "",
    result: "",
    color: {
      primary: "indigo-600",
      secondary: "indigo-700",
    },
  },
} as const;

export const ERROR_MESSAGES = {
  INVALID_TRANSCRIPT: "Bitte gib ein gültiges Transkript ein.",
  INVALID_DURATION: "Bitte gib die Video-Dauer im Format MM:SS ein (z.B. 7:16).",
  GENERATION_FAILED: "Ein Fehler ist beim Generieren des Inhalts aufgetreten.",
  COPY_FAILED: "Text konnte nicht kopiert werden.",
  KEYWORD_DETECTION_FAILED: "Fehler beim Erkennen der Keywords: ",
  NETWORK_ERROR: "Netzwerkfehler. Bitte versuche es erneut.",
} as const;

export const UI_MESSAGES = {
  DETECTING_KEYWORDS: "Erkennt...",
  DETECT_KEYWORDS: "Keywords automatisch erkennen",
  COPIED: "Kopiert!",
  ANALYZING: "Transkript wird analysiert und Content generiert...",
} as const;
