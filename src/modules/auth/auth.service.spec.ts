import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { YueShengshiAuthAdapter } from './adapters/yueshengshi.adapter';
import { FaceRecognitionAdapter } from './adapters/face-recognition.adapter';
import { SocialCardAdapter } from './adapters/social-card.adapter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        JwtService,
        ConfigService,
        YueShengshiAuthAdapter,
        FaceRecognitionAdapter,
        SocialCardAdapter,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate tokens successfully', async () => {
    const mockUser = {
      id: 'test-id',
      realName: '测试用户',
      phoneNumber: '13800138000',
      authType: 'YUE_SHENGSHI',
      isVerified: true,
    };
    jest.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce(mockUser as any);
    jest.spyOn(prisma.user, 'update').mockResolvedValueOnce(mockUser as any);

    const result = await service.loginWithYueShengshi('test-code');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.id).toBe('test-id');
  });
});
