import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendPromptDto {
  @ApiProperty({
    example: 'Explain REST API design principles in 3 bullet points.',
    description: 'The user prompt to be processed by AI',
  })
  @IsString()
  @IsNotEmpty({ message: 'Prompt cannot be empty' })
  prompt: string;

  @ApiProperty({
    example: 'uuid-of-provider',
    required: false,
    description: 'Optional AI Provider ID. If omitted, default active provider is used.',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiProperty({
    example: 'uuid-of-conversation',
    required: false,
    description: 'Conversation ID for continuing chat history. If omitted, a new conversation is started.',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}