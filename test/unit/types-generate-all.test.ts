import { describe, it, expect } from "vitest";
import type { GenerateAllRequest, GenerateAllResponse, PlatformResult } from "../../src/types/index.js";

describe("GenerateAll types", () => {
  it("should define GenerateAllRequest shape", () => {
    const request: GenerateAllRequest = {
      transcript: "test transcript",
      videoDuration: "7:16",
    };
    expect(request.transcript).toBe("test transcript");
    expect(request.videoDuration).toBe("7:16");
  });

  it("should define GenerateAllResponse with all platforms", () => {
    const response: GenerateAllResponse = {
      correctedTranscript: "corrected text",
      keywords: ["PHP", "Testing"],
      youtube: { title: "Title", description: "Desc" },
      linkedin: { post: "LinkedIn post" },
      twitter: { post: "Twitter post" },
      instagram: { post: "Instagram post" },
      tiktok: { post: "TikTok post" },
      modelUsed: "gemini-2.5-pro",
    };
    expect(response.correctedTranscript).toBe("corrected text");
    expect(response.youtube.title).toBe("Title");
  });
});
