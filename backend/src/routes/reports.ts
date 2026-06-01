import { Router, Response } from 'express';
import { Parser } from 'json2csv';
import db from '../db';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Transfer } from '../types';

const router = Router();

router.get('/reports/summary', (req: LogRequest, res: Response) => {
  try {
    const totalTransfers = db.prepare(`
      SELECT COUNT(*) as total FROM transfers
    `).get() as { total: number };
    
    const completedTransfers = db.prepare(`
      SELECT COUNT(*) as count FROM transfers WHERE status = 'completed'
    `).get() as { count: number };
    
    const successRate = totalTransfers.total > 0 
      ? Math.round((completedTransfers.count / totalTransfers.total) * 10000) / 100 
      : 0;
    
    const avgWaitTimeResult = db.prepare(`
      SELECT 
        AVG(JULIANDAY(r.arrival_time) - JULIANDAY(t.created_at)) * 24 as avg_hours
      FROM transfers t
      JOIN results r ON t.id = r.transfer_id
      WHERE t.status = 'completed'
    `).get() as { avg_hours: number | null };
    
    const avgWaitTime = avgWaitTimeResult.avg_hours 
      ? Math.round(avgWaitTimeResult.avg_hours * 100) / 100 
      : 0;
    
    const rejectionReasons = db.prepare(`
      SELECT 
        rejection_reason as reason,
        COUNT(*) as count
      FROM transfers
      WHERE status = 'rejected' AND rejection_reason IS NOT NULL
      GROUP BY rejection_reason
      ORDER BY count DESC
    `).all() as { reason: string; count: number }[];
    
    const departmentLoad = db.prepare(`
      SELECT 
        to_department as department,
        COUNT(*) as count
      FROM transfers
      GROUP BY to_department
      ORDER BY count DESC
    `).all() as { department: string; count: number }[];
    
    const hospitalCollaboration = db.prepare(`
      SELECT 
        from_hospital_name as from_hospital,
        to_hospital_name as to_hospital,
        COUNT(*) as count
      FROM transfers
      GROUP BY from_hospital_id, to_hospital_id
      ORDER BY count DESC
      LIMIT 20
    `).all() as { from_hospital: string; to_hospital: string; count: number }[];
    
    const monthlyTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM transfers
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 12
    `).all() as { month: string; count: number; completed: number }[];
    
    const urgencyDistribution = db.prepare(`
      SELECT 
        urgency,
        COUNT(*) as count
      FROM transfers
      GROUP BY urgency
      ORDER BY count DESC
    `).all() as { urgency: string; count: number }[];
    
    const statusDistribution = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM transfers
      GROUP BY status
      ORDER BY count DESC
    `).all() as { status: string; count: number }[];
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '查看报表汇总', ip, '获取管理报表汇总数据');
    
    const response: ApiResponse = {
      success: true,
      data: {
        total_transfers: totalTransfers.total,
        completed_transfers: completedTransfers.count,
        success_rate: successRate,
        avg_wait_hours: avgWaitTime,
        rejection_reasons: rejectionReasons,
        department_load: departmentLoad,
        hospital_collaboration: hospitalCollaboration,
        monthly_trend: monthlyTrend.reverse(),
        urgency_distribution: urgencyDistribution,
        status_distribution: statusDistribution
      },
      message: '获取汇总数据成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取汇总数据失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.get('/reports/export', (req: LogRequest, res: Response) => {
  try {
    const { start_date, end_date, status } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (start_date) {
      conditions.push('DATE(t.created_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('DATE(t.created_at) <= ?');
      params.push(end_date);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const transfers = db.prepare(`
      SELECT 
        t.transfer_no,
        t.patient_name,
        t.patient_id,
        t.from_hospital_name,
        t.from_department,
        t.from_doctor_name,
        t.to_hospital_name,
        t.to_department,
        t.to_doctor_name,
        t.urgency,
        t.primary_diagnosis,
        t.status,
        t.created_at as apply_time,
        r.arrival_time,
        r.admission_decision,
        r.diagnosis as final_diagnosis
      FROM transfers t
      LEFT JOIN results r ON t.id = r.transfer_id
      ${whereClause}
      ORDER BY t.created_at DESC
    `).all(...params) as any[];
    
    const formattedData = transfers.map(t => ({
      '转诊编号': t.transfer_no,
      '患者姓名': t.patient_name,
      '患者ID': t.patient_id,
      '转出医院': t.from_hospital_name,
      '转出科室': t.from_department,
      '转出医生': t.from_doctor_name,
      '转入医院': t.to_hospital_name,
      '转入科室': t.to_department,
      '转入医生': t.to_doctor_name,
      '紧急程度': t.urgency === 'emergency' ? '紧急' : t.urgency === 'urgent' ? '加急' : '普通',
      '初步诊断': t.primary_diagnosis,
      '状态': getStatusText(t.status),
      '申请时间': t.apply_time,
      '到达时间': t.arrival_time || '',
      '入院决定': t.admission_decision ? getAdmissionDecisionText(t.admission_decision) : '',
      '最终诊断': t.final_diagnosis || ''
    }));
    
    const parser = new Parser();
    const csv = parser.parse(formattedData);
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '导出报表', ip, `导出转诊报表，共 ${formattedData.length} 条记录`);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transfers_report_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `导出报表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待审核',
    'reviewing': '审核中',
    'accepted': '审核通过',
    'supplement': '需补充资料',
    'rejected': '已拒绝',
    'coordinating': '协调中',
    'transiting': '转运中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

function getAdmissionDecisionText(decision: string): string {
  const decisionMap: Record<string, string> = {
    'admitted': '入院',
    'observed': '观察',
    'discharged': '出院',
    'transferred_again': '再次转诊'
  };
  return decisionMap[decision] || decision;
}

export default router;
