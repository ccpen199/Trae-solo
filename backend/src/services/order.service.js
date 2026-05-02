const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const StatusService = require('./status.service');
const NotificationService = require('./notification.service');
const AuditService = require('./audit.service');
const TaxRuleEngine = require('./engines/tax-rule-engine.service');
const ReconciliationEngine = require('./engines/reconciliation-engine.service');
const DeclarationFormEngine = require('./engines/declaration-form-engine.service');
const RiskCheckEngine = require('./engines/risk-check-engine.service');

const OrderService = {
  generateOrderNo: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `TAX-${year}${month}${day}-${random}`;
  },

  createOrder: (data, operator) => {
    const { 
      taxTypeId, 
      declarationFormId, 
      periodType, 
      periodStart, 
      periodEnd,
      responsiblePersonId,
      expectedCompleteTime,
      details = [],
      attachments = []
    } = data;

    if (!taxTypeId) {
      return { success: false, message: '请选择税种' };
    }

    const taxType = TaxRuleEngine.getTaxTypeById(taxTypeId);
    if (!taxType) {
      return { success: false, message: '税种不存在' };
    }

    if (declarationFormId) {
      const compatibility = DeclarationFormEngine.checkFormCompatibility(declarationFormId, taxTypeId);
      if (!compatibility.compatible) {
        return { success: false, message: compatibility.reason };
      }
    }

    const totalAmount = details.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalTaxAmount = details.reduce((sum, d) => sum + (d.tax_amount || 0), 0);

    const orderId = uuidv4();
    const orderNo = OrderService.generateOrderNo();
    const initialStatus = 'draft';
    const initialStatusDisplay = StatusService.getStatusDisplay(initialStatus);

    const insertOrder = db.prepare(`
      INSERT INTO main_orders (
        id, order_no, tax_type_id, declaration_form_id, period_type,
        period_start, period_end, status, status_display,
        responsible_person_id, expected_complete_time,
        total_amount, total_tax_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId, orderNo, taxTypeId, declarationFormId, periodType,
      periodStart, periodEnd, initialStatus, initialStatusDisplay,
      responsiblePersonId, expectedCompleteTime,
      totalAmount, totalTaxAmount, operator.id
    );

    const insertDetail = db.prepare(`
      INSERT INTO order_details (
        id, main_order_id, detail_no, voucher_no, voucher_date,
        item_name, item_type, amount, tax_rate, tax_amount,
        deduction_amount, net_amount, tax_type_id, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    details.forEach((detail, index) => {
      const taxRate = detail.tax_rate || taxType.tax_rate;
      const taxAmount = detail.tax_amount || (detail.amount || 0) * taxRate;
      const netAmount = (detail.amount || 0) - (detail.deduction_amount || 0);

      insertDetail.run(
        uuidv4(), orderId, `DETAIL-${String(index + 1).padStart(4, '0')}`,
        detail.voucher_no, detail.voucher_date,
        detail.item_name, detail.item_type,
        detail.amount || 0, taxRate, taxAmount,
        detail.deduction_amount || 0, netAmount,
        taxTypeId, detail.remarks
      );
    });

    StatusService.transitionStatus(
      orderId, null, initialStatus, operator.id, operator.realName,
      'create', '创建单据', '系统初始化状态'
    );

    if (responsiblePersonId && responsiblePersonId !== operator.id) {
      NotificationService.createTodo(
        responsiblePersonId, orderId,
        `新的税务申报待处理：${orderNo}`,
        `您有一个新的税务申报单据待处理，单号：${orderNo}`
      );
    }

    AuditService.log(
      operator.id, operator.realName,
      'order', 'create', 'main_order', orderId,
      null, { orderNo, taxTypeId, totalAmount },
      ''
    );

    return {
      success: true,
      data: {
        id: orderId,
        orderNo,
        status: initialStatus,
        statusDisplay: initialStatusDisplay
      }
    };
  },

  getOrderById: (orderId, includeDetails = true) => {
    const order = db.prepare(`
      SELECT mo.*, 
        tt.tax_name, tt.tax_code, tt.tax_rate,
        df.form_name, df.form_code,
        u1.real_name as created_by_name,
        u2.real_name as responsible_person_name
      FROM main_orders mo
      LEFT JOIN tax_types tt ON mo.tax_type_id = tt.id
      LEFT JOIN declaration_forms df ON mo.declaration_form_id = df.id
      LEFT JOIN users u1 ON mo.created_by = u1.id
      LEFT JOIN users u2 ON mo.responsible_person_id = u2.id
      WHERE mo.id = ?
    `).get(orderId);

    if (!order) return null;

    if (includeDetails) {
      order.details = db.prepare(`
        SELECT od.*, tt.tax_name
        FROM order_details od
        LEFT JOIN tax_types tt ON od.tax_type_id = tt.id
        WHERE od.main_order_id = ?
        ORDER BY od.detail_no
      `).all(orderId);

      order.statusFlows = db.prepare(`
        SELECT sf.*, u.real_name as operator_name
        FROM status_flows sf
        LEFT JOIN users u ON sf.operator_id = u.id
        WHERE sf.main_order_id = ?
        ORDER BY sf.created_at ASC
      `).all(orderId);

      order.riskChecks = RiskCheckEngine.getRiskSummary(orderId);
      order.reconciliationLogs = ReconciliationEngine.getReconciliationLogs(orderId);
    }

    return order;
  },

  getOrderList: (filters = {}, pagination = {}) => {
    let sql = `
      SELECT mo.*, 
        tt.tax_name, tt.tax_code,
        u1.real_name as created_by_name,
        u2.real_name as responsible_person_name
      FROM main_orders mo
      LEFT JOIN tax_types tt ON mo.tax_type_id = tt.id
      LEFT JOIN users u1 ON mo.created_by = u1.id
      LEFT JOIN users u2 ON mo.responsible_person_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    const countSql = `
      SELECT COUNT(*) as total 
      FROM main_orders mo
      WHERE 1=1
    `;
    const countParams = [];

    if (filters.status) {
      sql += ' AND mo.status = ?';
      params.push(filters.status);
    }
    if (filters.taxTypeId) {
      sql += ' AND mo.tax_type_id = ?';
      params.push(filters.taxTypeId);
    }
    if (filters.responsiblePersonId) {
      sql += ' AND mo.responsible_person_id = ?';
      params.push(filters.responsiblePersonId);
    }
    if (filters.createdBy) {
      sql += ' AND mo.created_by = ?';
      params.push(filters.createdBy);
    }
    if (filters.keyword) {
      sql += ' AND (mo.order_no LIKE ? OR u1.real_name LIKE ?)';
      const keyword = `%${filters.keyword}%`;
      params.push(keyword, keyword);
    }
    if (filters.periodStart) {
      sql += ' AND date(mo.created_at) >= date(?)';
      params.push(filters.periodStart);
    }
    if (filters.periodEnd) {
      sql += ' AND date(mo.created_at) <= date(?)';
      params.push(filters.periodEnd);
    }

    sql += ' ORDER BY mo.created_at DESC';

    if (pagination.page && pagination.pageSize) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      sql += ' LIMIT ? OFFSET ?';
      params.push(pagination.pageSize, offset);
    }

    const list = db.prepare(sql).all(...params);
    
    const totalResult = db.prepare(countSql).get(...countParams);
    const total = totalResult?.total || 0;

    return {
      list,
      pagination: {
        page: pagination.page || 1,
        pageSize: pagination.pageSize || 20,
        total,
        totalPages: Math.ceil(total / (pagination.pageSize || 20))
      }
    };
  },

  submitToTaxCalculation: (orderId, operator) => {
    const order = OrderService.getOrderById(orderId, false);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status !== 'draft') {
      return { success: false, message: '当前状态不允许提交' };
    }

    if (!order.details || order.details.length === 0) {
      const details = db.prepare('SELECT * FROM order_details WHERE main_order_id = ?').all(orderId);
      if (details.length === 0) {
        return { success: false, message: '请至少添加一条明细' };
      }
    }

    const reconciliation = ReconciliationEngine.checkReconciliation(orderId);
    if (!reconciliation.valid) {
      return { 
        success: false, 
        message: '对账检查失败',
        errors: reconciliation.errors
      };
    }

    const nextStatus = 'pending_tax_calculation';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'submit', '提交单据进入税额计算', '从草稿提交'
    );

    if (order.responsible_person_id) {
      NotificationService.createTodo(
        order.responsible_person_id, orderId,
        `税额计算待处理：${order.order_no}`,
        `单据 ${order.order_no} 已提交，需要进行税额计算`
      );
    }

    AuditService.log(
      operator.id, operator.realName,
      'order', 'submit', 'main_order', orderId,
      { status: order.status }, { status: nextStatus },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  calculateTax: (orderId, calculationData, operator) => {
    const order = OrderService.getOrderById(orderId, true);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status !== 'pending_tax_calculation') {
      return { success: false, message: '当前状态不允许计算税额' };
    }

    const details = order.details || db.prepare('SELECT * FROM order_details WHERE main_order_id = ?').all(orderId);
    
    const taxType = TaxRuleEngine.getTaxTypeById(order.tax_type_id);
    const taxRate = calculationData.taxRate || taxType?.tax_rate || 0.13;

    const updateDetail = db.prepare(`
      UPDATE order_details 
      SET tax_rate = ?, tax_amount = ?, status = ?
      WHERE id = ?
    `);

    let totalAmount = 0;
    let totalTaxAmount = 0;

    for (const detail of details) {
      const newTaxRate = detail.tax_rate || taxRate;
      const newTaxAmount = (detail.amount || 0) * newTaxRate;
      
      totalAmount += detail.amount || 0;
      totalTaxAmount += newTaxAmount;

      updateDetail.run(newTaxRate, newTaxAmount, 'calculated', detail.id);
    }

    db.prepare(`
      UPDATE main_orders 
      SET total_amount = ?, total_tax_amount = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(totalAmount, totalTaxAmount, orderId);

    const nextStatus = 'pending_declaration';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'calculate', '完成税额计算', `使用税率 ${taxRate}`
    );

    NotificationService.cancelTodoByOrder(orderId);
    
    const managers = db.prepare(`
      SELECT id FROM users WHERE role = 'enterprise_manager' AND status = 'active'
    `).all();
    
    managers.forEach(m => {
      NotificationService.createTodo(
        m.id, orderId,
        `申报提交待处理：${order.order_no}`,
        `单据 ${order.order_no} 税额计算已完成，等待申报提交`
      );
    });

    AuditService.log(
      operator.id, operator.realName,
      'order', 'calculate', 'main_order', orderId,
      { status: order.status }, 
      { status: nextStatus, totalTaxAmount },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        totalAmount,
        totalTaxAmount,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  submitDeclaration: (orderId, declarationData, operator) => {
    const order = OrderService.getOrderById(orderId, false);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status !== 'pending_declaration') {
      return { success: false, message: '当前状态不允许申报提交' };
    }

    if (order.is_locked) {
      return { success: false, message: '单据已被锁定' };
    }

    db.prepare(`
      UPDATE main_orders 
      SET is_locked = 1, locked_by = ?, locked_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(operator.id, orderId);

    const nextStatus = 'pending_receipt';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'submit_declaration', '提交申报', `申报编号：${declarationData.declarationNo || '系统生成'}`
    );

    NotificationService.cancelTodoByOrder(orderId);
    
    NotificationService.createTodo(
      operator.id, orderId,
      `等待获取回执：${order.order_no}`,
      `单据 ${order.order_no} 已提交申报，等待获取税局回执`
    );

    AuditService.log(
      operator.id, operator.realName,
      'order', 'submit_declaration', 'main_order', orderId,
      { status: order.status, isLocked: false }, 
      { status: nextStatus, isLocked: true },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        isLocked: true,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  getReceipt: (orderId, receiptData, operator) => {
    const order = OrderService.getOrderById(orderId, true);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status !== 'pending_receipt') {
      return { success: false, message: '当前状态不允许获取回执' };
    }

    const receiptId = uuidv4();
    db.prepare(`
      INSERT INTO receipts (
        id, main_order_id, receipt_no, receipt_type, receipt_date,
        status, raw_data, parsed_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      receiptId, orderId,
      receiptData.receiptNo || `RCPT-${Date.now()}`,
      receiptData.receiptType || 'declaration',
      receiptData.receiptDate || new Date().toISOString().split('T')[0],
      'received',
      JSON.stringify(receiptData),
      JSON.stringify({
        orderNo: order.order_no,
        totalAmount: order.total_amount,
        totalTaxAmount: order.total_tax_amount,
        receivedAt: new Date().toISOString()
      })
    );

    db.prepare(`
      UPDATE order_details 
      SET status = 'declared'
      WHERE main_order_id = ?
    `).run(orderId);

    const nextStatus = 'pending_risk_check';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'get_receipt', '获取回执', `回执编号：${receiptData.receiptNo || receiptId}`
    );

    NotificationService.cancelTodoByOrder(orderId);
    
    const managers = db.prepare(`
      SELECT id FROM users WHERE role = 'enterprise_manager' AND status = 'active'
    `).all();
    
    managers.forEach(m => {
      NotificationService.createTodo(
        m.id, orderId,
        `风险检查待处理：${order.order_no}`,
        `单据 ${order.order_no} 已获取回执，等待风险检查`
      );
    });

    AuditService.log(
      operator.id, operator.realName,
      'order', 'get_receipt', 'main_order', orderId,
      { status: order.status }, 
      { status: nextStatus, receiptId },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        receiptId,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  performRiskCheck: (orderId, operator) => {
    return RiskCheckEngine.executeRiskCheck(orderId, operator.id);
  },

  riskCheckAction: (orderId, action, actionData, operator) => {
    const order = OrderService.getOrderById(orderId, false);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    const validActions = ['approve', 'reject', 'request_supplement', 'reassign'];
    if (!validActions.includes(action)) {
      return { success: false, message: '无效的操作类型' };
    }

    if (order.status !== 'pending_risk_check' && order.status !== 'supplement') {
      return { success: false, message: '当前状态不允许执行该操作' };
    }

    if (actionData.comment) {
      db.prepare(`
        INSERT INTO comments (
          id, main_order_id, operator_id, operator_name, comment_type, content
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), orderId, operator.id, operator.realName,
        action, actionData.comment
      );
    }

    let nextStatus;
    let operationType;
    let operationReason;

    switch (action) {
      case 'approve':
        nextStatus = 'completed';
        operationType = 'approve';
        operationReason = `风险检查通过，${actionData.comment || '无审批意见'}`;
        break;
      
      case 'reject':
        nextStatus = 'rejected';
        operationType = 'reject';
        operationReason = `风险检查驳回：${actionData.rejectReason || actionData.comment || '未注明原因'}`;
        break;
      
      case 'request_supplement':
        nextStatus = 'supplement';
        operationType = 'request_supplement';
        operationReason = `需要补充资料：${actionData.supplementItems || actionData.comment || '未指定'}`;
        
        if (actionData.targetUserId) {
          NotificationService.createTodo(
            actionData.targetUserId, orderId,
            `补充资料待处理：${order.order_no}`,
            `单据 ${order.order_no} 需要补充资料：${actionData.supplementItems || actionData.comment}`
          );
        }
        break;
      
      case 'reassign':
        if (!actionData.newResponsiblePersonId) {
          return { success: false, message: '请指定新的责任人' };
        }
        
        db.prepare(`
          UPDATE main_orders 
          SET responsible_person_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(actionData.newResponsiblePersonId, orderId);
        
        NotificationService.cancelTodoByOrder(orderId);
        
        const newResponsible = db.prepare('SELECT * FROM users WHERE id = ?').get(actionData.newResponsiblePersonId);
        if (newResponsible) {
          NotificationService.createTodo(
            newResponsible.id, orderId,
            `单据被转派：${order.order_no}`,
            `您被分配处理单据 ${order.order_no}`
          );
        }
        
        return {
          success: true,
          data: {
            orderId,
            orderNo: order.order_no,
            newResponsiblePersonId: actionData.newResponsiblePersonId,
            newResponsiblePersonName: newResponsible?.real_name
          }
        };
    }

    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      operationType, operationReason, ''
    );

    NotificationService.cancelTodoByOrder(orderId);
    
    if (nextStatus === 'completed') {
      db.prepare(`
        UPDATE main_orders 
        SET actual_complete_time = CURRENT_TIMESTAMP, is_locked = 0
        WHERE id = ?
      `).run(orderId);

      const createdByUser = db.prepare('SELECT * FROM users WHERE id = ?').get(order.created_by);
      if (createdByUser) {
        NotificationService.create(
          createdByUser.id, orderId, 'system',
          `申报完成：${order.order_no}`,
          `您的申报单据 ${order.order_no} 已完成审批`
        );
      }
    }

    AuditService.log(
      operator.id, operator.realName,
      'order', operationType, 'main_order', orderId,
      { status: order.status }, 
      { status: nextStatus, comment: actionData.comment },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus),
        action,
        comment: actionData.comment
      }
    };
  },

  supplementSubmit: (orderId, supplementData, operator) => {
    const order = OrderService.getOrderById(orderId, false);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status !== 'supplement') {
      return { success: false, message: '当前状态不允许提交补充资料' };
    }

    if (supplementData.comment) {
      db.prepare(`
        INSERT INTO comments (
          id, main_order_id, operator_id, operator_name, comment_type, content
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), orderId, operator.id, operator.realName,
        'supplement', supplementData.comment
      );
    }

    const nextStatus = 'pending_tax_calculation';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'supplement_submit', '提交补充资料', supplementData.comment || ''
    );

    NotificationService.cancelTodoByOrder(orderId);

    AuditService.log(
      operator.id, operator.realName,
      'order', 'supplement_submit', 'main_order', orderId,
      { status: order.status }, 
      { status: nextStatus },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  cancelOrder: (orderId, cancelReason, operator) => {
    const order = OrderService.getOrderById(orderId, false);
    if (!order) {
      return { success: false, message: '主单不存在' };
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return { success: false, message: '当前状态不允许撤销' };
    }

    const nextStatus = 'cancelled';
    StatusService.transitionStatus(
      orderId, order.status, nextStatus, operator.id, operator.realName,
      'cancel', `撤销单据：${cancelReason || '未注明原因'}`, ''
    );

    NotificationService.cancelTodoByOrder(orderId);

    AuditService.log(
      operator.id, operator.realName,
      'order', 'cancel', 'main_order', orderId,
      { status: order.status }, 
      { status: nextStatus },
      ''
    );

    return {
      success: true,
      data: {
        orderId,
        orderNo: order.order_no,
        previousStatus: order.status,
        newStatus: nextStatus,
        newStatusDisplay: StatusService.getStatusDisplay(nextStatus)
      }
    };
  },

  getDashboardStats: (userId, userRole) => {
    const baseSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'pending_tax_calculation' THEN 1 ELSE 0 END) as pending_tax_count,
        SUM(CASE WHEN status = 'pending_declaration' THEN 1 ELSE 0 END) as pending_declaration_count,
        SUM(CASE WHEN status = 'pending_receipt' THEN 1 ELSE 0 END) as pending_receipt_count,
        SUM(CASE WHEN status = 'pending_risk_check' THEN 1 ELSE 0 END) as pending_risk_count,
        SUM(CASE WHEN status = 'supplement' THEN 1 ELSE 0 END) as supplement_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(total_amount) as total_amount,
        SUM(total_tax_amount) as total_tax_amount
      FROM main_orders
      WHERE 1=1
    `;

    let statsSql = baseSql;
    let params = [];

    if (userRole === 'finance') {
      statsSql += ' AND created_by = ?';
      params.push(userId);
    } else if (userRole === 'tax_advisor' || userRole === 'enterprise_manager') {
      statsSql += ' AND responsible_person_id = ?';
      params.push(userId);
    }

    const stats = db.prepare(statsSql).get(...params);

    const recentOrders = db.prepare(`
      SELECT mo.*, tt.tax_name, u.real_name as created_by_name
      FROM main_orders mo
      LEFT JOIN tax_types tt ON mo.tax_type_id = tt.id
      LEFT JOIN users u ON mo.created_by = u.id
      ORDER BY mo.created_at DESC
      LIMIT 10
    `).all();

    return {
      summary: {
        total: stats.total || 0,
        draft: stats.draft_count || 0,
        pendingTax: stats.pending_tax_count || 0,
        pendingDeclaration: stats.pending_declaration_count || 0,
        pendingReceipt: stats.pending_receipt_count || 0,
        pendingRisk: stats.pending_risk_count || 0,
        supplement: stats.supplement_count || 0,
        completed: stats.completed_count || 0,
        rejected: stats.rejected_count || 0,
        cancelled: stats.cancelled_count || 0,
        totalAmount: stats.total_amount || 0,
        totalTaxAmount: stats.total_tax_amount || 0
      },
      recentOrders
    };
  },

  getAvailableActions: (orderStatus, userRole) => {
    return StatusService.getAvailableActions(orderStatus, userRole);
  }
};

module.exports = OrderService;
