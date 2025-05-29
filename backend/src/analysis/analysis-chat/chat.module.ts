import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LawOfficesModule } from 'src/law-offices/law-offices.module';
import { ChatSessionService } from 'src/chat/chat-session.service';

@Module({
  imports: [HttpModule, LawOfficesModule],
  controllers: [ChatController],
  providers: [ChatService, ChatSessionService],
})
export class ChatModule {}
