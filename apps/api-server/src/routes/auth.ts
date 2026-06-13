import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { GstLoginUrlResponse, LoginResponse } from '@gx-rs/shared';
import { mockUsers, getMaskedUser } from '../mock/users.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gx-rs-platform-secret-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function generateTokens(userId: string, role: 'user' | 'admin') {
  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId, role, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' } as jwt.SignOptions);
  return { token, refreshToken };
}

router.post('/gst/login-url', (_req, res) => {
  const state = `gst_state_${Date.now()}`;
  const redirectUrl = `https://gst.gxzf.gov.cn/oauth/authorize?appid=${process.env.GST_APP_ID}&redirect_uri=${encodeURIComponent('http://localhost:5176/auth/callback')}&state=${state}`;

  const response: GstLoginUrlResponse = {
    redirectUrl,
    state,
  };

  res.json({ code: 0, data: response });
});

router.post('/gst/callback', (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ code: 400, message: '缺少授权码' });
    return;
  }

  const user = mockUsers[0];
  const { token, refreshToken } = generateTokens(user.id, user.role);
  const maskedInfo = getMaskedUser(user);

  const response: LoginResponse = {
    token,
    refreshToken,
    userInfo: {
      id: maskedInfo.id,
      nameMasked: maskedInfo.nameMasked,
      idCardMasked: maskedInfo.idCardMasked,
      socialCardMasked: maskedInfo.socialCardMasked,
      insureStatus: maskedInfo.insureStatus,
    },
  };

  res.json({ code: 0, data: response });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ code: 400, message: '缺少刷新令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; role: 'user' | 'admin'; type: string };

    if (decoded.type !== 'refresh') {
      res.status(401).json({ code: 401, message: '无效的刷新令牌' });
      return;
    }

    const user = mockUsers.find((u) => u.id === decoded.userId);
    if (!user) {
      res.status(401).json({ code: 401, message: '用户不存在' });
      return;
    }

    const tokens = generateTokens(user.id, user.role);
    const maskedInfo = getMaskedUser(user);

    const response: LoginResponse = {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      userInfo: {
        id: maskedInfo.id,
        nameMasked: maskedInfo.nameMasked,
        idCardMasked: maskedInfo.idCardMasked,
        socialCardMasked: maskedInfo.socialCardMasked,
        insureStatus: maskedInfo.insureStatus,
      },
    };

    res.json({ code: 0, data: response });
  } catch {
    res.status(401).json({ code: 401, message: '刷新令牌无效或已过期' });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ code: 0, message: '注销成功' });
});

export default router;
