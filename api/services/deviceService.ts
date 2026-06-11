import db from "../db/index.js";
import type { Device, ConnectionStatus, ScanResult } from "../../shared/types.js";
import { deviceAbstractionLayer } from "../utils/deviceAbstraction.js";
import { reversePrivacyFilter } from "../utils/privacy.js";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class DeviceService {
  getDevicesByUserId(userId: string): Device[] {
    const stmt = db.prepare(`
      SELECT * FROM devices WHERE user_id = ? ORDER BY last_sync_time DESC
    `);
    const devices = stmt.all(userId) as unknown[];
    return devices.map((d) => this.rowToDevice(d));
  }

  getDeviceById(userId: string, deviceId: string): Device | null {
    const stmt = db.prepare(`
      SELECT * FROM devices WHERE id = ? AND user_id = ?
    `);
    const d = stmt.get(deviceId, userId) as unknown | null;
    if (!d) return null;
    return this.rowToDevice(d);
  }

  private rowToDevice(row: unknown): Device {
    const r = row as {
      id: string;
      user_id: string;
      brand: string;
      model: string;
      name: string;
      firmware_version: string;
      battery_level: number;
      connection_status: ConnectionStatus;
      last_sync_time: string;
      signal_strength: number;
      sync_status: string;
      abstraction_status: string;
      privacy_status: string;
      archive_status: string;
      last_sync_result_json: string;
      supported_features_json: string;
      protocol_version: string;
    };
    return {
      id: r.id,
      userId: r.user_id,
      brand: r.brand,
      model: r.model,
      name: r.name,
      firmwareVersion: r.firmware_version,
      batteryLevel: r.battery_level,
      connectionStatus: r.connection_status,
      lastSyncTime: r.last_sync_time,
      signalStrength: r.signal_strength,
      syncStatus: r.sync_status as Device["syncStatus"] || "idle",
      abstractionStatus: r.abstraction_status as Device["abstractionStatus"] || "pending",
      privacyStatus: r.privacy_status as Device["privacyStatus"] || "not_processed",
      archiveStatus: r.archive_status as Device["archiveStatus"] || "not_generated",
      lastSyncResult: r.last_sync_result_json ? JSON.parse(r.last_sync_result_json) : undefined,
      supportedFeatures: r.supported_features_json ? JSON.parse(r.supported_features_json) : undefined,
      protocolVersion: r.protocol_version,
    };
  }

  scanDevices(): ScanResult[] {
    return deviceAbstractionLayer.simulateScan();
  }

  bindDevice(
    userId: string,
    deviceInfo: { brand: string; model: string; name: string; deviceId: string }
  ): Device {
    const existing = db
      .prepare(`SELECT id FROM devices WHERE user_id = ? AND brand = ? AND model = ?`)
      .get(userId, deviceInfo.brand, deviceInfo.model) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE devices SET connection_status = 'connected', last_sync_time = datetime('now') WHERE id = ?`
      ).run(existing.id);
      return this.getDeviceById(userId, existing.id) as Device;
    }

    const id = generateId();
    const adapter = deviceAbstractionLayer.getAdapter(deviceInfo.brand);
    const supportedFeatures = adapter.getSupportedFeatures();
    const protocolVersion = adapter.getProtocolVersion();

    const recordsSynced = Math.floor(Math.random() * 100) + 200;
    const recordsFailed = Math.floor(Math.random() * 3);
    const syncDuration = Math.floor(Math.random() * 10) + 5;
    const failedRecords = Array.from({ length: recordsFailed }, (_, i) => ({
      type: ["heart_rate", "sleep_stage", "exercise_summary"][i % 3],
      reason: ["GATT 特征值读取超时", "数据格式校验失败", "分包重组错误"][i % 3],
      retryCount: Math.floor(Math.random() * 3),
    }));
    const protocolDiff = {
      brand: deviceInfo.brand,
      standardCompliance: ["HRS 0.9", "HRS 1.0", "GATT 自定义"][Math.floor(Math.random() * 3)],
      adaptationNotes: [
        "厂商扩展命令已适配，心率广播间隔 1s",
        "睡眠数据通过专有 UUID 获取，标准 HRS 不支持",
        "运动轨迹采用 NMEA 0183 格式，需格式转换",
      ][Math.floor(Math.random() * 3)],
      featureGaps: recordsFailed > 0 ? ["部分数据类型需轮询获取"] : [],
    };
    const lastSyncResult = {
      recordsSynced,
      recordsFailed,
      syncDuration,
      completedAt: new Date().toISOString(),
      failedRecords,
      protocolDiff,
    };

    const stmt = db.prepare(`
      INSERT INTO devices (
        id, user_id, brand, model, name, firmware_version, battery_level, 
        connection_status, last_sync_time, signal_strength, sync_status,
        abstraction_status, privacy_status, archive_status, 
        last_sync_result_json, supported_features_json, protocol_version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'connected', datetime('now'), ?, 'completed',
              'adapted', 'encrypted', 'completed', ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      deviceInfo.brand,
      deviceInfo.model,
      deviceInfo.name,
      "1.0.0",
      Math.floor(Math.random() * 50) + 50,
      Math.floor(Math.random() * 30) - 90,
      JSON.stringify(lastSyncResult),
      JSON.stringify(supportedFeatures),
      protocolVersion
    );
    return this.getDeviceById(userId, id) as Device;
  }

  unbindDevice(userId: string, deviceId: string): boolean {
    const stmt = db.prepare(`DELETE FROM devices WHERE id = ? AND user_id = ?`);
    const result = stmt.run(deviceId, userId);
    return result.changes > 0;
  }

  updateConnectionStatus(
    userId: string,
    deviceId: string,
    status: ConnectionStatus
  ): Device | null {
    const stmt = db.prepare(`
      UPDATE devices SET connection_status = ?, last_sync_time = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(status, deviceId, userId);
    return this.getDeviceById(userId, deviceId);
  }

  syncDeviceData(userId: string, deviceId: string): Device | null {
    const device = this.getDeviceById(userId, deviceId);
    if (!device) return null;

    const recordsSynced = Math.floor(Math.random() * 100) + 200;
    const recordsFailed = Math.floor(Math.random() * 3);
    const syncDuration = Math.floor(Math.random() * 10) + 5;
    const failedRecords = Array.from({ length: recordsFailed }, (_, i) => ({
      type: ["heart_rate", "sleep_stage", "exercise_summary"][i % 3],
      reason: ["GATT 特征值读取超时", "数据格式校验失败", "分包重组错误"][i % 3],
      retryCount: Math.floor(Math.random() * 3),
    }));
    const protocolDiff = {
      brand: device.brand,
      standardCompliance: ["HRS 0.9", "HRS 1.0", "GATT 自定义"][Math.floor(Math.random() * 3)],
      adaptationNotes: [
        "厂商扩展命令已适配，心率广播间隔 1s",
        "睡眠数据通过专有 UUID 获取，标准 HRS 不支持",
        "运动轨迹采用 NMEA 0183 格式，需格式转换",
      ][Math.floor(Math.random() * 3)],
      featureGaps: recordsFailed > 0 ? ["部分数据类型需轮询获取"] : [],
    };
    const syncResult = {
      recordsSynced,
      recordsFailed,
      syncDuration,
      completedAt: new Date().toISOString(),
      failedRecords,
      protocolDiff,
    };

    const stmt = db.prepare(`
      UPDATE devices 
      SET last_sync_time = datetime('now'), 
          battery_level = ?,
          sync_status = 'completed',
          archive_status = CASE WHEN archive_status = 'not_generated' THEN 'completed' ELSE archive_status END,
          last_sync_result_json = ?
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(
      Math.floor(Math.random() * 50) + 50,
      JSON.stringify(syncResult),
      deviceId,
      userId
    );
    if (result.changes === 0) return null;
    return this.getDeviceById(userId, deviceId);
  }
}

export const deviceService = new DeviceService();
