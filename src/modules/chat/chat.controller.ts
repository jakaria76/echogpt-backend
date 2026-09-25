import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendPromptDto } from './dto/send-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionLimitGuard } from '../../common/guards/subscription-limit.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(SubscriptionLimitGuard)
  @ApiOperation({ summary: 'Send prompt and receive AI response (Quota Enforced)' })
  @ApiResponse({ status: 201, description: 'AI response returned successfully' })
  @ApiResponse({ status: 429, description: 'Daily request quota exceeded' })
  async sendPrompt(
    @CurrentUser('id') userId: string,
    @Body() dto: SendPromptDto,
  ) {
    return this.chatService.processPrompt(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversation threads for logged-in user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get full message history of a specific conversation' })
  @ApiResponse({ status: 200, description: 'Conversation thread with messages' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationById(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationById(userId, conversationId);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a conversation thread' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  async deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.deleteConversation(userId, conversationId);
  }
}