import {
  Controller,
  Post,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/analysis')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('chat')
  chat(
    @Body('city') city = 'warszawa',
    @Body('type') type = 'adwokacka',
    @Body('question') question: string,
    @Body('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.service.chat(city, type, limit, question);
  }
}
