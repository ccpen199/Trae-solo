const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../config/database');
const consultationRouter = require('../engines/ConsultationRouter');
const billingGate = require('../engines/BillingGate');
const lawyerRanking = require('../engines/LawyerRanking');

const CATEGORIES = [
  'civil', 'contract', 'labor', 'criminal', 'corporate',
  'intellectual', 'real_estate', 'traffic', 'consumer'
];

const URGENCY_LEVELS = ['normal', 'urgent', 'emergency'];

class ConsultationService {
  async createConsultation(userId, consultationData) {
    const { title, description, category, urgency = 'normal', budgetAmount } = consultationData;

    if (!CATEGORIES.includes(category)) {
      return { success: false, message: '无效的咨询分类' };
    }

    if (!URGENCY_LEVELS.includes(urgency)) {
      return { success: false, message: '无效的紧急程度' };
    }

    const minAmount = parseFloat(process.env.MIN_CONSULTATION_AMOUNT) || 50;
    const maxAmount = parseFloat(process.env.MAX_CONSULTATION_AMOUNT) || 10000;

    if (budgetAmount < minAmount || budgetAmount > maxAmount) {
      return { success: false, message: `咨询金额需在 ${minAmount} - ${maxAmount} 元之间` };
    }

    const consultationId = uuidv4();

    await run(`
      INSERT INTO consultations (
        id, user_id, title, description, category, urgency, budget_amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [consultationId, userId, title, description, category, urgency, budgetAmount, 'pending_payment']);

    await this.logStatusChange(consultationId, null, 'pending_payment', userId, 'client', '创建咨询单');

    return {
      success: true,
      consultation: {
        id: consultationId,
        title,
        description,
        category,
        urgency,
        budgetAmount,
        status: 'pending_payment'
      }
    };
  }

  async getConsultationById(consultationId, userId = null, userRole = null) {
    const consultation = await get(`
      SELECT c.*, 
             u1.username as client_username, u1.real_name as client_real_name,
             u2.username as lawyer_username, u2.real_name as lawyer_real_name,
             l.specializations as lawyer_specializations, l.rating as lawyer_rating,
             p.amount as payment_amount, p.status as payment_status,
             s.summary as suggestion_summary, s.submitted_at as suggestion_submitted_at,
             r.rating as review_rating, r.comment as review_comment
      FROM consultations c
      JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      LEFT JOIN users u2 ON l.user_id = u2.id
      LEFT JOIN payments p ON c.payment_id = p.id
      LEFT JOIN consultation_suggestions s ON c.suggestion_id = s.id
      LEFT JOIN reviews r ON c.review_id = r.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (userRole === 'client' && consultation.user_id !== userId) {
      return { success: false, message: '无权查看该咨询单' };
    }

    if (userRole === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [userId]);
      if (lawyer && consultation.lawyer_id !== lawyer.id) {
        return { success: false, message: '无权查看该咨询单' };
      }
    }

    const statusLogs = await all(`
      SELECT cl.*, u.username as changed_by_name
      FROM consultation_status_logs cl
      LEFT JOIN users u ON cl.changed_by = u.id
      WHERE cl.consultation_id = ?
      ORDER BY cl.created_at ASC
    `, [consultationId]);

    return {
      success: true,
      consultation: {
        ...consultation,
        lawyerSpecializations: JSON.parse(consultation.lawyer_specializations || '[]'),
        statusLogs
      }
    };
  }

  async getMyConsultations(userId, role, filters = {}) {
    const { status, category, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT c.*,
             u2.real_name as lawyer_name,
             l.rating as lawyer_rating,
             p.amount as payment_amount
      FROM consultations c
    `;
    const params = [];

    if (role === 'client') {
      query += ` WHERE c.user_id = ?`;
      params.push(userId);
    } else if (role === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [userId]);
      if (!lawyer) {
        return { success: true, consultations: [], total: 0 };
      }
      query += ` WHERE c.lawyer_id = ?`;
      params.push(lawyer.id);
    } else {
      return { success: false, message: '无效的用户角色' };
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY c.created_at DESC`;

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const countResult = await get(countQuery, params);
    const total = countResult.total;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const consultations = await all(query, params);

    return {
      success: true,
      consultations,
      total,
      limit,
      offset
    };
  }

  async acceptConsultation(consultationId, lawyerUserId) {
    const consultation = await get(`
      SELECT c.*, p.id as payment_id, p.status as payment_status
      FROM consultations c
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (consultation.status !== 'pending_accept') {
      return { success: false, message: '咨询单当前状态不可接单' };
    }

    const lawyer = await get('SELECT * FROM lawyers WHERE user_id = ?', [lawyerUserId]);
    
    if (!lawyer) {
      return { success: false, message: '律师信息不存在' };
    }

    if (lawyer.is_available !== 1) {
      return { success: false, message: '您当前状态不可接单' };
    }

    if (consultation.lawyer_id && consultation.lawyer_id !== lawyer.id) {
      return { success: false, message: '该咨询单已被其他律师接单' };
    }

    const oldStatus = consultation.status;

    await run(`
      UPDATE consultations 
      SET lawyer_id = ?, status = ?, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [lawyer.id, 'in_progress', consultationId]);

    await this.logStatusChange(consultationId, oldStatus, 'in_progress', lawyerUserId, 'lawyer', '律师接单');

    return {
      success: true,
      consultationId,
      lawyerId: lawyer.id,
      status: 'in_progress',
      message: '接单成功'
    };
  }

  async submitSuggestion(consultationId, lawyerUserId, suggestionData) {
    const { summary, detailedAdvice, legalBasis, recommendedActions, followUpNeeded = 0 } = suggestionData;

    const consultation = await get(`
      SELECT c.*, l.id as lawyer_id
      FROM consultations c
      JOIN lawyers l ON c.lawyer_id = l.id
      WHERE c.id = ? AND l.user_id = ?
    `, [consultationId, lawyerUserId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在或无权操作' };
    }

    if (consultation.status !== 'in_progress') {
      return { success: false, message: '咨询单当前状态不可提交建议' };
    }

    const messages = await all(`
      SELECT COUNT(*) as count FROM messages WHERE consultation_id = ?
    `, [consultationId]);

    const suggestionId = uuidv4();

    await run(`
      INSERT INTO consultation_suggestions (
        id, consultation_id, lawyer_id, summary, detailed_advice, legal_basis, 
        recommended_actions, follow_up_needed, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      suggestionId, consultationId, consultation.lawyer_id, 
      summary, detailedAdvice, legalBasis, recommendedActions, followUpNeeded
    ]);

    const oldStatus = consultation.status;

    await run(`
      UPDATE consultations 
      SET suggestion_id = ?, status = ?, ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [suggestionId, 'suggested', consultationId]);

    await this.logStatusChange(consultationId, oldStatus, 'suggested', lawyerUserId, 'lawyer', '提交咨询建议');

    return {
      success: true,
      suggestionId,
      consultationId,
      status: 'suggested',
      message: '建议提交成功，等待用户确认'
    };
  }

  async confirmSuggestion(consultationId, userId) {
    const consultation = await get(`
      SELECT c.*, p.amount as payment_amount
      FROM consultations c
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [consultationId, userId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在或无权操作' };
    }

    if (consultation.status !== 'suggested') {
      return { success: false, message: '咨询单当前状态不可确认' };
    }

    const oldStatus = consultation.status;

    await run(`
      UPDATE consultations SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['pending_review', consultationId]);

    await this.logStatusChange(consultationId, oldStatus, 'pending_review', userId, 'client', '确认咨询建议');

    return {
      success: true,
      consultationId,
      status: 'pending_review',
      message: '已确认建议，请对律师服务进行评价'
    };
  }

  async submitReview(consultationId, userId, reviewData) {
    const { rating, comment, isAnonymous = 0 } = reviewData;

    if (rating < 1 || rating > 5) {
      return { success: false, message: '评分需在 1-5 之间' };
    }

    const consultation = await get(`
      SELECT c.*, l.id as lawyer_id, p.amount as payment_amount
      FROM consultations c
      JOIN lawyers l ON c.lawyer_id = l.id
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [consultationId, userId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在或无权操作' };
    }

    if (consultation.status !== 'pending_review') {
      return { success: false, message: '咨询单当前状态不可评价' };
    }

    const reviewId = uuidv4();

    await run(`
      INSERT INTO reviews (
        id, consultation_id, user_id, lawyer_id, rating, comment, is_anonymous, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [reviewId, consultationId, userId, consultation.lawyer_id, rating, comment, isAnonymous]);

    await lawyerRanking.applyReview(consultation.lawyer_id, reviewId, rating);

    const oldStatus = consultation.status;

    await run(`
      UPDATE consultations 
      SET review_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reviewId, 'reviewed', consultationId]);

    await this.logStatusChange(consultationId, oldStatus, 'reviewed', userId, 'client', '提交评价');

    const settlementResult = await billingGate.processSettlement(consultationId, reviewId);

    return {
      success: true,
      reviewId,
      consultationId,
      status: 'settled',
      settlement: settlementResult,
      message: '评价提交成功，费用已结算'
    };
  }

  async getPendingAssignments(lawyerUserId) {
    const lawyer = await get('SELECT * FROM lawyers WHERE user_id = ?', [lawyerUserId]);
    
    if (!lawyer) {
      return { success: false, message: '律师信息不存在' };
    }

    const specializations = JSON.parse(lawyer.specializations || '[]');
    
    let query = `
      SELECT c.*, u.username as client_username, u.real_name as client_real_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'pending_accept'
    `;
    const params = [];

    if (specializations.length > 0) {
      const conditions = specializations.map(() => 'c.category = ?').join(' OR ');
      query += ` AND (${conditions})`;
      params.push(...specializations);
    }

    query += ` ORDER BY c.urgency DESC, c.created_at ASC LIMIT 20`;

    const consultations = await all(query, params);

    return {
      success: true,
      consultations,
      lawyerSpecializations: specializations
    };
  }

  async logStatusChange(consultationId, fromStatus, toStatus, changedBy, role, reason) {
    const logId = uuidv4();
    await run(`
      INSERT INTO consultation_status_logs (
        id, consultation_id, from_status, to_status, changed_by, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [logId, consultationId, fromStatus, toStatus, changedBy, reason]);
  }
}

module.exports = new ConsultationService();
