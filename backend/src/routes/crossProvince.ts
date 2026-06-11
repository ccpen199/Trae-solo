import express, { Request, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { CrossProvinceNode, DataExchangeRecord, CrossProvinceService } from '../types';

const router = express.Router();

router.use(authenticateToken);

interface AuthRequest extends Request {
  user?: { userId: string; idCard: string };
}

router.get('/nodes', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();

    const nodes = db.prepare(`
      SELECT * FROM cross_province_nodes 
      WHERE status = 'active'
      ORDER BY province, city
    `).all() as any[];

    const nodeStats = db.prepare(`
      SELECT 
        node_id,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        AVG(CASE WHEN status = 'completed' THEN 
          JULIANDAY(completed_at) - JULIANDAY(created_at) 
        ELSE NULL END) as avg_processing_days
      FROM data_exchange_records
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY node_id
    `).all() as any[];

    const statsMap = new Map();
    nodeStats.forEach((s: any) => statsMap.set(s.node_id, s));

    const nodesWithStats = nodes.map((node: any) => {
      const stats = statsMap.get(node.id) || {};
      return {
        ...node,
        statistics: {
          pendingCount: stats.pending_count || 0,
          processingCount: stats.processing_count || 0,
          completedCount: stats.completed_count || 0,
          avgProcessingDays: stats.avg_processing_days 
            ? Number(stats.avg_processing_days.toFixed(1)) 
            : 0,
        },
      };
    });

    return successResponse(res, nodesWithStats);
  } catch (err) {
    return errorResponse(res, '获取协同节点失败', 500);
  }
});

router.get('/nodes/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const node = db.prepare(
      'SELECT * FROM cross_province_nodes WHERE id = ?'
    ).get(id) as any;

    if (!node) {
      return errorResponse(res, '节点不存在', 404);
    }

    const statusLogs = db.prepare(`
      SELECT * FROM node_status_logs 
      WHERE node_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(id) as any[];

    const currentStatus = node.status;
    const lastCheck = node.last_heartbeat;

    return successResponse(res, {
      node: {
        id: node.id,
        name: node.node_name,
        province: node.province,
        city: node.city,
        status: currentStatus,
        lastHeartbeat: lastCheck,
        endpoint: node.endpoint,
        isOnline: currentStatus === 'active',
      },
      recentLogs: statusLogs,
    });
  } catch (err) {
    return errorResponse(res, '获取节点状态失败', 500);
  }
});

router.get('/services', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { province, page = 1, pageSize = 20 } = req.query;

    let whereClause = 'WHERE status = ?';
    const params: any[] = ['active'];

    if (province && province !== 'all') {
      whereClause += ' AND available_provinces LIKE ?';
      params.push(`%${province}%`);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM cross_province_services ${whereClause}`);
    const { total } = countStmt.get(...params) as any;

    const offset = (Number(page) - 1) * Number(pageSize);
    const stmt = db.prepare(`
      SELECT * FROM cross_province_services ${whereClause}
      ORDER BY hot_level DESC
      LIMIT ? OFFSET ?
    `);
    params.push(Number(pageSize), offset);

    const services = stmt.all(...params) as any[];

    return paginatedResponse(res, services, total, Number(page), Number(pageSize));
  } catch (err) {
    return errorResponse(res, '获取跨省服务失败', 500);
  }
});

router.get('/services/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const service = db.prepare(
      'SELECT * FROM cross_province_services WHERE id = ?'
    ).get(id) as any;

    if (!service) {
      return errorResponse(res, '服务不存在', 404);
    }

    return successResponse(res, service);
  } catch (err) {
    return errorResponse(res, '获取服务详情失败', 500);
  }
});

router.get('/exchange-records', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { status, node_id, page = 1, pageSize = 20 } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (node_id) {
      whereClause += ' AND node_id = ?';
      params.push(node_id);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM data_exchange_records ${whereClause}`);
    const { total } = countStmt.get(...params) as any;

    const offset = (Number(page) - 1) * Number(pageSize);
    const stmt = db.prepare(`
      SELECT d.*, n.node_name, n.province, n.city
      FROM data_exchange_records d
      LEFT JOIN cross_province_nodes n ON d.node_id = n.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `);
    params.push(Number(pageSize), offset);

    const records = stmt.all(...params) as any[];

    return paginatedResponse(res, records, total, Number(page), Number(pageSize));
  } catch (err) {
    return errorResponse(res, '获取交换记录失败', 500);
  }
});

router.get('/exchange-records/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const record = db.prepare(`
      SELECT d.*, n.node_name, n.province, n.city, n.endpoint
      FROM data_exchange_records d
      LEFT JOIN cross_province_nodes n ON d.node_id = n.id
      WHERE d.id = ? AND d.user_id = ?
    `).get(id, userId) as any;

    if (!record) {
      return errorResponse(res, '记录不存在', 404);
    }

    const traceLogs = db.prepare(`
      SELECT * FROM data_exchange_logs 
      WHERE exchange_id = ?
      ORDER BY created_at ASC
    `).all(id) as any[];

    return successResponse(res, {
      record,
      traceLogs,
    });
  } catch (err) {
    return errorResponse(res, '获取交换详情失败', 500);
  }
});

router.post('/initiate-transfer', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const {
      matter_id,
      target_node_id,
      service_code,
      service_name,
      data_type,
      data_payload,
      priority = 'normal',
    } = req.body;

    const sourceNode = db.prepare(
      'SELECT * FROM cross_province_nodes WHERE province = ? AND is_source = 1'
    ).get('江苏省') as any;

    if (!sourceNode) {
      return errorResponse(res, '源节点配置错误', 500);
    }

    const targetNode = db.prepare(
      'SELECT * FROM cross_province_nodes WHERE id = ? AND status = ?'
    ).get(target_node_id, 'active') as any;

    if (!targetNode) {
      return errorResponse(res, '目标节点不可用', 400);
    }

    const exchangeNo = generateExchangeNo();
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO data_exchange_records (
        exchange_no, matter_id, user_id, source_node_id, target_node_id,
        service_code, service_name, data_type, data_payload, priority,
        status, retry_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exchangeNo,
      matter_id || null,
      userId,
      sourceNode.id,
      target_node_id,
      service_code,
      service_name,
      data_type,
      JSON.stringify(data_payload || {}),
      priority,
      'pending',
      0,
      now,
      now
    );

    const recordId = result.lastInsertRowid as number;

    db.prepare(`
      INSERT INTO data_exchange_logs (
        exchange_id, operation_type, operation_name, description,
        operator, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      recordId,
      'initiate',
      '发起数据传输',
      `发起向${targetNode.province}${targetNode.city}的跨省数据传输`,
      '用户',
      'completed',
      now
    );

    db.prepare(`
      INSERT INTO data_exchange_logs (
        exchange_id, operation_type, operation_name, description,
        operator, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      recordId,
      'queue',
      '进入传输队列',
      '数据已进入传输队列，等待调度',
      '系统',
      'completed',
      now
    );

    setTimeout(() => {
      try {
        const now2 = new Date().toISOString();
        db.prepare(`
          UPDATE data_exchange_records 
          SET status = 'processing', started_at = ?, updated_at = ?
          WHERE id = ?
        `).run(now2, now2, recordId);

        db.prepare(`
          INSERT INTO data_exchange_logs (
            exchange_id, operation_type, operation_name, description,
            operator, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          recordId,
          'transfer',
          '数据传输中',
          `正在向${targetNode.node_name}传输数据`,
          '系统',
          'completed',
          now2
        );

        setTimeout(() => {
          try {
            const now3 = new Date().toISOString();
            db.prepare(`
              UPDATE data_exchange_records 
              SET status = 'completed', completed_at = ?, updated_at = ?,
                  response_data = ?
              WHERE id = ?
            `).run(
              now3, 
              now3,
              JSON.stringify({
                success: true,
                receivedAt: now3,
                nodeConfirmation: `${targetNode.node_name}已确认接收`,
                transactionId: `TRX-${Date.now()}`,
              }),
              recordId
            );

            db.prepare(`
              INSERT INTO data_exchange_logs (
                exchange_id, operation_type, operation_name, description,
                operator, status, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
              recordId,
              'complete',
              '传输完成',
              `${targetNode.province}${targetNode.city}节点已成功接收并确认`,
              '系统',
              'completed',
              now3
            );
          } catch (e) {
            console.error('模拟传输完成失败', e);
          }
        }, 3000);
      } catch (e) {
        console.error('模拟传输开始失败', e);
      }
    }, 2000);

    return successResponse(res, {
      id: recordId,
      exchangeNo,
      status: 'pending',
      targetNode: {
        id: targetNode.id,
        name: targetNode.node_name,
        province: targetNode.province,
        city: targetNode.city,
      },
      estimatedTime: '约5秒',
    }, '跨省数据传输已发起');
  } catch (err) {
    return errorResponse(res, '发起传输失败', 500);
  }
});

router.post('/exchange-records/:id/retry', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const record = db.prepare(
      'SELECT * FROM data_exchange_records WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!record) {
      return errorResponse(res, '记录不存在', 404);
    }

    if (record.status !== 'failed') {
      return errorResponse(res, '仅失败状态可重试', 400);
    }

    if (record.retry_count >= 3) {
      return errorResponse(res, '重试次数已达上限', 400);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE data_exchange_records 
      SET status = 'pending', retry_count = retry_count + 1, updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO data_exchange_logs (
        exchange_id, operation_type, operation_name, description,
        operator, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'retry',
      '重试传输',
      `第${record.retry_count + 1}次重试`,
      '用户',
      'completed',
      now
    );

    return successResponse(res, null, '重试已发起');
  } catch (err) {
    return errorResponse(res, '重试失败', 500);
  }
});

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const nodeStats = db.prepare(`
      SELECT 
        COUNT(*) as total_nodes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as online_nodes,
        SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as offline_nodes
      FROM cross_province_nodes
    `).get() as any;

    const exchangeStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM data_exchange_records
      WHERE user_id = ?
    `).get(userId) as any;

    const provinceStats = db.prepare(`
      SELECT 
        n.province,
        COUNT(d.id) as count,
        SUM(CASE WHEN d.status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM data_exchange_records d
      LEFT JOIN cross_province_nodes n ON d.target_node_id = n.id
      WHERE d.user_id = ?
      GROUP BY n.province
      ORDER BY count DESC
    `).all(userId) as any[];

    const recentActivity = db.prepare(`
      SELECT d.*, n.node_name, n.province, n.city
      FROM data_exchange_records d
      LEFT JOIN cross_province_nodes n ON d.target_node_id = n.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
      LIMIT 10
    `).all(userId) as any[];

    return successResponse(res, {
      nodes: {
        total: nodeStats.total_nodes,
        online: nodeStats.online_nodes,
        offline: nodeStats.offline_nodes,
        onlineRate: nodeStats.total_nodes > 0 
          ? Math.round((nodeStats.online_nodes / nodeStats.total_nodes) * 100) 
          : 0,
      },
      exchanges: exchangeStats,
      byProvince: provinceStats,
      recentActivity,
    });
  } catch (err) {
    return errorResponse(res, '获取调度看板数据失败', 500);
  }
});

function generateExchangeNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CPEX${year}${month}${day}${random}`;
}

export default router;
