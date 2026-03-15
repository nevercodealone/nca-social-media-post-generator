import type { APIRoute } from "astro";
import type { GenerateAllResponse } from "../../types/index.js";
import { validateVideoFile } from "../../utils/validation.js";
import { GoogleGeminiProvider } from "../../utils/ai-providers.js";
import { ChatPrompts } from "../../config/chat-prompts.js";
import { ResponseParser } from "../../utils/response-parser.js";

const GOOGLE_GEMINI_API_KEY = import.meta.env.GOOGLE_GEMINI_API_KEY;

let geminiProvider: GoogleGeminiProvider;

try {
  if (GOOGLE_GEMINI_API_KEY) {
    geminiProvider = new GoogleGeminiProvider(GOOGLE_GEMINI_API_KEY);
  }
} catch (error) {
  console.error("Failed to initialize AI provider for video:", error);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!geminiProvider) {
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

    // Step 1: Extract raw transcript from video via Gemini
    const { text: rawTranscript, model: transcriptModel } = await geminiProvider.extractTranscript(
      videoBuffer,
      videoFile.type
    );

    // Step 2: Use chat session to correct transcript + generate all platforms
    geminiProvider.startChatSession();

    // Turn 1: Correct transcript + extract keywords
    const initialMessage = ChatPrompts.createInitialMessage(rawTranscript);
    const { text: initialText, model } = await geminiProvider.sendChatMessage(initialMessage);

    const transcriptResult = ResponseParser.parseResponse("youtube", initialText);
    const keywordResult = ResponseParser.parseResponse("keywords", initialText);
    const correctedTranscript = transcriptResult.transcript || rawTranscript;
    const keywords = keywordResult.keywords || [];

    // Turn 2: YouTube
    const ytMsg = ChatPrompts.createPlatformMessage("youtube");
    const { text: ytText } = await geminiProvider.sendChatMessage(ytMsg);
    const ytResult = ResponseParser.parseResponse("youtube", ytText);

    // Turn 3: LinkedIn
    const liMsg = ChatPrompts.createPlatformMessage("linkedin");
    const { text: liText } = await geminiProvider.sendChatMessage(liMsg);
    const liResult = ResponseParser.parseResponse("linkedin", liText);

    // Turn 4: Twitter
    const twMsg = ChatPrompts.createPlatformMessage("twitter");
    const { text: twText } = await geminiProvider.sendChatMessage(twMsg);
    const twResult = ResponseParser.parseResponse("twitter", twText);

    // Turn 5: Instagram
    const igMsg = ChatPrompts.createPlatformMessage("instagram");
    const { text: igText } = await geminiProvider.sendChatMessage(igMsg);
    const igResult = ResponseParser.parseResponse("instagram", igText);

    // Turn 6: TikTok
    const ttMsg = ChatPrompts.createPlatformMessage("tiktok");
    const { text: ttText } = await geminiProvider.sendChatMessage(ttMsg);
    const ttResult = ResponseParser.parseResponse("tiktok", ttText);

    // Return in format compatible with video upload UI
    return jsonResponse({
      transcript: correctedTranscript,
      transcriptModel,
      keywords,
      platforms: {
        youtube: { title: ytResult.title, description: ytResult.description, modelUsed: model },
        linkedin: { linkedinPost: liResult.linkedinPost, modelUsed: model },
        twitter: { twitterPost: twResult.twitterPost, modelUsed: model },
        instagram: { instagramPost: igResult.instagramPost, modelUsed: model },
        tiktok: { tiktokPost: ttResult.tiktokPost, modelUsed: model },
      },
      modelUsed: model,
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
