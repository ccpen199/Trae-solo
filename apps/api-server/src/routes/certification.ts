import { Router } from 'express';
import type { LivenessSubmitRequest, FaceMatchRequest } from '@gx-rs/shared';
import { authMiddleware } from '../middleware/auth.js';
import { incrementFail, resetLock, checkLocked } from '../utils/lockManager.js';
import {
  createSession,
  submitLiveness,
  submitFaceMatch,
  getSessionResult,
  getCertificationHistory,
} from '../mock/certification.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', (req, res) => {
  const userId = req.userId!;

  const lockStatus = checkLocked(userId);
  if (lockStatus.locked) {
    res.status(423).json({
      code: 423,
      message: `认证已锁定，请${Math.ceil(lockStatus.remainingMs / 3600000)}小时后再试`,
      data: { lockExpiresAt: lockStatus.lockedUntil },
    });
    return;
  }

  const data = createSession(userId);
  res.json({ code: 0, data });
});

router.post('/liveness-submit', (req, res) => {
  const body = req.body as LivenessSubmitRequest;
  const { sessionId, actionIndex, actionResult, encryptedFeatureHash, deviceFingerprint } = body;

  if (!sessionId || actionIndex === undefined || actionResult === undefined || !encryptedFeatureHash || !deviceFingerprint) {
    res.status(400).json({ code: 400, message: '缺少必要参数' });
    return;
  }

  const result = submitLiveness(sessionId, actionIndex, actionResult, encryptedFeatureHash);
  res.json({ code: 0, data: result });
});

router.post('/face-match', (req, res) => {
  const body = req.body as FaceMatchRequest;
  const { sessionId, encryptedFeatureHash } = body;

  if (!sessionId || !encryptedFeatureHash) {
    res.status(400).json({ code: 400, message: '缺少必要参数' });
    return;
  }

  const result = submitFaceMatch(sessionId, encryptedFeatureHash);

  if (result.success && result.matchScore > 0) {
    if (result.matchScore >= 80) {
      resetLock(req.userId!);
    }
  } else if (!result.success) {
    const failResult = incrementFail(req.userId!);
    if (failResult.locked) {
      res.json({
        code: 0,
        data: {
          success: false,
          matchScore: 0,
          locked: true,
          message: `认证失败次数过多，账户已锁定24小时`,
        },
      });
      return;
    }
  }

  res.json({ code: 0, data: result });
});

router.get('/result/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const data = getSessionResult(sessionId);

  if (!data) {
    res.status(404).json({ code: 404, message: '会话不存在' });
    return;
  }

  res.json({ code: 0, data });
});

router.get('/history', (req, res) => {
  const userId = req.userId!;
  const data = getCertificationHistory(userId);
  res.json({ code: 0, data });
});

export default router;
