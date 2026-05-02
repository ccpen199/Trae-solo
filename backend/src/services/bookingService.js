const db = require('../database/config');
const { 
  BOOKING_STATUSES, 
  STATUS_TRANSITIONS, 
  ROLES, 
  MESSAGE_TYPES,
  AUDIT_ACTIONS,
} = require('../utils/constants');
const { generateOrderNo, generateDetailNo, formatDateTime } = require('../utils/helpers');
const auditService = require('./auditService');
const messageService = require('./messageService');

const getBookingById = (id) => {
  const stmt = db.prepare(`
    SELECT 
      bm.*,
      ss.vessel_name,
      ss.voyage_number,
      ss.departure_date as schedule_departure_date,
      ss.arrival_date as schedule_arrival_date,
      consignor.name as consignor_name,
      forwarder.name as forwarder_name,
      shipping.name as shipping_company_name,
      creator.name as creator_name
    FROM booking_mains bm
    LEFT JOIN shipping_schedules ss ON bm.schedule_id = ss.id
    LEFT JOIN users consignor ON bm.consignor_id = consignor.id
    LEFT JOIN users forwarder ON bm.forwarder_id = forwarder.id
    LEFT JOIN users shipping ON bm.shipping_company_id = shipping.id
    LEFT JOIN users creator ON bm.created_by = creator.id
    WHERE bm.id = ? AND bm.is_deleted = 0
  `);

  return stmt.get(id);
};

const getBookingByOrderNo = (orderNo) => {
  const stmt = db.prepare(`
    SELECT 
      bm.*,
      ss.vessel_name,
      ss.voyage_number,
      ss.departure_date as schedule_departure_date,
      ss.arrival_date as schedule_arrival_date
    FROM booking_mains bm
    LEFT JOIN shipping_schedules ss ON bm.schedule_id = ss.id
    WHERE bm.main_order_no = ? AND bm.is_deleted = 0
  `);

  return stmt.get(orderNo);
};

const getBookings = (options = {}) => {
  const { 
    status, 
    consignorId, 
    forwarderId, 
    shippingCompanyId,
    searchText,
    startDate,
    endDate,
    limit = 20, 
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options;

  let conditions = ['bm.is_deleted = 0'];
  let params = [];

  if (status) {
    conditions.push('bm.status = ?');
    params.push(status);
  }
  if (consignorId) {
    conditions.push('bm.consignor_id = ?');
    params.push(consignorId);
  }
  if (forwarderId) {
    conditions.push('bm.forwarder_id = ?');
    params.push(forwarderId);
  }
  if (shippingCompanyId) {
    conditions.push('bm.shipping_company_id = ?');
    params.push(shippingCompanyId);
  }
  if (searchText) {
    conditions.push('(bm.main_order_no LIKE ? OR bm.cargo_name LIKE ?)');
    params.push(`%${searchText}%`, `%${searchText}%`);
  }
  if (startDate) {
    conditions.push('bm.created_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('bm.created_at <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM booking_mains bm
    WHERE ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  const validSortBy = ['created_at', 'updated_at', 'main_order_no', 'deadline'];
  const actualSortBy = validSortBy.includes(sortBy) ? sortBy : 'created_at';
  const actualSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT 
      bm.*,
      ss.vessel_name,
      ss.voyage_number,
      consignor.name as consignor_name,
      forwarder.name as forwarder_name,
      shipping.name as shipping_company_name
    FROM booking_mains bm
    LEFT JOIN shipping_schedules ss ON bm.schedule_id = ss.id
    LEFT JOIN users consignor ON bm.consignor_id = consignor.id
    LEFT JOIN users forwarder ON bm.forwarder_id = forwarder.id
    LEFT JOIN users shipping ON bm.shipping_company_id = shipping.id
    WHERE ${whereClause}
    ORDER BY bm.${actualSortBy} ${actualSortOrder}
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const getBookingsByRole = (userId, role, options = {}) => {
  const updatedOptions = { ...options };
  
  switch (role) {
    case ROLES.CONSIGNOR:
      updatedOptions.consignorId = userId;
      break;
    case ROLES.FORWARDER:
      updatedOptions.forwarderId = userId;
      break;
    case ROLES.SHIPPING_COMPANY:
      updatedOptions.shippingCompanyId = userId;
      break;
  }

  return getBookings(updatedOptions);
};

const getBookingDetails = (mainId) => {
  const stmt = db.prepare(`
    SELECT * FROM booking_details
    WHERE main_id = ?
    ORDER BY detail_no ASC
  `);

  return stmt.all(mainId);
};

const getStatusTransitions = (mainId) => {
  const stmt = db.prepare(`
    SELECT 
      st.*,
      u.name as operator_name,
      u.role as operator_role
    FROM status_transitions st
    LEFT JOIN users u ON st.operator_id = u.id
    WHERE st.main_id = ?
    ORDER BY st.created_at ASC
  `);

  return stmt.all(mainId);
};

const createBooking = (bookingData, userId, userRole) => {
  const {
    scheduleId,
    cargoName,
    cargoWeight,
    cargoVolume,
    containerCount,
    containerType,
    departurePort,
    arrivalPort,
    expectedDepartureDate,
    expectedArrivalDate,
    deadline,
    responsiblePerson,
    attachments,
    remark,
    details,
  } = bookingData;

  const mainOrderNo = generateOrderNo();

  const transaction = db.transaction(() => {
    const insertMain = db.prepare(`
      INSERT INTO booking_mains (
        main_order_no, status, consignor_id, schedule_id,
        cargo_name, cargo_weight, cargo_volume, container_count,
        container_type, departure_port, arrival_port,
        expected_departure_date, expected_arrival_date,
        deadline, responsible_person, attachments, remark,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const mainResult = insertMain.run(
      mainOrderNo,
      BOOKING_STATUSES.PENDING_BOOKING,
      userRole === ROLES.CONSIGNOR ? userId : null,
      scheduleId || null,
      cargoName,
      cargoWeight || null,
      cargoVolume || null,
      containerCount || 0,
      containerType || null,
      departurePort || null,
      arrivalPort || null,
      expectedDepartureDate || null,
      expectedArrivalDate || null,
      deadline || null,
      responsiblePerson || null,
      attachments ? JSON.stringify(attachments) : null,
      remark || null,
      userId
    );

    const mainId = mainResult.lastInsertRowid;

    if (details && details.length > 0) {
      const insertDetail = db.prepare(`
        INSERT INTO booking_details (
          main_id, detail_no, container_type, weight, volume,
          cargo_description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `);

      details.forEach((detail, index) => {
        const detailNo = generateDetailNo(mainOrderNo, index);
        insertDetail.run(
          mainId,
          detailNo,
          detail.containerType || containerType || null,
          detail.weight || null,
          detail.volume || null,
          detail.cargoDescription || null
        );
      });
    }

    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (
        main_id, from_status, to_status, transition_type,
        operator_id, operator_role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertTransition.run(
      mainId,
      '',
      BOOKING_STATUSES.PENDING_BOOKING,
      'create',
      userId,
      userRole
    );

    return { mainId, mainOrderNo };
  });

  const result = transaction();

  auditService.logAction({
    mainId: result.mainId,
    userId,
    userRole,
    action: AUDIT_ACTIONS.CREATE_BOOKING,
    tableName: 'booking_mains',
    recordId: result.mainId,
    newValue: { mainOrderNo: result.mainOrderNo, ...bookingData },
  });

  messageService.createMessage({
    mainId: result.mainId,
    messageType: MESSAGE_TYPES.NEW_BOOKING,
    title: `新订舱单已创建: ${result.mainOrderNo}`,
    content: `货主已创建订舱单，货物名称: ${cargoName}`,
    assignedRole: ROLES.FORWARDER,
    priority: 'high',
  });

  return {
    success: true,
    data: {
      id: result.mainId,
      mainOrderNo: result.mainOrderNo,
      status: BOOKING_STATUSES.PENDING_BOOKING,
    },
  };
};

const validateAction = (currentStatus, action, userRole) => {
  const transitionConfig = STATUS_TRANSITIONS[currentStatus];
  if (!transitionConfig) {
    return { valid: false, reason: '无效的当前状态' };
  }

  if (!transitionConfig.allowedActions.includes(action)) {
    return { valid: false, reason: '当前状态不允许执行此操作' };
  }

  if (!transitionConfig.allowedRoles.includes(userRole)) {
    return { valid: false, reason: '您没有权限执行此操作' };
  }

  return { valid: true };
};

const transitionStatus = (options) => {
  const {
    mainId,
    detailId,
    action,
    userId,
    userRole,
    reason,
    comment,
    attachments,
  } = options;

  const booking = getBookingById(mainId);
  if (!booking) {
    return { success: false, message: '订舱单不存在' };
  }

  const validation = validateAction(booking.status, action, userRole);
  if (!validation.valid) {
    return { success: false, message: validation.reason };
  }

  const transitionConfig = STATUS_TRANSITIONS[booking.status];
  const toStatus = action === 'reject' ? BOOKING_STATUSES.REJECTED : 
                   action === 'cancel' ? BOOKING_STATUSES.CANCELLED :
                   transitionConfig.nextStatus;

  const transaction = db.transaction(() => {
    const updateMain = db.prepare(`
      UPDATE booking_mains 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateMain.run(toStatus, mainId);

    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (
        main_id, detail_id, from_status, to_status, transition_type,
        operator_id, operator_role, reason, comment, attachments, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertTransition.run(
      mainId,
      detailId || null,
      booking.status || '',
      toStatus,
      action,
      userId,
      userRole,
      reason || null,
      comment || null,
      attachments ? JSON.stringify(attachments) : null
    );
  });

  transaction();

  return {
    success: true,
    data: {
      mainId,
      fromStatus: booking.status,
      toStatus,
    },
  };
};

const getStatistics = (options = {}) => {
  const { userId, userRole } = options;

  let conditions = ['is_deleted = 0'];
  let params = [];

  if (userId && userRole) {
    switch (userRole) {
      case ROLES.CONSIGNOR:
        conditions.push('consignor_id = ?');
        params.push(userId);
        break;
      case ROLES.FORWARDER:
        conditions.push('forwarder_id = ?');
        params.push(userId);
        break;
      case ROLES.SHIPPING_COMPANY:
        conditions.push('shipping_company_id = ?');
        params.push(userId);
        break;
    }
  }

  const whereClause = conditions.join(' AND ');

  const statuses = [
    BOOKING_STATUSES.PENDING_BOOKING,
    BOOKING_STATUSES.PENDING_CONTAINER,
    BOOKING_STATUSES.PENDING_PORT_ENTRY,
    BOOKING_STATUSES.PENDING_LOADING,
    BOOKING_STATUSES.PENDING_BILL_RELEASE,
    BOOKING_STATUSES.COMPLETED,
  ];

  const stats = {};

  for (const status of statuses) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM booking_mains
      WHERE ${whereClause} AND status = ?
    `);
    const result = stmt.get(...params, status);
    stats[status] = result.count;
  }

  const totalStmt = db.prepare(`
    SELECT COUNT(*) as count FROM booking_mains
    WHERE ${whereClause}
  `);
  const totalResult = totalStmt.get(...params);
  stats.total = totalResult.count;

  return stats;
};

module.exports = {
  getBookingById,
  getBookingByOrderNo,
  getBookings,
  getBookingsByRole,
  getBookingDetails,
  getStatusTransitions,
  createBooking,
  validateAction,
  transitionStatus,
  getStatistics,
};
