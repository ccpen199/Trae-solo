import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ChatGroup } from './entities/chat-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatGroup])],
})
export class ImModule {}
