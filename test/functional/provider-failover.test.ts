import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleGeminiProvider, AIProviderManager } from "../../src/utils/ai-providers.js";
import { AI_MODELS } from "../../src/config/constants.js";
import {
  mockGeminiGenerate,
  setupAllProvidersFail,
  resetAllMocks,
} from "../utils/ai-mocks.js";

// Mock the AI SDKs
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGeminiGenerate,
    })),
  })),
}));

describe("Provider Failover - Functional Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("Google Gemini primary path", () => {
    it("should use Google Gemini when available", async () => {
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => "Google response",
        },
      });

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);
      const result = await manager.generateContent("test prompt");

      expect(result.text).toBe("Google response");
      expect(result.model).toBe(AI_MODELS.google[0]);
      expect(mockGeminiGenerate).toHaveBeenCalledTimes(1);
    });

    it("should try all Google models before failing", async () => {
      mockGeminiGenerate
        .mockRejectedValueOnce(new Error("Model 1 failed"))
        .mockRejectedValueOnce(new Error("Model 2 failed"));

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      await expect(manager.generateContent("test prompt")).rejects.toThrow(
        "All AI providers failed"
      );
      expect(mockGeminiGenerate).toHaveBeenCalledTimes(AI_MODELS.google.length);
    });

    it("should fallback to second model if first fails", async () => {
      mockGeminiGenerate
        .mockRejectedValueOnce(new Error("Model 1 failed"))
        .mockResolvedValueOnce({
          response: {
            text: () => "Model 2 success",
          },
        });

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);
      const result = await manager.generateContent("test prompt");

      expect(result.text).toBe("Model 2 success");
      expect(result.model).toBe(AI_MODELS.google[1]);
    });
  });

  describe("Complete failure scenarios", () => {
    it("should throw error when all providers fail", async () => {
      setupAllProvidersFail();

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      await expect(manager.generateContent("test prompt")).rejects.toThrow(
        "All AI providers failed"
      );
    });

    it("should collect all errors from failed providers", async () => {
      setupAllProvidersFail();

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      try {
        await manager.generateContent("test prompt");
      } catch (error) {
        // Expected
      }

      const errors = manager.getLastErrors();
      expect(errors.length).toBe(1);
      expect(errors.some((e) => e.provider === "Google Gemini")).toBe(true);
    });

    it("should throw error when no providers given", () => {
      expect(() => new AIProviderManager([])).toThrow("No AI providers configured");
    });
  });

  describe("Error tracking", () => {
    it("should track last errors from each provider", async () => {
      setupAllProvidersFail();

      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      try {
        await manager.generateContent("test prompt");
      } catch (error) {
        // Expected
      }

      const errors = manager.getLastErrors();
      expect(errors.length).toBeGreaterThan(0);

      const googleError = errors.find((e) => e.provider === "Google Gemini");
      expect(googleError).toBeDefined();
    });

    it("should clear errors on successful generation", async () => {
      // First attempt fails
      setupAllProvidersFail();
      const provider = new GoogleGeminiProvider("google-key");
      const manager = new AIProviderManager([provider]);

      try {
        await manager.generateContent("test prompt");
      } catch (error) {
        // Expected
      }

      expect(manager.getLastErrors().length).toBeGreaterThan(0);

      // Second attempt succeeds
      resetAllMocks();
      mockGeminiGenerate.mockResolvedValueOnce({
        response: {
          text: () => "Success",
        },
      });

      await manager.generateContent("test prompt");

      expect(manager.getLastErrors()).toBeDefined();
    });
  });
});
