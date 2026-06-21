import db from '../db/database.js';
import { InvestorAccount, RevenueRecord, DeviceDiagnosis } from '../../shared/types.js';
import { generateId } from '../utils/hash.js';

export function getInvestorProfile(userId: string): InvestorAccount | null {
  const result = db.prepare(`
    SELECT ip.id, ip.user_id, ip.company_name, ip.total_revenue, 
           ip.available_balance, ip.share_ratio
    FROM investor_profiles ip
    WHERE ip.user_id = ?
  `).get(userId) as {
    id: string; user_id: string; company_name: string;
    total_revenue: number; available_balance: number; share_ratio: number;
  } | undefined;

  if (!result) return null;

  return {
    id: result.id,
    userId: result.user_id,
    companyName: result.company_name,
    totalRevenue: result.total_revenue,
    availableBalance: result.available_balance,
    shareRatio: result.share_ratio,
  };
}

export function getInvestorByUserId(userId: string): { id: string } | null {
  return db.prepare('SELECT id FROM investor_profiles WHERE user_id = ?').get(userId) as { id: string } | null || null;
}

export function getRevenueRecords(investorId: string, period?: string): RevenueRecord[] {
  let query = `
    SELECT rr.*, d.name as device_name
    FROM revenue_records rr
    LEFT JOIN devices d ON rr.device_id = d.id
    WHERE rr.investor_id = ?
  `;
  const params: (string | number)[] = [investorId];

  if (period) {
    query += ' AND rr.period = ?';
    params.push(period);
  }
  query += ' ORDER BY rr.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((row: any) => ({
    id: row.id,
    investorId: row.investor_id,
    deviceId: row.device_id,
    period: row.period,
    totalRevenue: row.total_revenue,
    investorShare: row.investor_share,
    platformShare: row.platform_share,
    settled: row.settled === 1,
    settledAt: row.settled_at,
    created_at: row.created_at,
    deviceName: row.device_name,
  }));
}

export function getInvestorDashboard(investorId: string): {
  totalRevenue: number; availableBalance: number; onlineRate: number; totalDevices: number; faultDevices: number; } {
  const investor = db.prepare('SELECT * FROM investor_profiles WHERE id = ?').get(investorId) as any;
  const devices = db.prepare('SELECT * FROM devices WHERE investor_id = ?').all(investorId) as any[];

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d: any) => d.status === 'online').length;
  const faultDevices = devices.filter((d: any) => d.status === 'fault').length;
  const onlineRate = totalDevices > 0 ? Number(((onlineDevices / totalDevices) * 100).toFixed(1)) : 0;

  return {
    totalRevenue: investor?.total_revenue || 0,
    availableBalance: investor?.available_balance || 0,
    onlineRate,
    totalDevices,
    faultDevices,
  };
}

export function getWaterUsageTrend(deviceId: string, days = 7): { date: string; volume: number; revenue: number }[] {
  const now = Date.now();
  const result: { date: string; volume: number; revenue: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now - i * 86400000);
    const dayKey = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
    const dayVolume = Math.random() * 200 + 50;
    result.push({
      date: dayKey,
      volume: Number(dayVolume.toFixed(1)),
      revenue: Number((dayVolume * 0.08).toFixed(2)),
    });
  }
  return result;
}

export function getDeviceDiagnosis(deviceId: string): DeviceDiagnosis[] {
  const rows = db.prepare(`
    SELECT * FROM device_diagnoses WHERE device_id = ? ORDER BY timestamp DESC LIMIT 10
  `).all(deviceId) as any[];

  return rows.map((row: any) => ({
    id: row.id,
    deviceId: row.device_id,
    timestamp: row.timestamp,
    status: row.status as DeviceDiagnosis['status'],
    issues: JSON.parse(row.issues_json || '[]'),
    metrics: JSON.parse(row.metrics_json || '{}'),
  }));
}

export function generateDiagnosisReport(deviceId: string): {
  deviceName: string;
  generatedAt: number;
  overallStatus: string;
  issues: any[];
  metrics: any;
  recommendations: string[];
} {
  const device = db.prepare('SELECT name FROM devices WHERE id = ?').get(deviceId) as { name: string } | undefined;
  const diagnosis = getDeviceDiagnosis(deviceId)[0];

  const issues = diagnosis?.issues || [];
  const metrics = diagnosis?.metrics || { waterPressure: 0, temperature: 0, batteryLevel: 0, signalStrength: 0 };

  const recommendations: string[] = [];
  if (issues.length === 0) {
    recommendations.push('设备运行状态良好，建议保持定期维护周期为30天');
  } else {
    issues.forEach((issue: any) => recommendations.push(issue.suggestion));
  }
  if (metrics.batteryLevel < 30) {
    recommendations.push('电池电量低于30%，建议尽快更换电池或检查电源供应');
  }
  if (metrics.signalStrength > -60) {
    recommendations.push('信号强度良好');
  } else if (metrics.signalStrength > -80) {
    recommendations.push('信号强度一般，建议检查天线连接');
  } else {
    recommendations.push('信号强度较弱，建议检查设备网络配置');
  }

  return {
    deviceName: device?.name || '未知设备',
    generatedAt: Date.now(),
    overallStatus: diagnosis?.status || 'unknown',
    issues,
    metrics,
    recommendations,
  };
}

export function settleRevenue(investorId: string, period: string): RevenueRecord[] {
  const records = getRevenueRecords(investorId, period).filter(r => !r.settled);
  
  const updateStmt = db.prepare(`
    UPDATE revenue_records SET settled = 1, settled_at = ? WHERE id = ?
  `);

  const tx = db.transaction((recordIds: string[]) => {
    for (const id of recordIds) {
      updateStmt.run(Date.now(), id);
    }
  });

  tx(records.map(r => r.id));

  return getRevenueRecords(investorId, period);
  void generateId;
}
