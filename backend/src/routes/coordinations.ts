import { Router, Response } from 'express';
import db from '../db';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Coordination, Transfer } from '../types';

const router = Router();

router.get('/transfers/:id/coordination', (req: LogRequest, res: Response) => {
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
    
    const coordination = db.prepare(`
      SELECT * FROM coordinations WHERE transfer_id = ?
    `).get(transferId) as Coordination | undefined;
    
    const response: ApiResponse = {
      success: true,
      data: coordination || null,
      message: '获取协调记录成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取协调记录失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.post('/transfers/:id/coordinate', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const {
      bed_available,
      bed_number,
      estimated_arrival_time,
      preparation_notes,
      contact_person,
      contact_phone
    } = req.body;
    
    if (bed_available === undefined || !preparation_notes) {
      const response: ApiResponse = {
        success: false,
        message: '床位是否可用和准备说明不能为空'
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
        message: '该状态的转诊无法进行协调'
      };
      return res.status(400).json(response);
    }
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    
    const existing = db.prepare(`
      SELECT * FROM coordinations WHERE transfer_id = ?
    `).get(transferId) as Coordination | undefined;
    
    let coordination;
    
    if (existing) {
      db.prepare(`
        UPDATE coordinations SET
          coordinator_id = ?,
          coordinator_name = ?,
          bed_available = ?,
          bed_number = ?,
          estimated_arrival_time = ?,
          preparation_notes = ?,
          contact_person = ?,
          contact_phone = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE transfer_id = ?
      `).run(
        userId, userName,
        bed_available ? 1 : 0,
        bed_number || null,
        estimated_arrival_time || null,
        preparation_notes,
        contact_person || null,
        contact_phone || null,
        transferId
      );
      
      coordination = db.prepare(`
        SELECT * FROM coordinations WHERE transfer_id = ?
      `).get(transferId) as Coordination;
    } else {
      const result = db.prepare(`
        INSERT INTO coordinations (
          transfer_id, coordinator_id, coordinator_name, bed_available,
          bed_number, estimated_arrival_time, preparation_notes,
          contact_person, contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transferId, userId, userName,
        bed_available ? 1 : 0,
        bed_number || null,
        estimated_arrival_time || null,
        preparation_notes,
        contact_person || null,
        contact_phone || null
      );
      
      coordination = db.prepare(`
        SELECT * FROM coordinations WHERE id = ?
      `).get(result.lastInsertRowid) as Coordination;
    }
    
    db.prepare(`
      UPDATE transfers SET
        status = 'coordinating',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(transferId);
    
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(
      userId, userName,
      existing ? '更新协调记录' : '创建协调记录',
      ip,
      `转诊ID: ${transferId}, 转诊编号: ${transfer.transfer_no}, 床位: ${bed_available ? '可用' : '不可用'}, ${bed_number ? '床位号: ' + bed_number : ''}`
    );
    
    const updatedTransfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: {
        coordination,
        transfer: updatedTransfer
      },
      message: existing ? '更新协调记录成功' : '创建协调记录成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `协调操作失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

export default router;
