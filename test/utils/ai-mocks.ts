import { vi } from "vitest";

/**
 * Mock functions for AI providers
 */
export const mockGeminiGenerate = vi.fn();

/**
 * Mock Google Gemini SDK
 */
export const mockGeminiProvider = () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGeminiGenerate,
    })),
  })),
});

/**
 * Setup default successful responses
 */
export function setupSuccessfulMocks() {
  mockGeminiGenerate.mockResolvedValue({
    response: {
      text: () => "Mock Gemini response",
    },
  });
}

/**
 * Setup all providers to fail (for error testing)
 */
export function setupAllProvidersFail() {
  mockGeminiGenerate.mockRejectedValue(new Error("Gemini API error"));
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}
