import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authenticateToken, requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { entity, operation, operatorId, startDate, endDate, page = 1, limit = 20 } = req.query;

    let queryText = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (entity) {
      queryText += ` AND entity = $${paramIndex++}`;
      params.push(entity);
    }

    if (operation) {
      queryText += ` AND operation = $${paramIndex++}`;
      params.push(operation);
    }

    if (operatorId) {
      queryText += ` AND operator_id = $${paramIndex++}`;
      params.push(operatorId);
    }

    if (startDate) {
      queryText += ` AND timestamp >= $${paramIndex++}`;
      params.push(new Date(startDate as string));
    }

    if (endDate) {
      queryText += ` AND timestamp <= $${paramIndex++}`;
      params.push(new Date(endDate as string));
    }

    queryText += ` ORDER BY timestamp DESC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    const logs = result.rows.map((row: any) => ({
      id: row.id,
      operation: row.operation,
      entity: row.entity,
      entityId: row.entity_id,
      operatorId: row.operator_id,
      operatorName: row.operator_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp,
    }));

    let countQuery = `SELECT COUNT(*) as count FROM audit_logs WHERE 1=1`;
    const countParams: unknown[] = [];
    let countIndex = 1;

    if (entity) {
      countQuery += ` AND entity = $${countIndex++}`;
      countParams.push(entity);
    }

    if (operation) {
      countQuery += ` AND operation = $${countIndex++}`;
      countParams.push(operation);
    }

    if (operatorId) {
      countQuery += ` AND operator_id = $${countIndex++}`;
      countParams.push(operatorId);
    }

    if (startDate) {
      countQuery += ` AND timestamp >= $${countIndex++}`;
      countParams.push(new Date(startDate as string));
    }

    if (endDate) {
      countQuery += ` AND timestamp <= $${countIndex++}`;
      countParams.push(new Date(endDate as string));
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      logs,
      total: parseInt(countResult.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: '获取审计日志失败' });
  }
});

router.get('/:id', authenticateToken, requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '审计日志不存在' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      operation: row.operation,
      entity: row.entity,
      entityId: row.entity_id,
      operatorId: row.operator_id,
      operatorName: row.operator_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp,
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: '获取审计日志详情失败' });
  }
});

export async function createAuditLog(
  req: Request,
  operation: 'create' | 'update' | 'delete' | 'login' | 'logout',
  entity: string,
  entityId: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): Promise<void> {
  try {
    const operatorId = req.user?.userId || 'anonymous';
    const operatorName = req.user?.username || '匿名用户';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    await query(
      `INSERT INTO audit_logs (
        id, operation, entity, entity_id, operator_id, operator_name,
        old_value, new_value, ip_address, user_agent
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        uuidv4(),
        operation,
        entity,
        entityId,
        operatorId,
        operatorName,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Create audit log error:', error);
  }
}

export default router;
