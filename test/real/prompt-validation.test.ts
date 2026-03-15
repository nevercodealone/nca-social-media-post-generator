import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGeminiProvider, AIProviderManager } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { ResponseParser } from "../../src/utils/response-parser.js";
import { sampleTranscripts } from "../utils/fixtures.js";

const hasGoogleKey = !!import.meta.env.GOOGLE_GEMINI_API_KEY;

describe.skipIf(!hasGoogleKey)("Platform Content Generation", () => {
  let manager: AIProviderManager;
  let promptFactory: PromptFactory;

  beforeAll(() => {
    const providers = [];
    if (import.meta.env.GOOGLE_GEMINI_API_KEY) {
      providers.push(new GoogleGeminiProvider(import.meta.env.GOOGLE_GEMINI_API_KEY));
    }
    manager = new AIProviderManager(providers);
    promptFactory = new PromptFactory();
  });

  it("should generate valid YouTube content with sections", async () => {
    const prompt = promptFactory.createYouTubePrompt(sampleTranscripts.medium);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.text).toMatch(/TITLE:|DESCRIPTION:/i);
  });

  it("should generate professional LinkedIn content with hashtags", async () => {
    const prompt = promptFactory.createLinkedInPrompt(sampleTranscripts.medium);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(100);
    expect(result.text).toMatch(/#\w+/);
    expect(result.text.toLowerCase()).toMatch(/digital|innovation|technology|business|cloud/);
  });

  it("should generate Instagram content with multiple hashtags", async () => {
    const prompt = promptFactory.createInstagramPrompt(sampleTranscripts.medium);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const hashtagCount = (result.text.match(/#\w+/g) || []).length;
    expect(hashtagCount).toBeGreaterThan(3);
  });

  it("should generate concise Twitter content under 280 chars", async () => {
    const prompt = promptFactory.createTwitterPrompt(sampleTranscripts.medium);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const parsed = ResponseParser.parseResponse("twitter", result.text);
    expect(parsed.twitterPost).toBeDefined();
    expect(parsed.twitterPost!.length).toBeGreaterThan(50);
    expect(parsed.twitterPost!.length).toBeLessThanOrEqual(280);
    expect(parsed.twitterPost).toMatch(/#\w+/);
  });

  it("should extract relevant keywords", async () => {
    const prompt = promptFactory.createKeywordsPrompt(sampleTranscripts.medium);
    const result = await manager.generateContent(prompt);

    expect(result.text).toBeDefined();
    const keywords = result.text.split(/\n|,/).filter((k) => k.trim().length > 0);
    expect(keywords.length).toBeGreaterThanOrEqual(1);
  });
});
