import { Module } from '@nestjs/common';
import {
  ServiceCategoryController,
  ServiceProviderController,
  ServiceItemController,
  ServiceOrderController,
  CommissionController,
} from './service.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ServiceCategoryController,
    ServiceProviderController,
    ServiceItemController,
    ServiceOrderController,
    CommissionController,
  ],
})
export class ServiceModule {}
