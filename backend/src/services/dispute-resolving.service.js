const db = require('../config/database');
const auditService = require('./audit.service');
const escrowPayService = require('./escrow-pay.service');
const trustLinkService = require('./trust-link.service');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const DISPUTE_TYPES = {
  QUALITY: 'quality',
  DELIVERY: 'delivery',
  PAYMENT: 'payment',
  OTHER: 'other'
};

const DISPUTE_STATUS = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  MEDIATING: 'mediating',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const RESOLUTION_TYPES = {
  FULL_REFUND: 'full_refund',
  PARTIAL_REFUND: 'partial_refund',
  KEEP_ITEM: 'keep_item',
  RETURN_REFUND: 'return_refund',
  OTHER: 'other'
};

const FRAUD_KEYWORDS = [
  '加微信', '加QQ', '私下交易', '货到付款', '银行转账',
  '微信转账', '支付宝转账', '扫二维码', '二维码支付',
  '先付定金', '先付一半', '担保交易', '不走平台',
  '离开平台', '私下发', '私下聊', '加我聊'
];

class DisputeResolvingService {
  constructor() {
    this.fraudKeywords = FRAUD_KEYWORDS;
  }

  generateDisputeNo() {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DP${timestamp}${random}`;
  }

  createDispute(orderId, initiatorId, options = {}) {
    const { type = DISPUTE_TYPES.OTHER, title, description, evidence = [] } = options;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (initiatorId !== order.buyer_id && initiatorId !== order.seller_id) {
      throw new Error('只有订单相关用户才能发起纠纷');
    }

    const respondentId = initiatorId === order.buyer_id ? order.seller_id : order.buyer_id;

    const existingDispute = db.prepare(
      'SELECT * FROM disputes WHERE order_id = ? AND status NOT IN (?, ?)'
    ).get(orderId, DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED);

    if (existingDispute) {
      throw new Error('该订单已有进行中的纠纷');
    }

    const disputeNo = this.generateDisputeNo();

    const insertStmt = db.prepare(`
      INSERT INTO disputes (
        dispute_no, order_id, initiator_id, respondent_id,
        type, title, description, evidence, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      disputeNo,
      orderId,
      initiatorId,
      respondentId,
      type,
      title,
      description,
      JSON.stringify(evidence),
      DISPUTE_STATUS.PENDING
    );

    const updateOrder = db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateOrder.run('disputed', orderId);

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(result.lastInsertRowid);

    auditService.logCreate({
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: dispute.id,
      newValue: dispute,
      description: `纠纷 ${disputeNo} 已创建，订单: ${order.order_no}`
    });

    return dispute;
  }

  assignHandler(disputeId, handlerId, actor = null) {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      throw new Error(`纠纷不存在: ${disputeId}`);
    }

    const handler = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(handlerId, 'customer_service');
    if (!handler) {
      throw new Error('处理人必须是客服人员');
    }

    const updateStmt = db.prepare(`
      UPDATE disputes 
      SET handler_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(handlerId, DISPUTE_STATUS.INVESTIGATING, disputeId);

    const updatedDispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: disputeId,
      oldValue: { status: dispute.status, handler_id: dispute.handler_id },
      newValue: { status: DISPUTE_STATUS.INVESTIGATING, handler_id: handlerId },
      description: `纠纷 ${dispute.dispute_no} 已分配给客服 ${handler.nickname}`
    });

    return updatedDispute;
  }

  startMediation(disputeId, actor = null) {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      throw new Error(`纠纷不存在: ${disputeId}`);
    }

    const updateStmt = db.prepare(`
      UPDATE disputes 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(DISPUTE_STATUS.MEDIATING, disputeId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: disputeId,
      oldValue: { status: dispute.status },
      newValue: { status: DISPUTE_STATUS.MEDIATING },
      description: `纠纷 ${dispute.dispute_no} 进入调解阶段`
    });

    return db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
  }

  resolveDispute(disputeId, resolution, options = {}) {
    const { 
      mediationResult, 
      refundAmount = null, 
      winnerId = null, 
      loserId = null,
      actor = null 
    } = options;

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      throw new Error(`纠纷不存在: ${disputeId}`);
    }

    if (dispute.status === DISPUTE_STATUS.RESOLVED || dispute.status === DISPUTE_STATUS.CLOSED) {
      throw new Error('该纠纷已处理完成');
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id);

    if (resolution === RESOLUTION_TYPES.FULL_REFUND) {
      escrowPayService.refundEscrow(order.id, null, actor);
    } else if (resolution === RESOLUTION_TYPES.PARTIAL_REFUND && refundAmount) {
      escrowPayService.partialRefund(order.id, refundAmount, actor);
    } else if (resolution === RESOLUTION_TYPES.KEEP_ITEM) {
      escrowPayService.releaseEscrow(order.id, actor);
    }

    if (winnerId || loserId) {
      trustLinkService.onDisputeResolved(disputeId, winnerId, loserId, actor);
    }

    const updateStmt = db.prepare(`
      UPDATE disputes 
      SET status = ?, mediation_result = ?, resolution = ?, 
          refund_amount = ?, resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(
      DISPUTE_STATUS.RESOLVED,
      mediationResult,
      resolution,
      refundAmount,
      disputeId
    );

    const updateOrder = db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateOrder.run('completed', dispute.order_id);

    const resolvedDispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: disputeId,
      oldValue: { status: dispute.status },
      newValue: { status: DISPUTE_STATUS.RESOLVED, resolution },
      description: `纠纷 ${dispute.dispute_no} 已解决，处理方案: ${resolution}`
    });

    return resolvedDispute;
  }

  closeDispute(disputeId, actor = null) {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      throw new Error(`纠纷不存在: ${disputeId}`);
    }

    if (dispute.status !== DISPUTE_STATUS.RESOLVED) {
      throw new Error('只有已解决的纠纷才能关闭');
    }

    const updateStmt = db.prepare(`
      UPDATE disputes 
      SET status = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(DISPUTE_STATUS.CLOSED, disputeId);

    const closedDispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: disputeId,
      oldValue: { status: dispute.status },
      newValue: { status: DISPUTE_STATUS.CLOSED },
      description: `纠纷 ${dispute.dispute_no} 已关闭`
    });

    return closedDispute;
  }

  checkFraudContent(content) {
    if (!content || typeof content !== 'string') {
      return { isFraud: false, matchedKeywords: [], riskLevel: 'low' };
    }

    const lowerContent = content.toLowerCase();
    const matchedKeywords = [];

    for (const keyword of this.fraudKeywords) {
      if (lowerContent.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    }

    let riskLevel = 'low';
    let isFraud = false;

    if (matchedKeywords.length >= 3) {
      riskLevel = 'high';
      isFraud = true;
    } else if (matchedKeywords.length >= 1) {
      riskLevel = 'medium';
    }

    return {
      isFraud,
      matchedKeywords,
      riskLevel,
      warning: isFraud ? '检测到高风险欺诈内容，建议谨慎处理' : 
               riskLevel === 'medium' ? '检测到潜在风险内容，请留意' : null
    };
  }

  flagMessage(messageId, flagReason, actor = null) {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (!message) {
      throw new Error(`消息不存在: ${messageId}`);
    }

    const updateStmt = db.prepare(`
      UPDATE chat_messages 
      SET is_flagged = 1, flag_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(flagReason, messageId);

    const session = db.prepare('SELECT * FROM chat_sessions WHERE session_id = ?').get(message.session_id);
    if (session) {
      const updateSession = db.prepare(`
        UPDATE chat_sessions 
        SET is_fraud_detected = 1, fraud_warning = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `);
      updateSession.run(flagReason, message.session_id);
    }

    auditService.logUpdate({
      user: actor,
      module: auditService.MODULES.CHAT,
      resourceType: 'chat_message',
      resourceId: messageId,
      oldValue: { is_flagged: message.is_flagged },
      newValue: { is_flagged: 1, flag_reason: flagReason },
      description: `消息 ${messageId} 已标记: ${flagReason}`
    });

    return db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
  }

  getDispute(disputeId) {
    const dispute = db.prepare(`
      SELECT 
        d.*,
        o.order_no,
        o.price as order_price,
        o.total_amount as order_total,
        initiator.nickname as initiator_nickname,
        respondent.nickname as respondent_nickname,
        handler.nickname as handler_nickname
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN users initiator ON d.initiator_id = initiator.id
      LEFT JOIN users respondent ON d.respondent_id = respondent.id
      LEFT JOIN users handler ON d.handler_id = handler.id
      WHERE d.id = ?
    `).get(disputeId);

    if (!dispute) return null;

    return {
      ...dispute,
      evidence: dispute.evidence ? JSON.parse(dispute.evidence) : [],
      statusInfo: this.getDisputeStatusInfo(dispute.status)
    };
  }

  getDisputesByUser(userId, options = {}) {
    const { limit = 50, offset = 0, status = null } = options;
    
    let sql = `
      SELECT 
        d.*,
        o.order_no,
        o.price as order_price,
        p.title as product_title
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE d.initiator_id = ? OR d.respondent_id = ?
    `;
    const params = [userId, userId];

    if (status) {
      sql += ` AND d.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params).map(d => ({
      ...d,
      evidence: d.evidence ? JSON.parse(d.evidence) : []
    }));
  }

  getDisputesForHandler(handlerId, options = {}) {
    const { limit = 50, offset = 0, status = null } = options;
    
    let sql = `
      SELECT 
        d.*,
        o.order_no,
        o.price as order_price,
        p.title as product_title,
        initiator.nickname as initiator_nickname,
        respondent.nickname as respondent_nickname
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users initiator ON d.initiator_id = initiator.id
      LEFT JOIN users respondent ON d.respondent_id = respondent.id
      WHERE d.handler_id = ?
    `;
    const params = [handlerId];

    if (status) {
      sql += ` AND d.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params).map(d => ({
      ...d,
      evidence: d.evidence ? JSON.parse(d.evidence) : []
    }));
  }

  getPendingDisputes(options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return db.prepare(`
      SELECT 
        d.*,
        o.order_no,
        o.price as order_price,
        p.title as product_title,
        initiator.nickname as initiator_nickname,
        respondent.nickname as respondent_nickname
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users initiator ON d.initiator_id = initiator.id
      LEFT JOIN users respondent ON d.respondent_id = respondent.id
      WHERE d.status = ? AND d.handler_id IS NULL
      ORDER BY d.created_at ASC
      LIMIT ? OFFSET ?
    `).all(DISPUTE_STATUS.PENDING, limit, offset).map(d => ({
      ...d,
      evidence: d.evidence ? JSON.parse(d.evidence) : []
    }));
  }

  getDisputeStatusInfo(status) {
    const statusMap = {
      [DISPUTE_STATUS.PENDING]: { label: '待处理', description: '纠纷已创建，等待分配客服' },
      [DISPUTE_STATUS.INVESTIGATING]: { label: '调查中', description: '客服正在调查取证' },
      [DISPUTE_STATUS.MEDIATING]: { label: '调解中', description: '客服正在进行调解' },
      [DISPUTE_STATUS.RESOLVED]: { label: '已解决', description: '纠纷已解决' },
      [DISPUTE_STATUS.CLOSED]: { label: '已关闭', description: '纠纷已关闭' }
    };

    return statusMap[status] || { label: status, description: '未知状态' };
  }

  addEvidence(disputeId, userId, evidence, actor = null) {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
    if (!dispute) {
      throw new Error(`纠纷不存在: ${disputeId}`);
    }

    if (userId !== dispute.initiator_id && userId !== dispute.respondent_id) {
      throw new Error('只有纠纷相关用户才能添加证据');
    }

    const existingEvidence = dispute.evidence ? JSON.parse(dispute.evidence) : [];
    
    const newEvidence = {
      id: uuidv4(),
      userId,
      ...evidence,
      createdAt: new Date().toISOString()
    };

    existingEvidence.push(newEvidence);

    const updateStmt = db.prepare(`
      UPDATE disputes 
      SET evidence = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(JSON.stringify(existingEvidence), disputeId);

    auditService.logUpdate({
      user: actor,
      module: auditService.MODULES.DISPUTE,
      resourceType: 'dispute',
      resourceId: disputeId,
      description: `纠纷 ${dispute.dispute_no} 添加了新证据`
    });

    return newEvidence;
  }
}

module.exports = new DisputeResolvingService();
module.exports.DISPUTE_TYPES = DISPUTE_TYPES;
module.exports.DISPUTE_STATUS = DISPUTE_STATUS;
module.exports.RESOLUTION_TYPES = RESOLUTION_TYPES;
