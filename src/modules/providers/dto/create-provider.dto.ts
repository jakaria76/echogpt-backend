import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ProviderType } from '@prisma/client';

export class CreateProviderDto {
  @ApiProperty({ example: 'GPT-4o Mini' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.OPENAI })
  @IsEnum(ProviderType)
  provider: ProviderType;

  @ApiProperty({ example: 'sk-proj-xxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ example: 'gpt-4o-mini' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({ example: 'https://api.openai.com/v1', required: false })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}