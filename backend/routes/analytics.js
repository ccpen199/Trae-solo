const db = require('../database');
const auth = require('../auth');

function escapeStr(str) {
  return String(str || '').replace(/'/g, "''");
}

function registerAnalyticsRoutes(app) {
  app.get('/api/analytics/dashboard', auth.requireAuth, auth.requireRole('agency_admin'), (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const totalUsers = db.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'")[0];
    const totalEnterprises = db.query("SELECT COUNT(*) as count FROM enterprises WHERE status = 'normal'")[0];
    const totalPolicies = db.query('SELECT COUNT(*) as count FROM policies WHERE is_active = 1')[0];
    
    const todayConsultations = db.query(`
      SELECT COUNT(*) as count FROM consulting_sessions WHERE DATE(created_at) = ?`, [today])[0];
    
    const pendingWorkflows = db.query(`
      SELECT COUNT(*) as count FROM workflow_instances WHERE status IN ('in_progress', 'pending_review')`)[0];
    
    const avgProcessingTime = db.query(`
      SELECT AVG(average_processing_time) as avg FROM performance_metrics WHERE metric_date >= ?`, [thirtyDaysAgo])[0];
    
    const avgSatisfaction = db.query(`
      SELECT AVG(overall_rating) as avg FROM satisfaction_surveys WHERE created_at >= ?`, [thirtyDaysAgo])[0];
    
    const monthlyTrend = db.query(`
      SELECT 
        DATE(created_at, 'start of month') as month,
        COUNT(*) as count
      FROM workflow_instances
      WHERE created_at >= ?
      GROUP BY DATE(created_at, 'start of month')
      ORDER BY month DESC
      LIMIT 6
    `, [thirtyDaysAgo]);
    
    const serviceDistribution = db.query(`
      SELECT 
        sc.service_name, COUNT(*) as count
      FROM workflow_instances wi
      INNER JOIN service_catalog sc ON wi.service_id = sc.id
      WHERE wi.created_at >= ?
      GROUP BY sc.service_name
      ORDER BY count DESC
      LIMIT 8
    `, [thirtyDaysAgo]);
    
    const regionDistribution = db.query(`
      SELECT 
        a.region, COUNT(*) as count
      FROM workflow_instances wi
      INNER JOIN users u ON wi.applicant_id = u.id
      LEFT JOIN agencies a ON u.id = a.user_id
      WHERE wi.created_at >= ?
      GROUP BY a.region
      ORDER BY count DESC
      LIMIT 10
    `, [thirtyDaysAgo]);
    
    res.json({
      ok: true,
      data: {
        overview: {
          total_users: totalUsers?.count || 0,
          total_enterprises: totalEnterprises?.count || 0,
          total_policies: totalPolicies?.count || 0,
          today_consultations: todayConsultations?.count || 0,
          pending_workflows: pendingWorkflows?.count || 0,
          avg_processing_time: Number(avgProcessingTime?.avg || 0).toFixed(1),
          avg_satisfaction: Number(avgSatisfaction?.avg || 0).toFixed(2)
        },
        monthly_trend: monthlyTrend,
        service_distribution: serviceDistribution,
        region_distribution: regionDistribution
      }
    });
  });

  app.get('/api/analytics/time-monitoring', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { start_date, end_date, service_id, agency_id, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT 
        pm.*, sc.service_name, a.agency_name, a.region
      FROM performance_metrics pm
      LEFT JOIN service_catalog sc ON pm.service_id = sc.id
      LEFT JOIN agencies a ON pm.agency_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      sql += ' AND pm.metric_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND pm.metric_date <= ?';
      params.push(end_date);
    }
    if (service_id) {
      sql += ' AND pm.service_id = ?';
      params.push(Number(service_id));
    }
    if (agency_id) {
      sql += ' AND pm.agency_id = ?';
      params.push(Number(agency_id));
    }
    
    sql += ' ORDER BY pm.metric_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const metrics = db.query(sql, params);
    
    const summary = db.query(`
      SELECT 
        AVG(on_time_completion_rate) as avg_on_time_rate,
        AVG(average_processing_time) as avg_processing_time,
        SUM(total_requests) as total_requests,
        SUM(completed_requests) as completed_requests
      FROM performance_metrics pm
      WHERE 1=1
    ` + (start_date ? ' AND pm.metric_date >= ?' : '') + (end_date ? ' AND pm.metric_date <= ?' : ''), 
      [start_date, end_date].filter(Boolean));
    
    res.json({
      ok: true,
      data: metrics,
      summary: {
        avg_on_time_rate: Number(summary[0]?.avg_on_time_rate || 0).toFixed(2),
        avg_processing_time: Number(summary[0]?.avg_processing_time || 0).toFixed(1),
        total_requests: summary[0]?.total_requests || 0,
        completed_requests: summary[0]?.completed_requests || 0
      },
      page: Number(page),
      page_size: Number(page_size)
    });
  });

  app.get('/api/analytics/workflow-timeline', auth.requireAuth, (req, res) => {
    const { workflow_instance_id } = req.query;
    
    if (workflow_instance_id) {
      const timeline = db.query(`
        SELECT wal.*, u.real_name as operator_name
        FROM workflow_audit_logs wal
        LEFT JOIN users u ON wal.operator_id = u.id
        WHERE wal.workflow_instance_id = ?
        ORDER BY wal.created_at ASC
      `, [Number(workflow_instance_id)]);
      
      return res.json({ ok: true, data: timeline });
    }
    
    const { status, priority, days = 30 } = req.query;
    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    let sql = `
      SELECT 
        wi.*, 
        bw.workflow_name, 
        sc.service_name,
        sc.processing_deadline,
        u.real_name as applicant_name,
        julianday('now') - julianday(wi.sla_deadline) as days_remaining
      FROM workflow_instances wi
      INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
      LEFT JOIN service_catalog sc ON wi.service_id = sc.id
      INNER JOIN users u ON wi.applicant_id = u.id
      WHERE wi.created_at >= ?
    `;
    const params = [dateLimit];
    
    if (status) {
      sql += ' AND wi.status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND wi.priority = ?';
      params.push(priority);
    }
    
    sql += ` ORDER BY 
      CASE wi.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      wi.sla_deadline ASC
      LIMIT 100`;
    
    const workflows = db.query(sql, params);
    
    res.json({ ok: true, data: workflows });
  });

  app.get('/api/analytics/sla-alerts', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { threshold_days = 3 } = req.query;
    
    const atRisk = db.query(`
      SELECT 
        wi.*,
        bw.workflow_name,
        sc.service_name,
        u.real_name as applicant_name,
        julianday(wi.sla_deadline) - julianday('now') as days_remaining
      FROM workflow_instances wi
      INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
      LEFT JOIN service_catalog sc ON wi.service_id = sc.id
      INNER JOIN users u ON wi.applicant_id = u.id
      WHERE wi.status IN ('in_progress', 'pending_review')
        AND julianday(wi.sla_deadline) - julianday('now') <= ?
      ORDER BY days_remaining ASC
      LIMIT 50
    `, [Number(threshold_days)]);
    
    const overdue = db.query(`
      SELECT 
        wi.*,
        bw.workflow_name,
        sc.service_name,
        u.real_name as applicant_name,
        julianday('now') - julianday(wi.sla_deadline) as days_overdue
      FROM workflow_instances wi
      INNER JOIN business_workflows bw ON wi.workflow_id = bw.id
      LEFT JOIN service_catalog sc ON wi.service_id = sc.id
      INNER JOIN users u ON wi.applicant_id = u.id
      WHERE wi.status IN ('in_progress', 'pending_review')
        AND wi.sla_deadline < datetime('now')
      ORDER BY wi.sla_deadline ASC
      LIMIT 50
    `);
    
    res.json({
      ok: true,
      data: {
        at_risk: atRisk.map(item => ({
          ...item,
          risk_level: item.days_remaining <= 1 ? 'critical' : item.days_remaining <= 3 ? 'high' : 'medium'
        })),
        overdue: overdue,
        summary: {
          at_risk_count: atRisk.length,
          overdue_count: overdue.length
        }
      }
    });
  });

  app.get('/api/analytics/satisfaction', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { start_date, end_date, service_id, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT 
        ss.*, 
        sc.service_name,
        u.real_name as user_name,
        u.user_type
      FROM satisfaction_surveys ss
      LEFT JOIN service_catalog sc ON ss.service_id = sc.id
      INNER JOIN users u ON ss.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      sql += ' AND ss.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND ss.created_at <= ?';
      params.push(end_date);
    }
    if (service_id) {
      sql += ' AND ss.service_id = ?';
      params.push(Number(service_id));
    }
    
    sql += ' ORDER BY ss.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const surveys = db.query(sql, params);
    
    const stats = db.query(`
      SELECT 
        AVG(overall_rating) as avg_overall,
        AVG(speed_rating) as avg_speed,
        AVG(attitude_rating) as avg_attitude,
        AVG(professionalism_rating) as avg_professionalism,
        AVG(convenience_rating) as avg_convenience,
        COUNT(*) as total_surveys
      FROM satisfaction_surveys ss
      WHERE 1=1
    ` + (start_date ? ' AND ss.created_at >= ?' : '') + (end_date ? ' AND ss.created_at <= ?' : ''),
      [start_date, end_date].filter(Boolean));
    
    const distribution = db.query(`
      SELECT 
        overall_rating, COUNT(*) as count
      FROM satisfaction_surveys
      WHERE 1=1
    ` + (start_date ? ' AND created_at >= ?' : '') + (end_date ? ' AND created_at <= ?' : '') +
      ' GROUP BY overall_rating ORDER BY overall_rating',
      [start_date, end_date].filter(Boolean));
    
    res.json({
      ok: true,
      data: surveys,
      stats: {
        avg_overall: Number(stats[0]?.avg_overall || 0).toFixed(2),
        avg_speed: Number(stats[0]?.avg_speed || 0).toFixed(2),
        avg_attitude: Number(stats[0]?.avg_attitude || 0).toFixed(2),
        avg_professionalism: Number(stats[0]?.avg_professionalism || 0).toFixed(2),
        avg_convenience: Number(stats[0]?.avg_convenience || 0).toFixed(2),
        total_surveys: stats[0]?.total_surveys || 0
      },
      rating_distribution: distribution,
      page: Number(page),
      page_size: Number(page_size)
    });
  });

  app.post('/api/satisfaction/submit', auth.requireAuth, async (req, res) => {
    const body = await req.body;
    const { workflow_instance_id, service_id, overall_rating, speed_rating, attitude_rating, professionalism_rating, convenience_rating, comment, suggestions } = body;
    
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      return res.json({ ok: false, message: '请选择有效的总体评价（1-5星）' });
    }
    
    db.execute(`
      INSERT INTO satisfaction_surveys 
      (workflow_instance_id, service_id, user_id, overall_rating, speed_rating, attitude_rating, professionalism_rating, convenience_rating, comment, suggestions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      workflow_instance_id ? Number(workflow_instance_id) : null,
      service_id ? Number(service_id) : null,
      req.session.userId,
      Number(overall_rating),
      speed_rating ? Number(speed_rating) : null,
      attitude_rating ? Number(attitude_rating) : null,
      professionalism_rating ? Number(professionalism_rating) : null,
      convenience_rating ? Number(convenience_rating) : null,
      comment ? escapeStr(comment) : null,
      suggestions ? escapeStr(suggestions) : null
    ]);
    
    const surveyId = db.getLastInsertId();
    
    if (service_id) {
      const today = new Date().toISOString().split('T')[0];
      db.execute(`
        INSERT OR REPLACE INTO performance_metrics 
        (metric_date, service_id, total_surveys, average_satisfaction)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(metric_date, service_id) DO UPDATE SET
          total_surveys = total_surveys + 1,
          average_satisfaction = (average_satisfaction * (total_surveys - 1) + ?) / total_surveys
      `, [today, Number(service_id), Number(overall_rating), Number(overall_rating)]);
    }
    
    res.json({ ok: true, message: '评价提交成功', data: { survey_id: surveyId } });
  });

  app.get('/api/analytics/heatmap', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { time_period, service_id } = req.query;
    
    let sql = `
      SELECT 
        sgh.*,
        sc.service_name
      FROM service_gap_heatmap sgh
      LEFT JOIN service_catalog sc ON sgh.service_id = sc.id
      WHERE 1=1
    `;
    const params = [];
    
    if (time_period) {
      sql += ' AND sgh.time_period = ?';
      params.push(time_period);
    }
    if (service_id) {
      sql += ' AND sgh.service_id = ?';
      params.push(Number(service_id));
    }
    
    sql += ' ORDER BY sgh.gap_severity DESC LIMIT 100';
    
    const heatmapData = db.query(sql, params);
    
    const severityStats = db.query(`
      SELECT 
        CASE 
          WHEN gap_severity >= 0.8 THEN 'critical'
          WHEN gap_severity >= 0.5 THEN 'high'
          WHEN gap_severity >= 0.3 THEN 'medium'
          ELSE 'low'
        END as severity_level,
        COUNT(*) as count
      FROM service_gap_heatmap
      WHERE 1=1
    ` + (time_period ? ' AND time_period = ?' : '') + (service_id ? ' AND service_id = ?' : '') +
      ' GROUP BY severity_level',
      [time_period, service_id].filter(Boolean));
    
    const topGaps = db.query(`
      SELECT 
        region_name,
        SUM(gap_count) as total_gap,
        AVG(gap_severity) as avg_severity
      FROM service_gap_heatmap
      WHERE 1=1
    ` + (time_period ? ' AND time_period = ?' : '') + (service_id ? ' AND service_id = ?' : '') +
      ' GROUP BY region_name ORDER BY total_gap DESC LIMIT 10',
      [time_period, service_id].filter(Boolean));
    
    res.json({
      ok: true,
      data: {
        heatmap: heatmapData.map(item => ({
          ...item,
          severity_level: item.gap_severity >= 0.8 ? 'critical' : 
                         item.gap_severity >= 0.5 ? 'high' :
                         item.gap_severity >= 0.3 ? 'medium' : 'low'
        })),
        severity_stats: severityStats,
        top_gaps: topGaps
      }
    });
  });

  app.get('/api/analytics/regional-stats', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { region, start_date, end_date } = req.query;
    
    const regionStats = db.query(`
      SELECT 
        a.region,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.user_type = 'personal' THEN u.id END) as personal_count,
        COUNT(DISTINCT CASE WHEN u.user_type = 'enterprise' THEN u.id END) as enterprise_count,
        COUNT(wi.id) as business_count,
        AVG(pm.on_time_completion_rate) as avg_on_time_rate
      FROM agencies a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN workflow_instances wi ON u.id = wi.applicant_id
      LEFT JOIN performance_metrics pm ON a.id = pm.agency_id
      WHERE 1=1
    ` + (region ? ' AND a.region LIKE ?' : '') +
      ' GROUP BY a.region ORDER BY business_count DESC',
      region ? [`%${region}%`] : []);
    
    const agencyRanking = db.query(`
      SELECT 
        a.agency_name,
        a.region,
        a.agency_level,
        pm.total_requests,
        pm.completed_requests,
        pm.on_time_completion_rate,
        pm.average_satisfaction
      FROM agencies a
      INNER JOIN performance_metrics pm ON a.id = pm.agency_id
      WHERE 1=1
    ` + (start_date ? ' AND pm.metric_date >= ?' : '') + (end_date ? ' AND pm.metric_date <= ?' : '') +
      ' ORDER BY pm.average_satisfaction DESC, pm.on_time_completion_rate DESC LIMIT 20',
      [start_date, end_date].filter(Boolean));
    
    res.json({
      ok: true,
      data: {
        region_stats: regionStats,
        agency_ranking: agencyRanking
      }
    });
  });

  app.get('/api/audit-logs', auth.requireAuth, auth.requirePermission('agency.statistics.view'), (req, res) => {
    const { user_id, module, action, start_date, end_date, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT 
        al.*,
        u.real_name as user_name,
        u.user_type
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (user_id) {
      sql += ' AND al.user_id = ?';
      params.push(Number(user_id));
    }
    if (module) {
      sql += ' AND al.module = ?';
      params.push(module);
    }
    if (action) {
      sql += ' AND al.action LIKE ?';
      params.push(`%${action}%`);
    }
    if (start_date) {
      sql += ' AND al.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND al.created_at <= ?';
      params.push(end_date);
    }
    
    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const logs = db.query(sql, params);
    
    const moduleStats = db.query(`
      SELECT module, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY module
      ORDER BY count DESC
    `);
    
    res.json({
      ok: true,
      data: logs,
      module_stats: moduleStats,
      page: Number(page),
      page_size: Number(page_size)
    });
  });

  app.get('/api/notifications', auth.requireAuth, (req, res) => {
    const { is_read, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    const params = [req.session.userId];
    
    if (is_read !== undefined) {
      sql += ' AND is_read = ?';
      params.push(is_read === '1' ? 1 : 0);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const notifications = db.query(sql, params);
    
    const unreadCount = db.query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `, [req.session.userId])[0];
    
    res.json({
      ok: true,
      data: notifications,
      unread_count: unreadCount?.count || 0,
      page: Number(page),
      page_size: Number(page_size)
    });
  });

  app.post('/api/notifications/:id/read', auth.requireAuth, (req, res) => {
    const notificationId = Number(req.params.id);
    
    db.execute(`
      UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id = ? AND user_id = ?
    `, [notificationId, req.session.userId]);
    
    res.json({ ok: true, message: '标记已读成功' });
  });

  app.post('/api/notifications/read-all', auth.requireAuth, (req, res) => {
    db.execute(`
      UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0
    `, [req.session.userId]);
    
    res.json({ ok: true, message: '全部标记已读成功' });
  });

  app.get('/api/user/profile', auth.requireAuth, (req, res) => {
    const user = db.query(`
      SELECT u.*, 
             pp.gender, pp.birth_date, pp.education, pp.employment_status,
             pp.household_address, pp.residential_address
      FROM users u
      LEFT JOIN personal_profiles pp ON u.id = pp.user_id
      WHERE u.id = ?
      LIMIT 1
    `, [req.session.userId]);
    
    if (user.length === 0) {
      return res.json({ ok: false, message: '用户不存在' });
    }
    
    const roles = db.query(`
      SELECT r.* FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `, [req.session.userId]);
    
    const permissions = db.query(`
      SELECT DISTINCT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `, [req.session.userId]);
    
    res.json({
      ok: true,
      data: {
        ...user[0],
        roles: roles.map(r => r.code),
        permissions: permissions.map(p => p.code),
        role_names: roles.map(r => r.name)
      }
    });
  });

  app.post('/api/user/logout', auth.requireAuth, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      auth.destroySession(token);
    }
    
    res.json({ ok: true, message: '退出登录成功' });
  });

  app.post('/api/user/login', async (req, res) => {
    const body = await req.body;
    const { username, password } = body;
    
    if (!username || !password) {
      return res.json({ ok: false, message: '请输入用户名和密码' });
    }
    
    const users = db.query(`
      SELECT * FROM users WHERE username = ? AND status = 'active' LIMIT 1
    `, [username]);
    
    if (users.length === 0) {
      return res.json({ ok: false, message: '用户名或密码错误' });
    }
    
    const user = users[0];
    const passwordHash = auth.hashPassword(password);
    
    if (passwordHash !== user.password_hash) {
      return res.json({ ok: false, message: '用户名或密码错误' });
    }
    
    const session = auth.createSession(user);
    
    db.execute(`
      UPDATE users SET last_login_at = datetime('now') WHERE id = ?
    `, [user.id]);
    
    db.execute(`
      INSERT INTO audit_logs (user_id, user_type, action, module)
      VALUES (?, ?, 'login', 'auth')
    `, [user.id, user.user_type]);
    
    const profileData = {};
    if (user.user_type === 'personal') {
      const profile = db.query('SELECT * FROM personal_profiles WHERE user_id = ?', [user.id]);
      if (profile.length > 0) profileData.profile = profile[0];
    } else if (user.user_type === 'enterprise') {
      const enterprise = db.query('SELECT * FROM enterprises WHERE user_id = ?', [user.id]);
      if (enterprise.length > 0) profileData.enterprise = enterprise[0];
    } else if (user.user_type === 'agency') {
      const agency = db.query('SELECT * FROM agencies WHERE user_id = ?', [user.id]);
      if (agency.length > 0) profileData.agency = agency[0];
    }
    
    res.json({
      ok: true,
      message: '登录成功',
      data: {
        token: session.token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          user_type: user.user_type,
          roles: session.roles,
          permissions: session.permissions,
          ...profileData
        }
      }
    });
  });
}

module.exports = { registerAnalyticsRoutes };
