import express from 'express';
import { patientDataService } from '../services/patientDataService';

const router = express.Router();

router.get('/:patientId/health-metrics', (req, res) => {
  try {
    const { patientId } = req.params;
    const { days } = req.query;
    
    const metrics = patientDataService.getHealthMetrics(
      patientId, 
      days ? parseInt(days as string) : undefined
    );
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: '获取健康指标失败' });
  }
});

router.get('/:patientId/health-metrics/latest', (req, res) => {
  try {
    const { patientId } = req.params;
    const metrics = patientDataService.getLatestHealthMetrics(patientId);
    
    if (!metrics) {
      return res.status(404).json({ error: '未找到健康指标数据' });
    }
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: '获取最新健康指标失败' });
  }
});

router.get('/:patientId/health-metrics/summary', (req, res) => {
  try {
    const { patientId } = req.params;
    const summary = patientDataService.getHealthMetricsSummary(patientId);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: '获取健康指标摘要失败' });
  }
});

router.get('/:patientId/diets', (req, res) => {
  try {
    const { patientId } = req.params;
    const { days } = req.query;
    
    const diets = patientDataService.getDiets(
      patientId,
      days ? parseInt(days as string) : undefined
    );
    
    res.json(diets);
  } catch (error) {
    res.status(500).json({ error: '获取饮食记录失败' });
  }
});

router.get('/:patientId/diets/summary', (req, res) => {
  try {
    const { patientId } = req.params;
    const summary = patientDataService.getDietSummary(patientId);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: '获取饮食摘要失败' });
  }
});

router.get('/:patientId/exercises', (req, res) => {
  try {
    const { patientId } = req.params;
    const { days } = req.query;
    
    const exercises = patientDataService.getExercises(
      patientId,
      days ? parseInt(days as string) : undefined
    );
    
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: '获取运动记录失败' });
  }
});

router.get('/:patientId/exercises/summary', (req, res) => {
  try {
    const { patientId } = req.params;
    const summary = patientDataService.getExerciseSummary(patientId);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: '获取运动摘要失败' });
  }
});

router.get('/:patientId/sleeps', (req, res) => {
  try {
    const { patientId } = req.params;
    const { days } = req.query;
    
    const sleeps = patientDataService.getSleeps(
      patientId,
      days ? parseInt(days as string) : undefined
    );
    
    res.json(sleeps);
  } catch (error) {
    res.status(500).json({ error: '获取睡眠记录失败' });
  }
});

router.get('/:patientId/sleeps/summary', (req, res) => {
  try {
    const { patientId } = req.params;
    const summary = patientDataService.getSleepSummary(patientId);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: '获取睡眠摘要失败' });
  }
});

router.get('/:patientId/all', (req, res) => {
  try {
    const { patientId } = req.params;
    const data = patientDataService.getAllPatientData(patientId);
    
    if (!data) {
      return res.status(404).json({ error: '患者不存在' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取患者完整数据失败' });
  }
});

export default router;
