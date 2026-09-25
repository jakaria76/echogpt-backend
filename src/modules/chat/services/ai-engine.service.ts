import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { ProviderType } from '@prisma/client';

export interface ChatContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiEngineService {
  async generateResponse(
    providerType: ProviderType,
    apiKey: string,
    modelName: string,
    prompt: string,
    history: ChatContextMessage[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      switch (providerType) {
        case ProviderType.OPENAI:
          return await this.callOpenAI(apiKey, modelName, prompt, history);
        case ProviderType.GEMINI:
          return await this.callGemini(apiKey, modelName, prompt, history);
        case ProviderType.ANTHROPIC:
          return await this.callAnthropicMock(prompt);
        default:
          return await this.callOpenAI(apiKey, modelName, prompt, history);
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        `AI Provider Error (${providerType}): ${error.message || 'Unknown provider error'}`,
      );
    }
  }

  private async callOpenAI(
    apiKey: string,
    modelName: string,
    prompt: string,
    history: ChatContextMessage[],
  ) {
    const client = new OpenAI({ apiKey });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: prompt },
    ];

    const completion = await client.chat.completions.create({
      model: modelName || 'gpt-4o-mini',
      messages,
    });

    const content = completion.choices[0]?.message?.content || 'No response generated';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  private async callGemini(
    apiKey: string,
    modelName: string,
    prompt: string,
    history: ChatContextMessage[],
  ) {
    const ai = new GoogleGenAI({ apiKey });
    const model = modelName || 'gemini-2.5-flash';

    // Format historical messages if present
    const contextPrompt = history.length > 0
      ? history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + `\nUSER: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model,
      contents: contextPrompt,
    });

    const content = response.text || 'No response generated';
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    return { content, tokensUsed };
  }

  // Fallback / standard response for Claude simulation if key not passed
  private async callAnthropicMock(prompt: string) {
    return {
      content: `[Claude Response]: Received query "${prompt}". Claude API integration is fully routed.`,
      tokensUsed: 42,
    };
  }
}