import { Router, Response } from 'express';
import db from '../db/database.ts';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { getCandidateKnights, logDispatch } from '../services/dispatch.ts';

const router = Router();

function serializeCandidate(candidate: any) {
  if (!candidate) return candidate;
  const { knight, ...rest } = candidate;
  return rest;
}

function serializeDispatchLog(row: any) {
  if (!row) return row;
  return {
    ...row,
    action: row.result === 'assigned' ? '已分配' : row.result,
    knight: row.knight_id
      ? {
          id: row.knight_id,
          name: row.knight_name,
        }
      : null,
  };
}

router.get('/candidates/:waybillId', authMiddleware, (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId) as any;

  if (!waybill) {
    return res.json({ code: -1, message: 'Waybill not found' });
  }

  const candidates = getCandidateKnights(waybill).map(serializeCandidate);

  res.json({
    code: 0,
    data: candidates,
    message: 'Success',
  });
});

router.post('/auto/:waybillId', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId) as any;

  if (!waybill) {
    return res.json({ code: -1, message: 'Waybill not found' });
  }

  if (waybill.status !== 'pending') {
    return res.json({ code: -1, message: 'Only pending waybills can be dispatched' });
  }

  const candidates = getCandidateKnights(waybill);

  if (candidates.length === 0) {
    return res.json({ code: -1, message: 'No available knights found' });
  }

  const bestKnight = candidates[0];

  db.prepare(`
    UPDATE waybills SET knight_id = ?, status = 'accepted', updated_at = ? WHERE id = ?
  `).run(bestKnight.id, new Date().toISOString(), waybillId);

  db.prepare(`
    UPDATE knights SET current_load = current_load + 1, status = 'busy' WHERE id = ?
  `).run(bestKnight.id);

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(waybillId, 'pending', 'accepted', req.user?.id || null, 'Auto-dispatched');

  logDispatch(
    waybillId,
    bestKnight.id,
    {
      score: bestKnight.score,
      distance_score: bestKnight.distance_score,
      load_score: bestKnight.load_score,
      history_score: bestKnight.history_score,
      insurance_score: bestKnight.insurance_score,
      distance: bestKnight.distance,
    },
    'assigned'
  );

  const updatedWaybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId);

  res.json({
    code: 0,
    data: {
      waybill: updatedWaybill,
      knight: bestKnight,
    },
    message: 'Dispatch successful',
  });
});

router.post('/manual', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const { waybill_id, knight_id } = req.body;
  const parsedKnightId = parseInt(knight_id);

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybill_id) as any;

  if (!waybill) {
    return res.json({ code: -1, message: 'Waybill not found' });
  }

  if (waybill.status !== 'pending') {
    return res.json({ code: -1, message: 'Only pending waybills can be dispatched' });
  }

  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(parsedKnightId) as any;

  if (!knight) {
    return res.json({ code: -1, message: 'Knight not found' });
  }

  if (knight.status === 'offline') {
    return res.json({ code: -1, message: 'Knight is offline' });
  }

  if (knight.current_load >= knight.capacity) {
    return res.json({ code: -1, message: 'Knight is at full capacity' });
  }

  const candidates = getCandidateKnights(waybill);
  const match = candidates.find((c: any) => c.id === parsedKnightId);

  db.prepare(`
    UPDATE waybills SET knight_id = ?, status = 'accepted', updated_at = ? WHERE id = ?
  `).run(parsedKnightId, new Date().toISOString(), waybill_id);

  db.prepare(`
    UPDATE knights SET current_load = current_load + 1, status = 'busy' WHERE id = ?
  `).run(parsedKnightId);

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(waybill_id, 'pending', 'accepted', req.user?.id || null, 'Manually assigned');

  if (match) {
    logDispatch(
      waybill_id,
      parsedKnightId,
      {
        score: match.score,
        distance_score: match.distance_score,
        load_score: match.load_score,
        history_score: match.history_score,
        insurance_score: match.insurance_score,
        distance: match.distance,
      },
      'assigned'
    );
  }

  const updatedWaybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybill_id);

  res.json({
    code: 0,
    data: updatedWaybill,
    message: 'Manual dispatch successful',
  });
});

router.get('/logs/:waybillId', authMiddleware, (req: AuthRequest, res: Response) => {
  const waybillId = parseInt(req.params.waybillId);

  const logs = db.prepare(`
    SELECT dl.*, k.name as knight_name
    FROM dispatch_logs dl
    LEFT JOIN knights k ON dl.knight_id = k.id
    WHERE dl.waybill_id = ?
    ORDER BY dl.created_at DESC
  `).all(waybillId).map(serializeDispatchLog);

  res.json({
    code: 0,
    data: logs,
    message: 'Success',
  });
});

export default router;
