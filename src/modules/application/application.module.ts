import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationTimelineService } from './application-timeline.service';
import { MaterialUploadService } from './material-upload.service';
import { PreReviewService } from './pre-review.service';
import { ApprovalService } from './approval.service';
import { ApplicationConsumer } from './application.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'application',
    }),
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationTimelineService,
    MaterialUploadService,
    PreReviewService,
    ApprovalService,
    ApplicationConsumer,
  ],
  exports: [ApplicationService, ApplicationTimelineService, PreReviewService, ApprovalService],
})
export class ApplicationModule {}
