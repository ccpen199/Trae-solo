import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { successResponse, errorResponse, generateRequestNo, paginate } from '../utils/common.js';

const router = Router();

router.get('/templates', (req, res) => {
  const templates = db.prepare(
    'SELECT * FROM scene_templates WHERE status = 1 ORDER BY sort_order ASC, id ASC'
  ).all();

  const result = templates.map((t: any) => ({
    ...t,
    service_count: t.service_ids ? JSON.parse(t.service_ids).length : 0
  }));

  return successResponse(res, result);
});

router.get('/templates/:id', (req, res) => {
  const { id } = req.params;

  const template: any = db.prepare(
    'SELECT * FROM scene_templates WHERE id = ? AND status = 1'
  ).get(id);

  if (!template) {
    return errorResponse(res, '场景模板不存在', 404);
  }

  let serviceIds: number[] = [];
  if (template.service_ids) {
    serviceIds = JSON.parse(template.service_ids);
  }

  const services = serviceIds.length > 0 ? db.prepare(
    'SELECT * FROM services WHERE id IN (' + serviceIds.map(() => '?').join(',') + ') AND status = 1'
  ).all(...serviceIds) : [];

  let materialList = [];
  if (template.material_list) {
    materialList = JSON.parse(template.material_list);
  }

  let workflowConfig = {};
  if (template.workflow_config) {
    workflowConfig = JSON.parse(template.workflow_config);
  }

  return successResponse(res, {
    ...template,
    services,
    material_list: materialList,
    workflow_config: workflowConfig
  });
});

router.post('/instances/create', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { template_id, application_data } = req.body;

  if (!template_id) {
    return errorResponse(res, '场景模板ID不能为空');
  }

  const template: any = db.prepare(
    'SELECT * FROM scene_templates WHERE id = ? AND status = 1'
  ).get(template_id);

  if (!template) {
    return errorResponse(res, '场景模板不存在', 404);
  }

  let workflowConfig: any = {};
  if (template.workflow_config) {
    workflowConfig = JSON.parse(template.workflow_config);
  }

  const totalSteps = workflowConfig.steps?.length || 1;
  const instanceNo = generateRequestNo('SC');

  const initialStepResults = Array(totalSteps).fill(null).map((_, index) => ({
    step: index + 1,
    status: index === 0 ? 'processing' : 'pending',
    start_time: index === 0 ? new Date().toISOString() : null,
    end_time: null,
    result: null,
    remark: null
  }));

  const result = db.prepare(
    `INSERT INTO scene_instances 
     (instance_no, template_id, user_id, total_steps, step_results, application_data) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    instanceNo,
    template_id,
    userId,
    totalSteps,
    JSON.stringify(initialStepResults),
    JSON.stringify(application_data || {})
  );

  const instance = db.prepare(
    `SELECT si.*, st.name as template_name, st.description as template_description 
     FROM scene_instances si 
     LEFT JOIN scene_templates st ON si.template_id = st.id 
     WHERE si.id = ?`
  ).get(result.lastInsertRowid);

  return successResponse(res, {
    id: instance.id,
    instance_no: instance.instance_no,
    template_id: instance.template_id,
    template_name: instance.template_name,
    current_step: instance.current_step,
    total_steps: instance.total_steps,
    status: instance.status,
    start_time: instance.start_time,
    estimated_complete_time: new Date(Date.now() + totalSteps * 24 * 60 * 60 * 1000).toISOString()
  }, '场景实例创建成功');
});

router.get('/instances/list', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, status } = req.query as any;

  let sql = `SELECT si.*, st.name as template_name, st.icon as template_icon 
             FROM scene_instances si 
             LEFT JOIN scene_templates st ON si.template_id = st.id 
             WHERE si.user_id = ?`;
  const params: any[] = [userId];

  if (status) {
    sql += ' AND si.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY si.created_at DESC';

  const instances = db.prepare(sql).all(...params);
  const result = paginate(instances, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/instances/:instance_no', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { instance_no } = req.params;

  const instance: any = db.prepare(
    `SELECT si.*, st.name as template_name, st.description as template_description,
            st.service_ids, st.material_list, st.workflow_config
     FROM scene_instances si 
     LEFT JOIN scene_templates st ON si.template_id = st.id 
     WHERE si.instance_no = ? AND si.user_id = ?`
  ).get(instance_no, userId);

  if (!instance) {
    return errorResponse(res, '场景实例不存在', 404);
  }

  if (instance.application_data) {
    instance.application_data = JSON.parse(instance.application_data);
  }

  if (instance.step_results) {
    instance.step_results = JSON.parse(instance.step_results);
  }

  if (instance.workflow_config) {
    instance.workflow_config = JSON.parse(instance.workflow_config);
  }

  let serviceIds: number[] = [];
  if (instance.service_ids) {
    serviceIds = JSON.parse(instance.service_ids);
  }

  instance.services = serviceIds.length > 0 ? db.prepare(
    'SELECT id, name, code, handling_time FROM services WHERE id IN (' + serviceIds.map(() => '?').join(',') + ')'
  ).all(...serviceIds) : [];

  if (instance.material_list) {
    instance.material_list = JSON.parse(instance.material_list);
  }

  return successResponse(res, instance);
});

router.post('/instances/:instance_no/next-step', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { instance_no } = req.params;
  const { step_result, remark } = req.body;

  const instance: any = db.prepare(
    'SELECT * FROM scene_instances WHERE instance_no = ? AND user_id = ?'
  ).get(instance_no, userId);

  if (!instance) {
    return errorResponse(res, '场景实例不存在', 404);
  }

  if (instance.status === 'completed') {
    return errorResponse(res, '场景已完成，无法继续流转');
  }

  let stepResults = JSON.parse(instance.step_results || '[]');
  const currentStep = instance.current_step;

  if (currentStep >= instance.total_steps) {
    db.prepare(
      'UPDATE scene_instances SET status = ?, complete_time = datetime(\"now\"), updated_at = datetime(\"now\") WHERE instance_no = ?'
    ).run('completed', instance_no);

    return successResponse(res, {
      instance_no,
      status: 'completed',
      current_step: instance.total_steps,
      message: '场景已完成'
    });
  }

  if (stepResults[currentStep]) {
    stepResults[currentStep] = {
      ...stepResults[currentStep],
      status: 'completed',
      end_time: new Date().toISOString(),
      result: step_result || null,
      remark: remark || null
    };
  }

  const nextStep = currentStep + 1;
  if (nextStep < instance.total_steps && stepResults[nextStep]) {
    stepResults[nextStep] = {
      ...stepResults[nextStep],
      status: 'processing',
      start_time: new Date().toISOString()
    };
  }

  const newStatus = nextStep >= instance.total_steps ? 'completed' : 'in_progress';
  const completeTime = newStatus === 'completed' ? new Date().toISOString() : null;

  db.prepare(
    `UPDATE scene_instances 
     SET current_step = ?, step_results = ?, status = ?, complete_time = ?, updated_at = datetime(\"now\") 
     WHERE instance_no = ?`
  ).run(nextStep, JSON.stringify(stepResults), newStatus, completeTime, instance_no);

  return successResponse(res, {
    instance_no,
    current_step: nextStep,
    total_steps: instance.total_steps,
    status: newStatus,
    step_completed: currentStep + 1,
    is_completed: newStatus === 'completed'
  }, '步骤流转成功');
});

router.get('/instances/:instance_no/progress', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { instance_no } = req.params;

  const instance: any = db.prepare(
    `SELECT si.*, st.workflow_config 
     FROM scene_instances si 
     LEFT JOIN scene_templates st ON si.template_id = st.id 
     WHERE si.instance_no = ? AND si.user_id = ?`
  ).get(instance_no, userId);

  if (!instance) {
    return errorResponse(res, '场景实例不存在', 404);
  }

  let stepResults = JSON.parse(instance.step_results || '[]');
  let workflowConfig = JSON.parse(instance.workflow_config || '{}');
  const steps = workflowConfig.steps || [];

  const progress = steps.map((step: any, index: number) => ({
    step: index + 1,
    name: step.name,
    description: step.description,
    status: stepResults[index]?.status || 'pending',
    start_time: stepResults[index]?.start_time,
    end_time: stepResults[index]?.end_time,
    result: stepResults[index]?.result,
    remark: stepResults[index]?.remark,
    is_current: index === instance.current_step
  }));

  return successResponse(res, {
    instance_no,
    current_step: instance.current_step,
    total_steps: instance.total_steps,
    status: instance.status,
    progress_percentage: Math.round((instance.current_step / instance.total_steps) * 100),
    steps: progress
  });
});

export default router;
