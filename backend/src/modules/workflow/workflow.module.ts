import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowTask } from './entities/workflow-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowStep, WorkflowInstance, WorkflowTask])],
})
export class WorkflowModule {}
