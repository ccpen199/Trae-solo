const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../config/database');
const lawyerRanking = require('../engines/LawyerRanking');
const billingGate = require('../engines/BillingGate');
const knowledgeVault = require('../engines/KnowledgeVault');

class DisputeService {
  async raiseDispute(consultationId, initiatorId, initiatorRole, disputeData) {
    const { reason, description } = disputeData;

    const consultation = await get(`
      SELECT c.*, p.amount as payment_amount
      FROM consultations c
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (initiatorRole === 'client' && consultation.user_id !== initiatorId) {
      return { success: false, message: '无权对该咨询单发起争议' };
    }

    if (initiatorRole === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [initiatorId]);
      if (!lawyer || lawyer.id !== consultation.lawyer_id) {
        return { success: false, message: '无权对该咨询单发起争议' };
      }
    }

    if (consultation.is_disputed === 1) {
      return { success: false, message: '该咨询单已有未解决的争议' };
    }

    const validStatuses = ['suggested', 'pending_review', 'reviewed', 'settled'];
    if (!validStatuses.includes(consultation.status)) {
      return { success: false, message: '当前状态不可发起争议' };
    }

    const disputeId = uuidv4();

    await run(`
      INSERT INTO disputes (
        id, consultation_id, initiator_id, initiator_role, reason, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [disputeId, consultationId, initiatorId, initiatorRole, reason, description, 'pending']);

    await run(`
      UPDATE consultations SET is_disputed = 1, dispute_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [disputeId, consultationId]);

    return {
      success: true,
      dispute: {
        id: disputeId,
        consultationId,
        initiatorId,
        initiatorRole,
        reason,
        description,
        status: 'pending'
      }
    };
  }

  async getDisputeById(disputeId, handlerRole = null) {
    const dispute = await get(`
      SELECT d.*,
             c.title as consultation_title, c.category, c.status as consultation_status,
             u1.username as initiator_name, u1.real_name as initiator_real_name,
             u2.username as handler_name
      FROM disputes d
      JOIN consultations c ON d.consultation_id = c.id
      JOIN users u1 ON d.initiator_id = u1.id
      LEFT JOIN users u2 ON d.handler_id = u2.id
      WHERE d.id = ?
    `, [disputeId]);

    if (!dispute) {
      return { success: false, message: '争议不存在' };
    }

    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ?',
      [dispute.consultation_id]
    );

    const messages = await all(`
      SELECT m.*, u.username as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.consultation_id = ?
      ORDER BY m.created_at ASC
    `, [dispute.consultation_id]);

    return {
      success: true,
      dispute,
      consultation,
      messages
    };
  }

  async getPendingDisputes(limit = 20, offset = 0) {
    const disputes = await all(`
      SELECT d.*,
             c.title as consultation_title, c.category,
             u1.username as initiator_name, u1.real_name as initiator_real_name
      FROM disputes d
      JOIN consultations c ON d.consultation_id = c.id
      JOIN users u1 ON d.initiator_id = u1.id
      WHERE d.status = ?
      ORDER BY d.created_at ASC
      LIMIT ? OFFSET ?
    `, ['pending', limit, offset]);

    const total = await get(`
      SELECT COUNT(*) as count FROM disputes WHERE status = ?
    `, ['pending']);

    return {
      success: true,
      disputes,
      total: total.count,
      limit,
      offset
    };
  }

  async handleDispute(disputeId, handlerId, resolution, shouldRefund = false, refundAmount = 0) {
    const dispute = await get('SELECT * FROM disputes WHERE id = ?', [disputeId]);

    if (!dispute) {
      return { success: false, message: '争议不存在' };
    }

    if (dispute.status !== 'pending') {
      return { success: false, message: '该争议已处理' };
    }

    const consultation = await get(`
      SELECT c.*, p.amount as payment_amount, l.rating as lawyer_rating
      FROM consultations c
      LEFT JOIN payments p ON c.payment_id = p.id
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      WHERE c.id = ?
    `, [dispute.consultation_id]);

    let newRating = null;
    if (consultation.lawyer_rating) {
      const ratingReduction = shouldRefund ? 0.5 : 0.2;
      newRating = Math.max(1.0, consultation.lawyer_rating - ratingReduction);
    }

    let refundResult = null;
    if (shouldRefund && refundAmount > 0) {
      const actualRefund = Math.min(refundAmount, consultation.payment_amount || 0);
      refundResult = await billingGate.processRefund(
        dispute.consultation_id,
        actualRefund,
        `争议处理退款: ${resolution}`
      );
    }

    if (consultation.lawyer_id && newRating) {
      await run(
        'UPDATE lawyers SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newRating, consultation.lawyer_id]
      );
      
      await lawyerRanking.recalculateAfterDispute(consultation.lawyer_id, disputeId);
    }

    await run(`
      UPDATE disputes 
      SET handler_id = ?, resolution = ?, status = ?, resolved_at = CURRENT_TIMESTAMP,
          original_rating = ?, recalculated_rating = ?, refund_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      handlerId, resolution, 'resolved', 
      consultation.lawyer_rating, newRating, 
      shouldRefund ? refundAmount : 0, disputeId
    ]);

    await run(`
      UPDATE consultations SET is_disputed = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [dispute.consultation_id]);

    if (consultation.status === 'settled' || consultation.status === 'reviewed') {
      await knowledgeVault.convertToCase(dispute.consultation_id);
    }

    return {
      success: true,
      disputeId,
      status: 'resolved',
      resolution,
      originalRating: consultation.lawyer_rating,
      newRating,
      refund: refundResult,
      message: '争议处理完成'
    };
  }

  async getDisputeHistory(consultationId) {
    const disputes = await all(`
      SELECT d.*, u.username as handler_name
      FROM disputes d
      LEFT JOIN users u ON d.handler_id = u.id
      WHERE d.consultation_id = ?
      ORDER BY d.created_at DESC
    `, [consultationId]);

    return {
      success: true,
      disputes
    };
  }
}

module.exports = new DisputeService();
