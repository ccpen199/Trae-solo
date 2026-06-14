import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('AiService', () => {
  let service: AiService;

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        PrismaService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should answer question with fallback', async () => {
    const mockPrisma = (service as any).prisma;
    jest.spyOn(mockPrisma.aiTrainingCorpus, 'findMany').mockResolvedValueOnce([]);
    const result = await service.ask({ question: '如何办理身份证？' });
    expect(result).toHaveProperty('answer');
    expect(result).toHaveProperty('confidence');
  });
});
