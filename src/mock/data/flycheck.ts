// 飞检任务 Mock 数据：15个含偏差率预警的任务

import dayjs from 'dayjs';
import type { FlyCheckTask } from '@/types';
import { orders } from './orders';
import { inspectors } from './inspectors';

const STATUSES: FlyCheckTask['status'][] = ['pending', 'in_progress', 'completed', 'failed'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const flyCheckTasks: FlyCheckTask[] = [];

for (let i = 0; i < 15; i++) {
  const order = orders[(i * 2 + 3) % orders.length];
  const inspector = inspectors[i % inspectors.length];
  const baseDev = inspector.deviationRate30d;
  const devNoise = ((i * 13) % 50) / 10 - 2;
  const deviationRate = +(baseDev + devNoise + (Math.random() - 0.5)).toFixed(2);
  const threshold = 3.0;
  const deviationAlert = deviationRate > threshold;
  const status = i < 3 ? 'in_progress' : i < 6 ? 'pending' : pick(STATUSES, i + 2);
  const scheduledAt = dayjs()
    .subtract(i * 0.8, 'day')
    .add((i % 5) + 2, 'hour')
    .toISOString();
  const completedAt = status === 'completed' || status === 'failed'
    ? dayjs(scheduledAt).add(2 + (i % 5), 'hour').toISOString()
    : undefined;
  const result: FlyCheckTask['result'] = deviationRate <= threshold + 0.5 ? 'pass' : 'fail';
  const findings: string[] = [];
  if (deviationAlert) {
    findings.push('成色评估偏差超出阈值，需复核');
    if (i % 3 === 0) findings.push('划痕等级描述不准确');
    if (i % 3 === 1) findings.push('功能检测遗漏1项');
  } else {
    findings.push('检测结果与复检一致');
    if (i % 4 === 0) findings.push('报告填写规范，样本合格');
  }

  flyCheckTasks.push({
    id: `fc_${String(i + 1).padStart(4, '0')}`,
    orderId: order.id,
    inspectorId: inspector.id,
    scheduledAt,
    status,
    deviationAlert,
    deviationRate: status !== 'pending' ? deviationRate : undefined,
    threshold,
    notes: deviationAlert
      ? '偏差率预警，已通知组长介入复核'
      : i % 4 === 0 ? '常规飞检抽样' : '定向抽查高价值订单',
    completedAt,
    result: completedAt ? result : undefined,
    deviatedImages: completedAt ? findings : undefined,
    findings: completedAt ? findings : undefined,
  } as any);
}

export function createFlyCheckTask(payload: {
  orderId: string;
  inspectorId: string;
  scheduledAt: string;
  notes?: string;
}): FlyCheckTask {
  const nextId = `fc_${String(flyCheckTasks.length + 1).padStart(4, '0')}`;
  const task: FlyCheckTask = {
    id: nextId,
    orderId: payload.orderId,
    inspectorId: payload.inspectorId,
    scheduledAt: payload.scheduledAt,
    status: 'pending',
    deviationAlert: false,
    threshold: 3.0,
    notes: payload.notes || '新建飞检任务',
  };
  flyCheckTasks.unshift(task);
  return task;
}

export default flyCheckTasks;
