import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse } from '../utils';
import type { UserInfo, AuthProgress } from '../../shared/types';

const router = Router();

const mockUser: UserInfo = {
  id: 'U001',
  phone: '138****1234',
  nickname: '测试用户',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=U001',
  realName: '张伟',
  idNumber: '110101199001011234',
  role: 'PERSONAL',
  realNameVerified: true,
  enterpriseVerified: false,
  enterpriseName: undefined,
};

const mockAuthProgress: AuthProgress = {
  userId: 'U001',
  idCardVerified: true,
  faceVerified: true,
  contractVerified: true,
  overallStatus: 'VERIFIED',
  submitTime: '2025-05-01T10:00:00.000Z',
  verifyTime: '2025-05-01T10:30:00.000Z',
  idCardInfo: {
    name: '张伟',
    idNumber: '110101199001011234',
    gender: '男',
    ethnicity: '汉族',
    birthDate: '1990-01-01',
    address: '北京市东城区某某街道1号',
    issuingAuthority: '北京市公安局东城分局',
    validFrom: '2010-01-01',
    validTo: '2030-01-01',
  },
};

router.post('/login', (req: Request, res: Response) => {
  const { phone, code, password } = req.body;
  if (!phone) {
    return res.json(sendResponse(null, '手机号不能为空', 400));
  }
  if ((code && code.length !== 6) || (!code && !password)) {
    return res.json(sendResponse(null, '验证码或密码错误', 401));
  }
  const token = 'mock_token_' + Math.random().toString(36).slice(2, 18);
  res.json(sendResponse({ token, user: mockUser }));
});

router.get('/userinfo', (_req: Request, res: Response) => {
  res.json(sendResponse(mockUser));
});

router.get('/auth-status', (_req: Request, res: Response) => {
  res.json(sendResponse(mockAuthProgress));
});

router.post('/ocr/submit', (req: Request, res: Response) => {
  const { idCardFront, idCardBack } = req.body;
  if (!idCardFront) {
    return res.json(sendResponse(null, '请上传身份证正面', 400));
  }
  setTimeout(() => {
    res.json(
      sendResponse({
        ...mockAuthProgress.idCardInfo,
        frontRecognized: true,
        backRecognized: !!idCardBack,
        confidence: 0.98,
      })
    );
  }, 800);
});

router.post('/face/verify', (req: Request, res: Response) => {
  const { faceImage } = req.body;
  if (!faceImage) {
    return res.json(sendResponse(null, '请上传人脸照片', 400));
  }
  setTimeout(() => {
    const success = Math.random() > 0.05;
    res.json(
      sendResponse({
        passed: success,
        similarity: success ? 0.92 + Math.random() * 0.07 : 0.55 + Math.random() * 0.2,
        livenessScore: success ? 0.95 : 0.4,
        reason: success ? undefined : '人脸不匹配，请重试',
      })
    );
  }, 1200);
});

export default router;
