import { Router, Request, Response } from 'express';
import db from '../database';
import { success, error, getPagination, getPagedResult } from '../utils/common';
import { auth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/logs', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const module = req.query.module;
    const action = req.query.action;
    const riskLevel = req.query.riskLevel;
    const userId = req.query.userId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (module) {
      whereConditions.push('a.module = ?');
      params.push(module);
    }
    if (action) {
      whereConditions.push('a.action = ?');
      params.push(action);
    }
    if (riskLevel) {
      whereConditions.push('a.riskLevel = ?');
      params.push(riskLevel);
    }
    if (userId) {
      whereConditions.push('a.userId = ?');
      params.push(Number(userId));
    }
    if (startDate) {
      whereConditions.push('a.createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('a.createdAt <= ?');
      params.push(endDate);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM audit_logs a ${whereSql}
    `).get(...params) as { total: number };

    const logs = db.prepare(`
      SELECT a.*,
             u.name as userName, u.email as userEmail
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      ${whereSql}
      ORDER BY a.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const result = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    res.json(success(getPagedResult(result, countResult.total, page, pageSize), '获取审计日志成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取审计日志失败', 500));
  }
});

router.get('/risks/stats', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const riskStats = db.prepare(`
      SELECT
        riskLevel,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY riskLevel
    `).all() as Array<{ riskLevel: string; count: number }>;

    const moduleStats = db.prepare(`
      SELECT
        module,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN riskLevel = 'high' THEN 1 ELSE 0 END), 0) as highRiskCount
      FROM audit_logs
      GROUP BY module
      ORDER BY highRiskCount DESC
      LIMIT 10
    `).all();

    const actionStats = db.prepare(`
      SELECT
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE riskLevel IN ('high', 'medium')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const recentRisks = db.prepare(`
      SELECT a.*, u.name as userName
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.riskLevel IN ('high', 'medium')
      ORDER BY a.createdAt DESC
      LIMIT 20
    `).all();

    const totalHigh = riskStats.find((r: any) => r.riskLevel === 'high')?.count || 0;
    const totalMedium = riskStats.find((r: any) => r.riskLevel === 'medium')?.count || 0;
    const totalLow = riskStats.find((r: any) => r.riskLevel === 'low')?.count || 0;

    res.json(success({
      summary: {
        total: totalHigh + totalMedium + totalLow,
        high: totalHigh,
        medium: totalMedium,
        low: totalLow
      },
      byModule: moduleStats,
      byAction: actionStats,
      recentRisks
    }, '获取风险预警统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取风险预警统计失败', 500));
  }
});

router.get('/export', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const module = req.query.module;
    const action = req.query.action;
    const riskLevel = req.query.riskLevel;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (module) {
      whereConditions.push('a.module = ?');
      params.push(module);
    }
    if (action) {
      whereConditions.push('a.action = ?');
      params.push(action);
    }
    if (riskLevel) {
      whereConditions.push('a.riskLevel = ?');
      params.push(riskLevel);
    }
    if (startDate) {
      whereConditions.push('a.createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('a.createdAt <= ?');
      params.push(endDate);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const logs = db.prepare(`
      SELECT a.*,
             u.name as userName, u.email as userEmail
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      ${whereSql}
      ORDER BY a.createdAt DESC
      LIMIT 10000
    `).all(...params);

    const result = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    const exportData = {
      exportAt: new Date().toISOString(),
      total: result.length,
      filters: { module, action, riskLevel, startDate, endDate },
      data: result
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit-export-${Date.now()}.json`);

    res.json(success(exportData, '审计日志导出成功'));
  } catch (err: any) {
    res.json(error(err.message || '审计日志导出失败', 500));
  }
});

export default router;
