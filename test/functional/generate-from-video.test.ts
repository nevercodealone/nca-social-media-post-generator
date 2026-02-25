import { describe, it, expect } from "vitest";

describe("generate-from-video API route", () => {
  it("should export a POST handler", async () => {
    const module = await import("../../src/pages/api/generate-from-video.js");
    expect(typeof module.POST).toBe("function");
  });
});
