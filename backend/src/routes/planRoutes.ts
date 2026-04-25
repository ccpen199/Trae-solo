import express from 'express';
import { planService } from '../services/planService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const plans = planService.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: '获取计划列表失败' });
  }
});

router.get('/patient/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const plans = planService.getPlansByPatient(patientId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: '获取患者计划失败' });
  }
});

router.get('/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const plan = planService.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: '获取计划详情失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { patientId, title, description, startDate, endDate, goals, createdBy } = req.body;
    
    if (!patientId || !title || !startDate || !endDate || !createdBy) {
      return res.status(400).json({ error: '请提供必要的计划信息' });
    }
    
    const plan = planService.createPlan(patientId, {
      title,
      description: description || '',
      startDate,
      endDate,
      goals: goals || [],
      createdBy
    });
    
    res.status(201).json(plan);
  } catch (error) {
    if (error instanceof Error && error.message === 'Patient not found') {
      res.status(404).json({ error: '患者不存在' });
    } else {
      res.status(500).json({ error: '创建计划失败' });
    }
  }
});

router.put('/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const { title, description, startDate, endDate, goals, status } = req.body;
    
    const updatedPlan = planService.updatePlan(planId, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(goals !== undefined && { goals }),
      ...(status !== undefined && { status })
    });
    
    if (!updatedPlan) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ error: '更新计划失败' });
  }
});

router.put('/:planId/suspend', (req, res) => {
  try {
    const { planId } = req.params;
    const plan = planService.suspendPlan(planId);
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: '暂停计划失败' });
  }
});

router.put('/:planId/complete', (req, res) => {
  try {
    const { planId } = req.params;
    const plan = planService.completePlan(planId);
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: '完成计划失败' });
  }
});

router.delete('/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const success = planService.deletePlan(planId);
    
    if (!success) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除计划失败' });
  }
});

router.get('/:planId/progress', (req, res) => {
  try {
    const { planId } = req.params;
    const progress = planService.getPlanProgress(planId);
    
    if (!progress) {
      return res.status(404).json({ error: '计划不存在' });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: '获取计划进度失败' });
  }
});

router.post('/template', (req, res) => {
  try {
    const { patientId, condition } = req.body;
    
    if (!patientId || !condition) {
      return res.status(400).json({ error: '请提供患者ID和诊断信息' });
    }
    
    const template = planService.generateTemplate(patientId, condition);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: '生成计划模板失败' });
  }
});

export default router;
