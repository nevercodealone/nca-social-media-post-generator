import { describe, it, expect } from "vitest";
import { ChatPrompts } from "../../src/config/chat-prompts.js";

describe("ChatPrompts", () => {
  const transcript = "Heute zeige ich euch wie man mit clode code arbeitet.";

  describe("createInitialMessage", () => {
    it("should include brand names rules", () => {
      const msg = ChatPrompts.createInitialMessage(transcript);
      expect(msg).toContain("Never Code Alone");
    });

    it("should include the transcript", () => {
      const msg = ChatPrompts.createInitialMessage(transcript);
      expect(msg).toContain(transcript);
    });

    it("should request TRANSCRIPT and KEYWORDS sections", () => {
      const msg = ChatPrompts.createInitialMessage(transcript);
      expect(msg).toContain("TRANSCRIPT:");
      expect(msg).toContain("KEYWORDS:");
    });

    it("should include transcript correction hints", () => {
      const msg = ChatPrompts.createInitialMessage(transcript);
      expect(msg).toContain('"Claude"');
      expect(msg).toContain('"PHP"');
      expect(msg).toContain('"Sulu"');
    });
  });

  describe("createPlatformMessage", () => {
    it("should create short YouTube message without brand names", () => {
      const msg = ChatPrompts.createPlatformMessage("youtube");
      expect(msg).toContain("TITLE:");
      expect(msg).toContain("DESCRIPTION:");
      expect(msg).not.toContain("Never Code Alone");
    });

    it("should include timestamps when videoDuration provided", () => {
      const msg = ChatPrompts.createPlatformMessage("youtube", { videoDuration: "7:16" });
      expect(msg).toContain("TIMESTAMPS:");
      expect(msg).toContain("7:16");
    });

    it("should not include timestamps without videoDuration", () => {
      const msg = ChatPrompts.createPlatformMessage("youtube");
      expect(msg).not.toContain("TIMESTAMPS:");
    });

    it("should create short LinkedIn message", () => {
      const msg = ChatPrompts.createPlatformMessage("linkedin");
      expect(msg).toContain("LINKEDIN POST:");
      expect(msg).not.toContain("Never Code Alone");
    });

    it("should create short Twitter message", () => {
      const msg = ChatPrompts.createPlatformMessage("twitter");
      expect(msg).toContain("TWITTER POST:");
      expect(msg.length).toBeLessThan(1000);
    });

    it("should create short Instagram message", () => {
      const msg = ChatPrompts.createPlatformMessage("instagram");
      expect(msg).toContain("INSTAGRAM POST:");
      expect(msg).toContain("#nca #duisburg #ncatestify");
    });

    it("should create short TikTok message", () => {
      const msg = ChatPrompts.createPlatformMessage("tiktok");
      expect(msg).toContain("TIKTOK POST:");
    });
  });
});
