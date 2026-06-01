import { Router, Response } from 'express';
import db from '../db';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Result, Transfer } from '../types';

const router = Router();

router.get('/transfers/:id/result', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const transfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer | undefined;
    
    if (!transfer) {
      const response: ApiResponse = {
        success: false,
        message: '转诊记录不存在'
      };
      return res.status(404).json(response);
    }
    
    const result = db.prepare(`
      SELECT * FROM results WHERE transfer_id = ?
    `).get(transferId) as Result | undefined;
    
    const response: ApiResponse = {
      success: true,
      data: result || null,
      message: '获取接诊结果成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取接诊结果失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.post('/transfers/:id/result', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const {
      arrival_time,
      patient_condition,
      diagnosis,
      treatment_given = '',
      admission_decision,
      ward,
      bed_number,
      notes
    } = req.body;
    
    if (!arrival_time || !patient_condition || !diagnosis || !admission_decision) {
      const response: ApiResponse = {
        success: false,
        message: '到达时间、患者状态、诊断结果和入院决定不能为空'
      };
      return res.status(400).json(response);
    }
    
    if (!['admitted', 'observed', 'discharged', 'transferred_again'].includes(admission_decision)) {
      const response: ApiResponse = {
        success: false,
        message: '入院决定参数无效'
      };
      return res.status(400).json(response);
    }
    
    const transfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer | undefined;
    
    if (!transfer) {
      const response: ApiResponse = {
        success: false,
        message: '转诊记录不存在'
      };
      return res.status(404).json(response);
    }
    
    if (transfer.status === 'completed' || transfer.status === 'cancelled' || transfer.status === 'rejected') {
      const response: ApiResponse = {
        success: false,
        message: '该状态的转诊无法回填接诊结果'
      };
      return res.status(400).json(response);
    }
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    
    const existing = db.prepare(`
      SELECT * FROM results WHERE transfer_id = ?
    `).get(transferId) as Result | undefined;
    
    let result;
    
    if (existing) {
      db.prepare(`
        UPDATE results SET
          arrival_time = ?,
          received_by = ?,
          received_by_name = ?,
          patient_condition = ?,
          diagnosis = ?,
          treatment_given = ?,
          admission_decision = ?,
          ward = ?,
          bed_number = ?,
          notes = ?
        WHERE transfer_id = ?
      `).run(
        arrival_time, userId, userName, patient_condition, diagnosis,
        treatment_given, admission_decision, ward || null, bed_number || null,
        notes || null, transferId
      );
      
      result = db.prepare(`
        SELECT * FROM results WHERE transfer_id = ?
      `).get(transferId) as Result;
    } else {
      const insertResult = db.prepare(`
        INSERT INTO results (
          transfer_id, arrival_time, received_by, received_by_name,
          patient_condition, diagnosis, treatment_given, admission_decision,
          ward, bed_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transferId, arrival_time, userId, userName, patient_condition, diagnosis,
        treatment_given, admission_decision, ward || null, bed_number || null,
        notes || null
      );
      
      result = db.prepare(`
        SELECT * FROM results WHERE id = ?
      `).get(insertResult.lastInsertRowid) as Result;
    }
    
    db.prepare(`
      UPDATE transfers SET
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(transferId);
    
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(
      userId, userName,
      existing ? '更新接诊结果' : '回填接诊结果',
      ip,
      `转诊ID: ${transferId}, 转诊编号: ${transfer.transfer_no}, 患者: ${transfer.patient_name}, 入院决定: ${admission_decision}`
    );
    
    const updatedTransfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: {
        result,
        transfer: updatedTransfer
      },
      message: existing ? '更新接诊结果成功' : '回填接诊结果成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `回填接诊结果失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

export default router;
