import express from 'express';
import { reportService } from '../services/reportService';

const router = express.Router();

router.get('/:patientId/weekly', (req, res) => {
  try {
    const { patientId } = req.params;
    const report = reportService.generateWeeklyReport(patientId);
    res.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === 'Patient not found') {
      res.status(404).json({ error: '患者不存在' });
    } else {
      res.status(500).json({ error: '生成周报告失败' });
    }
  }
});

router.get('/:patientId/monthly', (req, res) => {
  try {
    const { patientId } = req.params;
    const report = reportService.generateMonthlyReport(patientId);
    res.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === 'Patient not found') {
      res.status(404).json({ error: '患者不存在' });
    } else {
      res.status(500).json({ error: '生成月报告失败' });
    }
  }
});

export default router;
