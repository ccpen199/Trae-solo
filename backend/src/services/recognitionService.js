const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { ORDER_STATUSES, updateOrderStatus } = require('./orderStatusService');
const { createTodoForResponsiblePerson } = require('./todoService');

const RECOGNITION_TYPES = {
  FACE: 'face',
  BODY: 'body',
  BOTH: 'both'
};

const RECOGNITION_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const executeRecognition = (orderId, recognitionType, operatorInfo = {}) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const validStatuses = [ORDER_STATUSES.CAMERA_OPENED, ORDER_STATUSES.PENDING_RECOGNITION];
  if (!validStatuses.includes(order.status)) {
    return { success: false, message: `订单状态 ${order.status} 不允许执行识别` };
  }

  const transaction = db.transaction(() => {
    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.RECOGNITION_IN_PROGRESS, {
      ...operatorInfo,
      action: 'start_recognition',
      reason: '开始执行人脸/人体识别'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    const recognitionId = generateId('recog');
    
    const simulatedFaceData = {
      landmarks: { leftEye: { x: 150, y: 200 }, rightEye: { x: 250, y: 200 }, nose: { x: 200, y: 250 }, mouth: { x: 200, y: 300 } },
      faceRectangle: { x: 100, y: 100, width: 200, height: 250 },
      confidence: 0.95
    };

    const simulatedBodyData = {
      landmarks: { leftShoulder: { x: 120, y: 400 }, rightShoulder: { x: 280, y: 400 }, leftHip: { x: 150, y: 600 }, rightHip: { x: 250, y: 600 } },
      bodyRectangle: { x: 80, y: 350, width: 240, height: 400 },
      confidence: 0.88
    };

    const stmt = db.prepare(`
      INSERT INTO recognition_results (
        id, order_id, recognition_type, face_data, body_data, confidence, status, processed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      recognitionId,
      orderId,
      recognitionType,
      simulatedFaceData ? JSON.stringify(simulatedFaceData) : null,
      simulatedBodyData ? JSON.stringify(simulatedBodyData) : null,
      0.92,
      RECOGNITION_STATUSES.COMPLETED,
      operatorInfo.operatorId
    );

    const completeResult = updateOrderStatus(orderId, ORDER_STATUSES.RECOGNITION_COMPLETED, {
      ...operatorInfo,
      action: 'complete_recognition',
      reason: '识别完成'
    });

    if (!completeResult.success) {
      throw new Error(completeResult.message);
    }

    if (order.responsible_person) {
      createTodoForResponsiblePerson(orderId, order.responsible_person, ORDER_STATUSES.RECOGNITION_COMPLETED, operatorInfo);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.RECOGNITION_COMPLETED, {
      orderId,
      ...operatorInfo,
      detail: { recognitionId, recognitionType, confidence: 0.92 }
    });

    const recognition = db.prepare('SELECT * FROM recognition_results WHERE id = ?').get(recognitionId);
    return { success: true, recognition, order: completeResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('识别执行失败:', error);
    return { success: false, message: error.message };
  }
};

const getRecognitionResult = (orderId) => {
  return db.prepare(`
    SELECT * FROM recognition_results 
    WHERE order_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(orderId);
};

const getAvailableActions = (orderStatus) => {
  const actionMap = {
    [ORDER_STATUSES.CAMERA_OPENED]: [
      { action: 'start_recognition', label: '开始识别', description: '执行人脸/人体识别' }
    ],
    [ORDER_STATUSES.RECOGNITION_IN_PROGRESS]: [
      { action: 'complete_recognition', label: '完成识别', description: '标记识别完成' }
    ],
    [ORDER_STATUSES.RECOGNITION_COMPLETED]: [
      { action: 'start_tryon', label: '开始试穿', description: '叠加3D商品模型' }
    ],
    [ORDER_STATUSES.TRYON_IN_PROGRESS]: [
      { action: 'complete_tryon', label: '完成试穿', description: '标记试穿完成' },
      { action: 'switch_product', label: '切换商品', description: '选择其他商品试穿' }
    ],
    [ORDER_STATUSES.TRYON_COMPLETED]: [
      { action: 'save_share', label: '保存分享', description: '保存截图并分享' }
    ],
    [ORDER_STATUSES.SHARED]: [
      { action: 'submit_approval', label: '提交审批', description: '提交下单申请' }
    ],
    [ORDER_STATUSES.PENDING_APPROVAL]: [
      { action: 'approve', label: '通过', description: '审批通过' },
      { action: 'reject', label: '驳回', description: '审批驳回' },
      { action: 'request_more_info', label: '补充资料', description: '要求补充资料' },
      { action: 'reassign', label: '转派', description: '转派给其他人处理' }
    ]
  };

  return actionMap[orderStatus] || [];
};

module.exports = {
  RECOGNITION_TYPES,
  RECOGNITION_STATUSES,
  executeRecognition,
  getRecognitionResult,
  getAvailableActions
};
