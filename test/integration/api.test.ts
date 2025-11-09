import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AI_MODELS } from '../../src/config/constants.js';

// Mock the Astro environment
const mockEnv = {
  GOOGLE_GEMINI_API_KEY: 'mock-google-key',
  ANTHROPIC_API_KEY: 'mock-anthropic-key'
};

vi.mock('astro:env', () => ({
  import: {
    meta: {
      env: mockEnv
    }
  }
}));

// Set up import.meta.env for the tests
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  },
  writable: true
});

// Mock the AI SDKs
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => `
TRANSCRIPT:
This is a test transcript with proper punctuation.

TITLE:
JavaScript 2025: Die wichtigste Frage

DESCRIPTION:
JavaScript bleibt 2025 relevant. Es gibt viele neue Features.

Was denkt ihr über die Entwicklung von JavaScript?

Teilt eure Meinung in den Kommentaren!
`
        }
      })
    })
  }))
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          text: `
KEYWORDS:
JavaScript
React
TypeScript
`
        }]
      })
    }
  }))
}));

describe('API Integration Tests', () => {
  let POST: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import the API route after mocks are set up
    const apiModule = await import('../../src/pages/api/generate.js');
    POST = apiModule.POST;
  });

  const createMockRequest = (body: any) => ({
    json: () => Promise.resolve(body)
  });

  const createMockAstroContext = (request: any) => ({
    request
  });

  describe('POST /api/generate', () => {
    it('should generate YouTube content successfully', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript that is long enough to pass validation and contains meaningful content about JavaScript development.',
        type: 'youtube'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.transcript).toContain('test transcript');
      expect(responseData.title).toContain('JavaScript 2025');
      expect(responseData.description).toContain('JavaScript bleibt');
      expect(responseData.transcriptCleaned).toBe(false);
      expect(responseData.modelUsed).toBe(AI_MODELS.google[0]);
    });

    it('should generate keywords successfully', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about JavaScript, React, and TypeScript development.',
        type: 'keywords'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.keywords).toBeDefined();
      expect(Array.isArray(responseData.keywords)).toBe(true);
      expect(responseData.modelUsed).toBeDefined();
    });

    it('should generate YouTube content with video duration', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about web development with JavaScript frameworks.',
        type: 'youtube',
        videoDuration: '7:16'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.transcript).toBeDefined();
      expect(responseData.title).toBeDefined();
      expect(responseData.description).toBeDefined();
    });

    it('should generate content with keywords', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about modern web development practices.',
        type: 'youtube',
        keywords: ['JavaScript', 'Web Development', 'Modern Practices']
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.transcript).toBeDefined();
      expect(responseData.title).toBeDefined();
      expect(responseData.description).toBeDefined();
    });

    it('should clean transcript by removing single character at end', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript that ends with a single character a',
        type: 'youtube'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.transcriptCleaned).toBe(true);
    });

    it('should return 400 for empty transcript', async () => {
      const mockRequest = createMockRequest({
        transcript: '',
        type: 'youtube'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Transkript');
    });

    it('should return 400 for invalid video duration format', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a valid transcript that is long enough to pass validation tests.',
        type: 'youtube',
        videoDuration: 'invalid'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Video-Dauer');
    });

    it('should return 400 for invalid platform type', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a valid transcript that is long enough to pass validation tests.',
        type: 'invalid-platform'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Ungültiger Typ');
    });

    it('should return 400 for malformed JSON', async () => {
      const mockRequest = {
        json: () => Promise.reject(new SyntaxError('Invalid JSON'))
      };

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Ungültige JSON-Anfrage');
    });

    it('should handle LinkedIn content type', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about professional web development practices.',
        type: 'linkedin',
        keywords: ['LinkedIn', 'Professional Development']
      });

      const response = await POST(createMockAstroContext(mockRequest));
      expect(response.status).toBe(200);
    });

    it('should handle Twitter content type', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about quick development tips.',
        type: 'twitter'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      expect(response.status).toBe(200);
    });

    it('should handle Instagram content type', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about visual development content.',
        type: 'instagram'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      expect(response.status).toBe(200);
    });

    it('should handle TikTok content type', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a test transcript about short-form development content.',
        type: 'tiktok',
        keywords: ['TikTok', 'Short Content']
      });

      const response = await POST(createMockAstroContext(mockRequest));
      expect(response.status).toBe(200);
    });

    it('should handle valid requests with mocked AI', async () => {
      const mockRequest = createMockRequest({
        transcript: 'This is a valid transcript that works with mocked AI providers.',
        type: 'youtube'
      });

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.modelUsed).toBeDefined();
    });

    it('should return 400 for malformed JSON requests', async () => {
      const mockRequest = {
        json: () => {
          throw new Error('JSON parse error');
        }
      };

      const response = await POST(createMockAstroContext(mockRequest));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Ungültige JSON-Anfrage');
    });
  });
});