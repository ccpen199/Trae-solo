import express from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { validateRequiredFields, parseJSON, stringifyJSON } from '../utils';

const router = express.Router();

router.use(authMiddleware(['coach', 'advisor', 'admin']));

router.get('/assigned-users', (req: AuthRequest, res) => {
  const sql = `
    SELECT ca.*, u.name, u.username, u.email, u.phone, u.age, u.gender,
           COUNT(DISTINCT wr.id) as workout_count,
           COUNT(DISTINCT tp.id) as plan_count,
           COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as alert_count
    FROM coach_assignments ca
    LEFT JOIN users u ON ca.user_id = u.id
    LEFT JOIN workout_records wr ON u.id = wr.user_id AND wr.start_time >= DATE('now', '-30 days')
    LEFT JOIN training_plans tp ON u.id = tp.user_id AND tp.status = 'active'
    LEFT JOIN alerts a ON u.id = a.user_id AND a.status = 'pending'
    WHERE ca.coach_id = ? AND ca.status = 'active'
    GROUP BY ca.id, u.id
    ORDER BY u.name
  `;
  
  const stmt = db.prepare(sql);
  const users = stmt.all(req.user!.id);
  
  res.json({ success: true, data: users });
});

router.get('/user/:user_id/trend', (req: AuthRequest, res) => {
  const { user_id } = req.params;
  
  const checkStmt = db.prepare(`
    SELECT * FROM coach_assignments 
    WHERE coach_id = ? AND user_id = ? AND status = 'active'
  `);
  const assignment = checkStmt.get(req.user!.id, user_id);
  
  if (!assignment) {
    return res.status(403).json({ error: '您没有查看该用户数据的权限' });
  }

  const { period = '30d' } = req.query;
  let dateFilter = "DATE('now', '-30 days')";
  if (period === '90d') dateFilter = "DATE('now', '-90 days')";
  
  const workoutTrendSql = `
    SELECT 
      DATE(start_time) as date,
      COUNT(*) as count,
      SUM(duration_seconds) / 60 as total_minutes,
      SUM(calories_burned) as total_calories,
      AVG(performance_score) as avg_performance,
      AVG(avg_heart_rate) as avg_hr
    FROM workout_records
    WHERE user_id = ? AND status = 'completed' AND start_time >= ${dateFilter}
    GROUP BY DATE(start_time)
    ORDER BY date
  `;
  
  const workoutStmt = db.prepare(workoutTrendSql);
  const workoutTrend = workoutStmt.all(user_id);
  
  const hrTrendSql = `
    SELECT 
      DATE(sample_time) as date,
      AVG(CAST(data_value AS INTEGER)) as avg_hr,
      MAX(CAST(data_value AS INTEGER)) as max_hr,
      MIN(CAST(data_value AS INTEGER)) as min_hr
    FROM device_data
    WHERE user_id = ? AND data_type = 'heart_rate' AND status = 'normal' AND sample_time >= ${dateFilter}
    GROUP BY DATE(sample_time)
    ORDER BY date
  `;
  
  const hrStmt = db.prepare(hrTrendSql);
  const hrTrend = hrStmt.all(user_id);
  
  const stepsTrendSql = `
    SELECT 
      DATE(sample_time) as date,
      SUM(CAST(data_value AS INTEGER)) as total_steps
    FROM device_data
    WHERE user_id = ? AND data_type = 'steps' AND status = 'normal' AND sample_time >= ${dateFilter}
    GROUP BY DATE(sample_time)
    ORDER BY date
  `;
  
  const stepsStmt = db.prepare(stepsTrendSql);
  const stepsTrend = stepsStmt.all(user_id);
  
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = userStmt.get(user_id);
  
  const plansStmt = db.prepare(`
    SELECT * FROM training_plans WHERE user_id = ? AND status IN ('active', 'pending_approval')
    ORDER BY created_at DESC
  `);
  const plans = plansStmt.all(user_id).map((p: any) => ({
    ...p,
    exercises: parseJSON(p.exercises)
  }));
  
  const recentAlertsStmt = db.prepare(`
    SELECT * FROM alerts 
    WHERE user_id = ? AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  const recentAlerts = recentAlertsStmt.all(user_id);
  
  res.json({
    success: true,
    data: {
      user,
      workout_trend: workoutTrend,
      heart_rate_trend: hrTrend,
      steps_trend: stepsTrend,
      active_plans: plans,
      pending_alerts: recentAlerts
    }
  });
});

router.post(
  '/intervention',
  logOperation('coach_intervention', 'coach_interventions'),
  (req: AuthRequest, res) => {
    const { user_id, plan_id, intervention_type, previous_value, new_value, reason } = req.body;
    const missing = validateRequiredFields(req.body, ['user_id', 'intervention_type', 'new_value', 'reason']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const checkStmt = db.prepare(`
      SELECT * FROM coach_assignments 
      WHERE coach_id = ? AND user_id = ? AND status = 'active'
    `);
    const assignment = checkStmt.get(req.user!.id, user_id);
    
    if (!assignment) {
      return res.status(403).json({ error: '您没有干预该用户的权限' });
    }

    const stmt = db.prepare(`
      INSERT INTO coach_interventions 
      (coach_id, user_id, plan_id, intervention_type, previous_value, new_value, reason, status, synced_to_user)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)
    `);

    const result = stmt.run(
      req.user!.id,
      user_id,
      plan_id || null,
      intervention_type,
      previous_value || null,
      new_value,
      reason
    );

    const alertStmt = db.prepare(`
      INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
      VALUES (?, 'high_risk', 'medium', ?, ?, ?, 'pending')
    `);
    
    const typeNames: Record<string, string> = {
      adjust_intensity: '训练强度调整',
      rest_day: '休息日调整',
      course_suggestion: '课程建议',
      goal_adjust: '目标调整',
      health_advice: '健康建议'
    };
    
    alertStmt.run(
      user_id,
      `教练${typeNames[intervention_type] || '干预'}提醒`,
      `您的教练 ${req.user!.name} 对您的训练计划进行了调整: ${reason}`,
      stringifyJSON({ intervention_id: result.lastInsertRowid, intervention_type, new_value }),
      'pending'
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '干预已提交，已同步通知用户'
      }
    });
  }
);

router.post(
  '/intervention/:id/implement',
  logOperation('intervention_implement', 'coach_interventions', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const interventionStmt = db.prepare(`
      SELECT ci.*, tp.status as plan_status
      FROM coach_interventions ci
      LEFT JOIN training_plans tp ON ci.plan_id = tp.id
      WHERE ci.id = ? AND ci.coach_id = ?
    `);
    const intervention = interventionStmt.get(req.params.id, req.user!.id) as any;
    
    if (!intervention) {
      return res.status(404).json({ error: '干预记录不存在' });
    }

    if (intervention.status !== 'pending') {
      return res.status(400).json({ error: `当前状态为 ${intervention.status}，无法执行` });
    }

    if (intervention.plan_id) {
      const newExercises = parseJSON(intervention.new_value);
      const intensityMatch = intervention.reason?.match(/intensity: (low|medium|high)/);
      const newIntensity = intensityMatch ? intensityMatch[1] : null;
      
      const updatePlanStmt = db.prepare(`
        UPDATE training_plans 
        SET exercises = ?, 
            intensity = COALESCE(?, intensity),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updatePlanStmt.run(
        newExercises ? stringifyJSON(newExercises) : intervention.new_value,
        newIntensity,
        intervention.plan_id
      );
    }

    const stmt = db.prepare(`
      UPDATE coach_interventions 
      SET status = 'implemented', implemented_at = CURRENT_TIMESTAMP, synced_to_user = 1
      WHERE id = ?
    `);
    stmt.run(req.params.id);

    res.json({ success: true, message: '干预已生效' });
  }
);

router.get('/interventions', (req: AuthRequest, res) => {
  const { status, user_id, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT ci.*, u.name as user_name, tp.plan_name
    FROM coach_interventions ci
    LEFT JOIN users u ON ci.user_id = u.id
    LEFT JOIN training_plans tp ON ci.plan_id = tp.id
    WHERE ci.coach_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (status) {
    sql += ' AND ci.status = ?';
    params.push(status);
  }
  
  if (user_id) {
    sql += ' AND ci.user_id = ?';
    params.push(user_id);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' ORDER BY ci.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const interventions = stmt.all(...params).map((i: any) => ({
    ...i,
    previous_value: parseJSON(i.previous_value),
    new_value: parseJSON(i.new_value)
  }));
  
  res.json({
    success: true,
    data: {
      list: interventions,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.put(
  '/plan/:plan_id',
  logOperation('coach_plan_adjust', 'training_plans', (req) => parseInt(req.params.plan_id)),
  (req: AuthRequest, res) => {
    const { intensity, rest_days, exercises, description } = req.body;
    
    const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ?');
    const plan = planStmt.get(req.params.plan_id) as any;
    
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    const checkStmt = db.prepare(`
      SELECT * FROM coach_assignments 
      WHERE coach_id = ? AND user_id = ? AND status = 'active'
    `);
    const assignment = checkStmt.get(req.user!.id, plan.user_id);
    
    if (!assignment) {
      return res.status(403).json({ error: '您没有调整该用户计划的权限' });
    }

    const newVersion = (plan.version || 1) + 1;
    
    const insertStmt = db.prepare(`
      INSERT INTO training_plans 
      (user_id, goal_id, plan_name, plan_type, description, intensity, frequency_per_week, 
       rest_days, exercises, duration_weeks, status, version, parent_id, generated_by, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, 'coach', ?)
    `);

    const result = insertStmt.run(
      plan.user_id,
      plan.goal_id,
      `${plan.plan_name} (教练调整 v${newVersion})`,
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

    const alertStmt = db.prepare(`
      INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
      VALUES (?, 'high_risk', 'medium', ?, ?, ?, 'pending')
    `);
    alertStmt.run(
      plan.user_id,
      '教练已调整您的训练计划',
      `您的教练 ${req.user!.name} 对训练计划进行了调整，请查看并确认。`,
      stringifyJSON({ plan_id: result.lastInsertRowid, coach_id: req.user!.id }),
      'pending'
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        version: newVersion,
        message: '计划调整已提交，已通知用户确认'
      }
    });
  }
);

export default router;
