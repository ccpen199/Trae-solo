import express from 'express';
import { riskService } from '../services/riskService';

const router = express.Router();

router.get('/alerts/active', (req, res) => {
  try {
    const alerts = riskService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: '获取活跃告警失败' });
  }
});

router.get('/alerts/patient/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const alerts = riskService.getAlertsByPatient(patientId);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: '获取患者告警失败' });
  }
});

router.put('/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const { doctorName } = req.body;
    
    if (!doctorName) {
      return res.status(400).json({ error: '请提供医生姓名' });
    }
    
    const alert = riskService.acknowledgeAlert(alertId, doctorName);
    if (!alert) {
      return res.status(404).json({ error: '告警不存在或已被处理' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: '确认告警失败' });
  }
});

router.put('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { doctorName } = req.body;
    
    if (!doctorName) {
      return res.status(400).json({ error: '请提供医生姓名' });
    }
    
    const alert = riskService.resolveAlert(alertId, doctorName);
    if (!alert) {
      return res.status(404).json({ error: '告警不存在或已被处理' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: '解决告警失败' });
  }
});

router.get('/assessment/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const assessment = riskService.assessPatientRisk(patientId);
    res.json(assessment);
  } catch (error) {
    if (error instanceof Error && error.message === 'Patient not found') {
      res.status(404).json({ error: '患者不存在' });
    } else {
      res.status(500).json({ error: '风险评估失败' });
    }
  }
});

router.post('/alerts/generate', (req, res) => {
  try {
    const newAlerts = riskService.autoGenerateAlerts();
    res.json({
      message: `成功生成 ${newAlerts.length} 条新告警`,
      alerts: newAlerts
    });
  } catch (error) {
    res.status(500).json({ error: '自动生成告警失败' });
  }
});

export default router;
