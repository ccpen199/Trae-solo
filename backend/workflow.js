const db = require('./database');

function startWorkflow(workflowCode, businessId, businessType, applicantId, applicantType, data = {}, priority = 'normal') {
  const workflows = db.query('SELECT * FROM business_workflows WHERE workflow_code = ? LIMIT 1', [workflowCode]);
  if (workflows.length === 0) {
    throw new Error(`工作流 ${workflowCode} 不存在`);
  }
  const workflow = workflows[0];
  const stepDefs = JSON.parse(workflow.step_definitions);
  const now = new Date().toISOString();
  const slaDeadline = new Date(Date.now() + workflow.timeout_days * 24 * 60 * 60 * 1000).toISOString();
  
  db.execute(`
    INSERT INTO workflow_instances (workflow_id, service_id, business_id, business_type, applicant_id, applicant_type, current_step, total_steps, status, priority, data, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?)
  `, [workflow.id, workflow.service_id, businessId, businessType, applicantId, applicantType, 1, workflow.total_steps, priority, JSON.stringify(data), slaDeadline]);
  
  const instanceId = db.getLastInsertId();
  
  db.execute(`
    INSERT INTO workflow_audit_logs (workflow_instance_id, step_number, action, operator_id, operator_role, comment, from_status, to_status)
    VALUES (?, 1, 'start_workflow', ?, ?, '工作流启动', NULL, 'in_progress')
  `, [instanceId, applicantId, applicantType]);
  
  return {
    instanceId,
    currentStep: 1,
    totalSteps: workflow.total_steps,
    status: 'in_progress',
    stepDefinitions: stepDefs
  };
}

function advanceWorkflow(instanceId, operatorId, operatorRole, comment = '', actionData = {}) {
  const instances = db.query('SELECT * FROM workflow_instances WHERE id = ? LIMIT 1', [instanceId]);
  if (instances.length === 0) {
    throw new Error(`工作流实例 ${instanceId} 不存在`);
  }
  const instance = instances[0];
  
  if (instance.status === 'completed' || instance.status === 'rejected' || instance.status === 'cancelled') {
    throw new Error(`工作流已处于 ${instance.status} 状态，无法继续推进`);
  }
  
  const workflows = db.query('SELECT * FROM business_workflows WHERE id = ? LIMIT 1', [instance.workflow_id]);
  const workflow = workflows[0];
  const stepDefs = JSON.parse(workflow.step_definitions);
  const currentStepDef = stepDefs.find(s => s.step === instance.current_step);
  const nextStep = instance.current_step + 1;
  
  let newStatus = instance.status;
  let fromStatus = instance.status;
  
  if (nextStep > instance.total_steps) {
    newStatus = 'completed';
  } else {
    const nextStepDef = stepDefs.find(s => s.step === nextStep);
    if (nextStepDef?.role?.includes('agency') || nextStepDef?.role?.includes('admin')) {
      newStatus = 'pending_review';
    }
  }
  
  const now = new Date().toISOString();
  const completedAt = newStatus === 'completed' ? now : null;
  
  db.execute(`
    UPDATE workflow_instances
    SET current_step = ?, status = ?, last_activity_at = ?, completed_at = ?, data = ?
    WHERE id = ?
  `, [nextStep, newStatus, now, completedAt, JSON.stringify({ ...JSON.parse(instance.data || '{}'), ...actionData }), instanceId]);
  
  db.execute(`
    INSERT INTO workflow_audit_logs (workflow_instance_id, step_number, action, operator_id, operator_role, comment, from_status, to_status)
    VALUES (?, ?, 'advance', ?, ?, ?, ?, ?)
  `, [instanceId, instance.current_step, operatorId, operatorRole, comment, fromStatus, newStatus]);
  
  const nextStepDef = nextStep <= instance.total_steps ? stepDefs.find(s => s.step === nextStep) : null;
  
  return {
    instanceId,
    previousStep: instance.current_step,
    currentStep: nextStep,
    totalSteps: instance.total_steps,
    status: newStatus,
    nextStepInfo: nextStepDef,
    completedAt
  };
}

function rejectWorkflow(instanceId, operatorId, operatorRole, reason) {
  const instances = db.query('SELECT * FROM workflow_instances WHERE id = ? LIMIT 1', [instanceId]);
  if (instances.length === 0) {
    throw new Error(`工作流实例 ${instanceId} 不存在`);
  }
  const instance = instances[0];
  const fromStatus = instance.status;
  
  const now = new Date().toISOString();
  db.execute(`
    UPDATE workflow_instances
    SET status = 'rejected', last_activity_at = ?, completed_at = ?
    WHERE id = ?
  `, [now, now, instanceId]);
  
  db.execute(`
    INSERT INTO workflow_audit_logs (workflow_instance_id, step_number, action, operator_id, operator_role, comment, from_status, to_status)
    VALUES (?, ?, 'reject', ?, ?, ?, ?, 'rejected')
  `, [instanceId, instance.current_step, operatorId, operatorRole, reason, fromStatus]);
  
  return {
    instanceId,
    status: 'rejected',
    rejectedAt: now,
    reason
  };
}

function getWorkflowInstance(instanceId) {
  const instances = db.query(`
    SELECT wi.*, bw.workflow_code, bw.workflow_name, bw.step_definitions
    FROM workflow_instances wi
    INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
    WHERE wi.id = ?
    LIMIT 1
  `, [instanceId]);
  
  if (instances.length === 0) return null;
  
  const instance = instances[0];
  const stepDefs = JSON.parse(instance.step_definitions);
  const currentStepDef = stepDefs.find(s => s.step === instance.current_step);
  
  const auditLogs = db.query(`
    SELECT wal.*, u.real_name as operator_name
    FROM workflow_audit_logs wal
    LEFT JOIN users u ON wal.operator_id = u.id
    WHERE wal.workflow_instance_id = ?
    ORDER BY wal.created_at ASC
  `, [instanceId]);
  
  return {
    ...instance,
    step_definitions: stepDefs,
    current_step_info: currentStepDef,
    audit_logs: auditLogs
  };
}

function getUserWorkflows(userId, userType, status = null, limit = 50, offset = 0) {
  let sql = `
    SELECT wi.*, bw.workflow_code, bw.workflow_name, sc.service_name, sc.processing_deadline
    FROM workflow_instances wi
    INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
    LEFT JOIN service_catalog sc ON bw.service_id = sc.id
    WHERE wi.applicant_id = ? AND wi.applicant_type = ?
  `;
  const params = [userId, userType];
  
  if (status) {
    sql += ' AND wi.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY wi.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.query(sql, params);
}

function getPendingWorkflowsForReview(operatorId, operatorRoles, limit = 50, offset = 0) {
  const rolePlaceholders = operatorRoles.map(() => '?').join(',');
  
  const instances = db.query(`
    SELECT wi.*, bw.workflow_code, bw.workflow_name, bw.step_definitions, 
           sc.service_name, sc.processing_deadline,
           u.real_name as applicant_name
    FROM workflow_instances wi
    INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
    LEFT JOIN service_catalog sc ON bw.service_id = sc.id
    INNER JOIN users u ON wi.applicant_id = u.id
    WHERE wi.status IN ('in_progress', 'pending_review')
    ORDER BY 
      CASE wi.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      wi.sla_deadline ASC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  return instances.map(instance => {
    const stepDefs = JSON.parse(instance.step_definitions);
    const currentStepDef = stepDefs.find(s => s.step === instance.current_step);
    return {
      ...instance,
      step_definitions: undefined,
      current_step_info: currentStepDef
    };
  });
}

function getWorkflowTimeline(instanceId) {
  return db.query(`
    SELECT wal.*, u.real_name as operator_name, u.avatar as operator_avatar
    FROM workflow_audit_logs wal
    LEFT JOIN users u ON wal.operator_id = u.id
    WHERE wal.workflow_instance_id = ?
    ORDER BY wal.created_at ASC
  `, [instanceId]);
}

module.exports = {
  startWorkflow,
  advanceWorkflow,
  rejectWorkflow,
  getWorkflowInstance,
  getUserWorkflows,
  getPendingWorkflowsForReview,
  getWorkflowTimeline
};
