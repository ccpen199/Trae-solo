import { getDb } from '../db/database';
import { WorkOrder } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

export const workOrderService = {
  createWorkOrder(stationId: string, type: string, title: string, description?: string, priority: WorkOrder['priority'] = 'medium', pileId?: string): WorkOrder {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO work_orders (id, station_id, pile_id, type, priority, title, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, stationId, pileId || null, type, priority, title, description || null);
    return this.getWorkOrderById(id)!;
  },

  getWorkOrderById(id: string): WorkOrder | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;
  },

  getWorkOrdersByStation(stationId: string): WorkOrder[] {
    const db = getDb();
    return db.prepare('SELECT * FROM work_orders WHERE station_id = ? ORDER BY created_at DESC').all(stationId) as WorkOrder[];
  },

  getWorkOrdersByStatus(status: WorkOrder['status']): WorkOrder[] {
    const db = getDb();
    return db.prepare('SELECT * FROM work_orders WHERE status = ? ORDER BY priority DESC, created_at DESC').all(status) as WorkOrder[];
  },

  getAllWorkOrders(): WorkOrder[] {
    const db = getDb();
    return db.prepare('SELECT * FROM work_orders ORDER BY created_at DESC').all() as WorkOrder[];
  },

  assignWorkOrder(orderId: string, assignee: string): WorkOrder {
    const db = getDb();
    db.prepare(`
      UPDATE work_orders
      SET status = 'assigned', assignee = ?
      WHERE id = ?
    `).run(assignee, orderId);
    return this.getWorkOrderById(orderId)!;
  },

  startWorkOrder(orderId: string): WorkOrder {
    const db = getDb();
    db.prepare(`
      UPDATE work_orders SET status = 'in_progress' WHERE id = ?
    `).run(orderId);
    return this.getWorkOrderById(orderId)!;
  },

  completeWorkOrder(orderId: string): WorkOrder {
    const db = getDb();
    db.prepare(`
      UPDATE work_orders SET status = 'completed', completed_at = datetime('now') WHERE id = ?
    `).run(orderId);
    return this.getWorkOrderById(orderId)!;
  },

  getWorkOrderStats() {
    const db = getDb();
    return db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM work_orders
      GROUP BY status
    `).all();
  },

  autoDispatchFaultOrders() {
    const db = getDb();
    const faultPiles = db.prepare(`
      SELECT p.*, s.name as station_name
      FROM charging_piles p
      JOIN charging_stations s ON p.station_id = s.id
      WHERE p.status = 'fault'
    `).all() as any[];

    const existingOrders = db.prepare(`
      SELECT pile_id FROM work_orders
      WHERE status IN ('pending', 'assigned', 'in_progress') AND type = 'fault'
    `).all().map((o: any) => o.pile_id);

    let createdCount = 0;
    for (const pile of faultPiles) {
      if (!existingOrders.includes(pile.id)) {
        this.createWorkOrder(
          pile.station_id,
          'fault',
          `充电桩故障维修 - ${pile.pile_code}`,
          `充电桩 ${pile.pile_code} 报故障，需要及时维修处理。场站：${pile.station_name}`,
          'high',
          pile.id
        );
        createdCount++;
      }
    }
    return createdCount;
  },
};
