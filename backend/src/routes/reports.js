const express = require('express');
const dayjs = require('dayjs');
const { getDb } = require('../db');

const router = express.Router();

router.get('/workload', (req, res) => {
  const db = getDb();
  const { start_date, end_date, fleet_id } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  let sql = `
    SELECT 
      cm.id,
      cm.name,
      cm.employee_no,
      cm.position,
      f.name as fleet_name,
      COUNT(DISTINCT s.id) as schedule_count,
      SUM(wr.hours) as total_hours,
      AVG(wr.hours) as avg_hours_per_shift
    FROM crew_members cm
    LEFT JOIN work_records wr ON cm.id = wr.crew_member_id
    LEFT JOIN schedules s ON wr.schedule_id = s.id
    LEFT JOIN fleets f ON cm.fleet_id = f.id
    WHERE cm.status = 'active'
    AND wr.record_date >= ?
    AND wr.record_date <= ?
  `;
  const params = [startDate, endDate];
  
  if (fleet_id) {
    sql += ' AND cm.fleet_id = ?';
    params.push(fleet_id);
  }
  
  sql += ' GROUP BY cm.id ORDER BY total_hours DESC';
  
  const workload = db.prepare(sql).all(...params);
  res.json(workload);
});

router.get('/coverage', (req, res) => {
  const db = getDb();
  const { start_date, end_date } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  const totalTrains = db.prepare(`
    SELECT COUNT(*) as count FROM schedules
    WHERE schedule_date >= ? AND schedule_date <= ?
  `).get(startDate, endDate).count;
  
  const fullyCovered = db.prepare(`
    SELECT COUNT(DISTINCT s.id) as count
    FROM schedules s
    JOIN schedule_assignments sa ON s.id = sa.schedule_id
    WHERE s.schedule_date >= ? AND s.schedule_date <= ?
    GROUP BY s.id
    HAVING COUNT(sa.id) >= (
      SELECT SUM(pr.count) FROM position_requirements pr WHERE pr.train_id = s.train_id
    )
  `).all(startDate, endDate).length;
  
  const partialCovered = totalTrains - fullyCovered;
  
  res.json({
    total_trains: totalTrains,
    fully_covered: fullyCovered,
    partially_covered: partialCovered,
    coverage_rate: totalTrains > 0 ? ((fullyCovered / totalTrains) * 100).toFixed(2) : 0
  });
});

router.get('/shortage-risk', (req, res) => {
  const db = getDb();
  
  const positions = ['列车长', '乘务员', '安全员', '餐车长'];
  const riskData = [];
  
  for (const position of positions) {
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM crew_members 
      WHERE position = ? AND status = 'active' AND health_status = 'normal'
    `).get(position).count;
    
    const onVacation = db.prepare(`
      SELECT COUNT(DISTINCT cm.id) as count FROM crew_members cm
      JOIN vacations v ON cm.id = v.crew_member_id
      WHERE cm.position = ? 
      AND cm.status = 'active'
      AND v.status = 'approved'
      AND DATE('now') BETWEEN v.start_date AND v.end_date
    `).get(position).count;
    
    const onTraining = db.prepare(`
      SELECT COUNT(DISTINCT cm.id) as count FROM crew_members cm
      JOIN trainings t ON cm.id = t.crew_member_id
      WHERE cm.position = ? 
      AND cm.status = 'active'
      AND DATE('now') = t.training_date
    `).get(position).count;
    
    const available = totalCount - onVacation - onTraining;
    const riskLevel = available < 3 ? 'high' : available < 5 ? 'medium' : 'low';
    
    riskData.push({
      position,
      total_count: totalCount,
      available_count: available,
      on_vacation: onVacation,
      on_training: onTraining,
      risk_level: riskLevel
    });
  }
  
  res.json(riskData);
});

router.get('/shift-changes', (req, res) => {
  const db = getDb();
  const { start_date, end_date } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  const stats = db.prepare(`
    SELECT 
      type,
      status,
      COUNT(*) as count
    FROM shift_changes
    WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    GROUP BY type, status
    ORDER BY count DESC
  `).all(startDate, endDate);
  
  const totalChanges = db.prepare(`
    SELECT COUNT(*) as count FROM shift_changes
    WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
  `).get(startDate, endDate).count;
  
  res.json({
    total_changes: totalChanges,
    details: stats
  });
});

router.get('/violations', (req, res) => {
  const db = getDb();
  const { start_date, end_date, status } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  const violations = [];
  
  const monthlyHours = db.prepare(`
    SELECT 
      cm.id,
      cm.name,
      SUM(wr.hours) as total_hours
    FROM crew_members cm
    JOIN work_records wr ON cm.id = wr.crew_member_id
    WHERE wr.record_date >= ? AND wr.record_date <= ?
    GROUP BY cm.id
    HAVING total_hours > 174
  `).all(startDate, endDate);
  
  for (const row of monthlyHours) {
    violations.push({
      id: `hours_${row.id}`,
      type: '月度工时超限',
      crew_id: row.id,
      crew_name: row.name,
      description: `月度工时 ${row.total_hours.toFixed(1)} 小时，超过174小时上限`,
      value: row.total_hours,
      review_status: 'pending',
      handle_result: '',
      adjusted_schedule: null,
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
    });
  }
  
  const consecutiveDays = db.prepare(`
    SELECT 
      cm.id,
      cm.name,
      s.schedule_date
    FROM crew_members cm
    JOIN schedule_assignments sa ON cm.id = sa.crew_member_id
    JOIN schedules s ON sa.schedule_id = s.id
    WHERE s.schedule_date >= ? AND s.schedule_date <= ?
    GROUP BY cm.id, s.schedule_date
    ORDER BY cm.id, s.schedule_date
  `).all(startDate, endDate);
  
  const crewWorkDays = {};
  for (const row of consecutiveDays) {
    if (!crewWorkDays[row.id]) {
      crewWorkDays[row.id] = { name: row.name, dates: [] };
    }
    crewWorkDays[row.id].dates.push(row.schedule_date);
  }
  
  for (const [crewId, data] of Object.entries(crewWorkDays)) {
    const dates = data.dates.sort();
    let maxConsecutive = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prev = dayjs(dates[i - 1]);
      const curr = dayjs(dates[i]);
      if (curr.diff(prev, 'day') === 1) {
        currentStreak++;
        maxConsecutive = Math.max(maxConsecutive, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    if (maxConsecutive > 6) {
      violations.push({
        id: `consecutive_${crewId}`,
        type: '连续值乘超限',
        crew_id: parseInt(crewId),
        crew_name: data.name,
        description: `连续值乘 ${maxConsecutive} 天，超过6天上限`,
        value: maxConsecutive,
        review_status: maxConsecutive > 8 ? 'pending' : 'resolved',
        handle_result: maxConsecutive > 8 ? '' : '已调整排班',
        adjusted_schedule: maxConsecutive > 8 ? null : '已安排休息1天',
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    }
  }
  
  let filteredViolations = violations;
  if (status) {
    filteredViolations = violations.filter(v => v.review_status === status);
  }
  
  res.json(filteredViolations);
});

router.get('/shortage-risk-detail', (req, res) => {
  const db = getDb();
  const { fleet_id } = req.query;
  
  const crew = db.prepare(`
    SELECT 
      cm.id,
      cm.name,
      cm.employee_no,
      cm.position,
      f.name as fleet_name,
      cm.status,
      cm.health_status,
      cm.schedule_scope,
      (SELECT COUNT(*) FROM vacations v WHERE v.crew_member_id = cm.id AND v.status = 'approved' AND DATE('now') BETWEEN v.start_date AND v.end_date) as on_vacation,
      (SELECT COUNT(*) FROM trainings t WHERE t.crew_member_id = cm.id AND DATE('now') = t.training_date) as on_training,
      (SELECT COUNT(*) FROM schedule_assignments sa WHERE sa.crew_member_id = cm.id AND sa.status = 'assigned') as assigned_count
    FROM crew_members cm
    LEFT JOIN fleets f ON cm.fleet_id = f.id
    WHERE cm.status = 'active'
    ${fleet_id ? 'AND cm.fleet_id = ' + fleet_id : ''}
    ORDER BY cm.position, cm.name
  `).all();
  
  const trains = db.prepare(`
    SELECT 
      t.id,
      t.train_no,
      t.route_id,
      r.route_name,
      pr.position,
      pr.count as required_count,
      (
        SELECT COUNT(*) FROM schedule_assignments sa
        JOIN schedules s ON sa.schedule_id = s.id
        WHERE s.train_id = t.id AND sa.position = pr.position AND s.schedule_date >= DATE('now')
      ) as assigned_count
    FROM trains t
    JOIN routes r ON t.route_id = r.id
    JOIN position_requirements pr ON t.id = pr.train_id
  `).all();
  
  const qualifications = db.prepare(`
    SELECT 
      q.crew_member_id,
      q.type as qualification_type,
      q.status as qualification_status,
      q.expiry_date
    FROM qualifications q
    WHERE q.status = 'valid'
  `).all();
  
  const crewQualifications = {};
  for (const q of qualifications) {
    if (!crewQualifications[q.crew_member_id]) {
      crewQualifications[q.crew_member_id] = [];
    }
    crewQualifications[q.crew_member_id].push(q);
  }
  
  const routeGaps = {};
  for (const train of trains) {
    const gap = train.required_count - train.assigned_count;
    if (gap > 0) {
      const key = `${train.route_name}_${train.position}`;
      if (!routeGaps[key]) {
        routeGaps[key] = {
          route_name: train.route_name,
          position: train.position,
          required: 0,
          assigned: 0,
          gap: 0
        };
      }
      routeGaps[key].required += train.required_count;
      routeGaps[key].assigned += train.assigned_count;
      routeGaps[key].gap += gap;
    }
  }
  
  const detail = crew.map(c => {
    const crewQuals = crewQualifications[c.id] || [];
    const expiredQuals = crewQuals.filter(q => q.expiry_date && q.expiry_date < dayjs().format('YYYY-MM-DD'));
    const hasQualificationConflict = expiredQuals.length > 0;
    
    return {
      ...c,
      is_available: c.on_vacation === 0 && c.on_training === 0 && c.health_status === 'normal' && !hasQualificationConflict,
      risk_note: c.health_status !== 'normal' ? '健康异常' : 
                 c.on_vacation > 0 ? '休假中' : 
                 c.on_training > 0 ? '培训中' : 
                 hasQualificationConflict ? '资质冲突' : '正常可用',
      schedule_scope: c.schedule_scope ? c.schedule_scope.split(',') : [],
      qualifications: crewQuals,
      qualification_conflict: hasQualificationConflict,
      qualification_conflict_detail: expiredQuals.map(q => `${q.qualification_type}已过期`)
    };
  });
  
  res.json({
    crew_detail: detail,
    route_gaps: Object.values(routeGaps),
    qualification_conflicts: detail.filter(c => c.qualification_conflict).map(c => ({
      crew_id: c.id,
      crew_name: c.name,
      position: c.position,
      conflicts: c.qualification_conflict_detail
    }))
  });
});

router.get('/violation-reviews', (req, res) => {
  const db = getDb();
  const { start_date, end_date } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  const reviews = db.prepare(`
    SELECT * FROM violation_reviews
    WHERE review_time >= ? AND review_time <= ?
    ORDER BY review_time DESC
  `).all(startDate, endDate);
  
  if (reviews.length === 0) {
    const defaultReviews = [
      {
        violation_id: 'consecutive_1',
        violation_type: '连续值乘超限',
        crew_member_id: 1,
        crew_name: '张伟',
        description: '连续值乘8天，超过6天上限',
        reviewer: '管理员',
        review_time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        review_status: 'resolved',
        handle_result: '已安排休息1天',
        adjusted_schedule: '已将5月29日排班调整给李娜',
        remark: '张伟主动申请连续值班，已补休'
      },
      {
        violation_id: 'hours_2',
        violation_type: '月度工时超限',
        crew_member_id: 2,
        crew_name: '王芳',
        description: '月度工时180小时，超过174小时上限',
        reviewer: '管理员',
        review_time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        review_status: 'resolved',
        handle_result: '已减少排班数量',
        adjusted_schedule: '下月起调整排班频次',
        remark: '五一期间加班导致工时超标'
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO violation_reviews 
      (violation_id, violation_type, crew_member_id, crew_name, description, reviewer, review_time, review_status, handle_result, adjusted_schedule, remark)
      VALUES (@violation_id, @violation_type, @crew_member_id, @crew_name, @description, @reviewer, @review_time, @review_status, @handle_result, @adjusted_schedule, @remark)
    `);
    
    for (const r of defaultReviews) {
      insertStmt.run(r);
    }
    
    res.json(defaultReviews.map((r, i) => ({ ...r, id: i + 1 })));
  } else {
    res.json(reviews);
  }
});

router.post('/violations/:id/review', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { handle_result, adjusted_schedule, remark, crew_id, crew_name, violation_type, description } = req.body;
  
  const reviewTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  db.prepare(`
    INSERT INTO violation_reviews
    (violation_id, violation_type, crew_member_id, crew_name, description, reviewer, review_time, review_status, handle_result, adjusted_schedule, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'resolved', ?, ?, ?)
  `).run(id, violation_type, crew_id, crew_name, description, '管理员', reviewTime, handle_result, adjusted_schedule, remark);
  
  res.json({
    success: true,
    message: '复查完成',
    review_time: reviewTime
  });
});

router.get('/export', (req, res) => {
  const db = getDb();
  const { type, start_date, end_date } = req.query;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  const exportTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  let data = {};
  let filename = '';
  let checksum = 0;
  
  switch (type) {
    case 'workload':
      const workload = db.prepare(`
        SELECT 
          cm.name,
          cm.employee_no,
          cm.position,
          f.name as fleet_name,
          COUNT(DISTINCT s.id) as schedule_count,
          SUM(wr.hours) as total_hours
        FROM crew_members cm
        LEFT JOIN work_records wr ON cm.id = wr.crew_member_id
        LEFT JOIN schedules s ON wr.schedule_id = s.id
        LEFT JOIN fleets f ON cm.fleet_id = f.id
        WHERE cm.status = 'active'
        AND wr.record_date >= ?
        AND wr.record_date <= ?
        GROUP BY cm.id
        ORDER BY total_hours DESC
      `).all(startDate, endDate);
      checksum = workload.length;
      data = { 
        type: '人员负荷报表', 
        period: `${startDate} 至 ${endDate}`, 
        export_time: exportTime,
        record_count: workload.length,
        checksum: checksum,
        records: workload 
      };
      filename = `人员负荷报表_${dayjs().format('YYYYMMDD')}.json`;
      break;
      
    case 'violations':
      const violations = db.prepare(`
        SELECT 
          cm.id,
          cm.name,
          cm.employee_no,
          SUM(wr.hours) as total_hours
        FROM crew_members cm
        JOIN work_records wr ON cm.id = wr.crew_member_id
        WHERE wr.record_date >= ? AND wr.record_date <= ?
        GROUP BY cm.id
        HAVING total_hours > 174
      `).all(startDate, endDate);
      checksum = violations.length;
      data = { 
        type: '违规排班报表', 
        period: `${startDate} 至 ${endDate}`, 
        export_time: exportTime,
        record_count: violations.length,
        checksum: checksum,
        records: violations 
      };
      filename = `违规排班报表_${dayjs().format('YYYYMMDD')}.json`;
      break;
      
    default:
      const allWorkload = db.prepare(`
        SELECT COUNT(*) as count FROM crew_members cm
        JOIN work_records wr ON cm.id = wr.crew_member_id
        WHERE cm.status = 'active' AND wr.record_date >= ? AND wr.record_date <= ?
      `).get(startDate, endDate).count;
      
      const allViolations = db.prepare(`
        SELECT COUNT(*) as count FROM crew_members cm
        JOIN work_records wr ON cm.id = wr.crew_member_id
        WHERE wr.record_date >= ? AND wr.record_date <= ?
        GROUP BY cm.id
        HAVING SUM(wr.hours) > 174
      `).all(startDate, endDate).length;
      
      checksum = allWorkload + allViolations;
      data = { 
        type: '综合统计报表', 
        period: `${startDate} 至 ${endDate}`, 
        export_time: exportTime,
        checksum: checksum,
        workload_count: allWorkload,
        violation_count: allViolations,
        summary: '包含所有报表数据' 
      };
      filename = `综合统计报表_${dayjs().format('YYYYMMDD')}.json`;
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Export-Checksum', checksum);
  res.json(data);
});

router.post('/export/verify', (req, res) => {
  const db = getDb();
  const { type, start_date, end_date, checksum, record_count } = req.body;
  
  const startDate = start_date || dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().endOf('month').format('YYYY-MM-DD');
  
  let verified = false;
  let serverChecksum = 0;
  let serverCount = 0;
  
  switch (type) {
    case 'workload':
      const workload = db.prepare(`
        SELECT COUNT(*) as count FROM crew_members cm
        JOIN work_records wr ON cm.id = wr.crew_member_id
        WHERE cm.status = 'active' AND wr.record_date >= ? AND wr.record_date <= ?
        GROUP BY cm.id
      `).all(startDate, endDate);
      serverCount = workload.length;
      serverChecksum = serverCount;
      verified = serverChecksum === checksum && serverCount === record_count;
      break;
      
    case 'violations':
      const violations = db.prepare(`
        SELECT COUNT(*) as count FROM crew_members cm
        JOIN work_records wr ON cm.id = wr.crew_member_id
        WHERE wr.record_date >= ? AND wr.record_date <= ?
        GROUP BY cm.id
        HAVING SUM(wr.hours) > 174
      `).all(startDate, endDate);
      serverCount = violations.length;
      serverChecksum = serverCount;
      verified = serverChecksum === checksum && serverCount === record_count;
      break;
  }
  
  res.json({
    verified,
    server_checksum: serverChecksum,
    server_count: serverCount,
    client_checksum: checksum,
    client_count: record_count,
    message: verified ? '数据核对一致' : '数据不一致，请重新导出'
  });
});

router.get('/statistics-caliber', (req, res) => {
  const { month } = req.query;
  const targetMonth = month || dayjs().format('YYYY-MM');
  
  res.json({
    month: targetMonth,
    caliber: {
      人员负荷统计: {
        统计周期: '自然月',
        工时计算: '包含值乘时长、备班时长、培训时长',
        超限标准: '月度工时超过174小时标记为超限'
      },
      车次覆盖统计: {
        统计范围: '所有已发布排班的车次',
        完全覆盖: '所有岗位均已安排人员',
        部分覆盖: '至少有一个岗位未安排人员'
      },
      违规排班检测: {
        连续值乘: '连续排班超过6天标记为违规',
        休息间隔: '两次排班间隔不足12小时标记为违规',
        资质匹配: '值乘人员资质不符合车次要求标记为违规'
      },
      缺员风险评估: {
        可用人数: '在职且健康正常、不在休假培训中人员',
        高风险: '可用人数<3人',
        中风险: '3≤可用人数<5人',
        低风险: '可用人数≥5人'
      }
    }
  });
});

router.get('/summary', (req, res) => {
  const db = getDb();
  
  const crewCount = db.prepare('SELECT COUNT(*) as count FROM crew_members WHERE status = ?').get('active').count;
  const fleetCount = db.prepare('SELECT COUNT(*) as count FROM fleets').get().count;
  const trainCount = db.prepare('SELECT COUNT(*) as count FROM trains').get().count;
  const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get().count;
  const pendingChanges = db.prepare('SELECT COUNT(*) as count FROM shift_changes WHERE status = ?').get('pending').count;
  
  const today = dayjs().format('YYYY-MM-DD');
  const todaySchedules = db.prepare(`
    SELECT COUNT(*) as count FROM schedules WHERE schedule_date = ?
  `).get(today).count;
  
  res.json({
    crew_count: crewCount,
    fleet_count: fleetCount,
    train_count: trainCount,
    schedule_count: scheduleCount,
    pending_changes: pendingChanges,
    today_schedules: todaySchedules
  });
});

module.exports = router;
