import type { AIError } from "../types/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_MODELS, VIDEO_CONSTANTS } from "../config/constants.js";
import { sanitizeApiKey } from "./validation.js";

export interface AIProvider {
  readonly name: string;
  readonly models: readonly string[];
  generateContent(prompt: string): Promise<{ text: string; model: string }>;
  extractTranscript?(
    videoBuffer: Buffer,
    mimeType: string
  ): Promise<{ text: string; model: string }>;
  startChatSession?(): void;
  sendChatMessage?(message: string): Promise<{ text: string; model: string }>;
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\[503\s|503 Service Unavailable|\[429\s|429 Too Many Requests|Resource has been exhausted/i.test(
    message
  );
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

  async extractTranscript(
    videoBuffer: Buffer,
    mimeType: string
  ): Promise<{ text: string; model: string }> {
    const errors: AIError[] = [];

    for (const model of this.models) {
      try {
        const genModel = this.genAI.getGenerativeModel({ model });
        const videoData = {
          inlineData: {
            data: videoBuffer.toString("base64"),
            mimeType,
          },
        };
        const result = await genModel.generateContent([
          VIDEO_CONSTANTS.TRANSCRIPT_PROMPT,
          videoData,
        ]);
        const response = await result.response;
        const text = response.text();
        return { text, model };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        const errorStatus = (error as { status?: number }).status;
        errors.push({ provider: this.name, message: errorMessage, status: errorStatus });
        console.error(`Video transcript extraction failed with ${model}:`, errorMessage);
      }
    }

    throw new Error(
      `${this.name} video transcript extraction failed: ${errors.map((e) => e.message).join(", ")}`
    );
  }

  private chatSession: any = null;
  private chatModel: string = "";

  startChatSession(): void {
    const model = this.models[0];
    const genModel = this.genAI.getGenerativeModel({ model });
    this.chatSession = genModel.startChat();
    this.chatModel = model;
  }

  startChatSessionWithModel(modelName: string): void {
    const genModel = this.genAI.getGenerativeModel({ model: modelName });
    this.chatSession = genModel.startChat();
    this.chatModel = modelName;
  }

  async sendChatMessage(message: string): Promise<{ text: string; model: string }> {
    if (!this.chatSession) {
      throw new Error("Chat session not started. Call startChatSession() first.");
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.chatSession.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        return { text, model: this.chatModel };
      } catch (error: unknown) {
        if (!isRetryableError(error)) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delayMs = 2000 * Math.pow(2, attempt);
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(
            `Gemini retryable error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries}): ${errorMsg}`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }

    throw new Error("Unreachable");
  }
}

export class ZaiProvider implements AIProvider {
  readonly name = "Z.ai";
  readonly models = AI_MODELS.zai;
  private apiKey: string;
  private baseUrl = "https://open.bigmodel.cn/api/paas/v4";
  private chatSession: { messages: Array<{ role: string; content: string }> } | null = null;
  private _currentModel: string = "";

  get currentModel(): string {
    return this._currentModel;
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<{ text: string; model: string }> {
    const errors: AIError[] = [];

    for (const model of this.models) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`[${response.status}] ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        return { text, model };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        const errorStatus = (error as { status?: number }).status;
        errors.push({ provider: this.name, message: errorMessage, status: errorStatus });
        console.error(`Z.ai error with ${model}:`, errorMessage);
      }
    }

    throw new Error(`${this.name} failed: ${errors.map((e) => e.message).join(", ")}`);
  }

  startChatSession(): void {
    this._currentModel = this.models[0];
    this.chatSession = { messages: [] };
  }

  startChatSessionWithModel(modelName: string): void {
    if (!this.models.includes(modelName)) {
      throw new Error(`Model ${modelName} not available. Use: ${this.models.join(", ")}`);
    }
    this._currentModel = modelName;
    this.chatSession = { messages: [] };
  }

  async sendChatMessage(message: string): Promise<{ text: string; model: string }> {
    if (!this.chatSession) {
      throw new Error("Chat session not started. Call startChatSession() first.");
    }

    this.chatSession.messages.push({ role: "user", content: message });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this._currentModel,
        messages: this.chatSession.messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.name} chat failed: [${response.status}] ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    this.chatSession.messages.push({ role: "assistant", content: text });

    return { text, model: this._currentModel };
  }
}

export class AIProviderManager {
  private providers: AIProvider[] = [];
  private errors: AIError[] = [];

  constructor(providers: AIProvider[]) {
    this.providers = providers;

    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
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

    const errorMessage = this.errors.map((e) => `${e.provider}: ${e.message}`).join(", ");
    throw new Error(`All AI providers failed: ${errorMessage}`);
  }

  getLastErrors(): AIError[] {
    return [...this.errors];
  }
}
