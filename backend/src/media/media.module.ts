import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset, ContentMedia } from './entities/media-asset.entity';
import { MediaService } from './services/media.service';
import { MinioService } from './services/minio.service';
import { MediaController } from './media.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAsset, ContentMedia]),
    AuditModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, MinioService],
  exports: [MediaService, MinioService],
})
export class MediaModule {}
