import express from 'express';
import { generateAllianceStructure, generateAllianceTasks, generateSettlements } from '../mock/data';
import type { ApiResponse, AllianceNode, AllianceTask, Settlement, SettlementRule } from '../../shared/types';

const router = express.Router();

router.get('/structure', (_req, res) => {
  const structure = generateAllianceStructure();
  const response: ApiResponse<{ structure: AllianceNode }> = {
    success: true,
    data: { structure },
  };
  res.json(response);
});

router.get('/tasks', (_req, res) => {
  const tasks = generateAllianceTasks();
  const response: ApiResponse<{ tasks: AllianceTask[] }> = {
    success: true,
    data: { tasks },
    total: tasks.length,
  };
  res.json(response);
});

router.post('/tasks', (req, res) => {
  const { title, description, assigneeId, deadline } = req.body;
  const task: AllianceTask = {
    id: Math.random().toString(36).substring(2, 9),
    allianceId: 'alliance-1',
    allianceName: '全国再生资源产业联盟',
    assignerId: 'u1',
    assignerName: '张盟主',
    assigneeId: assigneeId || 'u2',
    assigneeName: '李分盟主',
    title: title || '',
    description: description || '',
    status: 'pending',
    priority: 'medium',
    deadline: deadline || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  
  const response: ApiResponse<{ taskId: string }> = {
    success: true,
    data: { taskId: task.id },
    message: '任务创建成功',
  };
  res.json(response);
});

router.put('/tasks/:id', (req, res) => {
  const { status } = req.body;
  const response: ApiResponse<{ success: boolean }> = {
    success: true,
    data: { success: true },
    message: `任务状态已更新为${status}`,
  };
  res.json(response);
});

router.get('/settlements', (req, res) => {
  const { month } = req.query;
  let settlements = generateSettlements();
  if (month) {
    settlements = settlements.filter(s => s.period.includes(month as string));
  }
  
  const response: ApiResponse<{ settlements: Settlement[] }> = {
    success: true,
    data: { settlements },
    total: settlements.length,
  };
  res.json(response);
});

router.get('/rules', (_req, res) => {
  const rules: SettlementRule[] = [
    { id: 'r1', role: 'leader', percentage: 40, description: '盟主享有交易金额40%的分账' },
    { id: 'r2', role: 'branch', percentage: 30, description: '分盟主享有交易金额30%的分账' },
    { id: 'r3', role: 'station', percentage: 30, description: '站点享有交易金额30%的分账' },
  ];
  
  const response: ApiResponse<{ rules: SettlementRule[] }> = {
    success: true,
    data: { rules },
  };
  res.json(response);
});

router.post('/rules', (req, res) => {
  const { role, percentage } = req.body;
  const response: ApiResponse<{ success: boolean }> = {
    success: true,
    data: { success: true },
    message: `${role}分账比例已更新为${percentage}%`,
  };
  res.json(response);
});

export default router;
