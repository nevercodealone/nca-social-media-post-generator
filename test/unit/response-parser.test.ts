import { describe, it, expect } from "vitest";
import { ResponseParser } from "../../src/utils/response-parser.js";

describe("ResponseParser", () => {
  describe("parseResponse", () => {
    it("should parse YouTube response correctly", () => {
      const mockResponse = `
TRANSCRIPT:
This is the corrected transcript with proper punctuation.

TITLE:
JavaScript 2025: Die wichtigste Frage

DESCRIPTION:
JavaScript bleibt auch 2025 eine der wichtigsten Programmiersprachen. Die Entwicklung geht schnell voran und neue Features kommen regelmäßig dazu. 

Was sind eure Erfahrungen mit den neuesten JavaScript-Features? Nutzt ihr bereits ES2024-Features in euren Projekten?

Teilt eure Meinung in den Kommentaren! Ich bin gespannt auf eure Perspektiven zu JavaScript 2025.

TIMESTAMPS:
0:00 JavaScript 2025 Überblick
2:30 Neue ES2024 Features
5:00 Performance Verbesserungen
`;

      const result = ResponseParser.parseResponse("youtube", mockResponse);

      expect(result.transcript).toBe("This is the corrected transcript with proper punctuation.");
      expect(result.title).toBe("JavaScript 2025: Die wichtigste Frage");
      expect(result.description).toContain("JavaScript bleibt auch 2025");
      expect(result.timestamps).toContain("0:00 JavaScript 2025 Überblick");
    });

    it("should parse YouTube response without timestamps", () => {
      const mockResponse = `
TRANSCRIPT:
Short transcript here.

TITLE:
Short Video Title

DESCRIPTION:
This is a description without timestamps.
`;

      const result = ResponseParser.parseResponse("youtube", mockResponse);

      expect(result.transcript).toBe("Short transcript here.");
      expect(result.title).toBe("Short Video Title");
      expect(result.description).toBe("This is a description without timestamps.");
      expect(result.timestamps).toBeUndefined();
    });

    it("should parse LinkedIn response correctly", () => {
      const mockResponse = `
LINKEDIN POST:
Heute möchte ich über JavaScript sprechen. Die Sprache entwickelt sich kontinuierlich weiter und bietet immer neue Möglichkeiten.

Was sind eure liebsten JavaScript-Features in 2025?

#javascript #webdev #programming #frontend #nodejs
`;

      const result = ResponseParser.parseResponse("linkedin", mockResponse);

      expect(result.linkedinPost).toContain("JavaScript sprechen");
      expect(result.linkedinPost).toContain("#javascript #webdev");
    });

    it("should parse Twitter response correctly", () => {
      const mockResponse = `
TWITTER POST:
JavaScript 2025 bringt spannende neue Features! Welche nutzt ihr bereits? #javascript #webdev
`;

      const result = ResponseParser.parseResponse("twitter", mockResponse);

      expect(result.twitterPost).toContain("JavaScript 2025 bringt");
      expect(result.twitterPost).toContain("#javascript #webdev");
    });

    it("should parse Instagram response correctly", () => {
      const mockResponse = `
INSTAGRAM POST:
JavaScript bleibt 2025 unverzichtbar für Webentwickler.

Die neuen Features in ES2024 sind beeindruckend. Welche Features nutzt ihr am liebsten?

#nca #duisburg #ncatestify #javascript #webdev #programming #coding #frontend #nodejs #reactjs
`;

      const result = ResponseParser.parseResponse("instagram", mockResponse);

      expect(result.instagramPost).toContain("JavaScript bleibt 2025");
      expect(result.instagramPost).toContain("#nca #duisburg #ncatestify");
    });

    it("should parse TikTok response correctly", () => {
      const mockResponse = `
TIKTOK POST:
JavaScript Tipp für 2025:

Nutzt die neuen Array-Methods! Sie machen euren Code cleaner.

#programming #javascript #coding #webdev #techtok #learnontiktok
`;

      const result = ResponseParser.parseResponse("tiktok", mockResponse);

      expect(result.tiktokPost).toContain("JavaScript Tipp");
      expect(result.tiktokPost).toContain("#programming #javascript");
    });

    it("should parse keywords response correctly", () => {
      const mockResponse = `
KEYWORDS:
JavaScript
React
TypeScript
`;

      const result = ResponseParser.parseResponse("keywords", mockResponse);

      expect(result.keywords).toEqual(["JavaScript", "React", "TypeScript"]);
    });

    it("should limit keywords to maximum of 3", () => {
      const mockResponse = `
KEYWORDS:
JavaScript
React
TypeScript
Vue.js
Angular
`;

      const result = ResponseParser.parseResponse("keywords", mockResponse);

      expect(result.keywords).toHaveLength(3);
      expect(result.keywords).toEqual(["JavaScript", "React", "TypeScript"]);
    });

    it("should handle keywords with empty lines", () => {
      const mockResponse = `
KEYWORDS:
JavaScript

React


TypeScript

`;

      const result = ResponseParser.parseResponse("keywords", mockResponse);

      expect(result.keywords).toEqual(["JavaScript", "React", "TypeScript"]);
    });

    it("should handle malformed responses gracefully", () => {
      const malformedResponse = "This is not a properly formatted response";

      const result = ResponseParser.parseResponse("youtube", malformedResponse);

      expect(result.transcript).toBe("");
      expect(result.title).toBe("");
      expect(result.description).toBe("");
    });

    it("should handle partial YouTube responses", () => {
      const partialResponse = `
TITLE:
Only Title Present
`;

      const result = ResponseParser.parseResponse("youtube", partialResponse);

      expect(result.transcript).toBe("");
      expect(result.title).toBe("Only Title Present");
      expect(result.description).toBe("");
    });

    it("should throw error for unsupported platform type", () => {
      expect(() => {
        ResponseParser.parseResponse("unsupported" as any, "test response");
      }).toThrow("Unsupported platform type: unsupported");
    });

    it("should handle empty responses", () => {
      const emptyResponse = "";

      const youtubeResult = ResponseParser.parseResponse("youtube", emptyResponse);
      expect(youtubeResult.transcript).toBe("");
      expect(youtubeResult.title).toBe("");
      expect(youtubeResult.description).toBe("");

      const keywordsResult = ResponseParser.parseResponse("keywords", emptyResponse);
      expect(keywordsResult.keywords).toEqual([]);
    });

    it("should trim whitespace from parsed content", () => {
      const responseWithWhitespace = `
TRANSCRIPT:
   This transcript has extra whitespace   

TITLE:
   Title with whitespace   

DESCRIPTION:
   Description with whitespace   
`;

      const result = ResponseParser.parseResponse("youtube", responseWithWhitespace);

      expect(result.transcript).toBe("This transcript has extra whitespace");
      expect(result.title).toBe("Title with whitespace");
      expect(result.description).toBe("Description with whitespace");
    });
  });
});
