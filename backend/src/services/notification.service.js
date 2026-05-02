const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { NotificationType } = require('../config/enums');

class NotificationService {
  static createNotification(userId, type, title, content, referenceType = null, referenceId = null, priority = 1) {
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, reference_type, reference_id, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, userId, type, title, content, referenceType, referenceId, priority);
    return id;
  }

  static sendFaultAlert(fault, station) {
    const users = db.prepare(`
      SELECT id FROM users WHERE role IN ('station_owner', 'admin')
    `).all();

    users.forEach(user => {
      this.createNotification(
        user.id,
        NotificationType.FAULT_ALERT,
        `电站故障告警: ${station.name}`,
        `检测到${fault.severity === 'critical' ? '严重' : ''}故障: ${fault.fault_description}`,
        'fault',
        fault.id,
        fault.severity === 'critical' ? 3 : 2
      );
    });
  }

  static sendMaintenanceTask(workerId, maintenanceOrder, station) {
    this.createNotification(
      workerId,
      NotificationType.MAINTENANCE_TASK,
      '新维修单分派',
      `电站"${station.name}"需要维修: ${maintenanceOrder.problem_description.substring(0, 50)}...`,
      'maintenance_order',
      maintenanceOrder.id,
      maintenanceOrder.priority
    );
  }

  static sendCleaningTask(workerId, cleaningOrder, station) {
    this.createNotification(
      workerId,
      NotificationType.CLEANING_REMINDER,
      '新清洗单分派',
      `电站"${station.name}"需要清洗，当前衰减${cleaningOrder.current_degradation_percent}%`,
      'cleaning_order',
      cleaningOrder.id,
      cleaningOrder.priority
    );
  }

  static sendSettlementCompleted(stationId, settlement) {
    const station = db.prepare('SELECT owner_id, investor_id, name FROM stations WHERE id = ?').get(stationId);
    
    if (station.owner_id) {
      this.createNotification(
        station.owner_id,
        NotificationType.SETTLEMENT_COMPLETED,
        '收益结算完成',
        `电站"${station.name}" ${settlement.settlement_date} 收益已结算，总收益: ¥${settlement.total_revenue.toFixed(2)}`,
        'settlement',
        settlement.id,
        1
      );
    }
    
    if (station.investor_id) {
      this.createNotification(
        station.investor_id,
        NotificationType.SETTLEMENT_COMPLETED,
        '投资收益到账',
        `电站"${station.name}" 分成收益: ¥${settlement.investor_revenue.toFixed(2)}`,
        'settlement',
        settlement.id,
        1
      );
    }
  }

  static markAsRead(notificationId) {
    return db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_time = datetime('now') 
      WHERE id = ?
    `).run(notificationId);
  }

  static getUserUnreadCount(userId) {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return result.count;
  }

  static getUserNotifications(userId, limit = 20) {
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit);
  }
}

module.exports = NotificationService;
