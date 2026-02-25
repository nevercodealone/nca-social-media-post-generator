import { describe, it, expect } from "vitest";

describe("send-to-n8n API route", () => {
  it("should export a POST handler", async () => {
    const module = await import("../../src/pages/api/send-to-n8n.js");
    expect(typeof module.POST).toBe("function");
  });
});
