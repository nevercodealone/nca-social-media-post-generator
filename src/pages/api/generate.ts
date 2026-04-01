import type { APIRoute } from "astro";
import type { GenerateRequest, GenerateResponse, SocialMediaPlatform } from "../../types/index.js";
import { validateTranscript, validateVideoDuration } from "../../utils/validation.js";
import { ZaiProvider } from "../../utils/ai-providers.js";
import { ChatPrompts } from "../../config/chat-prompts.js";
import { ResponseParser } from "../../utils/response-parser.js";
import { AI_MODELS } from "../../config/constants.js";

const Z_AI_API_KEY = import.meta.env.Z_AI_API_KEY;

let zaiProvider: ZaiProvider;

// Chat session state: persists across requests for the same transcript
let chatTranscript: string | null = null;
let chatCorrectedTranscript: string | null = null;
let chatKeywords: string[] = [];
let chatModel: string = "";

try {
  if (Z_AI_API_KEY) {
    zaiProvider = new ZaiProvider(Z_AI_API_KEY);
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
  zaiProvider.startChatSession();

  const initialMessage = ChatPrompts.createInitialMessage(transcript);
  const { text: initialText, model } = await zaiProvider.sendChatMessage(initialMessage);

  const transcriptResult = ResponseParser.parseResponse("youtube", initialText);
  const keywordResult = ResponseParser.parseResponse("keywords", initialText);

  chatTranscript = transcript;
  chatCorrectedTranscript = transcriptResult.transcript || transcript;
  chatKeywords = keywordResult.keywords || [];
  chatModel = model;
}

/**
 * Restarts the chat session on a fallback model and replays initial context.
 * Returns true if fallback succeeded, false if no more models to try.
 */
async function restartChatOnFallbackModel(transcript: string): Promise<boolean> {
  const currentModelIndex = AI_MODELS.zai.indexOf(chatModel);
  const nextModel = AI_MODELS.zai[currentModelIndex + 1];

  if (!nextModel) {
    return false;
  }

  console.warn(`Restarting chat session on fallback model: ${nextModel}`);

  // Force a fresh session by resetting state
  chatTranscript = null;
  chatCorrectedTranscript = null;

  // Create a new provider with the fallback model order
  zaiProvider.startChatSessionWithModel(nextModel);

  const initialMessage = ChatPrompts.createInitialMessage(transcript);
  const { text: initialText, model } = await zaiProvider.sendChatMessage(initialMessage);

  const transcriptResult = ResponseParser.parseResponse("youtube", initialText);
  const keywordResult = ResponseParser.parseResponse("keywords", initialText);

  chatTranscript = transcript;
  chatCorrectedTranscript = transcriptResult.transcript || transcript;
  chatKeywords = keywordResult.keywords || [];
  chatModel = model;

  return true;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!zaiProvider) {
      return createErrorResponse("AI-Dienste nicht verfügbar. Bitte Z_AI_API_KEY prüfen.", 503);
    }

    // Parse and validate request
    const body = await parseAndValidateRequest(request);
    if ("error" in body) {
      return body.error;
    }

    const { type = "youtube", videoDuration } = body;
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

    let text: string;
    let model: string;
    try {
      const result = await zaiProvider.sendChatMessage(platformMessage);
      text = result.text;
      model = result.model;
    } catch (error: any) {
      // If retries exhausted, try fallback model with fresh session
      const is503or429 =
        error.message && /\[503\s|\[429\s|Resource has been exhausted/i.test(error.message);
      if (is503or429 && (await restartChatOnFallbackModel(transcript))) {
        console.warn(`Retrying platform ${type} on fallback model ${chatModel}`);
        const result = await zaiProvider.sendChatMessage(platformMessage);
        text = result.text;
        model = result.model;
      } else {
        throw error;
      }
    }

    // Parse the response based on platform
    const parsedResponse = ResponseParser.parseResponse(type, text);

    // Validate that the response contains meaningful content
    const validationError = ResponseParser.validateResponse(type, parsedResponse);
    if (validationError) {
      return createErrorResponse("AI-Antwort enthält keine gültigen Inhalte", 502, validationError);
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

    if (
      error.message?.includes("All AI providers failed") ||
      error.message?.includes("Chat session")
    ) {
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
