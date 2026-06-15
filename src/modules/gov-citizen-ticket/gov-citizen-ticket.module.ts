import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketController } from './ticket.controller';
import { TicketAdminController } from './ticket-admin.controller';

import { TicketService } from './services/ticket.service';
import { TicketFlowService } from './services/ticket-flow.service';
import { SatisfactionService } from './services/satisfaction.service';
import { Service12345AdapterService } from './services/service-12345-adapter.service';
import { DeptDispatchService } from './services/dept-dispatch.service';

import { Ticket } from './entities/ticket.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { TicketFlowLog } from './entities/ticket-flow-log.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { SatisfactionSurvey } from './entities/satisfaction-survey.entity';
import { TicketUrgencyLog } from './entities/ticket-urgency-log.entity';
import { DeptResponse } from './entities/dept-response.entity';

import { Sm4Util } from '../../common/utils/sm4.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketCategory,
      TicketFlowLog,
      TicketAttachment,
      SatisfactionSurvey,
      TicketUrgencyLog,
      DeptResponse,
    ]),
  ],
  controllers: [
    TicketController,
    TicketAdminController,
  ],
  providers: [
    TicketService,
    TicketFlowService,
    SatisfactionService,
    Service12345AdapterService,
    DeptDispatchService,
    Sm4Util,
  ],
  exports: [
    TypeOrmModule,
    TicketService,
    TicketFlowService,
    SatisfactionService,
    Service12345AdapterService,
    DeptDispatchService,
  ],
})
export class GovCitizenTicketModule implements OnModuleInit {
  private readonly logger = new Logger(GovCitizenTicketModule.name);

  constructor(
    private readonly deptDispatchService: DeptDispatchService,
  ) {}

  async onModuleInit() {
    this.logger.log('政民互动工单系统模块初始化...');

    try {
      await this.deptDispatchService.initializeCategories();
      this.logger.log('工单分类初始化完成');
    } catch (error) {
      this.logger.error(`工单分类初始化失败: ${error.message}`);
    }

    this.logger.log('政民互动工单系统模块初始化完成');
  }
}
