import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communication } from './entities/communication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Communication])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class CommunicationsModule {}
