import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { ScheduledTasks } from './scheduled.tasks';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'application' }, { name: 'notification' }),
  ],
  providers: [ScheduledTasks],
  exports: [ScheduledTasks],
})
export class TasksModule {}
