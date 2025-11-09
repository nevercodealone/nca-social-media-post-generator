import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleGeminiProvider, AnthropicProvider, AIProviderManager } from '../../src/utils/ai-providers.js';
import { AI_MODELS } from '../../src/config/constants.js';

// Create shared mock functions
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent
}));

const mockAnthropicCreate = vi.fn();

// Mock the external dependencies with shared mocks
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockAnthropicCreate
    }
  }))
}));

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockClear();
    mockGetGenerativeModel.mockClear();
    mockAnthropicCreate.mockClear();
  });

  describe('GoogleGeminiProvider', () => {
    it('should initialize with correct name and models', () => {
      const provider = new GoogleGeminiProvider('test-api-key');
      expect(provider.name).toBe('Google Gemini');
      expect(provider.models).toEqual(AI_MODELS.google);
    });

    it('should sanitize API key during initialization', () => {
      const provider = new GoogleGeminiProvider('"test-api-key"');
      expect(provider.name).toBe('Google Gemini');
    });

    it('should successfully generate content with first model', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Generated content'
        }
      });

      const provider = new GoogleGeminiProvider('test-api-key');
      const result = await provider.generateContent('test prompt');

      expect(result).toEqual({
        text: 'Generated content',
        model: AI_MODELS.google[0]
      });
    });

    it('should try fallback model if first model fails', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('First model failed'))
        .mockResolvedValueOnce({
          response: {
            text: () => 'Fallback content'
          }
        });

      const provider = new GoogleGeminiProvider('test-api-key');
      const result = await provider.generateContent('test prompt');

      expect(result).toEqual({
        text: 'Fallback content',
        model: AI_MODELS.google[1]
      });
    });

    it('should throw error if all models fail', async () => {
      mockGenerateContent.mockRejectedValue(new Error('All models failed'));

      const provider = new GoogleGeminiProvider('test-api-key');

      await expect(provider.generateContent('test prompt'))
        .rejects.toThrow('Google Gemini failed');
    });
  });

  describe('AnthropicProvider', () => {
    it('should initialize with correct name and models', () => {
      const provider = new AnthropicProvider('test-api-key');
      expect(provider.name).toBe('Anthropic Claude');
      expect(provider.models).toEqual(AI_MODELS.anthropic);
    });

    it('should successfully generate content', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ text: 'Anthropic generated content' }]
      });

      const provider = new AnthropicProvider('test-api-key');
      const result = await provider.generateContent('test prompt');

      expect(result).toEqual({
        text: 'Anthropic generated content',
        model: AI_MODELS.anthropic[0]
      });
    });

    it('should try fallback model if first model fails', async () => {
      mockAnthropicCreate
        .mockRejectedValueOnce(new Error('First model failed'))
        .mockResolvedValueOnce({
          content: [{ text: 'Fallback anthropic content' }]
        });

      const provider = new AnthropicProvider('test-api-key');
      const result = await provider.generateContent('test prompt');

      expect(result).toEqual({
        text: 'Fallback anthropic content',
        model: AI_MODELS.anthropic[1]
      });
    });
  });

  describe('AIProviderManager', () => {
    it('should initialize with both providers when API keys provided', () => {
      const manager = new AIProviderManager('google-key', 'anthropic-key');
      expect(manager).toBeDefined();
    });

    it('should throw error when no API keys provided', () => {
      expect(() => new AIProviderManager()).toThrow('No API keys provided for AI providers');
    });

    it('should try Google first, then Anthropic on failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Google failed'));
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ text: 'Anthropic success' }]
      });

      const manager = new AIProviderManager('google-key', 'anthropic-key');
      const result = await manager.generateContent('test prompt');

      expect(result).toEqual({
        text: 'Anthropic success',
        model: AI_MODELS.anthropic[0]
      });
    });

    it('should throw error when all providers fail', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Google failed'));
      mockAnthropicCreate.mockRejectedValue(new Error('Anthropic failed'));

      const manager = new AIProviderManager('google-key', 'anthropic-key');

      await expect(manager.generateContent('test prompt'))
        .rejects.toThrow('All AI providers failed');
    });

    it('should return last errors when all providers fail', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Google failed'));

      const manager = new AIProviderManager('google-key');

      try {
        await manager.generateContent('test prompt');
      } catch (error) {
        // Expected to fail
      }

      const errors = manager.getLastErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].provider).toBe('Google Gemini');
    });
  });
});