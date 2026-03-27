import { vi } from "vitest";

/**
 * Mock functions for AI providers
 */
export const mockGeminiGenerate = vi.fn();
export const mockZaiGenerate = vi.fn();
export const mockZaiChatMessage = vi.fn();

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
 * Mock Z.ai provider
 */
export const mockZaiProvider = () => ({
  generateContent: mockZaiGenerate,
  startChatSession: vi.fn(),
  startChatSessionWithModel: vi.fn(),
  sendChatMessage: mockZaiChatMessage,
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
  mockZaiGenerate.mockResolvedValue({
    text: "Mock Z.ai response",
    model: "glm-5",
  });
  mockZaiChatMessage.mockResolvedValue({
    text: `TRANSCRIPT:
This is a test transcript with proper punctuation.

KEYWORDS:
javascript
web-development
programming

TITLE:
JavaScript 2025: Die wichtigste Frage

DESCRIPTION:
JavaScript bleibt 2025 relevant. Es gibt viele neue Features.

Was denkt ihr über die Entwicklung von JavaScript?

Teilt eure Meinung in den Kommentaren!`,
    model: "glm-5",
  });
}

/**
 * Setup all providers to fail (for error testing)
 */
export function setupAllProvidersFail() {
  mockGeminiGenerate.mockRejectedValue(new Error("Gemini API error"));
  mockZaiGenerate.mockRejectedValue(new Error("Z.ai API error"));
  mockZaiChatMessage.mockRejectedValue(new Error("Z.ai API error"));
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}
