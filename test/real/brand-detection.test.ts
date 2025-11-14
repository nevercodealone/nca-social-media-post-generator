import { describe, it, expect, beforeAll } from "vitest";
import { AIProviderManager } from "../../src/utils/ai-providers.js";
import { PromptFactory } from "../../src/utils/prompt-factory.js";
import { ResponseParser } from "../../src/utils/response-parser.js";

const hasApiKeys = !!import.meta.env.GOOGLE_GEMINI_API_KEY || !!import.meta.env.ANTHROPIC_API_KEY;

describe.skipIf(!hasApiKeys)("AI Nights Brand Detection with Real AI", () => {
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

  describe("Brand name correction", () => {
    it("should correct 'AI Knights' to 'AI Nights' in transcript", async () => {
      const transcript =
        "Erste Bilder hier von den AI Knights in Nürnberg gerade beim Aufbau. Spektakuläre Bühne hier im Hintergrund.";
      const prompt = promptFactory.createYouTubePrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      const parsed = parser.parseYouTubeResponse(result.text);

      // Should correct the brand name in transcript
      expect(parsed.transcript).toBeDefined();
      expect(parsed.transcript!.toLowerCase()).toContain("ai nights");
      expect(parsed.transcript!.toLowerCase()).not.toContain("ai knights");
    }, 30000);

    it("should correct 'AI Lights' to 'AI Nights' in transcript", async () => {
      const transcript =
        "Erste Bilder hier von den AI Lights in Nürnberg gerade beim Aufbau. Spektakuläre Bühne hier im Hintergrund. Ich weiß nicht, ob man das genau sieht. Und ein 25 000 € Beamer. Ich freue mich total.";
      const prompt = promptFactory.createYouTubePrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      const parsed = parser.parseYouTubeResponse(result.text);

      // Should correct the brand name in transcript
      expect(parsed.transcript).toBeDefined();
      expect(parsed.transcript!.toLowerCase()).toContain("ai nights");
      expect(parsed.transcript!.toLowerCase()).not.toContain("ai lights");
    }, 30000);
  });

  describe("Andreas Pabst mention in body texts", () => {
    it("should include 'Andreas Pabst' in YouTube description when AI Nights detected", async () => {
      const transcript =
        "Erste Bilder hier von den AI Nights in Nürnberg gerade beim Aufbau. Spektakuläre Bühne hier im Hintergrund. Ich weiß nicht, ob man das genau sieht. Und ein 25 000 € Beamer. Ich freue mich total.";
      const prompt = promptFactory.createYouTubePrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      const parsed = parser.parseYouTubeResponse(result.text);

      // YouTube description (body text) must mention Andreas Pabst
      expect(parsed.description).toBeDefined();
      expect(parsed.description!.toLowerCase()).toContain("andreas pabst");
      expect(parsed.description!.toLowerCase()).toMatch(
        /ai nights.*nürnberg.*andreas pabst|andreas pabst.*ai nights.*nürnberg/
      );
    }, 30000);

    it("should include 'Andreas Pabst' in LinkedIn post when AI Nights detected", async () => {
      const transcript =
        "Heute war ich bei den AI Nights in Nürnberg. Eine großartige Veranstaltung über künstliche Intelligenz und moderne Technologien.";
      const prompt = promptFactory.createLinkedInPrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      // LinkedIn body text must mention Andreas Pabst
      expect(result.text.toLowerCase()).toContain("andreas pabst");
      expect(result.text.toLowerCase()).toMatch(
        /ai nights.*nürnberg.*andreas pabst|andreas pabst.*ai nights.*nürnberg/
      );
    }, 30000);

    it("should include 'AI Nights Nürnberg' in Twitter post when AI Nights detected", async () => {
      const transcript =
        "Bei den AI Nights in Nürnberg. Beeindruckende Bühne und tolle Atmosphäre für KI-Enthusiasten.";
      const prompt = promptFactory.createTwitterPrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      // Twitter has character limit, so we expect at least mention of AI Nights and Nürnberg
      expect(result.text.toLowerCase()).toContain("ai nights");
      expect(result.text.toLowerCase()).toContain("nürnberg");
    }, 30000);

    it("should include 'Andreas Pabst' in Instagram post when AI Nights detected", async () => {
      const transcript =
        "Wow, die AI Nights in Nürnberg sind einfach fantastisch! Heute geht es um künstliche Intelligenz und die Zukunft der Technologie.";
      const prompt = promptFactory.createInstagramPrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      // Instagram body text must mention Andreas Pabst
      expect(result.text.toLowerCase()).toContain("andreas pabst");
      expect(result.text.toLowerCase()).toMatch(
        /ai nights.*nürnberg.*andreas pabst|andreas pabst.*ai nights.*nürnberg/
      );
    }, 30000);

    it("should include 'Andreas Pabst' in TikTok post when AI Nights detected", async () => {
      const transcript =
        "Check out die AI Nights in Nürnberg! Krasse Tech-Talks und spannende Diskussionen über KI.";
      const prompt = promptFactory.createTikTokPrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      // TikTok body text must mention Andreas Pabst
      expect(result.text.toLowerCase()).toContain("andreas pabst");
      expect(result.text.toLowerCase()).toMatch(
        /ai nights.*nürnberg.*andreas pabst|andreas pabst.*ai nights.*nürnberg/
      );
    }, 30000);
  });

  describe("No false positives", () => {
    it("should NOT mention Andreas Pabst when AI Nights is not in transcript", async () => {
      const transcript =
        "Heute sprechen wir über JavaScript-Entwicklung und moderne Web-Frameworks wie React und Vue.js.";
      const prompt = promptFactory.createYouTubePrompt(transcript);
      const result = await manager.generateContent(prompt);

      expect(result.text).toBeDefined();
      const parsed = parser.parseYouTubeResponse(result.text);

      // Should NOT mention Andreas Pabst when AI Nights is not mentioned
      expect(parsed.description).toBeDefined();
      expect(parsed.description!.toLowerCase()).not.toContain("andreas pabst");
      expect(parsed.description!.toLowerCase()).not.toContain("ai nights");
    }, 30000);
  });
});
