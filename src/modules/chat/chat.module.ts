import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiEngineService } from './services/ai-engine.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [ChatController],
  providers: [ChatService, AiEngineService],
  exports: [ChatService],
})
export class ChatModule {}