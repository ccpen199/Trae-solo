import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PreReviewService } from './pre-review.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Processor('application')
export class ApplicationConsumer extends WorkerHost {
  constructor(
    private preReviewService: PreReviewService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`处理办件队列任务: job=${job.id} name=${job.name}`, 'ApplicationConsumer');
    switch (job.name) {
      case 'pre-review':
        return this.preReviewService.runPreReview(job.data.applicationId);
      case 'timeout-check':
        return { processed: true };
      default:
        this.logger.warn(`未知任务类型: ${job.name}`, 'ApplicationConsumer');
        return { skipped: true };
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`办件任务完成: job=${job.id}`, 'ApplicationConsumer');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`办件任务失败: job=${job?.id} error=${err.message}`, err.stack, 'ApplicationConsumer');
  }
}
