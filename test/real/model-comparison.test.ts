import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGeminiProvider } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { sampleTranscripts } from "../utils/fixtures.js";

const hasGoogleKey = !!import.meta.env.GOOGLE_GEMINI_API_KEY;

describe.skipIf(!hasGoogleKey)("Google Gemini", () => {
  it("should generate content with Google Gemini", async () => {
    const provider = new GoogleGeminiProvider(import.meta.env.GOOGLE_GEMINI_API_KEY);
    const promptFactory = new PromptFactory();
    const prompt = promptFactory.createYouTubePrompt(sampleTranscripts.short);

    const result = await provider.generateContent(prompt);
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(50);
  });
});
