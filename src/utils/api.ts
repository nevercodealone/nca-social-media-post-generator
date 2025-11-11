import type { GenerateRequest, GenerateResponse, SocialMediaPlatform } from "../types/index.js";
import { ERROR_MESSAGES } from "../config/constants.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function generateContent(
  transcript: string,
  type: SocialMediaPlatform,
  options: {
    videoDuration?: string;
    keywords?: string[];
  } = {}
): Promise<GenerateResponse> {
  const requestData: GenerateRequest = {
    transcript,
    type,
    ...options,
  };

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || ERROR_MESSAGES.GENERATION_FAILED,
        response.status,
        errorData.details
      );
    }

    const data = await response.json();
    return data as GenerateResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
    }

    throw new ApiError(error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED);
  }
}

export async function detectKeywords(transcript: string): Promise<string[]> {
  try {
    const response = await generateContent(transcript, "keywords");
    return response.keywords || [];
  } catch (error) {
    const message =
      error instanceof ApiError
        ? ERROR_MESSAGES.KEYWORD_DETECTION_FAILED + error.message
        : ERROR_MESSAGES.KEYWORD_DETECTION_FAILED + "Unbekannter Fehler";
    throw new ApiError(message);
  }
}
