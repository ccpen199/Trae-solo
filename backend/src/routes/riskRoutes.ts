import { Router } from 'express';
import { RiskControlEngine } from '../core/riskControlEngine';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';
import type { RiskReport } from '../types';

const router = Router();

router.post('/check-content', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { content, contextType } = req.body as { content: string; contextType: 'message' | 'activity' | 'bubble' };
  const result = RiskControlEngine.evaluateContent(userId, content, contextType || 'message');
  return res.json(result);
}));

router.post('/reports', asyncHandler((req, res) => {
  const reporterId = getAuthUserId(req);
  const { targetUserId, category, description, evidence } = req.body;
  if (!targetUserId || !db.users.get(targetUserId)) {
    res.status(400);
    res.locals.error = { code: 'BAD_REQUEST', message: '被举报用户不存在' };
    return res.json(null);
  }
  const report: RiskReport = {
    id: db.generateId(),
    reporterId,
    targetUserId,
    category,
    description: description || '',
    evidence: evidence || [],
    status: 'pending',
    createdAt: new Date()
  };
  db.riskReports.set(report.id, report);
  RiskControlEngine.createRiskEvent(targetUserId, 'report_submitted', 'high', {
    reportedBy: reporterId,
    reportReason: category
  });
  return res.json(report);
}));

router.get('/events/my', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const events = Array.from(db.riskEvents.values())
    .filter(e => e.userId === userId)
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 50);
  return res.json(events);
}));

router.get('/reports/my', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const reports = Array.from(db.riskReports.values())
    .filter(r => r.reporterId === userId || r.targetUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(reports);
}));

router.get('/status', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const level = RiskControlEngine.getUserRiskLevel(userId);
  const monitor = db.highFrequencyMonitors.get(userId);
  const recentEvents = Array.from(db.riskEvents.values()).filter(
    e => e.userId === userId && e.status !== 'resolved'
  );
  return res.json({
    riskLevel: level,
    monitor,
    openEvents: recentEvents.length,
    recommendations: level === 'critical' ? ['立即联系客服', '暂停使用匹配功能', '补充实名认证材料'] :
      level === 'high' ? ['规范社交行为', '提升信用分', '减少操作频率'] :
      level === 'medium' ? ['注意操作频率', '遵守社区规范'] : ['继续保持良好行为']
  });
}));

export default router;
