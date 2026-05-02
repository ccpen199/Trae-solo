const { get, run, all, transaction } = require('../database');
const { BILL_STATUSES } = require('../database/init');

const STATUS_TRANSITIONS = {
  [BILL_STATUSES.PENDING_INPUT]: {
    allowedActions: ['submit', 'delete', 'edit'],
    nextStatuses: [BILL_STATUSES.PENDING_ENDORSEMENT],
    allowedRoles: ['finance', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: null
    }
  },
  [BILL_STATUSES.PENDING_ENDORSEMENT]: {
    allowedActions: ['approve', 'reject', 'request_info', 'reassign'],
    nextStatuses: [BILL_STATUSES.PENDING_DISCOUNT, BILL_STATUSES.PENDING_INPUT],
    allowedRoles: ['finance', 'bank', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: 'bank'
    }
  },
  [BILL_STATUSES.PENDING_DISCOUNT]: {
    allowedActions: ['apply', 'approve', 'reject'],
    nextStatuses: [BILL_STATUSES.PENDING_MATURITY, BILL_STATUSES.PENDING_ENDORSEMENT],
    allowedRoles: ['finance', 'bank', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: 'bank'
    }
  },
  [BILL_STATUSES.PENDING_MATURITY]: {
    allowedActions: ['process', 'remind', 'lock'],
    nextStatuses: [BILL_STATUSES.ARCHIVED],
    allowedRoles: ['finance', 'bank', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: 'bank'
    }
  },
  [BILL_STATUSES.ARCHIVED]: {
    allowedActions: ['view', 'unarchive'],
    nextStatuses: [BILL_STATUSES.PENDING_MATURITY],
    allowedRoles: ['finance', 'auditor', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: 'auditor'
    }
  },
  [BILL_STATUSES.DIFFERENCE]: {
    allowedActions: ['resolve', 'reassign', 'view'],
    nextStatuses: ['pending_input', 'pending_endorsement', 'pending_discount', 'pending_maturity'],
    allowedRoles: ['finance', 'admin'],
    responsibilities: {
      owner: 'finance',
      approver: 'admin'
    }
  }
};

const canPerformAction = (currentStatus, action, userRole) => {
  const statusConfig = STATUS_TRANSITIONS[currentStatus];
  
  if (!statusConfig) {
    return {
      allowed: false,
      reason: `未知的状态: ${currentStatus}`
    };
  }

  if (!statusConfig.allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: `状态 ${currentStatus} 下不允许执行 ${action} 操作`
    };
  }

  if (!statusConfig.allowedRoles.includes(userRole) && userRole !== 'admin') {
    return {
      allowed: false,
      reason: `角色 ${userRole} 没有权限执行此操作`
    };
  }

  return {
    allowed: true
  };
};

const getNextStatus = (currentStatus, action) => {
  const statusConfig = STATUS_TRANSITIONS[currentStatus];
  
  if (!statusConfig) {
    return null;
  }

  const actionStatusMap = {
    [BILL_STATUSES.PENDING_INPUT]: {
      'submit': BILL_STATUSES.PENDING_ENDORSEMENT
    },
    [BILL_STATUSES.PENDING_ENDORSEMENT]: {
      'approve': BILL_STATUSES.PENDING_DISCOUNT,
      'reject': BILL_STATUSES.PENDING_INPUT,
      'request_info': BILL_STATUSES.PENDING_INPUT,
      'reassign': BILL_STATUSES.PENDING_ENDORSEMENT
    },
    [BILL_STATUSES.PENDING_DISCOUNT]: {
      'apply': BILL_STATUSES.PENDING_MATURITY,
      'approve': BILL_STATUSES.PENDING_MATURITY,
      'reject': BILL_STATUSES.PENDING_ENDORSEMENT
    },
    [BILL_STATUSES.PENDING_MATURITY]: {
      'process': BILL_STATUSES.ARCHIVED
    },
    [BILL_STATUSES.ARCHIVED]: {
      'unarchive': BILL_STATUSES.PENDING_MATURITY
    }
  };

  return actionStatusMap[currentStatus]?.[action] || null;
};

const createBill = async (billData, operatorId) => {
  return transaction(async () => {
    const existingBill = await get(
      `SELECT id FROM bills WHERE bill_number = ? AND is_deleted = 0`,
      [billData.billNumber]
    );

    if (existingBill) {
      throw new Error(`票据编号 ${billData.billNumber} 已存在`);
    }

    const billNo = `BL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = await run(`
      INSERT INTO bills 
      (bill_no, bill_type, bill_number, amount, currency, drawer, acceptor, 
       payee, issue_date, maturity_date, status, responsible_person_id, 
       expected_complete_date, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billNo,
      billData.billType,
      billData.billNumber,
      billData.amount,
      billData.currency || 'CNY',
      billData.drawer,
      billData.acceptor,
      billData.payee,
      billData.issueDate,
      billData.maturityDate,
      BILL_STATUSES.PENDING_INPUT,
      billData.responsiblePersonId || null,
      billData.expectedCompleteDate || null,
      operatorId,
      operatorId
    ]);

    const billId = result.lastID;

    if (billData.details && billData.details.length > 0) {
      for (const detail of billData.details) {
        const detailNo = `DL${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await run(`
          INSERT INTO bill_details 
          (bill_id, detail_no, item_type, amount, description, 
           related_bill_no, related_company, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          billId,
          detailNo,
          detail.itemType,
          detail.amount,
          detail.description,
          detail.relatedBillNo,
          detail.relatedCompany,
          detail.dueDate
        ]);
      }
    }

    await run(`
      INSERT INTO bill_status_history 
      (bill_id, from_status, to_status, action, operator_id, comment, created_at)
      VALUES (?, NULL, ?, 'create', ?, '票据创建', CURRENT_TIMESTAMP)
    `, [billId, BILL_STATUSES.PENDING_INPUT, operatorId]);

    if (billData.responsiblePersonId) {
      const operator = await get(`SELECT name FROM users WHERE id = ?`, [operatorId]);
      await run(`
        INSERT INTO notifications 
        (notification_no, user_id, title, content, related_bill_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `NT${Date.now()}${Math.floor(Math.random() * 1000)}`,
        billData.responsiblePersonId,
        '新票据待录入',
        `${operator?.name || '系统'} 为您分配了新票据 ${billData.billNumber} 待录入`,
        billId,
        'bill'
      ]);
    }

    return {
      id: billId,
      billNo,
      billNumber: billData.billNumber,
      status: BILL_STATUSES.PENDING_INPUT
    };
  });
};

const transitionStatus = async (billId, action, operatorId, comment = '', metadata = {}) => {
  return transaction(async () => {
    const bill = await get(`SELECT * FROM bills WHERE id = ? AND is_deleted = 0`, [billId]);
    
    if (!bill) {
      throw new Error(`票据 ID ${billId} 不存在`);
    }

    const operator = await get(`SELECT * FROM users WHERE id = ?`, [operatorId]);
    
    if (!operator) {
      throw new Error(`操作员 ID ${operatorId} 不存在`);
    }

    const permissionCheck = canPerformAction(bill.status, action, operator.role);
    
    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason);
    }

    const nextStatus = getNextStatus(bill.status, action);
    
    if (!nextStatus && action !== 'view') {
      throw new Error(`无法从状态 ${bill.status} 执行 ${action} 操作`);
    }

    if (nextStatus && nextStatus !== bill.status) {
      await run(`
        UPDATE bills 
        SET status = ?, 
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
        WHERE id = ?
      `, [nextStatus, operatorId, billId]);

      await run(`
        INSERT INTO bill_status_history 
        (bill_id, from_status, to_status, action, operator_id, operator_name, comment, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        billId,
        bill.status,
        nextStatus,
        action,
        operatorId,
        operator.name,
        comment,
        JSON.stringify(metadata)
      ]);

      const statusConfig = STATUS_TRANSITIONS[nextStatus];
      if (statusConfig && statusConfig.responsibilities) {
        const nextResponsible = await get(
          `SELECT id, name FROM users WHERE role = ? LIMIT 1`,
          [statusConfig.responsibilities.owner]
        );

        if (nextResponsible) {
          await run(`
            INSERT INTO notifications 
            (notification_no, user_id, title, content, related_bill_id, related_type)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            `NT${Date.now()}${Math.floor(Math.random() * 1000)}`,
            nextResponsible.id,
            `票据状态更新`,
            `票据 ${bill.bill_number} 状态已变更为 ${getStatusLabel(nextStatus)}，请及时处理`,
            billId,
            'bill'
          ]);
        }
      }
    }

    await run(`
      INSERT INTO operation_logs 
      (log_no, bill_id, operation_type, operation_module, operator_id, operator_name, 
       request_method, request_path, response_status, response_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
      billId,
      action,
      'status_transition',
      operatorId,
      operator.name,
      'POST',
      `/api/bills/${billId}/action`,
      'success',
      comment || `执行操作: ${action}`
    ]);

    return {
      billId,
      previousStatus: bill.status,
      currentStatus: nextStatus || bill.status,
      action,
      operatorName: operator.name,
      timestamp: new Date().toISOString()
    };
  });
};

const getStatusLabel = (status) => {
  const labels = {
    [BILL_STATUSES.PENDING_INPUT]: '待票据录入',
    [BILL_STATUSES.PENDING_ENDORSEMENT]: '待背书流转',
    [BILL_STATUSES.PENDING_DISCOUNT]: '待贴现申请',
    [BILL_STATUSES.PENDING_MATURITY]: '待到期提示',
    [BILL_STATUSES.ARCHIVED]: '已归档',
    [BILL_STATUSES.DIFFERENCE]: '差异处理中'
  };
  return labels[status] || status;
};

const getLedgerSummary = async (filters = {}) => {
  let whereClause = 'WHERE is_deleted = 0';
  const params = [];

  if (filters.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.billType) {
    whereClause += ' AND bill_type = ?';
    params.push(filters.billType);
  }

  if (filters.responsiblePersonId) {
    whereClause += ' AND responsible_person_id = ?';
    params.push(filters.responsiblePersonId);
  }

  const summary = await get(`
    SELECT 
      COUNT(*) as totalCount,
      SUM(amount) as totalAmount,
      AVG(amount) as avgAmount,
      SUM(CASE WHEN status = 'pending_input' THEN 1 ELSE 0 END) as pendingInputCount,
      SUM(CASE WHEN status = 'pending_endorsement' THEN 1 ELSE 0 END) as pendingEndorsementCount,
      SUM(CASE WHEN status = 'pending_discount' THEN 1 ELSE 0 END) as pendingDiscountCount,
      SUM(CASE WHEN status = 'pending_maturity' THEN 1 ELSE 0 END) as pendingMaturityCount,
      SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archivedCount,
      SUM(CASE WHEN status = 'difference' THEN 1 ELSE 0 END) as differenceCount
    FROM bills
    ${whereClause}
  `, params);

  const statusBreakdown = await all(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(amount) as totalAmount
    FROM bills
    ${whereClause}
    GROUP BY status
    ORDER BY status
  `, params);

  const typeBreakdown = await all(`
    SELECT 
      bill_type,
      COUNT(*) as count,
      SUM(amount) as totalAmount
    FROM bills
    ${whereClause}
    GROUP BY bill_type
    ORDER BY bill_type
  `, params);

  return {
    summary: {
      ...summary,
      totalCount: summary.totalCount || 0,
      totalAmount: summary.totalAmount || 0,
      avgAmount: summary.avgAmount || 0
    },
    statusBreakdown: statusBreakdown.map(item => ({
      status: item.status,
      statusLabel: getStatusLabel(item.status),
      count: item.count,
      totalAmount: item.totalAmount
    })),
    typeBreakdown
  };
};

const getBillById = async (billId) => {
  const bill = await get(`
    SELECT b.*, 
           u1.name as responsible_person_name,
           u2.name as created_by_name,
           u3.name as updated_by_name
    FROM bills b
    LEFT JOIN users u1 ON b.responsible_person_id = u1.id
    LEFT JOIN users u2 ON b.created_by = u2.id
    LEFT JOIN users u3 ON b.updated_by = u3.id
    WHERE b.id = ? AND b.is_deleted = 0
  `, [billId]);

  if (!bill) {
    return null;
  }

  const details = await all(`
    SELECT * FROM bill_details WHERE bill_id = ? AND is_deleted = 0
  `, [billId]);

  const statusHistory = await all(`
    SELECT h.*, u.name as operator_name
    FROM bill_status_history h
    LEFT JOIN users u ON h.operator_id = u.id
    WHERE h.bill_id = ?
    ORDER BY h.created_at DESC
  `, [billId]);

  return {
    ...bill,
    statusLabel: getStatusLabel(bill.status),
    details,
    statusHistory,
    allowedActions: STATUS_TRANSITIONS[bill.status]?.allowedActions || []
  };
};

const getBillsList = async (filters = {}, pagination = {}) => {
  let whereClause = 'WHERE b.is_deleted = 0';
  const params = [];

  if (filters.status) {
    whereClause += ' AND b.status = ?';
    params.push(filters.status);
  }

  if (filters.billType) {
    whereClause += ' AND b.bill_type = ?';
    params.push(filters.billType);
  }

  if (filters.billNumber) {
    whereClause += ' AND b.bill_number LIKE ?';
    params.push(`%${filters.billNumber}%`);
  }

  if (filters.responsiblePersonId) {
    whereClause += ' AND b.responsible_person_id = ?';
    params.push(filters.responsiblePersonId);
  }

  if (filters.startDate) {
    whereClause += ' AND b.created_at >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClause += ' AND b.created_at <= ?';
    params.push(filters.endDate);
  }

  const countResult = await get(`
    SELECT COUNT(*) as total FROM bills b ${whereClause}
  `, params);

  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const bills = await all(`
    SELECT b.*, 
           u1.name as responsible_person_name,
           u2.name as created_by_name
    FROM bills b
    LEFT JOIN users u1 ON b.responsible_person_id = u1.id
    LEFT JOIN users u2 ON b.created_by = u2.id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset]);

  return {
    bills: bills.map(bill => ({
      ...bill,
      statusLabel: getStatusLabel(bill.status)
    })),
    pagination: {
      page,
      pageSize,
      total: countResult.total,
      totalPages: Math.ceil(countResult.total / pageSize)
    }
  };
};

module.exports = {
  STATUS_TRANSITIONS,
  canPerformAction,
  getNextStatus,
  getStatusLabel,
  createBill,
  transitionStatus,
  getLedgerSummary,
  getBillById,
  getBillsList
};
