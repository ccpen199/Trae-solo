import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware, authLevelMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import { generateMockPopulationProfile, generateMockAppealClusters, generateGridStats } from '../utils/mockData';
import type { PopulationProfile, AppealCluster, GridEvent, Grid, EventHistoryItem } from '../../shared/types';

const router = Router();

router.use(authMiddleware(['government', 'grid_admin', 'grid_worker']), authLevelMiddleware(2));

router.get('/population', auditMiddleware('get_population_profile', 'governance'), (req: Request, res: Response) => {
  const profile = generateMockPopulationProfile();
  successResponse(res, profile, '获取人口画像成功');
});

router.get('/appeals', auditMiddleware('get_appeal_clusters', 'governance'), (req: Request, res: Response) => {
  const { period = '7d' } = req.query;
  const clusters = generateMockAppealClusters();

  const summary = {
    totalAppeals: clusters.reduce((sum, c) => sum + c.count, 0),
    avgResolutionTime: Math.round(clusters.reduce((sum, c) => sum + c.avgResolutionTime, 0) / clusters.length * 10) / 10,
    overallSatisfaction: Math.round(clusters.reduce((sum, c) => sum + c.satisfactionRate, 0) / clusters.length * 10) / 10,
    upTrendCount: clusters.filter((c) => c.trend === 'up').length,
    downTrendCount: clusters.filter((c) => c.trend === 'down').length,
    period: period as string,
  };

  successResponse(res, { clusters, summary }, '获取诉求聚类分析成功');
});

router.get('/grid/events', auditMiddleware('list_grid_events', 'governance'), (req: Request, res: Response) => {
  const { status, gridId, page = 1, pageSize = 10 } = req.query;

  let query = `
    SELECT ge.*, g.name as grid_name, g.code as grid_code
    FROM grid_events ge
    JOIN grids g ON ge.grid_id = g.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND ge.status = ?';
    params.push(status);
  }

  if (gridId) {
    query += ' AND ge.grid_id = ?';
    params.push(gridId);
  }

  query += ' ORDER BY ge.report_time DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const events = db.prepare(query).all(...params) as any[];

  const result: GridEvent[] = events.map((e) => {
    const histories = db
      .prepare('SELECT * FROM event_history WHERE event_id = ? ORDER BY created_at')
      .all(e.id) as any[];

    const history: EventHistoryItem[] = histories.map((h) => ({
      action: h.action,
      operator: h.operator,
      time: h.created_at,
      remark: h.remark || undefined,
    }));

    return {
      id: e.id,
      gridId: e.grid_id,
      gridName: e.grid_name,
      type: e.type,
      typeIcon: e.type_icon,
      description: e.description,
      reporter: e.reporter,
      reporterPhone: e.reporter_phone || undefined,
      reportTime: e.report_time,
      status: e.status,
      assignee: e.assignee || undefined,
      assignedTime: e.assigned_time || undefined,
      resolvedTime: e.resolved_time || undefined,
      closedTime: e.closed_time || undefined,
      latitude: e.latitude,
      longitude: e.longitude,
      images: e.images ? JSON.parse(e.images) : undefined,
      history,
      priority: e.priority as GridEvent['priority'],
    };
  });

  const countQuery = `
    SELECT COUNT(*) as count FROM grid_events ge WHERE 1=1
    ${status ? 'AND ge.status = ?' : ''}
    ${gridId ? 'AND ge.grid_id = ?' : ''}
  `;
  const countParams = status && gridId ? [status, gridId] : status ? [status] : gridId ? [gridId] : [];
  const total = db.prepare(countQuery).get(...countParams) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取网格事件成功'
  );
});

router.get('/grid/events/:id', auditMiddleware('view_grid_event', 'governance'), (req: Request, res: Response) => {
  const event = db
    .prepare(
      `SELECT ge.*, g.name as grid_name, g.code as grid_code
       FROM grid_events ge
       JOIN grids g ON ge.grid_id = g.id
       WHERE ge.id = ?`
    )
    .get(req.params.id) as any;

  if (!event) {
    return errorResponse(res, '事件不存在', 404);
  }

  const histories = db
    .prepare('SELECT * FROM event_history WHERE event_id = ? ORDER BY created_at')
    .all(event.id) as any[];

  const history: EventHistoryItem[] = histories.map((h) => ({
    action: h.action,
    operator: h.operator,
    time: h.created_at,
    remark: h.remark || undefined,
  }));

  const result: GridEvent = {
    id: event.id,
    gridId: event.grid_id,
    gridName: event.grid_name,
    type: event.type,
    typeIcon: event.type_icon,
    description: event.description,
    reporter: event.reporter,
    reporterPhone: event.reporter_phone || undefined,
    reportTime: event.report_time,
    status: event.status,
    assignee: event.assignee || undefined,
    assignedTime: event.assigned_time || undefined,
    resolvedTime: event.resolved_time || undefined,
    closedTime: event.closed_time || undefined,
    latitude: event.latitude,
    longitude: event.longitude,
    images: event.images ? JSON.parse(event.images) : undefined,
    history,
    priority: event.priority as GridEvent['priority'],
  };

  successResponse(res, result, '获取事件详情成功');
});

router.put('/grid/events/:id', auditMiddleware('update_grid_event', 'governance'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { id } = req.params;
  const { status, assignee, remark } = req.body;

  const event = db.prepare('SELECT * FROM grid_events WHERE id = ?').get(id) as any;
  if (!event) {
    return errorResponse(res, '事件不存在', 404);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);

    if (status === 'assigned') {
      updates.push('assigned_time = ?');
      params.push(new Date().toISOString());
    } else if (status === 'resolved') {
      updates.push('resolved_time = ?');
      params.push(new Date().toISOString());
    } else if (status === 'closed') {
      updates.push('closed_time = ?');
      params.push(new Date().toISOString());
    }
  }

  if (assignee) {
    updates.push('assignee = ?');
    params.push(assignee);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE grid_events SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const actionMap: Record<string, string> = {
      assigned: '分派事件',
      processing: '开始处理',
      resolved: '解决事件',
      closed: '结案',
    };

    db.prepare(`
      INSERT INTO event_history (event_id, action, operator, remark)
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      status ? actionMap[status] || '更新状态' : '更新信息',
      req.user.userId,
      remark || null
    );
  }

  successResponse(res, { eventId: id, status: status || event.status }, '事件更新成功');
});

router.get('/grids', auditMiddleware('list_grids', 'governance'), (req: Request, res: Response) => {
  const grids = db.prepare('SELECT * FROM grids ORDER BY code').all() as any[];

  const result: Grid[] = grids.map((g) => {
    const stats = generateGridStats(g);
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      area: g.area,
      population: g.population,
      households: g.households,
      eventCount: stats.eventCount,
      unresolvedCount: stats.unresolvedCount,
      boundary: g.boundary ? JSON.parse(g.boundary) : undefined,
    };
  });

  successResponse(res, result, '获取网格列表成功');
});

router.get('/overview', auditMiddleware('get_governance_overview', 'governance'), (req: Request, res: Response) => {
  const totalGrids = db.prepare('SELECT COUNT(*) as count FROM grids').get() as { count: number };
  const totalPopulation = db.prepare('SELECT SUM(population) as total FROM grids').get() as { total: number };

  const eventStats = db
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
       FROM grid_events
       WHERE report_time >= DATE('now', '-30 days')`
    )
    .get() as any;

  const priorityStats = db
    .prepare(
      `SELECT priority, COUNT(*) as count
       FROM grid_events
       WHERE report_time >= DATE('now', '-7 days')
       GROUP BY priority`
    )
    .all() as any[];

  const typeStats = db
    .prepare(
      `SELECT type, type_icon, COUNT(*) as count
       FROM grid_events
       WHERE report_time >= DATE('now', '-30 days')
       GROUP BY type, type_icon
       ORDER BY count DESC`
    )
    .all() as any[];

  successResponse(
    res,
    {
      totalGrids: totalGrids.count,
      totalPopulation: totalPopulation.total || 0,
      eventStats: {
        total: eventStats.total || 0,
        reported: eventStats.reported || 0,
        assigned: eventStats.assigned || 0,
        processing: eventStats.processing || 0,
        resolved: eventStats.resolved || 0,
        closed: eventStats.closed || 0,
      },
      priorityStats,
      typeStats,
      updateTime: new Date().toISOString(),
    },
    '获取治理概览成功'
  );
});

export default router;
