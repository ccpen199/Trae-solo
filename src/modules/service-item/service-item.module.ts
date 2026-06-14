import { Module } from '@nestjs/common';
import { ServiceItemController } from './service-item.controller';
import { ServiceItemService } from './service-item.service';
import { MaterialTemplateService } from './material-template.service';
import { FormTemplateService } from './form-template.service';

@Module({
  controllers: [ServiceItemController],
  providers: [ServiceItemService, MaterialTemplateService, FormTemplateService],
  exports: [ServiceItemService, MaterialTemplateService, FormTemplateService],
})
export class ServiceItemModule {}
