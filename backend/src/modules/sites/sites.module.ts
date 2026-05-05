import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from '../../common/entities/base.entity';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { SitePermission } from '../users/entities/site-permission.entity';
import { CategoryPermission } from '../users/entities/category-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, SitePermission, CategoryPermission]),
  ],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService, TypeOrmModule],
})
export class SitesModule {}
