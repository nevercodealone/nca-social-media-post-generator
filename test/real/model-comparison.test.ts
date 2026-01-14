import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGeminiProvider, AnthropicProvider } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { sampleTranscripts } from "../utils/fixtures.js";

const hasGoogleKey = !!import.meta.env.GOOGLE_GEMINI_API_KEY;
const hasAnthropicKey = !!import.meta.env.ANTHROPIC_API_KEY;
const hasBothKeys = hasGoogleKey && hasAnthropicKey;

describe.skipIf(!hasBothKeys)("Model Comparison", () => {
  let googleProvider: GoogleGeminiProvider;
  let anthropicProvider: AnthropicProvider;
  let promptFactory: PromptFactory;

  beforeAll(() => {
    googleProvider = new GoogleGeminiProvider(import.meta.env.GOOGLE_GEMINI_API_KEY);
    anthropicProvider = new AnthropicProvider(import.meta.env.ANTHROPIC_API_KEY);
    promptFactory = new PromptFactory();
  });

  it("should measure response times for both providers", async () => {
    const prompt = promptFactory.createYouTubePrompt(sampleTranscripts.short);

    const googleStart = Date.now();
    const googleResult = await googleProvider.generateContent(prompt);
    const googleTime = Date.now() - googleStart;

    const anthropicStart = Date.now();
    const anthropicResult = await anthropicProvider.generateContent(prompt);
    const anthropicTime = Date.now() - anthropicStart;

    console.log(`\nGoogle Gemini response time: ${googleTime}ms`);
    console.log(`Anthropic Claude response time: ${anthropicTime}ms`);

    expect(googleResult.text).toBeDefined();
    expect(anthropicResult.text).toBeDefined();
    expect(googleResult.text.length).toBeGreaterThan(50);
    expect(anthropicResult.text.length).toBeGreaterThan(50);
  }, 75000);
});

describe.skipIf(!hasGoogleKey)("Google Gemini Only", () => {
  it("should generate content with Google Gemini", async () => {
    const provider = new GoogleGeminiProvider(import.meta.env.GOOGLE_GEMINI_API_KEY);
    const promptFactory = new PromptFactory();
    const prompt = promptFactory.createYouTubePrompt(sampleTranscripts.short);

    const result = await provider.generateContent(prompt);
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(50);
  });
});

describe.skipIf(!hasAnthropicKey)("Anthropic Claude Only", () => {
  it("should generate content with Anthropic Claude", async () => {
    const provider = new AnthropicProvider(import.meta.env.ANTHROPIC_API_KEY);
    const promptFactory = new PromptFactory();
    const prompt = promptFactory.createYouTubePrompt(sampleTranscripts.short);

    const result = await provider.generateContent(prompt);
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(50);
  });
});
