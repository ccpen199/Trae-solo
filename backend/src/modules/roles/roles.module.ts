import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../users/entities/role.entity';
import { Permission } from '../users/entities/permission.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { SitePermission } from '../users/entities/site-permission.entity';
import { CategoryPermission } from '../users/entities/category-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, SitePermission, CategoryPermission]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
