const db = require('../database/config');
const { 
  BOOKING_STATUSES, 
  ROLES, 
  MESSAGE_TYPES,
  AUDIT_ACTIONS,
} = require('../utils/constants');
const { generateBillNo } = require('../utils/helpers');
const bookingService = require('./bookingService');
const auditService = require('./auditService');
const messageService = require('./messageService');

const getBillByMainId = (mainId) => {
  const stmt = db.prepare(`
    SELECT 
      bl.*,
      bm.main_order_no,
      bm.cargo_name,
      bm.container_count,
      u.name as locker_name
    FROM bills_of_lading bl
    LEFT JOIN booking_mains bm ON bl.main_id = bm.id
    LEFT JOIN users u ON bl.lock_by = u.id
    WHERE bl.main_id = ?
  `);

  return stmt.get(mainId);
};

const getBillById = (id) => {
  const stmt = db.prepare(`
    SELECT 
      bl.*,
      bm.main_order_no,
      bm.cargo_name,
      bm.container_count
    FROM bills_of_lading bl
    LEFT JOIN booking_mains bm ON bl.main_id = bm.id
    WHERE bl.id = ?
  `);

  return stmt.get(id);
};

const createBill = (options) => {
  const {
    mainId,
    consignor,
    consignee,
    notifyParty,
    portOfLoading,
    portOfDischarge,
    vesselName,
    voyageNumber,
    containerCount,
    grossWeight,
    measurement,
    userId,
    userRole,
  } = options;

  const booking = bookingService.getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  const existingBill = getBillByMainId(mainId);
  if (existingBill) {
    return { success: false, message: '提单已存在' };
  }

  const billNo = generateBillNo();

  const transaction = db.transaction(() => {
    const insertBill = db.prepare(`
      INSERT INTO bills_of_lading (
        main_id, bill_no, consignor, consignee, notify_party,
        port_of_loading, port_of_discharge, vessel_name, voyage_number,
        container_count, gross_weight, measurement, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `);

    const result = insertBill.run(
      mainId,
      billNo,
      consignor || booking.consignor_name || null,
      consignee || null,
      notifyParty || null,
      portOfLoading || booking.departure_port || null,
      portOfDischarge || booking.arrival_port || null,
      vesselName || booking.vessel_name || null,
      voyageNumber || booking.voyage_number || null,
      containerCount || booking.container_count || 0,
      grossWeight || booking.cargo_weight || null,
      measurement || booking.cargo_volume || null
    );

    return { id: result.lastInsertRowid, billNo };
  });

  const result = transaction();

  auditService.logAction({
    mainId,
    userId,
    userRole,
    action: 'create_bill',
    tableName: 'bills_of_lading',
    recordId: result.id,
    newValue: { billNo: result.billNo, ...options },
  });

  return {
    success: true,
    data: {
      id: result.id,
      billNo: result.billNo,
    },
  };
};

const lockBill = (mainId, userId, userRole) => {
  const booking = bookingService.getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  if (booking.status !== BOOKING_STATUSES.PENDING_BILL_RELEASE) {
    return { success: false, message: '当前状态不允许锁定提单' };
  }

  const bill = getBillByMainId(mainId);
  if (!bill) {
    return { success: false, message: '提单不存在，请先创建提单' };
  }

  if (bill.is_locked === 1) {
    if (bill.lock_by === userId) {
      return { success: true, data: { message: '提单已被您锁定' } };
    }
    return { 
      success: false, 
      message: '提单已被其他用户锁定', 
      locker: bill.locker_name 
    };
  }

  const transaction = db.transaction(() => {
    const updateBill = db.prepare(`
      UPDATE bills_of_lading 
      SET is_locked = 1, lock_by = ?, locked_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `);

    updateBill.run(userId, bill.id);

    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (
        main_id, from_status, to_status, transition_type,
        operator_id, operator_role, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertTransition.run(
      mainId,
      booking.status,
      booking.status,
      'lock_bill',
      userId,
      userRole,
      '提单已锁定'
    );
  });

  transaction();

  auditService.logAction({
    mainId,
    userId,
    userRole,
    action: AUDIT_ACTIONS.LOCK_BILL,
    tableName: 'bills_of_lading',
    recordId: bill.id,
    newValue: { isLocked: true },
  });

  return {
    success: true,
    data: {
      billId: bill.id,
      billNo: bill.bill_no,
      isLocked: true,
      lockedAt: new Date().toISOString(),
    },
  };
};

const unlockBill = (mainId, userId, userRole) => {
  const bill = getBillByMainId(mainId);
  if (!bill) {
    return { success: false, message: '提单不存在' };
  }

  if (bill.is_locked !== 1) {
    return { success: true, data: { message: '提单未锁定' } };
  }

  if (bill.lock_by !== userId && userRole !== ROLES.SHIPPING_COMPANY) {
    return { success: false, message: '只有锁定人或船公司可以解锁提单' };
  }

  const transaction = db.transaction(() => {
    const updateBill = db.prepare(`
      UPDATE bills_of_lading 
      SET is_locked = 0, lock_by = NULL, locked_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateBill.run(bill.id);
  });

  transaction();

  auditService.logAction({
    mainId,
    userId,
    userRole,
    action: AUDIT_ACTIONS.UNLOCK_BILL,
    tableName: 'bills_of_lading',
    recordId: bill.id,
    newValue: { isLocked: false },
  });

  return {
    success: true,
    data: {
      billId: bill.id,
      billNo: bill.bill_no,
      isLocked: false,
    },
  };
};

const releaseBill = (options) => {
  const {
    mainId,
    userId,
    userRole,
    comment,
  } = options;

  const booking = bookingService.getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  if (booking.status !== BOOKING_STATUSES.PENDING_BILL_RELEASE) {
    return { success: false, message: '当前状态不允许放单' };
  }

  let bill = getBillByMainId(mainId);
  
  if (!bill) {
    const createResult = createBill({
      mainId,
      userId,
      userRole,
    });
    if (!createResult.success) {
      return createResult;
    }
    bill = getBillByMainId(mainId);
  }

  if (bill.is_locked === 1 && bill.lock_by !== userId) {
    return { success: false, message: '提单已被其他用户锁定' };
  }

  const transaction = db.transaction(() => {
    const updateBill = db.prepare(`
      UPDATE bills_of_lading 
      SET status = 'released', release_date = date('now'), 
          is_locked = 0, lock_by = NULL, locked_at = NULL,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    updateBill.run(bill.id);

    const updateMain = db.prepare(`
      UPDATE booking_mains 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateMain.run(BOOKING_STATUSES.COMPLETED, mainId);

    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (
        main_id, from_status, to_status, transition_type,
        operator_id, operator_role, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertTransition.run(
      mainId,
      booking.status,
      BOOKING_STATUSES.COMPLETED,
      'release_bill',
      userId,
      userRole,
      comment || null
    );
  });

  transaction();

  auditService.logAction({
    mainId,
    userId,
    userRole,
    action: AUDIT_ACTIONS.RELEASE_BILL,
    tableName: 'bills_of_lading',
    recordId: bill.id,
    newValue: { status: 'released', comment },
  });

  messageService.createMessage({
    mainId,
    messageType: MESSAGE_TYPES.BILL_RELEASED,
    title: `提单已放单: ${booking.main_order_no}`,
    content: `提单号: ${bill.bill_no}，放单完成`,
    assignedRole: ROLES.CONSIGNOR,
    priority: 'high',
  });

  return {
    success: true,
    data: {
      mainId,
      billId: bill.id,
      billNo: bill.bill_no,
      status: BOOKING_STATUSES.COMPLETED,
    },
  };
};

const updateBill = (options) => {
  const {
    id,
    mainId,
    consignor,
    consignee,
    notifyParty,
    portOfLoading,
    portOfDischarge,
    vesselName,
    voyageNumber,
    containerCount,
    grossWeight,
    measurement,
    userId,
    userRole,
  } = options;

  const bill = getBillById(id);
  if (!bill) {
    return { success: false, message: '提单不存在' };
  }

  if (bill.is_locked === 1 && bill.lock_by !== userId) {
    return { success: false, message: '提单已被锁定，无法修改' };
  }

  if (bill.status === 'released') {
    return { success: false, message: '提单已放单，无法修改' };
  }

  const updateStmt = db.prepare(`
    UPDATE bills_of_lading 
    SET consignor = ?, consignee = ?, notify_party = ?,
        port_of_loading = ?, port_of_discharge = ?, 
        vessel_name = ?, voyage_number = ?,
        container_count = ?, gross_weight = ?, measurement = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  const result = updateStmt.run(
    consignor || bill.consignor,
    consignee || bill.consignee,
    notifyParty || bill.notify_party,
    portOfLoading || bill.port_of_loading,
    portOfDischarge || bill.port_of_discharge,
    vesselName || bill.vessel_name,
    voyageNumber || bill.voyage_number,
    containerCount !== undefined ? containerCount : bill.container_count,
    grossWeight !== undefined ? grossWeight : bill.gross_weight,
    measurement !== undefined ? measurement : bill.measurement,
    id
  );

  if (result.changes === 0) {
    return { success: false, message: '提单未更新' };
  }

  auditService.logAction({
    mainId: bill.main_id,
    userId,
    userRole,
    action: AUDIT_ACTIONS.UPDATE_BOOKING,
    tableName: 'bills_of_lading',
    recordId: id,
    newValue: options,
  });

  return {
    success: true,
    data: {
      id,
      updated: true,
    },
  };
};

module.exports = {
  getBillByMainId,
  getBillById,
  createBill,
  lockBill,
  unlockBill,
  releaseBill,
  updateBill,
};
