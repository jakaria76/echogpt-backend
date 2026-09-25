import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { AiEngineService, ChatContextMessage } from './services/ai-engine.service';
import { SendPromptDto } from './dto/send-prompt.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly aiEngineService: AiEngineService,
  ) {}

  async processPrompt(userId: string, dto: SendPromptDto) {
    // 1. Get Selected or Default Active Provider
    const provider = await this.providersService.getDefaultOrSelected(dto.providerId);

    // 2. Resolve or Create Conversation
    let conversation;
    let messageHistory: ChatContextMessage[] = [];

    if (dto.conversationId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // Pass last 10 messages for context
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      messageHistory = conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));
    } else {
      // Auto-title using the first 35 chars of prompt
      const title = dto.prompt.length > 35 ? `${dto.prompt.substring(0, 35)}...` : dto.prompt;
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title,
        },
      });
    }

    // 3. Save User Message
    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: dto.prompt,
      },
    });

    // 4. Generate AI Response
    const aiResult = await this.aiEngineService.generateResponse(
      provider.provider,
      provider.apiKey,
      provider.modelName,
      dto.prompt,
      messageHistory,
    );

    // 5. Save AI Message
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        providerId: provider.id,
        role: 'assistant',
        content: aiResult.content,
        tokensUsed: aiResult.tokensUsed,
      },
    });

    // 6. Increment Subscription Daily Usage
    await this.prisma.subscription.update({
      where: { userId },
      data: { usedRequestsToday: { increment: 1 } },
    });

    return {
      conversationId: conversation.id,
      provider: {
        id: provider.id,
        name: provider.name,
        modelName: provider.modelName,
      },
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        tokensUsed: assistantMessage.tokensUsed,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getConversationById(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            tokensUsed: true,
            createdAt: true,
            provider: {
              select: { name: true, modelName: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully' };
  }
}