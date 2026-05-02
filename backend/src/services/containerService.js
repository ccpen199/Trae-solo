const db = require('../database/config');
const { 
  BOOKING_STATUSES, 
  ROLES, 
  MESSAGE_TYPES,
  AUDIT_ACTIONS,
  CONTAINER_TYPES,
} = require('../utils/constants');
const { generateContainerNo, validateContainerNo, validateContainerCheckDigit } = require('../utils/helpers');
const bookingService = require('./bookingService');
const auditService = require('./auditService');
const messageService = require('./messageService');

const getAvailableContainerTypes = () => {
  return CONTAINER_TYPES.map(type => ({
    code: type,
    name: getContainerTypeName(type),
  }));
};

const getContainerTypeName = (type) => {
  const typeNames = {
    '20GP': '20英尺普通柜',
    '40GP': '40英尺普通柜',
    '40HQ': '40英尺高柜',
    '20RF': '20英尺冷冻柜',
    '40RF': '40英尺冷冻柜',
    '20OT': '20英尺开顶柜',
    '40OT': '40英尺开顶柜',
    '20FR': '20英尺框架柜',
    '40FR': '40英尺框架柜',
    '20TK': '20英尺罐式柜',
    '40TK': '40英尺罐式柜',
  };
  return typeNames[type] || type;
};

const checkContainerDuplicate = (containerNo) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM booking_details
    WHERE container_no = ? AND status != 'released'
  `);
  const result = stmt.get(containerNo);
  return result.count > 0;
};

const validateContainerAssignment = (containerNo, detailId) => {
  const errors = [];

  if (!containerNo) {
    errors.push('箱号不能为空');
    return { valid: false, errors };
  }

  const upperContainerNo = containerNo.toUpperCase().trim();

  if (!validateContainerNo(upperContainerNo)) {
    errors.push('箱号格式不正确，应为4个字母加7个数字');
    return { valid: false, errors };
  }

  if (!validateContainerCheckDigit(upperContainerNo)) {
    errors.push('箱号校验位不正确');
  }

  if (checkContainerDuplicate(upperContainerNo)) {
    errors.push('该箱号已被使用');
  }

  return {
    valid: errors.length === 0,
    errors,
    containerNo: upperContainerNo,
  };
};

const assignContainer = (options) => {
  const {
    mainId,
    detailId,
    containerNo,
    containerType,
    sealNo,
    weight,
    volume,
    userId,
    userRole,
  } = options;

  const booking = bookingService.getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  if (booking.status !== BOOKING_STATUSES.PENDING_CONTAINER) {
    return { success: false, message: '当前状态不允许分配箱号' };
  }

  const validation = validateContainerAssignment(containerNo, detailId);
  if (!validation.valid) {
    return { 
      success: false, 
      message: '箱号验证失败', 
      errors: validation.errors 
    };
  }

  const transaction = db.transaction(() => {
    let targetDetailId = detailId;

    if (!targetDetailId) {
      const details = bookingService.getBookingDetails(mainId);
      if (details.length === 0) {
        throw new Error('没有可分配箱号的明细');
      }
      const emptyDetail = details.find(d => !d.container_no);
      if (emptyDetail) {
        targetDetailId = emptyDetail.id;
      } else {
        targetDetailId = details[0].id;
      }
    }

    const updateDetail = db.prepare(`
      UPDATE booking_details 
      SET container_no = ?, container_type = ?, seal_no = ?, 
          weight = ?, volume = ?, status = 'assigned',
          is_checked = 0, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateDetail.run(
      validation.containerNo,
      containerType || null,
      sealNo || null,
      weight || null,
      volume || null,
      targetDetailId
    );

    const checkAllAssigned = db.prepare(`
      SELECT COUNT(*) as pending FROM booking_details
      WHERE main_id = ? AND (container_no IS NULL OR container_no = '')
    `);
    const pendingResult = checkAllAssigned.get(mainId);

    if (pendingResult.pending === 0) {
      const updateMain = db.prepare(`
        UPDATE booking_mains 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      updateMain.run(BOOKING_STATUSES.PENDING_PORT_ENTRY, mainId);

      const insertTransition = db.prepare(`
        INSERT INTO status_transitions (
          main_id, from_status, to_status, transition_type,
          operator_id, operator_role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      insertTransition.run(
        mainId,
        BOOKING_STATUSES.PENDING_CONTAINER,
        BOOKING_STATUSES.PENDING_PORT_ENTRY,
        'assign_container',
        userId,
        userRole
      );
    }

    return targetDetailId;
  });

  try {
    const detailIdResult = transaction();

    auditService.logAction({
      mainId,
      detailId: detailIdResult,
      userId,
      userRole,
      action: AUDIT_ACTIONS.ASSIGN_CONTAINER,
      tableName: 'booking_details',
      recordId: detailIdResult,
      newValue: { containerNo: validation.containerNo, containerType, sealNo },
    });

    const updatedBooking = bookingService.getBookingById(mainId);
    if (updatedBooking.status === BOOKING_STATUSES.PENDING_PORT_ENTRY) {
      messageService.createMessage({
        mainId,
        messageType: MESSAGE_TYPES.CONTAINER_ASSIGNED,
        title: `箱号已分配，等待港口进场: ${booking.main_order_no}`,
        content: `所有箱号已分配完成，请安排港口进场检查`,
        assignedRole: ROLES.PORT,
        priority: 'high',
      });
    }

    return {
      success: true,
      data: {
        mainId,
        detailId: detailIdResult,
        containerNo: validation.containerNo,
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const batchAssignContainers = (options) => {
  const {
    mainId,
    containers,
    userId,
    userRole,
  } = options;

  const results = [];
  let allSuccess = true;

  for (const container of containers) {
    const result = assignContainer({
      mainId,
      detailId: container.detailId,
      containerNo: container.containerNo,
      containerType: container.containerType,
      sealNo: container.sealNo,
      weight: container.weight,
      volume: container.volume,
      userId,
      userRole,
    });

    if (!result.success) {
      allSuccess = false;
    }
    results.push({ ...result, containerInput: container });
  }

  return {
    success: allSuccess,
    results,
  };
};

const checkContainerForPortEntry = (detailId) => {
  const detail = db.prepare(`
    SELECT * FROM booking_details WHERE id = ?
  `).get(detailId);

  if (!detail) {
    return { valid: false, errors: ['明细不存在'] };
  }

  const errors = [];

  if (!detail.container_no) {
    errors.push('箱号为空');
  }

  if (!validateContainerNo(detail.container_no)) {
    errors.push('箱号格式不正确');
  }

  if (!validateContainerCheckDigit(detail.container_no)) {
    errors.push('箱号校验位不正确');
  }

  return {
    valid: errors.length === 0,
    errors,
    detail,
  };
};

const processPortEntry = (options) => {
  const {
    mainId,
    detailId,
    action,
    userId,
    userRole,
    comment,
    attachments,
    newAssignedTo,
  } = options;

  const booking = bookingService.getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  if (booking.status !== BOOKING_STATUSES.PENDING_PORT_ENTRY) {
    return { success: false, message: '当前状态不允许港口进场操作' };
  }

  const validActions = ['approve_port_entry', 'reject', 'request_additional_info', 'reassign'];
  if (!validActions.includes(action)) {
    return { success: false, message: '无效的操作类型' };
  }

  const transaction = db.transaction(() => {
    if (detailId) {
      const checkResult = checkContainerForPortEntry(detailId);
      
      const updateDetail = db.prepare(`
        UPDATE booking_details 
        SET is_checked = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `);

      if (action === 'approve_port_entry') {
        updateDetail.run(1, 'checked', detailId);
      } else if (action === 'reject') {
        updateDetail.run(0, 'rejected', detailId);
      }
    }

    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (
        main_id, detail_id, from_status, to_status, transition_type,
        operator_id, operator_role, comment, attachments, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    let toStatus = booking.status;

    if (action === 'approve_port_entry') {
      const checkAllApproved = db.prepare(`
        SELECT COUNT(*) as total, SUM(is_checked) as approved
        FROM booking_details WHERE main_id = ?
      `);
      const approvalResult = checkAllApproved.get(mainId);

      if (approvalResult.total === approvalResult.approved) {
        toStatus = BOOKING_STATUSES.PENDING_LOADING;
        
        const updateMain = db.prepare(`
          UPDATE booking_mains 
          SET status = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        updateMain.run(toStatus, mainId);
      }
    } else if (action === 'reject') {
      toStatus = BOOKING_STATUSES.REJECTED;
      
      const updateMain = db.prepare(`
        UPDATE booking_mains 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      updateMain.run(toStatus, mainId);
    }

    insertTransition.run(
      mainId,
      detailId || null,
      booking.status,
      toStatus,
      action,
      userId,
      userRole,
      comment || null,
      attachments ? JSON.stringify(attachments) : null
    );

    return toStatus;
  });

  try {
    const newStatus = transaction();

    const actionMap = {
      'approve_port_entry': AUDIT_ACTIONS.APPROVE_PORT_ENTRY,
      'reject': AUDIT_ACTIONS.REJECT_PORT_ENTRY,
    };

    if (actionMap[action]) {
      auditService.logAction({
        mainId,
        detailId,
        userId,
        userRole,
        action: actionMap[action],
        tableName: 'booking_details',
        recordId: detailId,
        newValue: { action, comment },
      });
    }

    if (action === 'approve_port_entry' && newStatus === BOOKING_STATUSES.PENDING_LOADING) {
      messageService.createMessage({
        mainId,
        messageType: MESSAGE_TYPES.PORT_ENTRY_APPROVED,
        title: `港口进场已批准，等待装船: ${booking.main_order_no}`,
        content: `所有集装箱已通过港口检查，请安排装船`,
        assignedRole: ROLES.SHIPPING_COMPANY,
        priority: 'high',
      });
    } else if (action === 'reject') {
      messageService.createMessage({
        mainId,
        messageType: MESSAGE_TYPES.PORT_ENTRY_REJECTED,
        title: `港口进场被驳回: ${booking.main_order_no}`,
        content: `驳回原因: ${comment || '未说明'}`,
        assignedRole: ROLES.FORWARDER,
        priority: 'high',
      });
    }

    return {
      success: true,
      data: {
        mainId,
        fromStatus: booking.status,
        toStatus: newStatus,
        action,
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  getAvailableContainerTypes,
  getContainerTypeName,
  checkContainerDuplicate,
  validateContainerAssignment,
  assignContainer,
  batchAssignContainers,
  checkContainerForPortEntry,
  processPortEntry,
};
