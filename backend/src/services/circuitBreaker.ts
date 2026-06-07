import db from '../db/database.ts';
import { getCandidateKnights, logDispatch } from './dispatch.ts';
import { recordPickupTimeout, recordDeliveryTimeout } from './credit.ts';

type ExceptionType = 'pickup_timeout' | 'knight_offline' | 'delivery_timeout';

export function createException(
  waybillId: number,
  type: ExceptionType,
  originalKnightId: number
) {
  const existing = db.prepare(`
    SELECT * FROM exceptions WHERE waybill_id = ? AND type = ? AND status = 'pending'
  `).get(waybillId, type);

  if (existing) return existing;

  const result = db.prepare(`
    INSERT INTO exceptions (waybill_id, type, status, original_knight_id)
    VALUES (?, ?, 'pending', ?)
  `).run(waybillId, type, originalKnightId);

  return db.prepare('SELECT * FROM exceptions WHERE id = ?').get(result.lastInsertRowid);
}

function checkPickupTimeouts(): number {
  const now = new Date();
  const pendingAccept = db.prepare(`
    SELECT w.*, k.current_load
    FROM waybills w
    LEFT JOIN knights k ON w.knight_id = k.id
    WHERE w.status = 'accepted'
    AND w.pickup_deadline < ?
  `).all(now.toISOString());

  let count = 0;
  pendingAccept.forEach((w: any) => {
    if (w.knight_id) {
      createException(w.id, 'pickup_timeout', w.knight_id);
      recordPickupTimeout(w.knight_id, w.id);
      count++;
    }
  });

  return count;
}

function checkDeliveryTimeouts(): number {
  const now = new Date();
  const pendingDelivery = db.prepare(`
    SELECT w.*
    FROM waybills w
    WHERE w.status = 'delivering'
    AND w.deliver_deadline < ?
  `).all(now.toISOString());

  let count = 0;
  pendingDelivery.forEach((w: any) => {
    if (w.knight_id) {
      createException(w.id, 'delivery_timeout', w.knight_id);
      recordDeliveryTimeout(w.knight_id, w.id);
      count++;
    }
  });

  return count;
}

function checkKnightOffline(): number {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const offlineKnights = db.prepare(`
    SELECT k.*
    FROM knights k
    WHERE k.status IN ('online', 'busy')
    AND k.last_active_at < ?
    AND k.current_load > 0
  `).all(tenMinAgo);

  let count = 0;
  offlineKnights.forEach((k: any) => {
    const activeWaybills = db.prepare(`
      SELECT id FROM waybills
      WHERE knight_id = ? AND status IN ('accepted', 'picked_up', 'delivering')
    `).all(k.id);

    activeWaybills.forEach((w: any) => {
      const exception = createException(w.id, 'knight_offline', k.id);
      autoReassign(exception.id);
      count++;
    });

    db.prepare('UPDATE knights SET status = ?, current_load = 0 WHERE id = ?').run('offline', k.id);
  });

  return count;
}

export function checkExceptions() {
  const pickupTimeoutCount = checkPickupTimeouts();
  const deliveryTimeoutCount = checkDeliveryTimeouts();
  const knightOfflineCount = checkKnightOffline();

  const pendingExceptions = db.prepare(`
    SELECT id FROM exceptions WHERE status = 'pending'
  `).all() as { id: number }[];

  let autoReassignedCount = 0;
  pendingExceptions.forEach((e: { id: number }) => {
    const result = autoReassign(e.id);
    if (result.success) {
      autoReassignedCount++;
    }
  });

  return {
    pickup_timeout: pickupTimeoutCount,
    delivery_timeout: deliveryTimeoutCount,
    knight_offline: knightOfflineCount,
    auto_reassigned: autoReassignedCount,
    total: pickupTimeoutCount + deliveryTimeoutCount + knightOfflineCount,
  };
}

export function reassignKnight(exceptionId: number, newKnightId: number) {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exceptionId) as any;

  if (!exception) {
    return { success: false, message: 'Exception not found' };
  }

  if (exception.status === 'resolved' || exception.status === 'auto_reassigned') {
    return { success: false, message: 'Exception already resolved' };
  }

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(exception.waybill_id) as any;

  if (!waybill) {
    return { success: false, message: 'Waybill not found' };
  }

  const newKnight = db.prepare('SELECT * FROM knights WHERE id = ?').get(newKnightId) as any;

  if (!newKnight || newKnight.status === 'offline') {
    return { success: false, message: 'Knight not available' };
  }

  if (exception.original_knight_id) {
    db.prepare(`
      UPDATE knights SET current_load = MAX(0, current_load - 1) WHERE id = ?
    `).run(exception.original_knight_id);
  }

  db.prepare(`
    UPDATE waybills SET knight_id = ?, status = 'accepted', updated_at = ? WHERE id = ?
  `).run(newKnightId, new Date().toISOString(), exception.waybill_id);

  db.prepare(`
    UPDATE knights SET current_load = current_load + 1, status = 'busy' WHERE id = ?
  `).run(newKnightId);

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(exception.waybill_id, waybill.status, 'accepted', null, 'Exception auto-reassigned to new knight');

  const candidates = getCandidateKnights(waybill);
  const match = candidates.find((c: any) => c.id === newKnightId);
  if (match) {
    logDispatch(
      waybill.id,
      newKnightId,
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

  db.prepare(`
    UPDATE exceptions
    SET status = 'auto_reassigned', new_knight_id = ?, resolved_at = ?
    WHERE id = ?
  `).run(newKnightId, new Date().toISOString(), exceptionId);

  return {
    success: true,
    message: 'Waybill reassigned successfully',
    waybill: db.prepare('SELECT * FROM waybills WHERE id = ?').get(exception.waybill_id),
  };
}

export function autoReassign(exceptionId: number) {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exceptionId) as any;

  if (!exception) {
    return { success: false, message: 'Exception not found' };
  }

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(exception.waybill_id) as any;

  if (!waybill) {
    return { success: false, message: 'Waybill not found' };
  }

  const candidates = getCandidateKnights(waybill);

  if (candidates.length === 0) {
    return { success: false, message: 'No available knights found' };
  }

  const bestKnight = candidates[0];

  if (exception.original_knight_id) {
    db.prepare(`
      UPDATE knights SET current_load = MAX(0, current_load - 1) WHERE id = ?
    `).run(exception.original_knight_id);
  }

  db.prepare(`
    UPDATE waybills SET knight_id = ?, status = 'accepted', updated_at = ? WHERE id = ?
  `).run(bestKnight.id, new Date().toISOString(), exception.waybill_id);

  db.prepare(`
    UPDATE knights SET current_load = current_load + 1, status = 'busy' WHERE id = ?
  `).run(bestKnight.id);

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(exception.waybill_id, waybill.status, 'accepted', null, 'Exception auto-reassigned to best available knight');

  logDispatch(
    waybill.id,
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

  db.prepare(`
    UPDATE exceptions
    SET status = 'auto_reassigned', new_knight_id = ?, resolved_at = ?
    WHERE id = ?
  `).run(bestKnight.id, new Date().toISOString(), exceptionId);

  return {
    success: true,
    message: 'Auto-reassigned to best available knight',
    knight: bestKnight,
    waybill: db.prepare('SELECT * FROM waybills WHERE id = ?').get(exception.waybill_id),
  };
}

export function getExceptions(filters?: { status?: string; type?: string }, limit: number = 20, offset: number = 0) {
  let sql = `
    SELECT e.*, w.order_no, w.status as waybill_status,
           k1.name as original_knight_name,
           k2.name as new_knight_name
    FROM exceptions e
    LEFT JOIN waybills w ON e.waybill_id = w.id
    LEFT JOIN knights k1 ON e.original_knight_id = k1.id
    LEFT JOIN knights k2 ON e.new_knight_id = k2.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.status) {
    conditions.push('e.status = ?');
    params.push(filters.status);
  }

  if (filters?.type) {
    conditions.push('e.type = ?');
    params.push(filters.type);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const exceptions = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as count FROM exceptions e';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const total = db.prepare(countSql).get(...params.slice(0, -2)) as { count: number };

  return { exceptions, total: total.count };
}
