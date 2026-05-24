import express from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { 
  validateRequiredFields,
  parseJSON,
  stringifyJSON,
  calculateHeartRateZone,
  calculateCalories,
  calculatePace,
  detectHeartRateAnomaly
} from '../utils';

const router = express.Router();

router.use(authMiddleware());

router.get('/', (req: AuthRequest, res) => {
  const { plan_id, workout_type, start_time, end_time, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT wr.*, tp.plan_name, d.device_name 
    FROM workout_records wr
    LEFT JOIN training_plans tp ON wr.plan_id = tp.id
    LEFT JOIN devices d ON wr.device_id = d.id
    WHERE wr.user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (plan_id) {
    sql += ' AND wr.plan_id = ?';
    params.push(plan_id);
  }
  
  if (workout_type) {
    sql += ' AND wr.workout_type = ?';
    params.push(workout_type);
  }
  
  if (start_time) {
    sql += ' AND wr.start_time >= ?';
    params.push(start_time);
  }
  
  if (end_time) {
    sql += ' AND wr.start_time <= ?';
    params.push(end_time);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' ORDER BY wr.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const records = stmt.all(...params).map((r: any) => ({
    ...r,
    heart_rate_zones: parseJSON(r.heart_rate_zones),
    track_data: parseJSON(r.track_data)
  }));
  
  res.json({
    success: true,
    data: {
      list: records,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.get('/:id', (req: AuthRequest, res) => {
  const sql = `
    SELECT wr.*, tp.plan_name, d.device_name 
    FROM workout_records wr
    LEFT JOIN training_plans tp ON wr.plan_id = tp.id
    LEFT JOIN devices d ON wr.device_id = d.id
    WHERE wr.id = ? AND wr.user_id = ?
  `;
  
  const stmt = db.prepare(sql);
  const record = stmt.get(req.params.id, req.user!.id) as any;
  
  if (!record) {
    return res.status(404).json({ error: '运动记录不存在' });
  }
  
  record.heart_rate_zones = parseJSON(record.heart_rate_zones);
  record.track_data = parseJSON(record.track_data);
  
  res.json({ success: true, data: record });
});

router.post(
  '/',
  logOperation('workout_create', 'workout_records'),
  (req: AuthRequest, res) => {
    const { 
      plan_id, device_id, workout_type, start_time, end_time,
      distance, avg_heart_rate, heart_rate_samples, track_data, notes
    } = req.body;
    
    const missing = validateRequiredFields(req.body, ['workout_type', 'start_time', 'end_time']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const userStmt = db.prepare('SELECT age, baseline_data FROM users WHERE id = ?');
    const user = userStmt.get(req.user!.id) as any;
    const age = user?.age || 30;
    const baseline = parseJSON(user?.baseline_data) || {};
    const weight = baseline?.weight || 70;

    const start = dayjs(start_time);
    const end = dayjs(end_time);
    const durationSeconds = end.diff(start, 'second');
    const durationMin = durationSeconds / 60;

    let avgPace = 0;
    let calories = 0;
    let performanceScore = 0;
    let recoverySuggestion = '';
    let riskNotes = '';
    let heartRateZones: Record<string, number> = { rest: 0, fat_burn: 0, cardio: 0, peak: 0, max: 0 };
    let status = 'completed';

    if (distance && durationMin > 0) {
      avgPace = calculatePace(distance, durationMin);
    }

    const metMap: Record<string, number> = {
      running: 9.8,
      cycling: 7.5,
      swimming: 8.0,
      walking: 3.5,
      strength: 5.0,
      hiit: 10.0,
      yoga: 2.5,
      other: 5.0
    };
    
    calories = calculateCalories(weight, durationMin, metMap[workout_type] || 5.0);

    if (heart_rate_samples && Array.isArray(heart_rate_samples)) {
      let validHrCount = 0;
      let totalHr = 0;
      let maxHr = 0;
      let abnormalCount = 0;
      
      for (const sample of heart_rate_samples) {
        const hr = typeof sample === 'number' ? sample : sample.hr;
        if (hr > 0) {
          validHrCount++;
          totalHr += hr;
          maxHr = Math.max(maxHr, hr);
          
          const zone = calculateHeartRateZone(hr, age);
          heartRateZones[zone] = (heartRateZones[zone] || 0) + 1;
          
          const anomaly = detectHeartRateAnomaly(hr, age);
          if (anomaly.isAnomaly) {
            abnormalCount++;
          }
        }
      }
      
      if (validHrCount > 0 && !avg_heart_rate) {
        (req.body as any).avg_heart_rate = Math.round(totalHr / validHrCount);
      }
      
      const totalZoneSamples = Object.values(heartRateZones).reduce((a: number, b: number) => a + b, 0);
      for (const zone of Object.keys(heartRateZones)) {
        heartRateZones[zone] = Math.round((heartRateZones[zone] / totalZoneSamples) * 100);
      }
      
      const cardioEfficiency = (heartRateZones.cardio + heartRateZones.peak) / 100;
      performanceScore = Math.min(100, Math.round(
        50 + cardioEfficiency * 40 + (durationMin > 30 ? 10 : durationMin / 3)
      ));
      
      if (abnormalCount > heart_rate_samples.length * 0.3) {
        status = 'pending_review';
        riskNotes += `检测到 ${abnormalCount} 个异常心率样本，`;
      }
      
      if (maxHr > 220 - age) {
        recoverySuggestion += '本次运动心率偏高，建议下次降低强度。';
      }
    }

    if (durationMin > 120) {
      recoverySuggestion += '运动时间过长，建议充分休息并补充营养。';
      riskNotes += '单次运动时长超过2小时，存在过度训练风险。';
      
      const checkOvertrainingStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM workout_records 
        WHERE user_id = ? 
        AND start_time >= DATE('now', '-7 days')
        AND status = 'completed'
      `);
      const { count } = checkOvertrainingStmt.get(req.user!.id) as { count: number };
      
      if (count >= 5) {
        riskNotes += '近7天运动次数过多，请注意休息。';
        
        const alertStmt = db.prepare(`
          INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status, requires_confirmation)
          VALUES (?, 'overtraining', 'high', ?, ?, ?, 'pending', 1)
        `);
        alertStmt.run(
          req.user!.id,
          '过度训练风险警告',
          `您近7天已完成 ${count} 次运动，且单次时长超过2小时，存在过度训练风险。建议适当休息，避免运动损伤。`,
          stringifyJSON({ workout_count: count, duration_min: durationMin }),
          'pending'
        );
      }
    }

    const checkMissedPlansStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM training_plans tp
      LEFT JOIN workout_records wr ON tp.id = wr.plan_id AND wr.start_time >= DATE('now', '-7 days')
      WHERE tp.user_id = ? AND tp.status = 'active' AND wr.id IS NULL
    `);
    const { count: missedCount } = checkMissedPlansStmt.get(req.user!.id) as { count: number };
    
    if (missedCount > 0) {
      const alertStmt = db.prepare(`
        INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
        VALUES (?, 'missed_plan', 'low', ?, ?, ?, 'pending')
      `);
      alertStmt.run(
        req.user!.id,
        '计划完成提醒',
        `您有 ${missedCount} 个训练计划本周尚未完成，请坚持！`,
        stringifyJSON({ missed_count: missedCount }),
        'pending'
      );
    }

    if (riskNotes) {
      status = 'pending_review';
    }

    const stmt = db.prepare(`
      INSERT INTO workout_records 
      (user_id, plan_id, device_id, workout_type, start_time, end_time, duration_seconds,
       distance, avg_pace, avg_heart_rate, heart_rate_zones, calories_burned, track_data,
       recovery_suggestion, risk_notes, performance_score, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user!.id,
      plan_id || null,
      device_id || null,
      workout_type,
      start_time,
      end_time,
      durationSeconds,
      distance || null,
      avgPace || null,
      (req.body as any).avg_heart_rate || null,
      stringifyJSON(heartRateZones),
      calories,
      track_data ? stringifyJSON(track_data) : null,
      recoverySuggestion || null,
      riskNotes || null,
      performanceScore,
      status,
      notes || null
    );

    if (plan_id) {
      const planStmt = db.prepare('SELECT * FROM training_plans WHERE id = ?');
      const plan = planStmt.get(plan_id) as any;
      if (plan && plan.exercises) {
        const exercises = parseJSON(plan.exercises) || [];
        const completedToday = exercises.filter((e: any) => {
          const dayMap: Record<string, string> = {
            '0': '周日', '1': '周一', '2': '周二', '3': '周三',
            '4': '周四', '5': '周五', '6': '周六'
          };
          const workoutDay = dayMap[dayjs(start_time).day().toString()];
          return e.day === workoutDay;
        }).length > 0;
        
        if (completedToday) {
          const goalStmt = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?');
          const goal = goalStmt.get(plan.goal_id, req.user!.id) as any;
          if (goal) {
            const progress = Math.min(100, ((goal.current_value || 0) + 1) / 7 * 100);
            const updateGoalStmt = db.prepare(`
              UPDATE goals SET current_value = current_value + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `);
            updateGoalStmt.run(plan.goal_id);
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        performance_score: performanceScore,
        recovery_suggestion: recoverySuggestion,
        risk_notes: riskNotes,
        calories_burned: calories,
        heart_rate_zones: heartRateZones,
        status,
        message: status === 'pending_review' ? '运动记录已提交，存在风险提示，请关注' : '运动记录已保存'
      }
    });
  }
);

router.post(
  '/:id/revoke',
  logOperation('workout_revoke', 'workout_records', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { reason } = req.body;
    
    const recordStmt = db.prepare('SELECT * FROM workout_records WHERE id = ? AND user_id = ?');
    const record = recordStmt.get(req.params.id, req.user!.id);
    
    if (!record) {
      return res.status(404).json({ error: '运动记录不存在' });
    }

    const stmt = db.prepare(`
      UPDATE workout_records SET status = 'revoked', notes = COALESCE(notes || '; ', '') || ? WHERE id = ?
    `);
    stmt.run(`[撤销] ${reason || '用户主动撤销'}`, req.params.id);

    res.json({ success: true, message: '运动记录已撤销' });
  }
);

router.get('/analysis/summary', (req: AuthRequest, res) => {
  const { period = '7d' } = req.query;
  
  let dateFilter = "DATE('now', '-7 days')";
  if (period === '30d') dateFilter = "DATE('now', '-30 days')";
  if (period === '90d') dateFilter = "DATE('now', '-90 days')";
  
  const sql = `
    SELECT 
      COUNT(*) as total_workouts,
      SUM(duration_seconds) / 60 as total_minutes,
      SUM(distance) as total_distance,
      SUM(calories_burned) as total_calories,
      AVG(performance_score) as avg_performance,
      workout_type
    FROM workout_records
    WHERE user_id = ? AND status = 'completed' AND start_time >= ${dateFilter}
    GROUP BY workout_type
    ORDER BY total_workouts DESC
  `;
  
  const stmt = db.prepare(sql);
  const byType = stmt.all(req.user!.id);
  
  const totalSql = `
    SELECT 
      COUNT(*) as total_workouts,
      SUM(duration_seconds) / 60 as total_minutes,
      SUM(distance) as total_distance,
      SUM(calories_burned) as total_calories,
      AVG(performance_score) as avg_performance
    FROM workout_records
    WHERE user_id = ? AND status = 'completed' AND start_time >= ${dateFilter}
  `;
  
  const totalStmt = db.prepare(totalSql);
  const totals = totalStmt.get(req.user!.id);
  
  const dailySql = `
    SELECT 
      DATE(start_time) as date,
      COUNT(*) as count,
      SUM(duration_seconds) / 60 as minutes,
      SUM(calories_burned) as calories
    FROM workout_records
    WHERE user_id = ? AND status = 'completed' AND start_time >= ${dateFilter}
    GROUP BY DATE(start_time)
    ORDER BY date DESC
  `;
  
  const dailyStmt = db.prepare(dailySql);
  const daily = dailyStmt.all(req.user!.id);
  
  res.json({
    success: true,
    data: {
      totals,
      by_type: byType,
      daily
    }
  });
});

export default router;
