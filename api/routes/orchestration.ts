import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware, authLevelMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import type { OneStopService, OrchestrationInstance, FlowStepInstance } from '../../shared/types';

const router = Router();

router.use(authMiddleware(), authLevelMiddleware(1));

router.get('/services', auditMiddleware('list_one_stop_services', 'one_stop_service'), (req: Request, res: Response) => {
  const { category, active } = req.query;

  let query = 'SELECT * FROM one_stop_services WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (active !== undefined) {
    query += ' AND active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY id';

  const services = db.prepare(query).all(...params) as any[];

  const result: OneStopService[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    category: s.category,
    requiredMaterials: JSON.parse(s.required_materials || '[]'),
    involvedDepartments: JSON.parse(s.involved_departments || '[]'),
    estimatedDays: s.estimated_days,
    flowSteps: JSON.parse(s.flow_steps || '[]'),
    active: s.active === 1,
  }));

  successResponse(res, result, '获取一件事服务列表成功');
});

router.get('/services/:id', auditMiddleware('view_one_stop_service', 'one_stop_service'), (req: Request, res: Response) => {
  const service = db.prepare('SELECT * FROM one_stop_services WHERE id = ?').get(req.params.id) as any;

  if (!service) {
    return errorResponse(res, '服务不存在', 404);
  }

  const result: OneStopService = {
    id: service.id,
    name: service.name,
    description: service.description,
    icon: service.icon,
    category: service.category,
    requiredMaterials: JSON.parse(service.required_materials || '[]'),
    involvedDepartments: JSON.parse(service.involved_departments || '[]'),
    estimatedDays: service.estimated_days,
    flowSteps: JSON.parse(service.flow_steps || '[]'),
    active: service.active === 1,
  };

  successResponse(res, result, '获取服务详情成功');
});

router.post('/start/:serviceId', auditMiddleware('start_orchestration', 'orchestration_instance'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { serviceId } = req.params;
  const { formData } = req.body;

  const service = db.prepare('SELECT * FROM one_stop_services WHERE id = ? AND active = 1').get(serviceId) as any;

  if (!service) {
    return errorResponse(res, '服务不存在或未启用', 404);
  }

  const flowSteps = JSON.parse(service.flow_steps || '[]') as any[];

  const instanceId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stepInstances: FlowStepInstance[] = flowSteps.map((step) => ({
    stepId: step.id,
    name: step.name,
    status: 'pending',
    department: step.department,
  }));

  if (stepInstances.length > 0) {
    stepInstances[0].status = 'running';
    stepInstances[0].startTime = now;
  }

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orchestration_instances (
        id, service_id, service_name, user_id, status, 
        steps, start_time, overall_progress, form_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      instanceId,
      serviceId,
      service.name,
      req.user.userId,
      'running',
      JSON.stringify(stepInstances),
      now,
      0,
      JSON.stringify(formData || {})
    );

    db.prepare(
      `INSERT INTO applications (
        id, service_id, user_id, service_name, status, 
        current_step, total_steps, submit_time, form_data, orchestration_instance_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `app_${instanceId}`,
      serviceId,
      req.user.userId,
      service.name,
      'processing',
      1,
      flowSteps.length,
      now,
      JSON.stringify(formData || {}),
      instanceId
    );

    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      db.prepare(
        `INSERT INTO application_steps (
          application_id, step_id, step_name, status, department, operator
        ) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        `app_${instanceId}`,
        i + 1,
        step.name,
        i === 0 ? 'current' : 'pending',
        step.department,
        i === 0 ? '系统自动处理' : null
      );
    }
  });

  try {
    tx();

    const result: OrchestrationInstance = {
      instanceId,
      serviceId,
      serviceName: service.name,
      status: 'running',
      steps: stepInstances,
      startTime: now,
      overallProgress: 0,
    };

    successResponse(res, result, '服务启动成功');
  } catch (err) {
    console.error('Failed to start orchestration:', err);
    errorResponse(res, '启动服务失败', 500);
  }
});

router.get('/instances', auditMiddleware('list_orchestration_instances', 'orchestration_instance'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { status, page = 1, pageSize = 10 } = req.query;

  let query = 'SELECT * FROM orchestration_instances WHERE user_id = ?';
  const params: any[] = [req.user.userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const instances = db.prepare(query).all(...params) as any[];

  const result: OrchestrationInstance[] = instances.map((inst) => ({
    instanceId: inst.id,
    serviceId: inst.service_id,
    serviceName: inst.service_name,
    status: inst.status,
    steps: JSON.parse(inst.steps || '[]'),
    startTime: inst.start_time,
    endTime: inst.end_time || undefined,
    overallProgress: inst.overall_progress,
  }));

  const total = db
    .prepare(
      `SELECT COUNT(*) as count FROM orchestration_instances WHERE user_id = ? ${status ? 'AND status = ?' : ''}`
    )
    .get(...(status ? [req.user.userId, status] : [req.user.userId])) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取实例列表成功'
  );
});

router.get('/instances/:instanceId', auditMiddleware('view_orchestration_instance', 'orchestration_instance'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const instance = db
    .prepare('SELECT * FROM orchestration_instances WHERE id = ? AND user_id = ?')
    .get(req.params.instanceId, req.user.userId) as any;

  if (!instance) {
    return errorResponse(res, '实例不存在', 404);
  }

  const result: OrchestrationInstance = {
    instanceId: instance.id,
    serviceId: instance.service_id,
    serviceName: instance.service_name,
    status: instance.status,
    steps: JSON.parse(instance.steps || '[]'),
    startTime: instance.start_time,
    endTime: instance.end_time || undefined,
    overallProgress: instance.overall_progress,
  };

  successResponse(res, result, '获取实例详情成功');
});

router.post('/instances/:instanceId/advance', auditMiddleware('advance_orchestration', 'orchestration_instance'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { instanceId } = req.params;
  const { stepId, result: stepResult, error } = req.body;

  const instance = db
    .prepare('SELECT * FROM orchestration_instances WHERE id = ? AND user_id = ?')
    .get(instanceId, req.user.userId) as any;

  if (!instance) {
    return errorResponse(res, '实例不存在', 404);
  }

  if (instance.status !== 'running') {
    return errorResponse(res, '实例未在运行中', 400);
  }

  const steps: FlowStepInstance[] = JSON.parse(instance.steps || '[]');
  const currentStepIndex = steps.findIndex((s) => s.stepId === stepId);

  if (currentStepIndex === -1) {
    return errorResponse(res, '步骤不存在', 404);
  }

  if (steps[currentStepIndex].status !== 'running') {
    return errorResponse(res, '步骤未在运行中', 400);
  }

  const now = new Date().toISOString();
  steps[currentStepIndex].endTime = now;
  steps[currentStepIndex].result = stepResult;

  if (error) {
    steps[currentStepIndex].status = 'failed';
    steps[currentStepIndex].error = error;

    db.prepare(
      'UPDATE orchestration_instances SET status = ?, steps = ?, end_time = ? WHERE id = ?'
    ).run('failed', JSON.stringify(steps), now, instanceId);

    db.prepare(
      'UPDATE applications SET status = ? WHERE orchestration_instance_id = ?'
    ).run('rejected', instanceId);

    return successResponse(res, { status: 'failed' }, '流程执行失败');
  }

  steps[currentStepIndex].status = 'completed';

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const overallProgress = Math.round((completedCount / steps.length) * 100);

  const appId = `app_${instanceId}`;
  db.prepare('UPDATE application_steps SET status = ?, end_time = ?, operator = ? WHERE application_id = ? AND step_id = ?').run(
    'completed',
    now,
    '系统自动处理',
    appId,
    currentStepIndex + 1
  );

  if (currentStepIndex < steps.length - 1) {
    steps[currentStepIndex + 1].status = 'running';
    steps[currentStepIndex + 1].startTime = now;

    db.prepare('UPDATE application_steps SET status = ?, start_time = ?, operator = ? WHERE application_id = ? AND step_id = ?').run(
      'current',
      now,
      '系统自动处理',
      appId,
      currentStepIndex + 2
    );

    db.prepare(
      'UPDATE applications SET current_step = ? WHERE id = ?'
    ).run(currentStepIndex + 2, appId);

    db.prepare(
      'UPDATE orchestration_instances SET steps = ?, overall_progress = ? WHERE id = ?'
    ).run(JSON.stringify(steps), overallProgress, instanceId);
  } else {
    db.prepare(
      'UPDATE orchestration_instances SET status = ?, steps = ?, end_time = ?, overall_progress = ? WHERE id = ?'
    ).run('completed', JSON.stringify(steps), now, 100, instanceId);

    db.prepare(
      'UPDATE applications SET status = ?, complete_time = ? WHERE id = ?'
    ).run('completed', now, appId);
  }

  const result: OrchestrationInstance = {
    instanceId: instance.id,
    serviceId: instance.service_id,
    serviceName: instance.service_name,
    status: currentStepIndex < steps.length - 1 ? 'running' : 'completed',
    steps,
    startTime: instance.start_time,
    endTime: currentStepIndex < steps.length - 1 ? undefined : now,
    overallProgress,
  };

  successResponse(res, result, '步骤推进成功');
});

export default router;
