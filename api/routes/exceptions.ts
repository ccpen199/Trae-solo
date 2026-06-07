import { Router, type Request, type Response } from 'express';
import { getDb } from '../db/index.js';
import type { ApiResponse, DeliveryException, PaginationParams, PaginatedResponse } from '../../shared/types.js';

const router = Router();

interface ExceptionRow {
  id: number;
  order_id: string;
  type: string;
  description: string;
  evidence?: string;
  reported_by: number;
  reported_at: string;
}

function mapExceptionRow(row: ExceptionRow): DeliveryException {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    description: row.description,
    evidence: row.evidence,
    reportedBy: row.reported_by,
    reportedAt: row.reported_at,
  };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;
    const orderId = req.query.orderId as string;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const conditions: string[] = [];
    const values: any[] = [];

    if (orderId) {
      conditions.push('order_id = ?');
      values.push(orderId);
    }
    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }
    if (startDate) {
      conditions.push('reported_at >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('reported_at <= ?');
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM exceptions ${whereClause}`);
    const { count } = countStmt.get(...values) as { count: number };

    const stmt = db.prepare(`
      SELECT * FROM exceptions ${whereClause}
      ORDER BY reported_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(...values, pageSize, offset) as ExceptionRow[];

    const result: PaginatedResponse<DeliveryException> = {
      items: rows.map(mapExceptionRow),
      total: count,
      page,
      pageSize,
    };

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取异常列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取异常列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const stmt = db.prepare('SELECT * FROM exceptions WHERE id = ?');
    const row = stmt.get(id) as ExceptionRow | undefined;

    if (!row) {
      const response: ApiResponse = {
        success: false,
        message: '异常记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: mapExceptionRow(row),
      message: '获取异常详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取异常详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const { orderId, type, description, evidence, reportedBy } = req.body;

    const orderStmt = db.prepare('SELECT id FROM orders WHERE id = ?');
    const order = orderStmt.get(orderId);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      res.status(404).json(response);
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO exceptions (order_id, type, description, evidence, reported_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(orderId, type, description, evidence || null, reportedBy);

    const getStmt = db.prepare('SELECT * FROM exceptions WHERE id = ?');
    const row = getStmt.get(Number(result.lastInsertRowid)) as ExceptionRow;

    const response: ApiResponse = {
      success: true,
      data: mapExceptionRow(row),
      message: '上报异常成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '上报异常失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const { type, description, evidence } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (type !== undefined) { fields.push('type = ?'); values.push(type); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (evidence !== undefined) { fields.push('evidence = ?'); values.push(evidence); }

    if (fields.length === 0) {
      const getStmt = db.prepare('SELECT * FROM exceptions WHERE id = ?');
      const row = getStmt.get(id) as ExceptionRow | undefined;
      if (!row) {
        const response: ApiResponse = {
          success: false,
          message: '异常记录不存在',
        };
        res.status(404).json(response);
        return;
      }
      const response: ApiResponse = {
        success: true,
        data: mapExceptionRow(row),
        message: '更新异常成功',
      };
      res.json(response);
      return;
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE exceptions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const getStmt = db.prepare('SELECT * FROM exceptions WHERE id = ?');
    const row = getStmt.get(id) as ExceptionRow | undefined;

    if (!row) {
      const response: ApiResponse = {
        success: false,
        message: '异常记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: mapExceptionRow(row),
      message: '更新异常成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新异常失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const stmt = db.prepare('DELETE FROM exceptions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      const response: ApiResponse = {
        success: false,
        message: '异常记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除异常成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '删除异常失败',
    };
    res.status(500).json(response);
  }
});

export default router;
