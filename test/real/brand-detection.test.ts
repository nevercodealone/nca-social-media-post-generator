import { describe, it, expect, beforeAll } from "vitest";
import { AIProviderManager } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { ResponseParser } from "../../src/utils/response-parser.js";

const hasApiKeys = !!import.meta.env.GOOGLE_GEMINI_API_KEY || !!import.meta.env.ANTHROPIC_API_KEY;

describe.skipIf(!hasApiKeys)("AI Nights Brand Detection", () => {
  let manager: AIProviderManager;
  let promptFactory: PromptFactory;
  let parser: ResponseParser;

  beforeAll(() => {
    manager = new AIProviderManager(
      import.meta.env.GOOGLE_GEMINI_API_KEY,
      import.meta.env.ANTHROPIC_API_KEY
    );
    promptFactory = new PromptFactory();
    parser = new ResponseParser();
  });

  it("should correct 'AI Knights' to 'AI Nights' and include Andreas Pabst", async () => {
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

    // Should mention Andreas Pabst in description
    expect(parsed.description).toBeDefined();
    expect(parsed.description!.toLowerCase()).toContain("andreas pabst");
  });

  it("should NOT mention Andreas Pabst when AI Nights is not in transcript", async () => {
    const transcript =
      "Heute sprechen wir über JavaScript-Entwicklung und moderne Web-Frameworks wie React und Vue.js.";
    const prompt = promptFactory.createYouTubePrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = parser.parseYouTubeResponse(result.text);

    // Should NOT mention Andreas Pabst or AI Nights
    expect(parsed.description).toBeDefined();
    expect(parsed.description!.toLowerCase()).not.toContain("andreas pabst");
    expect(parsed.description!.toLowerCase()).not.toContain("ai nights");
  });
});
