import db from '../database';

export interface ReportParams {
  deviceId: number;
  status?: string;
  fault_code?: string;
  door_lock?: number;
  power_usage?: number;
  water_usage?: number;
  temperature?: number;
  remain_time?: number;
}

export function reportStatus(params: ReportParams): boolean {
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO device_reports
      (device_id, status, fault_code, door_lock, power_usage, water_usage, temperature, remain_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.deviceId,
      params.status,
      params.fault_code,
      params.door_lock,
      params.power_usage,
      params.water_usage,
      params.temperature,
      params.remain_time
    );

    db.prepare(`
      UPDATE devices
      SET status = ?, lock_status = ?, last_online = CURRENT_TIMESTAMP,
          power_consumption = power_consumption + ?,
          water_consumption = water_consumption + ?
      WHERE id = ?
    `).run(
      params.status || 'idle',
      params.door_lock || 0,
      params.power_usage || 0,
      params.water_usage || 0,
      params.deviceId
    );

    if (params.remain_time === 0 && params.status === 'idle') {
      db.prepare(`
        UPDATE orders
        SET end_time = CURRENT_TIMESTAMP, order_status = 'completed',
            actual_duration = (SELECT duration_minutes FROM programs WHERE id = orders.program_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ? AND order_status = 'running'
        ORDER BY created_at DESC
        LIMIT 1
      `).run(params.deviceId);

      db.prepare(`
        UPDATE devices SET status = 'idle', lock_status = 0 WHERE id = ?
      `).run(params.deviceId);
    }

    if (params.fault_code && params.fault_code !== '') {
      db.prepare(`
        INSERT INTO alerts (device_id, type, level, status, message)
        VALUES (?, 'fault', 'warning', 'active', ?)
      `).run(params.deviceId, `故障代码: ${params.fault_code}`);
    }
  });

  try {
    tx();
    return true;
  } catch {
    return false;
  }
}

export function getPendingCommands(deviceId: number): any[] {
  const commands = db.prepare(`
    SELECT * FROM device_commands
    WHERE device_id = ? AND status = 'pending'
    ORDER BY created_at ASC
  `).all(deviceId);

  if (commands.length > 0) {
    const ids = commands.map((c: any) => c.id);
    db.prepare(`
      UPDATE device_commands SET status = 'sent', executed_at = CURRENT_TIMESTAMP
      WHERE id IN (${ids.map(() => '?').join(',')})
    `).run(...ids);
  }

  return commands;
}

export function checkFirmware(deviceId: number, currentVersion: string): any {
  const device = db.prepare('SELECT type FROM devices WHERE id = ?').get(deviceId) as any;
  if (!device) return null;

  const firmware = db.prepare(`
    SELECT * FROM firmware_upgrades
    WHERE device_type = ? AND status = 'published' AND version > ?
    ORDER BY version DESC
    LIMIT 1
  `).get(device.type, currentVersion);

  return firmware || null;
}

export function upgradeFirmware(deviceId: number, version: string): boolean {
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'firmware_upgrade', ?)
  `).run(deviceId, JSON.stringify({ version }));

  db.prepare(`
    UPDATE devices SET firmware_version = ? WHERE id = ?
  `).run(version, deviceId);

  return true;
}
