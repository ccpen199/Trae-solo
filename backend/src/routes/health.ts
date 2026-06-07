import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function calculateHealthScore(metrics: any[], device: any): { score: number; riskLevel: string; analysis: string; predictionDays: number } {
  let score = 100;
  const issues: string[] = [];

  if (device.firmware_version && device.firmware_version.startsWith('1.')) {
    score -= 10;
    issues.push('固件版本过旧，建议升级');
  }

  const errorMetrics = metrics.filter(m => m.metric_key.startsWith('error_') || m.metric_key.startsWith('command_error'));
  if (errorMetrics.length > 3) {
    score -= 20;
    issues.push(`近期出现${errorMetrics.length}次错误指标`);
  }

  const tempMetrics = metrics.filter(m => m.metric_key === 'temperature');
  if (tempMetrics.length > 0) {
    const avgTemp = tempMetrics.reduce((sum, m) => sum + m.metric_value, 0) / tempMetrics.length;
    if (avgTemp > 75) {
      score -= 15;
      issues.push(`平均温度偏高(${avgTemp.toFixed(1)}°C)`);
    }
  }

  if (device.status === 'offline') {
    score -= 5;
    issues.push('设备当前离线');
  }

  if (issues.length === 0) {
    issues.push('设备运行正常');
  }

  score = Math.max(0, Math.min(100, score));

  const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';
  const predictionDays = score >= 80 ? 365 : score >= 50 ? 180 : 30;

  return { score, riskLevel, analysis: issues.join('；'), predictionDays };
}

router.get('/prediction/:deviceId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(deviceId, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const prediction = db.prepare('SELECT * FROM device_health_scores WHERE device_id = ? ORDER BY created_at DESC LIMIT 1').get(deviceId) as any;

    if (prediction) {
      return res.json({
        success: true,
        data: { ...prediction, analysis: typeof prediction.analysis === 'string' ? prediction.analysis : JSON.stringify(prediction.analysis) }
      });
    }

    const metrics = db.prepare('SELECT * FROM device_metrics WHERE device_id = ? ORDER BY timestamp DESC LIMIT 20').all(deviceId);
    const result = calculateHealthScore(metrics, device);

    res.json({ success: true, data: { device_id: Number(deviceId), device_name: device.name, ...result, hasPrediction: false } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/prediction/:deviceId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(deviceId, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const metrics = db.prepare('SELECT * FROM device_metrics WHERE device_id = ? ORDER BY timestamp DESC LIMIT 50').all(deviceId);
    const { score, riskLevel, analysis, predictionDays } = calculateHealthScore(metrics, device);

    const result = db.prepare(
      'INSERT INTO device_health_scores (device_id, score, risk_level, analysis, prediction_days) VALUES (?, ?, ?, ?, ?)'
    ).run(Number(deviceId), score, riskLevel, analysis, predictionDays);

    const prediction = db.prepare('SELECT * FROM device_health_scores WHERE id = ?').get(result.lastInsertRowid) as any;

    res.status(201).json({
      success: true,
      data: {
        ...prediction,
        device_name: device.name,
        risk_factors: riskLevel === 'high'
          ? ['设备故障风险较高', '建议尽快安排检修']
          : riskLevel === 'medium'
            ? ['存在潜在风险', '建议关注设备运行状态']
            : ['设备运行健康', '建议定期维护保养']
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/predictions', authMiddleware, (req: Request, res: Response) => {
  try {
    const predictions = db.prepare(
      `SELECT dhs.*, d.name as device_name, d.brand, d.type, d.status as device_status
       FROM device_health_scores dhs
       JOIN devices d ON dhs.device_id = d.id
       WHERE d.user_id = ?
       ORDER BY dhs.created_at DESC`
    ).all(req.user!.id);

    res.json({ success: true, data: predictions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
