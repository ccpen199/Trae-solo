import { Router, Request, Response } from 'express';
import db from '../db';
import { generateTransferNo } from '../utils/generator';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Transfer } from '../types';

const router = Router();

router.get('/transfers', (req: LogRequest, res: Response) => {
  try {
    const { status, urgency, from_hospital, to_hospital, keyword, page = '1', pageSize = '20' } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (urgency) {
      conditions.push('urgency = ?');
      params.push(urgency);
    }
    if (from_hospital) {
      conditions.push('from_hospital_id = ?');
      params.push(parseInt(from_hospital as string, 10));
    }
    if (to_hospital) {
      conditions.push('to_hospital_id = ?');
      params.push(parseInt(to_hospital as string, 10));
    }
    if (keyword) {
      conditions.push('(patient_name LIKE ? OR transfer_no LIKE ? OR primary_diagnosis LIKE ?)');
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM transfers ${whereClause}
    `).get(...params) as { total: number };
    
    const offset = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const limit = parseInt(pageSize as string, 10);
    
    const transfers = db.prepare(`
      SELECT * FROM transfers ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Transfer[];
    
    const response: ApiResponse = {
      success: true,
      data: {
        list: transfers,
        total: countResult.total,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10)
      },
      message: '获取转诊列表成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取转诊列表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.get('/transfers/:id', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const transfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(parseInt(id, 10)) as Transfer | undefined;
    
    if (!transfer) {
      const response: ApiResponse = {
        success: false,
        message: '转诊记录不存在'
      };
      return res.status(404).json(response);
    }
    
    const reviews = db.prepare(`
      SELECT * FROM reviews WHERE transfer_id = ? ORDER BY created_at DESC
    `).all(parseInt(id, 10));
    
    const coordination = db.prepare(`
      SELECT * FROM coordinations WHERE transfer_id = ?
    `).get(parseInt(id, 10));
    
    const result = db.prepare(`
      SELECT * FROM results WHERE transfer_id = ?
    `).get(parseInt(id, 10));
    
    const response: ApiResponse = {
      success: true,
      data: {
        transfer,
        reviews,
        coordination,
        result
      },
      message: '获取转诊详情成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取转诊详情失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.post('/transfers', (req: LogRequest, res: Response) => {
  try {
    const {
      patient_id,
      patient_name,
      from_hospital_id,
      from_hospital_name,
      from_department,
      from_doctor_id,
      from_doctor_name,
      to_hospital_id,
      to_hospital_name,
      to_department,
      to_doctor_id,
      to_doctor_name,
      urgency,
      primary_diagnosis,
      transfer_reason,
      current_condition,
      treatment_history = '',
      examination_results = ''
    } = req.body;
    
    if (!patient_id || !patient_name || !from_hospital_id || !from_hospital_name ||
        !from_department || !from_doctor_id || !from_doctor_name ||
        !to_hospital_id || !to_hospital_name || !to_department ||
        !to_doctor_id || !to_doctor_name || !urgency ||
        !primary_diagnosis || !transfer_reason || !current_condition) {
      const response: ApiResponse = {
        success: false,
        message: '必填参数不能为空'
      };
      return res.status(400).json(response);
    }
    
    if (!['normal', 'urgent', 'emergency'].includes(urgency)) {
      const response: ApiResponse = {
        success: false,
        message: '紧急程度参数无效'
      };
      return res.status(400).json(response);
    }
    
    const transferNo = generateTransferNo();
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    
    const result = db.prepare(`
      INSERT INTO transfers (
        transfer_no, patient_id, patient_name, from_hospital_id, from_hospital_name,
        from_department, from_doctor_id, from_doctor_name, to_hospital_id, to_hospital_name,
        to_department, to_doctor_id, to_doctor_name, urgency, primary_diagnosis,
        transfer_reason, current_condition, treatment_history, examination_results,
        status, created_by, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      transferNo, patient_id, patient_name, from_hospital_id, from_hospital_name,
      from_department, from_doctor_id, from_doctor_name, to_hospital_id, to_hospital_name,
      to_department, to_doctor_id, to_doctor_name, urgency, primary_diagnosis,
      transfer_reason, current_condition, treatment_history, examination_results,
      userId, userName
    );
    
    const transferId = result.lastInsertRowid as number;
    
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '创建转诊申请', ip, `转诊编号: ${transferNo}, 患者: ${patient_name}`);
    
    const newTransfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: newTransfer,
      message: '创建转诊申请成功'
    };
    
    res.status(201).json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `创建转诊申请失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.put('/transfers/:id', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const existing = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer | undefined;
    
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        message: '转诊记录不存在'
      };
      return res.status(404).json(response);
    }
    
    if (existing.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        message: '仅待审核状态的转诊可以修改'
      };
      return res.status(400).json(response);
    }
    
    const {
      patient_id,
      patient_name,
      from_hospital_id,
      from_hospital_name,
      from_department,
      from_doctor_id,
      from_doctor_name,
      to_hospital_id,
      to_hospital_name,
      to_department,
      to_doctor_id,
      to_doctor_name,
      urgency,
      primary_diagnosis,
      transfer_reason,
      current_condition,
      treatment_history,
      examination_results
    } = req.body;
    
    if (urgency && !['normal', 'urgent', 'emergency'].includes(urgency)) {
      const response: ApiResponse = {
        success: false,
        message: '紧急程度参数无效'
      };
      return res.status(400).json(response);
    }
    
    db.prepare(`
      UPDATE transfers SET
        patient_id = COALESCE(?, patient_id),
        patient_name = COALESCE(?, patient_name),
        from_hospital_id = COALESCE(?, from_hospital_id),
        from_hospital_name = COALESCE(?, from_hospital_name),
        from_department = COALESCE(?, from_department),
        from_doctor_id = COALESCE(?, from_doctor_id),
        from_doctor_name = COALESCE(?, from_doctor_name),
        to_hospital_id = COALESCE(?, to_hospital_id),
        to_hospital_name = COALESCE(?, to_hospital_name),
        to_department = COALESCE(?, to_department),
        to_doctor_id = COALESCE(?, to_doctor_id),
        to_doctor_name = COALESCE(?, to_doctor_name),
        urgency = COALESCE(?, urgency),
        primary_diagnosis = COALESCE(?, primary_diagnosis),
        transfer_reason = COALESCE(?, transfer_reason),
        current_condition = COALESCE(?, current_condition),
        treatment_history = COALESCE(?, treatment_history),
        examination_results = COALESCE(?, examination_results),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      patient_id, patient_name, from_hospital_id, from_hospital_name,
      from_department, from_doctor_id, from_doctor_name, to_hospital_id, to_hospital_name,
      to_department, to_doctor_id, to_doctor_name, urgency, primary_diagnosis,
      transfer_reason, current_condition, treatment_history, examination_results,
      transferId
    );
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '更新转诊申请', ip, `转诊ID: ${transferId}, 转诊编号: ${existing.transfer_no}`);
    
    const updated = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: updated,
      message: '更新转诊申请成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `更新转诊申请失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.delete('/transfers/:id', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const existing = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer | undefined;
    
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        message: '转诊记录不存在'
      };
      return res.status(404).json(response);
    }
    
    if (existing.status === 'completed' || existing.status === 'cancelled') {
      const response: ApiResponse = {
        success: false,
        message: '该状态的转诊无法取消'
      };
      return res.status(400).json(response);
    }
    
    db.prepare(`
      UPDATE transfers SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(transferId);
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '取消转诊申请', ip, `转诊ID: ${transferId}, 转诊编号: ${existing.transfer_no}, 原状态: ${existing.status}`);
    
    const cancelled = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: cancelled,
      message: '取消转诊申请成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `取消转诊申请失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

export default router;
