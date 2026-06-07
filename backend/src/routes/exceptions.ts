import { Router, Response } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { checkExceptions, reassignKnight, autoReassign, getExceptions } from '../services/circuitBreaker.ts';

const router = Router();

function serializeException(row: any) {
  if (!row) return row;
  const resolved = row.status === 'resolved' || row.status === 'auto_reassigned';
  return {
    ...row,
    resolved,
    checked: resolved,
    waybill: row.waybill_id
      ? {
          id: row.waybill_id,
          order_no: row.order_no,
          status: row.waybill_status,
        }
      : null,
    original_knight: row.original_knight_id
      ? {
          id: row.original_knight_id,
          name: row.original_knight_name,
        }
      : null,
    new_knight: row.new_knight_id
      ? {
          id: row.new_knight_id,
          name: row.new_knight_name,
        }
      : null,
  };
}

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const status = req.query.status as string;
  const type = req.query.type as string;

  const result = getExceptions({ status, type }, pageSize, offset);
  const list = result.exceptions.map(serializeException);

  res.json({
    code: 0,
    data: {
      list,
      total: result.total,
      page,
      pageSize,
    },
    message: 'Success',
  });
});

router.post('/check', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  const result = checkExceptions();

  res.json({
    code: 0,
    data: result,
    message: `Exception check complete. Found ${result.total} exceptions.`,
  });
});

router.put('/:id/resolve', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { new_knight_id, auto } = req.body;

  if (auto) {
    const result = autoReassign(id);
    if (!result.success) {
      return res.json({ code: -1, message: result.message });
    }
    return res.json({
      code: 0,
      data: { knight: result.knight, waybill: result.waybill },
      message: result.message,
    });
  }

  if (!new_knight_id) {
    return res.json({ code: -1, message: 'new_knight_id is required' });
  }

  const result = reassignKnight(id, new_knight_id);

  if (!result.success) {
    return res.json({ code: -1, message: result.message });
  }

  res.json({
    code: 0,
    data: result.waybill,
    message: result.message,
  });
});

export default router;
