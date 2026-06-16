import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { ScheduledTasks } from './scheduled.tasks';
import { ApplicationModule } from '../modules/application/application.module';
import { NotificationModule } from '../modules/notification/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'application' }, { name: 'notification' }),
    ApplicationModule,
    NotificationModule,
  ],
  providers: [ScheduledTasks],
  exports: [ScheduledTasks],
})
export class TasksModule {}
