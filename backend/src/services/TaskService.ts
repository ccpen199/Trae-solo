import { TaskRepository, TaskFilter } from '../repositories/TaskRepository';
import { getDb } from '../database';

const taskRepo = new TaskRepository();

export class TaskService {
  list(filter: TaskFilter, page: number = 1, pageSize: number = 20) {
    const result = taskRepo.findAll(filter, page, pageSize);
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize } };
  }

  getById(id: number) {
    const task = taskRepo.findById(id);
    if (!task) {
      return { code: 1020, message: '任务不存在', data: null };
    }
    return { code: 0, message: 'ok', data: task };
  }

  create(data: { type: string; branch_id: number; tracking_no?: string; sender_name?: string; sender_phone?: string; receiver_name?: string; receiver_phone?: string; address?: string; scheduled_time?: string; fee?: number; note?: string }) {
    const db = getDb();
    const count = (db.prepare('SELECT COUNT(*) as count FROM pickup_tasks').get() as any).count;
    const taskNo = `TK${String(Date.now()).slice(-8)}${String(count + 1).padStart(4, '0')}`;

    const id = taskRepo.create({
      task_no: taskNo,
      type: data.type as any,
      status: 'pending',
      branch_id: data.branch_id,
      tracking_no: data.tracking_no || null,
      sender_name: data.sender_name || null,
      sender_phone: data.sender_phone || null,
      receiver_name: data.receiver_name || null,
      receiver_phone: data.receiver_phone || null,
      address: data.address || null,
      scheduled_time: data.scheduled_time || null,
      fee: data.fee || null,
      note: data.note || null,
    });

    return { code: 0, message: '创建任务成功', data: { id, task_no: taskNo } };
  }

  assign(id: number, courierId: number) {
    const task = taskRepo.findById(id);
    if (!task) {
      return { code: 1020, message: '任务不存在', data: null };
    }
    if (task.status !== 'pending') {
      return { code: 1021, message: '任务状态不允许分配', data: null };
    }
    taskRepo.updateStatus(id, 'assigned', { courier_id: courierId });
    return { code: 0, message: '分配成功', data: null };
  }

  start(id: number) {
    const task = taskRepo.findById(id);
    if (!task) {
      return { code: 1020, message: '任务不存在', data: null };
    }
    if (task.status !== 'assigned') {
      return { code: 1021, message: '任务状态不允许开始', data: null };
    }
    taskRepo.updateStatus(id, 'in_progress');
    return { code: 0, message: '任务已开始', data: null };
  }

  complete(id: number) {
    const task = taskRepo.findById(id);
    if (!task) {
      return { code: 1020, message: '任务不存在', data: null };
    }
    if (task.status !== 'in_progress') {
      return { code: 1021, message: '任务状态不允许完成', data: null };
    }
    taskRepo.updateStatus(id, 'completed', { completed_at: new Date().toISOString() });
    return { code: 0, message: '任务已完成', data: null };
  }

  fail(id: number) {
    const task = taskRepo.findById(id);
    if (!task) {
      return { code: 1020, message: '任务不存在', data: null };
    }
    if (task.status !== 'in_progress') {
      return { code: 1021, message: '任务状态不允许标记失败', data: null };
    }
    taskRepo.updateStatus(id, 'failed', { completed_at: new Date().toISOString() });
    return { code: 0, message: '任务已标记失败', data: null };
  }
}
