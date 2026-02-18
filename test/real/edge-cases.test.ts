import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGeminiProvider, AIProviderManager } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { ResponseParser } from "../../src/utils/response-parser.js";

const hasGoogleKey = !!import.meta.env.GOOGLE_GEMINI_API_KEY;

describe.skipIf(!hasGoogleKey)("Edge Cases with Real AI", () => {
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

  it("should handle German characters and preserve JavaScript terms", async () => {
    const transcript = "Über die Entwicklung von JavaScript und TypeScript für große Anwendungen";
    const prompt = promptFactory.createYouTubePrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = parser.parseYouTubeResponse(result.text);
    expect(parsed.title).toBeDefined();
    expect(parsed.description).toBeDefined();
    expect(parsed.description!.toLowerCase()).toMatch(/javascript|typescript/);
  });

  it("should handle technical jargon and preserve concepts", async () => {
    const transcript =
      "Today we discuss TypeScript generics, dependency injection, abstract factory patterns, and SOLID principles";
    const prompt = promptFactory.createYouTubePrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = parser.parseYouTubeResponse(result.text);
    expect(parsed.title).toBeDefined();
    expect(parsed.description).toBeDefined();
    expect(parsed.description!.toLowerCase()).toMatch(/typescript|pattern|solid|programming/);
  });

  it("should respect Twitter 280 char limit with long input", async () => {
    const transcript =
      "This is a very long discussion about web development, covering topics like React, Vue, Angular, TypeScript, JavaScript ES2024, webpack, vite, and many more technologies";
    const prompt = promptFactory.createTwitterPrompt(transcript);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeLessThanOrEqual(280);
    expect(result.text).toMatch(/#\w+/);
  });
});
