import type { APIRoute } from "astro";
import type { GenerateRequest, GenerateResponse, SocialMediaPlatform } from "../../types/index.js";
import { validateTranscript, validateVideoDuration } from "../../utils/validation.js";
import { AIProviderManager } from "../../utils/ai-providers.js";
import { PromptFactory } from "../../utils/prompt-factory.js";
import { ResponseParser } from "../../utils/response-parser.js";

// Initialize AI providers
const GOOGLE_GEMINI_API_KEY = import.meta.env.GOOGLE_GEMINI_API_KEY;
const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY;

let aiProviderManager: AIProviderManager;

try {
  aiProviderManager = new AIProviderManager(GOOGLE_GEMINI_API_KEY, ANTHROPIC_API_KEY);
} catch (error) {
  console.error('Failed to initialize AI providers:', error);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate AI providers are available
    if (!aiProviderManager) {
      return createErrorResponse(
        "AI-Dienste nicht verfügbar. Bitte überprüfen Sie die API-Konfiguration.",
        503
      );
    }

    // Parse and validate request
    const body = await parseAndValidateRequest(request);
    if ('error' in body) {
      return body.error;
    }

    const { type = "youtube", videoDuration, keywords } = body;
    let { transcript } = body;
    let transcriptCleaned = false;

    // Clean transcript: Remove single characters at the end
    const cleanedResult = cleanTranscript(transcript);
    transcript = cleanedResult.transcript;
    transcriptCleaned = cleanedResult.cleaned;

    // Create prompt for the specified platform
    const prompt = PromptFactory.createPrompt(type, transcript, {
      videoDuration,
      keywords,
    });

    // Generate content using AI providers
    const { text, model } = await aiProviderManager.generateContent(prompt);

    // Parse the response based on platform
    const parsedResponse = ResponseParser.parseResponse(type, text);

    // Create final response
    const responseData: GenerateResponse = {
      ...parsedResponse,
      transcriptCleaned,
      modelUsed: model,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Unerwarteter Fehler:", error);

    if (error.message?.includes('All AI providers failed')) {
      return createErrorResponse(
        "Inhaltsgenerierung fehlgeschlagen",
        503,
        error.message
      );
    }

    return createErrorResponse(
      "Unerwarteter Fehler beim Generieren des Inhalts",
      500,
      error.message
    );
  }
};

async function parseAndValidateRequest(
  request: Request
): Promise<GenerateRequest | { error: Response }> {
  let body: GenerateRequest;

  try {
    body = await request.json() as GenerateRequest;
  } catch {
    return {
      error: createErrorResponse("Ungültige JSON-Anfrage", 400)
    };
  }

  // Validate transcript
  const transcriptError = validateTranscript(body.transcript);
  if (transcriptError) {
    return {
      error: createErrorResponse(transcriptError, 400)
    };
  }

  // Validate type
  const validTypes: SocialMediaPlatform[] = [
    "youtube", "linkedin", "twitter", "instagram", "tiktok", "keywords"
  ];

  if (body.type && !validTypes.includes(body.type)) {
    return {
      error: createErrorResponse(
        "Ungültiger Typ. Erlaubt sind: " + validTypes.join(", "),
        400
      )
    };
  }

  // Validate video duration if provided
  if (body.videoDuration) {
    const durationError = validateVideoDuration(body.videoDuration);
    if (durationError) {
      return {
        error: createErrorResponse(durationError, 400)
      };
    }
  }

  return body;
}

function cleanTranscript(transcript: string): { transcript: string; cleaned: boolean } {
  const words = transcript.trim().split(/\s+/);
  if (words.length > 0 && words[words.length - 1].length === 1) {
    words.pop();
    const cleanedTranscript = words.join(" ");
    console.log("Ein einzelnes Zeichen am Ende des Transkripts wurde entfernt.");
    return { transcript: cleanedTranscript, cleaned: true };
  }
  return { transcript, cleaned: false };
}

function createErrorResponse(
  message: string,
  status: number,
  details?: string
): Response {
  const errorData: any = { error: message };
  if (details) {
    errorData.details = details;
  }

  return new Response(JSON.stringify(errorData), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
