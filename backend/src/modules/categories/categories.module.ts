import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Site } from '../../common/entities/base.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { SitePermission } from '../users/entities/site-permission.entity';
import { CategoryPermission } from '../users/entities/category-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Site, SitePermission, CategoryPermission]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
