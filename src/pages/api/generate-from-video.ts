import type { APIRoute } from "astro";
import { validateVideoFile } from "../../utils/validation.js";
import { AIProviderManager, GoogleGeminiProvider } from "../../utils/ai-providers.js";
import { PromptFactory } from "../../utils/prompt-factory.js";
import { ResponseParser } from "../../utils/response-parser.js";

const GOOGLE_GEMINI_API_KEY = import.meta.env.GOOGLE_GEMINI_API_KEY;

let aiProviderManager: AIProviderManager;
let geminiProvider: GoogleGeminiProvider;

try {
  if (GOOGLE_GEMINI_API_KEY) {
    geminiProvider = new GoogleGeminiProvider(GOOGLE_GEMINI_API_KEY);
    aiProviderManager = new AIProviderManager([geminiProvider]);
  }
} catch (error) {
  console.error("Failed to initialize AI providers for video:", error);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!aiProviderManager || !geminiProvider) {
      return jsonResponse({ error: "AI-Dienste nicht verfügbar." }, 503);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return jsonResponse({ error: "Keine Video-Datei gefunden." }, 400);
    }

    // Validate video file
    const validationError = validateVideoFile({
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
    });
    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    // Convert File to Buffer for Gemini
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // Step 1: Extract transcript from video via Gemini
    const { text: transcript, model: transcriptModel } = await geminiProvider.extractTranscript(
      videoBuffer,
      videoFile.type
    );

    // Step 2: Detect keywords
    const keywordPrompt = PromptFactory.createPrompt("keywords", transcript);
    const { text: keywordText } = await aiProviderManager.generateContent(keywordPrompt);
    const keywordResult = ResponseParser.parseResponse("keywords", keywordText);
    const keywords = keywordResult.keywords || [];

    // Step 3: Generate content for all platforms in parallel
    const platforms = ["youtube", "linkedin", "instagram", "tiktok"] as const;
    const results: Record<string, any> = {};

    const platformPromises = platforms.map(async (platform) => {
      const prompt = PromptFactory.createPrompt(platform, transcript, { keywords });
      const { text, model } = await aiProviderManager.generateContent(prompt);
      const parsed = ResponseParser.parseResponse(platform, text);
      results[platform] = { ...parsed, modelUsed: model };
    });

    await Promise.all(platformPromises);

    return jsonResponse({
      transcript,
      transcriptModel,
      keywords,
      platforms: results,
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    return jsonResponse(
      { error: "Fehler bei der Video-Verarbeitung.", details: error.message },
      500
    );
  }
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
