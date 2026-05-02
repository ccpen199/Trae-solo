const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const WORKFLOW_NODES = {
  CREATE_COLLECTION: 'CREATE_COLLECTION',
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  EXCHANGE_RATE: 'EXCHANGE_RATE',
  COMPLIANCE_AUDIT: 'COMPLIANCE_AUDIT',
  WAITING_SETTLEMENT: 'WAITING_SETTLEMENT',
  SETTLEMENT_COMPLETED: 'SETTLEMENT_COMPLETED',
  EXCEPTION_HANDLE: 'EXCEPTION_HANDLE',
};

const NODE_NAMES = {
  CREATE_COLLECTION: '创建收款',
  WAITING_PAYMENT: '待支付',
  EXCHANGE_RATE: '汇率换算',
  COMPLIANCE_AUDIT: '合规审核',
  WAITING_SETTLEMENT: '待结算',
  SETTLEMENT_COMPLETED: '结算完成',
  EXCEPTION_HANDLE: '异常处理',
};

const TRANSACTION_STATUSES = {
  CREATED: 'CREATED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  EXCHANGE_PROCESSING: 'EXCHANGE_PROCESSING',
  EXCHANGE_COMPLETED: 'EXCHANGE_COMPLETED',
  PENDING_COMPLIANCE: 'PENDING_COMPLIANCE',
  COMPLIANCE_APPROVED: 'COMPLIANCE_APPROVED',
  COMPLIANCE_REJECTED: 'COMPLIANCE_REJECTED',
  PENDING_SETTLEMENT: 'PENDING_SETTLEMENT',
  SETTLEMENT_PROCESSING: 'SETTLEMENT_PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXCEPTION: 'EXCEPTION',
};

const getNow = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

function generateOrderNo() {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CP${date}${random}`;
}

function generateSettlementNo() {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ST${date}${random}`;
}

function createAuditLog(userId, userName, role, module, action, targetType, targetId, oldValue, newValue, req) {
  const log = {
    id: uuidv4(),
    user_id: userId,
    user_name: userName,
    role: role,
    module: module,
    action: action,
    target_type: targetType,
    target_id: targetId,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    ip_address: req?.ip || null,
    user_agent: req?.headers?.['user-agent'] || null,
    created_at: getNow(),
  };
  db.insert('audit_logs', log);
}

function createMessage(userId, transactionId, type, title, content, actionUrl, relatedType, relatedId) {
  const message = {
    id: uuidv4(),
    user_id: userId,
    transaction_id: transactionId,
    type: type,
    title: title,
    content: content,
    is_read: 0,
    action_url: actionUrl,
    related_type: relatedType,
    related_id: relatedId,
    created_at: getNow(),
  };
  db.insert('messages', message);
  return message;
}

function createTodo(userId, transactionId, nodeCode, title, description, priority = 'MEDIUM') {
  const todo = {
    id: uuidv4(),
    user_id: userId,
    transaction_id: transactionId,
    node_code: nodeCode,
    title: title,
    description: description,
    status: 'PENDING',
    priority: priority,
    created_at: getNow(),
  };
  db.insert('todos', todo);
  return todo;
}

function createNodeHistory(transactionId, nodeCode, status, processedBy, processingResult, comment) {
  const node = {
    id: uuidv4(),
    transaction_id: transactionId,
    node_code: nodeCode,
    node_name: NODE_NAMES[nodeCode] || nodeCode,
    status: status,
    entered_at: getNow(),
    processed_by: processedBy,
    processing_result: processingResult,
    comment: comment,
    created_at: getNow(),
  };
  db.insert('transaction_nodes', node);
  return node;
}

function updateNodeHistory(nodeId, exitedAt, nextNode) {
  const data = {
    exited_at: exitedAt || getNow(),
    next_node: nextNode,
  };
  db.update('transaction_nodes', data, 'id = ?', [nodeId]);
}

function findUserByRole(roleCode) {
  const users = db.exec(
    `SELECT u.*, r.code as role_code 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE r.code = ? AND u.status = 1`,
    [roleCode]
  );
  return users.length > 0 ? users[0] : null;
}

function getCurrentExchangeRate(baseCurrency, targetCurrency) {
  const rate = db.get(
    `SELECT * FROM exchange_rates 
     WHERE base_currency = ? AND target_currency = ? 
     AND is_locked = 0 
     AND (valid_to IS NULL OR valid_to > datetime('now'))
     ORDER BY created_at DESC LIMIT 1`,
    [baseCurrency, targetCurrency]
  );
  return rate;
}

function lockRate(transactionId, baseCurrency, targetCurrency, userId) {
  const rate = getCurrentExchangeRate(baseCurrency, targetCurrency);
  if (!rate) {
    throw new Error(`找不到 ${baseCurrency} 到 ${targetCurrency} 的有效汇率`);
  }

  const lockId = uuidv4();
  const lock = {
    id: lockId,
    transaction_id: transactionId,
    base_currency: baseCurrency,
    target_currency: targetCurrency,
    rate: rate.rate,
    locked_at: getNow(),
    expires_at: dayjs().add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    is_used: 0,
  };
  db.insert('rate_locks', lock);
  return lock;
}

function createCollection(data, user, req) {
  const now = getNow();
  const orderNo = generateOrderNo();
  
  db.beginTransaction();
  
  try {
    const merchantId = user.merchant_id || 'merchant_demo';
    
    const existing = db.get(
      'SELECT id FROM payment_transactions WHERE merchant_id = ? AND amount = ? AND currency = ? AND status = ? AND created_at > datetime("now", "-1 hour")',
      [merchantId, data.amount, data.currency, 'CREATED']
    );
    if (existing) {
      db.rollback();
      throw new Error('检测到1小时内有相同金额和币种的创建收款记录，可能是重复提交');
    }

    const transaction = {
      id: uuidv4(),
      order_no: orderNo,
      merchant_id: merchantId,
      buyer_id: data.buyer_id || null,
      buyer_name: data.buyer_name || null,
      buyer_email: data.buyer_email || null,
      payment_institution_id: data.payment_institution_id || null,
      amount: data.amount,
      currency: data.currency,
      target_currency: data.target_currency || 'CNY',
      status: 'CREATED',
      current_node: WORKFLOW_NODES.CREATE_COLLECTION,
      expected_completion_time: data.expected_completion_time || null,
      responsible_user_id: user.id,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      description: data.description || null,
      risk_score: 50,
      is_exception: 0,
      created_at: now,
      updated_at: now,
    };
    db.insert('payment_transactions', transaction);

    createNodeHistory(
      transaction.id,
      WORKFLOW_NODES.CREATE_COLLECTION,
      'COMPLETED',
      user.id,
      'SUCCESS',
      '收款单创建成功'
    );

    if (data.details && Array.isArray(data.details)) {
      data.details.forEach((detail, idx) => {
        const txDetail = {
          id: uuidv4(),
          transaction_id: transaction.id,
          item_no: `ITEM${String(idx + 1).padStart(4, '0')}`,
          item_name: detail.item_name || `项目${idx + 1}`,
          quantity: detail.quantity || 1,
          unit_price: detail.unit_price || detail.amount,
          amount: detail.amount,
          currency: data.currency,
          description: detail.description || null,
          status: 'PENDING',
          created_at: now,
          updated_at: now,
        };
        db.insert('transaction_details', txDetail);
      });
    }

    createAuditLog(
      user.id, user.name, user.role_code,
      'collection', 'create',
      'payment_transactions', transaction.id,
      null, transaction, req
    );

    db.commit();
    return { ...transaction, order_no: orderNo };
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function transitionToPayment(transactionId, user, paymentData, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.CREATE_COLLECTION && 
        transaction.current_node !== WORKFLOW_NODES.EXCEPTION_HANDLE) {
      db.rollback();
      throw new Error('当前状态不允许进入支付流程');
    }

    let rateLock = null;
    if (transaction.currency !== transaction.target_currency) {
      rateLock = lockRate(
        transactionId,
        transaction.currency,
        transaction.target_currency,
        user.id
      );
    }

    const updatedData = {
      status: 'PENDING_PAYMENT',
      current_node: WORKFLOW_NODES.WAITING_PAYMENT,
      exchange_rate: rateLock ? rateLock.rate : 1,
      rate_lock_id: rateLock ? rateLock.id : null,
      updated_at: now,
    };
    db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

    createNodeHistory(
      transactionId,
      WORKFLOW_NODES.WAITING_PAYMENT,
      'IN_PROGRESS',
      user.id,
      null,
      '进入支付环节'
    );

    const paymentUser = findUserByRole('PAYMENT_INSTITUTION') || findUserByRole('ADMIN');
    if (paymentUser) {
      createTodo(
        paymentUser.id,
        transactionId,
        WORKFLOW_NODES.WAITING_PAYMENT,
        `待处理支付 - ${transaction.order_no}`,
        `交易金额: ${transaction.amount} ${transaction.currency}`,
        'HIGH'
      );
      createMessage(
        paymentUser.id,
        transactionId,
        'TODO',
        '新的支付待办',
        `您有一笔新的支付待处理，单号: ${transaction.order_no}`,
        `/payment/${transactionId}`,
        'todos',
        null
      );
    }

    createAuditLog(
      user.id, user.name, user.role_code,
      'payment', 'transition',
      'payment_transactions', transactionId,
      { current_node: transaction.current_node },
      { current_node: WORKFLOW_NODES.WAITING_PAYMENT },
      req
    );

    db.commit();
    return { ...transaction, ...updatedData, rateLock };
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function processPayment(transactionId, user, paymentResult, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.WAITING_PAYMENT) {
      db.rollback();
      throw new Error('当前状态不允许处理支付');
    }

    if (paymentResult.success) {
      const updatedData = {
        status: 'PAYMENT_COMPLETED',
        current_node: WORKFLOW_NODES.EXCHANGE_RATE,
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      const currentNodes = db.exec(
        'SELECT * FROM transaction_nodes WHERE transaction_id = ? AND node_code = ? ORDER BY entered_at DESC LIMIT 1',
        [transactionId, WORKFLOW_NODES.WAITING_PAYMENT]
      );
      if (currentNodes.length > 0) {
        updateNodeHistory(currentNodes[0].id, now, WORKFLOW_NODES.EXCHANGE_RATE);
        db.update(
          'transaction_nodes',
          { status: 'COMPLETED', processing_result: 'SUCCESS', comment: paymentResult.comment || '支付成功' },
          'id = ?',
          [currentNodes[0].id]
        );
      }

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.EXCHANGE_RATE,
        'IN_PROGRESS',
        null,
        null,
        '进入汇率换算环节'
      );

      if (transaction.currency === transaction.target_currency) {
        const sameCurrencyResult = {
          success: true,
          comment: '源币种与目标币种相同，跳过汇率换算',
        };
        setTimeout(() => {
          try {
            processExchange(transactionId, null, sameCurrencyResult, null);
          } catch (e) {
            console.error('自动汇率处理失败:', e);
          }
        }, 1000);
      }

      db.update(
        'todos',
        { status: 'COMPLETED', completed_at: now },
        'transaction_id = ? AND node_code = ?',
        [transactionId, WORKFLOW_NODES.WAITING_PAYMENT]
      );

    } else {
      const updatedData = {
        status: 'EXCEPTION',
        current_node: WORKFLOW_NODES.EXCEPTION_HANDLE,
        is_exception: 1,
        exception_reason: paymentResult.reason || '支付失败',
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.EXCEPTION_HANDLE,
        'IN_PROGRESS',
        null,
        null,
        `支付失败: ${paymentResult.reason || '未知原因'}`
      );

      const exceptionRecord = {
        id: uuidv4(),
        transaction_id: transactionId,
        type: 'PAYMENT_FAILED',
        message: '支付处理失败',
        details: paymentResult.reason,
        status: 'PENDING',
        created_at: now,
      };
      db.insert('exception_records', exceptionRecord);
    }

    createAuditLog(
      user.id, user.name, user.role_code,
      'payment', 'process',
      'payment_transactions', transactionId,
      { status: transaction.status },
      { status: paymentResult.success ? 'PAYMENT_COMPLETED' : 'EXCEPTION' },
      req
    );

    db.commit();
    return db.get('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function processExchange(transactionId, user, exchangeResult, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.EXCHANGE_RATE) {
      db.rollback();
      throw new Error('当前状态不允许处理汇率换算');
    }

    if (exchangeResult.success) {
      const targetAmount = transaction.amount * transaction.exchange_rate;
      
      const feeRate = 0.015;
      const feeAmount = targetAmount * feeRate;
      const netAmount = targetAmount - feeAmount;

      const updatedData = {
        status: 'EXCHANGE_COMPLETED',
        current_node: WORKFLOW_NODES.COMPLIANCE_AUDIT,
        target_amount: targetAmount,
        fee_amount: feeAmount,
        fee_currency: transaction.target_currency,
        net_amount: netAmount,
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      const currentNodes = db.exec(
        'SELECT * FROM transaction_nodes WHERE transaction_id = ? AND node_code = ? ORDER BY entered_at DESC LIMIT 1',
        [transactionId, WORKFLOW_NODES.EXCHANGE_RATE]
      );
      if (currentNodes.length > 0) {
        updateNodeHistory(currentNodes[0].id, now, WORKFLOW_NODES.COMPLIANCE_AUDIT);
        db.update(
          'transaction_nodes',
          { 
            status: 'COMPLETED', 
            processing_result: 'SUCCESS', 
            comment: exchangeResult.comment || `汇率换算完成: ${transaction.amount} ${transaction.currency} = ${targetAmount.toFixed(2)} ${transaction.target_currency}`,
            processed_by: user?.id || null
          },
          'id = ?',
          [currentNodes[0].id]
        );
      }

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.COMPLIANCE_AUDIT,
        'PENDING',
        null,
        null,
        '进入合规审核环节'
      );

      const complianceUser = findUserByRole('COMPLIANCE') || findUserByRole('ADMIN');
      if (complianceUser) {
        createTodo(
          complianceUser.id,
          transactionId,
          WORKFLOW_NODES.COMPLIANCE_AUDIT,
          `待合规审核 - ${transaction.order_no}`,
          `交易金额: ${transaction.amount} ${transaction.currency} -> ${targetAmount.toFixed(2)} ${transaction.target_currency}`,
          'HIGH'
        );
        createMessage(
          complianceUser.id,
          transactionId,
          'TODO',
          '新的合规审核待办',
          `您有一笔新的合规审核待处理，单号: ${transaction.order_no}`,
          `/compliance/${transactionId}`,
          'todos',
          null
        );
      }

      db.update(
        'transaction_details',
        { status: 'EXCHANGED', updated_at: now },
        'transaction_id = ?',
        [transactionId]
      );

    } else {
      const updatedData = {
        status: 'EXCEPTION',
        current_node: WORKFLOW_NODES.EXCEPTION_HANDLE,
        is_exception: 1,
        exception_reason: exchangeResult.reason || '汇率换算失败',
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.EXCEPTION_HANDLE,
        'IN_PROGRESS',
        user?.id || null,
        null,
        `汇率换算失败: ${exchangeResult.reason || '未知原因'}`
      );

      const exceptionRecord = {
        id: uuidv4(),
        transaction_id: transactionId,
        type: 'EXCHANGE_FAILED',
        message: '汇率换算失败',
        details: exchangeResult.reason,
        status: 'PENDING',
        created_at: now,
      };
      db.insert('exception_records', exceptionRecord);
    }

    if (user && req) {
      createAuditLog(
        user.id, user.name, user.role_code,
        'exchange', 'process',
        'payment_transactions', transactionId,
        { status: transaction.status },
        { status: exchangeResult.success ? 'EXCHANGE_COMPLETED' : 'EXCEPTION' },
        req
      );
    }

    db.commit();
    return db.get('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function processCompliance(transactionId, user, action, comment, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.COMPLIANCE_AUDIT) {
      db.rollback();
      throw new Error('当前状态不允许处理合规审核');
    }

    const merchant = db.get('SELECT * FROM merchants WHERE id = ?', [transaction.merchant_id]);
    const kycPassed = merchant && merchant.kyc_status === 'APPROVED';

    let nextNode = null;
    let newStatus = null;
    let processingResult = null;

    switch (action) {
      case 'approve':
        nextNode = WORKFLOW_NODES.WAITING_SETTLEMENT;
        newStatus = 'PENDING_SETTLEMENT';
        processingResult = 'APPROVED';
        break;
      case 'reject':
        nextNode = WORKFLOW_NODES.EXCEPTION_HANDLE;
        newStatus = 'COMPLIANCE_REJECTED';
        processingResult = 'REJECTED';
        break;
      case 'request_more':
        nextNode = WORKFLOW_NODES.EXCEPTION_HANDLE;
        newStatus = 'EXCEPTION';
        processingResult = 'NEED_MORE_INFO';
        break;
      case 'reassign':
        nextNode = WORKFLOW_NODES.COMPLIANCE_AUDIT;
        newStatus = 'PENDING_COMPLIANCE';
        processingResult = 'REASSIGNED';
        break;
      default:
        db.rollback();
        throw new Error('未知的审核动作');
    }

    const updatedData = {
      status: newStatus,
      current_node: nextNode,
      updated_at: now,
    };

    if (action === 'reject' || action === 'request_more') {
      updatedData.is_exception = 1;
      updatedData.exception_reason = `合规审核${action === 'reject' ? '驳回' : '要求补充资料'}: ${comment || '无'}`;
    }

    db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

    const currentNodes = db.exec(
      'SELECT * FROM transaction_nodes WHERE transaction_id = ? AND node_code = ? ORDER BY entered_at DESC LIMIT 1',
      [transactionId, WORKFLOW_NODES.COMPLIANCE_AUDIT]
    );
    if (currentNodes.length > 0) {
      updateNodeHistory(
        currentNodes[0].id, 
        now, 
        action === 'reassign' ? WORKFLOW_NODES.COMPLIANCE_AUDIT : nextNode
      );
      db.update(
        'transaction_nodes',
        { 
          status: 'COMPLETED', 
          processing_result: processingResult, 
          comment: comment,
          processed_by: user.id
        },
        'id = ?',
        [currentNodes[0].id]
      );
    }

    if (action === 'approve') {
      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.WAITING_SETTLEMENT,
        'IN_PROGRESS',
        null,
        null,
        '合规审核通过，进入结算环节'
      );

      const financeUser = findUserByRole('FINANCE') || findUserByRole('BANK') || findUserByRole('ADMIN');
      if (financeUser) {
        createTodo(
          financeUser.id,
          transactionId,
          WORKFLOW_NODES.WAITING_SETTLEMENT,
          `待结算处理 - ${transaction.order_no}`,
          `结算金额: ${transaction.net_amount?.toFixed(2) || transaction.target_amount?.toFixed(2) || transaction.amount} ${transaction.target_currency}`,
          'HIGH'
        );
        createMessage(
          financeUser.id,
          transactionId,
          'TODO',
          '新的结算待办',
          `您有一笔新的结算待处理，单号: ${transaction.order_no}`,
          `/settlement/${transactionId}`,
          'todos',
          null
        );
      }

      db.update(
        'transaction_details',
        { status: 'COMPLIANCE_APPROVED', updated_at: now },
        'transaction_id = ?',
        [transactionId]
      );

    } else if (action === 'reject' || action === 'request_more') {
      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.EXCEPTION_HANDLE,
        'IN_PROGRESS',
        user.id,
        null,
        `合规审核${action === 'reject' ? '驳回' : '要求补充资料'}: ${comment || '无'}`
      );

      const exceptionRecord = {
        id: uuidv4(),
        transaction_id: transactionId,
        type: action === 'reject' ? 'COMPLIANCE_REJECTED' : 'COMPLIANCE_NEED_MORE',
        message: action === 'reject' ? '合规审核驳回' : '需要补充资料',
        details: comment,
        status: 'PENDING',
        created_at: now,
      };
      db.insert('exception_records', exceptionRecord);
    }

    db.update(
      'todos',
      { status: 'COMPLETED', completed_at: now },
      'transaction_id = ? AND node_code = ?',
      [transactionId, WORKFLOW_NODES.COMPLIANCE_AUDIT]
    );

    createAuditLog(
      user.id, user.name, user.role_code,
      'compliance', action,
      'payment_transactions', transactionId,
      { status: transaction.status },
      { status: newStatus, comment },
      req
    );

    db.commit();
    return db.get('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function processSettlement(transactionId, user, settlementData, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.WAITING_SETTLEMENT) {
      db.rollback();
      throw new Error('当前状态不允许处理结算');
    }

    if (settlementData.success) {
      const settlementNo = generateSettlementNo();
      const settlementAmount = transaction.net_amount || transaction.target_amount || transaction.amount;

      const settlement = {
        id: uuidv4(),
        settlement_no: settlementNo,
        merchant_id: transaction.merchant_id,
        transaction_id: transactionId,
        amount: settlementAmount,
        currency: transaction.target_currency,
        bank_account_id: settlementData.bank_account_id || null,
        status: 'COMPLETED',
        expected_settlement_date: dayjs().format('YYYY-MM-DD'),
        actual_settlement_date: dayjs().format('YYYY-MM-DD'),
        fee_amount: transaction.fee_amount || 0,
        net_amount: settlementAmount,
        remark: settlementData.remark || null,
        created_at: now,
        updated_at: now,
      };
      db.insert('settlements', settlement);

      const updatedData = {
        status: 'COMPLETED',
        current_node: WORKFLOW_NODES.SETTLEMENT_COMPLETED,
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      const currentNodes = db.exec(
        'SELECT * FROM transaction_nodes WHERE transaction_id = ? AND node_code = ? ORDER BY entered_at DESC LIMIT 1',
        [transactionId, WORKFLOW_NODES.WAITING_SETTLEMENT]
      );
      if (currentNodes.length > 0) {
        updateNodeHistory(currentNodes[0].id, now, WORKFLOW_NODES.SETTLEMENT_COMPLETED);
        db.update(
          'transaction_nodes',
          { 
            status: 'COMPLETED', 
            processing_result: 'SUCCESS', 
            comment: `结算完成，结算单号: ${settlementNo}`,
            processed_by: user.id
          },
          'id = ?',
          [currentNodes[0].id]
        );
      }

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.SETTLEMENT_COMPLETED,
        'COMPLETED',
        user.id,
        'SUCCESS',
        `结算完成，金额: ${settlementAmount.toFixed(2)} ${transaction.target_currency}`
      );

      db.update(
        'transaction_details',
        { status: 'COMPLETED', updated_at: now },
        'transaction_id = ?',
        [transactionId]
      );

      db.update(
        'todos',
        { status: 'COMPLETED', completed_at: now },
        'transaction_id = ? AND node_code = ?',
        [transactionId, WORKFLOW_NODES.WAITING_SETTLEMENT]
      );

      const merchantUsers = db.exec(
        `SELECT u.id FROM users u 
         WHERE u.merchant_id = ? AND u.status = 1`,
        [transaction.merchant_id]
      );
      merchantUsers.forEach(merchantUser => {
        createMessage(
          merchantUser.id,
          transactionId,
          'NOTIFICATION',
          '结算完成通知',
          `您的交易 ${transaction.order_no} 已完成结算，金额: ${settlementAmount.toFixed(2)} ${transaction.target_currency}`,
          `/transactions/${transactionId}`,
          'transactions',
          transactionId
        );
      });

    } else {
      const updatedData = {
        status: 'EXCEPTION',
        current_node: WORKFLOW_NODES.EXCEPTION_HANDLE,
        is_exception: 1,
        exception_reason: settlementData.reason || '结算失败',
        updated_at: now,
      };
      db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

      createNodeHistory(
        transactionId,
        WORKFLOW_NODES.EXCEPTION_HANDLE,
        'IN_PROGRESS',
        user.id,
        null,
        `结算失败: ${settlementData.reason || '未知原因'}`
      );

      const exceptionRecord = {
        id: uuidv4(),
        transaction_id: transactionId,
        type: 'SETTLEMENT_FAILED',
        message: '结算处理失败',
        details: settlementData.reason,
        status: 'PENDING',
        created_at: now,
      };
      db.insert('exception_records', exceptionRecord);
    }

    createAuditLog(
      user.id, user.name, user.role_code,
      'settlement', 'process',
      'payment_transactions', transactionId,
      { status: transaction.status },
      { status: settlementData.success ? 'COMPLETED' : 'EXCEPTION' },
      req
    );

    db.commit();
    return db.get('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function handleException(transactionId, user, action, resolution, req) {
  const now = getNow();
  
  db.beginTransaction();
  
  try {
    const transaction = db.get(
      'SELECT * FROM payment_transactions WHERE id = ?',
      [transactionId]
    );
    
    if (!transaction) {
      db.rollback();
      throw new Error('交易不存在');
    }

    if (transaction.current_node !== WORKFLOW_NODES.EXCEPTION_HANDLE) {
      db.rollback();
      throw new Error('当前状态不是异常处理状态');
    }

    let targetNode = null;
    let newStatus = null;

    switch (action) {
      case 'retry_payment':
        targetNode = WORKFLOW_NODES.WAITING_PAYMENT;
        newStatus = 'PENDING_PAYMENT';
        break;
      case 'retry_exchange':
        targetNode = WORKFLOW_NODES.EXCHANGE_RATE;
        newStatus = 'EXCHANGE_PROCESSING';
        break;
      case 'retry_compliance':
        targetNode = WORKFLOW_NODES.COMPLIANCE_AUDIT;
        newStatus = 'PENDING_COMPLIANCE';
        break;
      case 'retry_settlement':
        targetNode = WORKFLOW_NODES.WAITING_SETTLEMENT;
        newStatus = 'PENDING_SETTLEMENT';
        break;
      case 'cancel':
        targetNode = null;
        newStatus = 'CANCELLED';
        break;
      default:
        db.rollback();
        throw new Error('未知的异常处理动作');
    }

    const updatedData = {
      status: newStatus,
      current_node: targetNode || WORKFLOW_NODES.SETTLEMENT_COMPLETED,
      is_exception: action === 'cancel' ? 1 : 0,
      updated_at: now,
    };
    if (action === 'cancel') {
      updatedData.current_node = 'SETTLEMENT_COMPLETED';
    }
    db.update('payment_transactions', updatedData, 'id = ?', [transactionId]);

    const currentNodes = db.exec(
      'SELECT * FROM transaction_nodes WHERE transaction_id = ? AND node_code = ? ORDER BY entered_at DESC LIMIT 1',
      [transactionId, WORKFLOW_NODES.EXCEPTION_HANDLE]
    );
    if (currentNodes.length > 0) {
      updateNodeHistory(currentNodes[0].id, now, targetNode);
      db.update(
        'transaction_nodes',
        { 
          status: 'COMPLETED', 
          processing_result: action, 
          comment: resolution,
          processed_by: user.id
        },
        'id = ?',
        [currentNodes[0].id]
      );
    }

    if (targetNode && action !== 'cancel') {
      createNodeHistory(
        transactionId,
        targetNode,
        'IN_PROGRESS',
        null,
        null,
        `异常处理完成，返回 ${NODE_NAMES[targetNode]} 环节`
      );
    }

    db.update(
      'exception_records',
      { 
        status: 'RESOLVED', 
        resolved_at: now, 
        resolved_by: user.id,
        resolution: resolution 
      },
      'transaction_id = ? AND status = ?',
      [transactionId, 'PENDING']
    );

    createAuditLog(
      user.id, user.name, user.role_code,
      'exception', action,
      'payment_transactions', transactionId,
      { status: transaction.status },
      { status: newStatus, resolution },
      req
    );

    db.commit();
    return db.get('SELECT * FROM payment_transactions WHERE id = ?', [transactionId]);
    
  } catch (err) {
    db.rollback();
    throw err;
  }
}

function getTransactionDetail(transactionId) {
  const transaction = db.get(
    `SELECT pt.*, 
            m.name as merchant_name,
            pi.name as payment_institution_name,
            u.name as responsible_user_name
     FROM payment_transactions pt
     LEFT JOIN merchants m ON pt.merchant_id = m.id
     LEFT JOIN payment_institutions pi ON pt.payment_institution_id = pi.id
     LEFT JOIN users u ON pt.responsible_user_id = u.id
     WHERE pt.id = ?`,
    [transactionId]
  );

  if (!transaction) return null;

  const details = db.exec(
    'SELECT * FROM transaction_details WHERE transaction_id = ? ORDER BY item_no',
    [transactionId]
  );

  const nodes = db.exec(
    `SELECT tn.*, u.name as processed_by_name
     FROM transaction_nodes tn
     LEFT JOIN users u ON tn.processed_by = u.id
     WHERE tn.transaction_id = ?
     ORDER BY tn.entered_at`,
    [transactionId]
  );

  const auditLogs = db.exec(
    'SELECT * FROM audit_logs WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC LIMIT 50',
    ['payment_transactions', transactionId]
  );

  const messages = db.exec(
    'SELECT * FROM messages WHERE transaction_id = ? ORDER BY created_at DESC',
    [transactionId]
  );

  const exceptions = db.exec(
    'SELECT * FROM exception_records WHERE transaction_id = ? ORDER BY detected_at DESC',
    [transactionId]
  );

  return {
    ...transaction,
    details,
    nodes,
    auditLogs,
    messages,
    exceptions,
  };
}

module.exports = {
  WORKFLOW_NODES,
  NODE_NAMES,
  TRANSACTION_STATUSES,
  generateOrderNo,
  generateSettlementNo,
  createCollection,
  transitionToPayment,
  processPayment,
  processExchange,
  processCompliance,
  processSettlement,
  handleException,
  getTransactionDetail,
  createAuditLog,
  createMessage,
  createTodo,
  getCurrentExchangeRate,
  lockRate,
  findUserByRole,
  getNow,
};
