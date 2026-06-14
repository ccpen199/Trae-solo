import { Test, TestingModule } from '@nestjs/testing';
import { PreReviewService } from './pre-review.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationTimelineService } from './application-timeline.service';
import { NotificationService } from '../notification/notification.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('PreReviewService', () => {
  let service: PreReviewService;
  let prisma: PrismaService;

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreReviewService,
        PrismaService,
        ApplicationTimelineService,
        {
          provide: NotificationService,
          useValue: { createNotification: jest.fn().mockResolvedValue([]) },
        },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PreReviewService>(PreReviewService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return passed false for non-existent application', async () => {
    jest.spyOn(prisma.application, 'findUnique').mockResolvedValueOnce(null);
    const result = await service.runPreReview('non-existent-id');
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });
});
