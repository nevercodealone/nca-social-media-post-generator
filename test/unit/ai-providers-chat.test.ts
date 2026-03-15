import { describe, it, expect, vi } from "vitest";
import { GoogleGeminiProvider } from "../../src/utils/ai-providers.js";

vi.mock("@google/generative-ai", () => {
  const mockSendMessage = vi.fn().mockResolvedValue({
    response: { text: () => "mocked response" },
  });
  const mockStartChat = vi.fn(() => ({ sendMessage: mockSendMessage }));
  const mockGetGenerativeModel = vi.fn(() => ({
    startChat: mockStartChat,
    generateContent: vi.fn(),
  }));

  return {
    GoogleGenerativeAI: vi.fn(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

describe("GoogleGeminiProvider chat session", () => {
  it("should have startChatSession method", () => {
    const provider = new GoogleGeminiProvider("test-key");
    expect(typeof provider.startChatSession).toBe("function");
  });

  it("should have sendChatMessage method", () => {
    const provider = new GoogleGeminiProvider("test-key");
    expect(typeof provider.sendChatMessage).toBe("function");
  });

  it("should throw if sendChatMessage called before startChatSession", async () => {
    const provider = new GoogleGeminiProvider("test-key");
    await expect(provider.sendChatMessage("hello")).rejects.toThrow(
      "Chat session not started"
    );
  });

  it("should return text and model after sendChatMessage", async () => {
    const provider = new GoogleGeminiProvider("test-key");
    provider.startChatSession();
    const result = await provider.sendChatMessage("hello");
    expect(result.text).toBe("mocked response");
    expect(result.model).toBeDefined();
  });
});
