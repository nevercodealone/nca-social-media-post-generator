import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GoogleGeminiProvider,
  AIProviderManager,
} from "../../src/utils/ai-providers.js";
import { AI_MODELS } from "../../src/config/constants.js";
import {
  mockGeminiGenerate,
  setupAllProvidersFail,
  resetAllMocks,
} from "../utils/ai-mocks.js";

// Mock the external AI SDKs
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGeminiGenerate,
    })),
  })),
}));

describe("AI Provider Manager - Functional Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GoogleGeminiProvider workflows", () => {
    it("should initialize with correct name and models", () => {
      const provider = new GoogleGeminiProvider("test-api-key");
      expect(provider.name).toBe("Google Gemini");
      expect(provider.models).toEqual(AI_MODELS.google);
    });

    it("should sanitize API key during initialization", () => {
      const provider = new GoogleGeminiProvider('"test-api-key"');
      expect(provider.name).toBe("Google Gemini");
    });

    it("should successfully generate content with first model", async () => {
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => "Generated content",
        },
      });

      const provider = new GoogleGeminiProvider("test-api-key");
      const result = await provider.generateContent("test prompt");

      expect(result).toEqual({
        text: "Generated content",
        model: AI_MODELS.google[0],
      });
    });

    it("should fallback to second model if first fails", async () => {
      mockGeminiGenerate
        .mockRejectedValueOnce(new Error("First model failed"))
        .mockResolvedValueOnce({
          response: {
            text: () => "Fallback content",
          },
        });

      const provider = new GoogleGeminiProvider("test-api-key");
      const result = await provider.generateContent("test prompt");

      expect(result).toEqual({
        text: "Fallback content",
        model: AI_MODELS.google[1],
      });
      expect(mockGeminiGenerate).toHaveBeenCalledTimes(2);
    });

    it("should throw error if all models fail", async () => {
      mockGeminiGenerate.mockRejectedValue(new Error("All models failed"));

      const provider = new GoogleGeminiProvider("test-api-key");

      await expect(provider.generateContent("test prompt")).rejects.toThrow("Google Gemini failed");
    });
  });

  describe("AIProviderManager workflows", () => {
    it("should initialize with providers", () => {
      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);
      expect(manager).toBeDefined();
    });

    it("should throw error when no providers given", () => {
      expect(() => new AIProviderManager([])).toThrow("No AI providers configured");
    });

    it("should use Google Gemini successfully", async () => {
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => "Google success",
        },
      });

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);
      const result = await manager.generateContent("test prompt");

      expect(result.text).toBe("Google success");
      expect(result.model).toBe(AI_MODELS.google[0]);
      expect(mockGeminiGenerate).toHaveBeenCalled();
    });

    it("should throw error when all providers fail", async () => {
      setupAllProvidersFail();

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      await expect(manager.generateContent("test prompt")).rejects.toThrow(
        "All AI providers failed"
      );
    });

    it("should track errors from failed providers", async () => {
      setupAllProvidersFail();

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      try {
        await manager.generateContent("test prompt");
      } catch (error) {
        // Expected to fail
      }

      const errors = manager.getLastErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.provider === "Google Gemini")).toBe(true);
    });
  });
});
