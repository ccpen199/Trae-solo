import { Router, Response } from 'express';
import { z } from 'zod';
import type { Authorization } from '../../../shared/types';
import { mockAuthorizations, mockDataAccessLogs, mockConsents } from '../data/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generatePrivacyScore } from '../utils/security';

const router = Router();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

const authorizeSchema = z.object({
  granteeId: z.string(),
  dataScope: z.array(z.string()).min(1),
  expiresAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
});

const consentSchema = z.object({
  type: z.string(),
  granted: z.boolean(),
});

router.get('/authorizations', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const authorizations = mockAuthorizations.filter(a => a.grantorId === req.user!.id);

    res.status(200).json({
      success: true,
      data: authorizations,
      total: authorizations.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取授权列表失败', code: 'SERVER_ERROR' });
  }
});

router.post('/authorize', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const validated = authorizeSchema.parse(req.body);

    const existing = mockAuthorizations.find(
      a => a.grantorId === req.user!.id && a.granteeId === validated.granteeId && !a.isRevoked
    );
    if (existing) {
      res.status(409).json({ error: '已存在对该用户的授权', code: 'AUTHORIZATION_EXISTS' });
      return;
    }

    const newAuthorization: Authorization = {
      id: `auth-${generateId()}`,
      grantorId: req.user.id,
      granteeId: validated.granteeId,
      dataScope: validated.dataScope,
      expiresAt: validated.expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    };

    mockAuthorizations.push(newAuthorization);

    res.status(201).json({
      success: true,
      data: newAuthorization,
      message: '数据授权成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '创建授权失败', code: 'SERVER_ERROR' });
  }
});

router.delete('/authorize/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const { id } = req.params;
    const authIndex = mockAuthorizations.findIndex(a => a.id === id);

    if (authIndex === -1) {
      res.status(404).json({ error: '授权不存在', code: 'NOT_FOUND' });
      return;
    }

    if (mockAuthorizations[authIndex].grantorId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ error: '无权撤销此授权', code: 'FORBIDDEN' });
      return;
    }

    mockAuthorizations[authIndex].isRevoked = true;

    res.status(200).json({
      success: true,
      message: '授权已撤销',
    });
  } catch (error) {
    res.status(500).json({ error: '撤销授权失败', code: 'SERVER_ERROR' });
  }
});

router.get('/consents', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const consents = mockConsents.filter(c => c.userId === req.user!.id);

    res.status(200).json({
      success: true,
      data: consents,
    });
  } catch (error) {
    res.status(500).json({ error: '获取同意设置失败', code: 'SERVER_ERROR' });
  }
});

router.post('/consent', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const validated = consentSchema.parse(req.body);

    const consentIndex = mockConsents.findIndex(
      c => c.userId === req.user!.id && c.type === validated.type
    );

    if (consentIndex !== -1) {
      mockConsents[consentIndex].granted = validated.granted;
      mockConsents[consentIndex].updatedAt = new Date();

      res.status(200).json({
        success: true,
        data: mockConsents[consentIndex],
        message: '同意设置已更新',
      });
    } else {
      const newConsent = {
        id: `consent-${generateId()}`,
        userId: req.user.id,
        type: validated.type,
        granted: validated.granted,
        updatedAt: new Date(),
      };
      mockConsents.push(newConsent);

      res.status(201).json({
        success: true,
        data: newConsent,
        message: '同意设置已创建',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '更新同意设置失败', code: 'SERVER_ERROR' });
  }
});

router.get('/access-log', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const logs = mockDataAccessLogs.filter(l => l.targetUserId === req.user!.id);

    res.status(200).json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取访问日志失败', code: 'SERVER_ERROR' });
  }
});

router.get('/privacy-score', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    const userAuthorizations = mockAuthorizations.filter(a => a.grantorId === req.user!.id);
    const userConsents = mockConsents.filter(c => c.userId === req.user!.id);

    const score = generatePrivacyScore(userAuthorizations, userConsents);

    let level = 'high';
    if (score < 40) level = 'low';
    else if (score < 70) level = 'medium';

    res.status(200).json({
      success: true,
      data: {
        score,
        level,
        suggestions: [
          score < 60 ? '考虑撤销不再需要的数据授权' : '授权管理良好',
          userConsents.filter(c => c.granted).length > 2 ? '减少不必要的第三方数据共享同意' : '隐私同意设置合理',
          score < 70 ? '定期审查数据访问日志' : '继续保持良好的隐私习惯',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ error: '获取隐私评分失败', code: 'SERVER_ERROR' });
  }
});

export default router;
