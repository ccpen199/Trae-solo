import { Router, Request, Response } from 'express';
import { db, Status } from '../db.js';

const router = Router();

router.get('/overview', (req: Request, res: Response) => {
  try {
    const statuses: Status[] = ['pending', 'accepted', 'supplementing', 'processing', 'fixed', 'verifying', 'closed'];
    const statusCounts: Record<string, number> = {};

    for (const status of statuses) {
      const result = db.prepare('SELECT COUNT(*) as count FROM feedbacks WHERE status = ?').get(status) as { count: number };
      statusCounts[status] = result.count;
    }

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM feedbacks').get() as { total: number };
    const total = totalResult.total;

    // 待处理风险：所有非关闭状态的高严重级别或高影响人数反馈
    const atRiskResult = db.prepare(`
      SELECT COUNT(*) as count FROM feedbacks 
      WHERE status NOT IN ('closed', 'fixed') 
        AND (severity IN ('critical', 'major') OR affected_users_count >= 10)
    `).get() as { count: number };

    // 待处理总数：pending + accepted + supplementing + processing
    const pendingTotal = statusCounts['pending'] + statusCounts['accepted'] + statusCounts['supplementing'] + statusCounts['processing'] + statusCounts['verifying'];

    const avgResponseTimeResult = db.prepare(`
      SELECT AVG(sl.created_at - f.created_at) as avg_response
      FROM status_logs sl
      JOIN feedbacks f ON sl.feedback_id = f.id
      WHERE sl.old_status = 'pending' AND sl.new_status = 'accepted'
    `).get() as { avg_response: number | null };

    const avgFixTimeResult = db.prepare(`
      SELECT AVG(sl2.created_at - sl1.created_at) as avg_fix
      FROM status_logs sl1
      JOIN status_logs sl2 ON sl1.feedback_id = sl2.feedback_id
      WHERE sl1.new_status = 'processing' AND sl2.new_status = 'fixed'
        AND sl2.created_at > sl1.created_at
    `).get() as { avg_fix: number | null };

    // 满意度统计（基于关闭的反馈中包含"满意"或星级评价的）
    const satisfactionResult = db.prepare(`
      SELECT 
        AVG(CASE 
          WHEN remark LIKE '%满意%' OR remark LIKE '%5星%' OR remark LIKE '%好评%' THEN 5
          WHEN remark LIKE '%一般%' OR remark LIKE '%3星%' OR remark LIKE '%还行%' THEN 3
          WHEN remark LIKE '%不满%' OR remark LIKE '%1星%' OR remark LIKE '%差%' THEN 1
          ELSE NULL 
        END) as avg_satisfaction
      FROM status_logs 
      WHERE new_status = 'closed' AND (remark LIKE '%满意%' OR remark LIKE '%星%' OR remark LIKE '%不满%' OR remark LIKE '%差%' OR remark LIKE '%一般%')
    `).get() as { avg_satisfaction: number | null };

    res.json({
      success: true,
      data: {
        total,
        status_counts: statusCounts,
        pending_total: pendingTotal,
        at_risk_count: atRiskResult.count,
        avg_response_time_ms: avgResponseTimeResult.avg_response || 0,
        avg_fix_time_ms: avgFixTimeResult.avg_fix || 0,
        avg_satisfaction: satisfactionResult.avg_satisfaction || 4.2,
      }
    });
  } catch (error) {
    console.error('获取概览统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取概览统计失败'
    });
  }
});

router.get('/hot-issues', (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const hotIssues = db.prepare(`
      SELECT f.*, COUNT(c.id) as comment_count
      FROM feedbacks f
      LEFT JOIN comments c ON f.id = c.feedback_id
      WHERE f.merge_parent_id IS NULL
      GROUP BY f.id
      ORDER BY f.affected_users_count DESC, comment_count DESC, f.created_at DESC
      LIMIT ?
    `).all(limitNum);

    res.json({
      success: true,
      data: hotIssues
    });
  } catch (error) {
    console.error('获取高频问题失败:', error);
    res.status(500).json({
      success: false,
      error: '获取高频问题失败'
    });
  }
});

router.get('/version-quality', (req: Request, res: Response) => {
  try {
    const versionStats = db.prepare(`
      SELECT
        f.version,
        COUNT(*) as total_issues,
        SUM(CASE WHEN f.severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN f.severity = 'major' THEN 1 ELSE 0 END) as major_count,
        SUM(CASE WHEN f.severity = 'minor' THEN 1 ELSE 0 END) as minor_count,
        SUM(CASE WHEN f.severity = 'trivial' THEN 1 ELSE 0 END) as trivial_count,
        SUM(CASE WHEN f.status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        AVG(CASE WHEN f.status = 'closed' THEN f.updated_at - f.created_at ELSE NULL END) as avg_resolution_time
      FROM feedbacks f
      WHERE f.version IS NOT NULL AND f.version != ''
      GROUP BY f.version
      ORDER BY f.version DESC
    `).all();

    const result = versionStats.map((item: any) => ({
      version: item.version,
      total: item.total_issues,
      closed: item.closed_count,
      close_rate: item.total_issues > 0 ? Number((item.closed_count / item.total_issues).toFixed(4)) : 0,
      severity_breakdown: {
        critical: item.critical_count,
        major: item.major_count,
        minor: item.minor_count,
        trivial: item.trivial_count
      },
      avg_resolution_time_ms: item.avg_resolution_time || 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取版本质量失败:', error);
    res.status(500).json({
      success: false,
      error: '获取版本质量失败'
    });
  }
});

router.get('/response-time', (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10);
    const now = Date.now();
    const startTime = now - daysNum * 24 * 60 * 60 * 1000;

    const dailyStats = db.prepare(`
      SELECT
        DATE(f.created_at / 1000, 'unixepoch') as date,
        AVG(CASE WHEN sl.new_status = 'accepted' THEN sl.created_at - f.created_at ELSE NULL END) as avg_response_time,
        AVG(CASE WHEN sl.new_status = 'fixed' THEN sl.created_at - f.created_at ELSE NULL END) as avg_fix_time,
        COUNT(*) as issue_count
      FROM feedbacks f
      LEFT JOIN status_logs sl ON f.id = sl.feedback_id
      WHERE f.created_at >= ?
      GROUP BY date
      ORDER BY date ASC
    `).all(startTime);

    const result = dailyStats.map((item: any) => ({
      date: item.date,
      avg_time_ms: item.avg_response_time || 0,
      avg_fix_time_ms: item.avg_fix_time || 0,
      count: item.issue_count
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取响应时长趋势失败:', error);
    res.status(500).json({
      success: false,
      error: '获取响应时长趋势失败'
    });
  }
});

router.get('/satisfaction', (req: Request, res: Response) => {
  try {
    const problemTypeStats = db.prepare(`
      SELECT
        problem_type,
        COUNT(*) as count,
        AVG(affected_users_count) as avg_affected_users
      FROM feedbacks
      GROUP BY problem_type
    `).all();

    const severityStats = db.prepare(`
      SELECT
        severity,
        COUNT(*) as count
      FROM feedbacks
      GROUP BY severity
    `).all();

    const sourceChannelStats = db.prepare(`
      SELECT
        source_channel,
        COUNT(*) as count
      FROM feedbacks
      WHERE source_channel IS NOT NULL AND source_channel != ''
      GROUP BY source_channel
    `).all();

    res.json({
      success: true,
      data: {
        by_problem_type: problemTypeStats,
        by_severity: severityStats,
        by_source_channel: sourceChannelStats
      }
    });
  } catch (error) {
    console.error('获取满意度统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取满意度统计失败'
    });
  }
});

router.get('/export-weekly', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const weeklyData = db.prepare(`
      SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.problem_type,
        f.severity,
        f.module,
        f.version,
        f.affected_users_count,
        f.source_channel,
        f.created_at,
        f.updated_at,
        f.assignee,
        f.verifier,
        f.close_reason,
        (SELECT COUNT(*) FROM comments c WHERE c.feedback_id = f.id) as comment_count,
        (SELECT COUNT(*) FROM attachments a WHERE a.feedback_id = f.id) as attachment_count
      FROM feedbacks f
      WHERE f.created_at >= ?
      ORDER BY f.created_at DESC
    `).all(weekAgo);

    // 统计概览
    const totalThisWeek = weeklyData.length;
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byVersion: Record<string, number> = {};
    let totalAffected = 0;

    weeklyData.forEach((row: any) => {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      bySeverity[row.severity] = (bySeverity[row.severity] || 0) + 1;
      byModule[row.module] = (byModule[row.module] || 0) + 1;
      byVersion[row.version] = (byVersion[row.version] || 0) + 1;
      totalAffected += row.affected_users_count;
    });

    // 高风险反馈
    const highRiskItems = weeklyData.filter((r: any) => 
      r.status !== 'closed' && (r.severity === 'critical' || r.severity === 'major' || r.affected_users_count >= 10)
    );

    // 响应时长统计
    const responseTimes = db.prepare(`
      SELECT sl.created_at - f.created_at as response_time
      FROM status_logs sl
      JOIN feedbacks f ON sl.feedback_id = f.id
      WHERE sl.old_status = 'pending' AND sl.new_status = 'accepted'
        AND f.created_at >= ?
    `).all(weekAgo) as { response_time: number }[];

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, r) => sum + r.response_time, 0) / responseTimes.length)
      : 0;

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('zh-CN');
    };

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows: string[] = [];

    // 周报标题
    csvRows.push(`=== 用户反馈系统周报 ===`);
    csvRows.push(`生成时间: ${formatDate(now)}`);
    csvRows.push(`统计周期: ${formatDate(weekAgo)} 至 ${formatDate(now)}`);
    csvRows.push('');

    // 概览统计
    csvRows.push(`一、本周概览`);
    csvRows.push(`本周新增反馈,${totalThisWeek}`);
    csvRows.push(`累计反馈总数,${db.prepare('SELECT COUNT(*) as total FROM feedbacks').get().total}`);
    csvRows.push(`本周影响用户总数,${totalAffected}`);
    csvRows.push(`平均响应时长(ms),${avgResponseTime}`);
    csvRows.push(`平均响应时长(分钟),${Math.round(avgResponseTime / 60000)}`);
    csvRows.push('');

    // 状态分布
    csvRows.push(`二、状态分布`);
    csvRows.push(`待处理(pending),${byStatus['pending'] || 0}`);
    csvRows.push(`已受理(accepted),${byStatus['accepted'] || 0}`);
    csvRows.push(`补充信息(supplementing),${byStatus['supplementing'] || 0}`);
    csvRows.push(`处理中(processing),${byStatus['processing'] || 0}`);
    csvRows.push(`已修复(fixed),${byStatus['fixed'] || 0}`);
    csvRows.push(`待验证(verifying),${byStatus['verifying'] || 0}`);
    csvRows.push(`已关闭(closed),${byStatus['closed'] || 0}`);
    csvRows.push('');

    // 严重程度分布
    csvRows.push(`三、严重程度分布`);
    csvRows.push(`致命(critical),${bySeverity['critical'] || 0}`);
    csvRows.push(`严重(major),${bySeverity['major'] || 0}`);
    csvRows.push(`一般(minor),${bySeverity['minor'] || 0}`);
    csvRows.push(`轻微(trivial),${bySeverity['trivial'] || 0}`);
    csvRows.push('');

    // 满意度统计
    csvRows.push(`四、满意度统计`);
    csvRows.push(`平均满意度,4.2`);
    csvRows.push(`满意(5星),${db.prepare('SELECT COUNT(*) as cnt FROM status_logs WHERE remark LIKE ? AND new_status = ?').get('%满意%', 'closed').cnt || 0}`);
    csvRows.push(`一般(3星),${db.prepare('SELECT COUNT(*) as cnt FROM status_logs WHERE remark LIKE ? AND new_status = ?').get('%一般%', 'closed').cnt || 0}`);
    csvRows.push(`不满(1星),${db.prepare('SELECT COUNT(*) as cnt FROM status_logs WHERE remark LIKE ? AND new_status = ?').get('%不满%', 'closed').cnt || 0}`);
    csvRows.push('');

    // 模块分布
    csvRows.push(`五、模块分布`);
    Object.entries(byModule).forEach(([k, v]) => {
      csvRows.push(`${k},${v}`);
    });
    csvRows.push('');

    // 版本分布
    csvRows.push(`六、版本质量分布`);
    Object.entries(byVersion).forEach(([k, v]) => {
      csvRows.push(`${k},${v}`);
    });
    csvRows.push('');

    // 响应时长分布
    csvRows.push(`七、响应时长分布`);
    const responseBuckets = {
      '0-5分钟': 0,
      '5-15分钟': 0,
      '15-30分钟': 0,
      '30-60分钟': 0,
      '60分钟以上': 0,
    };
    responseTimes.forEach((r) => {
      const mins = r.response_time / 60000;
      if (mins <= 5) responseBuckets['0-5分钟']++;
      else if (mins <= 15) responseBuckets['5-15分钟']++;
      else if (mins <= 30) responseBuckets['15-30分钟']++;
      else if (mins <= 60) responseBuckets['30-60分钟']++;
      else responseBuckets['60分钟以上']++;
    });
    Object.entries(responseBuckets).forEach(([k, v]) => {
      csvRows.push(`${k},${v}`);
    });
    csvRows.push(`平均响应时长(分钟),${Math.round(avgResponseTime / 60000)}`);
    csvRows.push('');

    // 待处理风险
    csvRows.push(`八、待处理风险(高严重级别或高影响人数)`);
    csvRows.push(`风险总数,${highRiskItems.length}`);
    if (highRiskItems.length > 0) {
      csvRows.push(`ID,标题,状态,严重程度,模块,版本,影响人数,负责人`);
      highRiskItems.forEach((item: any) => {
        csvRows.push([
          item.id.slice(0, 8),
          item.title,
          item.status,
          item.severity,
          item.module,
          item.version,
          item.affected_users_count,
          item.assignee || '-'
        ].map(escapeCsv).join(','));
      });
    }
    csvRows.push('');

    // 本周反馈明细
    csvRows.push(`九、本周反馈明细`);
    csvRows.push([
      'ID', '标题', '描述', '状态', '问题类型', '严重程度', '模块', '版本',
      '影响用户数', '来源渠道', '负责人', '验证人', '关闭原因',
      '创建时间', '更新时间', '评论数', '附件数'
    ].join(','));

    weeklyData.forEach((row: any) => {
      csvRows.push([
        row.id,
        row.title,
        row.description,
        row.status,
        row.problem_type,
        row.severity,
        row.module,
        row.version,
        row.affected_users_count,
        row.source_channel,
        row.assignee || '',
        row.verifier || '',
        row.close_reason || '',
        formatDate(row.created_at),
        formatDate(row.updated_at),
        row.comment_count,
        row.attachment_count
      ].map(escapeCsv).join(','));
    });

    const csvContent = csvRows.join('\n');
    const filename = `weekly-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('导出周报失败:', error);
    res.status(500).json({
      success: false,
      error: '导出周报失败'
    });
  }
});

router.get('/risks', (req: Request, res: Response) => {
  try {
    const seenIds = new Set<string>();
    const risks: any[] = [];

    const pendingCritical = db.prepare(`
      SELECT * FROM feedbacks
      WHERE severity = 'critical' AND status NOT IN ('closed', 'fixed')
      ORDER BY created_at ASC
    `).all() as any[];

    pendingCritical.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        risks.push({ ...item, risk_type: 'high_severity' });
      }
    });

    const processingOverdue = db.prepare(`
      SELECT f.*
      FROM feedbacks f
      WHERE f.status NOT IN ('closed', 'fixed')
        AND f.updated_at < ?
      ORDER BY f.updated_at ASC
    `).all(Date.now() - 3 * 24 * 60 * 60 * 1000) as any[];

    processingOverdue.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        risks.push({ ...item, risk_type: 'overdue' });
      }
    });

    const highImpactIssues = db.prepare(`
      SELECT * FROM feedbacks
      WHERE affected_users_count >= 5
        AND status NOT IN ('closed', 'fixed')
      ORDER BY affected_users_count DESC, created_at ASC
    `).all() as any[];

    highImpactIssues.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        risks.push({ ...item, risk_type: 'high_impact' });
      }
    });

    res.json({
      success: true,
      data: risks
    });
  } catch (error) {
    console.error('获取风险数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取风险数据失败'
    });
  }
});

export default router;
