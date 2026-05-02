const { all } = require('../config/database');

class ReportService {
  async getTaskStatistics(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const stats = {};
    
    stats.totalTasks = await this.getSingleValue(
      `SELECT COUNT(*) as count FROM tasks WHERE 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    stats.byStatus = await all(
      `SELECT status, COUNT(*) as count 
       FROM tasks 
       WHERE 1=1 ${baseFilters.sql}
       GROUP BY status`,
      baseFilters.params
    );

    stats.byType = await all(
      `SELECT task_type, COUNT(*) as count 
       FROM tasks 
       WHERE 1=1 ${baseFilters.sql}
       GROUP BY task_type`,
      baseFilters.params
    );

    return stats;
  }

  async getProgressStatistics(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const stats = {};
    
    stats.totalProgresses = await this.getSingleValue(
      `SELECT COUNT(*) as count FROM progresses WHERE 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    stats.completionRate = await all(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as completion_rate
       FROM progresses 
       WHERE 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    stats.avgProgress = await this.getSingleValue(
      `SELECT AVG(current_count * 100.0 / target_count) as avg_progress
       FROM progresses 
       WHERE target_count > 0 AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    return stats;
  }

  async getRewardStatistics(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const stats = {};
    
    stats.totalRewards = await this.getSingleValue(
      `SELECT COUNT(*) as count FROM user_rewards WHERE 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    stats.byType = await all(
      `SELECT r.reward_type, 
              COUNT(*) as count,
              SUM(ur.quantity) as total_quantity
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_uuid = r.reward_uuid
       WHERE 1=1 ${baseFilters.sql}
       GROUP BY r.reward_type`,
      baseFilters.params
    );

    stats.bySource = await all(
      `SELECT source_type, COUNT(*) as count, SUM(quantity) as total_quantity
       FROM user_rewards 
       WHERE 1=1 ${baseFilters.sql}
       GROUP BY source_type`,
      baseFilters.params
    );

    return stats;
  }

  async getConversionFunnel(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const funnel = [];
    
    const triggered = await this.getSingleValue(
      `SELECT COUNT(DISTINCT p.progress_uuid) as count
       FROM progresses p
       JOIN tasks t ON p.task_uuid = t.task_uuid
       WHERE p.last_triggered_at IS NOT NULL AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );
    funnel.push({ stage: 'triggered', count: triggered, label: '已触发' });

    const inProgress = await this.getSingleValue(
      `SELECT COUNT(DISTINCT p.progress_uuid) as count
       FROM progresses p
       JOIN tasks t ON p.task_uuid = t.task_uuid
       WHERE p.status = 'pending' AND p.current_count > 0 AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );
    funnel.push({ stage: 'in_progress', count: inProgress, label: '进行中' });

    const completed = await this.getSingleValue(
      `SELECT COUNT(DISTINCT p.progress_uuid) as count
       FROM progresses p
       JOIN tasks t ON p.task_uuid = t.task_uuid
       WHERE p.status = 'completed' AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );
    funnel.push({ stage: 'completed', count: completed, label: '已完成' });

    const rewarded = await this.getSingleValue(
      `SELECT COUNT(DISTINCT ur.user_reward_uuid) as count
       FROM user_rewards ur
       WHERE ur.source_type = 'task' AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );
    funnel.push({ stage: 'rewarded', count: rewarded, label: '已奖励' });

    return funnel;
  }

  async getProcessingTimeAnalysis(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const analysis = {};
    
    analysis.avgProcessingTime = await all(
      `SELECT 
         t.task_name,
         t.task_type,
         AVG(JULIANDAY(p.completed_at) - JULIANDAY(p.created_at)) * 24 * 60 as avg_minutes
       FROM progresses p
       JOIN tasks t ON p.task_uuid = t.task_uuid
       WHERE p.completed_at IS NOT NULL AND 1=1 ${baseFilters.sql}
       GROUP BY t.task_uuid, t.task_name, t.task_type
       ORDER BY avg_minutes DESC`,
      baseFilters.params
    );

    analysis.processingTimeDistribution = await all(
      `SELECT 
         CASE 
           WHEN (JULIANDAY(p.completed_at) - JULIANDAY(p.created_at)) * 24 < 1 THEN '< 1小时'
           WHEN (JULIANDAY(p.completed_at) - JULIANDAY(p.created_at)) * 24 < 24 THEN '1-24小时'
           WHEN (JULIANDAY(p.completed_at) - JULIANDAY(p.created_at)) * 24 < 168 THEN '1-7天'
           ELSE '> 7天'
         END as time_bucket,
         COUNT(*) as count
       FROM progresses p
       WHERE p.completed_at IS NOT NULL AND 1=1 ${baseFilters.sql}
       GROUP BY time_bucket`,
      baseFilters.params
    );

    return analysis;
  }

  async getExceptionAnalysis(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const analysis = {};
    
    const total = await this.getSingleValue(
      `SELECT COUNT(*) as count FROM progresses WHERE 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    const exceptions = await all(
      `SELECT 
         'stuck_in_progress' as exception_type,
         COUNT(*) as count,
         '进度长时间未更新' as description
       FROM progresses 
       WHERE status = 'pending' 
         AND last_triggered_at < DATE('now', '-7 days')
         AND 1=1 ${baseFilters.sql}
       
       UNION ALL
       
       SELECT 
         'completed_no_reward' as exception_type,
         COUNT(*) as count,
         '已完成但未发放奖励' as description
       FROM progresses p
       LEFT JOIN user_rewards ur ON p.task_uuid = ur.source_uuid AND p.user_uuid = ur.user_uuid
       WHERE p.status = 'completed' 
         AND ur.user_reward_uuid IS NULL
         AND 1=1 ${baseFilters.sql}`,
      baseFilters.params
    );

    analysis.totalExceptions = exceptions.reduce((sum, e) => sum + e.count, 0);
    analysis.exceptionRate = total > 0 ? (analysis.totalExceptions / total * 100) : 0;
    analysis.exceptions = exceptions;

    return analysis;
  }

  async getRevenueAnalysis(filters = {}) {
    const baseFilters = this.buildFilters(filters);
    
    const analysis = {};
    
    analysis.rewardValueByType = await all(
      `SELECT 
         r.reward_type,
         r.reward_value,
         SUM(ur.quantity) as total_quantity,
         SUM(ur.quantity * CAST(r.reward_value AS INTEGER)) as total_value
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_uuid = r.reward_uuid
       WHERE r.reward_type IN ('currency', 'premium_currency') 
         AND 1=1 ${baseFilters.sql}
       GROUP BY r.reward_type, r.reward_value`,
      baseFilters.params
    );

    analysis.rewardDistribution = await all(
      `SELECT 
         DATE(ur.created_at) as date,
         COUNT(*) as rewards_granted,
         SUM(CASE WHEN r.reward_type = 'currency' THEN ur.quantity * CAST(r.reward_value AS INTEGER) ELSE 0 END) as currency_value,
         SUM(CASE WHEN r.reward_type = 'premium_currency' THEN ur.quantity * CAST(r.reward_value AS INTEGER) ELSE 0 END) as premium_value
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_uuid = r.reward_uuid
       WHERE 1=1 ${baseFilters.sql}
       GROUP BY DATE(ur.created_at)
       ORDER BY date DESC`,
      baseFilters.params
    );

    return analysis;
  }

  async getDetailedAuditTrail(targetType, targetUuid) {
    return await all(
      `SELECT 
         al.*,
         u.nickname as operator_name,
         r.role_name as operator_role_name
       FROM audit_logs al
       LEFT JOIN users u ON al.operator_uuid = u.user_uuid
       LEFT JOIN roles r ON al.operator_role = r.role_code
       WHERE al.target_type = ? AND al.target_uuid = ?
       ORDER BY al.created_at DESC`,
      [targetType, targetUuid]
    );
  }

  async getCrossReferenceData(sourceType, sourceUuid) {
    let data = {};
    
    if (sourceType === 'task') {
      data.task = await this.getSingleValue(
        'SELECT * FROM tasks WHERE task_uuid = ?',
        [sourceUuid]
      );
      
      data.progresses = await all(
        `SELECT p.*, u.nickname as user_name
         FROM progresses p
         JOIN users u ON p.user_uuid = u.user_uuid
         WHERE p.task_uuid = ?
         ORDER BY p.created_at DESC`,
        [sourceUuid]
      );
      
      data.rewards = await all(
        `SELECT ur.*, r.reward_name, r.reward_type, u.nickname as user_name
         FROM user_rewards ur
         JOIN rewards r ON ur.reward_uuid = r.reward_uuid
         JOIN users u ON ur.user_uuid = u.user_uuid
         WHERE ur.source_type = 'task' AND ur.source_uuid = ?
         ORDER BY ur.created_at DESC`,
        [sourceUuid]
      );
      
      data.statusHistory = await all(
        `SELECT tsh.*, u.nickname as operator_name
         FROM task_status_history tsh
         LEFT JOIN users u ON tsh.operator_uuid = u.user_uuid
         WHERE tsh.task_uuid = ?
         ORDER BY tsh.created_at DESC`,
        [sourceUuid]
      );
      
      data.auditLogs = await this.getDetailedAuditTrail('task', sourceUuid);
    }
    
    if (sourceType === 'progress') {
      data.progress = await this.getSingleValue(
        `SELECT p.*, t.task_name, u.nickname as user_name
         FROM progresses p
         JOIN tasks t ON p.task_uuid = t.task_uuid
         JOIN users u ON p.user_uuid = u.user_uuid
         WHERE p.progress_uuid = ?`,
        [sourceUuid]
      );
    }
    
    if (sourceType === 'user_reward') {
      data.userReward = await this.getSingleValue(
        `SELECT ur.*, r.reward_name, r.reward_type, u.nickname as user_name
         FROM user_rewards ur
         JOIN rewards r ON ur.reward_uuid = r.reward_uuid
         JOIN users u ON ur.user_uuid = u.user_uuid
         WHERE ur.user_reward_uuid = ?`,
        [sourceUuid]
      );
    }
    
    return data;
  }

  buildFilters(filters) {
    let sql = '';
    let params = [];

    if (filters.start_date) {
      sql += ' AND date(created_at) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ' AND date(created_at) <= ?';
      params.push(filters.end_date);
    }

    if (filters.user_uuid) {
      sql += ' AND user_uuid = ?';
      params.push(filters.user_uuid);
    }

    return { sql, params };
  }

  async getSingleValue(sql, params) {
    const results = await all(sql, params);
    return results[0]?.count || results[0]?.avg_progress || 0;
  }
}

module.exports = { ReportService };
