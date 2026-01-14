import type { AIError } from "../types/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import type { TextBlock } from "@anthropic-ai/sdk/resources/messages.js";
import { AI_MODELS } from "../config/constants.js";
import { sanitizeApiKey } from "./validation.js";

// Type guard for Anthropic text content blocks
function isTextBlock(block: Anthropic.ContentBlock): block is TextBlock {
  return block.type === "text";
}

export interface AIProvider {
  readonly name: string;
  readonly models: readonly string[];
  generateContent(prompt: string): Promise<{ text: string; model: string }>;
}

export class GoogleGeminiProvider implements AIProvider {
  readonly name = "Google Gemini";
  readonly models = AI_MODELS.google;
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(sanitizeApiKey(apiKey));
  }

  async generateContent(prompt: string): Promise<{ text: string; model: string }> {
    const errors: AIError[] = [];

    for (const model of this.models) {
      try {
        const genModel = this.genAI.getGenerativeModel({ model });
        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { text, model };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        const errorStatus = (error as { status?: number }).status;
        errors.push({
          provider: this.name,
          message: errorMessage,
          status: errorStatus,
        });
        console.error(`Fehler mit ${model}:`, errorMessage);
      }
    }

    throw new Error(`${this.name} failed: ${errors.map((e) => e.message).join(", ")}`);
  }
}

export class AnthropicProvider implements AIProvider {
  readonly name = "Anthropic Claude";
  readonly models = AI_MODELS.anthropic;
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey: sanitizeApiKey(apiKey) });
  }

  async generateContent(prompt: string): Promise<{ text: string; model: string }> {
    const errors: AIError[] = [];

    for (const model of this.models) {
      try {
        const message = await this.anthropic.messages.create({
          model,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const firstBlock = message.content[0];
        if (!firstBlock || !isTextBlock(firstBlock)) {
          throw new Error("Unexpected response format: no text content");
        }
        const text = firstBlock.text;
        return { text, model };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        const errorStatus = (error as { status?: number }).status;
        errors.push({
          provider: this.name,
          message: errorMessage,
          status: errorStatus,
        });
        console.error(`Fehler mit ${model}:`, errorMessage);
      }
    }

    throw new Error(`${this.name} failed: ${errors.map((e) => e.message).join(", ")}`);
  }
}

export class AIProviderManager {
  private providers: AIProvider[] = [];
  private errors: AIError[] = [];

  constructor(googleApiKey?: string, anthropicApiKey?: string) {
    if (googleApiKey) {
      this.providers.push(new GoogleGeminiProvider(googleApiKey));
    }

    if (anthropicApiKey) {
      this.providers.push(new AnthropicProvider(anthropicApiKey));
    }

    if (this.providers.length === 0) {
      throw new Error("No API keys provided for AI providers");
    }
  }

  async generateContent(prompt: string): Promise<{ text: string; model: string }> {
    this.errors = [];

    for (const provider of this.providers) {
      try {
        const result = await provider.generateContent(prompt);
        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        this.errors.push({
          provider: provider.name,
          message: errorMessage,
        });
        console.error(`Provider ${provider.name} failed:`, errorMessage);
      }
    }

    // If all providers failed
    const errorMessage = this.errors.map((e) => `${e.provider}: ${e.message}`).join(", ");

    throw new Error(`All AI providers failed: ${errorMessage}`);
  }

  getLastErrors(): AIError[] {
    return [...this.errors];
  }
}
