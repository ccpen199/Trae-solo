import { Router, Response } from 'express';
import db from '../db';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Review, Transfer } from '../types';

const router = Router();

router.post('/transfers/:id/review', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id, 10);
    
    const { result, comments, supplement_requirements } = req.body;
    
    if (!result || !comments) {
      const response: ApiResponse = {
        success: false,
        message: '审核结果和意见不能为空'
      };
      return res.status(400).json(response);
    }
    
    if (!['accepted', 'supplement', 'rejected'].includes(result)) {
      const response: ApiResponse = {
        success: false,
        message: '审核结果参数无效，必须是 accepted、supplement 或 rejected'
      };
      return res.status(400).json(response);
    }
    
    if (result === 'supplement' && !supplement_requirements) {
      const response: ApiResponse = {
        success: false,
        message: '需要补充资料时，请填写补充要求'
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
    
    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      const response: ApiResponse = {
        success: false,
        message: '已完成或已取消的转诊无法审核'
      };
      return res.status(400).json(response);
    }
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    
    const insertResult = db.prepare(`
      INSERT INTO reviews (
        transfer_id, reviewer_id, reviewer_name, result, comments, supplement_requirements
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      transferId, userId, userName, result, comments, supplement_requirements || null
    );
    
    let newStatus = transfer.status;
    let rejectionReason = transfer.rejection_reason;
    
    if (result === 'accepted') {
      newStatus = 'accepted';
    } else if (result === 'supplement') {
      newStatus = 'supplement';
    } else if (result === 'rejected') {
      newStatus = 'rejected';
      rejectionReason = comments;
    }
    
    db.prepare(`
      UPDATE transfers SET
        status = ?,
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, rejectionReason, transferId);
    
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(
      userId, userName,
      `审核转诊申请: ${result === 'accepted' ? '通过' : result === 'supplement' ? '需补充资料' : '拒绝'}`,
      ip,
      `转诊ID: ${transferId}, 转诊编号: ${transfer.transfer_no}, 患者: ${transfer.patient_name}, 审核意见: ${comments}`
    );
    
    const review = db.prepare(`
      SELECT * FROM reviews WHERE id = ?
    `).get(insertResult.lastInsertRowid) as Review;
    
    const updatedTransfer = db.prepare(`
      SELECT * FROM transfers WHERE id = ?
    `).get(transferId) as Transfer;
    
    const response: ApiResponse = {
      success: true,
      data: {
        review,
        transfer: updatedTransfer
      },
      message: `审核${result === 'accepted' ? '通过' : result === 'supplement' ? '需补充资料' : '拒绝'}成功`
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `审核失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

export default router;
