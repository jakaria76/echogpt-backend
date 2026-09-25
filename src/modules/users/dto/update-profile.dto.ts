import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Jakaria Mahmud', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}