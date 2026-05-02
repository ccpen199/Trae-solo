const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { FaultStatus, FaultSeverity, MaintenanceOrderStatus } = require('../config/enums');
const NotificationService = require('../services/notification.service');

const FAULT_CODE_MAP = {
  E001: { description: '直流过压', severity: FaultSeverity.MAJOR, category: 'voltage' },
  E002: { description: '直流欠压', severity: FaultSeverity.MINOR, category: 'voltage' },
  E003: { description: '交流过压', severity: FaultSeverity.MAJOR, category: 'voltage' },
  E004: { description: '交流欠压', severity: FaultSeverity.MINOR, category: 'voltage' },
  E005: { description: '过流保护', severity: FaultSeverity.CRITICAL, category: 'current' },
  E006: { description: '短路保护', severity: FaultSeverity.CRITICAL, category: 'current' },
  E010: { description: '过温保护', severity: FaultSeverity.MAJOR, category: 'temperature' },
  E011: { description: '散热风扇故障', severity: FaultSeverity.MAJOR, category: 'hardware' },
  E012: { description: '组串电流异常', severity: FaultSeverity.MAJOR, category: 'string' },
  E013: { description: '组串电压异常', severity: FaultSeverity.MINOR, category: 'string' },
  E020: { description: '通讯中断', severity: FaultSeverity.MINOR, category: 'communication' },
  E021: { description: '数据采集异常', severity: FaultSeverity.MINOR, category: 'communication' },
  E030: { description: '孤岛保护', severity: FaultSeverity.CRITICAL, category: 'grid' },
  E031: { description: '电网频率异常', severity: FaultSeverity.MAJOR, category: 'grid' },
  E999: { description: '未知故障', severity: FaultSeverity.WARNING, category: 'unknown' }
};

class FaultDiagnosisEngine {
  static analyzeInverterAlarm(inverterData) {
    const alarms = [];
    
    if (inverterData.alarm_code) {
      const codes = inverterData.alarm_code.split(',');
      codes.forEach(code => {
        const faultInfo = FAULT_CODE_MAP[code.trim()] || FAULT_CODE_MAP.E999;
        alarms.push({
          code: code.trim(),
          description: faultInfo.description,
          severity: faultInfo.severity,
          category: faultInfo.category
        });
      });
    }

    if (inverterData.dc_voltage > 1000) {
      alarms.push({
        code: 'E001',
        description: '直流过压检测',
        severity: FaultSeverity.MAJOR,
        category: 'voltage',
        value: inverterData.dc_voltage
      });
    }

    if (inverterData.temperature > 75) {
      alarms.push({
        code: 'E010',
        description: '设备过温',
        severity: FaultSeverity.MAJOR,
        category: 'temperature',
        value: inverterData.temperature
      });
    }

    if (inverterData.efficiency && inverterData.efficiency < 0.80) {
      alarms.push({
        code: 'W001',
        description: '效率异常偏低',
        severity: FaultSeverity.WARNING,
        category: 'efficiency',
        value: inverterData.efficiency
      });
    }

    return alarms;
  }

  static locateFaultyString(inverterId, alarmCode) {
    const strings = db.prepare(`
      SELECT s.*, 
             (SELECT AVG(dc_current) FROM inverter_data 
              WHERE inverter_id = ? AND collect_time >= datetime('now', '-1 hour')) as avg_current
      FROM strings s
      WHERE s.inverter_id = ?
      ORDER BY s.string_number
    `).all(inverterId, inverterId);

    if (strings.length === 0) return null;

    const avgCurrent = strings.reduce((sum, s) => sum + (s.avg_current || 0), 0) / strings.length;
    
    for (const str of strings) {
      if (str.avg_current < avgCurrent * 0.5 || str.avg_current > avgCurrent * 1.5) {
        return {
          string_id: str.id,
          string_number: str.string_number,
          deviation: str.avg_current ? (str.avg_current - avgCurrent) / avgCurrent * 100 : -100,
          likely_cause: this.diagnoseStringCause(str, alarmCode)
        };
      }
    }

    return null;
  }

  static diagnoseStringCause(string, alarmCode) {
    if (alarmCode === 'E012' || alarmCode === 'E013') {
      return '组串连接异常或组件损坏';
    }
    if (string.status === 'normal') {
      return '可能存在阴影遮挡或组件老化';
    }
    return '需要现场检测确认';
  }

  static createFault(inverterData, alarms) {
    const inverter = db.prepare(`
      SELECT i.*, s.name as station_name, s.id as station_id
      FROM inverters i
      JOIN stations s ON i.station_id = s.id
      WHERE i.id = ?
    `).get(inverterData.inverter_id);

    if (!inverter) return null;

    const createdFaults = [];

    for (const alarm of alarms) {
      if (alarm.severity === FaultSeverity.WARNING) continue;

      const existingActive = db.prepare(`
        SELECT id FROM faults 
        WHERE inverter_id = ? 
          AND fault_code = ? 
          AND status NOT IN ('resolved', 'false_alarm')
      `).get(inverterData.inverter_id, alarm.code);

      if (existingActive) continue;

      const faultyString = this.locateFaultyString(inverterData.inverter_id, alarm.code);

      const id = uuidv4();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO faults (
          id, station_id, inverter_id, string_id, detected_time,
          fault_code, fault_description, severity, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, inverter.station_id, inverterData.inverter_id,
        faultyString?.string_id || null, now,
        alarm.code, alarm.description, alarm.severity, FaultStatus.DETECTED
      );

      const fault = db.prepare('SELECT * FROM faults WHERE id = ?').get(id);
      const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(inverter.station_id);
      
      NotificationService.sendFaultAlert(fault, station);

      if (alarm.severity !== FaultSeverity.WARNING) {
        const maintenanceOrder = this.createMaintenanceOrderFromFault(fault, station);
        fault.maintenance_order = maintenanceOrder;
      }

      createdFaults.push(fault);
    }

    return createdFaults;
  }

  static createMaintenanceOrderFromFault(fault, station) {
    const workers = db.prepare(`
      SELECT u.id, u.name,
             (SELECT COUNT(*) FROM maintenance_orders 
              WHERE assigned_worker_id = u.id AND status NOT IN ('verified', 'cancelled')) as active_count
      FROM users u
      WHERE u.role = 'maintenance_worker' AND u.status = 'active'
      ORDER BY active_count ASC
      LIMIT 1
    `).get();

    if (!workers) return null;

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO maintenance_orders (
        id, station_id, fault_id, assigned_worker_id,
        problem_description, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, fault.station_id, fault.id, workers.id,
      `故障诊断: ${fault.fault_description} (故障码: ${fault.fault_code})`,
      fault.severity === FaultSeverity.CRITICAL ? 3 : fault.severity === FaultSeverity.MAJOR ? 2 : 1,
      MaintenanceOrderStatus.DISPATCHED
    );

    const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(id);
    
    db.prepare(`
      UPDATE faults SET maintenance_order_id = ?, status = ? WHERE id = ?
    `).run(id, FaultStatus.CONFIRMED, fault.id);

    NotificationService.sendMaintenanceTask(workers.id, order, station);

    return order;
  }

  static acceptMaintenanceOrder(orderId, workerId) {
    const order = db.prepare(`
      SELECT mo.*, s.name as station_name
      FROM maintenance_orders mo
      JOIN stations s ON mo.station_id = s.id
      WHERE mo.id = ?
    `).get(orderId);

    if (!order) throw new Error('工单不存在');
    if (order.status !== MaintenanceOrderStatus.DISPATCHED) {
      throw new Error('当前状态不可接受');
    }
    if (order.assigned_worker_id && order.assigned_worker_id !== workerId) {
      throw new Error('工单已分配给其他工人');
    }

    db.prepare(`
      UPDATE maintenance_orders SET
        status = ?,
        assigned_worker_id = ?,
        accept_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(MaintenanceOrderStatus.ACCEPTED, workerId, orderId);

    return db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(orderId);
  }

  static updateMaintenanceStatus(orderId, newStatus, workerFeedback = null, partsUsed = null) {
    const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('工单不存在');

    const validTransitions = {
      [MaintenanceOrderStatus.DISPATCHED]: [MaintenanceOrderStatus.ACCEPTED, MaintenanceOrderStatus.CANCELLED],
      [MaintenanceOrderStatus.ACCEPTED]: [MaintenanceOrderStatus.ON_SITE, MaintenanceOrderStatus.CANCELLED],
      [MaintenanceOrderStatus.ON_SITE]: [MaintenanceOrderStatus.REPAIRING],
      [MaintenanceOrderStatus.REPAIRING]: [MaintenanceOrderStatus.TESTING],
      [MaintenanceOrderStatus.TESTING]: [MaintenanceOrderStatus.COMPLETED, MaintenanceOrderStatus.REPAIRING],
      [MaintenanceOrderStatus.COMPLETED]: [MaintenanceOrderStatus.VERIFIED]
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`无法从状态 ${order.status} 转换到 ${newStatus}`);
    }

    const now = new Date();
    const updates = { status: newStatus, updated_at: now.toISOString() };

    if (newStatus === MaintenanceOrderStatus.ON_SITE) {
      updates.on_site_time = now.toISOString();
    } else if (newStatus === MaintenanceOrderStatus.REPAIRING) {
      updates.start_repair_time = now.toISOString();
    } else if (newStatus === MaintenanceOrderStatus.COMPLETED) {
      updates.complete_time = now.toISOString();
      if (workerFeedback) updates.worker_feedback = workerFeedback;
      if (partsUsed) updates.parts_used = partsUsed;

      if (order.start_repair_time) {
        const start = moment(order.start_repair_time);
        const durationMinutes = moment.duration(now.diff(start)).asMinutes();
        updates.actual_repair_time_hours = durationMinutes / 60;
        updates.mttr_minutes = durationMinutes;
      }

      if (order.fault_id) {
        db.prepare(`
          UPDATE faults SET status = ?, resolved_time = ? WHERE id = ?
        `).run(FaultStatus.RESOLVED, now.toISOString(), order.fault_id);
      }
    } else if (newStatus === MaintenanceOrderStatus.VERIFIED) {
      updates.verify_time = now.toISOString();
    }

    const fields = Object.keys(updates);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), orderId];

    db.prepare(`UPDATE maintenance_orders SET ${setClause} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(orderId);
  }

  static calculateMTTR(stationId, days = 30) {
    const result = db.prepare(`
      SELECT 
        COUNT(*) as total_repairs,
        AVG(mttr_minutes) as avg_mttr_minutes,
        SUM(mttr_minutes) as total_mttr_minutes
      FROM maintenance_orders
      WHERE station_id = ?
        AND status = 'verified'
        AND complete_time >= datetime('now', '-' || ? || ' days')
    `).get(stationId, days);

    return {
      station_id: stationId,
      period_days: days,
      total_repairs: result.total_repairs || 0,
      average_mttr_minutes: result.avg_mttr_minutes || 0,
      average_mttr_hours: (result.avg_mttr_minutes || 0) / 60
    };
  }

  static getActiveFaults(stationId = null) {
    let query = `
      SELECT f.*, s.name as station_name, i.serial_number as inverter_sn,
             mo.status as mo_status, mo.id as mo_id
      FROM faults f
      JOIN stations s ON f.station_id = s.id
      LEFT JOIN inverters i ON f.inverter_id = i.id
      LEFT JOIN maintenance_orders mo ON f.maintenance_order_id = mo.id
      WHERE f.status NOT IN ('resolved', 'false_alarm')
    `;

    const params = [];
    if (stationId) {
      query += ' AND f.station_id = ?';
      params.push(stationId);
    }
    query += ' ORDER BY f.detected_time DESC';

    return db.prepare(query).all(...params);
  }
}

module.exports = FaultDiagnosisEngine;
