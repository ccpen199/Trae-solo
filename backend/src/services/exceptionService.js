const db = require('../database/config');
const { 
  EXCEPTION_TYPES,
  ROLES,
  MESSAGE_TYPES,
} = require('../utils/constants');
const bookingService = require('./bookingService');
const messageService = require('./messageService');
const auditService = require('./auditService');

const createException = (options) => {
  const {
    mainId,
    detailId,
    exceptionType,
    title,
    description,
    originalData,
    compensationData,
    priority,
  } = options;

  const validTypes = Object.values(EXCEPTION_TYPES);
  if (!validTypes.includes(exceptionType)) {
    return { success: false, message: '无效的异常类型' };
  }

  const stmt = db.prepare(`
    INSERT INTO exceptions (
      main_id, detail_id, exception_type, title, description,
      original_data, compensation_data, status, priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
  `);

  const result = stmt.run(
    mainId || null,
    detailId || null,
    exceptionType,
    title,
    description || null,
    originalData ? JSON.stringify(originalData) : null,
    compensationData ? JSON.stringify(compensationData) : null,
    priority || 'high'
  );

  const exceptionId = result.lastInsertRowid;

  messageService.createMessage({
    mainId,
    detailId,
    messageType: MESSAGE_TYPES.EXCEPTION,
    title: `异常告警: ${title}`,
    content: description,
    assignedRole: ROLES.FORWARDER,
    priority: 'high',
  });

  if (mainId) {
    auditService.logAction({
      mainId,
      detailId,
      action: 'create_exception',
      tableName: 'exceptions',
      recordId: exceptionId,
      newValue: { exceptionType, title, description },
    });
  }

  return {
    success: true,
    data: {
      id: exceptionId,
      exceptionType,
      title,
    },
  };
};

const getExceptionById = (id) => {
  const stmt = db.prepare(`
    SELECT 
      e.*,
      bm.main_order_no,
      u.name as handler_name
    FROM exceptions e
    LEFT JOIN booking_mains bm ON e.main_id = bm.id
    LEFT JOIN users u ON e.assigned_to = u.id
    WHERE e.id = ?
  `);

  const exception = stmt.get(id);
  
  if (exception) {
    return {
      ...exception,
      original_data: exception.original_data ? JSON.parse(exception.original_data) : null,
      compensation_data: exception.compensation_data ? JSON.parse(exception.compensation_data) : null,
    };
  }

  return null;
};

const getExceptions = (options = {}) => {
  const {
    status,
    mainId,
    exceptionType,
    priority,
    assignedTo,
    limit = 50,
    offset = 0,
  } = options;

  let conditions = [];
  let params = [];

  if (status && status !== 'all') {
    conditions.push('e.status = ?');
    params.push(status);
  }
  if (mainId) {
    conditions.push('e.main_id = ?');
    params.push(mainId);
  }
  if (exceptionType) {
    conditions.push('e.exception_type = ?');
    params.push(exceptionType);
  }
  if (priority) {
    conditions.push('e.priority = ?');
    params.push(priority);
  }
  if (assignedTo) {
    conditions.push('(e.assigned_to = ? OR e.assigned_to IS NULL)');
    params.push(assignedTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM exceptions e ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT 
      e.*,
      bm.main_order_no,
      u.name as handler_name
    FROM exceptions e
    LEFT JOIN booking_mains bm ON e.main_id = bm.id
    LEFT JOIN users u ON e.assigned_to = u.id
    ${whereClause}
    ORDER BY 
      CASE e.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        ELSE 4 
      END,
      e.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params).map(exception => ({
    ...exception,
    original_data: exception.original_data ? JSON.parse(exception.original_data) : null,
    compensation_data: exception.compensation_data ? JSON.parse(exception.compensation_data) : null,
  }));

  return {
    total,
    data,
    limit,
    offset,
  };
};

const handleException = (options) => {
  const {
    exceptionId,
    userId,
    userRole,
    action,
    handlerComment,
    compensationData,
  } = options;

  const exception = getExceptionById(exceptionId);
  if (!exception) {
    return { success: false, message: '异常记录不存在' };
  }

  const validActions = ['resolve', 'escalate', 'dismiss'];
  if (!validActions.includes(action)) {
    return { success: false, message: '无效的处理操作' };
  }

  const transaction = db.transaction(() => {
    let newStatus = exception.status;

    if (action === 'resolve') {
      newStatus = 'resolved';
    } else if (action === 'dismiss') {
      newStatus = 'dismissed';
    }

    const updateStmt = db.prepare(`
      UPDATE exceptions 
      SET status = ?, assigned_to = ?, handled_at = datetime('now'), 
          handler_comment = ?, compensation_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(
      newStatus,
      userId,
      handlerComment || null,
      compensationData ? JSON.stringify(compensationData) : exception.compensation_data,
      exceptionId
    );
  });

  transaction();

  if (exception.main_id) {
    auditService.logAction({
      mainId: exception.main_id,
      detailId: exception.detail_id,
      userId,
      userRole,
      action: `handle_exception_${action}`,
      tableName: 'exceptions',
      recordId: exceptionId,
      newValue: { action, handlerComment, newStatus: action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : exception.status },
    });
  }

  return {
    success: true,
    data: {
      exceptionId,
      action,
      handlerComment,
    },
  };
};

const getExceptionStatistics = () => {
  const stmt = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM exceptions
    GROUP BY status
  `);

  const results = stmt.all();
  const stats = { total: 0 };

  for (const row of results) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }

  return stats;
};

const reportPositionDrift = (options) => {
  const {
    mainId,
    detailId,
    expectedLocation,
    actualLocation,
    deviationDistance,
    timestamp,
  } = options;

  return createException({
    mainId,
    detailId,
    exceptionType: EXCEPTION_TYPES.POSITION_DRIFT,
    title: '定位漂移',
    description: `货物位置发生漂移。期望位置: ${expectedLocation}, 实际位置: ${actualLocation}, 偏移距离: ${deviationDistance}`,
    originalData: {
      expectedLocation,
      actualLocation,
      deviationDistance,
      timestamp,
    },
    priority: 'high',
  });
};

const reportRouteDeviation = (options) => {
  const {
    mainId,
    detailId,
    plannedRoute,
    actualRoute,
    deviationReason,
  } = options;

  return createException({
    mainId,
    detailId,
    exceptionType: EXCEPTION_TYPES.ROUTE_DEVIATION,
    title: '路线偏离',
    description: `运输路线偏离计划路线。偏离原因: ${deviationReason || '未说明'}`,
    originalData: {
      plannedRoute,
      actualRoute,
      deviationReason,
    },
    priority: 'high',
  });
};

const reportDriverRefuse = (options) => {
  const {
    mainId,
    detailId,
    driverName,
    driverPhone,
    refuseReason,
  } = options;

  return createException({
    mainId,
    detailId,
    exceptionType: EXCEPTION_TYPES.DRIVER_REFUSE,
    title: '司机拒接',
    description: `司机 ${driverName} (${driverPhone}) 拒绝接单。原因: ${refuseReason || '未说明'}`,
    originalData: {
      driverName,
      driverPhone,
      refuseReason,
    },
    priority: 'critical',
  });
};

const reportArrivalUnconfirmed = (options) => {
  const {
    mainId,
    detailId,
    expectedArrivalTime,
    actualTime,
    location,
  } = options;

  return createException({
    mainId,
    detailId,
    exceptionType: EXCEPTION_TYPES.ARRIVAL_UNCONFIRMED,
    title: '到达未确认',
    description: `货物到达后未确认。期望到达时间: ${expectedArrivalTime}, 当前时间: ${actualTime}, 位置: ${location}`,
    originalData: {
      expectedArrivalTime,
      actualTime,
      location,
    },
    priority: 'high',
  });
};

const reportMapCallbackDelay = (options) => {
  const {
    mainId,
    detailId,
    requestId,
    expectedResponseTime,
    actualDelay,
    lastKnownStatus,
  } = options;

  return createException({
    mainId,
    detailId,
    exceptionType: EXCEPTION_TYPES.MAP_CALLBACK_DELAY,
    title: '地图回调延迟',
    description: `第三方地图API回调延迟。请求ID: ${requestId}, 期望响应时间: ${expectedResponseTime}秒, 实际延迟: ${actualDelay}秒`,
    originalData: {
      requestId,
      expectedResponseTime,
      actualDelay,
      lastKnownStatus,
    },
    priority: 'normal',
  });
};

module.exports = {
  createException,
  getExceptionById,
  getExceptions,
  handleException,
  getExceptionStatistics,
  reportPositionDrift,
  reportRouteDeviation,
  reportDriverRefuse,
  reportArrivalUnconfirmed,
  reportMapCallbackDelay,
};
