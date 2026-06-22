import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse } from '../utils';
import type { UserInfo, AuthProgress, UserRole } from '../../shared/types';

const router = Router();

const USER_MAP: Record<string, UserInfo> = {
  '13800138000': {
    id: 'U001',
    phone: '138****1234',
    nickname: '测试用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=U001',
    realName: '张伟',
    idNumber: '110101199001011234',
    role: 'PERSONAL',
    realNameVerified: true,
    enterpriseVerified: false,
  },
  '13800138001': {
    id: 'U002',
    phone: '138****1234',
    nickname: 'HR李经理',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=U002',
    realName: '李娜',
    idNumber: '110101198805055678',
    role: 'ENTERPRISE_HR',
    realNameVerified: true,
    enterpriseVerified: true,
    enterpriseName: '北京星辰科技有限公司',
  },
  '13800138002': {
    id: 'U003',
    phone: '138****1234',
    nickname: '财务王主管',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=U003',
    realName: '王芳',
    idNumber: '110101198512129012',
    role: 'FINANCE',
    realNameVerified: true,
    enterpriseVerified: true,
    enterpriseName: '北京星辰科技有限公司',
  },
  '13800138003': {
    id: 'A001',
    phone: '138****1234',
    nickname: '平台管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A001',
    realName: '陈管理',
    idNumber: '110101198001010001',
    role: 'ADMIN',
    realNameVerified: true,
    enterpriseVerified: true,
    enterpriseName: '社保公积金平台运营中心',
  },
};

const ENTERPRISE_MAP: Record<string, UserInfo> = {
  '91110000MA01234567': {
    id: 'E001',
    phone: '010-88888888',
    nickname: '北京星辰科技',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=E001',
    realName: '企业账号',
    role: 'ENTERPRISE_HR',
    realNameVerified: true,
    enterpriseVerified: true,
    enterpriseName: '北京星辰科技有限公司',
  },
};

const AUTH_PROGRESS_MAP: Record<string, AuthProgress> = {
  U001: {
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
  },
  default: {
    userId: '',
    idCardVerified: false,
    faceVerified: false,
    contractVerified: false,
    overallStatus: 'PENDING',
    submitTime: '',
  },
};

router.post('/login', (req: Request, res: Response) => {
  const { phone, code, password, creditCode, enterprise } = req.body;

  if (enterprise) {
    if (!creditCode || !password) {
      return res.json(sendResponse(null, '请输入信用代码和密码', 400));
    }
    if (!ENTERPRISE_MAP[creditCode]) {
      return res.json(sendResponse(null, '企业信用代码不存在', 401));
    }
    if (password !== '123456') {
      return res.json(sendResponse(null, '企业密码错误', 401));
    }
    const token = 'mock_token_' + Math.random().toString(36).slice(2, 18);
    return res.json(sendResponse({ token, user: ENTERPRISE_MAP[creditCode] }));
  }

  if (!phone) {
    return res.json(sendResponse(null, '手机号不能为空', 400));
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.json(sendResponse(null, '手机号格式错误', 400));
  }
  if ((code && code.length !== 6) || (!code && !password)) {
    return res.json(sendResponse(null, '请输入验证码或密码', 400));
  }

  const user = USER_MAP[phone];
  if (!user) {
    return res.json(sendResponse(null, '手机号未注册，请先注册账号', 401));
  }

  if (code && code !== '123456') {
    return res.json(sendResponse(null, '验证码错误（测试验证码：123456）', 401));
  }
  if (password && user.role === 'ADMIN' && password !== 'admin123') {
    return res.json(sendResponse(null, '管理员密码错误', 401));
  }
  if (password && user.role !== 'ADMIN' && password !== '123456') {
    return res.json(sendResponse(null, '密码错误（测试密码：123456）', 401));
  }
  if (password && password.length < 6) {
    return res.json(sendResponse(null, '密码至少6位', 400));
  }

  const token = 'mock_token_' + Math.random().toString(36).slice(2, 18);
  res.json(sendResponse({ token, user }));
});

router.get('/userinfo', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'U001';
  const user = Object.values(USER_MAP).find((u) => u.id === userId) || USER_MAP['13800138000'];
  res.json(sendResponse(user));
});

router.get('/auth-status', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'U001';
  const progress = AUTH_PROGRESS_MAP[userId] || AUTH_PROGRESS_MAP.default;
  res.json(sendResponse({ ...progress, userId }));
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
