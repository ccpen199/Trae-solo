import express, { Request, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { generateMatterCode } from '../utils/token';
import { Matter, ApprovalNode, TraceRecord } from '../types';

const router = express.Router();

router.use(authenticateToken);

interface AuthRequest extends Request {
  user?: { userId: string; idCard: string };
}

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { status, page = 1, pageSize = 10, type } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM matters ${whereClause}`);
    const { total } = countStmt.get(...params) as { total: number };

    const offset = (Number(page) - 1) * Number(pageSize);
    const stmt = db.prepare(`
      SELECT * FROM matters ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    params.push(Number(pageSize), offset);

    const matters = stmt.all(...params) as any[];

    return paginatedResponse(res, matters, total, Number(page), Number(pageSize));
  } catch (err) {
    return errorResponse(res, '获取办件列表失败', 500);
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const matter = db.prepare(
      'SELECT * FROM matters WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!matter) {
      return errorResponse(res, '办件不存在', 404);
    }

    const approvalNodes = db.prepare(`
      SELECT * FROM approval_nodes 
      WHERE matter_id = ? 
      ORDER BY node_order ASC
    `).all(id) as any[];

    const traceRecords = db.prepare(`
      SELECT * FROM trace_records 
      WHERE matter_id = ? 
      ORDER BY created_at ASC
    `).all(id) as any[];

    return successResponse(res, {
      matter,
      approvalNodes,
      traceRecords,
    });
  } catch (err) {
    return errorResponse(res, '获取办件详情失败', 500);
  }
});

router.get('/:id/timeline', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const matter = db.prepare(
      'SELECT id, matter_code, title FROM matters WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!matter) {
      return errorResponse(res, '办件不存在', 404);
    }

    const traceRecords = db.prepare(`
      SELECT * FROM trace_records 
      WHERE matter_id = ? 
      ORDER BY created_at ASC
    `).all(id) as any[];

    const approvalNodes = db.prepare(`
      SELECT * FROM approval_nodes 
      WHERE matter_id = ? 
      ORDER BY node_order ASC
    `).all(id) as any[];

    const timeline = [
      ...traceRecords.map(r => ({
        id: r.id,
        type: r.operation_type,
        title: r.operation_name,
        description: r.description,
        operator: r.operator,
        operatorRole: r.operator_role,
        time: r.created_at,
        status: r.status,
        remark: r.remark,
        isApprovalNode: false,
      })),
      ...approvalNodes.map(n => ({
        id: n.id,
        type: 'approval',
        title: n.node_name,
        description: n.description,
        operator: n.operator_name,
        operatorRole: n.node_role,
        time: n.operated_at,
        status: n.status,
        remark: n.remark,
        isApprovalNode: true,
        nodeOrder: n.node_order,
      })),
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return successResponse(res, {
      matter,
      timeline,
    });
  } catch (err) {
    return errorResponse(res, '获取溯源时间线失败', 500);
  }
});

router.post('/apply', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const {
      type,
      title,
      type_name,
      description,
      form_data,
      materials,
      is_cross_province = false,
      target_province,
      target_city,
    } = req.body;

    const matterCode = generateMatterCode();

    const stmt = db.prepare(`
      INSERT INTO matters (
        matter_code, user_id, type, type_name, title, description,
        form_data, materials, status, current_node,
        is_cross_province, target_province, target_city,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      matterCode,
      userId,
      type,
      type_name,
      title,
      description,
      JSON.stringify(form_data || {}),
      JSON.stringify(materials || []),
      'pending',
      'submit',
      is_cross_province ? 1 : 0,
      target_province || null,
      target_city || null,
      now,
      now
    );

    const matterId = result.lastInsertRowid as number;

    db.prepare(`
      INSERT INTO trace_records (
        matter_id, operation_type, operation_name, description,
        operator, operator_role, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      matterId,
      'submit',
      '提交申请',
      `用户提交${type_name}申请`,
      '用户',
      '申请人',
      'completed',
      now
    );

    db.prepare(`
      INSERT INTO approval_nodes (
        matter_id, node_code, node_name, node_role, node_order,
        description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      matterId,
      'review',
      '材料审核',
      '初审员',
      1,
      '审核申请材料是否完整、合规',
      'pending',
      now
    );

    return successResponse(res, {
      id: matterId,
      matterCode,
      status: 'pending',
    }, '申请提交成功');
  } catch (err) {
    return errorResponse(res, '提交申请失败', 500);
  }
});

router.post('/:id/withdraw', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const matter = db.prepare(
      'SELECT * FROM matters WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!matter) {
      return errorResponse(res, '办件不存在', 404);
    }

    if (matter.status !== 'pending' && matter.status !== 'processing') {
      return errorResponse(res, '当前状态无法撤回', 400);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE matters 
      SET status = 'withdrawn', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO trace_records (
        matter_id, operation_type, operation_name, description,
        operator, operator_role, status, remark, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'withdraw',
      '撤回申请',
      '用户主动撤回申请',
      '用户',
      '申请人',
      'completed',
      reason || '',
      now
    );

    return successResponse(res, null, '撤回成功');
  } catch (err) {
    return errorResponse(res, '撤回失败', 500);
  }
});

router.post('/:id/urge', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const matter = db.prepare(
      'SELECT * FROM matters WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!matter) {
      return errorResponse(res, '办件不存在', 404);
    }

    if (matter.status !== 'processing') {
      return errorResponse(res, '当前状态无法催办', 400);
    }

    const lastUrge = db.prepare(`
      SELECT created_at FROM trace_records 
      WHERE matter_id = ? AND operation_type = 'urge'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(id) as any;

    if (lastUrge) {
      const lastTime = new Date(lastUrge.created_at).getTime();
      const now = Date.now();
      if (now - lastTime < 60 * 60 * 1000) {
        return errorResponse(res, '催办过于频繁，请1小时后再试', 400);
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO trace_records (
        matter_id, operation_type, operation_name, description,
        operator, operator_role, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'urge',
      '催办',
      '用户发起催办请求',
      '用户',
      '申请人',
      'completed',
      now
    );

    return successResponse(res, null, '催办成功，已提醒办理人员');
  } catch (err) {
    return errorResponse(res, '催办失败', 500);
  }
});

router.post('/:id/supplement', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;
    const { materials, description } = req.body;

    const matter = db.prepare(
      'SELECT * FROM matters WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!matter) {
      return errorResponse(res, '办件不存在', 404);
    }

    if (matter.status !== 'supplement') {
      return errorResponse(res, '当前状态无需补材料', 400);
    }

    const now = new Date().toISOString();

    const existingMaterials = JSON.parse(matter.materials || '[]');
    const newMaterials = [...existingMaterials, ...(materials || [])];

    db.prepare(`
      UPDATE matters 
      SET materials = ?, status = 'processing', current_node = 'review', updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(newMaterials), now, id);

    db.prepare(`
      INSERT INTO trace_records (
        matter_id, operation_type, operation_name, description,
        operator, operator_role, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'supplement',
      '补充材料',
      description || '用户补充申请材料',
      '用户',
      '申请人',
      'completed',
      now
    );

    db.prepare(`
      UPDATE approval_nodes 
      SET status = 'pending', operated_at = NULL, operator_id = NULL, operator_name = NULL, remark = NULL
      WHERE matter_id = ? AND node_code = 'review'
    `).run(id);

    return successResponse(res, null, '材料补充成功');
  } catch (err) {
    return errorResponse(res, '补充材料失败', 500);
  }
});

router.get('/statistics/summary', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn,
        SUM(CASE WHEN status = 'supplement' THEN 1 ELSE 0 END) as supplement
      FROM matters 
      WHERE user_id = ?
    `).get(userId) as any;

    return successResponse(res, stats);
  } catch (err) {
    return errorResponse(res, '获取统计信息失败', 500);
  }
});

export default router;
