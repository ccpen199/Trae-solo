import { Router } from 'express';
import { SafetyService } from '../services/safetyService';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';

const router = Router();

router.post('/guardians/request', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { toUserId, relationName, permissionLevel, mutual, message } = req.body;
  const result = SafetyService.requestGuardian(userId, toUserId, relationName, permissionLevel, mutual, message);
  if (!result) {
    res.status(400);
    res.locals.error = { code: 'REQUEST_FAILED', message: '请求失败' };
    return res.json(null);
  }
  return res.json(result);
}));

router.post('/guardians/requests/:id/respond', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { accept } = req.body as { accept: boolean };
  const ok = SafetyService.respondToGuardianRequest(req.params.id, userId, accept);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'RESPOND_FAILED', message: '响应失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.get('/guardians/list', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const relations = SafetyService.getUserGuardians(userId).map(r => {
    const otherId = r.guarderId === userId ? r.guardianId : r.guarderId;
    const user = db.users.get(otherId);
    return {
      relation: r,
      user: user ? {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        age: user.age,
        city: user.location.city,
        phone: user.phone,
        emergencyContact: user.emergencyContact
      } : null,
      direction: r.guarderId === userId ? 'i_guard' : 'guards_me'
    };
  });
  return res.json(relations);
}));

router.get('/guardians/requests', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const requests = SafetyService.getUserGuardianRequests(userId).map(r => {
    const fromUser = db.users.get(r.fromUserId);
    const toUser = db.users.get(r.toUserId);
    return {
      ...r,
      fromUser: fromUser ? { id: fromUser.id, nickname: fromUser.nickname, avatar: fromUser.avatar } : null,
      toUser: toUser ? { id: toUser.id, nickname: toUser.nickname, avatar: toUser.avatar } : null
    };
  });
  return res.json(requests);
}));

router.post('/sessions/start', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { guardianIds, activityId, checkInMinutes } = req.body;
  const session = SafetyService.startSafetySession(userId, guardianIds, activityId, checkInMinutes);
  if (!session) {
    res.status(400);
    res.locals.error = { code: 'START_FAILED', message: '启动失败，请先设置守护关系' };
    return res.json(null);
  }
  return res.json(session);
}));

router.post('/sessions/:id/heartbeat', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { latitude, longitude, batteryLevel, signalStrength, isManual } = req.body;
  const result = SafetyService.submitHeartbeat(
    req.params.id, userId, latitude, longitude, batteryLevel, signalStrength, isManual
  );
  if (!result.success) {
    res.status(400);
    res.locals.error = { code: 'HEARTBEAT_FAILED', message: '心跳提交失败' };
    return res.json(null);
  }
  return res.json(result);
}));

router.post('/sessions/:id/whistle', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { severity, latitude, longitude } = req.body;
  const alert = SafetyService.manualTriggerWhistle(
    req.params.id, userId, severity, latitude !== undefined ? { latitude, longitude } : undefined
  );
  if (!alert) {
    res.status(400);
    res.locals.error = { code: 'WHISTLE_FAILED', message: '触发失败' };
    return res.json(null);
  }
  return res.json({
    ...alert,
    session: db.safetySessions.get(req.params.id)
  });
}));

router.post('/sessions/:id/end', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const ok = SafetyService.endSession(req.params.id, userId);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'END_FAILED', message: '结束失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.get('/sessions/list', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const sessions = SafetyService.getUserSessions(userId, req.query.status as never);
  return res.json(sessions);
}));

router.get('/sessions/:id', asyncHandler((req, res) => {
  const session = db.safetySessions.get(req.params.id);
  if (!session) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '会话不存在' };
    return res.json(null);
  }
  const guardians = session.guardianIds.map(gid => {
    const u = db.users.get(gid);
    return u ? { id: gid, nickname: u.nickname, avatar: u.avatar, phone: u.phone } : null;
  }).filter(Boolean);
  return res.json({ ...session, guardianProfiles: guardians });
}));

router.post('/alerts/:id/acknowledge', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const ok = SafetyService.acknowledgeAlert(req.params.id, userId);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'ACK_FAILED', message: '确认失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.post('/alerts/:id/resolve', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { note } = req.body as { note: string };
  const ok = SafetyService.resolveAlert(req.params.id, userId, note);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'RESOLVE_FAILED', message: '处理失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

export default router;
