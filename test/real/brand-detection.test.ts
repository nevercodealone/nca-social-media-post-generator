import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGeminiProvider, AIProviderManager } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { ResponseParser } from "../../src/utils/response-parser.js";

const hasGoogleKey = !!import.meta.env.GOOGLE_GEMINI_API_KEY;

describe.skipIf(!hasGoogleKey)("Brand Detection", () => {
  let manager: AIProviderManager;
  let promptFactory: PromptFactory;
  let parser: ResponseParser;

  beforeAll(() => {
    const providers = [];
    if (import.meta.env.GOOGLE_GEMINI_API_KEY) {
      providers.push(new GoogleGeminiProvider(import.meta.env.GOOGLE_GEMINI_API_KEY));
    }
    manager = new AIProviderManager(providers);
    promptFactory = new PromptFactory();
    parser = new ResponseParser();
  });

  it("should correct 'AI Knights' to 'AI Nights'", async () => {
    const transcript =
      "Erste Bilder hier von den AI Knights in Nürnberg gerade beim Aufbau. Spektakuläre Bühne hier im Hintergrund.";
    const prompt = promptFactory.createYouTubePrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = parser.parseYouTubeResponse(result.text);

    // Should correct the brand name
    expect(parsed.transcript).toBeDefined();
    expect(parsed.transcript!.toLowerCase()).toContain("ai nights");
    expect(parsed.transcript!.toLowerCase()).not.toContain("ai knights");
  });

  it("should correct 'White Coding' to 'Vibe Coding'", async () => {
    const transcript = "Heute zeige ich euch White Coding mit Claude. Das ist echt cool.";
    const prompt = promptFactory.createYouTubePrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = parser.parseYouTubeResponse(result.text);

    expect(parsed.transcript).toBeDefined();
    expect(parsed.transcript!).toContain("Vibe Coding");
    expect(parsed.transcript!).not.toContain("White Coding");
  });
});
