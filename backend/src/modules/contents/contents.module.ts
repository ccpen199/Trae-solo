import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { Site } from '../../common/entities/base.entity';
import { Category } from '../categories/entities/category.entity';
import { ContentsService } from './contents.service';
import { ContentsController } from './contents.controller';
import { SitePermission } from '../users/entities/site-permission.entity';
import { CategoryPermission } from '../users/entities/category-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Site, Category, SitePermission, CategoryPermission]),
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService, TypeOrmModule],
})
export class ContentsModule {}
