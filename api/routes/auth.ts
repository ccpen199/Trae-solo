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

router.post('/idcard-ocr', (req: Request, res: Response) => {
  const { idCardFront, idCardBack } = req.body;
  if (!idCardFront && !idCardBack) {
    return res.json(sendResponse(null, '请上传身份证照片', 400));
  }
  setTimeout(() => {
    res.json(
      sendResponse({
        ...mockAuthProgress.idCardInfo,
        frontRecognized: !!idCardFront,
        backRecognized: !!idCardBack,
        confidence: 0.98,
      })
    );
  }, 1200);
});

router.post('/face-verify', (req: Request, res: Response) => {
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
  }, 1500);
});

router.post('/contract-ocr', (req: Request, res: Response) => {
  const { fileName } = req.body;
  if (!fileName) {
    return res.json(sendResponse(null, '请上传劳动合同', 400));
  }
  setTimeout(() => {
    res.json(
      sendResponse([
        {
          contractNo: 'HT' + Date.now().toString().slice(-8) + 'BJ001',
          salary: '¥15,000/月',
          position: '技术专员',
          termStart: '2024-01-01',
          termEnd: '2027-01-01',
          companyName: '北京某某科技有限公司',
        },
      ])
    );
  }, 1800);
});

export default router;
