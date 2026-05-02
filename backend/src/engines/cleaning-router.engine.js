const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { CleaningOrderStatus, CleaningCause, HealthLevel } = require('../config/enums');
const NotificationService = require('../services/notification.service');

class CleaningRouterEngine {
  static DEGRADATION_THRESHOLD_NORMAL = 10;
  static DEGRADATION_THRESHOLD_HIGH = 20;

  static analyzeStationCleaningNeed(stationId) {
    const station = db.prepare(`
      SELECT s.*, 
             (SELECT AVG(pr_value) FROM generation_records 
              WHERE station_id = s.id AND record_date >= date('now', '-7 days')) as recent_avg_pr,
             (SELECT AVG(pr_value) FROM generation_records 
              WHERE station_id = s.id AND record_date >= date('now', '-30 days') 
              AND record_date < date('now', '-7 days')) as historical_avg_pr
      FROM stations s
      WHERE s.id = ?
    `).get(stationId);

    if (!station) {
      throw new Error('电站不存在');
    }

    const recentPR = station.recent_avg_pr || station.pr_target;
    const historicalPR = station.historical_avg_pr || station.pr_target;

    const degradationPercent = historicalPR > 0 
      ? ((historicalPR - recentPR) / historicalPR) * 100 
      : 0;

    const cause = this.determineCleaningCause(station, degradationPercent);
    
    const needsCleaning = degradationPercent >= this.DEGRADATION_THRESHOLD_NORMAL;
    const priority = degradationPercent >= this.DEGRADATION_THRESHOLD_HIGH ? 3 : 1;

    return {
      station_id: stationId,
      station_name: station.name,
      recent_avg_pr: recentPR,
      historical_avg_pr: historicalPR,
      degradation_percent: Math.max(0, degradationPercent),
      cause,
      needs_cleaning: needsCleaning,
      priority,
      expected_improvement: degradationPercent * 0.8
    };
  }

  static determineCleaningCause(station, degradationPercent) {
    const month = new Date().getMonth() + 1;
    
    if (degradationPercent > 30) {
      return CleaningCause.SHADOW;
    }
    
    if (month >= 11 || month <= 2) {
      return CleaningCause.SNOW;
    }
    
    if (degradationPercent > 20) {
      return CleaningCause.BIRD_DROPPING;
    }
    
    return CleaningCause.DUST;
  }

  static findBestWorker(stationId) {
    const station = db.prepare('SELECT latitude, longitude FROM stations WHERE id = ?').get(stationId);
    if (!station) return null;

    const workers = db.prepare(`
      SELECT u.id, u.name, u.phone,
             (SELECT COUNT(*) FROM cleaning_orders 
              WHERE assigned_worker_id = u.id AND status IN ('pending', 'dispatched', 'accepted', 'in_progress')) as active_orders,
             (SELECT AVG(julianday(verify_time) - julianday(dispatch_time)) 
              FROM cleaning_orders WHERE assigned_worker_id = u.id AND status = 'verified') as avg_completion_days
      FROM users u
      WHERE u.role = 'maintenance_worker' AND u.status = 'active'
    `).all();

    if (workers.length === 0) return null;

    workers.sort((a, b) => {
      const scoreA = a.active_orders * 10 + (a.avg_completion_days || 5);
      const scoreB = b.active_orders * 10 + (b.avg_completion_days || 5);
      return scoreA - scoreB;
    });

    return workers[0];
  }

  static createCleaningOrder(stationId, cause, degradationPercent, workerId = null) {
    const analysis = this.analyzeStationCleaningNeed(stationId);
    
    const bestWorker = workerId || this.findBestWorker(stationId);
    if (!bestWorker && !workerId) {
      throw new Error('没有可用的运维工人');
    }

    const activeOrder = db.prepare(`
      SELECT id FROM cleaning_orders 
      WHERE station_id = ? AND status NOT IN ('verified', 'cancelled')
    `).get(stationId);

    if (activeOrder) {
      throw new Error('该电站已有进行中的清洗工单');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO cleaning_orders (
        id, station_id, assigned_worker_id, cause, 
        current_degradation_percent, expected_efficiency_improvement,
        status, priority, dispatch_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, stationId, bestWorker?.id || workerId,
      cause || analysis.cause,
      degradationPercent || analysis.degradation_percent,
      analysis.expected_improvement,
      CleaningOrderStatus.DISPATCHED,
      analysis.priority,
      now
    );

    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);
    const order = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(id);

    if (bestWorker) {
      NotificationService.sendCleaningTask(bestWorker.id, order, station);
    }

    return { id, ...order };
  }

  static autoDispatchCleaningOrders() {
    const stations = db.prepare(`
      SELECT s.id, s.name, s.health_level
      FROM stations s
      WHERE s.status = 'operating'
    `).all();

    const dispatched = [];

    for (const station of stations) {
      try {
        const analysis = this.analyzeStationCleaningNeed(station.id);
        
        if (analysis.needs_cleaning) {
          const hasActiveOrder = db.prepare(`
            SELECT 1 FROM cleaning_orders 
            WHERE station_id = ? AND status NOT IN ('verified', 'cancelled')
          `).get(station.id);

          if (!hasActiveOrder) {
            const order = this.createCleaningOrder(station.id, analysis.cause, analysis.degradation_percent);
            dispatched.push(order);
          }
        }
      } catch (err) {
        console.error(`自动派单失败 - 电站 ${station.id}:`, err.message);
      }
    }

    return dispatched;
  }

  static acceptCleaningOrder(orderId, workerId) {
    const order = db.prepare(`
      SELECT co.*, s.name as station_name
      FROM cleaning_orders co
      JOIN stations s ON co.station_id = s.id
      WHERE co.id = ?
    `).get(orderId);

    if (!order) {
      throw new Error('工单不存在');
    }

    if (order.status !== CleaningOrderStatus.DISPATCHED) {
      throw new Error('当前工单状态不可接受');
    }

    if (order.assigned_worker_id && order.assigned_worker_id !== workerId) {
      throw new Error('该工单已分配给其他工人');
    }

    db.prepare(`
      UPDATE cleaning_orders SET
        status = ?,
        assigned_worker_id = ?,
        accept_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(CleaningOrderStatus.ACCEPTED, workerId, orderId);

    return db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
  }

  static startCleaning(orderId) {
    const order = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('工单不存在');
    if (order.status !== CleaningOrderStatus.ACCEPTED) {
      throw new Error('当前工单状态不可开始');
    }

    db.prepare(`
      UPDATE cleaning_orders SET
        status = ?,
        start_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(CleaningOrderStatus.IN_PROGRESS, orderId);

    return db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
  }

  static completeCleaning(orderId, beforeImage, afterImage, workerNotes) {
    const order = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('工单不存在');
    if (order.status !== CleaningOrderStatus.IN_PROGRESS) {
      throw new Error('当前工单状态不可完成');
    }

    db.prepare(`
      UPDATE cleaning_orders SET
        status = ?,
        before_cleaning_image = ?,
        after_cleaning_image = ?,
        worker_notes = ?,
        complete_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(CleaningOrderStatus.COMPLETED, beforeImage, afterImage, workerNotes, orderId);

    return db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
  }

  static verifyCleaning(orderId, verifierId, verifierNotes, verified = true) {
    const order = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('工单不存在');
    if (order.status !== CleaningOrderStatus.COMPLETED) {
      throw new Error('当前工单状态不可验收');
    }

    const newStatus = verified ? CleaningOrderStatus.VERIFIED : CleaningOrderStatus.IN_PROGRESS;

    db.prepare(`
      UPDATE cleaning_orders SET
        status = ?,
        verifier_notes = ?,
        verify_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, verifierNotes, orderId);

    return db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
  }

  static getCleaningHistory(stationId, limit = 20) {
    return db.prepare(`
      SELECT co.*, u.name as worker_name
      FROM cleaning_orders co
      LEFT JOIN users u ON co.assigned_worker_id = u.id
      WHERE co.station_id = ?
      ORDER BY co.created_at DESC
      LIMIT ?
    `).all(stationId, limit);
  }
}

module.exports = CleaningRouterEngine;
