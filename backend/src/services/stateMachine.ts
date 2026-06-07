import db from '../db/database.ts';
import { addTrackingPoint } from './tracking.ts';

type WaybillStatus = 'pending' | 'accepted' | 'picked_up' | 'delivering' | 'signed' | 'completed' | 'cancelled';

interface Transition {
  from: WaybillStatus;
  to: WaybillStatus;
  action: string;
}

const validTransitions: Transition[] = [
  { from: 'pending', to: 'accepted', action: 'knight accepts' },
  { from: 'accepted', to: 'picked_up', action: 'knight picks up' },
  { from: 'picked_up', to: 'delivering', action: 'knight starts delivery' },
  { from: 'delivering', to: 'signed', action: 'receiver signs' },
  { from: 'signed', to: 'completed', action: 'system confirms' },
  { from: 'pending', to: 'cancelled', action: 'merchant cancels' },
  { from: 'accepted', to: 'pending', action: 'knight rejects' },
];

function isValidTransition(from: WaybillStatus, to: WaybillStatus): boolean {
  return validTransitions.some(t => t.from === from && t.to === to);
}

function logStatusChange(
  waybillId: number,
  fromStatus: WaybillStatus | null,
  toStatus: WaybillStatus,
  operatorId: number | null,
  note: string
) {
  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(waybillId, fromStatus, toStatus, operatorId, note);
}

function updateKnightLoad(knightId: number, delta: number) {
  db.prepare(`
    UPDATE knights SET current_load = MAX(0, current_load + ?) WHERE id = ?
  `).run(delta, knightId);
}

function updateKnightStats(knightId: number, completed: boolean, onTime: boolean) {
  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(knightId) as any;
  const newTotal = knight.total_orders + 1;
  const newCompleted = knight.completed_orders + (completed ? 1 : 0);
  db.prepare(`
    UPDATE knights SET total_orders = ?, completed_orders = ? WHERE id = ?
  `).run(newTotal, newCompleted, knightId);
}

export function transitionStatus(
  waybillId: number,
  newStatus: WaybillStatus,
  operatorId: number | null,
  note: string = ''
): { success: boolean; message: string; waybill?: any } {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId) as any;

  if (!waybill) {
    return { success: false, message: 'Waybill not found' };
  }

  const currentStatus = waybill.status as WaybillStatus;

  if (currentStatus === newStatus) {
    return { success: true, message: 'Status unchanged', waybill };
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    return { success: false, message: `Invalid transition from ${currentStatus} to ${newStatus}` };
  }

  const now = new Date().toISOString();
  const updates: string[] = [];
  const params: any[] = [];

  if (newStatus === 'picked_up') {
    updates.push('actual_pickup_time = ?');
    params.push(now);
  }

  if (newStatus === 'signed') {
    updates.push('actual_deliver_time = ?');
    params.push(now);
  }

  if (newStatus === 'accepted') {
    if (!waybill.knight_id) {
      return { success: false, message: 'Knight must be assigned before accepting' };
    }
    updates.push('accepted_at = ?');
    params.push(now);
    updateKnightLoad(waybill.knight_id, 1);
    updateKnightStats(waybill.knight_id, false, true);
  }

  if (newStatus === 'pending' && currentStatus === 'accepted' && waybill.knight_id) {
    updateKnightLoad(waybill.knight_id, -1);
  }

  if (newStatus === 'completed' && waybill.knight_id) {
    updateKnightLoad(waybill.knight_id, -1);
    updateKnightStats(waybill.knight_id, true, true);
  }

  updates.push('status = ?');
  params.push(newStatus);
  updates.push('updated_at = ?');
  params.push(now);
  params.push(waybillId);

  db.prepare(`UPDATE waybills SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  logStatusChange(waybillId, currentStatus, newStatus, operatorId, note);

  if (waybill.knight_id && ['picked_up', 'delivering', 'signed'].includes(newStatus)) {
    let lat = waybill.sender_lat;
    let lng = waybill.sender_lng;
    if (newStatus === 'delivering') {
      lat = waybill.sender_lat + (waybill.receiver_lat - waybill.sender_lat) * 0.5;
      lng = waybill.sender_lng + (waybill.receiver_lng - waybill.sender_lng) * 0.5;
    }
    if (newStatus === 'signed') {
      lat = waybill.receiver_lat;
      lng = waybill.receiver_lng;
    }
    addTrackingPoint(waybillId, waybill.knight_id, lat, lng, newStatus === 'delivering' ? 15 : 0, 0);
  }

  const updatedWaybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId);

  return { success: true, message: 'Status updated successfully', waybill: updatedWaybill };
}

export function getStatusLog(waybillId: number) {
  return db.prepare(`
    SELECT wsl.*, u.username as operator_name
    FROM waybill_status_log wsl
    LEFT JOIN users u ON wsl.operator_id = u.id
    WHERE wsl.waybill_id = ?
    ORDER BY wsl.created_at ASC
  `).all(waybillId);
}
