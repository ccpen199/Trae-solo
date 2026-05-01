import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content, Category } from './entities/content.entity';
import { ContentVersion } from './entities/content-version.entity';
import { ContentsService } from './contents.service';
import { ContentsController } from './contents.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, ContentVersion, Category]),
    AuditModule,
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
