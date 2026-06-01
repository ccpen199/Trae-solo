import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const stationId = req.query.station_id || 1;

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);
  if (!station) {
    return res.status(404).json({ error: 'Station not found' });
  }

  const batteryStats = {
    available: db.prepare("SELECT COUNT(*) AS count FROM batteries WHERE station_id = ? AND status = 'available'").get(stationId).count,
    charging: db.prepare("SELECT COUNT(*) AS count FROM batteries WHERE station_id = ? AND status = 'charging'").get(stationId).count,
    abnormal: db.prepare("SELECT COUNT(*) AS count FROM batteries WHERE station_id = ? AND status = 'abnormal'").get(stationId).count,
    maintenance: db.prepare("SELECT COUNT(*) AS count FROM batteries WHERE station_id = ? AND status = 'maintenance'").get(stationId).count,
    inUse: db.prepare("SELECT COUNT(*) AS count FROM batteries WHERE station_id = ? AND status = 'in_use'").get(stationId).count,
    total: db.prepare('SELECT COUNT(*) AS count FROM batteries WHERE station_id = ?').get(stationId).count,
  };

  const waitingReservations = db.prepare(
    `SELECT r.*, v.plate_number, v.owner_name
     FROM reservations r
     JOIN vehicles v ON r.vehicle_id = v.id
     WHERE r.station_id = ? AND r.status = 'waiting'
     ORDER BY r.created_at ASC`
  ).all(stationId);

  const historyReservations = db.prepare(
    `SELECT r.*, v.plate_number, v.owner_name
     FROM reservations r
     JOIN vehicles v ON r.vehicle_id = v.id
     WHERE r.station_id = ? AND r.status IN ('cancelled', 'requeued')
     ORDER BY r.action_at DESC
     LIMIT 5`
  ).all(stationId);

  const now = new Date();
  const baseWait = station.current_wait_minutes || 15;
  let dynamicWait = baseWait;
  let overtimeCount = 0;
  let severeOvertimeCount = 0;

  for (const r of waitingReservations) {
    const arrived = new Date(r.created_at.replace(' ', 'T').slice(0, 19));
    if (!isNaN(arrived.getTime())) {
      const waitMin = Math.max(0, Math.round((now - arrived) / 60000));
      if (waitMin > baseWait * 2) {
        severeOvertimeCount++;
      } else if (waitMin > baseWait) {
        overtimeCount++;
      }
    }
  }

  if (severeOvertimeCount > 0) {
    dynamicWait = baseWait + severeOvertimeCount * baseWait;
  } else if (overtimeCount > 0) {
    dynamicWait = baseWait + overtimeCount * Math.ceil(baseWait / 2);
  }

  const recentOrders = db.prepare(
    `SELECT o.*,
       v.plate_number, v.owner_name, v.member_type,
       b_out.battery_code AS battery_out_code,
       b_out.soc AS battery_out_soc,
       b_out.status AS battery_out_status,
       b_in.id AS battery_in_id,
       b_in.battery_code AS battery_in_code,
       b_in.soc AS battery_in_soc,
       b_in.status AS battery_in_status,
       b_in.fault_code AS battery_in_fault_code
     FROM swap_orders o
     JOIN vehicles v ON o.vehicle_id = v.id
     LEFT JOIN batteries b_out ON o.battery_out_id = b_out.id
     LEFT JOIN batteries b_in ON o.battery_in_id = b_in.id
     WHERE o.station_id = ?
     ORDER BY o.created_at DESC
     LIMIT 10`
  ).all(stationId);

  const activeOrderBatteryIds = recentOrders
    .filter(o => (o.status === 'pending' || o.status === 'swapping' || o.status === 'suspended') && o.battery_in_id)
    .map(o => o.battery_in_id);

  const batteryAlerts = {};
  const batteryWorkOrders = {};

  if (activeOrderBatteryIds.length > 0) {
    const placeholders = activeOrderBatteryIds.map(() => '?').join(',');
    const alerts = db.prepare(
      `SELECT * FROM safety_alerts WHERE battery_id IN (${placeholders}) AND status IN ('open', 'processing') ORDER BY created_at DESC`
    ).all(...activeOrderBatteryIds);

    for (const a of alerts) {
      if (!batteryAlerts[a.battery_id]) batteryAlerts[a.battery_id] = [];
      batteryAlerts[a.battery_id].push(a);
    }

    const workOrderList = db.prepare(
      `SELECT wo.* FROM work_orders wo
       JOIN safety_alerts sa ON wo.alert_id = sa.id
       WHERE sa.battery_id IN (${placeholders})
       ORDER BY wo.created_at DESC`
    ).all(...activeOrderBatteryIds);

    for (const wo of workOrderList) {
      const alert = db.prepare('SELECT battery_id FROM safety_alerts WHERE id = ?').get(wo.alert_id);
      if (alert) {
        if (!batteryWorkOrders[alert.battery_id]) batteryWorkOrders[alert.battery_id] = [];
        batteryWorkOrders[alert.battery_id].push(wo);
      }
    }
  }

  const availableSlots = db.prepare(
    "SELECT COUNT(*) AS count FROM cabinet_slots WHERE station_id = ? AND status = 'available'"
  ).get(stationId).count;

  const enrichedOrders = recentOrders.map(o => {
    const enriched = { ...o };

    if (o.status === 'suspended') {
      enriched.battery_locked = true;
      enriched.cabinet_blocked = true;
      enriched.linked_alerts = batteryAlerts[o.battery_in_id] || [];
      enriched.linked_work_orders = batteryWorkOrders[o.battery_in_id] || [];
      const allWorkCompleted = enriched.linked_work_orders.length > 0 &&
        enriched.linked_work_orders.every(wo => wo.status === 'completed' || wo.status === 'closed');
      enriched.can_resume = allWorkCompleted;
    }

    if (o.status === 'pending' && o.battery_in_id && o.battery_in_status === 'abnormal') {
      enriched.battery_locked = true;
      enriched.cabinet_blocked = true;
      enriched.linked_alerts = batteryAlerts[o.battery_in_id] || [];
      enriched.linked_work_orders = batteryWorkOrders[o.battery_in_id] || [];
    }

    if (o.status === 'pending' && !o.battery_in_id) {
      const canExecute = batteryStats.available > 0 && availableSlots > 0;
      enriched.execution_readiness = {
        available_batteries: batteryStats.available,
        available_slots: availableSlots,
        can_execute: canExecute,
        blockers: [],
      };
      if (batteryStats.available === 0) enriched.execution_readiness.blockers.push('无可用电池');
      if (availableSlots === 0) enriched.execution_readiness.blockers.push('无可用柜位');
    }

    return enriched;
  });

  res.json({
    station,
    batteryStats,
    reservations: waitingReservations,
    historyReservations,
    dynamicWait: {
      base_minutes: baseWait,
      dynamic_minutes: dynamicWait,
      overtime_count: overtimeCount,
      severe_overtime_count: severeOvertimeCount,
      queue_length: waitingReservations.length,
    },
    recentOrders: enrichedOrders,
  });
});

export default router;
