import type { APIRoute } from "astro";
import type { GenerateRequest, GenerateResponse, SocialMediaPlatform } from "../../types/index.js";
import { validateTranscript, validateVideoDuration } from "../../utils/validation.js";
import { GoogleGeminiProvider } from "../../utils/ai-providers.js";
import { ChatPrompts } from "../../config/chat-prompts.js";
import { ResponseParser } from "../../utils/response-parser.js";

const GOOGLE_GEMINI_API_KEY = import.meta.env.GOOGLE_GEMINI_API_KEY;

let geminiProvider: GoogleGeminiProvider;

// Chat session state: persists across requests for the same transcript
let chatTranscript: string | null = null;
let chatCorrectedTranscript: string | null = null;
let chatKeywords: string[] = [];
let chatModel: string = "";

try {
  if (GOOGLE_GEMINI_API_KEY) {
    geminiProvider = new GoogleGeminiProvider(GOOGLE_GEMINI_API_KEY);
  }
} catch (error) {
  console.error("Failed to initialize AI providers:", error);
}

/**
 * Ensures a chat session exists for the given transcript.
 * On first call: starts chat, corrects transcript, extracts keywords.
 * On subsequent calls with same transcript: reuses existing session.
 */
async function ensureChatSession(transcript: string): Promise<void> {
  if (chatTranscript === transcript && chatCorrectedTranscript) {
    // Same transcript, chat session already initialized
    return;
  }

  // New transcript — start fresh chat session
  geminiProvider.startChatSession();

  const initialMessage = ChatPrompts.createInitialMessage(transcript);
  const { text: initialText, model } = await geminiProvider.sendChatMessage(initialMessage);

  const transcriptResult = ResponseParser.parseResponse("youtube", initialText);
  const keywordResult = ResponseParser.parseResponse("keywords", initialText);

  chatTranscript = transcript;
  chatCorrectedTranscript = transcriptResult.transcript || transcript;
  chatKeywords = keywordResult.keywords || [];
  chatModel = model;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!geminiProvider) {
      return createErrorResponse(
        "AI-Dienste nicht verfügbar. Bitte überprüfen Sie die API-Konfiguration.",
        503
      );
    }

    // Parse and validate request
    const body = await parseAndValidateRequest(request);
    if ("error" in body) {
      return body.error;
    }

    const { type = "youtube", videoDuration, keywords } = body;
    let { transcript } = body;
    let transcriptCleaned = false;

    // Clean transcript: Remove single characters at the end
    const cleanedResult = cleanTranscript(transcript);
    transcript = cleanedResult.transcript;
    transcriptCleaned = cleanedResult.cleaned;

    // For keywords type: initialize chat session and return corrected keywords
    if (type === "keywords") {
      await ensureChatSession(transcript);
      return new Response(
        JSON.stringify({
          keywords: chatKeywords,
          transcriptCleaned,
          modelUsed: chatModel,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // For platform types: ensure chat session exists, then generate via chat
    await ensureChatSession(transcript);

    const platformMessage = ChatPrompts.createPlatformMessage(
      type as "youtube" | "linkedin" | "twitter" | "instagram" | "tiktok",
      { videoDuration }
    );
    const { text, model } = await geminiProvider.sendChatMessage(platformMessage);

    // Parse the response based on platform
    const parsedResponse = ResponseParser.parseResponse(type, text);

    // Validate that the response contains meaningful content
    const validationError = ResponseParser.validateResponse(type, parsedResponse);
    if (validationError) {
      return createErrorResponse(
        "AI-Antwort enthält keine gültigen Inhalte",
        502,
        validationError
      );
    }

    // For YouTube: use the corrected transcript from the chat session
    if (type === "youtube") {
      parsedResponse.transcript = chatCorrectedTranscript || undefined;
    }

    // Create final response
    const responseData: GenerateResponse = {
      ...parsedResponse,
      transcriptCleaned,
      modelUsed: model,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Unerwarteter Fehler:", error);

    if (error.message?.includes("All AI providers failed") || error.message?.includes("Chat session")) {
      return createErrorResponse("Inhaltsgenerierung fehlgeschlagen", 503, error.message);
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
    body = (await request.json()) as GenerateRequest;
  } catch {
    return {
      error: createErrorResponse("Ungültige JSON-Anfrage", 400),
    };
  }

  // Validate transcript
  const transcriptError = validateTranscript(body.transcript);
  if (transcriptError) {
    return {
      error: createErrorResponse(transcriptError, 400),
    };
  }

  // Validate type
  const validTypes: SocialMediaPlatform[] = [
    "youtube",
    "linkedin",
    "twitter",
    "instagram",
    "tiktok",
    "keywords",
  ];

  if (body.type && !validTypes.includes(body.type)) {
    return {
      error: createErrorResponse("Ungültiger Typ. Erlaubt sind: " + validTypes.join(", "), 400),
    };
  }

  // Validate video duration if provided
  if (body.videoDuration) {
    const durationError = validateVideoDuration(body.videoDuration);
    if (durationError) {
      return {
        error: createErrorResponse(durationError, 400),
      };
    }
  }

  return body;
}

function cleanTranscript(transcript: string): { transcript: string; cleaned: boolean } {
  const words = transcript.trim().split(/\s+/);
  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    if (lastWord.length === 1 || /^[A-Za-z]\.$/.test(lastWord)) {
      words.pop();
      const cleanedTranscript = words.join(" ");
      console.log("Einzelnes Zeichen/Abkürzung am Ende des Transkripts wurde entfernt.");
      return { transcript: cleanedTranscript, cleaned: true };
    }
  }
  return { transcript, cleaned: false };
}

function createErrorResponse(message: string, status: number, details?: string): Response {
  const errorData: any = { error: message };
  if (details) {
    errorData.details = details;
  }

  return new Response(JSON.stringify(errorData), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
