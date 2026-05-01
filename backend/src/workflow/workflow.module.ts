import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review, WorkflowInstance, WorkflowStep } from './entities/review.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { ContentsModule } from '../contents/contents.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, WorkflowInstance, WorkflowStep]),
    ContentsModule,
    AuditModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
