import express from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { 
  validateRequiredFields,
  parseJSON,
  stringifyJSON,
  generateTrainingPlan
} from '../utils';

const router = express.Router();

router.use(authMiddleware());

router.get('/goals', (req: AuthRequest, res) => {
  const { status } = req.query;
  let sql = `
    SELECT g.*, u.name as created_by_name 
    FROM goals g 
    LEFT JOIN users u ON g.created_by = u.id 
    WHERE g.user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (status) {
    sql += ' AND g.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY g.created_at DESC';
  
  const stmt = db.prepare(sql);
  const goals = stmt.all(...params);
  
  res.json({ success: true, data: goals });
});

router.post(
  '/goals',
  logOperation('goal_create', 'goals'),
  (req: AuthRequest, res) => {
    const { goal_type, target_value, start_date, end_date, baseline_data } = req.body;
    const missing = validateRequiredFields(req.body, ['goal_type', 'start_date', 'end_date']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO goals (user_id, goal_type, target_value, start_date, end_date, baseline_data, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `);
    
    const result = stmt.run(
      req.user!.id,
      goal_type,
      target_value || null,
      start_date,
      end_date,
      baseline_data ? stringifyJSON(baseline_data) : null,
      req.user!.id
    );

    res.json({
      success: true,
      data: { id: result.lastInsertRowid, message: '目标创建成功' }
    });
  }
);

router.put(
  '/goals/:id',
  logOperation('goal_update', 'goals', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const goalStmt = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?');
    const goal = goalStmt.get(req.params.id, req.user!.id);
    
    if (!goal) {
      return res.status(404).json({ error: '目标不存在' });
    }

    const { target_value, end_date, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE goals SET 
        target_value = COALESCE(?, target_value),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      target_value ?? null,
      end_date ?? null,
      status ?? null,
      req.params.id
    );

    res.json({ success: true, message: '目标已更新' });
  }
);

router.get('/plans', (req: AuthRequest, res) => {
  const { status, goal_id } = req.query;
  let sql = `
    SELECT tp.*, g.goal_type, u.name as created_by_name, u2.name as approved_by_name
    FROM training_plans tp
    LEFT JOIN goals g ON tp.goal_id = g.id
    LEFT JOIN users u ON tp.created_by = u.id
    LEFT JOIN users u2 ON tp.approved_by = u2.id
    WHERE tp.user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (status) {
    sql += ' AND tp.status = ?';
    params.push(status);
  }
  
  if (goal_id) {
    sql += ' AND tp.goal_id = ?';
    params.push(goal_id);
  }
  
  sql += ' ORDER BY tp.created_at DESC';
  
  const stmt = db.prepare(sql);
  const plans = stmt.all(...params).map((p: any) => ({
    ...p,
    exercises: parseJSON(p.exercises),
    rest_days: parseJSON(p.rest_days)
  }));
  
  res.json({ success: true, data: plans });
});

router.get('/plans/:id', (req: AuthRequest, res) => {
  const sql = `
    SELECT tp.*, g.goal_type, u.name as created_by_name, u2.name as approved_by_name
    FROM training_plans tp
    LEFT JOIN goals g ON tp.goal_id = g.id
    LEFT JOIN users u ON tp.created_by = u.id
    LEFT JOIN users u2 ON tp.approved_by = u2.id
    WHERE tp.id = ? AND tp.user_id = ?
  `;
  
  const stmt = db.prepare(sql);
  const plan = stmt.get(req.params.id, req.user!.id) as any;
  
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  plan.exercises = parseJSON(plan.exercises);
  plan.rest_days = parseJSON(plan.rest_days);
  
  res.json({ success: true, data: plan });
});

router.post(
  '/plans/generate',
  logOperation('plan_generate', 'training_plans'),
  (req: AuthRequest, res) => {
    const { goal_type, goal_id } = req.body;
    const missing = validateRequiredFields(req.body, ['goal_type']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(req.user!.id) as any;
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const baseline = parseJSON(user.baseline_data) || {};
    const exerciseHistory = parseJSON(user.medical_history) || [];
    const contraindications = parseJSON(user.contraindications) || [];

    const planData = generateTrainingPlan(
      goal_type,
      user.age || 30,
      baseline,
      exerciseHistory,
      contraindications
    );

    const planName = `${goal_type === 'fat_loss' ? '减脂' : goal_type === 'muscle_gain' ? '增肌' : goal_type === 'running' ? '跑步' : goal_type === 'rehabilitation' ? '康复' : '综合'}训练计划`;

    const stmt = db.prepare(`
      INSERT INTO training_plans 
      (user_id, goal_id, plan_name, plan_type, description, intensity, frequency_per_week, 
       rest_days, exercises, duration_weeks, status, version, generated_by, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', 1, 'system', ?)
    `);

    const result = stmt.run(
      req.user!.id,
      goal_id || null,
      planName,
      goal_type,
      planData.description,
      planData.intensity,
      planData.frequency_per_week,
      stringifyJSON(planData.rest_days),
      stringifyJSON(planData.exercises),
      planData.duration_weeks,
      req.user!.id
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        ...planData,
        plan_name: planName,
        status: 'pending_approval',
        message: '训练计划已生成，等待确认'
      }
    });
  }
);

router.post(
  '/plans/:id/approve',
  logOperation('plan_approve', 'training_plans', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
    const plan = planStmt.get(req.params.id, req.user!.id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    if (plan.status !== 'pending_approval') {
      return res.status(400).json({ error: `当前计划状态为 ${plan.status}，无法审批` });
    }

    const stmt = db.prepare(`
      UPDATE training_plans 
      SET status = 'active', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(req.user!.id, req.params.id);

    res.json({ success: true, message: '计划已确认并激活' });
  }
);

router.post(
  '/plans/:id/reject',
  logOperation('plan_reject', 'training_plans', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { rejection_reason } = req.body;
    
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
    const plan = planStmt.get(req.params.id, req.user!.id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    if (plan.status !== 'pending_approval') {
      return res.status(400).json({ error: `当前计划状态为 ${plan.status}，无法拒绝` });
    }

    const stmt = db.prepare(`
      UPDATE training_plans 
      SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(rejection_reason || '用户拒绝该计划', req.params.id);

    res.json({ success: true, message: '计划已拒绝' });
  }
);

router.post(
  '/plans/:id/return',
  logOperation('plan_return', 'training_plans', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { return_reason } = req.body;
    
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
    const plan = planStmt.get(req.params.id, req.user!.id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    if (!['active', 'pending_approval'].includes(plan.status)) {
      return res.status(400).json({ error: `当前计划状态为 ${plan.status}，无法退回` });
    }

    const stmt = db.prepare(`
      UPDATE training_plans 
      SET status = 'returned', return_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(return_reason || '用户退回该计划，需要调整', req.params.id);

    res.json({ success: true, message: '计划已退回，等待重新生成或教练调整' });
  }
);

router.post(
  '/plans/:id/cancel',
  logOperation('plan_cancel', 'training_plans', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
    const plan = planStmt.get(req.params.id, req.user!.id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    const stmt = db.prepare(`
      UPDATE training_plans 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(req.params.id);

    res.json({ success: true, message: '计划已取消' });
  }
);

router.post(
  '/plans/:id/adjust',
  logOperation('plan_adjust', 'training_plans', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { intensity, rest_days, exercises, description } = req.body;
    
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
    const plan = planStmt.get(req.params.id, req.user!.id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    const newVersion = (plan.version || 1) + 1;
    
    const insertStmt = db.prepare(`
      INSERT INTO training_plans 
      (user_id, goal_id, plan_name, plan_type, description, intensity, frequency_per_week, 
       rest_days, exercises, duration_weeks, status, version, parent_id, generated_by, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, 'user', ?)
    `);

    const result = insertStmt.run(
      plan.user_id,
      plan.goal_id,
      `${plan.plan_name} (v${newVersion})`,
      plan.plan_type,
      description || plan.description,
      intensity || plan.intensity,
      plan.frequency_per_week,
      rest_days ? stringifyJSON(rest_days) : plan.rest_days,
      exercises ? stringifyJSON(exercises) : plan.exercises,
      plan.duration_weeks,
      newVersion,
      plan.id,
      req.user!.id
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        version: newVersion,
        message: '计划调整已提交，等待确认'
      }
    });
  }
);

router.get('/plans/:id/history', (req: AuthRequest, res) => {
  const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ? AND user_id = ?');
  const plan = planStmt.get(req.params.id, req.user!.id) as any;
  
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }

  const sql = `
    WITH RECURSIVE plan_history AS (
      SELECT *, 0 as depth FROM training_plans WHERE id = ?
      UNION ALL
      SELECT tp.*, ph.depth + 1 as depth 
      FROM training_plans tp
      INNER JOIN plan_history ph ON tp.parent_id = ph.id
    )
    SELECT ph.*, u.name as created_by_name 
    FROM plan_history ph
    LEFT JOIN users u ON ph.created_by = u.id
    WHERE ph.user_id = ?
    ORDER BY ph.created_at DESC
  `;
  
  const stmt = db.prepare(sql);
  const history = stmt.all(req.params.id, req.user!.id).map((p: any) => ({
    ...p,
    exercises: parseJSON(p.exercises),
    rest_days: parseJSON(p.rest_days)
  }));
  
  res.json({ success: true, data: history });
});

export default router;
