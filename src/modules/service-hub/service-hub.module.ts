import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceItemController } from './service-item.controller';
import { ServiceApplicationController } from './service-application.controller';

import { ServiceCategoryService } from './services/service-category.service';
import { ServiceItemService } from './services/service-item.service';
import { ServiceSubitemService } from './services/service-subitem.service';
import { ScenarioGuideService } from './services/scenario-guide.service';
import { ApplicationService } from './services/application.service';

import { ServiceCategory } from './entities/service-category.entity';
import { ServiceItem } from './entities/service-item.entity';
import { ServiceSubitem } from './entities/service-subitem.entity';
import { ScenarioTree } from './entities/scenario-tree.entity';
import { ScenarioCondition } from './entities/scenario-condition.entity';
import { Application } from './entities/application.entity';
import { ApplicationMaterial } from './entities/application-material.entity';
import { ApplicationProgress } from './entities/application-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceCategory,
      ServiceItem,
      ServiceSubitem,
      ScenarioTree,
      ScenarioCondition,
      Application,
      ApplicationMaterial,
      ApplicationProgress,
    ]),
  ],
  controllers: [ServiceItemController, ServiceApplicationController],
  providers: [
    ServiceCategoryService,
    ServiceItemService,
    ServiceSubitemService,
    ScenarioGuideService,
    ApplicationService,
  ],
  exports: [
    TypeOrmModule,
    ServiceCategoryService,
    ServiceItemService,
    ServiceSubitemService,
    ScenarioGuideService,
    ApplicationService,
  ],
})
export class ServiceHubModule {}
